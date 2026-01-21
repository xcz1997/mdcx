/**
 * 面包屑导航组件
 */

import { Home as HomeIcon, NavigateNext as NavigateNextIcon } from "@mui/icons-material";
import { Breadcrumbs, Link as MuiLink, styled, Typography } from "@mui/material";
import { Link, useLocation } from "@tanstack/react-router";
import { useMemo } from "react";

// 路径到标签的映射
const pathLabels: Record<string, string> = {
  "/": "主页",
  "/tool": "工具",
  "/tool/single-scrape": "单视频刮削",
  "/tool/image-crop": "图片裁剪",
  "/tool/find-missing": "缺失番号查找",
  "/tool/move-videos": "视频移动",
  "/tool/symlink": "软链接创建",
  "/tool/file-management": "文件管理",
  "/tool/subtitle": "字幕工具",
  "/tool/actor": "演员信息",
  "/network": "网络检测",
  "/logs": "日志",
  "/settings": "设置",
  "/about": "关于",
};

const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  "& .MuiLink-root": {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
    "&:hover": {
      textDecoration: "underline",
    },
  },
}));

export function Breadcrumb() {
  const location = useLocation();

  const breadcrumbs = useMemo(() => {
    const paths = location.pathname.split("/").filter(Boolean);

    if (paths.length === 0) {
      return [];
    }

    const items: { path: string; label: string; isLast: boolean }[] = [];

    let currentPath = "";
    for (let i = 0; i < paths.length; i++) {
      currentPath += `/${paths[i]}`;
      const label = pathLabels[currentPath] || paths[i];
      items.push({
        path: currentPath,
        label,
        isLast: i === paths.length - 1,
      });
    }

    return items;
  }, [location.pathname]);

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <StyledBreadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
      <MuiLink component={Link} to="/" color="inherit" underline="hover">
        <HomeIcon fontSize="small" />
        主页
      </MuiLink>
      {breadcrumbs.map((item) =>
        item.isLast ? (
          <Typography key={item.path} color="text.primary">
            {item.label}
          </Typography>
        ) : (
          <MuiLink key={item.path} component={Link} to={item.path} color="inherit" underline="hover">
            {item.label}
          </MuiLink>
        ),
      )}
    </StyledBreadcrumbs>
  );
}

export default Breadcrumb;
