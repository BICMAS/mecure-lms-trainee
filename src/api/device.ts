import { getApiV1BaseUrl } from '@/config/api';
import { getAccessToken } from '@/utils/auth';
import { fetchWithAuthRetry } from '@/utils/fetchWithAuthRetry';

const BASE_URL = getApiV1BaseUrl();

export async function registerDevice() {
  const token = getAccessToken();

  if (!token) {
    throw new Error('No access token available');
  }

  const uaData = (navigator as any).userAgentData;
  const userAgent = navigator.userAgent;
  const platform = uaData?.platform || navigator.platform || 'Unknown Device';
  const isMobile =
    typeof uaData?.mobile === 'boolean'
      ? uaData.mobile
      : /Mobi|Android|iPhone|iPad|Tablet/i.test(userAgent);

  const deviceType = isMobile ? 'MOBILE' : 'DESKTOP';
  const deviceName = platform;

  const response = await fetchWithAuthRetry(`${BASE_URL}/auth/device/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      deviceType,
      deviceName,
      userAgent,
    }),
  });

  const text = await response.text();
  let data: any = null;
  let parseError: Error | null = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (err) {
    parseError = err instanceof Error ? err : new Error(String(err));
  }

  if (!response.ok) {
    const responseDetails = parseError
      ? `Invalid JSON response: ${parseError.message}`
      : text;
    throw new Error(
      data?.error ||
        `Failed to register device (status ${response.status}): ${responseDetails}`,
    );
  }

  if (parseError) {
    throw new Error(`Failed to parse device registration response: ${parseError.message}`);
  }

  return data;
}

