import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";

import { AuthLayout } from "@/components/auth/AuthLayout";

const gradeOptions = ["g1", "g2", "g3", "g4", "g5", "g6"];
const roleOptions = [
  { value: "student", label: "Student" },
  { value: "parent", label: "Parent" },
  { value: "teacher", label: "Teacher" },
];
const API_BASE = import.meta.env.VITE_API_BASE;

if (!API_BASE) {
  console.error("VITE_API_BASE is missing!");
}

const toIsoDate = (ddmmyyyy = "") => {
  const match = ddmmyyyy.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) {
    return "";
  }
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
};

const toDisplayDate = (iso = "") => {
  if (!iso) {
    return "";
  }
  const [yyyy, mm, dd] = iso.split("-");
  if (!yyyy || !mm || !dd) {
    return "";
  }
  return `${dd.padStart(2, "0")}-${mm.padStart(2, "0")}-${yyyy}`;
};

export default function OnboardingPage() {
  const { isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [birthdayIso, setBirthdayIso] = useState("");
  const [grade, setGrade] = useState("g1");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!user) {
      navigate("/signin", { replace: true });
      return;
    }

    const profile = user.privateMetadata?.profile;
    if (profile?.birthday && profile?.grade && profile?.role) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const loadProfile = async () => {
      try {
        const token = await getToken();
        if (!token) {
          return;
        }
        const res = await fetch(`${API_BASE}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          return;
        }
        const { profile: remoteProfile } = await res.json();
        if (remoteProfile) {
          setBirthdayIso(toIsoDate(remoteProfile.birthday));
          setGrade((remoteProfile.grade || "g1").toLowerCase());
          setRole((remoteProfile.role || "student").toLowerCase());
          if (remoteProfile.birthday && remoteProfile.grade && remoteProfile.role) {
            navigate("/dashboard", { replace: true });
          }
        }
      } catch (err) {
        console.error("Unable to fetch profile", err);
      }
    };

    loadProfile();
  }, [getToken, isLoaded, navigate, user]);

  if (!isLoaded || !user) {
    return (
      <AuthLayout>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-serif text-[#1f2a44]">Just a moment…</h1>
          <p className="text-gray-500">Loading your account.</p>
        </div>
      </AuthLayout>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("Saving your details...");
    setIsSaving(true);
    try {
      if (!birthdayIso) {
        throw new Error("Please pick your birth date.");
      }

      const [yyyy, mm, dd] = birthdayIso.split("-");
      const birthYear = Number(yyyy);
      if (!yyyy || !mm || !dd || birthYear < 1900 || birthYear > currentYear) {
        throw new Error("Please pick a valid birth date.");
      }

      const token = await getToken();
      if (!token) {
        throw new Error("Missing session token. Please sign in again.");
      }

      const response = await fetch(`${API_BASE}/api/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          birthday: toDisplayDate(birthdayIso),
          grade,
          role,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const field = payload?.error;
        if (field === "birthday") {
          throw new Error("Please pick a valid birth date.");
        }
        if (field === "grade") {
          throw new Error("Grade must be between 1 and 6.");
        }
        if (field === "role") {
          throw new Error("Role must be student, parent, or teacher.");
        }
        throw new Error(payload?.error || "We couldn't save your details. Please try again.");
      }

      await user.reload();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "We couldn't save your details. Please try again.");
      setStatus("");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AuthLayout maxWidth="max-w-[460px]">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif text-[#1f2a44]">Tell us about you</h1>
          <p className="text-gray-500">We use this information to personalize your experience.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col text-sm text-gray-600">
            Birthday
            <input
              type="date"
              className="mt-1 border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-indigo-400"
              value={birthdayIso}
              onChange={(e) => setBirthdayIso(e.target.value)}
              required
              max={`${currentYear}-12-31`}
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600">
            Grade
            <select
              className="mt-1 border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-indigo-400"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              required
            >
              {gradeOptions.map((value) => (
                <option key={value} value={value}>
                  Grade {value.replace("g", "")}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm text-gray-600">
            Role
            <select
              className="mt-1 border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-indigo-400"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              {roleOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="bg-[#1f2a44] text-white rounded-full py-3 hover:bg-[#25315c] disabled:opacity-60"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Continue"}
          </button>
        </form>

        {status && <p className="text-indigo-500 text-center">{status}</p>}
        {error && <p className="text-red-500 text-center">{error}</p>}
      </div>
    </AuthLayout>
  );
}
