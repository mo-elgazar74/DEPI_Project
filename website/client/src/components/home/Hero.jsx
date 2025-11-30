import { Button } from "@/components/edubot/ui/button";
import { Play } from "lucide-react";
import OrbitingIcons from "./OrbitingIcons";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import videoSrc from "@/public/Last_Robot_Video_4k.mp4";
import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function Hero() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // toggle mounted based on visibility
          setMounted(entry.isIntersecting);
        }
      },
      {
        // trigger as the hero content starts to enter the viewport
        threshold: 0,
        // shift the trigger point a bit earlier so animation starts when scrolling from the video
        rootMargin: "-20% 0px -60% 0px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [heroRef]);

  const handleStartChatting = () => {
    navigate(isSignedIn ? "/edubot" : "/signin");
  };

  const handleWatchDemo = () => {
    const target = document.querySelector("#features");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Video Hero Section */}
      <section
        id="hero"
        className="relative flex min-h-screen items-center justify-center overflow-hidden"
      >
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
        {/* Dimming overlay: will fade in when hero content becomes visible */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            opacity: mounted ? 1 : 0,
            transition: "opacity 500ms ease-out",
            pointerEvents: "none",
          }}
        />
      </section>

      {/* Second Section with Original Content */}
      <section
        id="hero-content"
        ref={heroRef}
        className={`flex min-h-screen items-center justify-center px-4 sm:px-6 py-12 sm:py-20 overflow-x-clip`}
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0) scale(1)" : "translateY(3rem) scale(0.96)",
          filter: mounted ? "blur(0px)" : "blur(2px)",
          transition:
            "opacity 600ms cubic-bezier(.22,.9,.31,1), transform 600ms cubic-bezier(.22,.9,.31,1), filter 600ms ease",
        }}
      >
        <div className="grid w-full max-w-7xl items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="space-y-6 sm:space-y-8 text-center lg:text-start">
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                {t("hero.headline")}
              </h1>
              <p className="mx-auto max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground lg:mx-0">
                {t("hero.subheadline")}
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 sm:gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Button
                size="lg"
                className="w-full sm:w-auto px-6 sm:px-8 text-sm sm:text-base"
                onClick={handleStartChatting}
                data-testid="button-start-chatting-2"
              >
                {t("hero.startChatting")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-6 sm:px-8 text-sm sm:text-base"
                onClick={handleWatchDemo}
                data-testid="button-watch-demo-2"
              >
                <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                {t("hero.learnMore")}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <OrbitingIcons />
          </div>
        </div>
      </section>
    </>
  );
}
