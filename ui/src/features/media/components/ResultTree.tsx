/**
 * 刮削结果树状列表组件
 * 展示成功和失败的刮削结果
 */

import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Error as ErrorIcon,
  ExpandLess,
  ExpandMore,
  Folder as FolderIcon,
  Link as LinkIcon,
  MoreVert as MoreIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  CheckCircle as SuccessIcon,
} from "@mui/icons-material";
import {
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  styled,
  Typography,
} from "@mui/material";
import { useCallback, useState } from "react";
import type { ScrapeResultItem } from "@/store/scrapeStore";

interface ResultTreeProps {
  successItems: ScrapeResultItem[];
  failedItems: ScrapeResultItem[];
  selectedId: string | null;
  onSelect: (item: ScrapeResultItem) => void;
  onRescrape?: (item: ScrapeResultItem) => void;
  onScrapeWithUrl?: (item: ScrapeResultItem) => void;
  onEditNfo?: (item: ScrapeResultItem) => void;
  onOpenFolder?: (item: ScrapeResultItem) => void;
  onPlay?: (item: ScrapeResultItem) => void;
  onDelete?: (item: ScrapeResultItem) => void;
}

const StyledList = styled(List)({
  padding: 0,
});

const BranchHeader = styled(ListItemButton)(({ theme }) => ({
  backgroundColor: theme.palette.action.hover,
  "&:hover": {
    backgroundColor: theme.palette.action.selected,
  },
}));

const ResultItem = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== "isSelected",
})<{ isSelected?: boolean }>(({ theme, isSelected }) => ({
  paddingLeft: theme.spacing(4),
  backgroundColor: isSelected ? theme.palette.action.selected : "transparent",
  "&:hover": {
    backgroundColor: isSelected ? theme.palette.action.selected : theme.palette.action.hover,
  },
}));

export function ResultTree({
  successItems,
  failedItems,
  selectedId,
  onSelect,
  onRescrape,
  onScrapeWithUrl,
  onEditNfo,
  onOpenFolder,
  onPlay,
  onDelete,
}: ResultTreeProps) {
  const [successOpen, setSuccessOpen] = useState(true);
  const [failedOpen, setFailedOpen] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    item: ScrapeResultItem;
  } | null>(null);

  const handleContextMenu = useCallback((event: React.MouseEvent, item: ScrapeResultItem) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      item,
    });
  }, []);

  const handleCloseMenu = () => {
    setContextMenu(null);
  };

  const handleMenuAction = (action: "rescrape" | "scrapeWithUrl" | "editNfo" | "openFolder" | "play" | "delete") => {
    if (contextMenu) {
      switch (action) {
        case "rescrape":
          onRescrape?.(contextMenu.item);
          break;
        case "scrapeWithUrl":
          onScrapeWithUrl?.(contextMenu.item);
          break;
        case "editNfo":
          onEditNfo?.(contextMenu.item);
          break;
        case "openFolder":
          onOpenFolder?.(contextMenu.item);
          break;
        case "play":
          onPlay?.(contextMenu.item);
          break;
        case "delete":
          onDelete?.(contextMenu.item);
          break;
      }
    }
    handleCloseMenu();
  };

  const getFileName = (path: string) => {
    const parts = path.split(/[/\\]/);
    return parts[parts.length - 1] || path;
  };

  return (
    <Paper sx={{ overflow: "hidden" }}>
      <StyledList>
        {/* 成功分支 */}
        <BranchHeader onClick={() => setSuccessOpen(!successOpen)}>
          <ListItemIcon>
            <SuccessIcon color="success" />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                成功 ({successItems.length})
              </Typography>
            }
          />
          {successOpen ? <ExpandLess /> : <ExpandMore />}
        </BranchHeader>
        <Collapse in={successOpen} timeout="auto">
          <List component="div" disablePadding>
            {successItems.length === 0 ? (
              <ListItem sx={{ pl: 4 }}>
                <ListItemText secondary="暂无成功项" />
              </ListItem>
            ) : (
              successItems.map((item) => (
                <ResultItem
                  key={item.id}
                  isSelected={selectedId === item.id}
                  onClick={() => onSelect(item)}
                  onContextMenu={(e) => handleContextMenu(e, item)}
                >
                  <ListItemText
                    primary={
                      <Typography variant="body2" noWrap>
                        {item.number || getFileName(item.path)}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {item.title || item.path}
                      </Typography>
                    }
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContextMenu(e, item);
                    }}
                  >
                    <MoreIcon fontSize="small" />
                  </IconButton>
                </ResultItem>
              ))
            )}
          </List>
        </Collapse>

        {/* 失败分支 */}
        <BranchHeader onClick={() => setFailedOpen(!failedOpen)}>
          <ListItemIcon>
            <ErrorIcon color="error" />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                失败 ({failedItems.length})
              </Typography>
            }
          />
          {failedOpen ? <ExpandLess /> : <ExpandMore />}
        </BranchHeader>
        <Collapse in={failedOpen} timeout="auto">
          <List component="div" disablePadding>
            {failedItems.length === 0 ? (
              <ListItem sx={{ pl: 4 }}>
                <ListItemText secondary="暂无失败项" />
              </ListItem>
            ) : (
              failedItems.map((item) => (
                <ResultItem
                  key={item.id}
                  isSelected={selectedId === item.id}
                  onClick={() => onSelect(item)}
                  onContextMenu={(e) => handleContextMenu(e, item)}
                >
                  <ListItemText
                    primary={
                      <Typography variant="body2" noWrap color="error">
                        {item.number || getFileName(item.path)}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {item.error || item.path}
                      </Typography>
                    }
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContextMenu(e, item);
                    }}
                  >
                    <MoreIcon fontSize="small" />
                  </IconButton>
                </ResultItem>
              ))
            )}
          </List>
        </Collapse>
      </StyledList>

      {/* 右键菜单 */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseMenu}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
      >
        <MenuItem onClick={() => handleMenuAction("rescrape")}>
          <ListItemIcon>
            <RefreshIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>重新刮削</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction("scrapeWithUrl")}>
          <ListItemIcon>
            <LinkIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>输入网址刮削</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction("editNfo")}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>编辑 NFO</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction("openFolder")}>
          <ListItemIcon>
            <FolderIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>打开文件夹</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction("play")}>
          <ListItemIcon>
            <PlayIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>播放</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction("delete")} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>删除</ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
}

export default ResultTree;
