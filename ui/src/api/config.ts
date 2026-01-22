/**
 * 配置管理 API 扩展
 * 这个文件包含了自动生成的客户端代码中尚未包含的 API 函数
 */

import type { UseQueryOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { client } from "@/client/client.gen";

// 类型定义
export interface ConfigFileInfo {
  name: string;
  filename: string;
  is_active: boolean;
}

export interface ConfigListResponse {
  configs: ConfigFileInfo[];
  active: string;
}

const security = [{ name: "X-API-KEY", type: "apiKey" as const }];

// API 函数
export async function listConfigs(): Promise<ConfigListResponse> {
  const response = await client.get<ConfigListResponse>({
    url: "/api/v1/config/list",
    security,
  });
  return response.data as ConfigListResponse;
}

// React Query Options
export function listConfigsOptions(): UseQueryOptions<ConfigListResponse, AxiosError> {
  return {
    queryKey: ["config", "list"],
    queryFn: listConfigs,
  };
}
