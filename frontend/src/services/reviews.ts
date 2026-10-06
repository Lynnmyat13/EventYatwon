import axios from "axios";
import { api } from "@/services/api";
import type { ApiResponse } from "@/types/auth";
import type { Review, ReviewListData } from "@/types/reviews";

interface ReviewInput {
  rating: number;
  comment: string;
}

export const getEventReviews = async (
  eventId: string,
  page: number,
): Promise<ReviewListData> => {
  const response = await api.get<ApiResponse<ReviewListData>>(
    `/events/${encodeURIComponent(eventId)}/reviews`,
    { params: { page, limit: 5 } },
  );
  return response.data.data;
};

export const createReview = async (
  eventId: string,
  input: ReviewInput,
): Promise<Review> => {
  const response = await api.post<ApiResponse<{ review: Review }>>(
    `/events/${encodeURIComponent(eventId)}/reviews`,
    input,
  );
  return response.data.data.review;
};

export const updateReview = async (
  reviewId: string,
  input: ReviewInput,
): Promise<Review> => {
  const response = await api.put<ApiResponse<{ review: Review }>>(
    `/reviews/${encodeURIComponent(reviewId)}`,
    input,
  );
  return response.data.data.review;
};

export const deleteReview = async (reviewId: string): Promise<void> => {
  await api.delete(`/reviews/${encodeURIComponent(reviewId)}`);
};

export const getReviewErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || "Review request failed.";
  }
  return "Review request failed.";
};
