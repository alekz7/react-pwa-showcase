import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock all MUI components and icons to prevent file handle issues
vi.mock("@mui/material", () => ({
  Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Button: ({ children, onClick, startIcon, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {startIcon} {children}
    </button>
  ),
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  Typography: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  IconButton: ({
    children,
    onClick,
    "aria-label": ariaLabel,
    ...props
  }: any) => (
    <button onClick={onClick} aria-label={ariaLabel} {...props}>
      {children}
    </button>
  ),
  Alert: ({ children, onClose, ...props }: any) => (
    <div role="alert" {...props}>
      {children}
      {onClose && (
        <button aria-label="Close" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  ),
  Paper: ({ children }: any) => <div>{children}</div>,
  Chip: ({ label }: any) => <span>{label}</span>,
  Dialog: ({ open, children }: any) =>
    open ? <div role="dialog">{children}</div> : null,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  FormControl: ({ children }: any) => <div>{children}</div>,
  InputLabel: ({ children }: any) => <label>{children}</label>,
  Select: ({ children, value, onChange }: any) => (
    <select value={value} onChange={onChange}>
      {children}
    </select>
  ),
  MenuItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
  FormControlLabel: ({ control, label }: any) => (
    <label>
      {control} {label}
    </label>
  ),
  Switch: ({ checked, onChange }: any) => (
    <input type="checkbox" checked={checked} onChange={onChange} />
  ),
  List: ({ children }: any) => <ul>{children}</ul>,
  ListItem: ({ children }: any) => <li>{children}</li>,
  ListItemText: ({ primary, secondary }: any) => (
    <div>
      <div>{primary}</div>
      {secondary && <div>{secondary}</div>}
    </div>
  ),
  ListItemSecondaryAction: ({ children }: any) => <div>{children}</div>,
  LinearProgress: ({ value }: any) => <div>Audio Level: {value}%</div>,
}));

// Mock all icons
vi.mock("@mui/icons-material/Mic", () => ({
  default: () => <span>MicIcon</span>,
}));
vi.mock("@mui/icons-material/MicOff", () => ({
  default: () => <span>MicOffIcon</span>,
}));
vi.mock("@mui/icons-material/Stop", () => ({
  default: () => <span>StopIcon</span>,
}));
vi.mock("@mui/icons-material/PlayArrow", () => ({
  default: () => <span>PlayIcon</span>,
}));
vi.mock("@mui/icons-material/Pause", () => ({
  default: () => <span>PauseIcon</span>,
}));
vi.mock("@mui/icons-material/Delete", () => ({
  default: () => <span>DeleteIcon</span>,
}));
vi.mock("@mui/icons-material/Settings", () => ({
  default: () => <span>SettingsIcon</span>,
}));
vi.mock("@mui/icons-material/FiberManualRecord", () => ({
  default: () => <span>RecordIcon</span>,
}));

// Mock the hooks
const mockUsePermissions = {
  hasPermission: vi.fn(),
  requestPermission: vi.fn(),
  permissions: {},
};

const mockUseMicrophone = {
  isListening: false,
  isRecording: false,
  recordingTime: 0,
  audioLevel: 0,
  error: null,
  recordings: [],
  startListening: vi.fn(),
  stopListening: vi.fn(),
  startRecording: vi.fn(),
  stopRecording: vi.fn(),
  deleteRecording: vi.fn(),
  clearError: vi.fn(),
};

vi.mock("../../hooks/usePermissions", () => ({
  usePermissions: () => mockUsePermissions,
}));

vi.mock("../../hooks/useMicrophone", () => ({
  useMicrophone: () => mockUseMicrophone,
}));

// Mock PermissionHandler component
vi.mock("../PermissionHandler", () => ({
  default: ({ open, onPermissionsGranted }: any) => (
    <div data-testid="permission-handler">
      {open && (
        <button onClick={onPermissionsGranted}>Grant Permissions</button>
      )}
    </div>
  ),
}));

import MicrophoneDemo from "../MicrophoneDemo";

describe("MicrophoneDemo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermissions.hasPermission.mockReturnValue(true);
    Object.assign(mockUseMicrophone, {
      isListening: false,
      isRecording: false,
      recordingTime: 0,
      audioLevel: 0,
      error: null,
      recordings: [],
    });
  });

  it("renders microphone demo interface", () => {
    render(<MicrophoneDemo />);

    expect(screen.getByText("🎤 Microphone Demo")).toBeInTheDocument();
    expect(
      screen.getByText(/Record audio and monitor sound levels/)
    ).toBeInTheDocument();
    expect(screen.getByText("Start Listening")).toBeInTheDocument();
  });

  it("shows permission dialog when microphone permission is not granted", () => {
    mockUsePermissions.hasPermission.mockReturnValue(false);

    render(<MicrophoneDemo />);

    expect(screen.getByTestId("permission-handler")).toBeInTheDocument();
  });

  it("starts listening when Start Listening button is clicked", async () => {
    render(<MicrophoneDemo />);

    const startButton = screen.getByText("Start Listening");
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockUseMicrophone.startListening).toHaveBeenCalledWith({
        sampleRate: 44100,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
    });
  });

  it("shows listening controls when microphone is active", () => {
    Object.assign(mockUseMicrophone, { isListening: true });

    render(<MicrophoneDemo />);

    expect(screen.getByText("Stop Listening")).toBeInTheDocument();
    expect(screen.getByText("Record")).toBeInTheDocument();
    expect(screen.getByText("Listening")).toBeInTheDocument();
  });

  it("shows recording controls when recording is active", () => {
    Object.assign(mockUseMicrophone, {
      isListening: true,
      isRecording: true,
      recordingTime: 30,
    });

    render(<MicrophoneDemo />);

    expect(screen.getByText("Stop Recording")).toBeInTheDocument();
    expect(screen.getByText("REC 00:30")).toBeInTheDocument();
  });

  it("displays audio level visualization", () => {
    Object.assign(mockUseMicrophone, {
      isListening: true,
      audioLevel: 75,
    });

    render(<MicrophoneDemo />);

    expect(screen.getByText("Audio Level: 75%")).toBeInTheDocument();
  });

  it("displays error messages", () => {
    Object.assign(mockUseMicrophone, {
      error: "Microphone access denied",
    });

    render(<MicrophoneDemo />);

    expect(screen.getByText("Microphone access denied")).toBeInTheDocument();
  });

  it("shows recordings list", () => {
    const mockRecordings = [
      {
        id: "audio-1234567890",
        url: "blob:mock-url",
        timestamp: new Date("2024-01-01T12:00:00Z"),
        duration: 30,
        size: 1024,
      },
    ];

    Object.assign(mockUseMicrophone, {
      recordings: mockRecordings,
    });

    render(<MicrophoneDemo />);

    expect(screen.getByText("Audio Recordings (1)")).toBeInTheDocument();
    expect(screen.getByText("Recording 1234567890")).toBeInTheDocument();
  });

  it("handles recording deletion", () => {
    const mockRecordings = [
      {
        id: "audio-1234567890",
        url: "blob:mock-url",
        timestamp: new Date(),
        duration: 30,
        size: 1024,
      },
    ];

    Object.assign(mockUseMicrophone, {
      recordings: mockRecordings,
    });

    render(<MicrophoneDemo />);

    const deleteButton = screen.getByLabelText("Delete");
    fireEvent.click(deleteButton);

    expect(mockUseMicrophone.deleteRecording).toHaveBeenCalledWith(
      "audio-1234567890"
    );
  });

  it("opens settings dialog", async () => {
    Object.assign(mockUseMicrophone, { isListening: true });

    render(<MicrophoneDemo />);

    const settingsButton = screen.getByLabelText("Audio settings");
    fireEvent.click(settingsButton);

    await waitFor(() => {
      expect(screen.getByText("Audio Settings")).toBeInTheDocument();
    });
  });

  it("shows empty state when no recordings", () => {
    render(<MicrophoneDemo />);

    expect(screen.getByText("Audio Recordings (0)")).toBeInTheDocument();
    expect(
      screen.getByText(/No recordings yet. Start listening/)
    ).toBeInTheDocument();
  });

  it("clears error when close button is clicked", () => {
    Object.assign(mockUseMicrophone, {
      error: "Test error",
    });

    render(<MicrophoneDemo />);

    const alert = screen.getByRole("alert");
    const closeButton = alert.querySelector('[aria-label="Close"]');

    if (closeButton) {
      fireEvent.click(closeButton);
      expect(mockUseMicrophone.clearError).toHaveBeenCalled();
    }
  });

  it("shows implementation hints", () => {
    render(<MicrophoneDemo />);

    expect(screen.getByText("💡 Implementation Hints")).toBeInTheDocument();
    expect(
      screen.getByText(/Uses navigator.mediaDevices.getUserMedia/)
    ).toBeInTheDocument();
  });

  it("handles permission grant from dialog", async () => {
    mockUsePermissions.hasPermission.mockReturnValue(false);

    render(<MicrophoneDemo />);

    const grantButton = screen.getByText("Grant Permissions");
    fireEvent.click(grantButton);

    await waitFor(() => {
      expect(mockUseMicrophone.startListening).toHaveBeenCalled();
    });
  });

  it("stops listening when Stop Listening button is clicked", () => {
    Object.assign(mockUseMicrophone, { isListening: true });

    render(<MicrophoneDemo />);

    const stopButton = screen.getByText("Stop Listening");
    fireEvent.click(stopButton);

    expect(mockUseMicrophone.stopListening).toHaveBeenCalled();
  });

  it("starts recording when Record button is clicked", () => {
    Object.assign(mockUseMicrophone, { isListening: true });

    render(<MicrophoneDemo />);

    const recordButton = screen.getByText("Record");
    fireEvent.click(recordButton);

    expect(mockUseMicrophone.startRecording).toHaveBeenCalled();
  });

  it("stops recording when Stop Recording button is clicked", () => {
    Object.assign(mockUseMicrophone, {
      isListening: true,
      isRecording: true,
    });

    render(<MicrophoneDemo />);

    const stopRecordingButton = screen.getByText("Stop Recording");
    fireEvent.click(stopRecordingButton);

    expect(mockUseMicrophone.stopRecording).toHaveBeenCalled();
  });
});
