import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/hooks/useAuth";
import { ToastProvider } from "@/hooks/useToast";
import { ThemeProvider, themeInitScript } from "@/hooks/useTheme";
import { ToastContainer } from "@/components/Toast";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Track your expenses with ease.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)",  color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The init script sets the `dark` class before hydration, so the server
    // markup legitimately differs on <html>.
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
              <ToastContainer />
            </ToastProvider>
            <Analytics />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
