/**
 * 工具功能 API 扩展
 * 这个文件包含了自动生成的客户端代码中尚未包含的 API 函数
 */

import type { UseMutationOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { client } from "@/client/client.gen";

// 类型定义
export interface KodiActorsBody {
  mode: "add" | "del";
}

export interface ActorListBody {
  filter_mode: number;
}

export interface MessageResponse {
  message: string;
}

const security = [{ name: "X-API-KEY", type: "apiKey" as const }];

// API 函数
export async function manageKodiActors(body: KodiActorsBody): Promise<MessageResponse> {
  const response = await client.post<MessageResponse>({
    url: "/api/v1/tools/kodi-actors",
    body,
    security,
  });
  return response.data as MessageResponse;
}

export async function showActorList(body: ActorListBody): Promise<MessageResponse> {
  const response = await client.post<MessageResponse>({
    url: "/api/v1/tools/actor-list",
    body,
    security,
  });
  return response.data as MessageResponse;
}

export async function updateActorPhotos(): Promise<MessageResponse> {
  const response = await client.post<MessageResponse>({
    url: "/api/v1/tools/actor-photos",
    security,
  });
  return response.data as MessageResponse;
}

// React Query Mutation Options
export function manageKodiActorsMutation(): UseMutationOptions<MessageResponse, AxiosError, { body: KodiActorsBody }> {
  return {
    mutationFn: async ({ body }) => manageKodiActors(body),
  };
}

export function showActorListMutation(): UseMutationOptions<MessageResponse, AxiosError, { body: ActorListBody }> {
  return {
    mutationFn: async ({ body }) => showActorList(body),
  };
}

export function updateActorPhotosMutation(): UseMutationOptions<MessageResponse, AxiosError, void> {
  return {
    mutationFn: async () => updateActorPhotos(),
  };
}
