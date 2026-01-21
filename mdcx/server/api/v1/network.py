"""
网络检测 API
提供网络连通性检测和代理状态查询功能
"""

import asyncio
import re
import time
from enum import Enum

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from mdcx.config.manager import manager
from mdcx.config.models import Website
from mdcx.base.web import ping_host
from mdcx.base.web_sync import get_text_sync

router = APIRouter(prefix="/network", tags=["Network"])


class SiteStatus(str, Enum):
    """网站状态"""

    OK = "ok"
    ERROR = "error"
    CHECKING = "checking"


class SiteCheckResult(BaseModel):
    """单个网站检测结果"""

    name: str = Field(description="网站名称")
    url: str = Field(description="网站 URL")
    status: SiteStatus = Field(description="连接状态")
    message: str = Field(default="", description="状态消息")
    latency: int | None = Field(default=None, description="延迟(ms)")


class ProxyStatus(BaseModel):
    """代理状态"""

    enabled: bool = Field(description="是否启用代理")
    type: str | None = Field(default=None, description="代理类型")
    host: str | None = Field(default=None, description="代理主机")
    port: int | None = Field(default=None, description="代理端口")
    status: SiteStatus = Field(default=SiteStatus.OK, description="代理状态")


class NetworkCheckResponse(BaseModel):
    """网络检测响应"""

    proxy: ProxyStatus = Field(description="代理状态")
    sites: list[SiteCheckResult] = Field(default_factory=list, description="各网站检测结果")
    elapsed: float = Field(description="检测用时(秒)")


class NetworkCheckRequest(BaseModel):
    """网络检测请求"""

    sites: list[str] | None = Field(default=None, description="要检测的网站列表，为空则检测所有")
    include_proxy: bool = Field(default=True, description="是否检测代理")


# 网站检测配置
SITE_URLS = {
    "javdb": "https://javdb.com",
    "javbus": "https://www.javbus.com",
    "jav321": "https://www.jav321.com",
    "javlibrary": "https://www.javlibrary.com",
    "dmm": "https://www.dmm.co.jp",
    "mgstage": "https://www.mgstage.com",
    "theporndb": "https://api.theporndb.net",
    "fc2": "https://adult.contents.fc2.com",
    "airav": "https://www.airav.wiki",
    "avsox": "https://avsox.click",
    "xcity": "https://xcity.jp",
}


def _check_site(name: str, url: str) -> SiteCheckResult:
    """检测单个网站"""
    host_address = url.replace("https://", "").replace("http://", "").split("/")[0]

    try:
        # 特殊处理某些网站
        if name == "theporndb":
            # 检查是否配置了 API token
            token = manager.config.theporndb_api_token
            if not token:
                return SiteCheckResult(name=name, url=url, status=SiteStatus.ERROR, message="未配置 API Token")
            latency = ping_host(host_address)
            latency_ms = int(float(latency.strip("()ms")) * 1000) if latency else None
            return SiteCheckResult(name=name, url=url, status=SiteStatus.OK, message="Token 已配置", latency=latency_ms)

        # 普通网站检测
        use_proxy = True
        if name == "javlibrary":
            custom_url = manager.config.get_site_url(Website.JAVLIBRARY)
            if custom_url:
                url = str(custom_url)
                use_proxy = False

        html_content, error = get_text_sync(url, use_proxy=use_proxy)

        if html_content is None:
            return SiteCheckResult(name=name, url=url, status=SiteStatus.ERROR, message=f"连接失败: {error}")

        # 检查 Cloudflare 拦截
        if "Cloudflare" in html_content:
            return SiteCheckResult(name=name, url=url, status=SiteStatus.ERROR, message="被 Cloudflare 拦截")

        # 检查地域限制
        if name == "dmm" and re.findall("このページはお住まいの地域からご利用になれません", html_content):
            return SiteCheckResult(name=name, url=url, status=SiteStatus.ERROR, message="地域限制，请使用日本节点")

        if name == "mgstage" and not html_content.strip():
            return SiteCheckResult(name=name, url=url, status=SiteStatus.ERROR, message="地域限制，请使用日本节点")

        # 连接成功，获取延迟
        latency_str = ping_host(host_address)
        latency_ms = None
        if latency_str:
            try:
                latency_ms = int(float(latency_str.strip("()ms").replace("ms", "")) * 1000)
            except (ValueError, AttributeError):
                pass

        return SiteCheckResult(name=name, url=url, status=SiteStatus.OK, message="连接正常", latency=latency_ms)

    except Exception as e:
        return SiteCheckResult(name=name, url=url, status=SiteStatus.ERROR, message=str(e))


def _get_proxy_status() -> ProxyStatus:
    """获取代理状态"""
    try:
        proxy_type = manager.config.proxy_type
        proxy_host = manager.config.proxy_host
        proxy_port = manager.config.proxy_port
        use_proxy = manager.config.use_proxy

        if not use_proxy:
            return ProxyStatus(enabled=False)

        return ProxyStatus(
            enabled=True,
            type=proxy_type,
            host=proxy_host,
            port=proxy_port,
            status=SiteStatus.OK,
        )
    except Exception:
        return ProxyStatus(enabled=False)


@router.post("/check", summary="网络连通性检测", operation_id="checkNetwork", response_model=NetworkCheckResponse)
async def check_network(body: NetworkCheckRequest | None = None):
    """
    检测网络连通性

    可以指定要检测的网站列表，或检测所有预设网站
    """
    start_time = time.time()

    try:
        # 获取代理状态
        proxy_status = _get_proxy_status() if (body is None or body.include_proxy) else ProxyStatus(enabled=False)

        # 确定要检测的网站
        sites_to_check = SITE_URLS.copy()
        if body and body.sites:
            sites_to_check = {k: v for k, v in SITE_URLS.items() if k in body.sites}

        # 应用自定义 URL
        for website in Website:
            if custom_url := manager.config.get_site_url(website):
                if website.value in sites_to_check:
                    sites_to_check[website.value] = str(custom_url)

        # 并发检测所有网站
        results = []
        for name, url in sites_to_check.items():
            result = _check_site(name, url)
            results.append(result)

        elapsed = round(time.time() - start_time, 2)

        return NetworkCheckResponse(proxy=proxy_status, sites=results, elapsed=elapsed)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/proxy", summary="获取代理状态", operation_id="getProxyStatus", response_model=ProxyStatus)
async def get_proxy_status():
    """获取当前代理配置状态"""
    try:
        return _get_proxy_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
