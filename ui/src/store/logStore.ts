import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { WebSocketMessage } from "@/hooks/useWebSocket";

// 日志级别类型
export type LogLevel = "info" | "success" | "warning" | "error" | "debug";

// 日志类型 (用于标签页分离)
export type LogType = "main" | "request";

// 日志条目接口, 对应服务器上 qt signal message
export interface LogEntry {
  name: string;
  data: string | object | null;
}

// 扩展的日志条目，包含解析后的额外信息
export interface ParsedLogEntry {
  id: string;
  timestamp: string;
  type: LogType;
  level: LogLevel;
  signalName: string;
  content: string;
  rawData: WebSocketMessage<LogEntry>;
}

// 失败项信息
export interface FailedItem {
  id: string;
  timestamp: string;
  content: string;
}

interface LogStore {
  // 原始日志
  logs: WebSocketMessage<LogEntry>[];
  // 解析后的日志
  parsedLogs: ParsedLogEntry[];
  // 失败列表
  failedList: FailedItem[];

  // 过滤设置
  searchQuery: string;
  levelFilter: LogLevel | "all";
  typeFilter: LogType | "all";

  // Actions
  addLog: (log: WebSocketMessage<LogEntry>) => void;
  clearLogs: () => void;
  clearFailedList: () => void;
  setSearchQuery: (query: string) => void;
  setLevelFilter: (level: LogLevel | "all") => void;
  setTypeFilter: (type: LogType | "all") => void;

  // Selectors
  getFilteredLogs: () => ParsedLogEntry[];
  getMainLogs: () => ParsedLogEntry[];
  getRequestLogs: () => ParsedLogEntry[];
}

// 根据信号名称判断日志类型
function getLogType(signalName: string): LogType {
  // 请求日志（详细日志）
  if (signalName === "detail_log" || signalName === "net_info") {
    return "request";
  }
  // 其他都是主日志
  return "main";
}

// 根据信号名称和内容判断日志级别
function getLogLevel(signalName: string, content: string): LogLevel {
  const lowerContent = content.toLowerCase();

  // 成功相关
  if (
    signalName === "view_success_file_settext" ||
    lowerContent.includes("成功") ||
    lowerContent.includes("success") ||
    lowerContent.includes("✓") ||
    lowerContent.includes("✅")
  ) {
    return "success";
  }

  // 错误相关
  if (
    signalName === "logs_failed_settext" ||
    signalName === "logs_failed_show" ||
    signalName === "view_failed_list_settext" ||
    lowerContent.includes("失败") ||
    lowerContent.includes("error") ||
    lowerContent.includes("错误") ||
    lowerContent.includes("❌") ||
    lowerContent.includes("异常")
  ) {
    return "error";
  }

  // 警告相关
  if (lowerContent.includes("warning") || lowerContent.includes("警告") || lowerContent.includes("⚠")) {
    return "warning";
  }

  // 调试信息
  if (signalName === "detail_log" || lowerContent.includes("debug")) {
    return "debug";
  }

  return "info";
}

// 解析日志内容
function parseLogContent(log: WebSocketMessage<LogEntry>): ParsedLogEntry {
  const signalName = log.data?.name || "unknown";
  const rawContent = log.data?.data;
  const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);

  return {
    id: log.message_id,
    timestamp: log.timestamp,
    type: getLogType(signalName),
    level: getLogLevel(signalName, content),
    signalName,
    content,
    rawData: log,
  };
}

// 检查是否是失败相关的信号
function isFailedSignal(signalName: string): boolean {
  return (
    signalName === "logs_failed_settext" ||
    signalName === "logs_failed_show" ||
    signalName === "view_failed_list_settext"
  );
}

const MAX_LOGS = 1000;

export const useLogStore = create<LogStore>()(
  subscribeWithSelector((set, get) => ({
    logs: [],
    parsedLogs: [],
    failedList: [],
    searchQuery: "",
    levelFilter: "all",
    typeFilter: "all",

    addLog: (log) =>
      set((state) => {
        const parsedLog = parseLogContent(log);

        // 更新原始日志
        const newLogs = [...state.logs, log];
        const newParsedLogs = [...state.parsedLogs, parsedLog];

        // 更新失败列表
        let newFailedList = state.failedList;
        if (isFailedSignal(parsedLog.signalName)) {
          newFailedList = [
            ...state.failedList,
            {
              id: parsedLog.id,
              timestamp: parsedLog.timestamp,
              content: parsedLog.content,
            },
          ];
          // 限制失败列表大小
          if (newFailedList.length > 100) {
            newFailedList = newFailedList.slice(-100);
          }
        }

        // 保持最多 MAX_LOGS 条日志以防止内存溢出
        if (newLogs.length > MAX_LOGS) {
          return {
            logs: newLogs.slice(-MAX_LOGS),
            parsedLogs: newParsedLogs.slice(-MAX_LOGS),
            failedList: newFailedList,
          };
        }
        return {
          logs: newLogs,
          parsedLogs: newParsedLogs,
          failedList: newFailedList,
        };
      }),

    clearLogs: () =>
      set({
        logs: [],
        parsedLogs: [],
      }),

    clearFailedList: () =>
      set({
        failedList: [],
      }),

    setSearchQuery: (query) => set({ searchQuery: query }),

    setLevelFilter: (level) => set({ levelFilter: level }),

    setTypeFilter: (type) => set({ typeFilter: type }),

    getFilteredLogs: () => {
      const { parsedLogs, searchQuery, levelFilter, typeFilter } = get();

      return parsedLogs.filter((log) => {
        // 类型过滤
        if (typeFilter !== "all" && log.type !== typeFilter) {
          return false;
        }

        // 级别过滤
        if (levelFilter !== "all" && log.level !== levelFilter) {
          return false;
        }

        // 搜索过滤
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return log.content.toLowerCase().includes(query) || log.signalName.toLowerCase().includes(query);
        }

        return true;
      });
    },

    getMainLogs: () => {
      const { parsedLogs, searchQuery, levelFilter } = get();

      return parsedLogs.filter((log) => {
        if (log.type !== "main") return false;

        if (levelFilter !== "all" && log.level !== levelFilter) {
          return false;
        }

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return log.content.toLowerCase().includes(query) || log.signalName.toLowerCase().includes(query);
        }

        return true;
      });
    },

    getRequestLogs: () => {
      const { parsedLogs, searchQuery, levelFilter } = get();

      return parsedLogs.filter((log) => {
        if (log.type !== "request") return false;

        if (levelFilter !== "all" && log.level !== levelFilter) {
          return false;
        }

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return log.content.toLowerCase().includes(query) || log.signalName.toLowerCase().includes(query);
        }

        return true;
      });
    },
  })),
);
