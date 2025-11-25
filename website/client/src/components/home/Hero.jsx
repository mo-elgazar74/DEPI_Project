import { Button } from "@/components/edubot/ui/button";
import { Play } from "lucide-react";
import OrbitingIcons from "./OrbitingIcons";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import videoSrc from "@/public/Last_Robot_Video_4k.mp4";
import { useEffect, useState, useRef } from "react";

export default function Hero() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
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
      </section>

      {/* Second Section with Original Content */}
      <section
        id="hero-content"
        ref={heroRef}
        className={`flex min-h-screen items-center justify-center px-6 py-20 scroll-mt-32`}
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0) scale(1)" : "translateY(3rem) scale(0.96)",
          filter: mounted ? "blur(0px)" : "blur(2px)",
          transition:
            "opacity 600ms cubic-bezier(.22,.9,.31,1), transform 600ms cubic-bezier(.22,.9,.31,1), filter 600ms ease",
        }}
      >
        <div className="grid w-full max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                The Smartest AI Assistant{" "}
                <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                  Ready to Chat!
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl lg:mx-0">
                Get instant answers, learn new concepts, and explore the world of knowledge with our AI-powered
                educational companion. Available 24/7 to help you succeed.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Button
                size="lg"
                className="px-8 text-base"
                onClick={handleStartChatting}
                data-testid="button-start-chatting-2"
              >
                Start Chatting
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8 text-base"
                onClick={handleWatchDemo}
                data-testid="button-watch-demo-2"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
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
