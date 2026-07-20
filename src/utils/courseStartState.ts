const STARTED_COURSES_KEY = "startedCourseIds";

const readStartedCourseIds = (): string[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STARTED_COURSES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
};

const writeStartedCourseIds = (ids: string[]) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STARTED_COURSES_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage failures.
  }
};

export const markCourseStartedLocally = (courseId: string) => {
  if (!courseId) return;

  const current = readStartedCourseIds();
  if (current.includes(courseId)) return;
  writeStartedCourseIds([...current, courseId]);
};

export const hasCourseBeenStartedLocally = (courseId: string) => {
  if (!courseId) return false;
  return readStartedCourseIds().includes(courseId);
};
