import { getApiV1BaseUrl } from "@/config/api";
import { fetchWithAuthRetry } from "@/utils/fetchWithAuthRetry";
import type { CategoryCertificateStatus } from "@/types";

const BASE_URL = getApiV1BaseUrl();

interface CertificatePayload {
  id: string;
  userId: string;
  courseId?: string | null;
  categoryId?: string;
  categoryName?: string;
  templateId: string;
  issuedAt: string;
  pdfPath?: string;
  certificateUrl?: string;
  verificationHash: string;
  issuedBy?: string;
}

export interface ClaimCertificateResponse {
  certificate: CertificatePayload;
  issued: boolean;
  reissued?: boolean;
  categoryId?: string;
  categoryName?: string;
}

export interface TopicCertificateRow extends CategoryCertificateStatus {
  certificate?: CertificatePayload | null;
  certificateUrl?: string | null;
}

export const listMyTopicCertificates = async (): Promise<TopicCertificateRow[]> => {
  const res = await fetchWithAuthRetry(`${BASE_URL}/certificates/my-topics`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error || "Failed to load topic certificates");
  }
  return Array.isArray(body?.topics) ? body.topics : [];
};

export const claimMyTopicCertificate = async (
  categoryId: string,
): Promise<ClaimCertificateResponse> => {
  const res = await fetchWithAuthRetry(
    `${BASE_URL}/certificates/my-topics/${categoryId}/certificate`,
    { method: "POST" },
  );

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = body?.error || "Failed to claim certificate";
    throw new Error(message);
  }

  return body as ClaimCertificateResponse;
};

/** @deprecated Prefer claimMyTopicCertificate — course claim resolves to topic. */
export const claimMyCourseCertificate = async (
  courseId: string,
): Promise<ClaimCertificateResponse> => {
  const res = await fetchWithAuthRetry(
    `${BASE_URL}/certificates/my-courses/${courseId}/certificate`,
    { method: "POST" },
  );

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = body?.error || "Failed to claim certificate";
    throw new Error(message);
  }

  return body as ClaimCertificateResponse;
};

export const downloadMyTopicCertificate = async (
  categoryId: string,
): Promise<Blob> => {
  const res = await fetchWithAuthRetry(
    `${BASE_URL}/certificates/my-topics/${categoryId}/certificate/download`,
    { method: "GET" },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body?.error || "Failed to download certificate";
    throw new Error(message);
  }

  return res.blob();
};

export const downloadMyCourseCertificate = async (
  courseId: string,
): Promise<Blob> => {
  const res = await fetchWithAuthRetry(
    `${BASE_URL}/certificates/my-courses/${courseId}/certificate/download`,
    { method: "GET" },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body?.error || "Failed to download certificate";
    throw new Error(message);
  }

  return res.blob();
};

export function saveCertificateBlob(blob: Blob, filename: string) {
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  window.URL.revokeObjectURL(objectUrl);
}
