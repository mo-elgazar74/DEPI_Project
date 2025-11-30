import { Card, CardContent } from "@/components/edubot/ui/card";
import { Brain, Globe, Sparkles, ShieldCheck, Gauge } from "lucide-react";
import useScrollReveal from "@/hooks/useScrollReveal";
import { useLanguage } from "@/context/LanguageContext";

const WHY_US_KEYS = [
  { icon: Brain, key: "expert" },
  { icon: Globe, key: "localized" },
  { icon: Sparkles, key: "engaging" },
  { icon: ShieldCheck, key: "safe" },
  { icon: Gauge, key: "adaptive" },
];

export default function WhyUs() {
  const [ref, mounted] = useScrollReveal({ once: false });
  const { t } = useLanguage();

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 scroll-mt-22 bg-muted/30" id="why-us" ref={ref}>
      <div
        className="mx-auto max-w-7xl"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 600ms cubic-bezier(.22,.9,.31,1), transform 600ms cubic-bezier(.22,.9,.31,1)",
        }}
      >
        <div className="mb-12 sm:mb-16 space-y-3 sm:space-y-4 text-center pt-4 sm:pt-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">{t("whyUs.title")}</h2>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground">
            {t("whyUs.subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8">
          {WHY_US_KEYS.map(({ icon: Icon, key }, index) => {
            const delay = `${index * 100}ms`;
            const title = t(`whyUs.items.${key}.title`);
            const description = t(`whyUs.items.${key}.description`);
            
            return (
              <div
                key={key}
                className="w-full md:w-[calc(50%-1.5rem)] lg:w-[calc(33.33%-2rem)] max-w-sm"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(12px)",
                  transition: `opacity 520ms cubic-bezier(.22,.9,.31,1) ${delay}, transform 520ms cubic-bezier(.22,.9,.31,1) ${delay}`,
                }}
              >
                <Card className="h-full border border-white/25 bg-white/40 dark:bg-white/5 shadow-lg hover:shadow-xl transition-shadow duration-500 backdrop-blur-sm">
                  <CardContent className="p-5 sm:p-6 flex flex-col items-center text-center space-y-3 sm:space-y-4 text-foreground">
                    <div className="p-2.5 sm:p-3 rounded-2xl bg-primary/10 text-primary mb-1 sm:mb-2">
                      <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold">{title}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{description}</p>
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
