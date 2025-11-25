import { SignUpForm } from "@/components/auth/SignUpForm";
import logo from "@/public/logo.svg";
import authBackground from "@/public/background.png";
import { motion, useReducedMotion } from "framer-motion";

export default function SignUpPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#e7f1f5]">
      <img
        src={authBackground}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-90"
      />
      <div className="absolute inset-0 bg-[#e9f3ff]/92" />

    <div className="absolute left-10 top-10 hidden md:flex items-center z-20">
    <motion.img
      src={logo}
      alt="EduBot Egypt"
      className="h-48 w-auto flex-none object-contain block"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.7, delay: 0, ease: "easeOut" }}
    />
    <motion.div
      className="-ml-8 mx-0 h-16 w-px bg-[#2563eb]"
      style={{ transformOrigin: "center top" }}
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
    />
    <div className="pl-3 leading-tight text-right">
      <motion.div
        initial={{ clipPath: "inset(0% 100% 0% 0%)", opacity: 0 }}
        animate={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.55, ease: "easeOut" }}
      >
        <p className="text-2xl font-semibold text-[#2563eb]">EduBot Egypt</p>
        <p className="text-base text-[#61749a]" dir="rtl">
          مساعد التعلم الذكي
        </p>
      </motion.div>
    </div>
  </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <div className="relative w-full max-w-[520px]">
          <div className="absolute inset-0 rounded-[34px] bg-white shadow-2xl ring-1 ring-white/70" />

          <div className="relative px-8 pb-12 pt-16 sm:px-12 md:px-14 md:pb-14 md:pt-18">
            <SignUpForm />
          </div>
        </div>
      </div>
    </div>
  );
}
