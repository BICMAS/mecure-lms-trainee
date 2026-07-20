import { LearningPath, LearningPathStep, Course, CourseStatus } from "@/types";
import { BackendLearningPath } from "@/api/learningPaths";

export function mapLearningPath(
  backendPath: BackendLearningPath,
  courses: Course[] = []
): LearningPath {
  const sequence = backendPath.curriculumSequence ?? [];

  const steps: LearningPathStep[] = sequence.map((courseId, index) => {
    const course = courses.find((c) => c.id === courseId);

    let status: LearningPathStep["status"] = "locked";

    if (course?.status === CourseStatus.Completed) {
      status = "completed";
    } else if (course?.status === CourseStatus.InProgress) {
      status = "in-progress";
    } else if (index === 0) {
      status = "in-progress";
    }

    return {
      id: `${backendPath.id}-${courseId}`,
      courseId,
      title: course?.title || `Step ${index + 1}`,
      description: course?.description || "Part of this learning path",
      type: "course",
      status,
      estimatedTime: undefined, // explicit, type-safe
    };
  });

  const totalSteps = steps.length;
  const completedSteps = steps.filter(
    (step) => step.status === "completed"
  ).length;

  const progress =
    totalSteps > 0
      ? Math.round((completedSteps / totalSteps) * 100)
      : 0;

  return {
    id: backendPath.id,
    title: backendPath.title,
    description: backendPath.description,
    progress,
    totalSteps,
    completedSteps,
    steps,
  };
}