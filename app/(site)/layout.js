import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Navbar from "../Component/Common/Navbar";
import Footer from "../Component/Home/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Saffron Edge",
  description: "Saffron Edge is a leading digital marketing agency that specializes in providing innovative and effective marketing solutions to businesses of all sizes. With a team of experienced professionals, Saffron Edge offers a wide range of services including SEO, social media marketing, content creation, and more. Our mission is to help our clients achieve their marketing goals and drive growth through strategic and creative campaigns.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <main>
          <Navbar></Navbar>
          {children}
          <Footer></Footer>
        </main>
      </body>
    </html >
  );
}
