import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up — TaskMax",
  description:
    "Create a free TaskMax account to start organizing your tasks with AI assistance.",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
