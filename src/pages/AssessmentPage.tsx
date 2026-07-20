import { FieldAssessmentPage } from "@/components/FieldAssessment";
import { useAuth } from "@/context/AuthContext";

export default function AssessmentPage() {
  const { user } = useAuth();

  if (!user) return null;

  return <FieldAssessmentPage />;
}