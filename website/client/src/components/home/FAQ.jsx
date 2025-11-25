import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/edubot/ui/accordion";

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
  return (
    <section className="bg-card/30 py-20 px-6" id="faq">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 space-y-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Have Questions?</h2>
          <p className="text-lg text-muted-foreground">
            Find answers to the most common questions about Edu-Bot and how it can help you succeed.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {FAQS.map((faq, index) => (
            <AccordionItem
              key={faq.question}
              value={`item-${index}`}
              className="rounded-lg border border-border bg-background px-6"
              data-testid={`accordion-faq-${index}`}
            >
              <AccordionTrigger className="py-5 text-left text-base font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
