/**
 * 移动端底部导航栏组件
 */

import { Article, Build, Home, Settings } from "@mui/icons-material";
import { BottomNavigation, BottomNavigationAction, Paper, styled } from "@mui/material";
import { Link, useLocation } from "@tanstack/react-router";
import { useMemo } from "react";

const navItems = [
  { label: "主页", value: "/", icon: <Home /> },
  { label: "工具", value: "/tool", icon: <Build /> },
  { label: "日志", value: "/logs", icon: <Article /> },
  { label: "设置", value: "/settings", icon: <Settings /> },
] as const;

const StyledPaper = styled(Paper)(({ theme }) => ({
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: theme.zIndex.appBar,
  display: "none",
  [theme.breakpoints.down("md")]: {
    display: "block",
  },
}));

const StyledBottomNavigation = styled(BottomNavigation)(({ theme }) => ({
  height: 56,
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
}));

export function MobileBottomNav() {
  const location = useLocation();

  const currentValue = useMemo(() => {
    const path = location.pathname;
    // 精确匹配或前缀匹配
    const matched = navItems.find((item) => path === item.value || (item.value !== "/" && path.startsWith(item.value)));
    return matched?.value || "/";
  }, [location.pathname]);

  return (
    <StyledPaper elevation={3}>
      <StyledBottomNavigation value={currentValue} showLabels>
        {navItems.map((item) => (
          <BottomNavigationAction
            key={item.value}
            label={item.label}
            value={item.value}
            icon={item.icon}
            component={Link}
            to={item.value}
          />
        ))}
      </StyledBottomNavigation>
    </StyledPaper>
  );
}

export default MobileBottomNav;
