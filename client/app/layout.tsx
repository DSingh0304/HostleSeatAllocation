import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#D82C2C",
};

export const metadata: Metadata = {
  title: "ResidentIQ | Hostel Seat Allocation - IIIT Una",
  description: "Online hostel room allotment system for IIIT Una students.",
  keywords: ["Hostel", "Room Allocation", "IIIT Una", "Student Housing", "ResidentIQ"],
  authors: [{ name: "ResidentIQ" }],
  openGraph: {
    title: "ResidentIQ | Hostel Seat Allocation - IIIT Una",
    description: "Online hostel room allotment system for IIIT Una students.",
    siteName: "ResidentIQ",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#FFFFFF] text-[#1A1A1A] antialiased selection:bg-[#D82C2C] selection:text-white">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#FFFFFF",
              color: "#1A1A1A",
              border: "1px solid #1A1A1A",
              borderRadius: "6px",
              boxShadow: "0 4px 16px rgba(26, 26, 26, 0.08)",
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: "0.875rem",
              fontWeight: 500,
            },
            success: {
              iconTheme: {
                primary: "#1A1A1A",
                secondary: "#FFFFFF",
              },
            },
            error: {
              iconTheme: {
                primary: "#D82C2C",
                secondary: "#FFFFFF",
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
