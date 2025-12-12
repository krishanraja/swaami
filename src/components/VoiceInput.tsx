import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onTranscript, disabled = false }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // Remove the data:audio/webm;base64, prefix
        const base64 = dataUrl.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.success("Recording started", {
        description: "Take your time. Tap stop when you're done.",
        duration: 3000,
      });
      
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error("Couldn't access microphone", {
        description: "Please allow microphone access in your browser settings",
      });
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
    setIsProcessing(true);
    
    // Stop recording and process
    mediaRecorderRef.current.stop();
    
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Wait a moment for final data
    await new Promise(resolve => setTimeout(resolve, 200));
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: mediaRecorderRef.current.mimeType || 'audio/webm' 
      });
      
      if (audioBlob.size < 1000) {
        toast.error("Recording too short", {
          description: "Please hold the button longer and speak clearly",
        });
        setIsProcessing(false);
        return;
      }
      
      console.log("Audio blob size:", audioBlob.size);
      
      const base64Audio = await blobToBase64(audioBlob);
      console.log("Base64 length:", base64Audio.length);
      
      // Send to edge function for Whisper transcription
      const { data, error } = await supabase.functions.invoke("transcribe-audio", {
        body: { audio: base64Audio },
      });
      
      if (error) {
        console.error("Transcription error:", error);
        throw error;
      }
      
      if (data?.error) {
        console.error("Transcription failed:", data.error);
        toast.error("Couldn't understand that", {
          description: data.error,
        });
        setIsProcessing(false);
        return;
      }
      
      const transcribedText = data?.text?.trim();
      
      if (transcribedText) {
        onTranscript(transcribedText);
        toast.success("Got it!", {
          description: "I've captured what you said",
          duration: 2000,
        });
      } else {
        toast.error("Couldn't hear anything", {
          description: "Please speak a bit louder or closer to the mic",
        });
      }
      
    } catch (error) {
      console.error("Processing error:", error);
      toast.error("Something went wrong", {
        description: "Please try again",
      });
    } finally {
      setIsProcessing(false);
      setRecordingTime(0);
      audioChunksRef.current = [];
    }
  }, [isRecording, onTranscript]);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check for MediaRecorder support
  const isSupported = typeof MediaRecorder !== 'undefined' && navigator.mediaDevices?.getUserMedia;
  
  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        type="button"
        variant={isRecording ? "destructive" : "swaami"}
        size="xl"
        className={`w-28 h-28 rounded-full shadow-lg transition-all duration-300 ${
          isRecording ? "animate-pulse-soft scale-110" : ""
        } ${isProcessing ? "opacity-50" : ""}`}
        onClick={toggleRecording}
        disabled={disabled || isProcessing}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {isProcessing ? (
          <Loader2 className="w-10 h-10 animate-spin" />
        ) : isRecording ? (
          <Square className="w-10 h-10" />
        ) : (
          <Mic className="w-12 h-12" />
        )}
      </Button>

      <div className="text-center space-y-1">
        {isProcessing ? (
          <>
            <p className="text-xl font-medium text-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </p>
            <p className="text-base text-muted-foreground">
              Converting your speech to text
            </p>
          </>
        ) : isRecording ? (
          <>
            <p className="text-xl font-medium text-destructive flex items-center justify-center gap-2">
              <span className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
              Recording {formatTime(recordingTime)}
            </p>
            <p className="text-base text-muted-foreground">
              Take your time. Tap the red button when done.
            </p>
          </>
        ) : (
          <>
            <p className="text-xl font-medium text-foreground">
              Tap to speak
            </p>
            <p className="text-base text-muted-foreground">
              I'll accurately transcribe what you say
            </p>
          </>
        )}
      </div>

      {isRecording && (
        <div className="bg-destructive/10 border-2 border-destructive/30 rounded-xl p-4 w-full max-w-md text-center animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
            <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-muted-foreground">
            Speak clearly... I'm listening 👂
          </p>
        </div>
      )}
    </div>
  );
}
