import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useFileSystem } from "../useFileSystem";

// Mock URL methods
const mockCreateObjectURL = vi.fn(() => "blob:mock-url");
const mockRevokeObjectURL = vi.fn();

Object.defineProperty(URL, "createObjectURL", {
  writable: true,
  value: mockCreateObjectURL,
});

Object.defineProperty(URL, "revokeObjectURL", {
  writable: true,
  value: mockRevokeObjectURL,
});

// Mock FileReader
const mockFileReader = {
  readAsText: vi.fn(),
  result: null as string | null,
  onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
  onerror: null as ((event: ProgressEvent<FileReader>) => void) | null,
  error: null,
};

global.FileReader = vi.fn(() => mockFileReader) as unknown as typeof FileReader;

// Mock document methods for download
const mockCreateElement = vi.fn(() => ({
  href: "",
  download: "",
  click: vi.fn(),
}));

const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();

Object.defineProperty(document, "createElement", {
  writable: true,
  value: mockCreateElement,
});

Object.defineProperty(document.body, "appendChild", {
  writable: true,
  value: mockAppendChild,
});

Object.defineProperty(document.body, "removeChild", {
  writable: true,
  value: mockRemoveChild,
});

// Helper to create mock File objects
const createMockFile = (
  name: string,
  type: string,
  size: number = 1024
): File => {
  const file = new Blob(["mock content"], { type }) as File;
  Object.defineProperty(file, "name", { value: name });
  Object.defineProperty(file, "size", { value: size });
  Object.defineProperty(file, "type", { value: type });
  Object.defineProperty(file, "lastModified", { value: Date.now() });
  return file;
};

describe("useFileSystem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFileReader.result = null;
    mockFileReader.onload = null;
    mockFileReader.onerror = null;
    mockFileReader.error = null;

    // Ensure we have a proper DOM container
    document.body.innerHTML = '<div id="root"></div>';
  });

  it("initializes with correct default state", () => {
    const { result } = renderHook(() => useFileSystem());

    expect(result.current.selectedFiles).toEqual([]);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBe(null);
  });

  describe("selectFiles", () => {
    it("processes image files successfully", async () => {
      const { result } = renderHook(() => useFileSystem());

      const mockFile = createMockFile("test.jpg", "image/jpeg", 2048);
      const fileList = {
        0: mockFile,
        length: 1,
      } as unknown as FileList;

      await act(async () => {
        await result.current.selectFiles(fileList);
      });

      expect(result.current.selectedFiles).toHaveLength(1);
      expect(result.current.selectedFiles[0]).toMatchObject({
        name: "test.jpg",
        type: "image/jpeg",
        size: 2048,
        url: "blob:mock-url",
      });
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockFile);
    });

    it("processes text files and reads content", async () => {
      const { result } = renderHook(() => useFileSystem());

      const mockFile = createMockFile("test.txt", "text/plain", 512);
      const fileList = {
        0: mockFile,
        length: 1,
      } as unknown as FileList;

      // Mock successful file reading
      mockFileReader.result = "mock file content";

      await act(async () => {
        await result.current.selectFiles(fileList);

        // Simulate FileReader onload
        if (mockFileReader.onload) {
          mockFileReader.onload({} as ProgressEvent<FileReader>);
        }
      });

      expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile);
      expect(result.current.selectedFiles).toHaveLength(1);
      expect(result.current.selectedFiles[0]).toMatchObject({
        name: "test.txt",
        type: "text/plain",
        size: 512,
        content: "mock file content",
      });
    });

    it("handles multiple files", async () => {
      const { result } = renderHook(() => useFileSystem());

      const mockFile1 = createMockFile("test1.jpg", "image/jpeg");
      const mockFile2 = createMockFile("test2.png", "image/png");
      const fileList = {
        0: mockFile1,
        1: mockFile2,
        length: 2,
      } as unknown as FileList;

      await act(async () => {
        await result.current.selectFiles(fileList);
      });

      expect(result.current.selectedFiles).toHaveLength(2);
      expect(result.current.selectedFiles[0].name).toBe("test1.jpg");
      expect(result.current.selectedFiles[1].name).toBe("test2.png");
    });

    it("handles file processing errors gracefully", async () => {
      const { result } = renderHook(() => useFileSystem());

      // Mock FileReader to throw an error
      mockFileReader.readAsText.mockImplementation(() => {
        throw new Error("File read error");
      });

      const mockFile = createMockFile("test.txt", "text/plain");
      const fileList = {
        0: mockFile,
        length: 1,
      } as unknown as FileList;

      await act(async () => {
        await result.current.selectFiles(fileList);
      });

      // Should still add the file even if content reading fails
      expect(result.current.selectedFiles).toHaveLength(1);
      expect(result.current.selectedFiles[0].content).toBeUndefined();
    });
  });

  describe("downloadSampleFile", () => {
    it("creates and downloads a file successfully", () => {
      const { result } = renderHook(() => useFileSystem());

      const mockLink = {
        href: "",
        download: "",
        click: vi.fn(),
      };
      mockCreateElement.mockReturnValue(mockLink);

      act(() => {
        result.current.downloadSampleFile(
          "test.txt",
          "sample content",
          "text/plain"
        );
      });

      expect(mockCreateElement).toHaveBeenCalledWith("a");
      expect(mockLink.download).toBe("test.txt");
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
    });

    it("handles download errors", () => {
      const { result } = renderHook(() => useFileSystem());

      mockCreateElement.mockImplementation(() => {
        throw new Error("Download error");
      });

      act(() => {
        result.current.downloadSampleFile("test.txt", "content", "text/plain");
      });

      expect(result.current.error).toBe("Download error");
    });
  });

  describe("removeFile", () => {
    it("removes file and revokes URL", async () => {
      const { result } = renderHook(() => useFileSystem());

      const mockFile = createMockFile("test.jpg", "image/jpeg");
      const fileList = {
        0: mockFile,
        length: 1,
      } as unknown as FileList;

      await act(async () => {
        await result.current.selectFiles(fileList);
      });

      const fileId = result.current.selectedFiles[0].id;

      act(() => {
        result.current.removeFile(fileId);
      });

      expect(result.current.selectedFiles).toHaveLength(0);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });
  });

  describe("clearFiles", () => {
    it("clears all files and revokes URLs", async () => {
      const { result } = renderHook(() => useFileSystem());

      const mockFile1 = createMockFile("test1.jpg", "image/jpeg");
      const mockFile2 = createMockFile("test2.png", "image/png");
      const fileList = {
        0: mockFile1,
        1: mockFile2,
        length: 2,
      } as unknown as FileList;

      await act(async () => {
        await result.current.selectFiles(fileList);
      });

      expect(result.current.selectedFiles).toHaveLength(2);

      act(() => {
        result.current.clearFiles();
      });

      expect(result.current.selectedFiles).toHaveLength(0);
      expect(mockRevokeObjectURL).toHaveBeenCalledTimes(2);
    });
  });

  describe("clearError", () => {
    it("clears error state", () => {
      const { result } = renderHook(() => useFileSystem());

      // Set an error first
      act(() => {
        result.current.downloadSampleFile("", "", ""); // This should cause an error
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe("previewFile", () => {
    it("handles file preview request", async () => {
      const { result } = renderHook(() => useFileSystem());

      const mockFile = createMockFile("test.txt", "text/plain");
      const fileList = {
        0: mockFile,
        length: 1,
      } as unknown as FileList;

      await act(async () => {
        await result.current.selectFiles(fileList);
      });

      const fileId = result.current.selectedFiles[0].id;

      await act(async () => {
        await result.current.previewFile(fileId);
      });

      // Should not change the processing state since content is already loaded
      expect(result.current.isProcessing).toBe(false);
    });

    it("handles preview of non-existent file", async () => {
      const { result } = renderHook(() => useFileSystem());

      await act(async () => {
        await result.current.previewFile("non-existent-id");
      });

      expect(result.current.isProcessing).toBe(false);
    });
  });
});
