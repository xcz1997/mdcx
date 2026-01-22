/**
 * 滑动导航指示器组件
 * 显示当前页面位置和可滑动方向提示
 */

import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Box, useTheme } from "@mui/material";

interface SwipeIndicatorProps {
  swipeOffset: number;
  currentIndex: number;
  totalPages: number;
}

export function SwipeIndicator({ swipeOffset, currentIndex, totalPages }: SwipeIndicatorProps) {
  const theme = useTheme();
  const canGoLeft = currentIndex > 0;
  const canGoRight = currentIndex < totalPages - 1;

  // 只在有滑动偏移时显示方向指示
  const showLeftIndicator = canGoLeft && swipeOffset > 20;
  const showRightIndicator = canGoRight && swipeOffset < -20;

  return (
    <>
      {/* 左侧指示器 */}
      {showLeftIndicator && (
        <Box
          sx={{
            position: "fixed",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: 40,
            height: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(0, 0, 0, 0.3)",
            borderRadius: "0 8px 8px 0",
            opacity: Math.min(1, swipeOffset / 50),
            transition: "opacity 0.1s ease-out",
            zIndex: 1200,
            pointerEvents: "none",
          }}
        >
          <ChevronLeft sx={{ color: "white", fontSize: 32 }} />
        </Box>
      )}

      {/* 右侧指示器 */}
      {showRightIndicator && (
        <Box
          sx={{
            position: "fixed",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: 40,
            height: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(0, 0, 0, 0.3)",
            borderRadius: "8px 0 0 8px",
            opacity: Math.min(1, Math.abs(swipeOffset) / 50),
            transition: "opacity 0.1s ease-out",
            zIndex: 1200,
            pointerEvents: "none",
          }}
        >
          <ChevronRight sx={{ color: "white", fontSize: 32 }} />
        </Box>
      )}

      {/* 底部页面指示点 */}
      <Box
        sx={{
          position: "fixed",
          bottom: 70, // 在底部导航栏上方
          left: "50%",
          transform: "translateX(-50%)",
          display: { xs: "flex", md: "none" },
          gap: 0.5,
          zIndex: 1200,
          bgcolor: "rgba(0, 0, 0, 0.3)",
          borderRadius: 2,
          px: 1,
          py: 0.5,
        }}
      >
        {Array.from({ length: totalPages }).map((_, index) => (
          <Box
            key={index}
            sx={{
              width: index === currentIndex ? 16 : 6,
              height: 6,
              borderRadius: 3,
              bgcolor: index === currentIndex ? theme.palette.primary.main : "rgba(255, 255, 255, 0.5)",
              transition: "all 0.2s ease-out",
            }}
          />
        ))}
      </Box>
    </>
  );
}

export default SwipeIndicator;
