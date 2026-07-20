import { useQueryClient } from "@tanstack/react-query";
import { Course } from "@/types";

const normalizeProgress = (progress?: number) => {
  if (typeof progress !== "number") return 0;
  const percent = progress > 0 && progress <= 1 ? progress * 100 : progress;
  return Math.min(100, Math.max(0, Math.round(percent)));
};

const updateCourseProgress = (
  courses: Course[],
  courseId: string,
  progress: number,
  completedModules: number
) => {
  const safeProgress = normalizeProgress(progress);

  return courses.map((c) =>
    c.id === courseId
      ? {
          ...c,
          progress: safeProgress,
          completedModules,
        }
      : c
  );
};

export const useProgressUpdate = () => {
  const queryClient = useQueryClient();

  const updateProgress = (
    courseId: string,
    progress: number,
    completedModules: number
  ) => {
    queryClient.setQueriesData({ queryKey: ["dashboard"] }, (old: any) => {
      if (!old) return old;

      return {
        ...old,
        courses: updateCourseProgress(
          old.courses,
          courseId,
          progress,
          completedModules
        ),
      };
    });

    const safeProgress = normalizeProgress(progress);
    if (safeProgress === 100) {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  };

  return updateProgress;
};
