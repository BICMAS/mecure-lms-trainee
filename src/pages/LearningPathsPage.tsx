import { useLearningPaths } from "@/hooks/useLearningPaths";
import { useLibrary } from "@/hooks/useLibrary";
import { useDashboard } from "@/hooks/useDashboard";
import { CourseCard } from "@/components/CourseCard";
import { useDownloadStore } from "@/store/downloadStore";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { Course } from "@/types";
import { useNavigate } from "react-router-dom";

export default function LearningPathsPage() {
  const { data: paths, isLoading } = useLearningPaths();
  const { data: dashboardData } = useDashboard();
  const { data: libraryCourses = [] } = useLibrary(dashboardData?.courses ?? []);
  const { download, remove } = useDownloadStore();
  const isOffline = useOfflineStatus();
  const navigate = useNavigate();

  if (isLoading)
    return <div className="p-10 text-center">Loading learning paths…</div>;

  if (!paths?.length)
    return <div className="p-10 text-center">No learning paths available</div>;

  const courseMap = new Map(libraryCourses.map((c) => [c.id, c]));

  return (
    <div className="space-y-8">
      {paths.map((path) => {
        const pathCourses = path.curriculumSequence
          .map((id: string) => courseMap.get(id))
          .filter((c): c is Course => !!c);

        return (
          <div key={path.id} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">{path.title}</h2>
              <p className="text-slate-500 text-sm">{path.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pathCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  progress={course.progress}
                  status={course.status}
                  onStart={() => navigate(`/course/${course.id}`)}
                  onDownload={() => download(course.id)}
                  onRemoveDownload={() => remove(course.id)}
                  isOfflineMode={isOffline}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
