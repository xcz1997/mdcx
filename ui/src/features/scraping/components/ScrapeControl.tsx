/**
 * 刮削控制组件
 * 提供开始、停止刮削和进度显示功能
 */

import {
  Folder as FolderIcon,
  Pause as PauseIcon,
  Refresh as RefreshIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
} from "@mui/icons-material";
import { Box, Button, LinearProgress, Paper, styled, Typography } from "@mui/material";
import type { ScrapeStatus } from "@/store/scrapeStore";

interface ScrapeControlProps {
  status: ScrapeStatus;
  current: number;
  total: number;
  success: number;
  failed: number;
  progress: number;
  scrapeInfo: string;
  mediaPath?: string;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onClear: () => void;
  onSelectFolder?: () => void;
  disabled?: boolean;
}

const StatsBox = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(3),
  flexWrap: "wrap",
  marginTop: theme.spacing(1),
}));

const StatItem = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  minWidth: 60,
});

const StatValue = styled(Typography)(({ theme }) => ({
  fontSize: "1.5rem",
  fontWeight: 600,
  lineHeight: 1.2,
}));

const StatLabel = styled(Typography)(({ theme }) => ({
  fontSize: "0.75rem",
  color: theme.palette.text.secondary,
}));

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(1),
}));

export function ScrapeControl({
  status,
  current,
  total,
  success,
  failed,
  progress,
  scrapeInfo,
  mediaPath,
  onStart,
  onStop,
  onPause,
  onResume,
  onClear,
  onSelectFolder,
  disabled,
}: ScrapeControlProps) {
  const isScraping = status === "scraping";
  const isPaused = status === "paused";
  const isStopping = status === "stopping";
  const isIdle = status === "idle";

  return (
    <Paper sx={{ p: 2 }}>
      {/* 控制按钮 */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
        {isIdle && (
          <>
            <Button variant="contained" color="primary" startIcon={<StartIcon />} onClick={onStart} disabled={disabled}>
              开始刮削
            </Button>
            {onSelectFolder && (
              <Button variant="outlined" startIcon={<FolderIcon />} onClick={onSelectFolder} disabled={disabled}>
                {mediaPath || "选择文件夹"}
              </Button>
            )}
            {(success > 0 || failed > 0) && (
              <Button variant="outlined" color="secondary" startIcon={<RefreshIcon />} onClick={onClear}>
                清空结果
              </Button>
            )}
          </>
        )}
        {isScraping && (
          <>
            <Button variant="contained" color="warning" startIcon={<PauseIcon />} onClick={onPause}>
              暂停刮削
            </Button>
            <Button variant="contained" color="error" startIcon={<StopIcon />} onClick={onStop}>
              停止刮削
            </Button>
          </>
        )}
        {isPaused && (
          <>
            <Button variant="contained" color="success" startIcon={<StartIcon />} onClick={onResume}>
              恢复刮削
            </Button>
            <Button variant="contained" color="error" startIcon={<StopIcon />} onClick={onStop}>
              停止刮削
            </Button>
          </>
        )}
        {isStopping && (
          <Button variant="contained" color="warning" disabled startIcon={<StopIcon />}>
            停止中...
          </Button>
        )}
      </Box>

      {/* 进度条 */}
      {(isScraping || isPaused || isStopping || total > 0) && (
        <>
          <ProgressBar
            variant="determinate"
            value={progress}
            color={isStopping ? "warning" : isPaused ? "info" : isScraping ? "primary" : "success"}
          />
          <Typography variant="caption" color="text.secondary">
            {current} / {total} ({progress}%)
          </Typography>
        </>
      )}

      {/* 统计信息 */}
      <StatsBox>
        <StatItem>
          <StatValue color="text.primary">{total}</StatValue>
          <StatLabel>总数</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue color="primary">{current}</StatValue>
          <StatLabel>已处理</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue color="success.main">{success}</StatValue>
          <StatLabel>成功</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue color="error.main">{failed}</StatValue>
          <StatLabel>失败</StatLabel>
        </StatItem>
      </StatsBox>

      {/* 刮削信息 */}
      {scrapeInfo && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, whiteSpace: "pre-wrap" }}>
          {scrapeInfo}
        </Typography>
      )}
    </Paper>
  );
}

export default ScrapeControl;
