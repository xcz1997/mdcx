import {
  Clear,
  Download,
  ExpandLess,
  ExpandMore,
  FilterList,
  Home,
  Search,
  VerticalAlignBottom,
  VerticalAlignBottomOutlined,
} from "@mui/icons-material";
import {
  Box,
  Chip,
  Collapse,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  List as MuiList,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FixedSizeList } from "react-window";
import { WebSocketStatus } from "@/components/WebSocketStatus";
import { type LogLevel, type ParsedLogEntry, useLogStore } from "@/store/logStore";

export const Route = createFileRoute("/logs")({
  component: LogsComponent,
});

// 日志级别颜色配置
const levelColors: Record<LogLevel, { light: string; dark: string; badge: string }> = {
  info: {
    light: "#2196F3",
    dark: "#90CAF9",
    badge: "#2196F3",
  },
  success: {
    light: "#4CAF50",
    dark: "#81C784",
    badge: "#4CAF50",
  },
  warning: {
    light: "#FF9800",
    dark: "#FFB74D",
    badge: "#FF9800",
  },
  error: {
    light: "#F44336",
    dark: "#E57373",
    badge: "#F44336",
  },
  debug: {
    light: "#9E9E9E",
    dark: "#BDBDBD",
    badge: "#9E9E9E",
  },
};

// 级别标签配置
const levelLabels: Record<LogLevel, string> = {
  info: "信息",
  success: "成功",
  warning: "警告",
  error: "错误",
  debug: "调试",
};

// 格式化时间戳
const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("zh-CN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return timestamp;
  }
};

// 单条日志渲染组件
interface LogRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    logs: ParsedLogEntry[];
    isDark: boolean;
  };
}

function LogRow({ index, style, data }: LogRowProps) {
  const { logs, isDark } = data;
  const log = logs[index];
  if (!log) return null;

  const levelColor = levelColors[log.level];
  const color = isDark ? levelColor.dark : levelColor.light;

  return (
    <Box
      style={style}
      sx={{
        px: 1.5,
        py: 0.75,
        borderBottom: "1px solid",
        borderColor: "divider",
        "&:hover": { bgcolor: "action.hover" },
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace", minWidth: 60 }}>
          {formatTimestamp(log.timestamp)}
        </Typography>

        <Chip
          label={levelLabels[log.level]}
          size="small"
          sx={{
            height: 18,
            fontSize: "0.7rem",
            bgcolor: `${levelColor.badge}20`,
            color: color,
            border: `1px solid ${color}`,
          }}
        />

        <Typography
          variant="caption"
          sx={{
            fontWeight: 500,
            color: "text.secondary",
            fontFamily: "monospace",
          }}
        >
          [{log.signalName}]
        </Typography>
      </Box>

      <Typography
        variant="body2"
        sx={{
          mt: 0.5,
          fontFamily: "monospace",
          fontSize: "0.8rem",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          color: log.level === "error" ? color : "text.primary",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {log.content}
      </Typography>
    </Box>
  );
}

function LogsComponent() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();

  // Store
  const {
    failedList,
    searchQuery,
    levelFilter,
    clearLogs,
    clearFailedList,
    setSearchQuery,
    setLevelFilter,
    getMainLogs,
    getRequestLogs,
  } = useLogStore();

  // Local state
  const [autoScroll, setAutoScroll] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0: 主日志, 1: 请求日志
  const [showFailedPanel, setShowFailedPanel] = useState(false);
  const [containerHeight, setContainerHeight] = useState(400);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<FixedSizeList>(null);

  // 获取当前标签页的日志
  const currentLogs = useMemo(() => {
    return activeTab === 0 ? getMainLogs() : getRequestLogs();
  }, [activeTab, getMainLogs, getRequestLogs]);

  // 列表数据
  const itemData = useMemo(() => ({ logs: currentLogs, isDark }), [currentLogs, isDark]);

  // 计算容器高度
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // 减去面板header和tabs高度
        setContainerHeight(Math.max(200, rect.height - 10));
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [showFailedPanel]);

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && listRef.current && currentLogs.length > 0) {
      listRef.current.scrollToItem(currentLogs.length - 1, "end");
    }
  }, [currentLogs.length, autoScroll]);

  // 导出日志
  const handleExportLogs = useCallback(() => {
    const logsToExport = currentLogs
      .map((log) => {
        const time = new Date(log.timestamp).toLocaleString("zh-CN");
        return `[${time}] [${log.level.toUpperCase()}] [${log.signalName}] ${log.content}`;
      })
      .join("\n");

    const blob = new Blob([logsToExport], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mdcx-logs-${activeTab === 0 ? "main" : "request"}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentLogs, activeTab]);

  // 导出失败列表
  const handleExportFailed = useCallback(() => {
    const content = failedList
      .map((item) => {
        const time = new Date(item.timestamp).toLocaleString("zh-CN");
        return `[${time}] ${item.content}`;
      })
      .join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mdcx-failed-list-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [failedList]);

  // 跳转到主页查看失败项
  const handleNavigateToHome = useCallback(() => {
    navigate({ to: "/" });
  }, [navigate]);

  return (
    <Box sx={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: isMobile ? "column" : "row", gap: 2 }}>
      {/* 主日志面板 */}
      <Paper
        elevation={1}
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* 头部工具栏 */}
        <Box
          sx={{
            p: 1.5,
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6" sx={{ fontSize: "1rem" }}>
              实时日志
            </Typography>
            <Chip label={`${currentLogs.length} 条`} size="small" variant="outlined" />
            <WebSocketStatus />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* 搜索框 */}
            <TextField
              size="small"
              placeholder="搜索日志..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ width: 200 }}
            />

            {/* 级别过滤 */}
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>
                <FilterList fontSize="small" sx={{ mr: 0.5 }} />
                级别
              </InputLabel>
              <Select
                value={levelFilter}
                label="级别"
                onChange={(e) => setLevelFilter(e.target.value as LogLevel | "all")}
              >
                <MenuItem value="all">全部</MenuItem>
                <MenuItem value="info">信息</MenuItem>
                <MenuItem value="success">成功</MenuItem>
                <MenuItem value="warning">警告</MenuItem>
                <MenuItem value="error">错误</MenuItem>
                <MenuItem value="debug">调试</MenuItem>
              </Select>
            </FormControl>

            <Divider orientation="vertical" flexItem />

            {/* 操作按钮 */}
            <Tooltip title={autoScroll ? "禁用自动滚动" : "启用自动滚动"}>
              <IconButton
                onClick={() => setAutoScroll(!autoScroll)}
                size="small"
                color={autoScroll ? "primary" : "default"}
              >
                {autoScroll ? <VerticalAlignBottom /> : <VerticalAlignBottomOutlined />}
              </IconButton>
            </Tooltip>

            <Tooltip title="导出日志">
              <IconButton onClick={handleExportLogs} size="small">
                <Download />
              </IconButton>
            </Tooltip>

            <Tooltip title="清空日志">
              <IconButton onClick={clearLogs} size="small">
                <Clear />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* 标签页 */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: "divider", minHeight: 40 }}
        >
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                主日志
                <Chip label={getMainLogs().length} size="small" sx={{ height: 18, fontSize: "0.7rem" }} />
              </Box>
            }
            sx={{ minHeight: 40, py: 0 }}
          />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                请求日志
                <Chip label={getRequestLogs().length} size="small" sx={{ height: 18, fontSize: "0.7rem" }} />
              </Box>
            }
            sx={{ minHeight: 40, py: 0 }}
          />
        </Tabs>

        {/* 日志内容区 - 虚拟滚动 */}
        <Box
          ref={containerRef}
          sx={{
            flex: 1,
            overflow: "hidden",
            bgcolor: isDark ? "#1a1a1a" : "#fafafa",
          }}
        >
          {currentLogs.length > 0 ? (
            <FixedSizeList
              ref={listRef}
              height={containerHeight}
              width="100%"
              itemCount={currentLogs.length}
              itemSize={70}
              itemData={itemData}
              overscanCount={5}
            >
              {LogRow}
            </FixedSizeList>
          ) : (
            <Box
              sx={{
                p: 4,
                textAlign: "center",
                color: "text.secondary",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="body2">
                {searchQuery || levelFilter !== "all" ? "没有匹配的日志" : "等待日志消息..."}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* 失败列表面板 */}
      <Paper
        elevation={1}
        sx={{
          width: isMobile ? "100%" : showFailedPanel ? 320 : 48,
          height: isMobile ? (showFailedPanel ? 200 : 48) : "auto",
          transition: isMobile ? "height 0.3s" : "width 0.3s",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* 折叠按钮 */}
        <Box
          sx={{
            p: 1,
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: showFailedPanel ? "space-between" : "center",
            cursor: "pointer",
          }}
          onClick={() => setShowFailedPanel(!showFailedPanel)}
        >
          {showFailedPanel ? (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="subtitle2">失败列表</Typography>
                <Chip label={failedList.length} size="small" color="error" sx={{ height: 18, fontSize: "0.7rem" }} />
              </Box>
              <Box>
                <Tooltip title="导出失败列表">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportFailed();
                    }}
                  >
                    <Download fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="清空失败列表">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFailedList();
                    }}
                  >
                    <Clear fontSize="small" />
                  </IconButton>
                </Tooltip>
                <IconButton size="small">
                  <ExpandMore />
                </IconButton>
              </Box>
            </>
          ) : (
            <Tooltip title="展开失败列表" placement={isMobile ? "top" : "left"}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: isMobile ? "row" : "column",
                  alignItems: "center",
                  gap: isMobile ? 1 : 0,
                }}
              >
                {isMobile ? <ExpandMore /> : <ExpandLess />}
                <Typography
                  variant="caption"
                  sx={
                    isMobile
                      ? {}
                      : {
                          writingMode: "vertical-rl",
                          textOrientation: "mixed",
                          mt: 1,
                        }
                  }
                >
                  失败列表 ({failedList.length})
                </Typography>
              </Box>
            </Tooltip>
          )}
        </Box>

        {/* 失败列表内容 */}
        <Collapse in={showFailedPanel} orientation="horizontal">
          <Box sx={{ width: 320, overflow: "auto", flex: 1, display: "flex", flexDirection: "column" }}>
            {/* 跳转到主页按钮 */}
            {failedList.length > 0 && (
              <Box sx={{ p: 1, borderBottom: 1, borderColor: "divider" }}>
                <ListItemButton
                  onClick={handleNavigateToHome}
                  sx={{
                    borderRadius: 1,
                    py: 0.5,
                    justifyContent: "center",
                    gap: 1,
                  }}
                >
                  <Home fontSize="small" />
                  <Typography variant="body2">在主页查看失败列表</Typography>
                </ListItemButton>
              </Box>
            )}
            {failedList.length > 0 ? (
              <MuiList dense sx={{ p: 0, flex: 1, overflow: "auto" }}>
                {failedList.map((item) => (
                  <ListItem
                    key={item.id}
                    sx={{
                      borderBottom: 1,
                      borderColor: "divider",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <ListItemText
                      primary={item.content}
                      secondary={new Date(item.timestamp).toLocaleTimeString("zh-CN")}
                      slotProps={{
                        primary: {
                          sx: {
                            color: "error.main",
                            wordBreak: "break-word",
                            fontSize: "0.8rem",
                          },
                        },
                        secondary: {
                          variant: "caption",
                        },
                      }}
                    />
                  </ListItem>
                ))}
              </MuiList>
            ) : (
              <Box sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
                <Typography variant="body2">暂无失败记录</Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
}
