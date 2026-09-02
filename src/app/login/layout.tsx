import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In — TaskMax",
  description:
    "Sign in to your TaskMax account to manage your tasks and projects.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
