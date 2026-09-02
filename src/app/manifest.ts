import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TaskMax",
    short_name: "TaskMax",
    description: "Organize your tasks with AI-powered assistance",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F5F0",
    theme_color: "#45645e",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
