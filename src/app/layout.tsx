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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('contextmenu', event => event.preventDefault());
              document.onkeydown = function(e) {
                if(e.keyCode == 123) { return false; } // F12
                if(e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) { return false; }
                if(e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)) { return false; }
                if(e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) { return false; }
                if(e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) { return false; } // Ctrl+U
              }
            `
          }}
        />
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
