import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ScormPlayer } from "@/components/ScormPlayer";
import { useDashboard } from "@/hooks/useDashboard";
import { useLibrary } from "@/hooks/useLibrary";
import { useProgressUpdate } from "@/hooks/useProgressUpdate";
import { markCourseStartedLocally } from "@/utils/courseStartState";

export default function PlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const updateProgress = useProgressUpdate();
  const { data: dashboardData, isLoading: isDashboardLoading, isError } = useDashboard();
  const dashboardCourses = dashboardData?.courses ?? [];
  const {
    data: libraryCourses = [],
    isLoading: isLibraryLoading,
    isError: isLibraryError,
    error: libraryError,
  } = useLibrary(dashboardCourses);

  const course =
    libraryCourses.find((candidate) => candidate.id === id) ??
    dashboardCourses.find((candidate) => candidate.id === id);

  useEffect(() => {
    if (id) {
      markCourseStartedLocally(id);
    }
  }, [id]);

  if (isDashboardLoading || isLibraryLoading) {
    return <div className="p-10 text-center text-slate-500">Loading course...</div>;
  }

  if (isError) {
    return (
      <div className="p-10 text-center text-slate-500">
        We could not load this course right now.
      </div>
    );
  }

  if (isLibraryError) {
    return (
      <div className="p-10 text-center text-slate-500">
        Failed to load course library: {String(libraryError)}
      </div>
    );
  }

  if (!course) {
    return <div className="p-10 text-center text-slate-500">Course not found.</div>;
  }

  return (
    <ScormPlayer
      course={course}
      onBack={() => navigate("/library")}
      onUpdateProgress={updateProgress}
      onViewCertificate={() => navigate(`/certificates?course=${course.id}`)}
    />
  );
}
