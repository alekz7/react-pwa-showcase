import React, { useCallback, useRef } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Alert,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import PreviewIcon from "@mui/icons-material/Preview";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ImageIcon from "@mui/icons-material/Image";
import VideoFileIcon from "@mui/icons-material/VideoFile";
import AudioFileIcon from "@mui/icons-material/AudioFile";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import { useFileSystem, type FileInfo } from "../../hooks/useFileSystem";

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return <ImageIcon />;
  if (type.startsWith("video/")) return <VideoFileIcon />;
  if (type.startsWith("audio/")) return <AudioFileIcon />;
  if (type.startsWith("text/") || type === "application/json")
    return <TextFieldsIcon />;
  return <InsertDriveFileIcon />;
};

const getFileTypeColor = (
  type: string
):
  | "default"
  | "primary"
  | "secondary"
  | "error"
  | "info"
  | "success"
  | "warning" => {
  if (type.startsWith("image/")) return "success";
  if (type.startsWith("video/")) return "primary";
  if (type.startsWith("audio/")) return "secondary";
  if (type.startsWith("text/") || type === "application/json") return "info";
  return "default";
};

interface FilePreviewDialogProps {
  file: FileInfo | null;
  open: boolean;
  onClose: () => void;
}

const FilePreviewDialog: React.FC<FilePreviewDialogProps> = ({
  file,
  open,
  onClose,
}) => {
  if (!file) return null;

  const renderPreview = () => {
    if (file.type.startsWith("image/") && file.url) {
      return (
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <img
            src={file.url}
            alt={file.name}
            style={{
              maxWidth: "100%",
              maxHeight: "400px",
              objectFit: "contain",
            }}
          />
        </Box>
      );
    }

    if (file.type.startsWith("video/") && file.url) {
      return (
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <video
            src={file.url}
            controls
            style={{
              maxWidth: "100%",
              maxHeight: "400px",
            }}
          />
        </Box>
      );
    }

    if (file.type.startsWith("audio/") && file.url) {
      return (
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <audio src={file.url} controls style={{ width: "100%" }} />
        </Box>
      );
    }

    if (file.content && typeof file.content === "string") {
      return (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="body2"
            component="pre"
            sx={{
              backgroundColor: "grey.100",
              p: 2,
              borderRadius: 1,
              overflow: "auto",
              maxHeight: "400px",
              fontSize: "0.875rem",
              fontFamily: "monospace",
            }}
          >
            {file.content}
          </Typography>
        </Box>
      );
    }

    return (
      <Typography variant="body2" color="text.secondary">
        Preview not available for this file type.
      </Typography>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {getFileIcon(file.type)}
          {file.name}
        </Box>
      </DialogTitle>
      <DialogContent>
        {renderPreview()}
        <TableContainer>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>
                  <strong>Name</strong>
                </TableCell>
                <TableCell>{file.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <strong>Size</strong>
                </TableCell>
                <TableCell>{formatFileSize(file.size)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <strong>Type</strong>
                </TableCell>
                <TableCell>{file.type || "Unknown"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <strong>Last Modified</strong>
                </TableCell>
                <TableCell>{formatDate(file.lastModified)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export const FileExplorerDemo: React.FC = () => {
  const {
    selectedFiles,
    isProcessing,
    error,
    selectFiles,
    clearFiles,
    downloadSampleFile,
    removeFile,
    clearError,
  } = useFileSystem();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = React.useState<FileInfo | null>(null);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        selectFiles(files);
      }
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [selectFiles]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        selectFiles(files);
      }
    },
    [selectFiles]
  );

  const handleDownloadSample = useCallback(
    (type: "text" | "json" | "csv") => {
      const samples = {
        text: {
          filename: "sample.txt",
          content:
            "This is a sample text file generated by the File Explorer Demo.\n\nYou can download various file types to test the file system capabilities of your browser.\n\nFeatures demonstrated:\n- File selection and upload\n- File information display\n- File preview for supported types\n- File download generation",
          type: "text/plain",
        },
        json: {
          filename: "sample.json",
          content: JSON.stringify(
            {
              name: "File Explorer Demo",
              version: "1.0.0",
              description:
                "A demonstration of file system capabilities in web browsers",
              features: [
                "File selection",
                "Drag and drop",
                "File preview",
                "File information",
                "Download generation",
              ],
              timestamp: new Date().toISOString(),
            },
            null,
            2
          ),
          type: "application/json",
        },
        csv: {
          filename: "sample.csv",
          content:
            'Name,Type,Size,Date\n"sample.txt","text/plain",1024,"2024-01-01"\n"sample.json","application/json",2048,"2024-01-02"\n"sample.csv","text/csv",512,"2024-01-03"',
          type: "text/csv",
        },
      };

      const sample = samples[type];
      downloadSampleFile(sample.filename, sample.content, sample.type);
    },
    [downloadSampleFile]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        📁 File Explorer Demo
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Test file system access capabilities including file selection, preview,
        and download. This demo showcases drag-and-drop file handling, file
        information display, and content preview for supported file types.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
        }}
      >
        {/* File Selection Area */}
        <Box sx={{ flex: { xs: "1", md: "1" } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                File Selection
              </Typography>

              {/* Drag and Drop Area */}
              <Paper
                sx={{
                  p: 4,
                  textAlign: "center",
                  border: "2px dashed",
                  borderColor: "primary.main",
                  bgcolor: "action.hover",
                  cursor: "pointer",
                  mb: 2,
                  "&:hover": {
                    bgcolor: "action.selected",
                  },
                }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <FolderOpenIcon
                  sx={{ fontSize: 48, color: "primary.main", mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  Drop files here or click to select
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supports images, videos, audio, text files, and more
                </Typography>
                {isProcessing && (
                  <Box sx={{ mt: 2 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Processing files...
                    </Typography>
                  </Box>
                )}
              </Paper>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: "none" }}
                accept="*/*"
              />

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  Select Files
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={clearFiles}
                  disabled={selectedFiles.length === 0}
                >
                  Clear All
                </Button>
              </Box>

              {/* Sample Downloads */}
              <Typography variant="subtitle2" gutterBottom>
                Download Sample Files:
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownloadSample("text")}
                >
                  Text File
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownloadSample("json")}
                >
                  JSON File
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownloadSample("csv")}
                >
                  CSV File
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* File List */}
        <Box sx={{ flex: { xs: "1", md: "2" } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Selected Files ({selectedFiles.length})
              </Typography>

              {selectedFiles.length === 0 ? (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 4,
                    color: "text.secondary",
                  }}
                >
                  <InsertDriveFileIcon
                    sx={{ fontSize: 48, mb: 2, opacity: 0.5 }}
                  />
                  <Typography variant="body2">
                    No files selected. Choose files to see their information and
                    preview.
                  </Typography>
                </Box>
              ) : (
                <List>
                  {selectedFiles.map((file) => (
                    <ListItem key={file.id} divider>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mr: 2 }}
                      >
                        {getFileIcon(file.type)}
                      </Box>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              flexWrap: "wrap",
                            }}
                          >
                            <Typography variant="body1" noWrap>
                              {file.name}
                            </Typography>
                            <Chip
                              label={file.type || "Unknown"}
                              size="small"
                              color={getFileTypeColor(file.type)}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Size: {formatFileSize(file.size)}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Modified: {formatDate(file.lastModified)}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => setPreviewFile(file)}
                          sx={{ mr: 1 }}
                          aria-label="Preview"
                        >
                          <PreviewIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => removeFile(file.id)}
                          aria-label="Delete"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Implementation hints */}
      <Paper sx={{ mt: 3, p: 2, bgcolor: "background.default" }}>
        <Typography variant="h6" gutterBottom>
          💡 Implementation Hints
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Uses HTML5 File API for file selection and reading
          <br />
          • Implements drag-and-drop with HTML5 Drag and Drop API
          <br />
          • File preview using FileReader API and object URLs
          <br />
          • File download generation with Blob API and temporary links
          <br />
          • File type detection and appropriate icon display
          <br />• Memory management with URL.revokeObjectURL() cleanup
        </Typography>
      </Paper>

      {/* File Preview Dialog */}
      <FilePreviewDialog
        file={previewFile}
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </Box>
  );
};

export default FileExplorerDemo;
