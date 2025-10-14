export function AuthLayout({
  children,
  maxWidth = "max-w-[420px]",
  className = "",
  containerClassName = "",
  decor,
}) {
  return (
    <div
      className={`relative min-h-screen flex items-center justify-center bg-[#f9fafb] px-4 overflow-hidden ${className}`}
    >
      {decor && <div className="absolute inset-0 pointer-events-none" aria-hidden>{decor}</div>}
      <div
        className={`relative z-10 w-full bg-white rounded-3xl shadow-2xl p-10 ${maxWidth} ${containerClassName}`}
      >
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;
