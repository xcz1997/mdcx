"""
工具功能 API
"""

from asyncio import create_task
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from mdcx.base.file import check_and_clean_files, move_videos_to_folder
from mdcx.base.image import add_del_extrafanart_copy
from mdcx.base.video import add_del_extras, add_del_theme_videos
from mdcx.config.manager import manager
from mdcx.tools.emby_actor_info import creat_kodi_actors, show_emby_actor_list
from mdcx.tools.emby_actor_image import update_emby_actor_photo
from mdcx.tools.missing import check_missing_number

router = APIRouter(prefix="/tools", tags=["Tools"])


class FindMissingBody(BaseModel):
    actors: str = Field(description="要查询的演员名字，多个用逗号分隔，也支持演员的 JAVDB 主页地址")
    local_library: list[str] = Field(default=[], description="本地媒体库路径，留空则使用配置中的路径")


@router.post("/find-missing", summary="查找缺失番号", operation_id="findMissing")
async def find_missing(body: FindMissingBody):
    """根据演员名字查找本地缺失的番号，结果通过 WebSocket 日志返回"""
    # 更新配置中的演员名
    manager.config.actors_name = body.actors
    if body.local_library:
        manager.config.local_library = body.local_library
    create_task(check_missing_number(actor_flag=True))
    return {"message": "Missing number check started. Check logs for results."}


class MoveVideosBody(BaseModel):
    exclude_dirs: list[str] = Field(default=[], description="排除的目录列表")


@router.post("/move-videos", summary="移动视频和字幕", operation_id="moveVideos")
async def move_videos(body: MoveVideosBody):
    """移动视频和字幕文件到 Movie_moved 目录，结果通过 WebSocket 日志返回"""
    create_task(move_videos_to_folder(exclude_dirs=body.exclude_dirs))
    return {"message": "Move videos task started. Check logs for results."}


@router.post("/clean-files", summary="检查并清理文件", operation_id="cleanFiles")
async def clean_files():
    """根据配置的清理规则检查并清理文件，结果通过 WebSocket 日志返回"""
    create_task(check_and_clean_files())
    return {"message": "File cleaning started. Check logs for results."}


class ExtrasBody(BaseModel):
    mode: Literal["add", "del"] = Field(description="操作模式: add=添加, del=删除")


@router.post("/extras", summary="管理 extras 附加内容", operation_id="manageExtras")
async def manage_extras(body: ExtrasBody):
    """添加或删除 extrafanart extras (behind the scenes 文件夹)，结果通过 WebSocket 日志返回"""
    create_task(add_del_extras(body.mode))
    return {"message": f"Extras {body.mode} operation started. Check logs for results."}


@router.post("/extrafanart-copy", summary="管理剧照副本", operation_id="manageExtrafanartCopy")
async def manage_extrafanart_copy(body: ExtrasBody):
    """添加或删除剧照副本，结果通过 WebSocket 日志返回"""
    create_task(add_del_extrafanart_copy(body.mode))
    return {"message": f"Extrafanart copy {body.mode} operation started. Check logs for results."}


@router.post("/theme-videos", summary="管理主题视频", operation_id="manageThemeVideos")
async def manage_theme_videos(body: ExtrasBody):
    """添加或删除主题视频，结果通过 WebSocket 日志返回"""
    create_task(add_del_theme_videos(body.mode))
    return {"message": f"Theme videos {body.mode} operation started. Check logs for results."}


class KodiActorsBody(BaseModel):
    mode: Literal["add", "del"] = Field(description="操作模式: add=添加演员照片, del=删除演员文件夹")


@router.post("/kodi-actors", summary="管理 Kodi/Plex 演员照片", operation_id="manageKodiActors")
async def manage_kodi_actors(body: KodiActorsBody):
    """
    添加或删除 Kodi/Plex/Jvedio 演员照片。
    - add: 为待刮削目录中的每个视频创建 .actors 文件夹，并补全演员图片
    - del: 清除目录下的所有 .actors 文件夹
    结果通过 WebSocket 日志返回。
    """
    create_task(creat_kodi_actors(body.mode == "add"))
    action = "添加" if body.mode == "add" else "删除"
    return {"message": f"Kodi 演员照片{action}任务已启动，请查看日志获取结果。"}


class ActorListBody(BaseModel):
    filter_mode: int = Field(
        default=0,
        ge=0,
        le=7,
        description="过滤模式: 0=所有演员, 1=有头像有信息, 2=没头像有信息, 3=有头像没信息, 4=没头像没信息, 5=有信息, 6=没信息, 7=有头像",
    )


@router.post("/actor-list", summary="查看媒体服务器演员列表", operation_id="showActorList")
async def show_actor_list(body: ActorListBody):
    """
    查看 Emby/Jellyfin 中的演员列表，支持多种过滤模式。
    结果通过 WebSocket 日志返回。
    """
    create_task(show_emby_actor_list(body.filter_mode))
    return {"message": "演员列表查询任务已启动，请查看日志获取结果。"}


@router.post("/actor-photos", summary="补全演员照片", operation_id="updateActorPhotos")
async def update_actor_photos():
    """
    从 Gfriends 网络头像库或本地头像库补全 Emby/Jellyfin 演员头像。
    结果通过 WebSocket 日志返回。
    """
    create_task(update_emby_actor_photo())
    return {"message": "演员照片补全任务已启动，请查看日志获取结果。"}
