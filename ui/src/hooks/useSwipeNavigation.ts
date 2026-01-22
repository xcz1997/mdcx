/**
 * 移动端滑动导航 Hook
 * 支持左右滑动切换页面
 */

import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

// 导航路由顺序
const routes = ["/", "/tool", "/logs", "/settings", "/network", "/about"] as const;
type Route = (typeof routes)[number];

interface SwipeConfig {
  /** 触发滑动的最小距离 (px) */
  minSwipeDistance?: number;
  /** 触发滑动的最大垂直偏移 (px) */
  maxVerticalOffset?: number;
  /** 是否启用 */
  enabled?: boolean;
}

interface SwipeState {
  startX: number;
  startY: number;
  isSwiping: boolean;
}

export function useSwipeNavigation(currentPath: string, config: SwipeConfig = {}) {
  const { minSwipeDistance = 80, maxVerticalOffset = 100, enabled = true } = config;

  const navigate = useNavigate();
  const swipeState = useRef<SwipeState>({ startX: 0, startY: 0, isSwiping: false });
  const [swipeOffset, setSwipeOffset] = useState(0);

  const getCurrentRouteIndex = useCallback(() => {
    const index = routes.findIndex((r) => {
      if (r === "/") return currentPath === "/";
      return currentPath.startsWith(r);
    });
    return index === -1 ? 0 : index;
  }, [currentPath]);

  const navigateToRoute = useCallback(
    (direction: "left" | "right") => {
      const currentIndex = getCurrentRouteIndex();
      let newIndex: number;

      if (direction === "left") {
        // 左滑 -> 下一页
        newIndex = currentIndex + 1;
        if (newIndex >= routes.length) return; // 已经是最后一页
      } else {
        // 右滑 -> 上一页
        newIndex = currentIndex - 1;
        if (newIndex < 0) return; // 已经是第一页
      }

      navigate({ to: routes[newIndex] as Route });
    },
    [getCurrentRouteIndex, navigate],
  );

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;

      // 忽略在可滚动元素内的滑动
      const target = e.target as HTMLElement;
      if (target.closest(".swipe-ignore") || target.closest('[data-swipe-ignore="true"]')) {
        return;
      }

      const touch = e.touches[0];
      swipeState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        isSwiping: true,
      };
    },
    [enabled],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !swipeState.current.isSwiping) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - swipeState.current.startX;
      const deltaY = Math.abs(touch.clientY - swipeState.current.startY);

      // 如果垂直移动过大，取消滑动
      if (deltaY > maxVerticalOffset) {
        swipeState.current.isSwiping = false;
        setSwipeOffset(0);
        return;
      }

      // 更新视觉反馈（限制最大偏移）
      const maxOffset = 100;
      const offset = Math.max(-maxOffset, Math.min(maxOffset, deltaX * 0.3));
      setSwipeOffset(offset);
    },
    [enabled, maxVerticalOffset],
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !swipeState.current.isSwiping) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - swipeState.current.startX;
      const deltaY = Math.abs(touch.clientY - swipeState.current.startY);

      // 重置状态
      swipeState.current.isSwiping = false;
      setSwipeOffset(0);

      // 验证是否是有效的水平滑动
      if (Math.abs(deltaX) < minSwipeDistance || deltaY > maxVerticalOffset) {
        return;
      }

      // 执行导航
      navigateToRoute(deltaX < 0 ? "left" : "right");
    },
    [enabled, minSwipeDistance, maxVerticalOffset, navigateToRoute],
  );

  useEffect(() => {
    if (!enabled) return;

    // 只在移动端启用
    const isMobile = window.matchMedia("(max-width: 900px)").matches;
    if (!isMobile) return;

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    swipeOffset,
    currentRouteIndex: getCurrentRouteIndex(),
    totalRoutes: routes.length,
    routes,
  };
}

export default useSwipeNavigation;
