import { Card, CardContent } from "@/components/edubot/ui/card";
import { BookOpen, Brain, Clock, MessageCircle, Users, Zap } from "lucide-react";
import useScrollReveal from "@/hooks/useScrollReveal";
import { useLanguage } from "@/context/LanguageContext";

const FEATURES_KEYS = [
  { icon: Clock, key: "availability" },
  { icon: BookOpen, key: "explanations" },
  { icon: Brain, key: "personalized" },
  { icon: Users, key: "levels" },
  { icon: Zap, key: "automation" },
  { icon: MessageCircle, key: "learning" },
];

export default function Features() {
  const [ref, mounted] = useScrollReveal({ once: false });
  const { t } = useLanguage();

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 scroll-mt-22" id="features" ref={ref}>
      <div
        className="mx-auto max-w-7xl"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 600ms cubic-bezier(.22,.9,.31,1), transform 600ms cubic-bezier(.22,.9,.31,1)",
        }}
      >
        <div className="mb-12 sm:mb-16 space-y-3 sm:space-y-4 text-center pt-4 sm:pt-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">{t("features.title")}</h2>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground">
            {t("features.subtitle")}
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES_KEYS.map(({ icon: Icon, key }, index) => {
            const delay = `${index * 80}ms`;
            const title = t(`features.items.${key}.title`);
            const description = t(`features.items.${key}.description`);
            
            return (
              <div
                key={key}
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
                  <CardContent className="space-y-3 sm:space-y-4 p-5 sm:p-6 md:p-8 h-full flex flex-col">
                    <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-white/20">
                      <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" strokeWidth={1.6} />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground">{title}</h3>
                    <p className="text-sm sm:text-base leading-relaxed text-muted-foreground flex-grow">{description}</p>
                  </CardContent>
                </Card>
                {/* Hidden content that reveals */}
                <Card className="card-reveal-content h-full border border-[#37999c] shadow-lg bg-gradient-to-br from-[#37999c] via-[#37df90] to-[#4f46e5] text-white backdrop-blur-sm">
                  <CardContent className="space-y-4 sm:space-y-6 p-5 sm:p-6 md:p-8 h-full flex flex-col justify-center items-center text-center">
                    <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-white/10 ring-4 ring-white/10">
                      <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={2} />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">{title}</h3>
                    <p className="text-xs sm:text-sm leading-relaxed text-white/90 max-w-xs">{description}</p>
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
