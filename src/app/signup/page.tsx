"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
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
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop">
      <main className="w-full max-w-[440px] mx-auto">
        <div className="text-center mb-lg">
          <h1 className="font-headline-md text-primary font-bold">Taskly</h1>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-ple p-lg md:p-xl w-full">
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
