/**
 * 图片裁剪对话框组件
 * 支持拖拽裁剪框、选择水印、预览和保存
 */

import {
  AspectRatio as AspectRatioIcon,
  Close as CloseIcon,
  ContentCut as CropIcon,
  Lock as LockIcon,
  Save as SaveIcon,
  LockOpen as UnlockIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";

interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WatermarkOption {
  type: "sub" | "4k" | "8k" | "youma" | "umr" | "leak" | "wuma";
  label: string;
}

const WATERMARK_OPTIONS: WatermarkOption[] = [
  { type: "sub", label: "字幕" },
  { type: "4k", label: "4K" },
  { type: "8k", label: "8K" },
  { type: "youma", label: "有码" },
  { type: "umr", label: "破解" },
  { type: "leak", label: "流出" },
  { type: "wuma", label: "无码" },
];

// 海报默认宽高比 2:3
const DEFAULT_ASPECT_RATIO = 2 / 3;

export interface ImageCropDialogProps {
  open: boolean;
  onClose: () => void;
  imagePath: string;
  imageType: "poster" | "thumb";
  onSave?: (result: {
    cropBox: { x1: number; y1: number; x2: number; y2: number };
    watermarks: string[];
  }) => Promise<void>;
}

export function ImageCropDialog({ open, onClose, imagePath, imageType, onSave }: ImageCropDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // 图片和裁剪状态
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, width: 100, height: 150 });
  const [lockAspectRatio, setLockAspectRatio] = useState(imageType === "poster");
  const [aspectRatio] = useState(DEFAULT_ASPECT_RATIO);
  const [selectedWatermarks, setSelectedWatermarks] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // DOM refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState<CropBox>({ x: 0, y: 0, width: 0, height: 0 });

  // 图片加载后初始化裁剪框
  useEffect(() => {
    if (imageLoaded && imageSize.width > 0 && imageSize.height > 0) {
      // 计算初始裁剪框（居中，占图片的 60%）
      let cropWidth: number;
      let cropHeight: number;

      if (lockAspectRatio) {
        // 保持宽高比
        const maxWidth = imageSize.width * 0.6;
        const maxHeight = imageSize.height * 0.8;

        if (maxWidth / aspectRatio <= maxHeight) {
          cropWidth = maxWidth;
          cropHeight = maxWidth / aspectRatio;
        } else {
          cropHeight = maxHeight;
          cropWidth = maxHeight * aspectRatio;
        }
      } else {
        cropWidth = imageSize.width * 0.6;
        cropHeight = imageSize.height * 0.6;
      }

      setCropBox({
        x: (imageSize.width - cropWidth) / 2,
        y: (imageSize.height - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight,
      });
    }
  }, [imageLoaded, imageSize, lockAspectRatio, aspectRatio]);

  // 图片加载
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    setImageLoaded(true);
  }, []);

  // 获取容器内的坐标
  const getContainerCoordinates = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current || !imageRef.current) return { x: 0, y: 0 };

      const imageRect = imageRef.current.getBoundingClientRect();

      // 计算图片在容器中的实际位置和缩放比例
      const scaleX = imageSize.width / imageRect.width;
      const scaleY = imageSize.height / imageRect.height;

      // 计算相对于图片的坐标
      const x = (clientX - imageRect.left) * scaleX;
      const y = (clientY - imageRect.top) * scaleY;

      return { x, y };
    },
    [imageSize],
  );

  // 鼠标按下 - 开始拖拽
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, handle?: string) => {
      e.preventDefault();
      e.stopPropagation();

      const coords = getContainerCoordinates(e.clientX, e.clientY);
      setDragStart(coords);
      setCropStart({ ...cropBox });

      if (handle) {
        setIsResizing(true);
        setResizeHandle(handle);
      } else {
        setIsDragging(true);
      }
    },
    [cropBox, getContainerCoordinates],
  );

  // 鼠标移动 - 拖拽中
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging && !isResizing) return;

      const coords = getContainerCoordinates(e.clientX, e.clientY);
      const deltaX = coords.x - dragStart.x;
      const deltaY = coords.y - dragStart.y;

      if (isDragging) {
        // 移动裁剪框
        let newX = cropStart.x + deltaX;
        let newY = cropStart.y + deltaY;

        // 边界限制
        newX = Math.max(0, Math.min(newX, imageSize.width - cropStart.width));
        newY = Math.max(0, Math.min(newY, imageSize.height - cropStart.height));

        setCropBox((prev) => ({ ...prev, x: newX, y: newY }));
      } else if (isResizing && resizeHandle) {
        // 调整裁剪框大小
        const newBox = { ...cropStart };

        switch (resizeHandle) {
          case "se": // 右下角
            newBox.width = Math.max(50, cropStart.width + deltaX);
            newBox.height = lockAspectRatio ? newBox.width / aspectRatio : Math.max(50, cropStart.height + deltaY);
            break;
          case "sw": {
            // 左下角
            const newWidthSW = Math.max(50, cropStart.width - deltaX);
            newBox.x = cropStart.x + (cropStart.width - newWidthSW);
            newBox.width = newWidthSW;
            newBox.height = lockAspectRatio ? newBox.width / aspectRatio : Math.max(50, cropStart.height + deltaY);
            break;
          }
          case "ne": {
            // 右上角
            newBox.width = Math.max(50, cropStart.width + deltaX);
            const newHeightNE = lockAspectRatio ? newBox.width / aspectRatio : Math.max(50, cropStart.height - deltaY);
            newBox.y = cropStart.y + (cropStart.height - newHeightNE);
            newBox.height = newHeightNE;
            break;
          }
          case "nw": {
            // 左上角
            const newWidthNW = Math.max(50, cropStart.width - deltaX);
            const newHeightNW = lockAspectRatio ? newWidthNW / aspectRatio : Math.max(50, cropStart.height - deltaY);
            newBox.x = cropStart.x + (cropStart.width - newWidthNW);
            newBox.y = cropStart.y + (cropStart.height - newHeightNW);
            newBox.width = newWidthNW;
            newBox.height = newHeightNW;
            break;
          }
        }

        // 边界限制
        if (newBox.x < 0) {
          newBox.width += newBox.x;
          newBox.x = 0;
        }
        if (newBox.y < 0) {
          newBox.height += newBox.y;
          newBox.y = 0;
        }
        if (newBox.x + newBox.width > imageSize.width) {
          newBox.width = imageSize.width - newBox.x;
        }
        if (newBox.y + newBox.height > imageSize.height) {
          newBox.height = imageSize.height - newBox.y;
        }

        setCropBox(newBox);
      }
    },
    [
      isDragging,
      isResizing,
      resizeHandle,
      dragStart,
      cropStart,
      imageSize,
      lockAspectRatio,
      aspectRatio,
      getContainerCoordinates,
    ],
  );

  // 鼠标释放 - 结束拖拽
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // 裁剪框尺寸调整（通过滑块）
  const handleCropSizeChange = useCallback(
    (_: Event, value: number | number[]) => {
      const scale = (value as number) / 100;
      const maxWidth = imageSize.width * 0.9;
      const maxHeight = imageSize.height * 0.9;

      let newWidth: number;
      let newHeight: number;

      if (lockAspectRatio) {
        if (maxWidth / aspectRatio <= maxHeight) {
          newWidth = maxWidth * scale;
          newHeight = newWidth / aspectRatio;
        } else {
          newHeight = maxHeight * scale;
          newWidth = newHeight * aspectRatio;
        }
      } else {
        newWidth = maxWidth * scale;
        newHeight = maxHeight * scale;
      }

      // 保持居中
      const newX = (imageSize.width - newWidth) / 2;
      const newY = (imageSize.height - newHeight) / 2;

      setCropBox({ x: newX, y: newY, width: newWidth, height: newHeight });
    },
    [imageSize, lockAspectRatio, aspectRatio],
  );

  // 保存裁剪
  const handleSave = useCallback(async () => {
    if (!onSave) return;

    setSaving(true);
    try {
      await onSave({
        cropBox: {
          x1: Math.round(cropBox.x),
          y1: Math.round(cropBox.y),
          x2: Math.round(cropBox.x + cropBox.width),
          y2: Math.round(cropBox.y + cropBox.height),
        },
        watermarks: selectedWatermarks,
      });
      onClose();
    } catch (error) {
      console.error("保存裁剪失败:", error);
    } finally {
      setSaving(false);
    }
  }, [cropBox, selectedWatermarks, onSave, onClose]);

  // 计算显示尺寸
  const displaySize = imageLoaded
    ? {
        width: Math.round(cropBox.width),
        height: Math.round(cropBox.height),
      }
    : { width: 0, height: 0 };

  // 计算裁剪框在显示图片上的位置（百分比）
  const cropBoxStyle = imageLoaded
    ? {
        left: `${(cropBox.x / imageSize.width) * 100}%`,
        top: `${(cropBox.y / imageSize.height) * 100}%`,
        width: `${(cropBox.width / imageSize.width) * 100}%`,
        height: `${(cropBox.height / imageSize.height) * 100}%`,
      }
    : {};

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CropIcon />
          <span>图片裁剪</span>
          {imageType === "poster" && <Chip label="海报" size="small" color="primary" variant="outlined" />}
          {imageType === "thumb" && <Chip label="缩略图" size="small" color="secondary" variant="outlined" />}
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {/* 图片裁剪区域 */}
          <Box
            ref={containerRef}
            sx={{
              position: "relative",
              width: "100%",
              maxHeight: isMobile ? "50vh" : "60vh",
              overflow: "hidden",
              bgcolor: "grey.900",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              userSelect: "none",
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* 图片 */}
            <Box sx={{ position: "relative", maxWidth: "100%", maxHeight: "100%" }}>
              <img
                ref={imageRef}
                src={`/api/v1/images/preview?path=${encodeURIComponent(imagePath)}`}
                alt="裁剪预览"
                onLoad={handleImageLoad}
                style={{
                  display: "block",
                  maxWidth: "100%",
                  maxHeight: isMobile ? "50vh" : "60vh",
                  objectFit: "contain",
                }}
              />

              {/* 裁剪框遮罩 */}
              {imageLoaded && (
                <>
                  {/* 半透明遮罩 */}
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      bgcolor: "rgba(0, 0, 0, 0.5)",
                      pointerEvents: "none",
                      clipPath: `polygon(
                        0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
                        ${cropBoxStyle.left} ${cropBoxStyle.top},
                        ${cropBoxStyle.left} calc(${cropBoxStyle.top} + ${cropBoxStyle.height}),
                        calc(${cropBoxStyle.left} + ${cropBoxStyle.width}) calc(${cropBoxStyle.top} + ${cropBoxStyle.height}),
                        calc(${cropBoxStyle.left} + ${cropBoxStyle.width}) ${cropBoxStyle.top},
                        ${cropBoxStyle.left} ${cropBoxStyle.top}
                      )`,
                    }}
                  />

                  {/* 裁剪框 */}
                  <Box
                    sx={{
                      position: "absolute",
                      ...cropBoxStyle,
                      border: "2px solid",
                      borderColor: "primary.main",
                      cursor: isDragging ? "grabbing" : "grab",
                      boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
                    }}
                    onMouseDown={(e) => handleMouseDown(e)}
                  >
                    {/* 调整手柄 */}
                    {["nw", "ne", "sw", "se"].map((handle) => (
                      <Box
                        key={handle}
                        sx={{
                          position: "absolute",
                          width: 12,
                          height: 12,
                          bgcolor: "primary.main",
                          borderRadius: "50%",
                          cursor: `${handle}-resize`,
                          ...(handle.includes("n") ? { top: -6 } : { bottom: -6 }),
                          ...(handle.includes("w") ? { left: -6 } : { right: -6 }),
                        }}
                        onMouseDown={(e) => handleMouseDown(e, handle)}
                      />
                    ))}
                  </Box>
                </>
              )}
            </Box>
          </Box>

          {/* 控制面板 */}
          <Stack direction={isMobile ? "column" : "row"} spacing={2} alignItems="flex-start">
            {/* 尺寸信息 */}
            <Box sx={{ minWidth: 120 }}>
              <Typography variant="caption" color="text.secondary">
                裁剪尺寸
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                {displaySize.width} x {displaySize.height}
              </Typography>
            </Box>

            {/* 宽高比锁定 */}
            <Box>
              <Tooltip title={lockAspectRatio ? "解锁宽高比" : "锁定宽高比"}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={lockAspectRatio}
                      onChange={(e) => setLockAspectRatio(e.target.checked)}
                      icon={<UnlockIcon />}
                      checkedIcon={<LockIcon />}
                    />
                  }
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <AspectRatioIcon fontSize="small" />
                      <span>2:3</span>
                    </Box>
                  }
                />
              </Tooltip>
            </Box>

            {/* 尺寸滑块 */}
            <Box sx={{ flex: 1, minWidth: 150 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                裁剪框大小
              </Typography>
              <Slider
                size="small"
                defaultValue={60}
                min={20}
                max={100}
                onChange={handleCropSizeChange}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${v}%`}
              />
            </Box>
          </Stack>

          {/* 水印选择 */}
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
              添加水印（可选）
            </Typography>
            <ToggleButtonGroup
              value={selectedWatermarks}
              onChange={(_, newValue) => setSelectedWatermarks(newValue || [])}
              size="small"
              sx={{ flexWrap: "wrap", gap: 0.5 }}
            >
              {WATERMARK_OPTIONS.map((option) => (
                <ToggleButton key={option.type} value={option.type} sx={{ px: 2 }}>
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          取消
        </Button>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving || !imageLoaded}>
          {saving ? "保存中..." : "保存裁剪"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ImageCropDialog;
