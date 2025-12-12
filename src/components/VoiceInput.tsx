import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

// Type for Web Speech API
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionResultList {
  length: number;
  [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: { transcript: string };
}

interface ISpeechRecognitionErrorEvent {
  error: string;
}

export function VoiceInput({ onTranscript, disabled = false }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [accumulatedTranscript, setAccumulatedTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const isListeningRef = useRef(false); // Track intent to listen (vs browser state)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const SILENCE_TIMEOUT_MS = 10000; // 10 seconds of silence before auto-stop

  const clearAllTimeouts = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    clearAllTimeouts();
    isListeningRef.current = false;
    setIsListening(false);
    
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    
    // Send accumulated transcript if we have one
    if (accumulatedTranscript.trim()) {
      onTranscript(accumulatedTranscript.trim());
      toast.success("Got it!", {
        description: "I've captured what you said",
        duration: 2000,
      });
    }
    
    setAccumulatedTranscript("");
    setInterimTranscript("");
  }, [accumulatedTranscript, onTranscript, clearAllTimeouts]);

  const resetSilenceTimeout = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    
    silenceTimeoutRef.current = setTimeout(() => {
      if (isListeningRef.current) {
        console.log("Auto-stopping after 10s silence");
        stopListening();
      }
    }, SILENCE_TIMEOUT_MS);
  }, [stopListening]);

  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI() as ISpeechRecognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-AU";

    recognition.onresult = (event) => {
      // Reset silence timeout - user is speaking
      resetSilenceTimeout();
      
      let finalTranscript = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);

      // Accumulate final transcripts instead of sending immediately
      if (finalTranscript) {
        setAccumulatedTranscript(prev => {
          const separator = prev ? " " : "";
          return prev + separator + finalTranscript;
        });
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied", {
          description: "Please allow microphone access in your browser settings",
        });
        isListeningRef.current = false;
        setIsListening(false);
        clearAllTimeouts();
      } else if (event.error === "no-speech") {
        // This is fine - just means silence, we'll auto-restart
        console.log("No speech detected - will restart");
      } else if (event.error !== "aborted") {
        // Don't show error for intentional aborts
        console.log("Recognition error:", event.error);
      }
    };

    recognition.onend = () => {
      console.log("Recognition ended, listening intent:", isListeningRef.current);
      
      // If user still wants to listen, restart recognition
      if (isListeningRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          if (isListeningRef.current && recognitionRef.current) {
            try {
              console.log("Auto-restarting recognition...");
              recognitionRef.current.start();
            } catch (e) {
              console.log("Restart failed, retrying...", e);
              // If already started, try again after a brief delay
              setTimeout(() => {
                if (isListeningRef.current && recognitionRef.current) {
                  try {
                    recognitionRef.current.start();
                  } catch (e2) {
                    console.error("Failed to restart recognition:", e2);
                  }
                }
              }, 100);
            }
          }
        }, 50);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      clearAllTimeouts();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [resetSilenceTimeout, clearAllTimeouts]);

  const startListening = () => {
    if (!recognitionRef.current) return;

    setAccumulatedTranscript("");
    setInterimTranscript("");
    isListeningRef.current = true;
    setIsListening(true);
    
    try {
      recognitionRef.current.start();
      resetSilenceTimeout();
      toast.success("I'm listening...", {
        description: "Take your time. Tap the stop button when you're done.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Failed to start recognition:", error);
      isListeningRef.current = false;
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return null;
  }

  const displayTranscript = accumulatedTranscript + (interimTranscript ? " " + interimTranscript : "");

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        type="button"
        variant={isListening ? "destructive" : "swaami"}
        size="xl"
        className={`w-28 h-28 rounded-full shadow-lg transition-all duration-300 ${
          isListening ? "animate-pulse-soft scale-110" : ""
        }`}
        onClick={toggleListening}
        disabled={disabled}
        aria-label={isListening ? "Stop recording" : "Start recording"}
      >
        {isListening ? (
          <Square className="w-10 h-10" />
        ) : (
          <Mic className="w-12 h-12" />
        )}
      </Button>

      <div className="text-center space-y-1">
        <p className="text-xl font-medium text-foreground">
          {isListening ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Listening...
            </span>
          ) : (
            "Tap to speak"
          )}
        </p>
        <p className="text-base text-muted-foreground">
          {isListening 
            ? "Take your time. Tap the red button when done." 
            : "I'll write down what you say"
          }
        </p>
      </div>

      {displayTranscript && (
        <div className="bg-muted rounded-xl p-4 w-full max-w-md text-center animate-fade-in border-2 border-primary/20">
          <p className="text-sm text-muted-foreground mb-1">What I'm hearing:</p>
          <p className="text-lg text-foreground leading-relaxed">
            "{displayTranscript}"
            {isListening && <span className="animate-pulse">|</span>}
          </p>
        </div>
      )}

      {isListening && !displayTranscript && (
        <div className="bg-muted/50 rounded-xl p-4 w-full max-w-md text-center animate-fade-in">
          <p className="text-muted-foreground">
            Go ahead, I'm listening... 👂
          </p>
        </div>
      )}
    </div>
  );
}
