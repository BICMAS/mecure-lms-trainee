const DOWNLOADED_KEY = "downloadedCourses";
const QUEUE_KEY = "downloadQueue";

const readStringArray = (key: string): string[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
};

const writeStringArray = (key: string, values: string[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(values));
    return true;
  } catch {
    return false;
  }
};

const updateStoredArray = (
  key: string,
  updater: (values: string[]) => string[]
) => writeStringArray(key, updater(readStringArray(key)));

export const getDownloadedCourses = (): string[] => readStringArray(DOWNLOADED_KEY);

export const saveDownloadedCourses = (ids: string[]) =>
  writeStringArray(DOWNLOADED_KEY, ids);

export const markDownloaded = (courseId: string) =>
  updateStoredArray(DOWNLOADED_KEY, (ids) =>
    ids.includes(courseId) ? ids : [...ids, courseId]
  );

export const removeDownloaded = (courseId: string) =>
  updateStoredArray(DOWNLOADED_KEY, (ids) => ids.filter((id) => id !== courseId));

export const getDownloadQueue = (): string[] => readStringArray(QUEUE_KEY);

export const saveDownloadQueue = (queue: string[]) =>
  writeStringArray(QUEUE_KEY, queue);

export const addToQueue = (courseId: string) =>
  updateStoredArray(QUEUE_KEY, (queue) =>
    queue.includes(courseId) ? queue : [...queue, courseId]
  );

export const removeFromQueue = (courseId: string) =>
  updateStoredArray(QUEUE_KEY, (queue) => queue.filter((id) => id !== courseId));

export const clearQueue = () => {
  try {
    localStorage.removeItem(QUEUE_KEY);
    return true;
  } catch {
    return false;
  }
};
