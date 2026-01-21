/**
 * 统一的卡片组件
 */

import { CardContent, CardHeader, Card as MuiCard, type CardProps as MuiCardProps, styled } from "@mui/material";
import type { ReactNode } from "react";

export interface CardProps extends Omit<MuiCardProps, "title"> {
  title?: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  noPadding?: boolean;
  children?: ReactNode;
}

const StyledCard = styled(MuiCard)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 1.5,
  transition: "box-shadow 0.2s ease-in-out",
  "&:hover": {
    boxShadow: theme.shadows[4],
  },
}));

export function Card({ title, subtitle, action, noPadding, children, ...props }: CardProps) {
  return (
    <StyledCard {...props}>
      {title && <CardHeader title={title} subheader={subtitle} action={action} sx={{ pb: 0 }} />}
      <CardContent sx={{ p: noPadding ? 0 : 2, "&:last-child": { pb: noPadding ? 0 : 2 } }}>{children}</CardContent>
    </StyledCard>
  );
}

export default Card;
