import { Header } from "@/components/edubot/header"
import { Hero } from "@/components/edubot/hero"
import { Features } from "@/components/edubot/features"
import { CallToAction } from "@/components/edubot/call-to-action"
import { Footer } from "@/components/edubot/footer"

export function EduBotLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl" lang="ar">
      <Header />
      <main>
        <Hero />
        <Features />
        <CallToAction />
      </main>
      <Footer />
    </div>
  )
}

export default EduBotLandingPage
