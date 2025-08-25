import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import PermissionStatusIndicator from "../PermissionStatusIndicator";
import { usePermissions } from "../../hooks/usePermissions";

// Mock the usePermissions hook
vi.mock("../../hooks/usePermissions");

const mockUsePermissions = usePermissions as ReturnType<typeof vi.fn>;

const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

const mockPermissions = {
  camera: {
    status: "granted" as const,
    isRequesting: false,
    error: undefined,
  },
  microphone: {
    status: "denied" as const,
    isRequesting: false,
    error: undefined,
  },
  geolocation: {
    status: "prompt" as const,
    isRequesting: false,
    error: undefined,
  },
  notifications: {
    status: "unknown" as const,
    isRequesting: false,
    error: undefined,
  },
};

const mockPermissionHooks = {
  permissions: mockPermissions,
  requestPermission: vi.fn(),
  checkPermission: vi.fn(),
  hasPermission: vi.fn(),
  isRequesting: vi.fn(),
};

describe("PermissionStatusIndicator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermissions.mockReturnValue(mockPermissionHooks);
  });

  it("renders supported permissions by default", () => {
    render(
      <TestWrapper>
        <PermissionStatusIndicator />
      </TestWrapper>
    );

    // Should show permissions with known status (excluding unknown notifications)
    expect(
      screen.getByLabelText(/Camera permission granted/)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Microphone permission denied/)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Location permission not requested/)
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Notifications/)).not.toBeInTheDocument(); // unknown status
  });

  it("renders only specified permissions when provided", () => {
    render(
      <TestWrapper>
        <PermissionStatusIndicator permissions={["camera", "microphone"]} />
      </TestWrapper>
    );

    expect(
      screen.getByLabelText(/Camera permission granted/)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Microphone permission denied/)
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Location/)).not.toBeInTheDocument();
  });

  it("shows labels when showLabels is true", () => {
    render(
      <TestWrapper>
        <PermissionStatusIndicator
          permissions={["camera", "microphone"]}
          showLabels={true}
        />
      </TestWrapper>
    );

    expect(screen.getByText("Camera")).toBeInTheDocument();
    expect(screen.getByText("Microphone")).toBeInTheDocument();
  });

  it("does not show labels by default", () => {
    render(
      <TestWrapper>
        <PermissionStatusIndicator permissions={["camera", "microphone"]} />
      </TestWrapper>
    );

    expect(screen.queryByText("Camera")).not.toBeInTheDocument();
    expect(screen.queryByText("Microphone")).not.toBeInTheDocument();
  });

  it("calls onPermissionClick when permission is clicked", () => {
    const onPermissionClick = vi.fn();

    render(
      <TestWrapper>
        <PermissionStatusIndicator
          permissions={["camera"]}
          onPermissionClick={onPermissionClick}
        />
      </TestWrapper>
    );

    const cameraChip = screen.getByLabelText(/Camera permission granted/);
    fireEvent.click(cameraChip);

    expect(onPermissionClick).toHaveBeenCalledWith("camera");
  });

  it("calls onSettingsClick when settings button is clicked", () => {
    const onSettingsClick = vi.fn();

    render(
      <TestWrapper>
        <PermissionStatusIndicator onSettingsClick={onSettingsClick} />
      </TestWrapper>
    );

    const settingsButton = screen.getByLabelText("Manage permissions");
    fireEvent.click(settingsButton);

    expect(onSettingsClick).toHaveBeenCalled();
  });

  it("shows summary badge for many permissions", () => {
    render(
      <TestWrapper>
        <PermissionStatusIndicator
          permissions={["camera", "microphone", "geolocation", "notifications"]}
        />
      </TestWrapper>
    );

    // Should show summary badge when more than 3 permissions
    expect(screen.getByText("Permissions")).toBeInTheDocument();
    // Should show count (1 granted out of 3 total with known status)
    expect(screen.getByText("1/3")).toBeInTheDocument();
  });

  it("displays correct permission states with appropriate colors", () => {
    render(
      <TestWrapper>
        <PermissionStatusIndicator
          permissions={["camera", "microphone", "geolocation"]}
        />
      </TestWrapper>
    );

    // Camera (granted) should have success styling
    const cameraChip = screen.getByLabelText(/Camera permission granted/);
    expect(cameraChip).toHaveClass("MuiChip-colorSuccess");

    // Microphone (denied) should have error styling and be outlined
    const microphoneChip = screen.getByLabelText(
      /Microphone permission denied/
    );
    expect(microphoneChip).toHaveClass("MuiChip-colorError");
    expect(microphoneChip).toHaveClass("MuiChip-outlined");

    // Geolocation (prompt) should have info styling and be outlined
    const geolocationChip = screen.getByLabelText(
      /Location permission not requested/
    );
    expect(geolocationChip).toHaveClass("MuiChip-colorInfo");
    expect(geolocationChip).toHaveClass("MuiChip-outlined");
  });

  it("renders with different sizes", () => {
    const { rerender } = render(
      <TestWrapper>
        <PermissionStatusIndicator permissions={["camera"]} size="small" />
      </TestWrapper>
    );

    let cameraChip = screen.getByLabelText(/Camera permission granted/);
    expect(cameraChip).toHaveClass("MuiChip-sizeSmall");

    rerender(
      <TestWrapper>
        <PermissionStatusIndicator permissions={["camera"]} size="medium" />
      </TestWrapper>
    );

    cameraChip = screen.getByLabelText(/Camera permission granted/);
    expect(cameraChip).toHaveClass("MuiChip-sizeMedium");
  });

  it("does not render when no permissions with known status", () => {
    // Mock all permissions as unknown
    const unknownPermissions = Object.fromEntries(
      Object.entries(mockPermissions).map(([key, value]) => [
        key,
        { ...value, status: "unknown" },
      ])
    );

    mockUsePermissions.mockReturnValue({
      ...mockPermissionHooks,
      permissions: unknownPermissions,
    });

    const { container } = render(
      <TestWrapper>
        <PermissionStatusIndicator />
      </TestWrapper>
    );

    expect(container.firstChild).toBeNull();
  });

  it("shows correct tooltip text for different permission states", () => {
    render(
      <TestWrapper>
        <PermissionStatusIndicator
          permissions={["camera", "microphone", "geolocation"]}
        />
      </TestWrapper>
    );

    // Test tooltips by checking aria-describedby or title attributes
    expect(
      screen.getByLabelText(/Camera permission granted/)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        /Microphone permission denied - click to see instructions/
      )
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        /Location permission not requested - click to request/
      )
    ).toBeInTheDocument();
  });

  it("makes chips clickable when onPermissionClick is provided", () => {
    const onPermissionClick = vi.fn();

    render(
      <TestWrapper>
        <PermissionStatusIndicator
          permissions={["camera"]}
          onPermissionClick={onPermissionClick}
        />
      </TestWrapper>
    );

    const cameraChip = screen.getByLabelText(/Camera permission granted/);
    expect(cameraChip).toHaveClass("MuiChip-clickable");
  });

  it("does not make chips clickable when onPermissionClick is not provided", () => {
    render(
      <TestWrapper>
        <PermissionStatusIndicator permissions={["camera"]} />
      </TestWrapper>
    );

    const cameraChip = screen.getByLabelText(/Camera permission granted/);
    expect(cameraChip).not.toHaveClass("MuiChip-clickable");
  });

  it("shows settings button when onSettingsClick is provided", () => {
    const onSettingsClick = vi.fn();

    render(
      <TestWrapper>
        <PermissionStatusIndicator onSettingsClick={onSettingsClick} />
      </TestWrapper>
    );

    expect(screen.getByLabelText("Manage permissions")).toBeInTheDocument();
  });

  it("does not show settings button when onSettingsClick is not provided", () => {
    render(
      <TestWrapper>
        <PermissionStatusIndicator />
      </TestWrapper>
    );

    expect(
      screen.queryByLabelText("Manage permissions")
    ).not.toBeInTheDocument();
  });
});
