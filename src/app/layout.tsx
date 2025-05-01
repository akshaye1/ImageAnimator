
import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter font
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// Removed Geist fonts, using Inter instead as specified in globals.css (implicitly)
// If you want to explicitly use Inter:
const inter = Inter({ subsets: ["latin"], variable: '--font-sans' });


export const metadata: Metadata = {
  title: "TearDrop - Torn Paper Image Effect", // Keep general title
  description: "Apply artistic torn paper edge and drop shadow effects to your images online.", // Updated Description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply Inter font if explicitly defined */}
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
