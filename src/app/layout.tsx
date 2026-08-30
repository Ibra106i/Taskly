import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Taskly",
  description: "A minimal todo app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className={`${dmSans.variable} font-body-md antialiased`}>
          {children}
        {/* impeccable-live-start */}
<script src="http://localhost:8400/live.js?token=5065b929-2f6a-46ca-8c25-34c7698f03a2"></script>
{/* impeccable-live-end */}
</body>
      </html>
    </ClerkProvider>
  );
}
