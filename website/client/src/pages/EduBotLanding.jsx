import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import CTA from "@/components/home/CTA";
import FAQ from "@/components/home/FAQ";
import Features from "@/components/home/Features";
import Footer from "@/components/home/Footer";
import Hero from "@/components/home/Hero";
import NavBar from "@/components/home/NavBar";

export default function EduBotLandingPage() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine active theme
  const activeTheme = mounted ? (theme === "system" ? systemTheme : theme) : "light";

  // Gradient backgrounds - COMMENTED OUT FOR EASY RESTORATION
  const lightGradient = 'linear-gradient(135deg, #ffffffff 0%, #2a9296ff 55%, #02a4afff 100%)';
  const darkGradient = 'linear-gradient(135deg, rgba(0, 0, 0, 1) 0%, rgba(8, 119, 136, 1) 60%, rgba(59, 58, 58, 1) 100%)';
  const lightTextColor = "#1b2329ff";
  const darkTextColor = "#f5f7ff";
  const pageTextColor = activeTheme === "dark" ? darkTextColor : lightTextColor;

  // // New gradient backgrounds for sections (complementing the robot hero image)
  // const lightGradient = 'linear-gradient(135deg, rgb(176, 224, 230) 0%, rgb(255, 218, 185) 50%, rgb(255, 239, 213) 100%)';
  // const darkGradient = 'linear-gradient(135deg, rgba(20, 30, 40) 0%, rgba(30, 50, 70) 50%, rgba(40, 60, 80) 100%)';

  return (
    <div 
      className="min-h-screen transition-colors"
      style={{
        background: activeTheme === "dark" ? darkGradient : lightGradient,
        color: pageTextColor,
      }}
    >
      <NavBar />
      <Hero />
      <main className="relative z-10">
        <Features />
        <FAQ />
        {/* <CTA /> */}
      </main>
      <Footer />
    </div>
  );
}
