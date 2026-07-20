import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { LogOut } from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-8 border text-center">
        <img
          src={user?.avatar}
          alt="Profile"
          className="w-32 h-32 rounded-full mx-auto"
        />

        <h2 className="text-2xl font-bold mt-4">{user?.name}</h2>

        <p className="text-slate-500">
          {user?.role} • {user?.email}
        </p>

        <button
          onClick={logout}
          className="mt-6 px-4 py-2 bg-slate-100 rounded-lg flex items-center gap-2 mx-auto"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}