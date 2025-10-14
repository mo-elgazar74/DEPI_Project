import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSignUp } from "@clerk/clerk-react";

const oauthProviders = [
  { strategy: "oauth_google", label: "Sign up with Google" },
  { strategy: "oauth_facebook", label: "Sign up with Facebook" },
  { strategy: "oauth_microsoft", label: "Sign up with Microsoft" },
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  const handleVerify = async (e) => {
    e.preventDefault();
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
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-serif text-[#1f2a44]">ChatAI</h1>
        <p className="text-gray-500">
          {pendingVerification ? "Enter the code sent to your email" : "Please Sign Up To Your Account"}
        </p>
      </div>

      {!pendingVerification ? (
        <>
          <div className="flex flex-col gap-3">
            {oauthProviders.map(({ strategy, label }) => (
              <button
                key={strategy}
                type="button"
                onClick={() => handleSocialSignUp(strategy)}
                className="border border-gray-300 rounded-full px-4 py-2 hover:bg-[#f4f5f7] flex justify-center items-center gap-2 disabled:opacity-60"
                disabled={isRedirecting}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-sm">or</span>
            <span className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="First name"
                onChange={(e) => setFirstName(e.target.value)}
                className="border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-indigo-400 w-1/2"
                value={firstName}
                required
                autoComplete="given-name"
              />
              <input
                type="text"
                placeholder="Last name"
                onChange={(e) => setLastName(e.target.value)}
                className="border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-indigo-400 w-1/2"
                value={lastName}
                required
                autoComplete="family-name"
              />
            </div>
            <input
              type="email"
              placeholder="Enter Your Email"
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-indigo-400"
              value={email}
              required
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Create a password"
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-indigo-400"
              value={password}
              required
              autoComplete="new-password"
              minLength={8}
            />
            <input
              type="password"
              placeholder="Confirm password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-indigo-400"
              value={confirmPassword}
              required
              autoComplete="new-password"
              minLength={8}
            />
            <button
              type="submit"
              className="bg-[#1f2a44] text-white rounded-full py-3 hover:bg-[#25315c] disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </>
      ) : (
        <form onSubmit={handleVerify} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Enter Code"
            onChange={(e) => setCode(e.target.value)}
            className="border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-indigo-400"
            value={code}
            required
          />
          <button
            type="submit"
            className="bg-[#1f2a44] text-white rounded-full py-3 hover:bg-[#25315c] disabled:opacity-60"
            disabled={isVerifying}
          >
            {isVerifying ? "Verifying..." : "Verify"}
          </button>
        </form>
      )}

      {status && <p className="text-indigo-500 text-center">{status}</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}
    </div>
  );
}

export default SignUpForm;
