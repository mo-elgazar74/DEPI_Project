import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSignIn } from "@clerk/clerk-react";
import { Mail, Lock } from "lucide-react";

import { AuthLayout } from "@/components/auth/AuthLayout";

const curves = (
  <>
    <div className="absolute -left-[32%] -top-[28%] h-[120%] w-[70%] -rotate-[25deg] rounded-[60%] bg-gradient-to-br from-[#d7d4e4]/80 via-[#eceaf6]/60 to-transparent opacity-80" />
    <div className="absolute inset-x-1/4 -top-[35%] h-[140%] w-[120%] rotate-[18deg] rounded-[60%] bg-gradient-to-tl from-transparent via-[#dedbf0]/80 to-transparent opacity-80" />
    <div className="absolute -right-[30%] top-[8%] h-[120%] w-[65%] rotate-[18deg] rounded-[60%] bg-gradient-to-bl from-[#c9c4df]/80 via-[#e5e3f4]/70 to-transparent opacity-80" />
    <div className="absolute -bottom-[38%] left-[-10%] h-[110%] w-[85%] -rotate-[12deg] rounded-[60%] bg-gradient-to-tr from-transparent via-[#dcd9eb]/70 to-[#bdb7d6]/60 opacity-70" />
  </>
);

const steps = {
  EMAIL: "email",
  CODE: "code",
  PASSWORD: "password",
  COMPLETE: "complete",
};

export default function ForgotPasswordPage() {
  const { signIn, isLoaded, setActive } = useSignIn();
  const navigate = useNavigate();

  const [step, setStep] = useState(steps.EMAIL);
  const [email, setEmail] = useState("");
  const [codeDigits, setCodeDigits] = useState(() => Array(6).fill(""));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const codeInputsRef = useRef([]);
  const code = codeDigits.join("");

  const focusCodeInput = (index) => {
    requestAnimationFrame(() => {
      codeInputsRef.current[index]?.focus();
      codeInputsRef.current[index]?.select?.();
    });
  };

  const resetCodeDigits = () => {
    setCodeDigits(Array(6).fill(""));
    if (step === steps.CODE) {
      focusCodeInput(0);
    }
  };

  const handleDigitChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setCodeDigits((prev) => {
      const next = [...prev];
      next[index] = digit ?? "";
      return next;
    });
    if (digit && index < codeInputsRef.current.length - 1) {
      focusCodeInput(index + 1);
    }
  };

  const handleDigitKeyDown = (index, event) => {
    if (event.key === "Backspace" && !codeDigits[index] && index > 0) {
      event.preventDefault();
      setCodeDigits((prev) => {
        const next = [...prev];
        next[index - 1] = "";
        return next;
      });
      focusCodeInput(index - 1);
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusCodeInput(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < codeInputsRef.current.length - 1) {
      event.preventDefault();
      focusCodeInput(index + 1);
    }
  };

  const handleCodePaste = (event) => {
    const pasted = event.clipboardData?.getData("Text") || "";
    const digits = pasted.replace(/\D/g, "").slice(0, 6);
    if (!digits) {
      return;
    }
    event.preventDefault();
    const next = Array(6).fill("");
    digits.split("").forEach((digit, index) => {
      next[index] = digit;
    });
    setCodeDigits(next);
    focusCodeInput(Math.min(digits.length, 5));
  };

  useEffect(() => {
    if (step === steps.CODE) {
      focusCodeInput(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (!isLoaded) {
    return null;
  }

  const firstError = (err, fallback) =>
    err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || fallback;

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError("");
    const identifier = email.trim();
    if (!identifier) {
      setError("Please enter your email address.");
      return;
    }

    setStatus("Sending reset code...");
    setLoading(true);
    try {
      const firstAttempt = await signIn.create({ identifier });
      const availableFactors = firstAttempt?.supportedFirstFactors ?? signIn.supportedFirstFactors ?? [];
      const resetFactor = availableFactors.find(
        (factor) => factor.strategy === "reset_password_email_code"
      );

      if (!resetFactor || !resetFactor.emailAddressId) {
        throw new Error("Password reset is not available for this account.");
      }

      await signIn.prepareFirstFactor({
        strategy: "reset_password_email_code",
        emailAddressId: resetFactor.emailAddressId,
      });
      setStatus("We sent a verification code to your email.");
      resetCodeDigits();
      setPassword("");
      setConfirmPassword("");
      setStep(steps.CODE);
    } catch (err) {
      setError(firstError(err, "Unable to send reset code. Please try again."));
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  const attemptVerifyCode = async (rawCode) => {
    const sanitizedCode = rawCode.trim();
    if (sanitizedCode.length !== 6) {
      return;
    }
    setError("");
    setStatus("Verifying code...");
    setLoading(true);
    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: sanitizedCode,
      });

      if (attempt.status === "needs_new_password") {
        setStatus("Code verified! Create your new password.");
        setStep(steps.PASSWORD);
      } else {
        setError("We couldn't verify that code. Please try again.");
        setStatus("");
      }
    } catch (err) {
      setError(firstError(err, "Invalid or expired code. Request a new one."));
      setStatus("");
      resetCodeDigits();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const sanitizedCode = code.trim();
    if (sanitizedCode.length !== 6) {
      setError("Please enter the 6-digit verification code we emailed you.");
      return;
    }
    await attemptVerifyCode(sanitizedCode);
  };

  useEffect(() => {
    const sanitizedCode = code.trim();
    if (sanitizedCode.length === 6 && !loading && step === steps.CODE) {
      attemptVerifyCode(sanitizedCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, loading, step]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    setStatus("Updating your password...");
    setLoading(true);

    try {
      const reset = await signIn.resetPassword({
        password,
        signOutOfOtherSessions: true,
      });

      if (reset.status === "complete") {
        await setActive({ session: reset.createdSessionId });
        setStatus("Password updated! Redirecting...");
        setStep(steps.COMPLETE);
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        setError("We couldn't finish the reset. Please request a new code.");
        setStatus("");
      }
    } catch (err) {
      setError(firstError(err, "Unable to update password. Try again."));
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      maxWidth="max-w-[520px]"
      className="bg-[#f5f6f4]"
      containerClassName="bg-transparent shadow-none rounded-none p-0"
      decor={curves}
    >
      <div className="space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-serif text-[#1f2a44]">Reset Password</h1>
          <p className="text-sm font-medium text-[#4d4f5c] tracking-wide">
            {step === steps.EMAIL && "Enter your email to receive a reset code."}
            {step === steps.CODE && "Enter the verification code we sent to your email."}
            {step === steps.PASSWORD && "Create a new password to finish resetting."}
            {step === steps.COMPLETE && "All set! Taking you to your dashboard."}
          </p>
        </div>

        {step === steps.EMAIL && (
          <form onSubmit={handleRequestCode} className="space-y-7">
            <label className="block">
              <span className="sr-only">Email</span>
              <div className="flex items-center gap-3 rounded-full bg-white shadow-[0_15px_45px_rgba(31,42,68,0.12)] px-5 py-3">
                <Mail className="h-5 w-5 text-[#1f2a44]" aria-hidden />
                <input
                  type="email"
                  placeholder="Enter Your Email"
                  className="w-full border-none bg-transparent text-[#1f2a44] placeholder:text-[#9294a3] focus:outline-none"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  required
                  autoComplete="email"
                />
              </div>
            </label>
            <button
              type="submit"
              className="w-full rounded-full bg-[#1f2a44] py-3 text-white font-semibold tracking-wide shadow-[0_18px_35px_rgba(31,42,68,0.35)] transition transform hover:-translate-y-0.5 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        )}

        {step === steps.CODE && (
          <form onSubmit={handleVerifyCode} className="space-y-7">
            <div
              className="flex justify-center gap-3"
              onPaste={handleCodePaste}
            >
              {codeDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (codeInputsRef.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  autoComplete="one-time-code"
                  aria-label={`Verification digit ${index + 1}`}
                  className="h-14 w-12 rounded-2xl border border-[#d8d9e1] bg-white text-center text-xl font-semibold text-[#1f2a44] shadow-[0_12px_30px_rgba(31,42,68,0.08)] focus:border-[#1f2a44] focus:outline-none focus:ring-2 focus:ring-[#1f2a44]/20"
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(index, e)}
                />
              ))}
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-[#1f2a44] py-3 text-white font-semibold tracking-wide shadow-[0_18px_35px_rgba(31,42,68,0.35)] transition transform hover:-translate-y-0.5 disabled:opacity-60"
              disabled={loading || code.length !== 6}
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>
            <button
              type="button"
              className="block w-full text-center text-xs font-semibold text-[#7a7c8f] hover:text-[#1f2a44]"
              onClick={() => {
                setStep(steps.EMAIL);
                setStatus("Request a new code.");
                resetCodeDigits();
              }}
            >
              Didn't receive it? Request again
            </button>
          </form>
        )}

        {step === steps.PASSWORD && (
          <form onSubmit={handleResetPassword} className="space-y-7">
            <div className="space-y-4">
              <label className="block">
                <span className="sr-only">New password</span>
                <div className="flex items-center gap-3 rounded-full bg-white shadow-[0_15px_45px_rgba(31,42,68,0.12)] px-5 py-3">
                  <Lock className="h-5 w-5 text-[#1f2a44]" aria-hidden />
                  <input
                    type="password"
                    placeholder="Create New Password"
                    className="w-full border-none bg-transparent text-[#1f2a44] placeholder:text-[#9294a3] focus:outline-none"
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
              </label>
              <label className="block">
                <span className="sr-only">Confirm password</span>
                <div className="flex items-center gap-3 rounded-full bg-white shadow-[0_15px_45px_rgba(31,42,68,0.12)] px-5 py-3">
                  <Lock className="h-5 w-5 text-[#1f2a44]" aria-hidden />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    className="w-full border-none bg-transparent text-[#1f2a44] placeholder:text-[#9294a3] focus:outline-none"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    value={confirmPassword}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
              </label>
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-[#1f2a44] py-3 text-white font-semibold tracking-wide shadow-[0_18px_35px_rgba(31,42,68,0.35)] transition transform hover:-translate-y-0.5 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Updating..." : "Save New Password"}
            </button>
          </form>
        )}

        {status && <p className="text-center text-sm text-[#1f2a44]">{status}</p>}
        {error && <p className="text-center text-sm text-red-500">{error}</p>}
      </div>
    </AuthLayout>
  );
}
