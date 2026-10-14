import type { Metadata } from "next";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { Studio } from "@/components/studio/Studio";

export const metadata: Metadata = {
  title: "Studio",
  description: "Change the header objects and replay the opening animation on this portfolio.",
};

export default function StudioPage() {
  return (
    <>
      <Header />
      <Studio />
      <Footer />
    </>
  );
}
