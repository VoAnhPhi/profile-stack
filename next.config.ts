import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The food switch (BleedToggle) owns the bottom-left corner; the dev-only
  // indicator would sit on it there.
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;
