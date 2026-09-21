import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import AcademicInfo from "@/components/AcademicInfo";
import News from "@/components/News";
import Documents from "@/components/Documents";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <About />
      <AcademicInfo />
      <News />
      <Documents />
      <Footer />
    </main>
  );
}