/**
 * 下拉刷新 Hook
 * 支持移动端下拉刷新页面数据
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface PullToRefreshConfig {
  /** 触发刷新的最小下拉距离 (px) */
  threshold?: number;
  /** 最大下拉距离 (px) */
  maxPullDistance?: number;
  /** 刷新回调 */
  onRefresh?: () => Promise<void>;
  /** 是否启用 */
  enabled?: boolean;
}

interface PullState {
  startY: number;
  isPulling: boolean;
}

export type RefreshStatus = "idle" | "pulling" | "ready" | "refreshing";

export function usePullToRefresh(config: PullToRefreshConfig = {}) {
  const { threshold = 80, maxPullDistance = 150, onRefresh, enabled = true } = config;

  const pullState = useRef<PullState>({ startY: 0, isPulling: false });
  const [pullDistance, setPullDistance] = useState(0);
  const [status, setStatus] = useState<RefreshStatus>("idle");
  const containerRef = useRef<HTMLDivElement>(null);

  const getScrollTop = useCallback(() => {
    // 检查页面是否在顶部
    return window.scrollY || document.documentElement.scrollTop || 0;
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled || status === "refreshing") return;

      // 只在页面顶部时启用下拉刷新
      if (getScrollTop() > 0) return;

      // 忽略在特定元素内的触摸
      const target = e.target as HTMLElement;
      if (target.closest(".pull-refresh-ignore") || target.closest('[data-pull-refresh-ignore="true"]')) {
        return;
      }

      const touch = e.touches[0];
      pullState.current = {
        startY: touch.clientY,
        isPulling: true,
      };
    },
    [enabled, status, getScrollTop],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !pullState.current.isPulling || status === "refreshing") return;

      // 再次检查是否在顶部
      if (getScrollTop() > 0) {
        pullState.current.isPulling = false;
        setPullDistance(0);
        setStatus("idle");
        return;
      }

      const touch = e.touches[0];
      const deltaY = touch.clientY - pullState.current.startY;

      // 只处理下拉（正值）
      if (deltaY <= 0) {
        setPullDistance(0);
        setStatus("idle");
        return;
      }

      // 应用阻尼效果
      const dampedDistance = Math.min(maxPullDistance, deltaY * 0.5);
      setPullDistance(dampedDistance);

      // 更新状态
      if (dampedDistance >= threshold) {
        setStatus("ready");
      } else {
        setStatus("pulling");
      }
    },
    [enabled, status, getScrollTop, threshold, maxPullDistance],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || !pullState.current.isPulling) return;

    pullState.current.isPulling = false;

    if (status === "ready" && onRefresh) {
      setStatus("refreshing");
      setPullDistance(threshold * 0.6); // 保持一定的下拉距离显示加载状态

      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh failed:", error);
      }
    }

    // 重置状态
    setPullDistance(0);
    setStatus("idle");
  }, [enabled, status, onRefresh, threshold]);

  useEffect(() => {
    if (!enabled) return;

    // 只在移动端启用
    const isMobile = window.matchMedia("(max-width: 900px)").matches;
    if (!isMobile) return;

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    pullDistance,
    status,
    isRefreshing: status === "refreshing",
    isPulling: status === "pulling" || status === "ready",
    isReady: status === "ready",
  };
}

export default usePullToRefresh;
