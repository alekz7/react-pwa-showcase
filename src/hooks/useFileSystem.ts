import { useState, useCallback } from "react";

export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  content?: string | ArrayBuffer | null;
  url?: string;
}

export interface UseFileSystemReturn {
  // State
  selectedFiles: FileInfo[];
  isProcessing: boolean;
  error: string | null;

  // Actions
  selectFiles: (files: FileList) => Promise<void>;
  clearFiles: () => void;
  downloadSampleFile: (filename: string, content: string, type: string) => void;
  previewFile: (fileId: string) => Promise<void>;
  removeFile: (fileId: string) => void;
  clearError: () => void;
}

export const useFileSystem = (): UseFileSystemReturn => {
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectFiles = useCallback(async (files: FileList) => {
    setIsProcessing(true);
    setError(null);

    try {
      const fileInfos: FileInfo[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileInfo: FileInfo = {
          id: `file-${Date.now()}-${i}`,
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        };

        // Create object URL for preview
        if (
          file.type.startsWith("image/") ||
          file.type.startsWith("video/") ||
          file.type.startsWith("audio/")
        ) {
          fileInfo.url = URL.createObjectURL(file);
        }

        // Read text files for preview
        if (file.type.startsWith("text/") || file.type === "application/json") {
          try {
            const content = await readFileAsText(file);
            fileInfo.content = content;
          } catch (err) {
            console.warn(`Failed to read file ${file.name}:`, err);
          }
        }

        fileInfos.push(fileInfo);
      }

      setSelectedFiles((prev) => [...prev, ...fileInfos]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to process files";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  const previewFile = useCallback(
    async (fileId: string) => {
      const fileInfo = selectedFiles.find((f) => f.id === fileId);
      if (!fileInfo) return;

      setIsProcessing(true);
      setError(null);

      try {
        // If content is already loaded, no need to reload
        if (fileInfo.content !== undefined) {
          setIsProcessing(false);
          return;
        }

        // For files that weren't initially processed, we can't re-read them
        // since we don't have access to the original File object
        setError("File content not available for preview");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to preview file";
        setError(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedFiles]
  );

  const downloadSampleFile = useCallback(
    (filename: string, content: string, type: string) => {
      try {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to download file";
        setError(errorMessage);
      }
    },
    []
  );

  const removeFile = useCallback((fileId: string) => {
    setSelectedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId);
      if (fileToRemove?.url) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  }, []);

  const clearFiles = useCallback(() => {
    // Clean up object URLs
    selectedFiles.forEach((file) => {
      if (file.url) {
        URL.revokeObjectURL(file.url);
      }
    });
    setSelectedFiles([]);
    setError(null);
  }, [selectedFiles]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    selectedFiles,
    isProcessing,
    error,

    // Actions
    selectFiles,
    clearFiles,
    downloadSampleFile,
    previewFile,
    removeFile,
    clearError,
  };
};
