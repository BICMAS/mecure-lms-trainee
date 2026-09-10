import { Course, CourseStatus } from "@/types";

export type LibrarySort = "dueDate" | "title" | "progress" | "recent";

const PROGRESS_RANK: Record<CourseStatus, number> = {
  [CourseStatus.InProgress]: 0,
  [CourseStatus.Failed]: 1,
  [CourseStatus.NotStarted]: 2,
  [CourseStatus.Completed]: 3,
};

function compareTitles(a: Course, b: Course) {
  return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
}

function dueTimestamp(course: Course) {
  if (!course.deadline) return Number.POSITIVE_INFINITY;
  const time = new Date(course.deadline).getTime();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

export function sortLibraryCourses(
  courses: Course[],
  sort: LibrarySort,
): Course[] {
  return [...courses].sort((a, b) => {
    if (sort === "recent") {
      return 0;
    }

    if (sort === "title") {
      return compareTitles(a, b);
    }

    if (sort === "dueDate") {
      const dueDiff = dueTimestamp(a) - dueTimestamp(b);
      if (dueDiff !== 0) return dueDiff;
      return compareTitles(a, b);
    }

    if (sort === "progress") {
      const rankDiff =
        (PROGRESS_RANK[a.status] ?? 99) - (PROGRESS_RANK[b.status] ?? 99);
      if (rankDiff !== 0) return rankDiff;
      return compareTitles(a, b);
    }

    return compareTitles(a, b);
  });
}
