import { getAccessToken } from "@/utils/auth";

/**
 * AI replies must go through your backend so API keys stay off the client.
 * Set VITE_AI_CHAT_URL to your server route, e.g. https://api.example.com/api/v1/ai/chat
 * Expected: POST JSON { message, context? } with Authorization: Bearer <access token>.
 * Response: JSON { reply: string } or { message: string } or plain text.
 */
export const getGeminiResponse = async (
  message: string,
  context?: string,
): Promise<string> => {
  const url = import.meta.env.VITE_AI_CHAT_URL?.trim();
  if (!url) {
    return "The learning assistant is not configured for this app build. Ask your administrator to set VITE_AI_CHAT_URL to your backend chat endpoint.";
  }

  const token = getAccessToken();
  if (!token) {
    return "Please sign in to use the learning assistant.";
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message, context: context ?? "General Dashboard" }),
    });

    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      if (text) data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      if (res.ok && text) return text;
      throw new Error(text || `Request failed (${res.status})`);
    }

    if (!res.ok) {
      const err =
        (data.message as string) ||
        (data.error as string) ||
        `Assistant request failed (${res.status})`;
      throw new Error(err);
    }

    const reply =
      (data.reply as string) ??
      (data.message as string) ??
      (data.text as string) ??
      (typeof data.data === "string" ? data.data : null);

    if (reply && typeof reply === "string") return reply;
    if (text && !Object.keys(data).length) return text;
    return "The assistant did not return a usable reply.";
  } catch (error) {
    console.error("AI chat proxy error:", error);
    return "I could not reach the learning assistant right now. Please try again later.";
  }
};
