import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Link from "next/link";
import { AuthStatus } from "@/components/AuthStatus";

export const metadata: Metadata = {
  title: "Code Compiler | Developed By Mrinal",
  description: "A clean and lightweight code compiler.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <header className="header">
            <div className="container header-content">
              <Link href="/" className="logo">
                CodeCompiler.
              </Link>
              <nav className="nav-links">
                <AuthStatus />
              </nav>
            </div>
          </header>
          
          <main>
            {children}
          </main>

          <footer className="footer">
            <div className="container">
              &copy; {new Date().getFullYear()} CodeCompiler. Developed By Mrinal.
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
