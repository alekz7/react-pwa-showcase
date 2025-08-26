import { useState, useRef, useCallback, useEffect } from "react";

export interface CameraSettings {
  facingMode: "user" | "environment";
  resolution: { width: number; height: number; label: string };
  includeAudio: boolean;
}

export interface CapturedMedia {
  id: string;
  type: "photo" | "video";
  url: string;
  timestamp: Date;
  size: number;
}

export interface UseCameraReturn {
  // State
  isStreaming: boolean;
  isRecording: boolean;
  recordingTime: number;
  error: string | null;
  capturedMedia: CapturedMedia[];

  // Refs
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;

  // Actions
  startCamera: (settings: CameraSettings) => Promise<void>;
  stopCamera: () => void;
  capturePhoto: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  switchCamera: (facingMode: "user" | "environment") => Promise<void>;
  deleteMedia: (id: string) => void;
  clearError: () => void;
}

export const useCamera = (): UseCameraReturn => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [capturedMedia, setCapturedMedia] = useState<CapturedMedia[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const startCamera = useCallback(async (settings: CameraSettings) => {
    try {
      setError(null);

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: settings.facingMode,
          width: { ideal: settings.resolution.width },
          height: { ideal: settings.resolution.height },
        },
        audio: settings.includeAudio,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to access camera";
      setError(errorMessage);
      throw err;
    }
  }, []);

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

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (isRecording) {
      stopRecording();
    }

    setIsStreaming(false);
  }, [isRecording, stopRecording]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) {
      setError("No camera stream available for photo capture");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) {
      setError("Failed to get canvas context");
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const newPhoto: CapturedMedia = {
            id: `photo-${Date.now()}`,
            type: "photo",
            url,
            timestamp: new Date(),
            size: blob.size,
          };

          setCapturedMedia((prev) => [...prev, newPhoto]);
        }
      },
      "image/jpeg",
      0.9
    );
  }, [isStreaming]);

  const startRecording = useCallback(() => {
    if (!streamRef.current || !isStreaming) {
      setError("No camera stream available for recording");
      return;
    }

    try {
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: "video/webm;codecs=vp9",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        const url = URL.createObjectURL(blob);
        const newVideo: CapturedMedia = {
          id: `video-${Date.now()}`,
          type: "video",
          url,
          timestamp: new Date(),
          size: blob.size,
        };

        setCapturedMedia((prev) => [...prev, newVideo]);
        recordedChunksRef.current = [];
      };

      mediaRecorderRef.current = mediaRecorder;
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
  }, [isStreaming]);

  const switchCamera = useCallback(
    async (facingMode: "user" | "environment") => {
      if (!isStreaming) return;

      const currentSettings: CameraSettings = {
        facingMode,
        resolution: { width: 1280, height: 720, label: "720p" },
        includeAudio: false,
      };

      stopCamera();

      // Small delay to ensure camera is properly stopped
      setTimeout(async () => {
        try {
          await startCamera(currentSettings);
        } catch (err) {
          console.error("Failed to switch camera:", err);
        }
      }, 100);
    },
    [isStreaming, startCamera, stopCamera]
  );

  const deleteMedia = useCallback((id: string) => {
    setCapturedMedia((prev) => {
      const mediaToDelete = prev.find((media) => media.id === id);
      if (mediaToDelete) {
        URL.revokeObjectURL(mediaToDelete.url);
      }
      return prev.filter((media) => media.id !== id);
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      // Clean up all object URLs
      capturedMedia.forEach((media) => {
        URL.revokeObjectURL(media.url);
      });
    };
  }, [stopCamera, capturedMedia]);

  return {
    // State
    isStreaming,
    isRecording,
    recordingTime,
    error,
    capturedMedia,

    // Refs
    videoRef,
    canvasRef,

    // Actions
    startCamera,
    stopCamera,
    capturePhoto,
    startRecording,
    stopRecording,
    switchCamera,
    deleteMedia,
    clearError,
  };
};
