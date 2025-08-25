import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import PermissionStatusIndicator from "../PermissionStatusIndicator";
import { usePermissions } from "../../hooks/usePermissions";
import type { PermissionName } from "../../hooks/usePermissions";

// Mock the usePermissions hook
jest.mock("../../hooks/usePermissions");

const mockUsePermissions = usePermissions as jest.MockedFunction<
  typeof usePermissions
>;

const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

const mockPermissions = {
  camera: {
    name: "camera" as PermissionName,
    state: "granted" as const,
    canRequest: true,
    isSupported: true,
  },
  microphone: {
    name: "microphone" as PermissionName,
    state: "denied" as const,
    canRequest: true,
    isSupported: true,
  },
  geolocation: {
    name: "geolocation" as PermissionName,
    state: "prompt" as const,
    canRequest: true,
    isSupported: true,
  },
  notifications: {
    name: "notifications" as PermissionName,
    state: "unsupported" as const,
    canRequest: false,
    isSupported: false,
  },
  accelerometer: {
    name: "accelerometer" as PermissionName,
    state: "granted" as const,
    canRequest: true,
    isSupported: true,
  },
  gyroscope: {
    name: "gyroscope" as PermissionName,
    state: "prompt" as const,
    canRequest: true,
    isSupported: true,
  },
  magnetometer: {
    name: "magnetometer" as PermissionName,
    state: "denied" as const,
    canRequest: true,
    isSupported: true,
  },
};

const mockPermissionHooks = {
  permissions: mockPermissions,
  requestPermission: jest.fn(),
  requestMultiplePermissions: jest.fn(),
  checkPermission: jest.fn(),
  hasPermission: jest.fn(),
  canUseFeature: jest.fn(),
  refreshPermissions: jest.fn(),
  getPermissionInstructions: jest.fn(),
};

describe("PermissionStatusIndicator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePermissions.mockReturnValue(mockPermissionHooks);
  });

  it("renders supported permissions by default", () => {
    render(
      <TestWrapper>
        <PermissionStatusIndicator />
      </TestWrapper>
    );

    // Should show supported permissions (excluding unsupported notifications)
    expect(
      screen.getByLabelText(/Camera permission granted/)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Microphone permission denied/)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Location permission not requested/)
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Notifications/)).not.toBeInTheDocument(); // unsupported
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
    const onPermissionClick = jest.fn();

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
    const onSettingsClick = jest.fn();

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
          permissions={[
            "camera",
            "microphone",
            "geolocation",
            "accelerometer",
            "gyroscope",
          ]}
        />
      </TestWrapper>
    );

    // Should show summary badge when more than 3 permissions
    expect(screen.getByText("Permissions")).toBeInTheDocument();
    // Should show count (2 granted out of 5 total supported)
    expect(screen.getByText("2/5")).toBeInTheDocument();
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

  it("does not render when no supported permissions", () => {
    // Mock all permissions as unsupported
    const unsupportedPermissions = Object.fromEntries(
      Object.entries(mockPermissions).map(([key, value]) => [
        key,
        { ...value, isSupported: false },
      ])
    );

    mockUsePermissions.mockReturnValue({
      ...mockPermissionHooks,
      permissions: unsupportedPermissions,
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
    const onPermissionClick = jest.fn();

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
    const onSettingsClick = jest.fn();

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
