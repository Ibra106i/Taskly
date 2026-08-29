"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <button
      onClick={handleSignOut}
      className="font-button text-sm text-on-surface-variant hover:text-error transition-colors flex items-center gap-sm"
    >
      <span className="material-symbols-outlined text-[18px]">logout</span>
      Sign out
    </button>
  );
}
