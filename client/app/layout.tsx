import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ResidentIQ | Smart Hostel Allocation",
  description:
    "Automated, fair, and transparent hostel seat allocation system for IIIT Una.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "rgb(var(--glass-bg-color))",
              color: "rgb(var(--foreground))",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(var(--foreground), 0.1)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
