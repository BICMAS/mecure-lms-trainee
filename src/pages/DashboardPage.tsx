import { Dashboard } from "@/components/Dashboard";
import { useDashboard } from "@/hooks/useDashboard";
import { useLibrary } from "@/hooks/useLibrary";
import { useLearningPaths } from "@/hooks/useLearningPaths";
import { mapLearningPath } from "@/mappers/learningPathMapper";
import { useDownloadStore } from "@/store/downloadStore";
import { useAuth } from "@/context/AuthContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { CourseStatus, UserStats } from "@/types";
import { Navigate, useNavigate } from "react-router-dom";
import { useMemo } from "react";

const DEFAULT_STATS: UserStats = {
  streakDays: 0,
  totalLearningHours: 0,
  completedCourses: 0,
  averageScore: 0,
  weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
  scoreTrend: 0,
  completedCoursesTrend: 0,
  academyPoints: 0,
  badges: [],
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useDashboard();
  const dashboardCourses = data?.courses ?? [];
  const {
    data: libraryCourses = [],
    isLoading: isLibraryLoading,
    isError: isLibraryError,
  } = useLibrary(dashboardCourses);
  const { data: learningPaths = [] } = useLearningPaths();
  const { download, remove } = useDownloadStore();
  const navigate = useNavigate();
  const courses = libraryCourses.length ? libraryCourses : dashboardCourses;
  const isOnline = useOnlineStatus();

  const learningPath = useMemo(() => {
    if (!learningPaths.length) return null;
    return mapLearningPath(learningPaths[0], courses);
  }, [learningPaths, courses]);

  const stats = useMemo(() => {
    const baseStats = data?.stats ?? DEFAULT_STATS;
    const completedCourses = courses.filter(
      (course) => course.status === CourseStatus.Completed,
    ).length;

    return {
      ...baseStats,
      completedCourses,
    };
  }, [data?.stats, courses]);

  if (!user) return <Navigate to="/login" replace />;
  if (isLoading || isLibraryLoading) return <div>Loading dashboard...</div>;
  if (isError || isLibraryError) return <div>We could not load your dashboard right now.</div>;

  return (
    <Dashboard
      courses={courses}
      stats={stats}
      user={user}
      learningPath={learningPath}
      onStartCourse={(courseId) => navigate(`/course/${courseId}`)}
      onDownload={download}
      onRemoveDownload={remove}
      isOfflineMode={!isOnline}
    />
  );
}
