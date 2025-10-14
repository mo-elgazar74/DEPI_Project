import { AuthLayout } from "@/components/auth/AuthLayout";
import SignInForm from "@/components/auth/SignInForm";

const curves = (
  <>
    <div className="absolute -left-[32%] -top-[28%] h-[120%] w-[70%] -rotate-[25deg] rounded-[60%] bg-gradient-to-br from-[#d7d4e4]/80 via-[#eceaf6]/60 to-transparent opacity-80" />
    <div className="absolute inset-x-1/4 -top-[35%] h-[140%] w-[120%] rotate-[18deg] rounded-[60%] bg-gradient-to-tl from-transparent via-[#dedbf0]/80 to-transparent opacity-80" />
    <div className="absolute -right-[30%] top-[8%] h-[120%] w-[65%] rotate-[18deg] rounded-[60%] bg-gradient-to-bl from-[#c9c4df]/80 via-[#e5e3f4]/70 to-transparent opacity-80" />
    <div className="absolute -bottom-[38%] left-[-10%] h-[110%] w-[85%] -rotate-[12deg] rounded-[60%] bg-gradient-to-tr from-transparent via-[#dcd9eb]/70 to-[#bdb7d6]/60 opacity-70" />
  </>
);

export default function SignInPage() {
  return (
    <AuthLayout
      maxWidth="max-w-[520px]"
      className="bg-[#f5f6f4]"
      containerClassName="bg-transparent shadow-none rounded-none p-0"
      decor={curves}
    >
      <SignInForm />
    </AuthLayout>
  );
}
