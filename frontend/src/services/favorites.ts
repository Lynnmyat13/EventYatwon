import { api } from "@/services/api";
import type { ApiResponse } from "@/types/auth";
import type { Favorite } from "@/types/favorites";

export const getMyFavorites = async (): Promise<Favorite[]> => {
  const response =
    await api.get<ApiResponse<{ favorites: Favorite[] }>>("/favorites");
  return response.data.data.favorites;
};

export const getFavoriteStatus = async (eventId: string): Promise<boolean> => {
  const response = await api.get<ApiResponse<{ isFavorite: boolean }>>(
    `/favorites/${encodeURIComponent(eventId)}/status`,
  );
  return response.data.data.isFavorite;
};

export const addFavorite = async (eventId: string): Promise<Favorite> => {
  const response = await api.post<ApiResponse<{ favorite: Favorite }>>(
    `/favorites/${encodeURIComponent(eventId)}`,
  );
  return response.data.data.favorite;
};

export const removeFavorite = async (eventId: string): Promise<void> => {
  await api.delete(`/favorites/${encodeURIComponent(eventId)}`);
};
