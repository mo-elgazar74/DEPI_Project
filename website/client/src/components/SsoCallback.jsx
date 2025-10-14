import React from "react";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";

export default function SsoCallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f9fafb]">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-[360px] text-center">
        <h1 className="text-2xl font-serif text-[#1f2a44] mb-4">Finishing up…</h1>
        <p className="text-gray-500 mb-6">
          We are completing your sign in. You will be redirected shortly.
        </p>
        <AuthenticateWithRedirectCallback afterSignInUrl="/dashboard" afterSignUpUrl="/onboarding" />
      </div>
    </div>
  );
}
