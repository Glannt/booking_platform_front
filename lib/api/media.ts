import { apiFetch, ApiResponse, backendUrl } from "./client";

export interface MediaDto {
  id: number;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  altText?: string;
}

export async function getMediaDetails(id: number): Promise<MediaDto> {
  const result = await apiFetch<any>(`/api/v1/admin/media/${id}`);
  return (result.data || result) as MediaDto;
}

export async function uploadMedia(file: File, altText: string): Promise<ApiResponse<{ media: MediaDto }>> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("altText", altText);

  return apiFetch<ApiResponse<{ media: MediaDto }>>("/api/v1/admin/media", {
    method: "POST",
    body: formData,
  });
}

export async function deleteMedia(id: number): Promise<void> {
  await apiFetch(`/api/v1/admin/media/${id}`, { method: "DELETE" });
}

export async function getMediaBatch(ids: number[]): Promise<MediaDto[]> {
  if (!ids || ids.length === 0) return [];
  const result = await apiFetch<any>(`/api/v1/admin/media/batch?ids=${ids.join(",")}`);
  const data = result.data || result;
  return Array.isArray(data) ? data as MediaDto[] : [];
}

/**
 * Resolve an array of image IDs into full URLs.
 * Returns array of { id, url } objects.
 */
export async function resolveImageUrls(
  imageIds: number[] | undefined | null
): Promise<{ id: number; url: string }[]> {
  if (!imageIds || imageIds.length === 0) return [];

  const results = await Promise.all(
    imageIds.map(async (id) => {
      try {
        const media = await getMediaDetails(id);
        const url = media.filePath.startsWith("http")
          ? media.filePath
          : `${backendUrl}${media.filePath}`;
        return { id, url };
      } catch {
        return null;
      }
    })
  );
  return results.filter(Boolean) as { id: number; url: string }[];
}
