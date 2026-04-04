import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StockSMS — Stock Maintenance System",
  description: "Real-time inventory management for modern businesses. Track products, suppliers, purchase orders, and generate invoices.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
