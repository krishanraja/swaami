import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Remove splash placeholder when React mounts
const removeSplashPlaceholder = () => {
  const placeholder = document.getElementById('splash-placeholder');
  if (placeholder) {
    placeholder.classList.add('hidden');
    setTimeout(() => {
      if (placeholder.parentNode) {
        placeholder.remove();
      }
    }, 300);
  }
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Remove splash placeholder after React renders
setTimeout(removeSplashPlaceholder, 50);
