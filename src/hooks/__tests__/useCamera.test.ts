import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCamera } from "../useCamera";

// Mock MediaStream and MediaRecorder
const mockStream = {
  getTracks: vi.fn(() => [{ stop: vi.fn() }]),
};

const mockGetUserMedia = vi.fn();
const mockRevokeObjectURL = vi.fn();

Object.defineProperty(navigator, "mediaDevices", {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia,
  },
});

Object.defineProperty(URL, "createObjectURL", {
  writable: true,
  value: vi.fn(() => "blob:mock-url"),
});

Object.defineProperty(URL, "revokeObjectURL", {
  writable: true,
  value: mockRevokeObjectURL,
});

// Mock HTMLVideoElement
Object.defineProperty(HTMLVideoElement.prototype, "play", {
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
});

// Mock HTMLCanvasElement
const mockCanvas = {
  getContext: vi.fn(() => ({
    drawImage: vi.fn(),
  })),
  toBlob: vi.fn((callback) => {
    const mockBlob = new Blob(["mock"], { type: "image/jpeg" });
    callback(mockBlob);
  }),
  width: 0,
  height: 0,
};

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  writable: true,
  value: mockCanvas.getContext,
});

Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
  writable: true,
  value: mockCanvas.toBlob,
});

// Mock MediaRecorder
const mockMediaRecorder = {
  start: vi.fn(),
  stop: vi.fn(),
  ondataavailable: null as ((event: { data: Blob }) => void) | null,
  onstop: null as (() => void) | null,
};

global.MediaRecorder = vi
  .fn()
  .mockImplementation(
    () => mockMediaRecorder
  ) as unknown as typeof MediaRecorder;

describe("useCamera", () => {
  const defaultSettings = {
    facingMode: "user" as const,
    resolution: { width: 1280, height: 720, label: "720p" },
    includeAudio: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserMedia.mockResolvedValue(mockStream);
  });

  it("initializes with correct default state", () => {
    const { result } = renderHook(() => useCamera());

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.isRecording).toBe(false);
    expect(result.current.recordingTime).toBe(0);
    expect(result.current.error).toBe(null);
    expect(result.current.capturedMedia).toEqual([]);
  });

  describe("startCamera", () => {
    it("starts camera successfully", async () => {
      const { result } = renderHook(() => useCamera());

      await act(async () => {
        await result.current.startCamera(defaultSettings);
      });

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      expect(result.current.isStreaming).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it("handles camera access error", async () => {
      const error = new Error("Camera access denied");
      mockGetUserMedia.mockRejectedValue(error);

      const { result } = renderHook(() => useCamera());

      await act(async () => {
        try {
          await result.current.startCamera(defaultSettings);
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe("Camera access denied");
      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe("stopCamera", () => {
    it("stops camera and cleans up stream", async () => {
      const { result } = renderHook(() => useCamera());

      // Start camera first
      await act(async () => {
        await result.current.startCamera(defaultSettings);
      });

      expect(result.current.isStreaming).toBe(true);

      // Stop camera
      act(() => {
        result.current.stopCamera();
      });

      expect(result.current.isStreaming).toBe(false);
      expect(mockStream.getTracks()[0].stop).toHaveBeenCalled();
    });
  });

  describe("capturePhoto", () => {
    it("captures photo successfully", async () => {
      const { result } = renderHook(() => useCamera());

      // Start camera first
      await act(async () => {
        await result.current.startCamera(defaultSettings);
      });

      // Mock video element
      const mockVideo = { videoWidth: 640, videoHeight: 480 };
      if (result.current.videoRef.current) {
        Object.assign(result.current.videoRef.current, mockVideo);
      }

      act(() => {
        result.current.capturePhoto();
      });

      expect(result.current.capturedMedia).toHaveLength(1);
      expect(result.current.capturedMedia[0].type).toBe("photo");
    });

    it("handles photo capture without stream", () => {
      const { result } = renderHook(() => useCamera());

      act(() => {
        result.current.capturePhoto();
      });

      expect(result.current.error).toBe(
        "No camera stream available for photo capture"
      );
      expect(result.current.capturedMedia).toHaveLength(0);
    });
  });

  describe("video recording", () => {
    it("starts recording successfully", async () => {
      const { result } = renderHook(() => useCamera());

      // Start camera first
      await act(async () => {
        await result.current.startCamera(defaultSettings);
      });

      act(() => {
        result.current.startRecording();
      });

      expect(result.current.isRecording).toBe(true);
      expect(mockMediaRecorder.start).toHaveBeenCalledWith(1000);
    });

    it("stops recording and creates video", async () => {
      const { result } = renderHook(() => useCamera());

      // Start camera and recording
      await act(async () => {
        await result.current.startCamera(defaultSettings);
      });

      act(() => {
        result.current.startRecording();
      });

      expect(result.current.isRecording).toBe(true);

      // Simulate recording stop
      act(() => {
        result.current.stopRecording();
        // Simulate MediaRecorder onstop event
        if (mockMediaRecorder.onstop) {
          mockMediaRecorder.onstop();
        }
      });

      expect(result.current.isRecording).toBe(false);
      expect(result.current.recordingTime).toBe(0);
    });

    it("handles recording without stream", () => {
      const { result } = renderHook(() => useCamera());

      act(() => {
        result.current.startRecording();
      });

      expect(result.current.error).toBe(
        "No camera stream available for recording"
      );
      expect(result.current.isRecording).toBe(false);
    });
  });

  describe("switchCamera", () => {
    it("switches camera facing mode", async () => {
      const { result } = renderHook(() => useCamera());

      // Start camera first
      await act(async () => {
        await result.current.startCamera(defaultSettings);
      });

      expect(result.current.isStreaming).toBe(true);

      // Switch camera
      await act(async () => {
        await result.current.switchCamera("environment");
      });

      // Should have stopped and will restart with new facing mode
      expect(result.current.isStreaming).toBe(false);
    });

    it("does nothing when not streaming", async () => {
      const { result } = renderHook(() => useCamera());

      await act(async () => {
        await result.current.switchCamera("environment");
      });

      expect(mockGetUserMedia).not.toHaveBeenCalled();
    });
  });

  describe("deleteMedia", () => {
    it("deletes media and revokes URL", async () => {
      const { result } = renderHook(() => useCamera());

      // Start camera and capture photo
      await act(async () => {
        await result.current.startCamera(defaultSettings);
      });

      // Mock video element for photo capture
      const mockVideo = { videoWidth: 640, videoHeight: 480 };
      if (result.current.videoRef.current) {
        Object.assign(result.current.videoRef.current, mockVideo);
      }

      act(() => {
        result.current.capturePhoto();
      });

      expect(result.current.capturedMedia).toHaveLength(1);
      const mediaId = result.current.capturedMedia[0].id;

      act(() => {
        result.current.deleteMedia(mediaId);
      });

      expect(result.current.capturedMedia).toHaveLength(0);
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });

  describe("clearError", () => {
    it("clears error state", async () => {
      const error = new Error("Test error");
      mockGetUserMedia.mockRejectedValue(error);

      const { result } = renderHook(() => useCamera());

      await act(async () => {
        try {
          await result.current.startCamera(defaultSettings);
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe("Test error");

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe("cleanup", () => {
    it("cleans up resources on unmount", async () => {
      const { result, unmount } = renderHook(() => useCamera());

      // Start camera and capture media
      await act(async () => {
        await result.current.startCamera(defaultSettings);
      });

      // Mock video element for photo capture
      const mockVideo = { videoWidth: 640, videoHeight: 480 };
      if (result.current.videoRef.current) {
        Object.assign(result.current.videoRef.current, mockVideo);
      }

      act(() => {
        result.current.capturePhoto();
      });

      expect(result.current.capturedMedia).toHaveLength(1);

      // Unmount should clean up
      unmount();

      expect(mockStream.getTracks()[0].stop).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });
});
