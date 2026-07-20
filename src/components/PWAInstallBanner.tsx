import { usePWAInstall } from "@/hooks/usePWAInstall";

export function PWAInstallBanner() {
  const { isInstallable, promptInstall, isInstalled } = usePWAInstall();

  if (!isInstallable || isInstalled) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-slate-900 text-white p-4 rounded-xl shadow-lg flex items-center justify-between z-50">
      <span className="text-sm">
        Install this app for faster access and offline use
      </span>

      <button
        onClick={promptInstall}
        className="bg-white text-slate-900 px-3 py-1 rounded font-medium"
      >
        Install
      </button>
    </div>
  );
}
