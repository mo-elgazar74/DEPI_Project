import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function RequireProfile({ children }) {
  const { isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const verifyProfile = async () => {
      if (!isLoaded || !user) {
        return;
      }
      setChecking(true);
      try {
        const token = await getToken();
        if (!token) {
          setHasProfile(false);
          return;
        }
        const res = await fetch(`${API_BASE}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setHasProfile(false);
          return;
        }
        const { profile } = await res.json();
        if (cancelled) {
          return;
        }
        const complete = !!(profile?.birthday && profile?.grade && profile?.role);
        setHasProfile(complete);
      } catch {
        if (!cancelled) {
          setHasProfile(false);
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    };

    verifyProfile();

    return () => {
      cancelled = true;
    };
  }, [API_BASE, getToken, isLoaded, user]);

  if (!isLoaded) {
    return null;
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  if (checking) {
    return null;
  }

  if (!hasProfile) {
    return <Navigate to="/onboarding" replace state={{ from: location }} />;
  }

  return children;
}
