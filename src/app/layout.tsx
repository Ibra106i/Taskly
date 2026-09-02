import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://taskmax.vercel.app"),
  title: {
    default: "TaskMax",
    template: "%s — TaskMax",
  },
  description:
    "Organize your tasks, projects, and labels with AI-powered assistance via MCP.",
  openGraph: {
    title: "TaskMax",
    description:
      "Organize your tasks, projects, and labels with AI-powered assistance via MCP.",
    type: "website",
    siteName: "TaskMax",
  },
  twitter: {
    card: "summary_large_image",
    title: "TaskMax",
    description:
      "Organize your tasks, projects, and labels with AI-powered assistance via MCP.",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#45645e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          devModeNotice: "hidden",
        },
      }}
    >
      <html lang="en">
        <head>
          <link
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className={`${dmSans.variable} font-body-md antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
