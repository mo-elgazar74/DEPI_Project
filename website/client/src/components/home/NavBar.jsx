import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Laptop, Moon, Sun, Check, User, Menu, X } from "lucide-react";

import logo from "@/public/logo.svg";
import { Button } from "@/components/edubot/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/edubot/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/edubot/ui/avatar";

const NAV_LINKS = [
  { label: "Home", href: "#hero" },
  { label: "About", href: "#hero-content" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
  { label: "Download", href: "#download" },
];

export default function NavBar() {
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleStartChatting = () => {
    navigate(isSignedIn ? "/edubot" : "/signin");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/signin");
  };

  const renderThemeItems = () =>
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
    ));

  return (
    <header className="fixed top-0 left-0 z-50 w-full bg-transparent text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6">
        <div className="relative flex w-full flex-wrap items-center gap-4">
          {/* Left: logo + brand */}
          <motion.div
            className="flex flex-shrink-0 items-center gap-3"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src={logo}
              alt="EduBot logo"
              className="h-10 w-10 rounded-full border border-white/40 object-cover"
            />
            <div className="leading-tight">
              <p className="text-lg font-semibold">EduBot</p>
              <p className="text-xs uppercase font-semibold tracking-[0.5em] text-white/70">Egypt</p>
            </div>
          </motion.div>

          {/* Center: navigation links */}
          <nav className="pointer-events-none hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-6 text-sm font-medium text-white/80">
            {NAV_LINKS.map(({ label, href, dir }) => (
              <a
                key={href}
                href={href}
                dir={dir || "ltr"}
                className="pointer-events-auto whitespace-nowrap rounded-full px-3 py-1 text-white/80 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15 hover:text-white"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Right: CTA + user */}
          <div className="ml-auto flex items-center gap-3">
            <Button
              size="sm"
              className="rounded-full border border-white/40 bg-white/5 px-5 text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/25 hover:text-white hover:shadow-lg"
              onClick={handleStartChatting}
            >
              Start Chatting
            </Button>

            {isSignedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-white/30 bg-transparent px-2 py-1 pr-3 text-sm font-medium text-white/90 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15 hover:text-white"
                  >
                    <Avatar className="h-8 w-8 border border-white/30">
                      <AvatarImage
                        src={user?.imageUrl}
                        alt={user?.fullName || "User avatar"}
                      />
                      <AvatarFallback className="bg-transparent text-white">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">
                      {user?.firstName || "Account"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {user?.fullName || "User"}
                      </span>
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
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-44">
                      {renderThemeItems()}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} variant="destructive">
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-white/40 bg-transparent px-3 py-1 text-sm font-medium text-white/90 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15 hover:text-white"
                onClick={() => navigate("/signin")}
              >
                <User className="h-4 w-4" />
                Account
              </button>
            )}

            <button
              className="p-2 text-white/80 transition-colors hover:text-white lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div className="mt-4 border-t border-white/20 pb-4 lg:hidden">
            <nav className="flex flex-col gap-3 pt-4">
              {NAV_LINKS.map(({ label, href, dir }) => (
                <a
                  key={href}
                  href={href}
                  dir={dir || "ltr"}
                  className="rounded-full border border-white/10 py-2 px-4 text-white/90 transition-all duration-200 hover:border-white/40 hover:bg-white/10 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
