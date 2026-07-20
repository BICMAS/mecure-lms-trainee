import { useEffect, useRef } from "react";
import {
  addToQueue,
  getDownloadQueue,
  saveDownloadQueue,
} from "@/utils/offlineCourses";

export const useOfflineDownloads = (
  downloadCourseAssets: (courseId: string) => Promise<void>
) => {
  const downloadCourseAssetsRef = useRef(downloadCourseAssets);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    downloadCourseAssetsRef.current = downloadCourseAssets;
  }, [downloadCourseAssets]);

  const processQueue = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      const queue = getDownloadQueue();
      if (!queue.length) return;

      const remaining: string[] = [];

      for (const courseId of queue) {
        try {
          await downloadCourseAssetsRef.current(courseId);
        } catch {
          remaining.push(courseId);
        }
      }

      saveDownloadQueue(remaining);
    } finally {
      isProcessingRef.current = false;
    }
  };

  useEffect(() => {
    if (navigator.onLine) {
      processQueue();
    }

    const handleOnline = () => processQueue();
    window.addEventListener("online", handleOnline);

    return () => window.removeEventListener("online", handleOnline);
  }, []);

  const download = async (courseId: string) => {
    if (!navigator.onLine) {
      addToQueue(courseId);
      return { queued: true };
    }

    await downloadCourseAssetsRef.current(courseId);
    return { queued: false };
  };

  return { download };
};
