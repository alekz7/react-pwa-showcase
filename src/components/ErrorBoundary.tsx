import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Alert,
  Collapse,
  IconButton,
} from "@mui/material";
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Home as HomeIcon,
} from "@mui/icons-material";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
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

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to log to an error reporting service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  handleGoHome = () => {
    window.location.href = "/react-pwa-showcase/";
  };

  toggleDetails = () => {
    this.setState((prevState) => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
            p: 3,
          }}
        >
          <Card sx={{ maxWidth: 600, width: "100%" }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <ErrorIcon color="error" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Oops! Something went wrong
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    We encountered an unexpected error. Don't worry, this
                    happens sometimes!
                  </Typography>
                </Box>
              </Box>

              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Error:</strong>{" "}
                  {this.state.error?.message || "Unknown error occurred"}
                </Typography>
              </Alert>

              <Typography variant="body2" color="text.secondary" paragraph>
                Here are some things you can try:
              </Typography>

              <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                  Refresh the page to try again
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                  Go back to the home page
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                  Check your internet connection
                </Typography>
                <Typography component="li" variant="body2">
                  Try a different browser if the problem persists
                </Typography>
              </Box>

              {import.meta.env.DEV && this.state.errorInfo && (
                <>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Developer Details
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
                          fontSize: "0.75rem",
                          fontFamily: "monospace",
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
            </CardContent>

            <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={this.handleGoHome}
              >
                Go Home
              </Button>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleRetry}
              >
                Try Again
              </Button>
            </CardActions>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
