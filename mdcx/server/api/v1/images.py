"""
图片处理 API
提供图片裁剪、水印添加和预览功能
"""

import io
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from PIL import Image
from pydantic import BaseModel, Field

from mdcx.base.image import add_mark_thread
from mdcx.server.config import SAFE_DIRS

from .utils import check_path_access

router = APIRouter(prefix="/images", tags=["Images"])


class CropBox(BaseModel):
    """裁剪框"""

    x1: int = Field(description="左上角 X 坐标")
    y1: int = Field(description="左上角 Y 坐标")
    x2: int = Field(description="右下角 X 坐标")
    y2: int = Field(description="右下角 Y 坐标")


class WatermarkOptions(BaseModel):
    """水印选项"""

    type: Literal["sub", "4k", "8k", "youma", "umr", "leak", "wuma"] = Field(description="水印类型")
    position: Literal["top_left", "top_right", "bottom_left", "bottom_right"] = Field(
        default="top_left", description="水印位置"
    )


class CropRequest(BaseModel):
    """图片裁剪请求"""

    source_path: str = Field(description="源图片路径")
    crop_box: CropBox = Field(description="裁剪框坐标")
    watermark: WatermarkOptions | None = Field(default=None, description="水印选项")
    output_path: str | None = Field(default=None, description="输出路径，为空则覆盖源文件")
    quality: int = Field(default=95, ge=1, le=100, description="输出质量 (1-100)")


class CropResponse(BaseModel):
    """图片裁剪响应"""

    success: bool
    path: str
    width: int
    height: int


class ImageInfoResponse(BaseModel):
    """图片信息响应"""

    path: str
    width: int
    height: int
    format: str
    size: int


class WatermarkRequest(BaseModel):
    """添加水印请求"""

    source_path: str = Field(description="源图片路径")
    marks: list[Literal["sub", "4k", "8k", "youma", "umr", "leak", "wuma"]] = Field(description="水印类型列表")
    output_path: str | None = Field(default=None, description="输出路径，为空则覆盖源文件")


# 水印类型映射
WATERMARK_MAP = {
    "sub": "字幕",
    "4k": "4K",
    "8k": "8K",
    "youma": "有码",
    "umr": "破解",
    "leak": "流出",
    "wuma": "无码",
}


@router.post("/crop", summary="图片裁剪", operation_id="cropImage", response_model=CropResponse)
async def crop_image(body: CropRequest):
    """
    裁剪图片

    支持指定裁剪框坐标和可选的水印添加
    """
    source_path = Path(body.source_path)
    check_path_access(source_path, *SAFE_DIRS)

    if not source_path.exists():
        raise HTTPException(status_code=404, detail="源图片不存在")

    output_path = Path(body.output_path) if body.output_path else source_path
    check_path_access(output_path, *SAFE_DIRS)

    try:
        with Image.open(source_path) as img:
            # 验证裁剪框
            crop_box = body.crop_box
            if crop_box.x1 < 0 or crop_box.y1 < 0:
                raise HTTPException(status_code=400, detail="裁剪框坐标不能为负数")
            if crop_box.x2 > img.width or crop_box.y2 > img.height:
                raise HTTPException(status_code=400, detail="裁剪框超出图片边界")
            if crop_box.x2 <= crop_box.x1 or crop_box.y2 <= crop_box.y1:
                raise HTTPException(status_code=400, detail="裁剪框无效")

            # 裁剪图片
            cropped = img.crop((crop_box.x1, crop_box.y1, crop_box.x2, crop_box.y2))

            # 转换为 RGB 模式（如果是 RGBA）
            if cropped.mode == "RGBA":
                cropped = cropped.convert("RGB")

            # 保存裁剪后的图片
            cropped.save(output_path, quality=body.quality, subsampling=0)

            width, height = cropped.size

        # 添加水印
        if body.watermark:
            mark_list = [WATERMARK_MAP[body.watermark.type]]
            await add_mark_thread(output_path, mark_list)

        return CropResponse(success=True, path=str(output_path), width=width, height=height)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"图片处理失败: {str(e)}")


@router.get("/preview", summary="图片预览", operation_id="previewImage")
async def preview_image(path: str, width: int | None = None, height: int | None = None):
    """
    预览图片

    可选指定宽度或高度进行缩放
    """
    image_path = Path(path)
    check_path_access(image_path, *SAFE_DIRS)

    if not image_path.exists():
        raise HTTPException(status_code=404, detail="图片不存在")

    try:
        with Image.open(image_path) as img:
            # 缩放图片
            if width or height:
                original_width, original_height = img.size
                if width and not height:
                    height = int(original_height * width / original_width)
                elif height and not width:
                    width = int(original_width * height / original_height)
                img = img.resize((width, height), Image.Resampling.LANCZOS)

            # 转换为字节流
            img_byte_arr = io.BytesIO()
            img_format = img.format or "JPEG"
            if img.mode == "RGBA":
                img = img.convert("RGB")
                img_format = "JPEG"
            img.save(img_byte_arr, format=img_format)
            img_byte_arr.seek(0)

            media_type = f"image/{img_format.lower()}"
            return StreamingResponse(img_byte_arr, media_type=media_type)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"图片预览失败: {str(e)}")


@router.post("/watermark", summary="添加水印", operation_id="addWatermark")
async def add_watermark(body: WatermarkRequest):
    """
    为图片添加水印

    支持同时添加多个水印
    """
    source_path = Path(body.source_path)
    check_path_access(source_path, *SAFE_DIRS)

    if not source_path.exists():
        raise HTTPException(status_code=404, detail="源图片不存在")

    output_path = Path(body.output_path) if body.output_path else source_path
    check_path_access(output_path, *SAFE_DIRS)

    # 如果输出路径不同，先复制文件
    if output_path != source_path:
        import shutil

        shutil.copy2(source_path, output_path)

    try:
        # 转换水印类型
        mark_list = [WATERMARK_MAP[mark] for mark in body.marks]

        # 添加水印
        await add_mark_thread(output_path, mark_list)

        return {"success": True, "path": str(output_path)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"添加水印失败: {str(e)}")


@router.get("/info", summary="获取图片信息", operation_id="getImageInfo", response_model=ImageInfoResponse)
async def get_image_info(path: str):
    """获取图片的基本信息"""
    image_path = Path(path)
    check_path_access(image_path, *SAFE_DIRS)

    if not image_path.exists():
        raise HTTPException(status_code=404, detail="图片不存在")

    try:
        with Image.open(image_path) as img:
            return ImageInfoResponse(
                path=str(image_path),
                width=img.width,
                height=img.height,
                format=img.format or "Unknown",
                size=image_path.stat().st_size,
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取图片信息失败: {str(e)}")
