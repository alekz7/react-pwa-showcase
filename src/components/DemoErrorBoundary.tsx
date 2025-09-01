import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Collapse,
  IconButton,
} from "@mui/material";
import {
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  BugReport as BugIcon,
} from "@mui/icons-material";

interface Props {
  children: ReactNode;
  demoName: string;
  fallbackMessage?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

class DemoErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error with demo context
    console.error(`Error in ${this.props.demoName} demo:`, error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  toggleDetails = () => {
    this.setState((prevState) => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render() {
    if (this.state.hasError) {
      const errorMessage =
        this.state.error?.message || "An unexpected error occurred";
      const fallbackMessage =
        this.props.fallbackMessage ||
        `The ${this.props.demoName} demo encountered an error and couldn't load properly.`;

      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
            <AlertTitle>Demo Error</AlertTitle>
            {fallbackMessage}
          </Alert>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Error Details:</strong> {errorMessage}
            </Typography>

            <Typography variant="body2" color="text.secondary" paragraph>
              This might happen due to:
            </Typography>

            <Box component="ul" sx={{ pl: 2, mb: 2 }}>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                Browser compatibility issues
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                Missing device permissions
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                Network connectivity problems
              </Typography>
              <Typography component="li" variant="body2">
                Unsupported device features
              </Typography>
            </Box>
          </Box>

          {import.meta.env.DEV && this.state.errorInfo && (
            <>
              <Box display="flex" alignItems="center" mb={1}>
                <BugIcon sx={{ mr: 1, fontSize: 16 }} color="action" />
                <Typography variant="body2" color="text.secondary">
                  Developer Information
                </Typography>
                <IconButton
                  size="small"
                  onClick={this.toggleDetails}
                  sx={{ ml: 1 }}
                >
                  {this.state.showDetails ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                </IconButton>
              </Box>

              <Collapse in={this.state.showDetails}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{
                      whiteSpace: "pre-wrap",
                      fontSize: "0.7rem",
                      fontFamily: "monospace",
                      maxHeight: 200,
                      overflow: "auto",
                    }}
                  >
                    {this.state.error?.stack}
                    {"\n\nComponent Stack:"}
                    {this.state.errorInfo.componentStack}
                  </Typography>
                </Alert>
              </Collapse>
            </>
          )}

          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleRetry}
              size="small"
            >
              Retry Demo
            </Button>
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
              size="small"
            >
              Refresh Page
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default DemoErrorBoundary;
