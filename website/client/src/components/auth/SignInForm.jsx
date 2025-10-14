import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSignIn } from "@clerk/clerk-react";
import { Mail, Lock } from "lucide-react";

const oauthProviders = [
  { strategy: "oauth_google", label: "Google", icon: "G" },
  { strategy: "oauth_facebook", label: "Facebook", icon: "f" },
  { strategy: "oauth_microsoft", label: "Microsoft", icon: "MS" },
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
    <div className="space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-serif text-[#1f2a44]">ChatAI</h1>
        <p className="text-sm font-medium text-[#4d4f5c] tracking-wide">
          {stage === "credentials"
            ? "Please login to your account"
            : `Enter the verification code sent to ${maskEmail(email)}`}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-7">
        {stage === "credentials" ? (
          <div className="space-y-4">
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
            <label className="block">
              <span className="sr-only">Password</span>
              <div className="flex items-center gap-3 rounded-full bg-white shadow-[0_15px_45px_rgba(31,42,68,0.12)] px-5 py-3">
                <Lock className="h-5 w-5 text-[#1f2a44]" aria-hidden />
                <input
                  type="password"
                  placeholder="Enter Your Password"
                  className="w-full border-none bg-transparent text-[#1f2a44] placeholder:text-[#9294a3] focus:outline-none"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  required
                  autoComplete="current-password"
                />
              </div>
            </label>
            <div className="flex justify-end text-xs font-semibold text-[#7a7c8f]">
              <Link to="/forgot-password" className="hover:text-[#1f2a44] transition-colors">
                Forgot Password?
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block">
              <span className="sr-only">Verification Code</span>
              <div className="flex items-center gap-3 rounded-full bg-white shadow-[0_15px_45px_rgba(31,42,68,0.12)] px-5 py-3">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\\d*"
                  maxLength={6}
                  placeholder="Enter the 6-digit code"
                  className="w-full border-none bg-transparent text-[#1f2a44] placeholder:text-[#9294a3] focus:outline-none tracking-[0.6em] text-center"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                  required
                  autoComplete="one-time-code"
                />
              </div>
            </label>
            <div className="flex items-center justify-between text-xs font-semibold text-[#7a7c8f]">
              <button
                type="button"
                onClick={() => {
                  setStage("credentials");
                  setCode("");
                  setEmailAddressId("");
                  setStatus("");
                  setError("");
                }}
                className="hover:text-[#1f2a44] transition-colors"
              >
                Change email
              </button>
              <button
                type="button"
                onClick={handleResendCode}
                className="hover:text-[#1f2a44] transition-colors"
                disabled={isResending}
              >
                {isResending ? "Resending..." : "Resend code"}
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-full bg-[#1f2a44] py-3 text-white font-semibold tracking-wide shadow-[0_18px_35px_rgba(31,42,68,0.35)] transition transform hover:-translate-y-0.5 disabled:opacity-60"
          disabled={isSubmitting || (stage === "mfa" && code.length !== 6)}
        >
          {stage === "credentials"
            ? isSubmitting
              ? "Signing in..."
              : "Login"
            : isSubmitting
            ? "Verifying..."
            : "Verify & Sign In"}
        </button>

        <div className="flex items-center gap-4 text-xs text-[#9da0b5]">
          <span className="flex-1 h-px bg-[#d8d9e1]" />
          <span>or</span>
          <span className="flex-1 h-px bg-[#d8d9e1]" />
        </div>

        <div className="flex items-center justify-center gap-4">
          {oauthProviders.map(({ strategy, label, icon }) => (
            <button
              key={strategy}
              type="button"
              onClick={() => handleSocialSignIn(strategy)}
              className="h-12 w-14 rounded-2xl bg-[#1f2a44] text-white text-xl font-semibold flex items-center justify-center transition hover:bg-[#25315c] disabled:opacity-60"
              disabled={isRedirecting}
              aria-label={`Continue with ${label}`}
            >
              {icon}
            </button>
          ))}
        </div>
      </form>

      <div className="text-center text-sm text-[#7a7c8f]">
        Don’t Have Account?
        <Link to="/signup" className="ml-1 font-semibold text-[#1f2a44] hover:underline">
          Sign Up
        </Link>
      </div>

      {(status || error) && (
        <div className="space-y-1 text-center text-sm">
          {status && <p className="text-[#1f2a44]">{status}</p>}
          {error && <p className="text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
}
