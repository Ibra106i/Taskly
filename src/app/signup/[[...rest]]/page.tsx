"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F7F5F0]">
      <div className="w-full max-w-[440px] px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#45645e] tracking-tight">
            TaskMax
          </h1>
        </div>

        <SignUp />

        <div className="mt-6 text-center">
          <p className="text-[16px] text-[#414846]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#45645e] font-medium hover:text-[#1b3b35] transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
