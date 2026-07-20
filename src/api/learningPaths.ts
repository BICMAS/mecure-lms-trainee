import { getApiV1BaseUrl } from "@/config/api";
import { getAccessToken } from "@/utils/auth";
import { fetchWithAuthRetry } from "@/utils/fetchWithAuthRetry";

const BASE_URL = getApiV1BaseUrl();

export interface BackendLearningPath {
  id: string;
  title: string;
  description: string;
  curriculumSequence: string[];
  status: "DRAFT" | "PUBLISHED";
}

export async function fetchLearningPaths(): Promise<BackendLearningPath[]> {
  const token = getAccessToken();
  if (!token) throw new Error("No access token");

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);

  let res: Response;
  try {
    res = await fetchWithAuthRetry(`${BASE_URL}/learning-paths`, {
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error("Request to fetch learning paths timed out");
    }
    throw err;
  } finally {
    window.clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new Error("Failed to fetch learning paths");
  }

  return res.json();
}
