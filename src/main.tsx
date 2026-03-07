import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA
if ("serviceWorker" in navigator) {
  registerSW({
    onRegistered(registration) {
      console.log("✅ SW registered:", registration);
    },
    onRegisterError(error) {
      console.error("❌ SW registration error:", error);
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);
