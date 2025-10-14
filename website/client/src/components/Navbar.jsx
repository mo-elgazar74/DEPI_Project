import React, { useEffect, useRef, useState } from "react";
import { SignedIn, SignedOut, useClerk, useUser } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/edubot/ui/avatar";
import { Button } from "@/components/edubot/ui/button";
import { LifeBuoy, LogOut, Settings, Sparkles, User as UserIcon } from "lucide-react";

export default function Navbar() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const profile = user?.privateMetadata?.profile;
  const needsOnboarding = !!user && (!profile?.birthday || !profile?.grade || !profile?.role);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const avatarFallback = (user?.fullName || user?.primaryEmailAddress?.emailAddress || "U")
    ?.split(" ")
    .map((segment) => segment[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleNavigate = (event, path) => {
    event.preventDefault();
    setMenuOpen(false);
    navigate(path);
  };

  const handleHelp = (event) => {
    event.preventDefault();
    setMenuOpen(false);
    window.open("mailto:support@edubot.com", "_blank", "noopener,noreferrer");
  };

  const handleSignOut = (event) => {
    event.preventDefault();
    setMenuOpen(false);
    signOut({ redirectUrl: "/" });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="flex justify-between items-center p-4 bg-[#1f2a44] text-white shadow-lg">
      <h1 className="font-serif text-xl">EduBot</h1>
      <div className="flex items-center gap-4">
        <SignedOut>
          <Link to="/home" className="hover:underline">الرئيسية</Link>
          <Link to="/edubot" className="hover:underline">EduBot</Link>
          <Link to="/signin" className="hover:underline">Sign In</Link>
          <Link to="/signup" className="hover:underline">Sign Up</Link>
        </SignedOut>
        <SignedIn>
          <Link to="/home" className="hover:underline">الرئيسية</Link>
          <Link to="/edubot" className="hover:underline">EduBot</Link>
          {needsOnboarding ? (
            <Link to="/onboarding" className="hover:underline">Complete Profile</Link>
          ) : (
            <Link to="/dashboard" className="hover:underline">Dashboard</Link>
          )}
          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              type="button"
              className="relative h-11 w-11 rounded-full border border-white/20 bg-white/5 p-0 hover:bg-white/10"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.imageUrl || undefined} alt={user?.fullName || "User avatar"} />
                <AvatarFallback className="bg-[#25315c] text-white text-sm flex items-center justify-center">
                  {user?.imageUrl ? null : avatarFallback || <UserIcon className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            </Button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-3 w-64 -translate-y-2 rounded-2xl border border-white/20 bg-gradient-to-br from-[#1f2a44] to-[#253364] py-3 text-sm text-white shadow-2xl ring-1 ring-white/10 z-50">
                <div className="flex items-center gap-3 px-5 pb-3">
                  <Avatar className="h-11 w-11 border border-white/20">
                    <AvatarImage src={user?.imageUrl || undefined} alt={user?.fullName || "User avatar"} />
                    <AvatarFallback className="bg-white/20 text-white text-sm">
                      {avatarFallback || <UserIcon className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold leading-tight">{user?.fullName || "User"}</p>
                    <p className="text-xs text-white/70 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                  </div>
                </div>
                <div className="my-2 h-px bg-white/20" />
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 px-5 py-2 text-right hover:bg-white/10"
                  onClick={(event) => handleNavigate(event, "/profile")}
                >
                  <span className="flex items-center gap-2">
                    <Settings className="h-4 w-4" /> الملف الشخصي
                  </span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 px-5 py-2 text-right hover:bg-white/10"
                  onClick={(event) => handleNavigate(event, "/dashboard")}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> حسابي
                  </span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 px-5 py-2 text-right hover:bg-white/10"
                  onClick={handleHelp}
                >
                  <span className="flex items-center gap-2">
                    <LifeBuoy className="h-4 w-4" /> المساعدة والدعم
                  </span>
                </button>
                <div className="my-2 h-px bg-white/20" />
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-5 py-2 text-right text-red-200 hover:bg-red-500/20"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" /> تسجيل الخروج
                </button>
              </div>
            )}
          </div>
        </SignedIn>
      </div>
    </nav>
  );
}
