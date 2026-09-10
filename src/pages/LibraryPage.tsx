import { useState, useMemo } from "react";
import { Search, Download } from "lucide-react";
import { useLibrary } from "@/hooks/useLibrary";
import { useDashboard } from "@/hooks/useDashboard";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { useDownloadStore } from "@/store/downloadStore";
import { CourseStatus } from "@/types";
import { CourseCard } from "@/components/CourseCard";
import { useNavigate } from "react-router-dom";
import { LibrarySort, sortLibraryCourses } from "@/utils/librarySort";

type LibraryFilter = "ALL" | "COMPLETED" | string;

export default function LibraryPage() {
  const { data: dashboardData } = useDashboard();
  const { data: courses = [], isLoading, isError } = useLibrary(
    dashboardData?.courses ?? [],
  );
  const { downloadedIds, download, remove } = useDownloadStore();
  const isOffline = useOfflineStatus();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<LibraryFilter>("ALL");
  const [sort, setSort] = useState<LibrarySort>("dueDate");

  const libraryCourses = useMemo(() => {
    return courses.map((course) => ({
      ...course,
      isDownloaded: downloadedIds.includes(course.id),
    }));
  }, [courses, downloadedIds]);

  const topicFilters = useMemo(() => {
    const seen = new Map<string, string>();
    for (const course of libraryCourses) {
      if (course.category?.id && course.category.name) {
        seen.set(course.category.id, course.category.name);
      }
    }
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [libraryCourses]);

  const chips: Array<{ label: string; value: LibraryFilter }> = [
    { label: "All", value: "ALL" },
    { label: "Completed", value: "COMPLETED" },
    ...topicFilters.map(([id, name]) => ({ label: name, value: id })),
  ];

  const filteredCourses = useMemo(() => {
    return libraryCourses.filter((course) => {
      if (isOffline && !course.isDownloaded) return false;

      if (
        search &&
        !course.title.toLowerCase().includes(search.toLowerCase())
      )
        return false;

      if (filter === "COMPLETED")
        return course.status === CourseStatus.Completed;

      if (filter !== "ALL") {
        return (
          course.category?.id === filter || course.category?.slug === filter
        );
      }

      return true;
    });
  }, [libraryCourses, filter, search, isOffline]);

  const displayedCourses = useMemo(
    () => sortLibraryCourses(filteredCourses, sort),
    [filteredCourses, sort],
  );

  if (isLoading) {
    return <div className="p-10 text-center text-slate-500">Loading courses...</div>;
  }

  if (isError) {
    return (
      <div className="p-10 text-center text-slate-500">
        We could not load your course library right now.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search, sort, and chips */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-80 md:w-96">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search courses..."
              aria-label="Search courses"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border"
            />
          </div>

          <label className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-slate-500 whitespace-nowrap">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as LibrarySort)}
              aria-label="Sort courses"
              className="rounded-xl border bg-white px-3 py-2 text-sm"
            >
              <option value="dueDate">Due date (soonest first)</option>
              <option value="title">Title A–Z</option>
              <option value="progress">
                Progress (in progress first, then not started, then completed)
              </option>
              <option value="recent">Recently assigned</option>
            </select>
          </label>
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {chips.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              aria-pressed={filter === f.value}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                filter === f.value
                  ? "bg-slate-900 text-white"
                  : "bg-white border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isOffline && (
        <div className="bg-orange-50 border border-orange-100 text-orange-800 p-4 rounded-xl flex items-center gap-2">
          <Download size={18} />
          Showing downloaded courses only
        </div>
      )}

      {/* Courses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            progress={course.progress}
            status={course.status}
            onStart={() => navigate(`/course/${course.id}`)}
            onPracticeRetake={() => navigate(`/course/${course.id}?practice=1`)}
            onViewCertificate={() => navigate(`/certificates?course=${course.id}`)}
            onDownload={() => download(course.id)}
            onRemoveDownload={() => remove(course.id)}
            isOfflineMode={isOffline}
          />
        ))}
      </div>

      {!displayedCourses.length && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          No courses match your current filters.
        </div>
      )}
    </div>
  );
}
