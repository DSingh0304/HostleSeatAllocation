import type { Metadata } from "next";
import { Patrick_Hand } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const patrickHand = Patrick_Hand({ 
  weight: "400",
  subsets: ["latin"],
});

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
      <body className={patrickHand.className}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--paper-note)",
              color: "var(--ink-blue)",
              border: "2px solid var(--pencil-grey)",
              borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
              boxShadow: "4px 4px 0px rgba(0, 0, 0, 0.1)",
              fontFamily: "var(--font-hand)",
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
