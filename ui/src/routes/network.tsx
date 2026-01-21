import {
  CheckCircle,
  Error as ErrorIcon,
  HourglassEmpty,
  NetworkCheck,
  Refresh,
  VpnKey,
  Wifi,
  WifiOff,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { createFileRoute } from "@tanstack/react-router";
import axios from "axios";
import { useCallback, useState } from "react";

export const Route = createFileRoute("/network")({
  component: NetworkComponent,
});

// 类型定义
type SiteStatus = "ok" | "error" | "checking";

interface SiteCheckResult {
  name: string;
  url: string;
  status: SiteStatus;
  message: string;
  latency: number | null;
}

interface ProxyStatus {
  enabled: boolean;
  type: string | null;
  host: string | null;
  port: number | null;
  status: SiteStatus;
}

interface NetworkCheckResponse {
  proxy: ProxyStatus;
  sites: SiteCheckResult[];
  elapsed: number;
}

// 网站显示名称映射
const siteDisplayNames: Record<string, string> = {
  javdb: "JavDB",
  javbus: "JavBus",
  jav321: "Jav321",
  javlibrary: "JavLibrary",
  dmm: "DMM",
  mgstage: "MGStage",
  theporndb: "ThePornDB",
  fc2: "FC2",
  airav: "AirAV",
  avsox: "AvSox",
  xcity: "XCity",
};

// 状态图标组件
function StatusIcon({ status }: { status: SiteStatus }) {
  switch (status) {
    case "ok":
      return <CheckCircle color="success" />;
    case "error":
      return <ErrorIcon color="error" />;
    case "checking":
      return <HourglassEmpty color="disabled" />;
    default:
      return null;
  }
}

// 状态徽章组件
function StatusChip({ status, message }: { status: SiteStatus; message?: string }) {
  const getColor = () => {
    switch (status) {
      case "ok":
        return "success";
      case "error":
        return "error";
      default:
        return "default";
    }
  };

  const getLabel = () => {
    switch (status) {
      case "ok":
        return "正常";
      case "error":
        return "异常";
      case "checking":
        return "检测中";
      default:
        return "未知";
    }
  };

  return (
    <Tooltip title={message || ""} placement="top">
      <Chip
        icon={<StatusIcon status={status} />}
        label={getLabel()}
        color={getColor()}
        size="small"
        variant={status === "checking" ? "outlined" : "filled"}
      />
    </Tooltip>
  );
}

// 延迟显示组件
function LatencyDisplay({ latency }: { latency: number | null }) {
  if (latency === null) return <Typography color="text.secondary">-</Typography>;

  const getColor = () => {
    if (latency < 100) return "success.main";
    if (latency < 300) return "warning.main";
    return "error.main";
  };

  return (
    <Typography color={getColor()} sx={{ fontFamily: "monospace" }}>
      {latency} ms
    </Typography>
  );
}

function NetworkComponent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NetworkCheckResponse | null>(null);

  // 执行网络检测
  const handleCheck = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post<NetworkCheckResponse>(
        "/api/v1/network/check",
        { include_proxy: true },
        {
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": sessionStorage.getItem("apiKey") || "",
          },
        },
      );
      setResult(response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || err.message);
      } else {
        setError("网络检测失败");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 统计信息
  const stats = result
    ? {
        total: result.sites.length,
        ok: result.sites.filter((s) => s.status === "ok").length,
        error: result.sites.filter((s) => s.status === "error").length,
      }
    : null;

  return (
    <Box sx={{ p: 2 }}>
      {/* 标题和检测按钮 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <NetworkCheck sx={{ fontSize: 32, color: "primary.main" }} />
          <Box>
            <Typography variant="h5">网络检测</Typography>
            <Typography variant="body2" color="text.secondary">
              检测刮削网站的连接状态
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
          onClick={handleCheck}
          disabled={loading}
        >
          {loading ? "检测中..." : "开始检测"}
        </Button>
      </Box>

      {/* 加载进度条 */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 代理状态卡片 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader avatar={<VpnKey color="primary" />} title="代理状态" subheader="当前代理配置信息" />
            <Divider />
            <CardContent>
              {result ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography color="text.secondary">状态</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {result.proxy.enabled ? (
                        <>
                          <Wifi color="success" fontSize="small" />
                          <Typography color="success.main">已启用</Typography>
                        </>
                      ) : (
                        <>
                          <WifiOff color="disabled" fontSize="small" />
                          <Typography color="text.secondary">未启用</Typography>
                        </>
                      )}
                    </Box>
                  </Box>

                  {result.proxy.enabled && (
                    <>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography color="text.secondary">类型</Typography>
                        <Typography>{result.proxy.type?.toUpperCase() || "-"}</Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography color="text.secondary">地址</Typography>
                        <Typography sx={{ fontFamily: "monospace" }}>
                          {result.proxy.host}:{result.proxy.port}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                  点击"开始检测"查看代理状态
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 检测统计卡片 */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardHeader
              avatar={<NetworkCheck color="primary" />}
              title="检测统计"
              subheader={result ? `总用时: ${result.elapsed}s` : "点击开始检测查看结果"}
            />
            <Divider />
            <CardContent>
              {stats ? (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 4 }}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="h3" color="primary.main">
                        {stats.total}
                      </Typography>
                      <Typography color="text.secondary">总计</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="h3" color="success.main">
                        {stats.ok}
                      </Typography>
                      <Typography color="text.secondary">正常</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="h3" color="error.main">
                        {stats.error}
                      </Typography>
                      <Typography color="text.secondary">异常</Typography>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                  点击"开始检测"查看检测结果
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 网站列表 */}
        <Grid size={12}>
          {isMobile ? (
            // 移动端使用列表展示
            <Paper>
              {result?.sites.length ? (
                <List disablePadding>
                  {result.sites.map((site, index) => (
                    <ListItem
                      key={site.name}
                      sx={{
                        flexDirection: "column",
                        alignItems: "flex-start",
                        borderBottom: index < result.sites.length - 1 ? 1 : 0,
                        borderColor: "divider",
                        bgcolor:
                          site.status === "error"
                            ? theme.palette.mode === "dark"
                              ? "rgba(244, 67, 54, 0.08)"
                              : "rgba(244, 67, 54, 0.04)"
                            : "inherit",
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", mb: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <ListItemIcon sx={{ minWidth: "auto" }}>
                            <StatusIcon status={site.status} />
                          </ListItemIcon>
                          <Typography fontWeight={500}>{siteDisplayNames[site.name] || site.name}</Typography>
                        </Box>
                        <LatencyDisplay latency={site.latency} />
                      </Box>
                      <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary", mb: 0.5 }}>
                        {site.url}
                      </Typography>
                      {site.message && (
                        <Typography
                          variant="caption"
                          color={site.status === "error" ? "error.main" : "text.secondary"}
                          sx={{ wordBreak: "break-word" }}
                        >
                          {site.message}
                        </Typography>
                      )}
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <Typography color="text.secondary">点击"开始检测"按钮检测各网站连接状态</Typography>
                </Box>
              )}
            </Paper>
          ) : (
            // 桌面端使用表格展示
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>网站</TableCell>
                    <TableCell>URL</TableCell>
                    <TableCell align="center">状态</TableCell>
                    <TableCell align="center">延迟</TableCell>
                    <TableCell>消息</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result?.sites.map((site) => (
                    <TableRow
                      key={site.name}
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        bgcolor:
                          site.status === "error"
                            ? theme.palette.mode === "dark"
                              ? "rgba(244, 67, 54, 0.08)"
                              : "rgba(244, 67, 54, 0.04)"
                            : "inherit",
                      }}
                    >
                      <TableCell>
                        <Typography fontWeight={500}>{siteDisplayNames[site.name] || site.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary" }}>
                          {site.url}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <StatusChip status={site.status} message={site.message} />
                      </TableCell>
                      <TableCell align="center">
                        <LatencyDisplay latency={site.latency} />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={site.status === "error" ? "error.main" : "text.secondary"}
                          sx={{
                            maxWidth: 300,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {site.message}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}

                  {!result && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">点击"开始检测"按钮检测各网站连接状态</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
