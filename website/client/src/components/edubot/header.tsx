import { Link } from "react-router-dom"
import { Button } from "@/components/edubot/ui/button"
import { Search } from "lucide-react"
import { Logo } from "./logo"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto">
        <Logo />

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            مواطن
          </a>
          <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            العملات
          </a>
          <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Services
          </a>
          <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            تواصل
          </a>
          <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            الانضمام
          </a>
          <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            إرسال
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/signin"
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            تسجيل الدخول
          </Link>
          <Button asChild className="rounded-full">
            <Link to="/signup">إنشاء حساب</Link>
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
