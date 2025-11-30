import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Laptop, Moon, Sun, Check, User, Menu, X, Globe } from "lucide-react";

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
import { useLanguage } from "@/context/LanguageContext";

export default function NavBar() {
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const { theme, setTheme } = useTheme();
  const { t, language, toggleLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NAV_LINKS = [
    { label: t("nav.home"), href: "#hero" },
    { label: t("nav.about"), href: "#hero-content" },
    { label: t("nav.features"), href: "#features" },
    { label: t("nav.whyUs"), href: "#why-us" },
    { label: t("nav.upcoming"), href: "#upcoming" },
    { label: t("nav.faq"), href: "#faq" },
  ];

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
        className="flex items-center justify-between focus:bg-white/20 focus:text-white"
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {label}
        </span>
        {theme === value && <Check className="h-4 w-4 text-white" />}
      </DropdownMenuItem>
    ));

  return (
    <header className="fixed top-0 left-0 z-50 w-full bg-transparent text-white">
      <div className="mx-auto w-full max-w-7xl px-2 sm:px-4 md:px-6 py-2 sm:py-3">
        <div className="relative flex w-full items-center justify-between gap-2 sm:gap-4">
          {/* Left: logo + brand */}
          <motion.div
            className="flex flex-shrink-0 items-center gap-2 sm:gap-3"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src={logo}
              alt="EduBot logo"
              className="h-10 w-10 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full border border-white/40 object-cover"
            />
            <div className="leading-tight">
              <p className="text-sm sm:text-lg font-semibold">EduBot</p>
              <p className="text-[0.6rem] sm:text-xs uppercase font-semibold tracking-[0.2em] sm:tracking-[0.5em] text-white/70">Egypt</p>
            </div>
          </motion.div>

          {/* Center: navigation links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-white/80">
            {NAV_LINKS.map(({ label, href, dir }) => (
              <a
                key={href}
                href={href}
                dir={dir || "ltr"}
                className="whitespace-nowrap rounded-full px-3 py-1 text-white/80 transition-all text-lg duration-200 hover:-translate-y-0.5 hover:bg-white/15 hover:text-white"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Right: CTA + user */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-white hover:bg-white/10 px-2 sm:px-3"
              onClick={toggleLanguage}
            >
              <Globe className="h-4 w-4 sm:h-5 sm:w-5 me-1" />
              <span className="hidden sm:inline">{language === "en" ? "AR" : "EN"}</span>
            </Button>

            <Button
              size="sm"
              className="hidden sm:flex rounded-full border border-white/40 bg-white/5 px-4 sm:px-5 text-sm text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/25 hover:text-white hover:shadow-lg"
              onClick={handleStartChatting}
            >
              {t("nav.startChatting")}
            </Button>

            {isSignedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-white/30 bg-transparent px-2 py-1 pe-3 text-sm font-medium text-white/90 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15 hover:text-white"
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
                      {user?.firstName || t("nav.account")}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#2C7A7B] text-white border-white/20">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {user?.fullName || t("nav.account")}
                      </span>
                      <span className="text-xs text-white/70">
                        {user?.primaryEmailAddress?.emailAddress || t("nav.account")}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/20" />
                  <DropdownMenuItem asChild className="focus:bg-white/20 focus:text-white">
                    <Link to="/profile">{t("nav.profile")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus:bg-white/20 focus:text-white">
                    <Link to="/dashboard">{t("nav.dashboard")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/20" />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="focus:bg-white/20 focus:text-white">{t("nav.theme")}</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-44 bg-[#2C7A7B] text-white border-white/20">
                      {renderThemeItems()}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator className="bg-white/20" />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-300 focus:bg-red-500/20 focus:text-red-200">
                    {t("nav.signOut")}
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
                {t("nav.account")}
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
          <div className="mt-3 sm:mt-4 border-t border-white/20 pb-3 sm:pb-4 lg:hidden">
            <nav className="flex flex-col gap-2 sm:gap-3 pt-3 sm:pt-4">
              {NAV_LINKS.map(({ label, href, dir }) => (
                <a
                  key={href}
                  href={href}
                  dir={dir || "ltr"}
                  className="rounded-full border border-white/20 bg-white/90 py-3 px-4 text-gray-900 text-sm sm:text-md font-medium transition-all duration-200 hover:bg-white hover:scale-[1.02] min-h-[44px] flex items-center shadow-sm"
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
