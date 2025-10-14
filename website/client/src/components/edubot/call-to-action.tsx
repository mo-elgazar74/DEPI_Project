import { Button } from "@/components/edubot/ui/button"

export function CallToAction() {
  return (
    <section className="py-16 md:py-24 bg-primary text-primary-foreground">
      <div className="container px-4 mx-auto">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - CTA Content */}
            <div className="space-y-6 text-center lg:text-right">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">EduBot Egypt أصدر عاص Egypt</h2>

              <p className="text-lg md:text-xl text-primary-foreground/90 leading-relaxed">
                بالشرح هايلي معنا إلى التأسيس قوميه مصنا إيجابي
              </p>

              <div className="pt-4">
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-8 py-6 text-lg font-semibold shadow-lg"
                >
                  !جاهزيه EduBot أعلم
                </Button>
              </div>

              {/* Demo Preview Placeholder */}
              <div className="mt-8 bg-primary-foreground/10 rounded-2xl p-8 border border-primary-foreground/20">
                <p className="text-primary-foreground/70 text-center">Demo / Chat Preview Placeholder</p>
              </div>
            </div>

            {/* Right Side - Feature Cards (from reference image) */}
            <div className="grid grid-cols-2 gap-4">
              {/* This section mirrors the card layout from the reference */}
              <div className="col-span-2 bg-card text-card-foreground rounded-2xl p-6 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                  <Mic className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">شرح صوتي تفاعلي</h3>
                <p className="text-sm text-muted-foreground">استمع للشرح بصوت واضح</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Mic({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}
