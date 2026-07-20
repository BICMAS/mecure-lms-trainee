import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import DashboardPage from "@/pages/DashboardPage";
import LibraryPage from "@/pages/LibraryPage";
import LearningPathsPage from "@/pages/LearningPathsPage";
import ProfilePage from "@/pages/ProfilePage";
import CommunityPage from "@/pages/CommunityPage";
import AssessmentPage from "@/pages/AssessmentPage";
import CertificatesPage from "@/pages/CertificatesPage";
import PlayerPage from "@/player/PlayerPage";
import LoginRoutePage from "@/pages/LoginRoutePage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoutePage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/learning-paths" element={<LearningPathsPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="/course/:id" element={<PlayerPage />} />
      </Routes>
    </BrowserRouter>
  );
}
