/**
 * 响应式侧边栏组件
 */

import { Article, Build, ChevronLeft, ChevronRight, Home, Info, Lan, Settings } from "@mui/icons-material";
import {
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  styled,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { layout } from "@/styles/theme";

const navItems = [
  { label: "主页", path: "/", icon: <Home /> },
  { label: "工具", path: "/tool", icon: <Build /> },
  { label: "网络", path: "/network", icon: <Lan /> },
  { label: "日志", path: "/logs", icon: <Article /> },
  { label: "设置", path: "/settings", icon: <Settings /> },
  { label: "关于", path: "/about", icon: <Info /> },
] as const;

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: "space-between",
}));

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== "sidebarOpen",
})<{ sidebarOpen: boolean }>(({ theme, sidebarOpen }) => ({
  width: sidebarOpen ? layout.drawerWidth : layout.drawerCollapsedWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  "& .MuiDrawer-paper": {
    width: sidebarOpen ? layout.drawerWidth : layout.drawerCollapsedWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: "hidden",
    borderRight: "none",
  },
}));

function NavItem({
  label,
  path,
  icon,
  isOpen,
  isActive,
}: {
  label: string;
  path: string;
  icon: ReactNode;
  isOpen: boolean;
  isActive: boolean;
}) {
  const content = (
    <ListItem disablePadding sx={{ display: "block" }}>
      <ListItemButton
        component={Link}
        to={path}
        sx={{
          minHeight: 48,
          justifyContent: isOpen ? "initial" : "center",
          px: 2.5,
          backgroundColor: isActive ? "action.selected" : "transparent",
          "&:hover": {
            backgroundColor: isActive ? "action.selected" : "action.hover",
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: isOpen ? 3 : "auto",
            justifyContent: "center",
            color: isActive ? "primary.main" : "inherit",
          }}
        >
          {icon}
        </ListItemIcon>
        <ListItemText
          primary={label}
          sx={{
            opacity: isOpen ? 1 : 0,
            "& .MuiTypography-root": {
              fontWeight: isActive ? 600 : 400,
              color: isActive ? "primary.main" : "inherit",
            },
          }}
        />
      </ListItemButton>
    </ListItem>
  );

  if (!isOpen) {
    return (
      <Tooltip title={label} placement="right">
        {content}
      </Tooltip>
    );
  }

  return content;
}

export function Sidebar({ open, onToggle, onClose }: SidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  // 移动端使用临时抽屉
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": {
            width: layout.drawerWidth,
          },
        }}
      >
        <DrawerHeader>
          <Typography variant="h6" sx={{ pl: 1 }}>
            MDCx
          </Typography>
          <IconButton onClick={onClose}>
            <ChevronLeft />
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {navItems.map((item) => (
            <NavItem
              key={item.path}
              label={item.label}
              path={item.path}
              icon={item.icon}
              isOpen={true}
              isActive={isActive(item.path)}
            />
          ))}
        </List>
      </Drawer>
    );
  }

  // 桌面端使用永久抽屉
  return (
    <StyledDrawer variant="permanent" sidebarOpen={open}>
      <DrawerHeader>
        {open && (
          <Typography variant="h6" sx={{ pl: 1 }}>
            MDCx
          </Typography>
        )}
        <IconButton onClick={onToggle}>{open ? <ChevronLeft /> : <ChevronRight />}</IconButton>
      </DrawerHeader>
      <Divider />
      <List>
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            label={item.label}
            path={item.path}
            icon={item.icon}
            isOpen={open}
            isActive={isActive(item.path)}
          />
        ))}
      </List>
    </StyledDrawer>
  );
}

export default Sidebar;
