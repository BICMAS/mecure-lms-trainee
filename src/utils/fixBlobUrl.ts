const PUBLIC_BLOB_BASE =
  "https://wu30puoeh0vgnkky.public.blob.vercel-storage.com";

export const fixBlobUrl = (url: string): string => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // If it's not a valid absolute URL, just return as-is
    return url;
  }

  if (parsed.hostname === "blob.vercel-storage.com") {
    return `${PUBLIC_BLOB_BASE}${parsed.pathname}${parsed.search || ""}${parsed.hash || ""}`;
  }

  return url;
};
