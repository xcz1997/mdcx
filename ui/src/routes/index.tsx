import { Box, Grid } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/contexts/ToastProvider";
import { useWebSocketContext } from "@/contexts/WebSocketProvider";
import { MediaInfoCard } from "@/features/media/components/MediaInfoCard";
import { ResultTree } from "@/features/media/components/ResultTree";
import { ScrapeControl } from "@/features/scraping/components/ScrapeControl";
import { FolderSelectDialog } from "@/features/tools/components/FolderSelectDialog";
import { ImageCropDialog } from "@/features/tools/components/ImageCropDialog";
import { useScrapeStore } from "@/store/scrapeStore";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { showToast } = useToast();
  const { addHandler } = useWebSocketContext();

  // 图片裁剪对话框状态
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImagePath, setCropImagePath] = useState("");
  const [cropImageType, setCropImageType] = useState<"poster" | "thumb">("poster");

  // 文件夹选择对话框状态
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [currentMediaPath, setCurrentMediaPath] = useState("");

  const {
    status,
    current,
    total,
    success,
    failed,
    progress,
    scrapeInfo,
    successList,
    failedList,
    selectedItem,
    currentMedia,
    setStatus,
    updateProgress,
    addSuccessItem,
    addFailedItem,
    setSelectedItem,
    setCurrentMedia,
    setScrapeInfo,
    clearResults,
    reset,
  } = useScrapeStore();

  // 注册 WebSocket 消息处理器
  useEffect(() => {
    const handleQtSignal = (data: { name: string; data: unknown }) => {
      switch (data.name) {
        case "scrape_info":
          setScrapeInfo(data.data as string);
          break;
        case "set_main_info":
          if (data.data && typeof data.data === "object" && "show_data" in data.data) {
            const showData = (data.data as { show_data: Record<string, unknown> }).show_data;
            if (showData) {
              setCurrentMedia({
                number: (showData.number as string) || "",
                title: (showData.title as string) || "",
                actors: ((showData.actor as string) || "").split(",").filter(Boolean),
                release: (showData.release as string) || "",
                runtime: (showData.runtime as string) || "",
                outline: (showData.outline as string) || "",
                tags: ((showData.tag as string) || "").split(",").filter(Boolean),
                director: (showData.director as string) || "",
                studio: (showData.studio as string) || "",
                series: (showData.series as string) || "",
                publisher: (showData.publisher as string) || "",
                source: (showData.website as string) || "",
                posterUrl: showData.poster as string | undefined,
                thumbUrl: showData.thumb as string | undefined,
                filePath: showData.file_path as string | undefined,
                nfoPath: showData.nfo_path as string | undefined,
              });
            }
          }
          break;
        case "show_list_name":
          if (data.data && typeof data.data === "object") {
            const listData = data.data as { status: string; show_data: Record<string, unknown>; real_number: string };
            if (listData.status === "succ") {
              addSuccessItem({
                path: (listData.show_data?.file_path as string) || "",
                number: listData.real_number || (listData.show_data?.number as string),
                title: (listData.show_data?.title as string) || "",
              });
            } else {
              addFailedItem({
                path: (listData.show_data?.file_path as string) || "",
                number: listData.real_number,
                error: (listData.show_data?.outline as string) || "刮削失败",
              });
            }
          }
          break;
      }
    };

    const handleProgress = (data: { progress: number; total: number; percentage: number }) => {
      updateProgress({
        current: data.progress,
        total: data.total,
        success: success,
        failed: failed,
        progress: data.percentage,
      });
    };

    const unsubscribeQtSignal = addHandler("qt_signal", handleQtSignal);
    const unsubscribeProgress = addHandler("progress", handleProgress);

    return () => {
      unsubscribeQtSignal();
      unsubscribeProgress();
    };
  }, [addHandler, setScrapeInfo, setCurrentMedia, addSuccessItem, addFailedItem, updateProgress, success, failed]);

  // 加载当前配置的媒体路径
  useEffect(() => {
    const loadMediaPath = async () => {
      try {
        const response = await fetch("/api/v1/config/", {
          headers: {
            "X-API-KEY": localStorage.getItem("apiKey") || "",
          },
        });
        if (response.ok) {
          const config = await response.json();
          if (config.media_path) {
            setCurrentMediaPath(config.media_path);
          }
        }
      } catch (error) {
        console.error("加载配置失败:", error);
      }
    };
    loadMediaPath();
  }, []);

  // 选择文件夹
  const handleSelectFolder = useCallback(() => {
    setFolderDialogOpen(true);
  }, []);

  // 文件夹选择完成
  const handleFolderSelected = useCallback(
    async (path: string) => {
      try {
        // 先获取当前配置
        const configResponse = await fetch("/api/v1/config/", {
          headers: {
            "X-API-KEY": localStorage.getItem("apiKey") || "",
          },
        });
        if (!configResponse.ok) {
          throw new Error("获取配置失败");
        }
        const config = await configResponse.json();

        // 更新媒体路径
        config.media_path = path;

        // 保存配置
        const saveResponse = await fetch("/api/v1/config/", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": localStorage.getItem("apiKey") || "",
          },
          body: JSON.stringify(config),
        });

        if (!saveResponse.ok) {
          throw new Error("保存配置失败");
        }

        setCurrentMediaPath(path);
        showToast(`已更新媒体路径: ${path}`, "success");
      } catch (error) {
        showToast((error as Error).message || "更新媒体路径失败", "error");
      }
    },
    [showToast],
  );

  // 开始刮削
  const handleStart = useCallback(async () => {
    try {
      reset();
      setStatus("scraping");
      const response = await fetch("/api/v1/scrape/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": localStorage.getItem("apiKey") || "",
        },
      });
      if (!response.ok) {
        throw new Error("启动刮削失败");
      }
      showToast("刮削任务已启动", "success");
    } catch (error) {
      setStatus("idle");
      showToast((error as Error).message || "启动刮削失败", "error");
    }
  }, [reset, setStatus, showToast]);

  // 停止刮削
  const handleStop = useCallback(async () => {
    try {
      setStatus("stopping");
      const response = await fetch("/api/v1/scrape/stop", {
        method: "POST",
        headers: {
          "X-API-KEY": localStorage.getItem("apiKey") || "",
        },
      });
      if (!response.ok) {
        throw new Error("停止刮削失败");
      }
      showToast("正在停止刮削...", "info");
    } catch (error) {
      showToast((error as Error).message || "停止刮削失败", "error");
    }
  }, [setStatus, showToast]);

  // 清空结果
  const handleClear = useCallback(() => {
    clearResults();
    setCurrentMedia(null);
    showToast("结果已清空", "info");
  }, [clearResults, setCurrentMedia, showToast]);

  // 选择结果项
  const handleSelectItem = useCallback(
    (item: (typeof successList)[0]) => {
      setSelectedItem(item);
    },
    [setSelectedItem],
  );

  // 演员点击
  const handleActorClick = useCallback((actor: string) => {
    // 可以导航到演员搜索页面或显示演员信息
    console.log("Actor clicked:", actor);
  }, []);

  // 海报点击 - 打开裁剪工具
  const handlePosterClick = useCallback(() => {
    if (currentMedia?.posterUrl) {
      // 从 URL 中提取文件路径
      const url = new URL(currentMedia.posterUrl, window.location.origin);
      const path = url.searchParams.get("path");
      if (path) {
        setCropImagePath(path);
        setCropImageType("poster");
        setCropDialogOpen(true);
      }
    }
  }, [currentMedia?.posterUrl]);

  // 缩略图点击 - 打开裁剪工具
  const handleThumbClick = useCallback(() => {
    if (currentMedia?.thumbUrl) {
      // 从 URL 中提取文件路径
      const url = new URL(currentMedia.thumbUrl, window.location.origin);
      const path = url.searchParams.get("path");
      if (path) {
        setCropImagePath(path);
        setCropImageType("thumb");
        setCropDialogOpen(true);
      }
    }
  }, [currentMedia?.thumbUrl]);

  // 保存裁剪
  const handleSaveCrop = useCallback(
    async (result: { cropBox: { x1: number; y1: number; x2: number; y2: number }; watermarks: string[] }) => {
      try {
        const response = await fetch("/api/v1/images/crop", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": localStorage.getItem("apiKey") || "",
          },
          body: JSON.stringify({
            source_path: cropImagePath,
            crop_box: result.cropBox,
            watermark: result.watermarks.length > 0 ? { type: result.watermarks[0], position: "top_left" } : null,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || "裁剪保存失败");
        }

        showToast("图片裁剪保存成功", "success");
      } catch (error) {
        showToast((error as Error).message || "图片裁剪保存失败", "error");
        throw error;
      }
    },
    [cropImagePath, showToast],
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* 刮削控制 */}
      <ScrapeControl
        status={status}
        current={current}
        total={total}
        success={success}
        failed={failed}
        progress={progress}
        scrapeInfo={scrapeInfo}
        onStart={handleStart}
        onStop={handleStop}
        onClear={handleClear}
        onSelectFolder={handleSelectFolder}
      />

      <Grid container spacing={2}>
        {/* 左侧：结果列表 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <ResultTree
            successItems={successList}
            failedItems={failedList}
            selectedId={selectedItem?.id || null}
            onSelect={handleSelectItem}
          />
        </Grid>

        {/* 右侧：媒体信息 */}
        <Grid size={{ xs: 12, md: 8 }}>
          <MediaInfoCard
            media={currentMedia}
            onActorClick={handleActorClick}
            onPosterClick={handlePosterClick}
            onThumbClick={handleThumbClick}
          />
        </Grid>
      </Grid>

      {/* 图片裁剪对话框 */}
      <ImageCropDialog
        open={cropDialogOpen}
        onClose={() => setCropDialogOpen(false)}
        imagePath={cropImagePath}
        imageType={cropImageType}
        onSave={handleSaveCrop}
      />

      {/* 文件夹选择对话框 */}
      <FolderSelectDialog
        open={folderDialogOpen}
        onClose={() => setFolderDialogOpen(false)}
        onSelect={handleFolderSelected}
        title="选择媒体文件夹"
        initialPath={currentMediaPath}
      />
    </Box>
  );
}
