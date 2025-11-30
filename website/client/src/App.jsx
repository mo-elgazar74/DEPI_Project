import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ClerkWrapper } from "./clerk";
import ProtectedPage from "./components/ProtectedPage";
import SsoCallback from "./components/SsoCallback";
import RequireProfile from "./components/RequireProfile";
import SignInPage from "./pages/auth/SignIn";
import SignUpPage from "./pages/auth/SignUp";
import OnboardingPage from "./pages/auth/Onboarding";
import ForgotPasswordPage from "./pages/auth/ForgotPassword";
import ProfilePage from "./pages/Profile";
import EduBotPage from "./pages/EduBot";
import { useUser } from "@clerk/clerk-react";
import EduBotLandingPage from "./pages/EduBotLanding";
import { Toaster as ShadcnToaster } from "@/components/edubot/ui/toaster";
import { Toaster } from "sonner";
import ThemeProvider from "./components/ThemeProvider";

function LandingRoute() {
  const { isLoaded, user } = useUser();

  if (!isLoaded) {
    return null;
  }

  const profile = user?.privateMetadata?.profile;
  const missingMetadata = user && (!profile?.birthday || !profile?.grade || !profile?.role);

  if (missingMetadata) {
    return <Navigate to="/onboarding" replace />;
  }

  if (user && !missingMetadata) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/home" replace />;
}

function AppShell() {
  const location = useLocation();

  return (
    <>
      <Toaster position="top-center" richColors />
      <ShadcnToaster />
      <Routes>
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireProfile>
              <ProtectedPage />
            </RequireProfile>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireProfile>
              <ProfilePage />
            </RequireProfile>
          }
        />
        <Route path="/sso-callback" element={<SsoCallback />} />
        <Route path="/home" element={<EduBotLandingPage />} />
        <Route
          path="/edubot"
          element={
            <RequireProfile>
              <EduBotPage />
            </RequireProfile>
          }
        />
        <Route path="/" element={<LandingRoute />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ClerkWrapper>
      <ThemeProvider>
        <Router>
          <AppShell />
        </Router>
      </ThemeProvider>
    </ClerkWrapper>
  );
}
