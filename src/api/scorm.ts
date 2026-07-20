import { getApiV1BaseUrl } from "@/config/api";
import { getAccessToken } from "@/utils/auth";
import { fetchWithAuthRetry } from "@/utils/fetchWithAuthRetry";
import type { ScormManifestResponse } from "@/types";

interface ScormLaunchResponse {
  success: boolean;
  launchUrl: string;
  scormAttemptId: string;
  message?: string;
}

interface ScormLaunchContext {
  courseId?: string | null;
  assignmentId?: string | null;
  lessonId?: string | null;
  moduleId?: string | null;
}


const BASE_URL = getApiV1BaseUrl();

/**
 * Fetch raw SCORM manifest from backend
 */
export const fetchScormManifest = async (
  scormPackageId: string
): Promise<ScormManifestResponse> => {
  if (!scormPackageId) {
    throw new Error("Missing scormPackageId");
  }

  const res = await fetchWithAuthRetry(
    `${BASE_URL}/scorm-packages/${scormPackageId}/manifest`,
  );

  if (!res.ok) {
    throw new Error("Failed to load SCORM manifest");
  }

  return res.json();
};


export const fetchScormLaunchUrl = async (
  scormPackageId: string,
  context?: ScormLaunchContext
): Promise<ScormLaunchResponse> => {
  if (!scormPackageId || !scormPackageId.trim()) {
    throw new Error("Missing scormPackageId");
  }

  if (!getAccessToken()) {
    throw new Error("No access token");
  }

  const resolveAssignmentId = async (
    inputContext?: ScormLaunchContext,
  ): Promise<string | null> => {
    if (inputContext?.assignmentId) return inputContext.assignmentId;
    if (!inputContext?.courseId) return null;

    try {
      const res = await fetchWithAuthRetry(
        `${BASE_URL}/assignments/assigned-courses`,
        { headers: { Accept: "application/json" } },
      );

      if (!res.ok) return null;
      const payload = await res.json();
      const list = Array.isArray(payload) ? payload : payload?.data;
      if (!Array.isArray(list)) return null;

      const match = list.find(
        (item: any) =>
          item?.courseId === inputContext.courseId ||
          item?.course?.id === inputContext.courseId,
      );

      return match?.assignmentId ?? match?.id ?? null;
    } catch {
      return null;
    }
  };

  const resolvedAssignmentId = await resolveAssignmentId(context);
  const launchContext: ScormLaunchContext = {
    ...context,
    assignmentId: resolvedAssignmentId,
  };

  const queryParams = new URLSearchParams();
  if (launchContext.courseId) queryParams.set("courseId", launchContext.courseId);
  if (launchContext.assignmentId) queryParams.set("assignmentId", launchContext.assignmentId);
  if (launchContext.lessonId) queryParams.set("lessonId", launchContext.lessonId);
  if (launchContext.moduleId) queryParams.set("moduleId", launchContext.moduleId);

  const launchGetEndpoint =
    `${BASE_URL}/scorm-packages/${encodeURIComponent(scormPackageId)}/launch` +
    (queryParams.toString() ? `?${queryParams.toString()}` : "");

  const parseLaunchResponse = (payload: any): ScormLaunchResponse | null => {
    const root = payload?.data ?? payload;
    const launchUrl = root?.launchUrl ?? root?.launchURL ?? root?.url ?? root?.launchLink;
    const scormAttemptId =
      root?.scormAttemptId ?? root?.attemptId ?? root?.attempt?.id ?? root?.registrationId;

    if (!launchUrl || !scormAttemptId) return null;

    return {
      success: payload?.success ?? true,
      launchUrl,
      scormAttemptId,
      message: payload?.message,
    };
  };

  const readJsonBody = async (res: Response) => {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  type LaunchAttempt = {
    method: "GET" | "POST";
    endpoint: string;
    body?: Record<string, unknown>;
  };

  const launchAttempts: LaunchAttempt[] = [
    {
      method: "GET",
      endpoint: launchGetEndpoint,
    },
    {
      method: "POST",
      endpoint: `${BASE_URL}/scorm-packages/${encodeURIComponent(scormPackageId)}/launch`,
      body: { ...(launchContext ?? {}) },
    },
    {
      method: "POST",
      endpoint: `${BASE_URL}/scorm-packages/launch`,
      body: { scormPackageId, ...(launchContext ?? {}) },
    },
    {
      method: "POST",
      endpoint: `${BASE_URL}/attempts/scorm/launch`,
      body: { scormPackageId, ...(launchContext ?? {}) },
    },
    {
      method: "POST",
      endpoint: `${BASE_URL}/attempts/launch`,
      body: { scormPackageId, ...(launchContext ?? {}) },
    },
  ];

  const tryLaunch = async (attempt: LaunchAttempt) => {
    const res = await fetchWithAuthRetry(attempt.endpoint, {
      method: attempt.method,
      headers:
        attempt.method === "POST"
          ? { "Content-Type": "application/json", Accept: "application/json" }
          : { Accept: "application/json" },
      body: attempt.method === "POST" ? JSON.stringify(attempt.body ?? {}) : undefined,
    });

    const payload = await readJsonBody(res);
    const parsed = parseLaunchResponse(payload);

    return { res, payload, parsed };
  };

  let lastErrorMessage = "Failed to get SCORM launch URL";
  const attemptErrors: string[] = [];

  for (const attempt of launchAttempts) {
    const result = await tryLaunch(attempt);
    if (result.res.ok && result.parsed) {
      return result.parsed;
    }

    const backendMessage =
      result.payload?.error ??
      result.payload?.message ??
      `Failed to get SCORM launch URL (${result.res.status})`;

    const attemptLabel = `${attempt.method} ${attempt.endpoint}`;
    const labeledError = `${attemptLabel} -> ${backendMessage}`;
    lastErrorMessage = backendMessage;
    attemptErrors.push(labeledError);

    // Move on when route is missing or method is not allowed.
    if (result.res.status === 404 || result.res.status === 405) {
      continue;
    }

    // Invalid payload shape from a successful response.
    if (result.res.ok && !result.parsed) {
      throw new Error("Invalid launch response from server");
    }

    // Auth issues should fail immediately.
    if (result.res.status === 401 || result.res.status === 403) {
      throw new Error(backendMessage);
    }

    // For other statuses (including 400/500), continue trying fallbacks.
    continue;
  }

  throw new Error(
    attemptErrors.length
      ? `Failed to get SCORM launch URL. Attempts: ${attemptErrors.join(" | ")}`
      : lastErrorMessage,
  );
};

