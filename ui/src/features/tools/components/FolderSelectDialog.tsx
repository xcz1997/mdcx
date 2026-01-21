/**
 * 文件夹选择对话框组件
 * 支持浏览服务器文件系统并选择文件夹
 */

import {
  ArrowBack as BackIcon,
  Close as CloseIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Home as HomeIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

interface FileItem {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  last_modified?: string;
}

interface FileListResponse {
  items: FileItem[];
  total: number;
}

export interface FolderSelectDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  title?: string;
  initialPath?: string;
}

export function FolderSelectDialog({
  open,
  onClose,
  onSelect,
  title = "选择文件夹",
  initialPath = "",
}: FolderSelectDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [currentPath, setCurrentPath] = useState(initialPath);
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [pathInput, setPathInput] = useState(initialPath);

  // 加载文件列表
  const loadFiles = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    setSelectedFolder(null);

    try {
      const response = await fetch(`/api/v1/files/list?path=${encodeURIComponent(path || "/")}`, {
        headers: {
          "X-API-KEY": localStorage.getItem("apiKey") || "",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "加载文件列表失败");
      }

      const data: FileListResponse = await response.json();
      setItems(data.items);
      setCurrentPath(path);
      setPathInput(path);
    } catch (err) {
      setError((err as Error).message || "加载文件列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    if (open) {
      loadFiles(initialPath);
    }
  }, [open, initialPath, loadFiles]);

  // 进入文件夹
  const handleEnterFolder = useCallback(
    (item: FileItem) => {
      if (item.type === "directory") {
        loadFiles(item.path);
      }
    },
    [loadFiles],
  );

  // 选择文件夹
  const handleSelectFolder = useCallback((item: FileItem) => {
    if (item.type === "directory") {
      setSelectedFolder(item.path);
    }
  }, []);

  // 双击进入文件夹
  const handleDoubleClick = useCallback(
    (item: FileItem) => {
      if (item.type === "directory") {
        handleEnterFolder(item);
      }
    },
    [handleEnterFolder],
  );

  // 返回上级目录
  const handleGoBack = useCallback(() => {
    if (!currentPath) return;

    const parts = currentPath.split("/").filter(Boolean);
    if (parts.length > 0) {
      parts.pop();
      const parentPath = parts.length > 0 ? `/${parts.join("/")}` : "/";
      loadFiles(parentPath);
    }
  }, [currentPath, loadFiles]);

  // 返回根目录
  const handleGoHome = useCallback(() => {
    loadFiles("/");
  }, [loadFiles]);

  // 刷新
  const handleRefresh = useCallback(() => {
    loadFiles(currentPath);
  }, [currentPath, loadFiles]);

  // 路径输入回车
  const handlePathInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        loadFiles(pathInput);
      }
    },
    [pathInput, loadFiles],
  );

  // 确认选择
  const handleConfirm = useCallback(() => {
    const pathToSelect = selectedFolder || currentPath;
    onSelect(pathToSelect);
    onClose();
  }, [selectedFolder, currentPath, onSelect, onClose]);

  // 解析路径为面包屑
  const pathParts = currentPath.split("/").filter(Boolean);

  // 目录列表（只显示目录）
  const directories = items.filter((item) => item.type === "directory");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FolderOpenIcon color="primary" />
          <span>{title}</span>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, display: "flex", flexDirection: "column" }}>
        {/* 工具栏 */}
        <Box sx={{ p: 1.5, borderBottom: 1, borderColor: "divider", bgcolor: "background.default" }}>
          {/* 导航按钮 */}
          <Box sx={{ display: "flex", gap: 0.5, mb: 1.5 }}>
            <Tooltip title="返回上级">
              <span>
                <IconButton size="small" onClick={handleGoBack} disabled={!currentPath || loading}>
                  <BackIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="返回根目录">
              <IconButton size="small" onClick={handleGoHome} disabled={loading}>
                <HomeIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="刷新">
              <IconButton size="small" onClick={handleRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* 路径输入框 */}
          <TextField
            size="small"
            fullWidth
            placeholder="输入路径..."
            value={pathInput}
            onChange={(e) => setPathInput(e.target.value)}
            onKeyDown={handlePathInputKeyDown}
            slotProps={{
              input: {
                sx: { fontFamily: "monospace", fontSize: "0.875rem" },
              },
            }}
          />

          {/* 面包屑导航 */}
          {pathParts.length > 0 && (
            <Breadcrumbs sx={{ mt: 1 }} maxItems={isMobile ? 3 : 5}>
              <Link
                component="button"
                variant="body2"
                onClick={() => loadFiles("/")}
                sx={{ cursor: "pointer" }}
                underline="hover"
              >
                根目录
              </Link>
              {pathParts.map((part, index) => {
                const path = `/${pathParts.slice(0, index + 1).join("/")}`;
                const isLast = index === pathParts.length - 1;
                return isLast ? (
                  <Typography key={path} variant="body2" color="text.primary">
                    {part}
                  </Typography>
                ) : (
                  <Link
                    key={path}
                    component="button"
                    variant="body2"
                    onClick={() => loadFiles(path)}
                    sx={{ cursor: "pointer" }}
                    underline="hover"
                  >
                    {part}
                  </Link>
                );
              })}
            </Breadcrumbs>
          )}
        </Box>

        {/* 文件列表 */}
        <Box sx={{ flex: 1, overflow: "auto", minHeight: 300 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography color="error" gutterBottom>
                {error}
              </Typography>
              <Button variant="outlined" size="small" onClick={handleRefresh}>
                重试
              </Button>
            </Box>
          ) : directories.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <FolderIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
              <Typography color="text.secondary">当前目录下没有子文件夹</Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {directories.map((item) => (
                <ListItemButton
                  key={item.path}
                  selected={selectedFolder === item.path}
                  onClick={() => handleSelectFolder(item)}
                  onDoubleClick={() => handleDoubleClick(item)}
                  sx={{
                    borderBottom: 1,
                    borderColor: "divider",
                    "&.Mui-selected": {
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      "&:hover": {
                        bgcolor: "primary.dark",
                      },
                      "& .MuiListItemIcon-root": {
                        color: "inherit",
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <FolderIcon color={selectedFolder === item.path ? "inherit" : "primary"} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.name}
                    primaryTypographyProps={{
                      noWrap: true,
                      sx: { fontWeight: selectedFolder === item.path ? 600 : 400 },
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>

        {/* 选中路径显示 */}
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderTop: 1,
            borderColor: "divider",
            bgcolor: "background.default",
          }}
        >
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            已选择路径：
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: "monospace",
              bgcolor: "action.hover",
              p: 1,
              borderRadius: 1,
              wordBreak: "break-all",
            }}
          >
            {selectedFolder || currentPath || "/"}
          </Typography>
        </Paper>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={loading}>
          确定选择
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default FolderSelectDialog;
