"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop">
        <div className="w-full max-w-[440px]">
          <div className="text-center mb-lg">
            <h1 className="font-headline-md text-primary font-bold">Taskly</h1>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl shadow-soft p-lg md:p-xl w-full">
            <div className="flex flex-col items-center text-center py-lg">
              <span className="material-symbols-outlined text-[56px] text-primary mb-md">
                mark_email_read
              </span>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-on-surface mb-sm">
                Check your email
              </h2>
              <p className="font-body-md text-on-surface-variant mb-sm">
                We sent a confirmation link to
              </p>
              <p className="font-body-lg text-on-surface font-medium mb-lg">
                {email}
              </p>
              <p className="font-body-md text-on-surface-variant mb-xl">
                Click the link in the email to verify your account, then come back and sign in.
              </p>
              <Link
                href="/login"
                className="font-button text-primary hover:text-on-primary-container transition-colors underline underline-offset-4 decoration-primary/30"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop">
      <main className="w-full max-w-[440px] mx-auto">
        <div className="text-center mb-lg">
          <h1 className="font-headline-md text-primary font-bold">Taskly</h1>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-soft p-lg md:p-xl w-full">
          <div className="mb-lg text-center">
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-on-surface mb-xs">
              Create your account
            </h2>
            <p className="font-body-md text-on-surface-variant">
              Join Taskly to manage your focus.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-md">
            <div>
              <label className="tactile-label" htmlFor="email">
                Email
              </label>
              <input
                className="tactile-input"
                style={{ color: "#131d25", WebkitTextFillColor: "#131d25" }}
                id="email"
                name="email"
                placeholder="jane@example.com"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="tactile-label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  className="tactile-input pr-12"
                  style={{ color: "#131d25", WebkitTextFillColor: "#131d25" }}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  className="absolute inset-y-0 right-0 pr-md flex items-center text-outline hover:text-on-surface transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="tactile-label" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                className="tactile-input"
                style={{ color: "#131d25", WebkitTextFillColor: "#131d25" }}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="flex items-start gap-xs">
                <span className="material-symbols-outlined text-[16px] text-error mt-[2px]">
                  error
                </span>
                <p className="font-label-md text-error">{error}</p>
              </div>
            )}

            <div className="pt-sm">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-container text-on-primary font-button text-button rounded-full py-3 px-lg hover:bg-primary transition-colors duration-200 active:scale-[0.98] shadow-sm disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Sign up"}
              </button>
            </div>
          </form>

          <div className="mt-xl text-center">
            <p className="font-body-md text-on-surface-variant">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary hover:text-on-primary-container font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </main>
  );
}
