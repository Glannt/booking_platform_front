import { apiFetch, ApiResponse } from "./client";

export interface FeedbackTranslationDto {
  id?: number;
  locale: string;
  title: string;
  review: string;
}

export interface FeedbackDto {
  id?: number;
  rating: number;
  author: string;
  avatarBg?: string;
  avatarText?: string;
  route?: string;
  showOnIndex?: boolean;
  orderIndex?: number;
  country?: string;
  translations: FeedbackTranslationDto[];
}

export async function getPublicFeedbacks(): Promise<ApiResponse<FeedbackDto[]>> {
  return apiFetch<ApiResponse<FeedbackDto[]>>("/api/v1/feedbacks");
}

export async function getAllFeedbacks(): Promise<ApiResponse<FeedbackDto[]>> {
  return apiFetch<ApiResponse<FeedbackDto[]>>("/api/v1/admin/feedbacks");
}

export async function getFeedbackById(id: number): Promise<ApiResponse<FeedbackDto>> {
  return apiFetch<ApiResponse<FeedbackDto>>(`/api/v1/admin/feedbacks/${id}`);
}

export async function createFeedback(payload: Omit<FeedbackDto, "id">): Promise<ApiResponse<FeedbackDto>> {
  return apiFetch<ApiResponse<FeedbackDto>>("/api/v1/admin/feedbacks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateFeedback(id: number, payload: Partial<FeedbackDto>): Promise<ApiResponse<FeedbackDto>> {
  return apiFetch<ApiResponse<FeedbackDto>>(`/api/v1/admin/feedbacks/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteFeedback(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/admin/feedbacks/${id}`, {
    method: "DELETE",
  });
}
