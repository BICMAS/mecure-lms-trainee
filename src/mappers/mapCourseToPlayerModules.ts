import { Course, PlayerModule } from "../types";

export function mapCourseToPlayerModules(course: Course): PlayerModule[] {
  // If modules are missing, return empty navigation
  if (!course?.modules || !Array.isArray(course.modules)) {
    console.warn(
      "[SCORM] Course has no modules. Full course data required.",
      course?.id
    );
    return [];
  }

  return course.modules.map((module) => ({
    id: module.id,
    title: module.title,
    duration: module.duration || "5",
    isCompleted: module.isCompleted || false,

    lessons: (module.lessons ?? []).map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      isCompleted: lesson.isCompleted || false,
      estimatedDuration: lesson.estimatedDuration ?? 300,

      // Normalize backend inconsistency once
      scormPackageId:
        (lesson as any).scormPackageId ??
        (lesson as any).scormPackegeId ??
        null,
    })),
  }));
}
