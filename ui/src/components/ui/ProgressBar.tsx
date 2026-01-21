/**
 * 进度条组件
 */

import { Box, LinearProgress, type LinearProgressProps, styled, Typography } from "@mui/material";

export interface ProgressBarProps extends LinearProgressProps {
  value: number;
  total?: number;
  showLabel?: boolean;
  labelFormat?: "percent" | "count";
  height?: number;
}

const StyledLinearProgress = styled(LinearProgress, {
  shouldForwardProp: (prop) => prop !== "customHeight",
})<{ customHeight?: number }>(({ theme, customHeight }) => ({
  height: customHeight || 8,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
  "& .MuiLinearProgress-bar": {
    borderRadius: theme.shape.borderRadius,
  },
}));

export function ProgressBar({
  value,
  total = 100,
  showLabel = true,
  labelFormat = "percent",
  height,
  ...props
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  const getLabel = () => {
    if (labelFormat === "count") {
      return `${value} / ${total}`;
    }
    return `${percentage}%`;
  };

  return (
    <Box sx={{ width: "100%", display: "flex", alignItems: "center", gap: 1 }}>
      <Box sx={{ flex: 1 }}>
        <StyledLinearProgress variant="determinate" value={percentage} customHeight={height} {...props} />
      </Box>
      {showLabel && (
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60, textAlign: "right" }}>
          {getLabel()}
        </Typography>
      )}
    </Box>
  );
}

export default ProgressBar;
