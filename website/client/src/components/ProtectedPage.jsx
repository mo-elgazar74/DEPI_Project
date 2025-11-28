import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE;

if (!API_BASE) {
  console.error("VITE_API_BASE is missing!");
}

export default function ProtectedPage() {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("Loading protected data...");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!isLoaded) {
        return;
      }
      if (!user) {
        navigate("/signin", { replace: true });
        return;
      }
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("Missing session token");
        }

        const profileRes = await fetch(`${API_BASE}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (profileRes.ok) {
          const { profile: profileData } = await profileRes.json();
          if (!profileData?.birthday || !profileData?.grade || !profileData?.role) {
            navigate("/onboarding", { replace: true });
            return;
          }
          setProfile(profileData);
        } else if (profileRes.status === 401) {
          navigate("/signin", { replace: true });
          return;
        } else {
          const payload = await profileRes.json().catch(() => ({}));
          throw new Error(payload?.error || "Unable to load profile");
        }

        const protectedRes = await fetch(`${API_BASE}/api/protected`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!protectedRes.ok) {
          const payload = await protectedRes.json().catch(() => ({}));
          throw new Error(payload?.error || "Unable to fetch protected data.");
        }
        const data = await protectedRes.json();
        setMessage(data.message);
        setStatus("");
      } catch (err) {
        setStatus(err.message || "Something went wrong.");
      }
    };

    fetchData();
  }, [API_BASE, getToken, isLoaded, navigate, user]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f9fafb]">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      {status && <p className="text-gray-500 mb-2">{status}</p>}
      {message && <p className="text-gray-700">{message}</p>}
      {profile && (
        <div className="mt-6 bg-white rounded-2xl shadow-md px-6 py-4 text-left">
          <h2 className="text-lg font-semibold text-[#1f2a44] mb-2">Profile</h2>
          <p className="text-gray-600">Birthday: {profile.birthday}</p>
          <p className="text-gray-600">Birth year: {profile.birthYear}</p>
          <p className="text-gray-600">Grade: {String(profile.grade).replace("g", "")}</p>
          <p className="text-gray-600">Role: {profile.role}</p>
        </div>
      )}
    </div>
  );
}
