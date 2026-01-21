"""
刮削控制 API
提供刮削任务的启动、停止和状态查询功能
"""

from enum import Enum
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from mdcx.config.extend import deal_url
from mdcx.config.manager import manager
from mdcx.core.scraper import start_new_scrape
from mdcx.models.enums import FileMode
from mdcx.models.flags import Flags
from mdcx.server.config import SAFE_DIRS

from .utils import check_path_access

router = APIRouter(prefix="/scrape", tags=["Scrape"])


class ScrapeStatus(str, Enum):
    """刮削状态枚举"""

    IDLE = "idle"
    SCRAPING = "scraping"
    STOPPING = "stopping"


class ScrapeStatusResponse(BaseModel):
    """刮削状态响应"""

    status: ScrapeStatus = Field(description="当前刮削状态")
    current: int = Field(description="当前已处理数量")
    total: int = Field(description="总数量")
    success: int = Field(description="成功数量")
    failed: int = Field(description="失败数量")
    progress: int = Field(description="进度百分比 (0-100)")


class ScrapeResultItem(BaseModel):
    """刮削结果项"""

    path: str = Field(description="文件路径")
    number: str | None = Field(default=None, description="番号")
    error: str | None = Field(default=None, description="错误信息")


class ScrapeResultsResponse(BaseModel):
    """刮削结果响应"""

    success: list[ScrapeResultItem] = Field(default_factory=list, description="成功列表")
    failed: list[ScrapeResultItem] = Field(default_factory=list, description="失败列表")


class StartScrapeRequest(BaseModel):
    """启动刮削请求"""

    mode: Literal["default", "single"] = Field(default="default", description="刮削模式")
    path: str | None = Field(default=None, description="单文件刮削时的文件路径")
    url: str | None = Field(default=None, description="单文件刮削时的指定 URL")


class StartScrapeResponse(BaseModel):
    """启动刮削响应"""

    message: str
    status: ScrapeStatus


# 全局状态追踪
_scrape_status = ScrapeStatus.IDLE
_is_stopping = False


def _get_current_status() -> ScrapeStatus:
    """获取当前刮削状态"""
    global _scrape_status, _is_stopping

    if _is_stopping:
        return ScrapeStatus.STOPPING

    # 检查是否有活跃的刮削任务
    if Flags.total_count > 0 and Flags.scrape_done < Flags.total_count:
        return ScrapeStatus.SCRAPING

    return ScrapeStatus.IDLE


@router.post("/start", summary="开始刮削", operation_id="startScrape", response_model=StartScrapeResponse)
async def start_scrape(body: StartScrapeRequest | None = None):
    """
    启动刮削任务

    - default 模式: 刮削配置的媒体目录
    - single 模式: 刮削单个文件，需要提供 path 和可选的 url
    """
    global _scrape_status

    if _get_current_status() == ScrapeStatus.SCRAPING:
        raise HTTPException(status_code=409, detail="刮削任务正在进行中")

    try:
        errors = manager.load()
        if errors:
            raise HTTPException(status_code=500, detail=f"配置错误: {', '.join(errors)}")

        if body and body.mode == "single":
            if not body.path:
                raise HTTPException(status_code=400, detail="单文件刮削需要提供文件路径")

            p = Path(body.path)
            check_path_access(p, *SAFE_DIRS)
            Flags.single_file_path = p

            if body.url:
                website, url = deal_url(body.url)
                if not website:
                    raise HTTPException(status_code=400, detail="不支持的 URL")
                Flags.appoint_url = body.url
                Flags.website_name = website

            start_new_scrape(FileMode.Single)
        else:
            start_new_scrape(FileMode.Default)

        _scrape_status = ScrapeStatus.SCRAPING
        return StartScrapeResponse(message="刮削任务已启动", status=ScrapeStatus.SCRAPING)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stop", summary="停止刮削", operation_id="stopScrape")
async def stop_scrape():
    """
    停止当前刮削任务

    注意: 停止操作是异步的，可能需要等待正在进行的任务完成
    """
    global _is_stopping, _scrape_status

    current_status = _get_current_status()
    if current_status == ScrapeStatus.IDLE:
        return {"message": "没有正在进行的刮削任务", "status": ScrapeStatus.IDLE}

    if current_status == ScrapeStatus.STOPPING:
        return {"message": "刮削任务正在停止中", "status": ScrapeStatus.STOPPING}

    try:
        _is_stopping = True
        # 设置停止标志
        Flags.stop_other = True
        Flags.rest_time_convert = 0

        return {"message": "刮削停止请求已发送", "status": ScrapeStatus.STOPPING}
    except Exception as e:
        _is_stopping = False
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status", summary="获取刮削状态", operation_id="getScrapeStatus", response_model=ScrapeStatusResponse)
async def get_scrape_status():
    """获取当前刮削任务的状态和进度"""
    global _is_stopping, _scrape_status

    status = _get_current_status()

    # 如果刮削完成，重置停止标志
    if status == ScrapeStatus.IDLE:
        _is_stopping = False
        _scrape_status = ScrapeStatus.IDLE

    total = Flags.total_count or 0
    current = Flags.scrape_done or 0
    progress = int((current / total * 100)) if total > 0 else 0

    return ScrapeStatusResponse(
        status=status,
        current=current,
        total=total,
        success=Flags.succ_count or 0,
        failed=Flags.fail_count or 0,
        progress=progress,
    )


@router.get("/results", summary="获取刮削结果", operation_id="getScrapeResults", response_model=ScrapeResultsResponse)
async def get_scrape_results():
    """获取刮削结果列表（成功和失败）"""
    success_list = []
    failed_list = []

    # 成功列表
    for path in Flags.success_list:
        success_list.append(ScrapeResultItem(path=str(path)))

    # 失败列表
    for path, error in Flags.failed_list:
        failed_list.append(ScrapeResultItem(path=str(path), error=error))

    return ScrapeResultsResponse(success=success_list, failed=failed_list)
