import { useState, useRef, useCallback, useEffect } from "react";

export interface AudioSettings {
  sampleRate: number;
  channelCount: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

export interface AudioRecording {
  id: string;
  url: string;
  timestamp: Date;
  duration: number;
  size: number;
}

export interface UseMicrophoneReturn {
  // State
  isListening: boolean;
  isRecording: boolean;
  recordingTime: number;
  audioLevel: number;
  error: string | null;
  recordings: AudioRecording[];

  // Actions
  startListening: (settings: AudioSettings) => Promise<void>;
  stopListening: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  deleteRecording: (id: string) => void;
  clearError: () => void;
}

export const useMicrophone = (): UseMicrophoneReturn => {
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);

  const startListening = useCallback(async (settings: AudioSettings) => {
    try {
      setError(null);

      const constraints: MediaStreamConstraints = {
        audio: {
          sampleRate: settings.sampleRate,
          channelCount: settings.channelCount,
          echoCancellation: settings.echoCancellation,
          noiseSuppression: settings.noiseSuppression,
          autoGainControl: settings.autoGainControl,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Set up Web Audio API for audio level monitoring
      const audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsListening(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to access microphone";
      setError(errorMessage);
      throw err;
    }
  }, []);

  const startAudioLevelMonitoring = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateAudioLevel = () => {
      if (!analyser) return;

      analyser.getByteFrequencyData(dataArray);

      // Calculate RMS (Root Mean Square) for audio level
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const level = Math.min(100, (rms / 128) * 100);

      setAudioLevel(level);

      if (isListening) {
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      }
    };

    updateAudioLevel();
  }, [isListening]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    setIsRecording(false);
    setRecordingTime(0);
  }, [isRecording]);

  const stopListening = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (isRecording) {
      stopRecording();
    }

    setIsListening(false);
    setAudioLevel(0);
  }, [isRecording, stopRecording]);

  const startRecording = useCallback(() => {
    if (!streamRef.current || !isListening) {
      setError("No microphone stream available for recording");
      return;
    }

    try {
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        const duration = Date.now() - recordingStartTimeRef.current;

        const newRecording: AudioRecording = {
          id: `audio-${Date.now()}`,
          url,
          timestamp: new Date(),
          duration: Math.floor(duration / 1000),
          size: blob.size,
        };

        setRecordings((prev) => [...prev, newRecording]);
        recordedChunksRef.current = [];
      };

      mediaRecorderRef.current = mediaRecorder;
      recordingStartTimeRef.current = Date.now();
      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to start recording";
      setError(errorMessage);
    }
  }, [isListening]);

  const deleteRecording = useCallback((id: string) => {
    setRecordings((prev) => {
      const recordingToDelete = prev.find((recording) => recording.id === id);
      if (recordingToDelete) {
        URL.revokeObjectURL(recordingToDelete.url);
      }
      return prev.filter((recording) => recording.id !== id);
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      // Clean up all object URLs
      recordings.forEach((recording) => {
        URL.revokeObjectURL(recording.url);
      });
    };
  }, [stopListening, recordings]);

  // Stop audio level monitoring when not listening
  useEffect(() => {
    if (!isListening && animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      setAudioLevel(0);
    } else if (isListening) {
      startAudioLevelMonitoring();
    }
  }, [isListening, startAudioLevelMonitoring]);

  return {
    // State
    isListening,
    isRecording,
    recordingTime,
    audioLevel,
    error,
    recordings,

    // Actions
    startListening,
    stopListening,
    startRecording,
    stopRecording,
    deleteRecording,
    clearError,
  };
};
