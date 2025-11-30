import { Card, CardContent } from "@/components/edubot/ui/card";
import { TrendingUp, Trophy, Smartphone } from "lucide-react";
import useScrollReveal from "@/hooks/useScrollReveal";
import { useLanguage } from "@/context/LanguageContext";

const UPCOMING_KEYS = [
  { icon: TrendingUp, key: "progress" },
  { icon: Trophy, key: "gamification" },
  { icon: Smartphone, key: "mobile" },
];

export default function UpcomingFeatures() {
  const [ref, mounted] = useScrollReveal({ once: false });
  const { t } = useLanguage();

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 scroll-mt-24" id="upcoming" ref={ref}>
      <div
        className="mx-auto max-w-7xl"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 600ms cubic-bezier(.22,.9,.31,1), transform 600ms cubic-bezier(.22,.9,.31,1)",
        }}
      >
        <div className="mb-12 sm:mb-16 space-y-3 sm:space-y-4 text-center pt-4 sm:pt-8">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 mb-3 sm:mb-4">
            Roadmap
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">{t("upcoming.title")}</h2>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground">
            {t("upcoming.subtitle")}
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {UPCOMING_KEYS.map(({ icon: Icon, key }, index) => {
            const delay = `${index * 100}ms`;
            const title = t(`upcoming.items.${key}.title`);
            const description = t(`upcoming.items.${key}.description`);
            
            return (
              <div
                key={key}
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(12px)",
                  transition: `opacity 520ms cubic-bezier(.22,.9,.31,1) ${delay}, transform 520ms cubic-bezier(.22,.9,.31,1) ${delay}`,
                }}
              >
                <Card className="h-full overflow-hidden border border-white/25 bg-white/40 dark:bg-white/5 shadow-lg backdrop-blur-sm transition-colors duration-300">
                  <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center space-y-4 sm:space-y-6 text-foreground">
                    <div className="relative">
                      <div className="absolute -inset-4 bg-primary/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative p-3 sm:p-4 bg-primary/10 ">
                        <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" strokeWidth={1.5} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg sm:text-xl font-bold">{title}</h3>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{description}</p>
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
