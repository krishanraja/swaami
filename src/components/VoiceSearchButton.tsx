import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VoiceSearchButtonProps {
  onSearchResult: (query: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Compact voice search button for use in headers and toolbars.
 * Transcribes voice input and returns the text to the parent.
 */
export function VoiceSearchButton({ onSearchResult, disabled = false, className = "" }: VoiceSearchButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
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
      mediaRecorder.start(100);
      
      setIsRecording(true);
      toast.info("Listening...", { duration: 2000 });
      
      // Auto-stop after 5 seconds for quick searches
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      }, 5000);
      
    } catch (error) {
      console.error("[VoiceSearch] Failed to start recording:", error);
      toast.error("Could not access microphone");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    
    setIsRecording(false);
    setIsProcessing(true);
    
    mediaRecorderRef.current.stop();
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Wait for final data
    await new Promise(resolve => setTimeout(resolve, 200));
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: mediaRecorderRef.current.mimeType || 'audio/webm' 
      });
      
      if (audioBlob.size < 1000) {
        toast.error("Recording too short");
        setIsProcessing(false);
        return;
      }
      
      const base64Audio = await blobToBase64(audioBlob);
      
      const { data, error } = await supabase.functions.invoke("transcribe-audio", {
        body: { audio: base64Audio },
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      const transcribedText = data?.text?.trim();
      
      if (transcribedText) {
        onSearchResult(transcribedText);
        toast.success(`Heard: "${transcribedText}"`);
      } else {
        toast.error("Couldn't understand. Please try again.");
      }
      
    } catch (error) {
      console.error("[VoiceSearch] Processing error:", error);
      toast.error("Voice search failed");
    } finally {
      setIsProcessing(false);
      audioChunksRef.current = [];
    }
  }, [isRecording, onSearchResult]);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Check for MediaRecorder support
  const isSupported = typeof MediaRecorder !== 'undefined' && navigator.mediaDevices?.getUserMedia;
  
  if (!isSupported) {
    return null;
  }

  return (
    <Button
      type="button"
      variant={isRecording ? "destructive" : "ghost"}
      size="icon"
      onClick={toggleRecording}
      disabled={disabled || isProcessing}
      className={`h-9 w-9 ${isRecording ? "animate-pulse" : ""} ${className}`}
      aria-label={isRecording ? "Stop listening" : "Voice search"}
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mic className={`h-4 w-4 ${isRecording ? "text-white" : ""}`} />
      )}
    </Button>
  );
}
