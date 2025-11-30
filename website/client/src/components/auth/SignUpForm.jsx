import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSignUp } from "@clerk/clerk-react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/edubot/ui/input";
import { Label } from "@/components/edubot/ui/label";
import { Button } from "@/components/edubot/ui/button";
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

export function SignUpForm() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const redirectConfig = useMemo(() => {
    if (typeof window === "undefined") {
      return { redirectUrl: "/sso-callback", redirectUrlComplete: "/onboarding" };
    }
    const origin = window.location.origin;
    return {
      redirectUrl: `${origin}/sso-callback`,
      redirectUrlComplete: `${origin}/onboarding`,
    };
  }, []);

  if (!isLoaded) {
    return <p className="text-center text-gray-500">Preparing sign up...</p>;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }
    setStatus("Creating your account...");
    setIsSubmitting(true);
    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
      setStatus("We sent a verification code to your email.");
    } catch (err) {
      setError(err.errors?.[0]?.message || "Sign up failed. Please try again.");
      setStatus("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("Verifying code...");
    setIsVerifying(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setStatus("Verification complete! Redirecting...");
        navigate("/onboarding");
      } else {
        setError("Verification incomplete. Please request a new code.");
        setStatus("");
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || "Verification failed. Please try again.");
      setStatus("");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSocialSignUp = async (strategy) => {
    setError("");
    setStatus("Redirecting you to continue...");
    setIsRedirecting(true);
    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: redirectConfig.redirectUrl,
        redirectUrlComplete: redirectConfig.redirectUrlComplete,
      });
    } catch (err) {
      setError(err.errors?.[0]?.message || "We couldn't start that social sign up. Try again.");
      setStatus("");
      setIsRedirecting(false);
    }
  };

  return (
  <div className="space-y-8 pt-6">
    <div className="absolute -top-24 left-1/2 -translate-x-1/2 z-10 ">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative">
          <img 
            src={plainlogo} 
            alt="EduBot Egypt Logo" 
            className="w-56 h-56 object-contain relative z-10 "
          />
        </div>
      </div>
    </div>

    {/* <div className="h-[1px]" /> */}

    <div className="text-center mt-6 space-y-3">
      <h1 className="text-3xl font-semibold text-[#1f3665] md:text-4xl">
        {pendingVerification ? "Verify Email" : "Create Account"}
      </h1>
      <p className="text-sm text-[#61749a] ">
        {pendingVerification
          ? "Enter the code we emailed you to finish setting up your account."
          : "Join EduBot to unlock personalised learning journeys."}
      </p>
    </div>

      {!pendingVerification ? (
        <>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 text-left">
                <Label htmlFor="firstName" className="text-sm font-medium text-slate-600">
                  First name
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                  autoComplete="given-name"
                  className="h-12 rounded-xl border border-[#dce5ff] bg-[#eef4ff] text-slate-700 shadow-sm shadow-sky-200/20 transition focus:border-[#2563eb] focus:bg-white focus:shadow-lg focus:shadow-sky-200/50 focus-visible:ring-2 focus-visible:ring-[#2563eb]/40"
                />
              </div>
              <div className="space-y-2 text-left">
                <Label htmlFor="lastName" className="text-sm font-medium text-slate-600">
                  Last name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                  autoComplete="family-name"
                  className="h-12 rounded-xl border border-[#dce5ff] bg-[#eef4ff] text-slate-700 shadow-sm shadow-sky-200/20 transition focus:border-[#2563eb] focus:bg-white focus:shadow-lg focus:shadow-sky-200/50 focus-visible:ring-2 focus-visible:ring-[#2563eb]/40"
                />
              </div>
            </div>

            <div className="space-y-2 text-left">
              <Label htmlFor="email" className="text-sm font-medium text-slate-600">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className="h-12 rounded-xl border border-[#dce5ff] bg-[#eef4ff] text-slate-700 shadow-sm shadow-sky-200/20 transition focus:border-[#2563eb] focus:bg-white focus:shadow-lg focus:shadow-sky-200/50 focus-visible:ring-2 focus-visible:ring-[#2563eb]/40"
              />
            </div>

            <div className="space-y-2 text-left">
              <Label htmlFor="password" className="text-sm font-medium text-slate-600">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={8}
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

            <div className="space-y-2 text-left pb-4">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-600">
                Confirm password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={8}
                  className="h-12 rounded-xl border border-[#dce5ff] bg-[#eef4ff] pr-12 text-slate-700 shadow-sm shadow-sky-200/20 transition focus:border-[#2563eb] focus:bg-white focus:shadow-lg focus:shadow-sky-200/50 focus-visible:ring-2 focus-visible:ring-[#2563eb]/40"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-base font-semibold shadow-lg shadow-sky-400/40 transition hover:from-[#1d4ed8] hover:to-[#153fad] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <span className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or Sign up with</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-5">
            {oauthProviders.map(({ strategy, label, renderIcon }) => (
              <button
                key={strategy}
                type="button"
                onClick={() => handleSocialSignUp(strategy)}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-[#cadeff] bg-white shadow-md transition hover:scale-110 hover:shadow-xl hover:shadow-sky-200/50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isRedirecting}
                aria-label={label}
              >
                {renderIcon()}
              </button>
            ))}
          </div>
        </>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2 text-left">
            <Label htmlFor="otp" className="text-sm font-medium text-slate-600">
              Verification code
            </Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={6}
              placeholder="••••••"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ""))}
              required
              className="h-12 rounded-xl border border-[#dce5ff] bg-[#eef4ff] text-center text-lg tracking-[0.7em] text-slate-700 shadow-sm shadow-sky-200/20 transition focus:border-[#2563eb] focus:bg-white focus:shadow-lg focus:shadow-sky-200/50 focus-visible:ring-2 focus-visible:ring-[#2563eb]/40"
            />
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-base font-semibold shadow-lg shadow-sky-400/40 transition hover:from-[#1d4ed8] hover:to-[#153fad] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isVerifying}
          >
            {isVerifying ? "Verifying..." : "Verify & Continue"}
          </Button>
        </form>
      )}

      <div className="text-center text-sm text-slate-600">
        Already have an account?
        <Link to="/signin" className="ml-1 font-semibold text-[#2563eb] hover:underline">
          Sign In
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

export default SignUpForm;
