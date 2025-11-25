import { Card, CardContent } from "@/components/edubot/ui/card";
import { BookOpen, Brain, Clock, MessageCircle, Users, Zap } from "lucide-react";
import useScrollReveal from "@/hooks/useScrollReveal";

const FEATURES = [
  {
    icon: Clock,
    title: "24/7 Availability",
    description: "Get instant answers anytime. Our AI assistant never sleeps and is always ready to help.",
  },
  {
    icon: BookOpen,
    title: "Instant Explanations",
    description: "Receive clear, concise explanations tailored to your learning level and style.",
  },
  {
    icon: Brain,
    title: "Personalized Experience",
    description: "Adaptive learning that adjusts to your pace and helps you reach your educational goals.",
  },
  {
    icon: Users,
    title: "Suitable for All Levels",
    description: "From primary to university, Edu-Bot supports learners at every stage.",
  },
  {
    icon: Zap,
    title: "Task Automation",
    description: "Save time with AI-powered assistance for homework, research, and study planning.",
  },
  {
    icon: MessageCircle,
    title: "Continuous Learning",
    description: "Learn new concepts through interactive conversations and get real-time feedback.",
  },
];

export default function Features() {
  const [ref, mounted] = useScrollReveal({ once: false });

  return (
    <section className="py-20 px-6 scroll-mt-32" id="features" ref={ref}>
      <div
        className="mx-auto max-w-7xl"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 600ms cubic-bezier(.22,.9,.31,1), transform 600ms cubic-bezier(.22,.9,.31,1)",
        }}
      >
        <div className="mb-16 space-y-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Discover the Power of Edu-Bot</h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Experience intelligent assistance designed to elevate your learning journey with cutting-edge AI technology.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }, index) => {
            const delay = `${index * 80}ms`;
            return (
              <div
                key={title}
                className="card-reveal"
                data-testid={`card-feature-${index}`}
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(12px)",
                  transition: `opacity 520ms cubic-bezier(.22,.9,.31,1) ${delay}, transform 520ms cubic-bezier(.22,.9,.31,1) ${delay}`,
                }}
              >
                {/* Top section that opens */}
                <Card className="card-reveal-top h-full border border-white/25 bg-white/40 dark:bg-white/5 shadow-lg backdrop-blur-sm">
                  <CardContent className="space-y-4 p-8 h-full flex flex-col">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                      <Icon className="h-7 w-7 text-primary" strokeWidth={1.6} />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                    <p className="leading-relaxed text-muted-foreground flex-grow">{description}</p>
                  </CardContent>
                </Card>
                {/* Hidden content that reveals */}
                <Card className="card-reveal-content h-full border border-white/20 shadow-lg bg-gradient-to-br from-[#37999c] via-[#37df90] to-[#4f46e5] text-white backdrop-blur-sm">
                  <CardContent className="space-y-6 p-8 h-full flex flex-col justify-center items-center text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 ring-4 ring-white/10">
                      <Icon className="h-10 w-10 text-white" strokeWidth={2} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{title}</h3>
                    <p className="text-sm leading-relaxed text-white/90 max-w-xs">{description}</p>
                    <div className="mt-4 pt-4 border-t border-white/10 w-full">
                      <span className="text-sm text-white font-semibold inline-flex items-center gap-2">
                        Explore Feature
                        <span className="text-lg">→</span>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
