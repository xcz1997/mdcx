/**
 * 统一的图标按钮组件
 */

import {
  IconButton as MuiIconButton,
  type IconButtonProps as MuiIconButtonProps,
  styled,
  Tooltip,
} from "@mui/material";
import type { ReactNode } from "react";

export interface IconButtonProps extends MuiIconButtonProps {
  tooltip?: string;
  icon?: ReactNode;
}

const StyledIconButton = styled(MuiIconButton)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
    transform: "scale(1.05)",
  },
}));

export function IconButton({ tooltip, icon, children, ...props }: IconButtonProps) {
  const button = <StyledIconButton {...props}>{icon || children}</StyledIconButton>;

  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow>
        {button}
      </Tooltip>
    );
  }

  return button;
}

export default IconButton;
