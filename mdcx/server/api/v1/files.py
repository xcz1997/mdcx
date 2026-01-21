import os
from datetime import datetime
from pathlib import Path
from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from ...config import SAFE_DIRS
from mdcx.utils.file import open_file_thread
from .utils import check_path_access

router = APIRouter(prefix="/files", tags=["文件管理"])


class FileItem(BaseModel):
    """Represents a file or directory item."""

    name: str = Field(..., description="The name of the file or directory.")
    path: str = Field(..., description="The absolute path of the file or directory.")
    type: Literal["file", "directory"] = Field(..., description="The type of the item. 'file' or 'directory'.")
    size: int | None = Field(default=None, description="The size of the file in bytes. Omitted for directories.")
    last_modified: datetime | None = None


class FileListResponse(BaseModel):
    """The response structure for the file list endpoint."""

    items: list[FileItem] = Field(
        ..., description="指定路径下的文件和目录列表. 先目录后文件, 均按名称排序且不区分大小写."
    )
    total: int = Field(..., description="路径下的文件和目录总数. 若大于 len(data) 说明 data 因文件过多被截断.")


@router.get("/list", operation_id="listFiles", summary="列出文件和目录")
async def list_files(
    path: Annotated[str, Query(description="服务器路径. 相对路径将基于 SAFE_DIRS 中的首个路径解析.")],
) -> FileListResponse:
    """
    列出指定路径下的文件和目录. 仅允许访问 `SAFE_DIRS` 目录下的内容, `SAFE_DIRS` 可通过服务器环境变量 `MDCX_SAFE_DIRS` 设置. 指向 `SAFE_DIRS` 外目录的软链接本身可见, 但无法访问其内容.
    """
    p = Path(path)
    try:
        if p.is_absolute():
            target_path = p.resolve(strict=True)
        else:
            target_path = (SAFE_DIRS[0] / p).resolve(strict=True)
    except OSError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="路径解析失败, 可能不存在或无访问权限")

    # Ensure the path is within the SAFE_DIRS
    check_path_access(target_path, *SAFE_DIRS)

    # 由于我们保证了 target_path 在 SAFE_DIRS 中, 而后者必然为目录, 因此 target_path 非目录时可以安全的访问 target_path.parent
    if not target_path.is_dir():
        target_path = target_path.parent

    if not target_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"指定路径 {path} 不存在.")

    try:
        items = []
        for entry in os.scandir(target_path):
            entry_path = Path(entry.path)
            item_type = "directory" if entry.is_dir() else "file"
            item = FileItem(name=entry.name, path=str(entry_path.as_posix()), type=item_type)
            # Get optional file metadata
            try:
                stat_result = entry.stat()
                mtime = datetime.fromtimestamp(stat_result.st_mtime)
                item.last_modified = mtime
                if item_type == "file":
                    item.size = stat_result.st_size
            except (OSError, FileNotFoundError):
                # Could not retrieve stats, skip these fields
                pass
            items.append(item)

        # Sort items: directories first, then files, both alphabetically
        items.sort(key=lambda x: (x.type != "directory", x.name.lower()))
        total = len(items)
        return FileListResponse(items=items[:1000], total=total)  # 限制最多返回 1k 项

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {str(e)}"
        )


class OpenPathRequest(BaseModel):
    """打开路径请求"""

    path: str = Field(description="要打开的文件或文件夹路径")
    reveal: bool = Field(default=True, description="是否在文件管理器中显示（而不是直接打开文件）")


@router.post("/open", operation_id="openPath", summary="打开文件或文件夹")
async def open_path(body: OpenPathRequest):
    """
    在系统文件管理器中打开文件或文件夹。

    - 如果 reveal=True，将在文件管理器中显示并选中该路径
    - 如果 reveal=False，将直接打开文件（使用系统默认程序）
    """
    p = Path(body.path)
    check_path_access(p, *SAFE_DIRS)

    if not p.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="路径不存在")

    try:
        open_file_thread(p, is_dir=body.reveal)
        return {"success": True, "message": f"已打开: {body.path}"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"打开失败: {str(e)}")


class NfoContentResponse(BaseModel):
    """NFO 文件内容响应"""

    path: str = Field(description="NFO 文件路径")
    content: str = Field(description="NFO 文件内容（XML）")
    exists: bool = Field(description="文件是否存在")


@router.get("/nfo", operation_id="readNfo", summary="读取 NFO 文件")
async def read_nfo(path: Annotated[str, Query(description="NFO 文件路径")]) -> NfoContentResponse:
    """
    读取 NFO 文件的内容。
    """
    p = Path(path)
    check_path_access(p, *SAFE_DIRS)

    if not p.exists():
        return NfoContentResponse(path=str(p), content="", exists=False)

    if not p.suffix.lower() == ".nfo":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="不是 NFO 文件")

    try:
        content = p.read_text(encoding="utf-8")
        return NfoContentResponse(path=str(p), content=content, exists=True)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"读取失败: {str(e)}")


class SaveNfoRequest(BaseModel):
    """保存 NFO 文件请求"""

    path: str = Field(description="NFO 文件路径")
    content: str = Field(description="NFO 文件内容（XML）")


@router.post("/nfo", operation_id="saveNfo", summary="保存 NFO 文件")
async def save_nfo(body: SaveNfoRequest):
    """
    保存 NFO 文件的内容。
    """
    p = Path(body.path)
    check_path_access(p, *SAFE_DIRS)

    if not p.suffix.lower() == ".nfo":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="不是 NFO 文件")

    try:
        p.write_text(body.content, encoding="utf-8")
        return {"success": True, "message": "NFO 文件已保存", "path": str(p)}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"保存失败: {str(e)}")
