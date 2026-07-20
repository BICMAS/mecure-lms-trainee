import { Community } from "@/components/Community";
import { useAuth } from "@/context/AuthContext";

export default function CommunityPage() {
  const { user } = useAuth();

  if (!user) return null;

  return <Community user={user} />;
}