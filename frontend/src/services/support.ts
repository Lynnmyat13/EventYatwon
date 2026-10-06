import axios from "axios";
import { api } from "@/services/api";
import type { ApiResponse } from "@/types/auth";

export type SupportTopic =
  "registration" | "tickets" | "account" | "events" | "other";

export interface SupportInput {
  name: string;
  email: string;
  topic: SupportTopic;
  message: string;
}

export const submitSupportRequest = async (
  input: SupportInput,
): Promise<{ id: string; createdAt: string }> => {
  const response = await api.post<
    ApiResponse<{ id: string; createdAt: string }>
  >("/support", input);
  return response.data.data;
};

export const getSupportError = (error: unknown): string =>
  axios.isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message || "Your request could not be submitted."
    : "Your request could not be submitted.";
