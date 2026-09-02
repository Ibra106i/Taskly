"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Spinner from "./Spinner";

export default function SignOutButton() {
  const { signOut } = useClerk();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      router.push("/login");
    } catch (e) {
      console.error("Sign out failed:", e);
      setSigningOut(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={signingOut}
      className="font-button text-sm text-on-surface-variant hover:text-error transition-colors flex items-center gap-sm disabled:opacity-50"
    >
      {signingOut ? (
        <Spinner size={18} />
      ) : (
        <span className="material-symbols-outlined text-[18px]">logout</span>
      )}
      {signingOut ? "Signing out..." : "Sign out"}
    </button>
  );
}
