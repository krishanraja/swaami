import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AccessibilitySettings {
  largeText: boolean;
  highContrast: boolean;
  simpleMode: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  toggleLargeText: () => void;
  toggleHighContrast: () => void;
  toggleSimpleMode: () => void;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const STORAGE_KEY = "swaami-accessibility";

const defaultSettings: AccessibilitySettings = { 
  largeText: false, 
  highContrast: false, 
  simpleMode: false 
};

function getStoredSettings(): AccessibilitySettings {
  try {
    if (typeof window === 'undefined') return defaultSettings;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // localStorage may be blocked or unavailable
  }
  return defaultSettings;
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(getStoredSettings);

  const [isSpeaking, setIsSpeaking] = useState(false);

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // localStorage may be blocked or unavailable - fail silently
    }
  }, [settings]);

  // Apply CSS classes to body
  useEffect(() => {
    document.body.classList.toggle("accessibility-large-text", settings.largeText);
    document.body.classList.toggle("accessibility-high-contrast", settings.highContrast);
  }, [settings.largeText, settings.highContrast]);

  const toggleLargeText = () => {
    setSettings((prev) => ({ ...prev, largeText: !prev.largeText }));
  };

  const toggleHighContrast = () => {
    setSettings((prev) => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const toggleSimpleMode = () => {
    setSettings((prev) => ({ ...prev, simpleMode: !prev.simpleMode }));
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower for elderly
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        toggleLargeText,
        toggleHighContrast,
        toggleSimpleMode,
        speakText,
        stopSpeaking,
        isSpeaking,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
}
