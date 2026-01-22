from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from mdcx.config.manager import manager
from mdcx.config.models import Config
from mdcx.config.v1 import ConfigV1
from mdcx.consts import LOCAL_VERSION

from .utils import check_path_access

router = APIRouter(prefix="/config", tags=["配置管理"])


class VersionResponse(BaseModel):
    version: str = Field(description="版本号")
    version_code: int = Field(description="版本号数值")


@router.get("/version", operation_id="getVersion", summary="获取版本信息")
async def get_version() -> VersionResponse:
    """获取应用版本信息"""
    # LOCAL_VERSION 格式如 220250909，转换为 2.20250909 格式
    version_str = str(LOCAL_VERSION)
    # 格式化为 "vX.YYYYMMDD"
    formatted_version = f"v{version_str[0]}.{version_str[1:]}"
    return VersionResponse(version=formatted_version, version_code=LOCAL_VERSION)


class ConfigFileInfo(BaseModel):
    name: str = Field(description="配置文件名 (不含扩展名)")
    filename: str = Field(description="完整文件名 (含扩展名)")
    is_active: bool = Field(description="是否为当前激活的配置文件")


class ConfigListResponse(BaseModel):
    configs: list[ConfigFileInfo] = Field(description="配置文件列表")
    active: str = Field(description="当前激活的配置文件名 (不含扩展名)")


@router.get("/list", operation_id="listConfigs", summary="获取配置文件列表")
async def list_configs() -> ConfigListResponse:
    """列出所有可用的配置文件"""
    files = manager.list_configs()
    active_file = manager.file
    configs = []
    for f in files:
        # 移除扩展名得到名称
        name = f.rsplit(".", 1)[0] if "." in f else f
        configs.append(
            ConfigFileInfo(
                name=name,
                filename=f,
                is_active=(f == active_file),
            )
        )
    # 按名称排序，但激活的排在第一位
    configs.sort(key=lambda x: (not x.is_active, x.name))
    active_name = active_file.rsplit(".", 1)[0] if "." in active_file else active_file
    return ConfigListResponse(configs=configs, active=active_name)


@router.get("/", operation_id="getCurrentConfig", summary="获取当前配置")
async def get_config() -> Config:
    manager.load()
    return manager.config


@router.put("/", operation_id="updateConfig", summary="更新配置")
async def update_config(new_config: Config) -> Config:
    manager.config = new_config
    manager.save()
    return manager.config


@router.delete("/", operation_id="deleteConfig", summary="删除配置文件")
async def delete_config(name: Annotated[str, Query(description="待删除的配置文件名 (不含扩展名)")]):
    if f"{name}.json" == manager.file:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="无法删除当前激活的配置文件.")
    p = Path(manager.data_folder) / f"{name}.json"
    check_path_access(p, manager.data_folder)
    p.unlink(True)


@router.post("/reset", operation_id="resetConfig", summary="重置配置")
async def reset_config() -> Config:
    """将当前配置重置为默认值"""
    manager.reset()
    manager.load()
    return manager.config


@router.post("/create", operation_id="createConfig", summary="创建配置文件")
async def create_config(name: Annotated[str, Query(description="配置文件名 (不含扩展名)")]):
    """创建指定名称的配置文件"""
    p = Path(manager.data_folder) / f"{name}.json"
    check_path_access(p, manager.data_folder)
    if p.exists():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"名称为 {name} 的配置文件已存在.")
    p.write_text(ConfigV1().format_ini(), encoding="UTF-8")


class ConfigSwitchResponse(BaseModel):
    config: Config
    errors: list[str] = Field(description="加载配置时发生的错误信息列表")


@router.post("/switch", operation_id="switchConfig", summary="切换配置")
async def switch_config(
    name: Annotated[str, Query(description="待切换的配置文件名 (不含扩展名)")],
) -> ConfigSwitchResponse:
    """
    切换到现有的配置文件。
    """
    new_path = Path(manager.data_folder) / f"{name}.json"
    check_path_access(new_path, manager.data_folder)
    if not new_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"配置文件 {name}.json 不存在.")
    new_path = str(new_path.resolve())
    manager.path = new_path
    errors = manager.load()
    return ConfigSwitchResponse(config=manager.config, errors=errors)


@router.get("/schema", response_model=dict, operation_id="getConfigSchema", summary="获取配置架构")
async def get_config_schema():
    """返回配置的JSON架构。"""
    return Config.json_schema()


@router.get("/ui_schema", response_model=dict, operation_id="getConfigUISchema", summary="获取UI架构")
async def get_ui_schema():
    """返回配置的UI架构。"""
    return Config.ui_schema()


@router.get("/default", operation_id="getDefaultConfig", summary="获取默认配置")
async def get_default_config() -> Config:
    """
    返回默认配置。
    """
    return Config()
