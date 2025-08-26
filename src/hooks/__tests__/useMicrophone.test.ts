import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useMicrophone } from "../useMicrophone";

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
  value: vi.fn(() => "blob:mock-audio-url"),
});

Object.defineProperty(URL, "revokeObjectURL", {
  writable: true,
  value: mockRevokeObjectURL,
});

// Mock Web Audio API
const mockAnalyser = {
  fftSize: 256,
  smoothingTimeConstant: 0.8,
  frequencyBinCount: 128,
  getByteFrequencyData: vi.fn((dataArray) => {
    // Mock some audio data
    for (let i = 0; i < dataArray.length; i++) {
      dataArray[i] = Math.random() * 128;
    }
  }),
};

const mockAudioContext = {
  createAnalyser: vi.fn(() => mockAnalyser),
  createMediaStreamSource: vi.fn(() => ({
    connect: vi.fn(),
  })),
  close: vi.fn(),
};

Object.defineProperty(window, "AudioContext", {
  writable: true,
  value: vi.fn(() => mockAudioContext),
});

Object.defineProperty(window, "webkitAudioContext", {
  writable: true,
  value: vi.fn(() => mockAudioContext),
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

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

global.cancelAnimationFrame = vi.fn();

describe("useMicrophone", () => {
  const defaultSettings = {
    sampleRate: 44100,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserMedia.mockResolvedValue(mockStream);
  });

  afterEach(() => {
    // Clean up any running timers and animation frames
    vi.clearAllTimers();
  });

  it("initializes with correct default state", () => {
    const { result } = renderHook(() => useMicrophone());

    expect(result.current.isListening).toBe(false);
    expect(result.current.isRecording).toBe(false);
    expect(result.current.recordingTime).toBe(0);
    expect(result.current.audioLevel).toBe(0);
    expect(result.current.error).toBe(null);
    expect(result.current.recordings).toEqual([]);
  });

  describe("startListening", () => {
    it("starts microphone successfully", async () => {
      const { result } = renderHook(() => useMicrophone());

      await act(async () => {
        await result.current.startListening(defaultSettings);
      });

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      expect(result.current.isListening).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it("handles microphone access error", async () => {
      const error = new Error("Microphone access denied");
      mockGetUserMedia.mockRejectedValue(error);

      const { result } = renderHook(() => useMicrophone());

      await act(async () => {
        try {
          await result.current.startListening(defaultSettings);
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe("Microphone access denied");
      expect(result.current.isListening).toBe(false);
    });

    it("sets up Web Audio API correctly", async () => {
      const { result } = renderHook(() => useMicrophone());

      await act(async () => {
        await result.current.startListening(defaultSettings);
      });

      expect(mockAudioContext.createAnalyser).toHaveBeenCalled();
      expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalledWith(
        mockStream
      );
    });
  });

  describe("stopListening", () => {
    it("stops microphone and cleans up resources", async () => {
      const { result } = renderHook(() => useMicrophone());

      // Start listening first
      await act(async () => {
        await result.current.startListening(defaultSettings);
      });

      expect(result.current.isListening).toBe(true);

      // Stop listening
      act(() => {
        result.current.stopListening();
      });

      expect(result.current.isListening).toBe(false);
      expect(result.current.audioLevel).toBe(0);
      expect(mockStream.getTracks()[0].stop).toHaveBeenCalled();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });

  describe("audio recording", () => {
    it("starts recording successfully", async () => {
      const { result } = renderHook(() => useMicrophone());

      // Start listening first
      await act(async () => {
        await result.current.startListening(defaultSettings);
      });

      act(() => {
        result.current.startRecording();
      });

      expect(result.current.isRecording).toBe(true);
      expect(mockMediaRecorder.start).toHaveBeenCalledWith(1000);
    });

    it("stops recording and creates audio file", async () => {
      const { result } = renderHook(() => useMicrophone());

      // Start listening and recording
      await act(async () => {
        await result.current.startListening(defaultSettings);
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

    it("handles recording without microphone stream", () => {
      const { result } = renderHook(() => useMicrophone());

      act(() => {
        result.current.startRecording();
      });

      expect(result.current.error).toBe(
        "No microphone stream available for recording"
      );
      expect(result.current.isRecording).toBe(false);
    });
  });

  describe("deleteRecording", () => {
    it("deletes recording and revokes URL", async () => {
      const { result } = renderHook(() => useMicrophone());

      // Start listening and recording
      await act(async () => {
        await result.current.startListening(defaultSettings);
      });

      act(() => {
        result.current.startRecording();
      });

      // Simulate recording completion
      act(() => {
        result.current.stopRecording();
        if (mockMediaRecorder.onstop) {
          mockMediaRecorder.onstop();
        }
      });

      // Should have one recording
      expect(result.current.recordings).toHaveLength(1);
      const recordingId = result.current.recordings[0].id;

      act(() => {
        result.current.deleteRecording(recordingId);
      });

      expect(result.current.recordings).toHaveLength(0);
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });

  describe("clearError", () => {
    it("clears error state", async () => {
      const error = new Error("Test error");
      mockGetUserMedia.mockRejectedValue(error);

      const { result } = renderHook(() => useMicrophone());

      await act(async () => {
        try {
          await result.current.startListening(defaultSettings);
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
      const { result, unmount } = renderHook(() => useMicrophone());

      // Start listening and create recording
      await act(async () => {
        await result.current.startListening(defaultSettings);
      });

      act(() => {
        result.current.startRecording();
      });

      act(() => {
        result.current.stopRecording();
        if (mockMediaRecorder.onstop) {
          mockMediaRecorder.onstop();
        }
      });

      expect(result.current.recordings).toHaveLength(1);

      // Unmount should clean up
      unmount();

      expect(mockStream.getTracks()[0].stop).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });
});
