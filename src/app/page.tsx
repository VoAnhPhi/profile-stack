import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { Hero, Figures } from "@/components/sections/Hero";
import { Manifesto } from "@/components/sections/Manifesto";
import { WorkChapters } from "@/components/sections/WorkChapters";
import { Trajectory } from "@/components/sections/Trajectory";
import { Skills } from "@/components/sections/Skills";
import { Contact } from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Figures />
        <Manifesto />
        <Trajectory />
        <Skills />
        <WorkChapters />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
