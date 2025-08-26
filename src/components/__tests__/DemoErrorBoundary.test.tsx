import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import DemoErrorBoundary from "../DemoErrorBoundary";

// Mock component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Demo test error");
  }
  return <div>Demo working</div>;
};

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

// Mock window.location.reload
Object.defineProperty(window, "location", {
  value: {
    reload: jest.fn(),
  },
  writable: true,
});

describe("DemoErrorBoundary", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    (window.location.reload as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders children when there is no error", () => {
    renderWithTheme(
      <DemoErrorBoundary demoName="Test Demo">
        <ThrowError shouldThrow={false} />
      </DemoErrorBoundary>
    );

    expect(screen.getByText("Demo working")).toBeInTheDocument();
  });

  it("renders demo-specific error UI when child component throws", () => {
    renderWithTheme(
      <DemoErrorBoundary demoName="Test Demo">
        <ThrowError shouldThrow={true} />
      </DemoErrorBoundary>
    );

    expect(screen.getByText("Demo Error")).toBeInTheDocument();
    expect(
      screen.getByText(/The Test Demo demo encountered an error/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Demo test error/)).toBeInTheDocument();
  });

  it("displays custom fallback message when provided", () => {
    const customMessage = "Custom demo error message";

    renderWithTheme(
      <DemoErrorBoundary demoName="Test Demo" fallbackMessage={customMessage}>
        <ThrowError shouldThrow={true} />
      </DemoErrorBoundary>
    );

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it("shows common error causes and solutions", () => {
    renderWithTheme(
      <DemoErrorBoundary demoName="Test Demo">
        <ThrowError shouldThrow={true} />
      </DemoErrorBoundary>
    );

    expect(screen.getByText("This might happen due to:")).toBeInTheDocument();
    expect(
      screen.getByText(/Browser compatibility issues/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Missing device permissions/)).toBeInTheDocument();
    expect(
      screen.getByText(/Network connectivity problems/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Unsupported device features/)).toBeInTheDocument();
  });

  it("shows Retry Demo and Refresh Page buttons", () => {
    renderWithTheme(
      <DemoErrorBoundary demoName="Test Demo">
        <ThrowError shouldThrow={true} />
      </DemoErrorBoundary>
    );

    expect(
      screen.getByRole("button", { name: /retry demo/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /refresh page/i })
    ).toBeInTheDocument();
  });

  it("resets error state when Retry Demo is clicked", () => {
    const { rerender } = renderWithTheme(
      <DemoErrorBoundary demoName="Test Demo">
        <ThrowError shouldThrow={true} />
      </DemoErrorBoundary>
    );

    expect(screen.getByText("Demo Error")).toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: /retry demo/i });
    fireEvent.click(retryButton);

    // Re-render with no error
    rerender(
      <ThemeProvider theme={theme}>
        <DemoErrorBoundary demoName="Test Demo">
          <ThrowError shouldThrow={false} />
        </DemoErrorBoundary>
      </ThemeProvider>
    );

    expect(screen.getByText("Demo working")).toBeInTheDocument();
  });

  it("reloads page when Refresh Page is clicked", () => {
    renderWithTheme(
      <DemoErrorBoundary demoName="Test Demo">
        <ThrowError shouldThrow={true} />
      </DemoErrorBoundary>
    );

    const refreshButton = screen.getByRole("button", { name: /refresh page/i });
    fireEvent.click(refreshButton);

    expect(window.location.reload).toHaveBeenCalled();
  });

  it("calls custom error handler when provided", () => {
    const mockErrorHandler = jest.fn();

    renderWithTheme(
      <DemoErrorBoundary demoName="Test Demo" onError={mockErrorHandler}>
        <ThrowError shouldThrow={true} />
      </DemoErrorBoundary>
    );

    expect(mockErrorHandler).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it("shows developer information in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    renderWithTheme(
      <DemoErrorBoundary demoName="Test Demo">
        <ThrowError shouldThrow={true} />
      </DemoErrorBoundary>
    );

    expect(screen.getByText("Developer Information")).toBeInTheDocument();

    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });

  it("toggles developer details when expand button is clicked", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    renderWithTheme(
      <DemoErrorBoundary demoName="Test Demo">
        <ThrowError shouldThrow={true} />
      </DemoErrorBoundary>
    );

    const expandButton = screen.getByRole("button", { name: "" }); // Icon button
    fireEvent.click(expandButton);

    // Check if error stack is visible
    expect(screen.getByText(/Demo test error/)).toBeInTheDocument();

    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });

  it("logs error with demo context", () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    renderWithTheme(
      <DemoErrorBoundary demoName="Test Demo">
        <ThrowError shouldThrow={true} />
      </DemoErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error in Test Demo demo:",
      expect.any(Error),
      expect.any(Object)
    );
  });
});
