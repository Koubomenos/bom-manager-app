import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin", "cyrillic", "greek"] });

export const metadata: Metadata = {
  title: "BOM Manager Application",
  description: "B2B Dashboard for BOM Management",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get('auth_token')?.value === 'authenticated';

  return (
    <html lang="el">
      <body className={`${inter.className} min-h-screen flex flex-col antialiased`}>
        {isAuthenticated && <Navigation />}
        <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
