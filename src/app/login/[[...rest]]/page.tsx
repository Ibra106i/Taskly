"use client";

import { useEffect } from "react";
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  useEffect(() => {
    function removeDevBanner() {
      document.querySelectorAll("div").forEach((div) => {
        if (div.textContent?.trim() === "Development mode") {
          let el: HTMLElement | null = div;
          for (let i = 0; i < 5; i++) {
            if (el?.parentElement) el = el.parentElement;
          }
          if (el) el.remove();
        }
      });
      document.querySelectorAll("[data-variant='developmentMode']").forEach((el) => {
        let target: HTMLElement = el as HTMLElement;
        for (let i = 0; i < 3; i++) {
          if (target.parentElement) target = target.parentElement;
        }
        target.remove();
      });
    }

    removeDevBanner();
    const observer = new MutationObserver(removeDevBanner);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F7F5F0]">
      <div className="w-full max-w-[440px] px-4">
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="TaskMax"
            width={120}
            height={120}
            className="mx-auto"
            priority
          />
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none bg-transparent border-none",
              headerTitle: "text-[#131d25] font-semibold text-lg",
              headerSubtitle: "text-[#717976] text-sm",
              socialButtonsBlockButton: "border border-[#e0ddd5] rounded-xl text-[#414846] hover:bg-[#f0ede6] transition-colors",
              socialButtonsBlockButtonText: "text-[#414846] font-medium text-sm",
              dividerLine: "bg-[#e0ddd5]",
              dividerText: "text-[#717976] text-xs",
              formFieldLabel: "text-[#414846] text-sm font-medium",
              formFieldInput: "border border-[#e0ddd5] rounded-xl px-4 py-3 text-[#131d25] bg-white focus:border-[#45645e] focus:ring-1 focus:ring-[#45645e] transition-colors",
              formButtonPrimary: "bg-[#45645e] hover:bg-[#3a544f] text-white rounded-full py-3 font-medium text-sm transition-colors shadow-none",
              footerAction: "hidden",
              footerActionLink: "text-[#45645e] font-medium hover:text-[#3a544f]",
              footerActionText: "text-[#717976] text-sm",
              identityPreviewEditButton: "text-[#45645e]",
              formResendCodeLink: "text-[#45645e] font-medium",
              otpCodeFieldInput: "border border-[#e0ddd5] rounded-xl text-[#131d25]",
              formHeaderTitle: "text-[#131d25]",
              formHeaderSubtitle: "text-[#717976]",
              devModeNotice: "hidden",
            },
            variables: {
              colorPrimary: "#45645e",
              borderRadius: "1rem",
              fontFamily: "'DM Sans', sans-serif",
            },
          }}
        />

        <div className="mt-6 text-center">
          <p className="text-[16px] text-[#414846]">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-[#45645e] font-medium hover:text-[#1b3b35] transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
