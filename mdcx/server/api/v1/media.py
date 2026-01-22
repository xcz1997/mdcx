"""
媒体信息 API
提供媒体详情查询和刮削结果列表功能
"""

from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from mdcx.models.flags import Flags

router = APIRouter(prefix="/media", tags=["Media"])


class MediaDetailResponse(BaseModel):
    """媒体详情响应"""

    number: str = Field(description="番号")
    title: str = Field(description="标题")
    actors: list[str] = Field(default_factory=list, description="演员列表")
    release: str = Field(default="", description="发行日期")
    runtime: str = Field(default="", description="片长")
    outline: str = Field(default="", description="简介")
    tags: list[str] = Field(default_factory=list, description="标签列表")
    director: str = Field(default="", description="导演")
    studio: str = Field(default="", description="制作商")
    series: str = Field(default="", description="系列")
    publisher: str = Field(default="", description="发行商")
    source: str = Field(default="", description="数据来源")
    poster_url: str | None = Field(default=None, description="海报 URL")
    thumb_url: str | None = Field(default=None, description="缩略图 URL")
    file_path: str | None = Field(default=None, description="文件路径")
    mosaic: str = Field(default="", description="马赛克类型")
    score: str = Field(default="", description="评分")
    year: str = Field(default="", description="年份")


class MediaResultItem(BaseModel):
    """媒体结果项"""

    number: str = Field(description="番号")
    title: str = Field(default="", description="标题")
    path: str = Field(description="文件路径")
    status: str = Field(description="状态: success 或 failed")
    error: str | None = Field(default=None, description="错误信息（失败时）")
    actors: list[str] = Field(default_factory=list, description="演员列表")
    poster_url: str | None = Field(default=None, description="海报 URL")


class MediaResultsResponse(BaseModel):
    """媒体结果列表响应"""

    total: int = Field(description="总数")
    success_count: int = Field(description="成功数量")
    failed_count: int = Field(description="失败数量")
    items: list[MediaResultItem] = Field(default_factory=list, description="结果列表")


def _get_image_url(path: Path | None) -> str | None:
    """将图片路径转换为 API URL"""
    if path and path.exists():
        return f"/api/v1/images/preview?path={path}"
    return None


# 注意：静态路径必须在动态路径之前定义，否则会被 /{number} 捕获


@router.get(
    "/",
    summary="列出所有已刮削的媒体",
    operation_id="listMedia",
    response_model=list[MediaDetailResponse],
)
async def list_media():
    """
    列出当前会话中所有已成功刮削的媒体信息
    """
    results = []
    for number, scrape_result in Flags.json_data_dic.items():
        data = scrape_result.data
        file_info = scrape_result.file_info
        other = scrape_result.other

        results.append(
            MediaDetailResponse(
                number=data.number,
                title=data.title,
                actors=data.actors,
                release=data.release,
                runtime=data.runtime,
                outline=data.outline,
                tags=data.tags,
                director=data.director,
                studio=data.studio,
                series=data.series,
                publisher=data.publisher,
                source=data.site_log if hasattr(data, "site_log") else "",
                poster_url=_get_image_url(other.poster_path),
                thumb_url=_get_image_url(other.thumb_path),
                file_path=str(file_info.file_path) if file_info.file_path else None,
                mosaic=data.mosaic,
                score=data.score,
                year=data.year,
            )
        )
    return results


@router.get(
    "/results",
    summary="获取刮削结果列表",
    operation_id="getMediaResults",
    response_model=MediaResultsResponse,
)
async def get_media_results():
    """
    获取当前刮削会话的所有结果列表

    包括成功和失败的刮削结果。可用于页面刷新后恢复结果列表。
    """
    items: list[MediaResultItem] = []

    # 添加成功的结果
    for number, scrape_result in Flags.json_data_dic.items():
        data = scrape_result.data
        file_info = scrape_result.file_info
        other = scrape_result.other

        items.append(
            MediaResultItem(
                number=number,
                title=data.title,
                path=str(file_info.file_path) if file_info.file_path else "",
                status="success",
                actors=data.actors,
                poster_url=_get_image_url(other.poster_path),
            )
        )

    # 添加失败的结果
    for path, error in Flags.failed_list:
        # 尝试从路径中提取番号（简单处理）
        file_name = path.stem if isinstance(path, Path) else Path(path).stem
        items.append(
            MediaResultItem(
                number=file_name,
                title="",
                path=str(path),
                status="failed",
                error=error,
            )
        )

    return MediaResultsResponse(
        total=len(items),
        success_count=len(Flags.json_data_dic),
        failed_count=len(Flags.failed_list),
        items=items,
    )


@router.get(
    "/detail/{number}",
    summary="获取媒体详情",
    operation_id="getMediaDetail",
    response_model=MediaDetailResponse,
)
async def get_media_detail(number: str):
    """
    根据番号获取媒体详情

    返回刮削过程中获取的媒体信息，包括标题、演员、标签等。
    """
    scrape_result = Flags.json_data_dic.get(number)
    if not scrape_result:
        raise HTTPException(status_code=404, detail=f"未找到番号 {number} 的媒体信息")

    data = scrape_result.data
    file_info = scrape_result.file_info
    other = scrape_result.other

    return MediaDetailResponse(
        number=data.number,
        title=data.title,
        actors=data.actors,
        release=data.release,
        runtime=data.runtime,
        outline=data.outline,
        tags=data.tags,
        director=data.director,
        studio=data.studio,
        series=data.series,
        publisher=data.publisher,
        source=data.site_log if hasattr(data, "site_log") else "",
        poster_url=_get_image_url(other.poster_path),
        thumb_url=_get_image_url(other.thumb_path),
        file_path=str(file_info.file_path) if file_info.file_path else None,
        mosaic=data.mosaic,
        score=data.score,
        year=data.year,
    )
