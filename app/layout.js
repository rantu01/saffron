import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "./Component/Auth/AuthProvider";
import { LanguageProvider } from "../components/LanguageContext";
import NavigationProgress from "../components/NavigationProgress";

const GeistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const GeistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Saffron Edge",
  description: "saffron edge - a nextjs app with tailwindcss and next-auth",
};

/**
 * Root layout with automatic site maintenance popup.
 * - Popup shows once per browser session on website entry
 * - Also appears when navigating to Dashboard for the first time
 * - Gear button can force open the popup regardless of session state
 */
export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <LanguageProvider>
            <NavigationProgress />
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}