/**
 * 刮削状态管理
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type ScrapeStatus = "idle" | "scraping" | "paused" | "stopping";

export interface ScrapeResultItem {
  id: string;
  path: string;
  number?: string;
  title?: string;
  error?: string;
  timestamp: number;
}

export interface MediaInfo {
  number: string;
  title: string;
  actors: string[];
  release: string;
  runtime: string;
  outline: string;
  tags: string[];
  director: string;
  studio: string;
  series: string;
  publisher: string;
  source: string;
  score?: number;
  posterUrl?: string;
  thumbUrl?: string;
  filePath?: string;
  nfoPath?: string;
}

interface ScrapeStore {
  // 状态
  status: ScrapeStatus;
  current: number;
  total: number;
  success: number;
  failed: number;
  progress: number;

  // 结果列表
  successList: ScrapeResultItem[];
  failedList: ScrapeResultItem[];

  // 当前选中项
  selectedItem: ScrapeResultItem | null;

  // 当前媒体信息
  currentMedia: MediaInfo | null;

  // 刮削信息文本
  scrapeInfo: string;

  // Actions
  setStatus: (status: ScrapeStatus) => void;
  updateProgress: (data: { current: number; total: number; success: number; failed: number; progress: number }) => void;
  addSuccessItem: (item: Omit<ScrapeResultItem, "id" | "timestamp">) => void;
  addFailedItem: (item: Omit<ScrapeResultItem, "id" | "timestamp">) => void;
  setSelectedItem: (item: ScrapeResultItem | null) => void;
  setCurrentMedia: (media: MediaInfo | null) => void;
  setScrapeInfo: (info: string) => void;
  clearResults: () => void;
  reset: () => void;
}

let itemIdCounter = 0;

export const useScrapeStore = create<ScrapeStore>()(
  subscribeWithSelector((set) => ({
    status: "idle",
    current: 0,
    total: 0,
    success: 0,
    failed: 0,
    progress: 0,
    successList: [],
    failedList: [],
    selectedItem: null,
    currentMedia: null,
    scrapeInfo: "",

    setStatus: (status) => set({ status }),

    updateProgress: (data) =>
      set({
        current: data.current,
        total: data.total,
        success: data.success,
        failed: data.failed,
        progress: data.progress,
      }),

    addSuccessItem: (item) =>
      set((state) => ({
        successList: [
          ...state.successList,
          {
            ...item,
            id: `success-${++itemIdCounter}`,
            timestamp: Date.now(),
          },
        ],
        success: state.success + 1,
      })),

    addFailedItem: (item) =>
      set((state) => ({
        failedList: [
          ...state.failedList,
          {
            ...item,
            id: `failed-${++itemIdCounter}`,
            timestamp: Date.now(),
          },
        ],
        failed: state.failed + 1,
      })),

    setSelectedItem: (item) => set({ selectedItem: item }),

    setCurrentMedia: (media) => set({ currentMedia: media }),

    setScrapeInfo: (info) => set({ scrapeInfo: info }),

    clearResults: () =>
      set({
        successList: [],
        failedList: [],
        success: 0,
        failed: 0,
        current: 0,
        total: 0,
        progress: 0,
      }),

    reset: () =>
      set({
        status: "idle",
        current: 0,
        total: 0,
        success: 0,
        failed: 0,
        progress: 0,
        successList: [],
        failedList: [],
        selectedItem: null,
        currentMedia: null,
        scrapeInfo: "",
      }),
  })),
);
