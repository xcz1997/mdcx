/**
 * 下拉刷新指示器组件
 */

import { Refresh } from "@mui/icons-material";
import { Box, CircularProgress, Typography } from "@mui/material";
import type { RefreshStatus } from "@/hooks/usePullToRefresh";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  status: RefreshStatus;
  threshold?: number;
}

export function PullToRefreshIndicator({ pullDistance, status, threshold = 80 }: PullToRefreshIndicatorProps) {
  if (status === "idle" && pullDistance === 0) {
    return null;
  }

  const progress = Math.min(100, (pullDistance / threshold) * 100);
  const rotation = (progress / 100) * 360;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        height: pullDistance,
        overflow: "hidden",
        bgcolor: "background.default",
        zIndex: 1100,
        transition: status === "idle" ? "height 0.2s ease-out" : "none",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          py: 1,
        }}
      >
        {status === "refreshing" ? (
          <CircularProgress size={24} />
        ) : (
          <Refresh
            sx={{
              transform: `rotate(${rotation}deg)`,
              transition: "transform 0.1s ease-out",
              color: status === "ready" ? "primary.main" : "text.secondary",
            }}
          />
        )}
        <Typography
          variant="body2"
          color={status === "ready" ? "primary" : "text.secondary"}
          sx={{ minWidth: 80, textAlign: "center" }}
        >
          {status === "refreshing" ? "刷新中..." : status === "ready" ? "松开刷新" : "下拉刷新"}
        </Typography>
      </Box>
    </Box>
  );
}

export default PullToRefreshIndicator;
