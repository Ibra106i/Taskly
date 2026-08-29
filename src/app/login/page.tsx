"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
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
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-xl">
          <h1 className="font-headline-xl text-primary tracking-tight">
            Taskly
          </h1>
          <p className="font-body-lg text-on-surface-variant mt-sm">
            Welcome back. Please log in.
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-soft p-xl md:p-2xl flex flex-col gap-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/30 to-primary/10"></div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-lg w-full">
            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-on-surface-variant ml-xs" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline-variant">
                  mail
                </span>
                <input
                  className="w-full h-12 pl-[48px] pr-md rounded-xl bg-[#F7F5F0] border-none focus:ring-2 focus:ring-primary focus:outline-none transition-all shadow-inner-soft text-on-surface font-body-md placeholder-on-surface-variant/50"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-sm">
              <div className="flex justify-between items-center ml-xs mr-xs">
                <label className="font-label-md text-on-surface-variant" htmlFor="password">
                  Password
                </label>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline-variant">
                  lock
                </span>
                <input
                  className="w-full h-12 pl-[48px] pr-[48px] rounded-xl bg-[#F7F5F0] border-none focus:ring-2 focus:ring-primary focus:outline-none transition-all shadow-inner-soft text-on-surface font-body-md placeholder-on-surface-variant/50"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface hover:text-primary transition-colors flex items-center justify-center h-8 w-8 rounded-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-xs">
                <span className="material-symbols-outlined text-[16px] text-error mt-[2px]">
                  error
                </span>
                <p className="font-label-md text-error">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-sm bg-primary hover:bg-primary-container active:scale-[0.98] transition-all rounded-xl font-button text-on-primary flex items-center justify-center shadow-sm disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-lg text-center">
            <p className="font-body-md text-on-surface-variant">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-button text-primary hover:text-on-primary-container transition-colors underline underline-offset-4 decoration-primary/30"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
