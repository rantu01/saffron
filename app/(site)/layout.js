import "../globals.css";
import Navbar from "../Component/Common/Navbar";
import Footer from "../Component/Home/Footer";

export const metadata = {
  title: "Saffron Edge",
  description: "Saffron Edge is a leading digital marketing agency that specializes in providing innovative and effective marketing solutions to businesses of all sizes. With a team of experienced professionals, Saffron Edge offers a wide range of services including SEO, social media marketing, content creation, and more. Our mission is to help our clients achieve their marketing goals and drive growth through strategic and creative campaigns.",
};

export default function SiteLayout({ children }) {
  return (
    <>
      <main>
        <Navbar />
        {children}
        <Footer />
      </main>
    </>
  );
}
