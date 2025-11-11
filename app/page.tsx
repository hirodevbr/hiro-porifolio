import Hero from "@/components/Hero";
import About from "@/components/About";
import Projects from "@/components/Projects";
import Skills from "@/components/Skills";
import Contact from "@/components/Contact";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DiscordProfile from "@/components/DiscordProfile";
import ScrollToTop from "@/components/ScrollToTop";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />
      <div className="transition-all duration-500 ease-in-out">
        <Hero />
        <About />
        <Skills />
        <Projects />
        <DiscordProfile />
        <Contact />
      </div>
      <Footer />
      <ScrollToTop />
    </main>
  );
}

