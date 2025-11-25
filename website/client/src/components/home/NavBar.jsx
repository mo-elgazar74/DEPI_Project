import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Laptop, Moon, Sun, Check } from "lucide-react";

import logo from "@/public/logo.svg";
import { Button } from "@/components/edubot/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/edubot/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/edubot/ui/avatar";

const NAV_LINKS = [
  { label: "Hero", href: "#hero" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
  { label: "Download", href: "#download" },
];

export default function NavBar() {
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userInitials = useMemo(() => {
    if (!user) return "U";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  }, [user]);

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Laptop },
  ];

  const activeTheme = mounted ? (theme === "system" ? systemTheme : theme) : "light";
  const ActiveIcon = activeTheme === "dark" ? Moon : activeTheme === "light" ? Sun : Laptop;

  const handleStartChatting = () => {
    navigate(isSignedIn ? "/edubot" : "/signin");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/home");
  };

  const renderThemeItems = () => (
    themeOptions.map(({ value, label, icon: Icon }) => (
      <DropdownMenuItem
        key={value}
        onClick={() => setTheme(value)}
        className="flex items-center justify-between"
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {label}
        </span>
        {theme === value && <Check className="h-4 w-4 text-primary" />}
      </DropdownMenuItem>
    ))
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 text-foreground shadow-sm backdrop-blur-xl transition-colors">
      <div className="mx-auto w-full max-w-7xl px-4 py-3 md:px-6">
        <div className="grid w-full grid-cols-1 items-center gap-4 md:grid-cols-[auto_1fr_auto]">
          <div className="flex items-center gap-3">
            <motion.img
              src={logo}
              alt="EduBot Egypt"
              className="h-32 w-auto flex-none object-contain"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
            <motion.div
              className="h-16 w-px -ml-4 bg-[#2563eb]"
              style={{ transformOrigin: "center top" }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            />
            <div className="pl-3 text-right leading-tight">
              <motion.div
                initial={{ clipPath: "inset(0% 100% 0% 0%)", opacity: 0 }}
                animate={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
              >
                <p className="text-xl font-semibold text-[#2563eb]">EduBot Egypt</p>
                <p className="text-sm text-muted-foreground" dir="rtl">
                  مساعد التعلم الذكي
                </p>
              </motion.div>
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold">
            {NAV_LINKS.map(({ label, href }) => (
              <a key={href} href={href} className="transition hover:text-[#2563eb]">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-2 md:gap-3">
            {!isSignedIn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full border-border bg-background/90 text-foreground"
                  >
                    {mounted ? <ActiveIcon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Theme</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {renderThemeItems()}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              size="sm"
              className="rounded-full bg-[#1f3665] px-4 text-white hover:bg-[#192846]"
              onClick={handleStartChatting}
            >
              Start Chatting
            </Button>

            {!isSignedIn ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => navigate("/signin")}
                >
                  Sign In
                </Button>
                <Button size="sm" className="rounded-full" onClick={() => navigate("/signup")}>
                  Sign Up
                </Button>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-border/70 bg-background/90 px-2 py-1 pr-3 text-sm font-medium text-foreground shadow-sm transition hover:border-primary/60"
                  >
                    <Avatar className="h-9 w-9 border border-border/70">
                      <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User avatar"} />
                      <AvatarFallback className="bg-primary/10 text-primary">{userInitials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">{user?.firstName || "Account"}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-semibold">{user?.fullName || "User"}</span>
                      <span className="text-xs text-muted-foreground">
                        {user?.primaryEmailAddress?.emailAddress || "Account"}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} variant="destructive">
                    Sign out
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Theme</DropdownMenuLabel>
                  {renderThemeItems()}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
