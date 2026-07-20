import React, { useEffect, useState } from "react";
import {
  Course,
  CourseStatus,
  User,
  UserStats,
  LearningPath,
  Badge,
} from "../types";
import { CourseCard } from "./CourseCard";
import {
  Clock,
  Award,
  TrendingUp,
  TrendingDown,
  Map,
  CheckCircle2,
  Lock,
  PlayCircle,
  MoreHorizontal,
  Coins,
  Shield,
  Zap,
  Star,
  Medal,
  Trophy,
  Bell,
  BellRing,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useAnnouncementNotifications } from "../hooks/useAnnouncementNotifications";
import {
  getAnnouncementsPage,
  type AnnouncementMeta,
} from "@/services/announcementService";
import { getAccessToken } from "@/utils/auth";
import { getApiV1BaseUrl } from "@/config/api";
import {
  getLastWebPushFailureReason,
  getNotificationPermission,
  getPushUnavailableHint,
  getWebPushUnavailableReason,
  hasEnabledNotifications,
  isIosDevice,
  isStandaloneDisplayMode,
  registerPushNotifications,
} from "@/utils/pushService";
import { fetchLeaderboard, type LeaderboardEntry } from "@/api/scores";

interface DashboardProps {
  courses: Course[];
  learningPath?: LearningPath | null;
  stats: UserStats;
  onStartCourse: (id: string) => void;
  onDownload: (id: string) => void;
  onRemoveDownload: (id: string) => void;
  isOfflineMode: boolean;
  user: User;
}

type InsightCardProps = {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: { bg: string; text: string };
  trend?: string;
  trendDirection?: "up" | "down";
};

interface Announcement {
  id: string;
  text: string;
  createdAt: string;
  user?: {
    fullName: string;
  };
}

const ANNOUNCEMENTS_PAGE_SIZE = 5;

const API_BASE = getApiV1BaseUrl();

export const Dashboard: React.FC<DashboardProps> = ({
  courses,
  learningPath,
  stats,
  onStartCourse,
  onDownload,
  onRemoveDownload,
  isOfflineMode,
  user,
}) => {
  const inProgress = courses.filter(
    (c) => c.status === CourseStatus.InProgress,
  );
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [announcementPage, setAnnouncementPage] = React.useState(1);
  const [announcementMeta, setAnnouncementMeta] =
    React.useState<AnnouncementMeta>({
      total: 0,
      limit: ANNOUNCEMENTS_PAGE_SIZE,
      offset: 0,
      page: 1,
      pageCount: 0,
      hasMore: false,
    });
  const [announcementsLoading, setAnnouncementsLoading] = React.useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(
    hasEnabledNotifications() && getNotificationPermission() === "granted",
  );
  const [notificationStatus, setNotificationStatus] = React.useState("");
  const [isEnablingNotifications, setIsEnablingNotifications] = React.useState(false);
  const iosNeedsHomeScreen =
    typeof window !== "undefined" &&
    isIosDevice() &&
    !isStandaloneDisplayMode();
  const webPushBlockedReason = iosNeedsHomeScreen
    ? getWebPushUnavailableReason()
    : null;
  const [leaderboardMetric, setLeaderboardMetric] = useState<"score" | "points">("score");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const data = await fetchLeaderboard(leaderboardMetric, 5);
        setLeaderboardEnabled(data.enabled);
        setLeaderboard(data.entries);
      } catch (error) {
        console.error("Failed to load leaderboard", error);
        setLeaderboard([]);
      }
    };

    loadLeaderboard();
  }, [leaderboardMetric]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        if (!getAccessToken()) {
          return;
        }

        setAnnouncementsLoading(true);
        const { data, meta } = await getAnnouncementsPage({
          page: announcementPage,
          limit: ANNOUNCEMENTS_PAGE_SIZE,
        });

        setAnnouncements(data);
        setAnnouncementMeta(meta);
      } catch (err) {
        console.error("Failed to load announcements", err);
      } finally {
        setAnnouncementsLoading(false);
      }
    };

    fetchAnnouncements();
  }, [announcementPage]);

  useAnnouncementNotifications(notificationsEnabled);

  const handleEnableNotifications = async () => {
    setIsEnablingNotifications(true);
    setNotificationStatus("Waiting for browser permission…");

    try {
      const subscription = await registerPushNotifications(user?.id);
      const permission = getNotificationPermission();

      if (subscription) {
        setNotificationsEnabled(true);
        const provider =
          typeof subscription === "object" &&
          subscription !== null &&
          "provider" in subscription
            ? (subscription as { provider?: string }).provider
            : null;
        setNotificationStatus(
          provider === "onesignal"
            ? "Notifications are on. You'll get alerts on this device."
            : provider === "capacitor"
              ? "Notifications are on for this device."
              : "Notifications are on. You'll get alerts for new announcements.",
        );
      } else if (permission === "denied") {
        setNotificationsEnabled(false);
        setNotificationStatus(
          "Notifications are blocked. Open the lock icon in the address bar, allow notifications, then try again.",
        );
      } else {
        setNotificationsEnabled(false);
        const hint =
          getLastWebPushFailureReason() ??
          getPushUnavailableHint() ??
          "Could not enable notifications. Reload the page and try again.";
        setNotificationStatus(hint);
      }
    } catch (error: unknown) {
      console.error("Failed to enable notifications", error);
      setNotificationsEnabled(false);
      const message =
        error instanceof Error ? error.message : "Unknown error";
      setNotificationStatus(`Could not enable notifications: ${message}`);
    } finally {
      setIsEnablingNotifications(false);
    }
  };

  // --- Widget Components --- //

  const InsightCard: React.FC<InsightCardProps> = ({
    label,
    value,
    icon: Icon,
    color,
    trend,
    trendDirection = "up",
  }) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div
          className={`p-2 rounded-xl bg-opacity-10 ${color.bg} ${color.text}`}
        >
          <Icon size={20} />
        </div>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${
              trendDirection === "up"
                ? "text-brand-primary bg-brand-primary/10"
                : "text-red-600 bg-red-50"
            }`}
          >
            {trendDirection === "up" ? (
              <TrendingUp size={12} />
            ) : (
              <TrendingDown size={12} />
            )}
            {trend}
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800 mt-2 truncate">
          {value}
        </div>
        <div className="text-xs text-slate-500 font-medium mt-1 truncate">
          {label}
        </div>
      </div>
    </div>
  );

  const currentCourse =
    courses.find((c) => c.status === CourseStatus.InProgress) ||
    courses.find((c) => c.status === CourseStatus.NotStarted);

  const formatLearningTime = (hours: number) => {
    if (!Number.isFinite(hours) || hours <= 0) return "0m";
    if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
    return `${Math.round(hours)}h`;
  };

  const WeeklyActivityChart = ({ data }: { data: number[] }) => {
    const days = ["M", "T", "W", "T", "F", "S", "S"];
    const maxVal = Math.max(...data, 1);

    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl text-brand-primary/70 flex items-center gap-2">
            <Clock size={20} className="text-brand-primary" />
            Learning Activity
          </h3>
          <span className="text-xs text-slate-400">Last 7 Days</span>
        </div>
        <div className="flex items-end justify-between flex-1 gap-2">
          {data.map((val, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 flex-1 group cursor-pointer"
            >
              <div className="w-full relative h-32 bg-slate-50 rounded-lg overflow-hidden flex items-end">
                <div
                  className="w-full bg-brand-primary/70 hover:bg-brand-primary transition-all duration-500 rounded-t-lg"
                  style={{
                    height: `${(val / maxVal) * 100}%`,
                    opacity: val === 0 ? 0 : 1,
                  }}
                ></div>
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {val}m
                </div>
              </div>
              <span className="text-xs font-medium text-slate-400 group-hover:text-brand-primary">
                {days[i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const LearningPathWidget = ({ path }: { path: LearningPath }) => {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-full flex flex-col">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
          <div className="flex justify-between items-start mb-2">
            <div className="flex text-xl items-center gap-2 text-brand-primary font-semibold uppercase tracking-wide">
              <Map size={20} /> Learning Path
            </div>
            <div className="bg-brand-primary/10 text-brand-primary text-xs font-bold px-2 py-1 rounded-md">
              {path.progress}%
            </div>
          </div>
          <h3 className="text-lg font-bold text-slate-900">{path.title}</h3>
          <p className="text-sm text-slate-500 mt-1 line-clamp-1">
            {path.description}
          </p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="relative space-y-0">
            {/* Vertical Line */}
            <div className="absolute left-4.75 top-4 bottom-4 w-0.5 bg-slate-100 z-0"></div>

            {path.steps?.map((step, idx) => {
              const isCurrent = step.status === "in-progress";
              const isCompleted = step.status === "completed";
              const isLocked = step.status === "locked";

              return (
                <div
                  key={step.id}
                  className={`relative z-10 flex gap-4 pb-8 last:pb-0 group ${isLocked ? "opacity-50" : ""}`}
                >
                  <div className="shrink-0 mt-1">
                    {isCompleted ? (
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center border-4 border-white shadow-sm">
                        <CheckCircle2 size={20} />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center border-4 border-brand-primary/20 shadow-md ring-2 ring-brand-primary/50 ring-offset-2">
                        <PlayCircle
                          size={20}
                          fill="currentColor"
                          className="text-white"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border-4 border-white">
                        <Lock size={18} />
                      </div>
                    )}
                  </div>

                  <div
                    className={`flex-1 rounded-xl p-4 border transition-all ${isCurrent ? "bg-brand-primary/10 border-brand-primary/20 shadow-sm" : "bg-white border-slate-100"}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-medium text-slate-400 mb-1">
                          STEP {idx + 1} • {step.type.toUpperCase()}
                        </div>
                        <h4
                          className={`font-bold ${isCurrent ? "text-brand-primary" : "text-slate-800"}`}
                        >
                          {step.title}
                        </h4>
                        <p className="text-sm text-slate-500 mt-1">
                          {step.description}
                        </p>
                      </div>
                      {step.estimatedTime && (
                        <span className="text-xs text-slate-400 bg-white px-2 py-1 rounded border border-slate-100 whitespace-nowrap">
                          {step.estimatedTime}
                        </span>
                      )}
                    </div>

                    {isCurrent && step.courseId && (
                      <button
                        onClick={() => onStartCourse(step.courseId!)}
                        className="mt-4 w-full bg-brand-accent hover:bg-brand-accent-dark text-white py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        Continue Journey <MoreHorizontal size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case "shield":
        return Shield;
      case "zap":
        return Zap;
      case "star":
        return Star;
      case "medal":
        return Medal;
      case "trophy":
        return Trophy;
      default:
        return Award;
    }
  };

  const BadgesWidget = ({ badges }: { badges: Badge[] }) => {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col h-full mt-lg-2">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Award size={18} className="text-yellow-500" />
            Achievements
          </h3>
          <span className="text-xs font-medium text-brand-primary hover:underline cursor-pointer">
            View All
          </span>
        </div>

        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {badges.map((badge) => {
            const Icon = getBadgeIcon(badge.icon);
            return (
              <div
                key={badge.id}
                className={`shrink-0 w-32 p-4 rounded-xl border flex flex-col items-center text-center gap-3 transition-colors ${badge.isLocked ? "bg-slate-50 border-slate-100 opacity-60" : "bg-yellow-50/30 border-yellow-100"}`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${badge.isLocked ? "bg-slate-200 text-slate-400" : "bg-yellow-100 text-yellow-600 shadow-sm"}`}
                >
                  {badge.isLocked ? <Lock size={20} /> : <Icon size={24} />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 leading-tight mb-1">
                    {badge.name}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight line-clamp-2">
                    {badge.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* 1. Header & Stats Overview */}
      <section>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1">
              Hi{" "}
              <span className="font-semibold text-brand-accent">{user.fullName}</span>,
              welcome back. Let's earn some Impact coins!
            </p>
          </div>
          <div className="hidden md:block text-right">
            <div className="text-sm text-slate-500">Current Focus</div>
            <div className="font-semibold text-brand-primary">
              {learningPath?.title}
            </div>
          </div>
        </div>

        <div
          className={`mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border p-4 shadow-sm ${
            notificationsEnabled
              ? "border-emerald-200 bg-emerald-50/80"
              : "border-slate-100 bg-white"
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-slate-900 font-semibold">
              <BellRing
                size={18}
                className={
                  notificationsEnabled ? "text-emerald-600" : "text-brand-primary"
                }
              />
              {notificationsEnabled
                ? "Notifications are on"
                : "Stay updated with announcements"}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {notificationsEnabled
                ? "You’ll get alerts when new announcements are posted."
                : iosNeedsHomeScreen
                  ? "On iPhone, add this site to your Home Screen first, then open it from the icon to enable notifications."
                  : "Turn on browser notifications to receive new updates."}
            </p>
            {(notificationStatus || webPushBlockedReason) && (
              <p
                className={`text-sm mt-2 ${
                  notificationsEnabled
                    ? "text-emerald-700"
                    : isEnablingNotifications
                      ? "text-slate-600"
                      : "text-amber-700"
                }`}
                role="status"
                aria-live="polite"
              >
                {notificationStatus || webPushBlockedReason}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleEnableNotifications}
            disabled={
              notificationsEnabled ||
              isEnablingNotifications ||
              iosNeedsHomeScreen
            }
            aria-busy={isEnablingNotifications}
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
              notificationsEnabled
                ? "bg-emerald-600 text-white"
                : "bg-brand-accent text-white hover:bg-brand-accent-dark disabled:bg-slate-200 disabled:text-slate-500"
            }`}
          >
            <Bell size={16} />
            {notificationsEnabled
              ? "Enabled"
              : isEnablingNotifications
                ? "Please wait…"
                : iosNeedsHomeScreen
                  ? "Add to Home Screen first"
                  : "Enable Notifications"}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InsightCard
            label="Impact Coins"
            value={stats.academyPoints}
            icon={Coins}
            color={{ bg: "bg-brand-accent", text: "text-white" }}
            trend="Rewards"
            trendDirection="up"
          />
          <InsightCard
            label="Learning Hours"
            value={formatLearningTime(stats.totalLearningHours)}
            icon={Clock}
            color={{ bg: "bg-brand-primary", text: "text-white" }}
            trend="+2.5h"
            trendDirection="up"
          />
          <InsightCard
            label="Courses Done"
            value={stats.completedCourses}
            icon={Award}
            color={{ bg: "bg-brand-primary-light", text: "text-white" }}
            trend={`${stats.completedCoursesTrend > 0 ? "+" : ""}${stats.completedCoursesTrend}`}
            trendDirection={stats.completedCoursesTrend >= 0 ? "up" : "down"}
          />
          <InsightCard
            label="Avg. Score"
            value={`${stats.averageScore}%`}
            icon={TrendingUp}
            color={{ bg: "bg-emerald-500", text: "text-white" }}
            trend={`${stats.scoreTrend > 0 ? "+" : ""}${stats.scoreTrend}%`}
            trendDirection={stats.scoreTrend >= 0 ? "up" : "down"}
          />
        </div>
      </section>

      {/* 2. Main Dashboard Split: Learning Path & Activity */}
      <section className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-screen">
        {/* Left: Learning Path (Takes 2 columns on large screens) */}
        <div className="lg:col-span-2 h-full">
          {learningPath ? (
            <LearningPathWidget path={learningPath} />
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
              No learning path assigned yet.
            </div>
          )}
        </div>

        {/* Right: Activity Chart & Quick Actions (Takes 1 column) */}
        <div className="space-y-6 flex flex-col h-full">
          <div className="flex-1">
            <WeeklyActivityChart data={stats.weeklyActivity} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-brand-primary mb-4 flex items-center gap-2">
              <Bell /> Announcements
            </h3>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {announcementsLoading && announcements.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  Loading announcements...
                </div>
              ) : announcements.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  No announcements at the moment.
                </div>
              ) : (
                announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm"
                  >
                    <p className="text-slate-700">{announcement.text}</p>

                    <span className="text-xs text-slate-400 block mt-1">
                      {new Date(announcement.createdAt).toLocaleDateString()}
                      {announcement.user?.fullName
                        ? ` • ${announcement.user.fullName}`
                        : ""}
                    </span>
                  </div>
                ))
              )}
            </div>

            {announcementMeta.total > 0 && (
              <div className="mt-4 flex items-center justify-between gap-2 text-xs text-slate-500">
                <span>
                  {announcementMeta.offset + 1}–
                  {Math.min(
                    announcementMeta.offset + announcements.length,
                    announcementMeta.total,
                  )}{" "}
                  of {announcementMeta.total}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setAnnouncementPage((p) => Math.max(1, p - 1))
                    }
                    disabled={announcementPage <= 1 || announcementsLoading}
                    className="inline-flex items-center gap-0.5 rounded border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Prev
                  </button>
                  <span className="px-1">
                    {announcementPage} /{" "}
                    {Math.max(1, announcementMeta.pageCount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAnnouncementPage((p) => p + 1)}
                    disabled={
                      announcementsLoading ||
                      announcementPage >=
                        Math.max(1, announcementMeta.pageCount)
                    }
                    className="inline-flex items-center gap-0.5 rounded border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-bold text-brand-primary flex items-center gap-2">
                <Trophy size={18} /> Leaderboard
              </h3>
              <div className="flex rounded-lg border border-slate-200 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setLeaderboardMetric("score")}
                  className={`rounded px-2 py-1 ${
                    leaderboardMetric === "score"
                      ? "bg-brand-primary text-white"
                      : "text-slate-600"
                  }`}
                >
                  Quiz Score
                </button>
                <button
                  type="button"
                  onClick={() => setLeaderboardMetric("points")}
                  className={`rounded px-2 py-1 ${
                    leaderboardMetric === "points"
                      ? "bg-brand-primary text-white"
                      : "text-slate-600"
                  }`}
                >
                  Coins
                </button>
              </div>
            </div>

            {!leaderboardEnabled ? (
              <p className="text-sm text-slate-500">Leaderboard is currently disabled.</p>
            ) : leaderboard.length === 0 ? (
              <p className="text-sm text-slate-500">No leaderboard data yet.</p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          entry.rank === 1
                            ? "bg-yellow-100 text-yellow-700"
                            : entry.rank === 2
                              ? "bg-slate-200 text-slate-700"
                              : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {entry.rank}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{entry.name}</p>
                        {entry.department && (
                          <p className="text-xs text-slate-500">{entry.department}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-800">{entry.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/*
            Mini "Next Up" (Recommended) card intentionally hidden.
            Keeping markup for quick restore when this widget is needed again.
          */}
        </div>
      </section>

      {/* 3. Badges & Jump Back In */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Badges Widget */}
        <div className="lg:col-span-1">
          <BadgesWidget badges={stats.badges} />
        </div>

        {/* Jump Back In */}
        <div className="lg:col-span-2">
          {inProgress.length > 0 ? (
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800">
                  Jump Back In
                </h3>
                <button className="text-brand-primary text-sm font-medium hover:underline">
                  View Library
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inProgress.slice(0, 2).map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    progress={course.progress}
                    status={course.status}
                    onStart={onStartCourse}
                    onDownload={onDownload}
                    onRemoveDownload={onRemoveDownload}
                    isOfflineMode={isOfflineMode}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center h-full flex flex-col justify-center items-center text-slate-500">
              <CheckCircle2 size={48} className="mb-4 text-slate-300" />
              <p>You're all caught up! Check the library for new courses.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
