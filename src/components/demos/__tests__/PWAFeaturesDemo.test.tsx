import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import PWAFeaturesDemo from "../PWAFeaturesDemo";

// Mock the navigator APIs
const mockNavigator = {
  onLine: true,
  serviceWorker: {
    getRegistration: jest.fn(),
    addEventListener: jest.fn(),
  },
  storage: {
    estimate: jest.fn(),
  },
};

// Mock window APIs
const mockWindow = {
  matchMedia: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  Notification: {
    permission: "default" as NotificationPermission,
    requestPermission: jest.fn(),
  },
  caches: {
    keys: jest.fn(),
    delete: jest.fn(),
    open: jest.fn(),
  },
};

// Setup mocks
beforeEach(() => {
  Object.defineProperty(window, "navigator", {
    value: mockNavigator,
    writable: true,
  });

  Object.defineProperty(window, "matchMedia", {
    value: mockWindow.matchMedia.mockImplementation(() => ({
      matches: false,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })),
    writable: true,
  });

  Object.defineProperty(window, "Notification", {
    value: mockWindow.Notification,
    writable: true,
  });

  Object.defineProperty(window, "caches", {
    value: mockWindow.caches,
    writable: true,
  });

  // Reset mocks
  jest.clearAllMocks();
});

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("PWAFeaturesDemo", () => {
  it("renders PWA features demo with all sections", () => {
    renderWithTheme(<PWAFeaturesDemo />);

    expect(screen.getByText("PWA Features Demo")).toBeInTheDocument();
    expect(screen.getByText("PWA Installation")).toBeInTheDocument();
    expect(screen.getByText("Service Worker")).toBeInTheDocument();
    expect(screen.getByText("Push Notifications")).toBeInTheDocument();
    expect(screen.getByText("Cache Management")).toBeInTheDocument();
    expect(screen.getByText("Offline Functionality Test")).toBeInTheDocument();
  });

  it("displays installation status correctly", () => {
    mockWindow.matchMedia.mockImplementation(() => ({
      matches: false, // Not installed
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }));

    renderWithTheme(<PWAFeaturesDemo />);

    expect(screen.getByText("Not Installed")).toBeInTheDocument();
  });

  it("displays installed status when app is installed", () => {
    mockWindow.matchMedia.mockImplementation(() => ({
      matches: true, // Installed
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }));

    renderWithTheme(<PWAFeaturesDemo />);

    expect(screen.getByText("Installed")).toBeInTheDocument();
  });

  it("shows service worker status", async () => {
    mockNavigator.serviceWorker.getRegistration.mockResolvedValue({
      active: true,
      installing: null,
      waiting: null,
    });

    renderWithTheme(<PWAFeaturesDemo />);

    await waitFor(() => {
      expect(screen.getByText("activated")).toBeInTheDocument();
    });
  });

  it("shows service worker installing status", async () => {
    mockNavigator.serviceWorker.getRegistration.mockResolvedValue({
      installing: true,
      active: null,
      waiting: null,
    });

    renderWithTheme(<PWAFeaturesDemo />);

    await waitFor(() => {
      expect(screen.getByText("installing")).toBeInTheDocument();
    });
  });

  it("displays notification permission status", () => {
    mockWindow.Notification.permission = "granted";

    renderWithTheme(<PWAFeaturesDemo />);

    expect(screen.getByText("granted")).toBeInTheDocument();
  });

  it("shows notification blocked warning when denied", () => {
    mockWindow.Notification.permission = "denied";

    renderWithTheme(<PWAFeaturesDemo />);

    expect(
      screen.getByText(
        "Notifications are blocked. Enable them in browser settings."
      )
    ).toBeInTheDocument();
  });

  it("displays online status correctly", () => {
    mockNavigator.onLine = true;

    renderWithTheme(<PWAFeaturesDemo />);

    const onlineChips = screen.getAllByText("Online");
    expect(onlineChips.length).toBeGreaterThan(0);
  });

  it("displays offline status correctly", () => {
    mockNavigator.onLine = false;

    renderWithTheme(<PWAFeaturesDemo />);

    const offlineChips = screen.getAllByText("Offline");
    expect(offlineChips.length).toBeGreaterThan(0);
  });

  it("shows cache size information", async () => {
    mockNavigator.storage.estimate.mockResolvedValue({
      usage: 1024 * 1024, // 1MB
    });

    renderWithTheme(<PWAFeaturesDemo />);

    await waitFor(() => {
      expect(screen.getByText("1 MB")).toBeInTheDocument();
    });
  });

  it("handles install button click", () => {
    const mockInstallPrompt = {
      prompt: jest.fn().mockResolvedValue({ outcome: "accepted" }),
    };

    renderWithTheme(<PWAFeaturesDemo />);

    // Simulate beforeinstallprompt event
    const beforeInstallPromptEvent = new Event("beforeinstallprompt");
    Object.defineProperty(beforeInstallPromptEvent, "prompt", {
      value: mockInstallPrompt.prompt,
    });

    fireEvent(window, beforeInstallPromptEvent);

    const installButton = screen.getByText("Install App");
    expect(installButton).not.toBeDisabled();
  });

  it("opens install dialog when install button is clicked", () => {
    renderWithTheme(<PWAFeaturesDemo />);

    // First trigger the beforeinstallprompt event to enable the button
    const beforeInstallPromptEvent = new Event("beforeinstallprompt");
    Object.defineProperty(beforeInstallPromptEvent, "preventDefault", {
      value: jest.fn(),
    });
    fireEvent(window, beforeInstallPromptEvent);

    const installButton = screen.getByText("Install App");
    fireEvent.click(installButton);

    expect(screen.getByText("Install PWA Showcase")).toBeInTheDocument();
  });

  it("opens notification dialog when enable notifications button is clicked", () => {
    mockWindow.Notification.permission = "default";

    renderWithTheme(<PWAFeaturesDemo />);

    const enableButton = screen.getByText("Enable Notifications");
    fireEvent.click(enableButton);

    expect(screen.getByText("Enable Notifications")).toBeInTheDocument();
  });

  it("handles notification permission request", async () => {
    mockWindow.Notification.requestPermission.mockResolvedValue("granted");

    renderWithTheme(<PWAFeaturesDemo />);

    const enableButton = screen.getByText("Enable Notifications");
    fireEvent.click(enableButton);

    const allowButton = screen.getByRole("button", { name: "Allow" });
    fireEvent.click(allowButton);

    await waitFor(() => {
      expect(mockWindow.Notification.requestPermission).toHaveBeenCalled();
    });
  });

  it("handles service worker update", async () => {
    const mockRegistration = {
      update: jest.fn().mockResolvedValue(undefined),
    };

    mockNavigator.serviceWorker.getRegistration.mockResolvedValue(
      mockRegistration
    );

    renderWithTheme(<PWAFeaturesDemo />);

    await waitFor(() => {
      const updateButton = screen.getByText("Update");
      fireEvent.click(updateButton);
    });

    await waitFor(() => {
      expect(mockRegistration.update).toHaveBeenCalled();
    });
  });

  it("handles cache clearing", async () => {
    mockWindow.caches.keys.mockResolvedValue(["cache1", "cache2"]);
    mockWindow.caches.delete.mockResolvedValue(true);

    // Mock window.alert
    window.alert = jest.fn();

    renderWithTheme(<PWAFeaturesDemo />);

    const clearButton = screen.getByText("Clear Cache");
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockWindow.caches.keys).toHaveBeenCalled();
      expect(mockWindow.caches.delete).toHaveBeenCalledWith("cache1");
      expect(mockWindow.caches.delete).toHaveBeenCalledWith("cache2");
      expect(window.alert).toHaveBeenCalledWith("Cache cleared successfully!");
    });
  });

  it("handles cache details viewing", async () => {
    const mockCache = {
      keys: jest
        .fn()
        .mockResolvedValue([
          { url: "https://example.com/file1.js" },
          { url: "https://example.com/file2.css" },
        ]),
    };

    mockWindow.caches.keys.mockResolvedValue(["workbox-precache"]);
    mockWindow.caches.open.mockResolvedValue(mockCache);

    renderWithTheme(<PWAFeaturesDemo />);

    const viewDetailsButton = screen.getByText("View Details");
    fireEvent.click(viewDetailsButton);

    await waitFor(() => {
      expect(mockWindow.caches.keys).toHaveBeenCalled();
      expect(mockWindow.caches.open).toHaveBeenCalledWith("workbox-precache");
      expect(screen.getByText("workbox-precache: 2 items")).toBeInTheDocument();
    });
  });

  it("shows error when notifications are not supported", () => {
    // Remove Notification from window
    delete (window as Record<string, unknown>).Notification;

    renderWithTheme(<PWAFeaturesDemo />);

    expect(
      screen.getByText("This browser does not support notifications.")
    ).toBeInTheDocument();
  });

  it("disables install button when app is already installed", () => {
    mockWindow.matchMedia.mockImplementation(() => ({
      matches: true, // App is installed
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }));

    renderWithTheme(<PWAFeaturesDemo />);

    const installButton = screen.getByText("Install App");
    expect(installButton).toBeDisabled();
  });

  it("shows offline alert when offline", () => {
    mockNavigator.onLine = false;

    renderWithTheme(<PWAFeaturesDemo />);

    expect(
      screen.getByText(
        "You're currently offline! The app is running from cached content."
      )
    ).toBeInTheDocument();
  });

  it("formats bytes correctly", async () => {
    mockNavigator.storage.estimate.mockResolvedValue({
      usage: 1536, // 1.5 KB
    });

    renderWithTheme(<PWAFeaturesDemo />);

    await waitFor(() => {
      expect(screen.getByText("1.5 KB")).toBeInTheDocument();
    });
  });

  it("handles storage estimate error gracefully", async () => {
    mockNavigator.storage.estimate.mockRejectedValue(
      new Error("Storage not available")
    );

    renderWithTheme(<PWAFeaturesDemo />);

    // Should not crash and should show 0 Bytes
    await waitFor(() => {
      expect(screen.getByText("0 Bytes")).toBeInTheDocument();
    });
  });

  it("handles cache clearing error gracefully", async () => {
    mockWindow.caches.keys.mockRejectedValue(new Error("Cache not available"));

    // Mock window.alert
    window.alert = jest.fn();

    renderWithTheme(<PWAFeaturesDemo />);

    const clearButton = screen.getByText("Clear Cache");
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Failed to clear cache");
    });
  });
});
