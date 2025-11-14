import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fully optimized metadata including favicons for multiple devices
export const metadata: Metadata = {
  title: "Bible Trivia App",
  description: "Bible Trivia made with Next JS",
  themeColor: "#ffffff",
  icons: {
    icon: "/favicon.png", // default favicon
    apple: "/favicon.png", // iOS home screen
    other: [
      { url: "/favicon.png", sizes: "192x192", type: "image/png" }, // Android / Chrome home screen
      { url: "/favicon.png", sizes: "512x512", type: "image/png" }, // High-res retina
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-200`}>
        <NavBar />
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
