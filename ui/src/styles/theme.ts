/**
 * MDCx Web UI 主题配置文件
 * Material Design 2 风格
 * 定义统一的色彩、间距、圆角、阴影系统
 */

import type { ThemeOptions } from "@mui/material/styles";

// Material Design 2 色彩系统
export const palette = {
  primary: {
    main: "#1976D2", // MD2 蓝色
    light: "#42A5F5",
    dark: "#1565C0",
    contrastText: "#fff",
  },
  secondary: {
    main: "#9C27B0", // MD2 紫色
    light: "#BA68C8",
    dark: "#7B1FA2",
    contrastText: "#fff",
  },
  success: {
    main: "#2E7D32", // MD2 绿色
    light: "#4CAF50",
    dark: "#1B5E20",
    contrastText: "#fff",
  },
  warning: {
    main: "#ED6C02", // MD2 橙色
    light: "#FF9800",
    dark: "#E65100",
    contrastText: "#fff",
  },
  error: {
    main: "#D32F2F", // MD2 红色
    light: "#EF5350",
    dark: "#C62828",
    contrastText: "#fff",
  },
  info: {
    main: "#0288D1", // MD2 浅蓝色
    light: "#03A9F4",
    dark: "#01579B",
    contrastText: "#fff",
  },
};

// 亮色主题背景 - MD2 Surface
export const lightBackground = {
  default: "#F5F5F5", // MD2 灰色背景
  paper: "#FFFFFF",
};

// 暗色主题背景 - 现代深色
export const darkBackground = {
  default: "#0a0a0a",  // 更深的背景
  paper: "#141414",    // 卡片背景
};

// 间距系统 (8px 基准) - MD2 标准
export const spacing = 8;

// 现代圆角系统
export const borderRadius = {
  xs: 4,
  sm: 10,   // 输入框、按钮
  md: 14,   // 中等组件
  lg: 16,   // 卡片
  xl: 20,   // 对话框
  round: 9999,
};

// 现代柔和阴影系统
export const elevation = {
  0: "none",
  1: "0px 2px 4px rgba(0,0,0,0.05), 0px 1px 2px rgba(0,0,0,0.08)",
  2: "0px 4px 8px rgba(0,0,0,0.06), 0px 2px 4px rgba(0,0,0,0.08)",
  3: "0px 8px 16px rgba(0,0,0,0.08), 0px 4px 8px rgba(0,0,0,0.06)",
  4: "0px 12px 24px rgba(0,0,0,0.10), 0px 6px 12px rgba(0,0,0,0.06)",
  6: "0px 20px 40px rgba(0,0,0,0.12), 0px 8px 16px rgba(0,0,0,0.08)",
};

// 响应式断点
export const breakpoints = {
  xs: 0, // 手机竖屏
  sm: 600, // 手机横屏 / 小平板
  md: 900, // 平板
  lg: 1200, // 桌面
  xl: 1536, // 大屏桌面
};

// 布局常量
export const layout = {
  drawerWidth: 256, // MD2 侧边栏宽度
  drawerCollapsedWidth: 72, // MD2 收起宽度
  appBarHeight: 64, // 顶部导航栏高度
  mobileNavHeight: 56, // 移动端底部导航栏高度
  contentMaxWidth: 1200, // 内容最大宽度
};

// 现代排版系统（含中文字体）
export const typography = {
  fontFamily: [
    "-apple-system",
    "BlinkMacSystemFont",
    '"Segoe UI"',
    "Roboto",
    '"PingFang SC"',      // macOS 中文
    '"Hiragino Sans GB"', // macOS 中文备选
    '"Microsoft YaHei"',  // Windows 中文
    '"Helvetica Neue"',
    "Arial",
    "sans-serif",
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
  ].join(","),
  h1: {
    fontSize: "2.125rem", // 34px
    fontWeight: 400,
    letterSpacing: "0.00735em",
    lineHeight: 1.235,
  },
  h2: {
    fontSize: "1.5rem", // 24px
    fontWeight: 400,
    letterSpacing: "0em",
    lineHeight: 1.334,
  },
  h3: {
    fontSize: "1.25rem", // 20px
    fontWeight: 500,
    letterSpacing: "0.0075em",
    lineHeight: 1.6,
  },
  h4: {
    fontSize: "1.125rem", // 18px
    fontWeight: 500,
    letterSpacing: "0.00938em",
    lineHeight: 1.5,
  },
  h5: {
    fontSize: "1rem", // 16px
    fontWeight: 500,
    letterSpacing: "0em",
    lineHeight: 1.5,
  },
  h6: {
    fontSize: "0.875rem", // 14px
    fontWeight: 500,
    letterSpacing: "0.0075em",
    lineHeight: 1.57,
  },
  subtitle1: {
    fontSize: "1rem",
    fontWeight: 400,
    letterSpacing: "0.00938em",
    lineHeight: 1.75,
  },
  subtitle2: {
    fontSize: "0.875rem",
    fontWeight: 500,
    letterSpacing: "0.00714em",
    lineHeight: 1.57,
  },
  body1: {
    fontSize: "1rem",
    fontWeight: 400,
    letterSpacing: "0.00938em",
    lineHeight: 1.5,
  },
  body2: {
    fontSize: "0.875rem",
    fontWeight: 400,
    letterSpacing: "0.01071em",
    lineHeight: 1.43,
  },
  button: {
    fontSize: "0.875rem",
    fontWeight: 500,
    letterSpacing: "0.02857em",
    lineHeight: 1.75,
    textTransform: "none" as const,
  },
  caption: {
    fontSize: "0.75rem",
    fontWeight: 400,
    letterSpacing: "0.03333em",
    lineHeight: 1.66,
  },
  overline: {
    fontSize: "0.625rem",
    fontWeight: 500,
    letterSpacing: "0.08333em",
    lineHeight: 2.66,
    textTransform: "uppercase" as const,
  },
};

// MD2 亮色主题配置
export const lightThemeOptions: ThemeOptions = {
  palette: {
    mode: "light",
    ...palette,
    background: lightBackground,
    divider: "rgba(0, 0, 0, 0.12)",
    text: {
      primary: "rgba(0, 0, 0, 0.87)",
      secondary: "rgba(0, 0, 0, 0.6)",
      disabled: "rgba(0, 0, 0, 0.38)",
    },
  },
  spacing,
  shape: {
    borderRadius: borderRadius.sm,
  },
  typography,
  breakpoints: {
    values: breakpoints,
  },
  components: {
    // 卡片 - 现代风格
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: borderRadius.lg,
          border: "1px solid rgba(0, 0, 0, 0.06)",
          boxShadow: elevation[1],
          transition: "box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out",
          "&:hover": {
            boxShadow: elevation[2],
            borderColor: "rgba(0, 0, 0, 0.1)",
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 20,
          "&:last-child": {
            paddingBottom: 20,
          },
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: "16px 20px",
        },
        title: {
          fontSize: "1rem",
          fontWeight: 600,
        },
        subheader: {
          fontSize: "0.875rem",
          marginTop: 2,
        },
      },
    },
    MuiCardActions: {
      styleOverrides: {
        root: {
          padding: "12px 20px",
        },
      },
    },
    // Paper - 现代 Surface
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: borderRadius.lg,
        },
        elevation0: {
          boxShadow: "none",
          border: "1px solid rgba(0, 0, 0, 0.06)",
        },
        elevation1: {
          boxShadow: elevation[1],
        },
        elevation2: {
          boxShadow: elevation[2],
        },
        elevation3: {
          boxShadow: elevation[3],
        },
        elevation4: {
          boxShadow: elevation[4],
        },
      },
    },
    // 按钮 - 现代风格
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: borderRadius.sm,
          textTransform: "none",
          fontWeight: 500,
          padding: "10px 20px",
          minHeight: 40,
          transition: "all 0.2s ease-in-out",
        },
        contained: {
          boxShadow: elevation[1],
          "&:hover": {
            boxShadow: elevation[2],
            transform: "translateY(-1px)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
        },
        outlined: {
          borderWidth: 1.5,
          borderColor: "rgba(25, 118, 210, 0.5)",
          "&:hover": {
            borderWidth: 1.5,
            backgroundColor: "rgba(25, 118, 210, 0.06)",
            borderColor: "rgba(25, 118, 210, 0.8)",
          },
        },
        text: {
          "&:hover": {
            backgroundColor: "rgba(25, 118, 210, 0.06)",
          },
        },
        sizeSmall: {
          padding: "6px 14px",
          minHeight: 34,
        },
        sizeLarge: {
          padding: "12px 28px",
          minHeight: 48,
        },
      },
    },
    MuiButtonGroup: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.sm,
          boxShadow: elevation[2],
        },
      },
    },
    // FAB - MD2 浮动按钮
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: elevation[3],
          "&:hover": {
            boxShadow: elevation[4],
          },
        },
      },
    },
    // 图标按钮
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.sm,
          padding: 10,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.06)",
          },
        },
      },
    },
    // Chip - 现代标签
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.sm,
          height: 32,
          fontWeight: 500,
          transition: "all 0.2s ease-in-out",
        },
        sizeSmall: {
          height: 26,
          fontSize: "0.75rem",
        },
        outlined: {
          borderColor: "rgba(0, 0, 0, 0.15)",
          "&:hover": {
            borderColor: "rgba(0, 0, 0, 0.3)",
            backgroundColor: "rgba(0, 0, 0, 0.02)",
          },
        },
        filled: {
          "&:hover": {
            boxShadow: elevation[1],
          },
        },
      },
    },
    // 输入框 - 现代风格
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "small",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.sm,
          transition: "all 0.2s ease-in-out",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0, 0, 0, 0.4)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderWidth: 2,
          },
        },
        input: {
          padding: "12px 14px",
        },
        inputSizeSmall: {
          padding: "10px 12px",
        },
        notchedOutline: {
          borderColor: "rgba(0, 0, 0, 0.15)",
          transition: "border-color 0.2s ease-in-out",
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: "0.875rem",
          "&.Mui-focused": {
            fontWeight: 500,
          },
        },
        sizeSmall: {
          fontSize: "0.875rem",
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          padding: "10px 12px",
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          borderRadius: `${borderRadius.sm}px ${borderRadius.sm}px 0 0`,
          backgroundColor: "rgba(0, 0, 0, 0.06)",
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.09)",
          },
          "&.Mui-focused": {
            backgroundColor: "rgba(0, 0, 0, 0.06)",
          },
        },
      },
    },
    // 列表 - MD2 风格
    MuiList: {
      styleOverrides: {
        root: {
          padding: "8px 0",
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          paddingTop: 8,
          paddingBottom: 8,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.04)",
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(25, 118, 210, 0.08)",
            "&:hover": {
              backgroundColor: "rgba(25, 118, 210, 0.12)",
            },
          },
        },
      },
    },
    // 对话框 - 现代风格
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: borderRadius.xl,
          boxShadow: elevation[6],
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: "1.25rem",
          fontWeight: 600,
          padding: "20px 24px 12px",
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: "12px 24px 20px",
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "12px 20px 20px",
          gap: 8,
        },
      },
    },
    // 抽屉 - MD2 风格
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "none",
          boxShadow: elevation[4],
        },
      },
    },
    // 应用栏 - MD2 风格
    MuiAppBar: {
      defaultProps: {
        elevation: 4,
      },
      styleOverrides: {
        root: {
          boxShadow: elevation[4],
        },
      },
    },
    // 表格 - MD2 风格
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: "separate",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-root": {
            fontWeight: 500,
            backgroundColor: "rgba(0, 0, 0, 0.02)",
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.04)",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
          padding: "12px 16px",
        },
      },
    },
    // Tab - 现代风格
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          minWidth: 80,
          padding: "12px 16px",
          borderRadius: `${borderRadius.sm}px ${borderRadius.sm}px 0 0`,
          transition: "all 0.2s ease-in-out",
          "&.Mui-selected": {
            fontWeight: 600,
          },
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.04)",
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 44,
        },
        indicator: {
          height: 3,
          borderRadius: "3px 3px 0 0",
        },
        scrollButtons: {
          "&.Mui-disabled": {
            opacity: 0.3,
          },
        },
      },
    },
    // 工具提示 - MD2 风格
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "rgba(97, 97, 97, 0.92)",
          borderRadius: borderRadius.xs,
          fontSize: "0.75rem",
          padding: "4px 8px",
        },
      },
    },
    // 进度条 - MD2 风格
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.round,
          height: 4,
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          // MD2 默认样式
        },
      },
    },
    // 分割线
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(0, 0, 0, 0.12)",
        },
      },
    },
    // 徽章
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontWeight: 500,
        },
      },
    },
    // 警告框 - MD2 风格
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.sm,
        },
        standardSuccess: {
          backgroundColor: "rgba(46, 125, 50, 0.12)",
        },
        standardError: {
          backgroundColor: "rgba(211, 47, 47, 0.12)",
        },
        standardWarning: {
          backgroundColor: "rgba(237, 108, 2, 0.12)",
        },
        standardInfo: {
          backgroundColor: "rgba(2, 136, 209, 0.12)",
        },
      },
    },
    // Accordion - MD2 风格
    MuiAccordion: {
      defaultProps: {
        elevation: 1,
      },
      styleOverrides: {
        root: {
          borderRadius: borderRadius.sm,
          "&:before": {
            display: "none",
          },
          "&.Mui-expanded": {
            margin: "8px 0",
            boxShadow: elevation[2],
          },
        },
      },
    },
  },
};

// MD2 暗色主题配置
export const darkThemeOptions: ThemeOptions = {
  palette: {
    mode: "dark",
    primary: {
      main: "#90CAF9",
      light: "#E3F2FD",
      dark: "#42A5F5",
      contrastText: "rgba(0, 0, 0, 0.87)",
    },
    secondary: {
      main: "#CE93D8",
      light: "#F3E5F5",
      dark: "#AB47BC",
      contrastText: "rgba(0, 0, 0, 0.87)",
    },
    success: {
      main: "#81C784",
      light: "#C8E6C9",
      dark: "#66BB6A",
    },
    warning: {
      main: "#FFB74D",
      light: "#FFE0B2",
      dark: "#FFA726",
    },
    error: {
      main: "#EF5350",
      light: "#FFCDD2",
      dark: "#E53935",
    },
    info: {
      main: "#4FC3F7",
      light: "#B3E5FC",
      dark: "#29B6F6",
    },
    background: darkBackground,
    divider: "rgba(255, 255, 255, 0.12)",
    text: {
      primary: "#FFFFFF",
      secondary: "rgba(255, 255, 255, 0.7)",
      disabled: "rgba(255, 255, 255, 0.5)",
    },
  },
  spacing,
  shape: {
    borderRadius: borderRadius.sm,
  },
  typography,
  breakpoints: {
    values: breakpoints,
  },
  components: {
    // 卡片 - 现代暗色模式
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: borderRadius.lg,
          backgroundColor: "#141414",
          backgroundImage: "none",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          transition: "border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
          "&:hover": {
            borderColor: "rgba(255, 255, 255, 0.12)",
            boxShadow: "0px 4px 12px rgba(0,0,0,0.4)",
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 20,
          "&:last-child": {
            paddingBottom: 20,
          },
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: "16px 20px",
        },
        title: {
          fontSize: "1rem",
          fontWeight: 600,
        },
        subheader: {
          fontSize: "0.875rem",
          color: "rgba(255, 255, 255, 0.6)",
          marginTop: 2,
        },
      },
    },
    // Paper - 现代暗色 Surface
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: borderRadius.lg,
          backgroundColor: "#141414",
        },
        elevation0: {
          border: "1px solid rgba(255, 255, 255, 0.06)",
        },
      },
    },
    // 按钮 - 现代暗色风格
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: borderRadius.sm,
          textTransform: "none",
          fontWeight: 500,
          padding: "10px 20px",
          minHeight: 40,
          transition: "all 0.2s ease-in-out",
        },
        contained: {
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0px 4px 12px rgba(0,0,0,0.4)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
        },
        outlined: {
          borderWidth: 1.5,
          borderColor: "rgba(144, 202, 249, 0.4)",
          "&:hover": {
            borderWidth: 1.5,
            borderColor: "rgba(144, 202, 249, 0.7)",
            backgroundColor: "rgba(144, 202, 249, 0.1)",
          },
        },
        text: {
          "&:hover": {
            backgroundColor: "rgba(144, 202, 249, 0.1)",
          },
        },
        sizeSmall: {
          padding: "6px 14px",
          minHeight: 34,
        },
        sizeLarge: {
          padding: "12px 28px",
          minHeight: 48,
        },
      },
    },
    // 图标按钮
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.sm,
          padding: 10,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
    },
    // Chip - 现代暗色
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.sm,
          height: 32,
          fontWeight: 500,
          transition: "all 0.2s ease-in-out",
        },
        sizeSmall: {
          height: 26,
          fontSize: "0.75rem",
        },
        outlined: {
          borderColor: "rgba(255, 255, 255, 0.15)",
          "&:hover": {
            borderColor: "rgba(255, 255, 255, 0.3)",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
          },
        },
      },
    },
    // 输入框 - 现代暗色风格
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.sm,
          transition: "all 0.2s ease-in-out",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255, 255, 255, 0.35)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderWidth: 2,
          },
        },
        input: {
          padding: "12px 14px",
        },
        inputSizeSmall: {
          padding: "10px 12px",
        },
        notchedOutline: {
          borderColor: "rgba(255, 255, 255, 0.12)",
          transition: "border-color 0.2s ease-in-out",
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: "0.875rem",
          "&.Mui-focused": {
            fontWeight: 500,
          },
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          borderRadius: `${borderRadius.sm}px ${borderRadius.sm}px 0 0`,
          backgroundColor: "rgba(255, 255, 255, 0.06)",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          },
          "&.Mui-focused": {
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          },
        },
      },
    },
    // 列表
    MuiListItemButton: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(144, 202, 249, 0.16)",
            "&:hover": {
              backgroundColor: "rgba(144, 202, 249, 0.24)",
            },
          },
        },
      },
    },
    // 对话框 - 现代暗色风格
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: borderRadius.xl,
          backgroundColor: "#1a1a1a",
          backgroundImage: "none",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: "1.25rem",
          fontWeight: 600,
          padding: "20px 24px 12px",
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: "12px 24px 20px",
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "12px 20px 20px",
          gap: 8,
        },
      },
    },
    // 抽屉 - 现代暗色风格
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#0f0f0f",
          backgroundImage: "none",
          borderRight: "1px solid rgba(255, 255, 255, 0.06)",
        },
      },
    },
    // 表格 - MD2 暗色风格
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-root": {
            fontWeight: 500,
            backgroundColor: "rgba(255, 255, 255, 0.05)",
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
        },
      },
    },
    // Tab - 现代暗色风格
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          minWidth: 80,
          padding: "12px 16px",
          borderRadius: `${borderRadius.sm}px ${borderRadius.sm}px 0 0`,
          transition: "all 0.2s ease-in-out",
          "&.Mui-selected": {
            fontWeight: 600,
          },
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.06)",
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 44,
        },
        indicator: {
          height: 3,
          borderRadius: "3px 3px 0 0",
        },
      },
    },
    // 工具提示 - MD2 暗色风格
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "rgba(245, 245, 245, 0.92)",
          color: "rgba(0, 0, 0, 0.87)",
          borderRadius: borderRadius.xs,
        },
      },
    },
    // 分割线
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(255, 255, 255, 0.12)",
        },
      },
    },
    // 警告框 - MD2 暗色风格
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.sm,
        },
        standardSuccess: {
          backgroundColor: "rgba(129, 199, 132, 0.16)",
        },
        standardError: {
          backgroundColor: "rgba(239, 83, 80, 0.16)",
        },
        standardWarning: {
          backgroundColor: "rgba(255, 183, 77, 0.16)",
        },
        standardInfo: {
          backgroundColor: "rgba(79, 195, 247, 0.16)",
        },
      },
    },
    // Accordion - MD2 暗色风格
    MuiAccordion: {
      defaultProps: {
        elevation: 1,
      },
      styleOverrides: {
        root: {
          borderRadius: borderRadius.sm,
          backgroundColor: "#1E1E1E",
          backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))",
          "&:before": {
            display: "none",
          },
          "&.Mui-expanded": {
            margin: "8px 0",
          },
        },
      },
    },
  },
};
