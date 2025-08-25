import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import PermissionHandler from "../PermissionHandler";

// Mock the usePermissions hook
const mockUsePermissions = {
  permissions: {
    camera: { status: "prompt", isRequesting: false },
    microphone: { status: "prompt", isRequesting: false },
    geolocation: { status: "prompt", isRequesting: false },
    notifications: { status: "prompt", isRequesting: false },
  },
  requestPermission: vi.fn(),
  checkPermission: vi.fn(),
  hasPermission: vi.fn(),
  isRequesting: vi.fn(),
};

vi.mock("../../hooks/usePermissions", () => ({
  usePermissions: () => mockUsePermissions,
}));

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("PermissionHandler", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    requiredPermissions: ["camera", "microphone"] as const,
    onPermissionsGranted: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock permissions to default state
    mockUsePermissions.permissions = {
      camera: { status: "prompt", isRequesting: false },
      microphone: { status: "prompt", isRequesting: false },
      geolocation: { status: "prompt", isRequesting: false },
      notifications: { status: "prompt", isRequesting: false },
    };

    mockUsePermissions.hasPermission.mockImplementation(
      (permission) =>
        mockUsePermissions.permissions[permission].status === "granted"
    );

    mockUsePermissions.isRequesting.mockImplementation(
      (permission) => mockUsePermissions.permissions[permission].isRequesting
    );

    mockUsePermissions.checkPermission.mockResolvedValue("prompt");
    mockUsePermissions.requestPermission.mockResolvedValue("granted");
  });

  it("renders dialog when open", () => {
    renderWithTheme(<PermissionHandler {...defaultProps} />);

    expect(screen.getByText("Permissions Required")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This demo requires the following permissions to function properly:"
      )
    ).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderWithTheme(<PermissionHandler {...defaultProps} open={false} />);

    expect(screen.queryByText("Permissions Required")).not.toBeInTheDocument();
  });

  it("displays required permissions in the list", () => {
    renderWithTheme(<PermissionHandler {...defaultProps} />);

    expect(screen.getByText("Camera Access")).toBeInTheDocument();
    expect(screen.getByText("Microphone Access")).toBeInTheDocument();
    expect(
      screen.getByText("Required to capture photos and videos")
    ).toBeInTheDocument();
    expect(screen.getByText("Required to record audio")).toBeInTheDocument();
  });

  it("shows permission status chips", () => {
    renderWithTheme(<PermissionHandler {...defaultProps} />);

    const promptChips = screen.getAllByText("prompt");
    expect(promptChips).toHaveLength(2); // Camera and microphone
  });

  it("displays stepper for permission requests", () => {
    renderWithTheme(<PermissionHandler {...defaultProps} />);

    expect(
      screen.getByText(
        "This demo needs camera access to show photo capture and video recording capabilities."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Grant Permission")).toBeInTheDocument();
  });

  it("handles permission request", async () => {
    mockUsePermissions.requestPermission.mockResolvedValue("granted");

    renderWithTheme(<PermissionHandler {...defaultProps} />);

    const grantButton = screen.getByText("Grant Permission");
    fireEvent.click(grantButton);

    expect(mockUsePermissions.requestPermission).toHaveBeenCalledWith("camera");
  });

  it("shows loading state during permission request", async () => {
    mockUsePermissions.permissions.camera.isRequesting = true;
    mockUsePermissions.isRequesting.mockReturnValue(true);

    renderWithTheme(<PermissionHandler {...defaultProps} />);

    expect(screen.getByText("Requesting...")).toBeInTheDocument();
  });

  it("shows granted state when permission is granted", () => {
    mockUsePermissions.permissions.camera.status = "granted";
    mockUsePermissions.hasPermission.mockImplementation(
      (permission) => permission === "camera"
    );

    renderWithTheme(<PermissionHandler {...defaultProps} />);

    expect(screen.getByText("Permission Granted")).toBeInTheDocument();
  });

  it("shows error message when permission fails", () => {
    mockUsePermissions.permissions.camera.status = "denied";
    mockUsePermissions.permissions.camera.error = "Camera access denied";

    renderWithTheme(<PermissionHandler {...defaultProps} />);

    expect(screen.getByText("Camera access denied")).toBeInTheDocument();
  });

  it("shows success message when all permissions are granted", () => {
    mockUsePermissions.permissions.camera.status = "granted";
    mockUsePermissions.permissions.microphone.status = "granted";
    mockUsePermissions.hasPermission.mockReturnValue(true);

    renderWithTheme(<PermissionHandler {...defaultProps} />);

    expect(
      screen.getByText(
        "All required permissions have been granted! You can now use all features of this demo."
      )
    ).toBeInTheDocument();
  });

  it("enables continue button when all permissions are granted", () => {
    mockUsePermissions.permissions.camera.status = "granted";
    mockUsePermissions.permissions.microphone.status = "granted";
    mockUsePermissions.hasPermission.mockReturnValue(true);

    renderWithTheme(<PermissionHandler {...defaultProps} />);

    const continueButton = screen.getByText("Continue");
    expect(continueButton).not.toBeDisabled();
  });

  it("calls onPermissionsGranted when continue is clicked", () => {
    mockUsePermissions.permissions.camera.status = "granted";
    mockUsePermissions.permissions.microphone.status = "granted";
    mockUsePermissions.hasPermission.mockReturnValue(true);

    renderWithTheme(<PermissionHandler {...defaultProps} />);

    const continueButton = screen.getByText("Continue");
    fireEvent.click(continueButton);

    expect(defaultProps.onPermissionsGranted).toHaveBeenCalled();
  });

  it("calls onClose when cancel is clicked", () => {
    renderWithTheme(<PermissionHandler {...defaultProps} />);

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("displays custom title and description", () => {
    const customProps = {
      ...defaultProps,
      title: "Custom Title",
      description: "Custom description text",
    };

    renderWithTheme(<PermissionHandler {...customProps} />);

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
    expect(screen.getByText("Custom description text")).toBeInTheDocument();
  });

  it("shows permission count badge", () => {
    renderWithTheme(<PermissionHandler {...defaultProps} />);

    expect(screen.getByText("2 permissions")).toBeInTheDocument();
  });

  it("checks permissions when dialog opens", async () => {
    renderWithTheme(<PermissionHandler {...defaultProps} />);

    await waitFor(() => {
      expect(mockUsePermissions.checkPermission).toHaveBeenCalledWith("camera");
      expect(mockUsePermissions.checkPermission).toHaveBeenCalledWith(
        "microphone"
      );
    });
  });

  it("handles different permission types", () => {
    const allPermissionsProps = {
      ...defaultProps,
      requiredPermissions: [
        "camera",
        "microphone",
        "geolocation",
        "notifications",
      ] as const,
    };

    renderWithTheme(<PermissionHandler {...allPermissionsProps} />);

    expect(screen.getByText("Camera Access")).toBeInTheDocument();
    expect(screen.getByText("Microphone Access")).toBeInTheDocument();
    expect(screen.getByText("Location Access")).toBeInTheDocument();
    expect(screen.getByText("Notification Permission")).toBeInTheDocument();
  });

  it("shows checking permissions state initially", () => {
    mockUsePermissions.checkPermission.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve("prompt"), 1000))
    );

    renderWithTheme(<PermissionHandler {...defaultProps} />);

    expect(screen.getByText("Checking permissions...")).toBeInTheDocument();
  });
});
