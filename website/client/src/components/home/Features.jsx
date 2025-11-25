import { Card, CardContent } from "@/components/edubot/ui/card";
import { BookOpen, Brain, Clock, MessageCircle, Users, Zap } from "lucide-react";

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
  return (
    <section className="bg-background py-20 px-6" id="features">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 space-y-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Discover the Power of Edu-Bot</h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Experience intelligent assistance designed to elevate your learning journey with cutting-edge AI technology.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }, index) => (
            <Card key={title} className="overflow-visible transition duration-200 hover:-translate-y-1 hover:shadow-xl" data-testid={`card-feature-${index}`}>
              <CardContent className="space-y-4 p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-7 w-7 text-primary" strokeWidth={1.6} />
                </div>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="leading-relaxed text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
