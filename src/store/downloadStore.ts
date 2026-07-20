import { create } from "zustand";
import {
  getDownloadedCourses,
  markDownloaded,
  removeDownloaded,
} from "@/utils/offlineCourses";

type DownloadStore = {
  downloadedIds: string[];
  download: (id: string) => void;
  remove: (id: string) => void;
};

export const useDownloadStore = create<DownloadStore>((set) => ({
  downloadedIds: getDownloadedCourses(),

  download: (id) => {
    markDownloaded(id);
    set({ downloadedIds: getDownloadedCourses() });
  },

  remove: (id) => {
    removeDownloaded(id);
    set({ downloadedIds: getDownloadedCourses() });
  },
}));