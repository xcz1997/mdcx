/**
 * 状态标签组件
 */

import {
  Error as ErrorIcon,
  Info as InfoIcon,
  HourglassEmpty as PendingIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { Chip, type ChipProps, styled } from "@mui/material";

export type StatusType = "success" | "error" | "warning" | "info" | "pending" | "idle";

export interface StatusBadgeProps extends Omit<ChipProps, "color"> {
  status: StatusType;
  showIcon?: boolean;
}

const statusConfig: Record<StatusType, { color: ChipProps["color"]; icon: React.ReactNode; label: string }> = {
  success: { color: "success", icon: <SuccessIcon fontSize="small" />, label: "成功" },
  error: { color: "error", icon: <ErrorIcon fontSize="small" />, label: "失败" },
  warning: { color: "warning", icon: <WarningIcon fontSize="small" />, label: "警告" },
  info: { color: "info", icon: <InfoIcon fontSize="small" />, label: "信息" },
  pending: { color: "default", icon: <PendingIcon fontSize="small" />, label: "等待中" },
  idle: { color: "default", icon: null, label: "空闲" },
};

const StyledChip = styled(Chip)(({ theme }) => ({
  fontWeight: 500,
  "& .MuiChip-icon": {
    marginLeft: theme.spacing(0.5),
  },
}));

export function StatusBadge({ status, showIcon = true, label, ...props }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <StyledChip
      size="small"
      color={config.color}
      icon={showIcon && config.icon ? config.icon : undefined}
      label={label || config.label}
      {...props}
    />
  );
}

export default StatusBadge;
