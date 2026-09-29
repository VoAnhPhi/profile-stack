import type { Metadata } from "next";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { Studio } from "@/components/studio/Studio";

export const metadata: Metadata = {
  title: "Studio",
  description: "Choose the mark in the header of this site, and see how it opens.",
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
