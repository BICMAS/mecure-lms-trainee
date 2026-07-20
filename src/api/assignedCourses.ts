import { getApiV1BaseUrl } from "@/config/api";
import { getAccessToken } from "@/utils/auth";
import { fetchWithAuthRetry } from "@/utils/fetchWithAuthRetry";

const BASE_URL = getApiV1BaseUrl();

export async function fetchAssignedCourses() {
  const token = getAccessToken();

  if (!token) {
    throw new Error("No access token");
  }

  const res = await fetchWithAuthRetry(`${BASE_URL}/assignments/assigned-courses`);

  if (res.status === 401) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Unauthorized");
  }

  if (!res.ok) {
    throw new Error("Failed to fetch assigned courses");
  }

  return res.json();
}
