import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/edubot/ui/accordion";
import useScrollReveal from "@/hooks/useScrollReveal";
import { useLanguage } from "@/context/LanguageContext";

const FAQ_KEYS = [
  "started",
  "customize",
  "languages",
  "subscription",
  "unique",
  "support",
  "images",
];

export default function FAQ() {
  const [ref, mounted] = useScrollReveal({ once: false });
  const { t } = useLanguage();

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 scroll-mt-24" id="faq" ref={ref}>
      <div
        className="mx-auto max-w-4xl"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 600ms cubic-bezier(.22,.9,.31,1), transform 600ms cubic-bezier(.22,.9,.31,1)",
        }}
      >
        <div className="mb-10 sm:mb-12 space-y-3 sm:space-y-4 text-center pt-4 sm:pt-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">{t("faq.title")}</h2>
          <p className="text-base sm:text-lg text-white/80">
            {t("faq.subtitle")}
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
          {FAQ_KEYS.map((key, index) => {
            const delay = `${index * 60}ms`;
            const question = t(`faq.items.${key}.question`);
            const answer = t(`faq.items.${key}.answer`);

            return (
              <AccordionItem
                key={key}
                value={`item-${index}`}
                className="rounded-xl border border-white/20 bg-white/40 backdrop-blur-sm px-4 sm:px-6"
                data-testid={`accordion-faq-${index}`}
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(8px)",
                  transition: `opacity 480ms cubic-bezier(.22,.9,.31,1) ${delay}, transform 480ms cubic-bezier(.22,.9,.31,1) ${delay}`,
                }}
              >
                <AccordionTrigger className="py-4 sm:py-5 text-start text-sm sm:text-base font-semibold text-black min-h-[44px]">
                  {question}
                </AccordionTrigger>
                <AccordionContent className="pb-4 sm:pb-5 text-start text-sm sm:text-base text-black/80">{answer}</AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </section>
  );
}
