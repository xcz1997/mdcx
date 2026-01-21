/**
 * 快速操作组件
 * 提供编辑 NFO、打开文件夹、播放视频等操作
 */

import {
  Edit as EditIcon,
  FolderOpen as FolderIcon,
  MoreVert as MoreIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useCallback, useState } from "react";

interface QuickActionsProps {
  filePath?: string;
  nfoPath?: string;
  onRescrape?: () => void;
  disabled?: boolean;
}

export function QuickActions({ filePath, nfoPath, onRescrape, disabled }: QuickActionsProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // 菜单状态
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  // NFO 编辑对话框状态
  const [nfoDialogOpen, setNfoDialogOpen] = useState(false);
  const [nfoContent, setNfoContent] = useState("");
  const [nfoLoading, setNfoLoading] = useState(false);
  const [nfoSaving, setNfoSaving] = useState(false);

  // 操作状态
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 打开文件夹
  const handleOpenFolder = useCallback(async () => {
    if (!filePath) return;

    setActionLoading("folder");
    try {
      const response = await fetch("/api/v1/files/open", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": localStorage.getItem("apiKey") || "",
        },
        body: JSON.stringify({ path: filePath, reveal: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "打开文件夹失败");
      }
    } catch (error) {
      console.error("打开文件夹失败:", error);
    } finally {
      setActionLoading(null);
      setMenuAnchor(null);
    }
  }, [filePath]);

  // 播放视频
  const handlePlayVideo = useCallback(async () => {
    if (!filePath) return;

    setActionLoading("play");
    try {
      const response = await fetch("/api/v1/files/open", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": localStorage.getItem("apiKey") || "",
        },
        body: JSON.stringify({ path: filePath, reveal: false }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "播放视频失败");
      }
    } catch (error) {
      console.error("播放视频失败:", error);
    } finally {
      setActionLoading(null);
      setMenuAnchor(null);
    }
  }, [filePath]);

  // 打开 NFO 编辑对话框
  const handleOpenNfoEditor = useCallback(async () => {
    if (!nfoPath) return;

    setNfoLoading(true);
    setNfoDialogOpen(true);

    try {
      const response = await fetch(`/api/v1/files/nfo?path=${encodeURIComponent(nfoPath)}`, {
        headers: {
          "X-API-KEY": localStorage.getItem("apiKey") || "",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "读取 NFO 失败");
      }

      const data = await response.json();
      setNfoContent(data.content || "");
    } catch (error) {
      console.error("读取 NFO 失败:", error);
      setNfoContent("");
    } finally {
      setNfoLoading(false);
      setMenuAnchor(null);
    }
  }, [nfoPath]);

  // 保存 NFO
  const handleSaveNfo = useCallback(async () => {
    if (!nfoPath) return;

    setNfoSaving(true);
    try {
      const response = await fetch("/api/v1/files/nfo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": localStorage.getItem("apiKey") || "",
        },
        body: JSON.stringify({ path: nfoPath, content: nfoContent }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "保存 NFO 失败");
      }

      setNfoDialogOpen(false);
    } catch (error) {
      console.error("保存 NFO 失败:", error);
    } finally {
      setNfoSaving(false);
    }
  }, [nfoPath, nfoContent]);

  // 关闭 NFO 对话框
  const handleCloseNfoDialog = useCallback(() => {
    setNfoDialogOpen(false);
    setNfoContent("");
  }, []);

  // 重新刮削
  const handleRescrape = useCallback(() => {
    setMenuAnchor(null);
    onRescrape?.();
  }, [onRescrape]);

  const isDisabled = disabled || !filePath;

  // 移动端使用更多菜单
  if (isMobile) {
    return (
      <>
        <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} disabled={isDisabled} size="small">
          <MoreIcon />
        </IconButton>

        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
          <MenuItem onClick={handleOpenFolder} disabled={!filePath || actionLoading === "folder"}>
            <ListItemIcon>
              {actionLoading === "folder" ? <CircularProgress size={20} /> : <FolderIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>打开文件夹</ListItemText>
          </MenuItem>

          <MenuItem onClick={handlePlayVideo} disabled={!filePath || actionLoading === "play"}>
            <ListItemIcon>
              {actionLoading === "play" ? <CircularProgress size={20} /> : <PlayIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>播放视频</ListItemText>
          </MenuItem>

          <MenuItem onClick={handleOpenNfoEditor} disabled={!nfoPath}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>编辑 NFO</ListItemText>
          </MenuItem>

          {onRescrape && (
            <MenuItem onClick={handleRescrape}>
              <ListItemIcon>
                <RefreshIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>重新刮削</ListItemText>
            </MenuItem>
          )}
        </Menu>

        {/* NFO 编辑对话框 */}
        <NfoEditorDialog
          open={nfoDialogOpen}
          onClose={handleCloseNfoDialog}
          content={nfoContent}
          onChange={setNfoContent}
          onSave={handleSaveNfo}
          loading={nfoLoading}
          saving={nfoSaving}
        />
      </>
    );
  }

  // 桌面端使用按钮组
  return (
    <>
      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
        <Tooltip title="打开文件夹">
          <span>
            <IconButton
              size="small"
              onClick={handleOpenFolder}
              disabled={!filePath || actionLoading === "folder"}
              color="default"
            >
              {actionLoading === "folder" ? <CircularProgress size={18} /> : <FolderIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="播放视频">
          <span>
            <IconButton
              size="small"
              onClick={handlePlayVideo}
              disabled={!filePath || actionLoading === "play"}
              color="default"
            >
              {actionLoading === "play" ? <CircularProgress size={18} /> : <PlayIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="编辑 NFO">
          <span>
            <IconButton size="small" onClick={handleOpenNfoEditor} disabled={!nfoPath} color="default">
              <EditIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        {onRescrape && (
          <Tooltip title="重新刮削">
            <IconButton size="small" onClick={handleRescrape} color="default">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* NFO 编辑对话框 */}
      <NfoEditorDialog
        open={nfoDialogOpen}
        onClose={handleCloseNfoDialog}
        content={nfoContent}
        onChange={setNfoContent}
        onSave={handleSaveNfo}
        loading={nfoLoading}
        saving={nfoSaving}
      />
    </>
  );
}

// NFO 编辑对话框组件
interface NfoEditorDialogProps {
  open: boolean;
  onClose: () => void;
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  loading: boolean;
  saving: boolean;
}

function NfoEditorDialog({ open, onClose, content, onChange, onSave, loading, saving }: NfoEditorDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={fullScreen}>
      <DialogTitle>编辑 NFO 文件</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TextField
            multiline
            fullWidth
            minRows={15}
            maxRows={25}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="NFO 内容..."
            slotProps={{
              input: {
                sx: {
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                },
              },
            }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          取消
        </Button>
        <Button variant="contained" onClick={onSave} disabled={loading || saving}>
          {saving ? "保存中..." : "保存"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default QuickActions;
