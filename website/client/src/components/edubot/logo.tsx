export function Logo({ className = "", showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo Icon - SVG from public folder */}
      <div className="relative">
        <img src="/logo.svg" alt="EduBot Egypt Logo" className="w-20 h-20" loading="lazy" />
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className="font-bold text-lg text-foreground">EduBot Egypt</span>
          <span className="text-xs text-muted-foreground font-arabic">مساعد التعليم الذكي</span>
        </div>
      )}
    </div>
  )
}
