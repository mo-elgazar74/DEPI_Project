import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSignIn } from "@clerk/clerk-react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/edubot/ui/button";
import { Input } from "@/components/edubot/ui/input";
import { Label } from "@/components/edubot/ui/label";
import logo from "@/public/logo.svg";
import plainlogo from "@/public/logo2.png";

const oauthProviders = [
  {
    strategy: "oauth_google",
    label: "Google",
    renderIcon: () => (
      <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
  },
  {
    strategy: "oauth_microsoft",
    label: "Microsoft",
    renderIcon: () => (
      <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#F25022" d="M11.4 11.4H2.2V2.2h9.2v9.2z" />
        <path fill="#00A4EF" d="M22.8 11.4h-9.2V2.2h9.2v9.2z" />
        <path fill="#7FBA00" d="M11.4 22.8H2.2v-9.2h9.2v9.2z" />
        <path fill="#FFB900" d="M22.8 22.8h-9.2v-9.2h9.2v9.2z" />
      </svg>
    ),
  },
  {
    strategy: "oauth_facebook",
    label: "Facebook",
    renderIcon: () => (
      <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
];

const maskEmail = (value = "") => {
  const [localPart, domain] = value.split("@");
  if (!domain) return value;
  if (localPart.length <= 2) return `${localPart[0] ?? "*"}***@${domain}`;
  return `${localPart[0]}${"*".repeat(Math.max(localPart.length - 2, 3))}${
    localPart[localPart.length - 1]
  }@${domain}`;
};

export default function SignInForm() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState("credentials");
  const [emailAddressId, setEmailAddressId] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const redirectConfig = useMemo(() => {
    if (typeof window === "undefined") {
      return { redirectUrl: "/sso-callback", redirectUrlComplete: "/dashboard" };
    }
    const origin = window.location.origin;
    return {
      redirectUrl: `${origin}/sso-callback`,
      redirectUrlComplete: `${origin}/dashboard`,
    };
  }, []);

  if (!isLoaded) {
    return <p className="text-center text-gray-500">Preparing sign in...</p>;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!signIn) return;

    setError("");
    setStatus(stage === "credentials" ? "Signing you in..." : "Verifying code...");
    setIsSubmitting(true);

    try {
      if (stage === "credentials") {
        const result = await signIn.create({ identifier: email, password });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          navigate("/dashboard");
          return;
        }

        if (result.status === "needs_second_factor") {
          const emailFactor = (result.supportedSecondFactors || []).find(
            (factor) => factor.strategy === "email_code"
          );

          if (!emailFactor || !emailFactor.emailAddressId) {
            throw new Error("Second-factor email verification is not available for this account.");
          }

          await signIn.prepareSecondFactor({
            strategy: "email_code",
            emailAddressId: emailFactor.emailAddressId,
          });

          setEmailAddressId(emailFactor.emailAddressId);
          setStage("mfa");
          setCode("");
          setStatus(`We sent a verification code to ${maskEmail(email)}.`);
          return;
        }

        setStatus("Additional steps are required to complete sign in.");
        return;
      }

      const attempt = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code,
        emailAddressId,
      });

      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        navigate("/dashboard");
        return;
      }

      if (attempt.status === "needs_second_factor") {
        setStatus("A different verification step is required. Follow the instructions provided.");
        return;
      }

      setStatus("Unable to verify the code. Please try again.");
    } catch (err) {
      const message =
        err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message ||
        "Unable to sign in. Please try again.";
      setError(message);
      setStatus("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!signIn || !emailAddressId) return;
    setError("");
    setStatus("Sending a new code...");
    setIsResending(true);
    try {
      await signIn.prepareSecondFactor({ strategy: "email_code", emailAddressId });
      setStatus("We sent a new verification code to your email.");
    } catch (err) {
      const message =
        err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message ||
        "Unable to resend the code.";
      setError(message);
      setStatus("");
    } finally {
      setIsResending(false);
    }
  };

  const handleSocialSignIn = async (strategy) => {
    setError("");
    setStatus("Redirecting you to continue...");
    setIsRedirecting(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: redirectConfig.redirectUrl,
        redirectUrlComplete: redirectConfig.redirectUrlComplete,
      });
    } catch (err) {
      const message =
        err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message ||
        "We couldn't start that social sign in. Try again.";
      setError(message);
      setStatus("");
      setIsRedirecting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="absolute -top-28 left-1/2 -translate-x-1/2 z-10 ">
          <div className="relative">
            <img 
              src={plainlogo} 
              alt="EduBot Egypt Logo" 
              className="w-64 h-64 object-contain relative z-10"
              />
          </div>
      </div>
      <div className="text-center mt-6 space-y-3">
      <h1 className="text-4xl font-bold text-gray-900">Login</h1>
      <p className="text-sm text-[#61749a]">
        {stage === "credentials"
          ? "Welcome Back to EduBot."
          : `Enter the verification code sent to ${maskEmail(email)}.`}
      </p>
      </div>
<form onSubmit={handleSubmit} className="space-y-6">
        {stage === "credentials" ? (
          <div className="space-y-5">
            <div className="space-y-2 text-left">
              <Label htmlFor="email" className="text-base font-medium text-slate-600">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="username@gmail.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className="h-12 rounded-xl border border-[#dce5ff] bg-[#eef4ff] text-slate-700 shadow-sm shadow-sky-200/20 transition focus:border-[#2563eb] focus:bg-white focus:shadow-lg focus:shadow-sky-200/50 focus-visible:ring-2 focus-visible:ring-[#2563eb]/40"
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="password" className="text-base font-medium text-slate-600">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-12 rounded-xl border border-[#dce5ff] bg-[#eef4ff] pr-12 text-slate-700 shadow-sm shadow-sky-200/20 transition focus:border-[#2563eb] focus:bg-white focus:shadow-lg focus:shadow-sky-200/50 focus-visible:ring-2 focus-visible:ring-[#2563eb]/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="text-left text-sm font-medium text-slate-600">
              <Link to="/forgot-password" className="transition hover:text-[#2563eb]">
                Forget Password?
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2 text-left">
              <Label htmlFor="otp" className="text-base font-medium text-slate-600">
                Verification Code
              </Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="\\d*"
                maxLength={6}
                placeholder="••••••"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ""))}
                required
                autoComplete="one-time-code"
                className="h-12 rounded-xl border border-[#dce5ff] bg-[#eef4ff] text-center text-lg tracking-[0.7em] text-slate-700 shadow-sm shadow-sky-200/20 transition focus:border-[#2563eb] focus:bg-white focus:shadow-lg focus:shadow-sky-200/50 focus-visible:ring-2 focus-visible:ring-[#2563eb]/40"
              />
            </div>
            <div className="flex items-center justify-between text-xs font-medium text-[#6c7a99]">
              <button
                type="button"
                onClick={() => {
                  setStage("credentials");
                  setCode("");
                  setEmailAddressId("");
                  setStatus("");
                  setError("");
                }}
                className="transition hover:text-[#2563eb]"
              >
                Change email
              </button>
              <button
                type="button"
                onClick={handleResendCode}
                className="transition hover:text-[#2563eb]"
                disabled={isResending}
              >
                {isResending ? "Resending..." : "Resend code"}
              </button>
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="h-12 w-full rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-base font-semibold shadow-lg shadow-sky-400/40 transition hover:from-[#1d4ed8] hover:to-[#153fad] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting || (stage === "mfa" && code.length !== 6)}
        >
          {stage === "credentials"
            ? isSubmitting
              ? "Signing in..."
              : "Login"
            : isSubmitting
            ? "Verifying..."
            : "Verify & Sign In"}
        </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or continue with</span>
            </div>
          </div>

        <div className="flex flex-wrap justify-center gap-5">
          {oauthProviders.map(({ strategy, label, renderIcon }) => (
            <button
              key={strategy}
              type="button"
              onClick={() => handleSocialSignIn(strategy)}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-[#cadeff] bg-white shadow-md transition hover:scale-110 hover:shadow-xl hover:shadow-sky-200/50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isRedirecting}
              aria-label={`Continue with ${label}`}
            >
              {renderIcon()}
            </button>
          ))}
        </div>
      </form>

      <div className="text-center text-sm text-slate-600">
        Don&apos;t have an account yet?
        <Link to="/signup" className="ml-1 font-semibold text-[#2563eb] hover:underline">
          Sign Up
        </Link>
      </div>

      {(status || error) && (
        <div className="space-y-1 rounded-xl bg-white/70 px-4 py-3 text-center text-sm shadow-sm shadow-sky-200/30">
          {status && <p className="text-[#1f3665]">{status}</p>}
          {error && <p className="text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
}
