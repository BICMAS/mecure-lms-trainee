import { Navigate } from "react-router-dom";
import { LoginPage } from "@/components/LoginPage";
import { useAuth } from "@/context/AuthContext";

export default function LoginRoutePage() {
  const { user, login } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <LoginPage onLogin={login} />;
}
