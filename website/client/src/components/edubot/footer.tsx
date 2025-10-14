import { Github } from "lucide-react"
import { Logo } from "./logo"

export function Footer() {
  return (
    <footer className="bg-[#1a1f2e] text-white">
      <div className="container px-4 py-8 mx-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Logo className="text-white" />

            {/* Links */}
            <nav className="flex items-center gap-6 text-sm">
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                خلفية
              </a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                المستوى الخير
              </a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                خلفية المرام الأساسي
              </a>
            </nav>

            {/* GitHub Link */}
            <a href="#" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <Github className="w-5 h-5" />
              <span className="text-sm">Github</span>
            </a>
          </div>

          {/* Copyright */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-white/50">© 2025 EduBot Egypt | Developed by [Team Name]</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
