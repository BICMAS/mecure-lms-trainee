import { useEffect, useState } from "react";
import { fetchLearningPaths, BackendLearningPath } from "@/api/learningPaths";

export function useLearningPaths() {
  const [data, setData] = useState<BackendLearningPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const paths = await fetchLearningPaths();
        if (!mounted) return;
        setData(paths);
      } catch (err: any) {
        console.error(err);
        if (!mounted) return;
        setError("Failed to load learning paths");
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return { data, isLoading, error };
}