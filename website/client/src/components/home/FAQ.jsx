import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/edubot/ui/accordion";
import useScrollReveal from "@/hooks/useScrollReveal";

const FAQS = [
  {
    question: "How do I get started with Edu-Bot?",
    answer:
      "Simply click the 'Start Chatting' button and begin asking questions. No setup or installation required!",
  },
  {
    question: "Can I customize Edu-Bot's responses to my learning needs?",
    answer:
      "Yes! Edu-Bot adapts to your learning style and can adjust explanations to match your comprehension level.",
  },
  {
    question: "Is Edu-Bot available in multiple languages?",
    answer:
      "Currently, Edu-Bot supports multiple languages and can help translate concepts between them for better understanding.",
  },
  {
    question: "Can Edu-Bot manage my subscription automatically?",
    answer:
      "You can manage subscription settings at any time through your account dashboard.",
  },
  {
    question: "What makes Edu-Bot unique from other AI chatbots?",
    answer:
      "Edu-Bot is designed for education with step-by-step explanations, progress tracking, and curriculum alignment.",
  },
  {
    question: "What kind of support is available if I encounter issues?",
    answer:
      "We offer 24/7 support through email, chat, and an extensive help center with guides and tutorials.",
  },
  {
    question: "Can Edu-Bot generate images for educational purposes?",
    answer:
      "Yes, Edu-Bot can generate visual aids, diagrams, and illustrations to help explain complex concepts.",
  },
];

export default function FAQ() {
  const [ref, mounted] = useScrollReveal({ once: false });

  return (
    <section className="py-20 px-6 scroll-mt-32" id="faq" ref={ref}>
      <div
        className="mx-auto max-w-4xl"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 600ms cubic-bezier(.22,.9,.31,1), transform 600ms cubic-bezier(.22,.9,.31,1)",
        }}
      >
        <div className="mb-12 space-y-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Have Questions?</h2>
          <p className="text-lg text-white/80">
            Find answers to the most common questions about Edu-Bot and how it can help you succeed.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {FAQS.map((faq, index) => {
            const delay = `${index * 60}ms`;
            return (
              <AccordionItem
                key={faq.question}
                value={`item-${index}`}
                className="rounded-xl border border-white/20 bg-white/40 backdrop-blur-sm px-6"
                data-testid={`accordion-faq-${index}`}
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(8px)",
                  transition: `opacity 480ms cubic-bezier(.22,.9,.31,1) ${delay}, transform 480ms cubic-bezier(.22,.9,.31,1) ${delay}`,
                }}
              >
                <AccordionTrigger className="py-5 text-left text-base font-semibold text-black">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-black/80">{faq.answer}</AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </section>
  );
}
