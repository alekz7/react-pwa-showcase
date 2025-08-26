import React from "react";
import {
  Box,
  Container,
  CircularProgress,
  Typography,
  Skeleton,
  Card,
  CardContent,
  LinearProgress,
} from "@mui/material";
import { Code as CodeIcon } from "@mui/icons-material";

interface LoadingFallbackProps {
  demoName?: string;
  variant?: "page" | "demo" | "minimal";
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  demoName,
  variant = "demo",
}) => {
  if (variant === "minimal") {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (variant === "page") {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="60vh"
          textAlign="center"
        >
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h5" gutterBottom>
            Loading Application...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we prepare your PWA showcase experience
          </Typography>
        </Box>
      </Container>
    );
  }

  // Demo variant (default)
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Skeleton */}
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Skeleton
          variant="text"
          width="60%"
          height={60}
          sx={{ mx: "auto", mb: 2 }}
        />
        <Skeleton variant="text" width="80%" height={30} sx={{ mx: "auto" }} />
      </Box>

      {/* Loading Progress */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <CodeIcon sx={{ mr: 2, color: "primary.main" }} />
            <Typography variant="h6">
              {demoName ? `Loading ${demoName} Demo...` : "Loading Demo..."}
            </Typography>
          </Box>

          <LinearProgress sx={{ mb: 2 }} />

          <Typography variant="body2" color="text.secondary">
            Preparing interactive components and device API integrations
          </Typography>
        </CardContent>
      </Card>

      {/* Content Skeleton */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, 1fr)",
          },
          gap: 3,
        }}
      >
        {/* Demo Controls Skeleton */}
        <Card>
          <CardContent>
            <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
            <Skeleton
              variant="rectangular"
              width="100%"
              height={200}
              sx={{ mb: 2 }}
            />
            <Box display="flex" gap={1}>
              <Skeleton variant="rectangular" width={100} height={36} />
              <Skeleton variant="rectangular" width={100} height={36} />
            </Box>
          </CardContent>
        </Card>

        {/* Demo Output Skeleton */}
        <Card>
          <CardContent>
            <Skeleton variant="text" width="50%" height={40} sx={{ mb: 2 }} />
            <Skeleton
              variant="rectangular"
              width="100%"
              height={150}
              sx={{ mb: 2 }}
            />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="60%" />
          </CardContent>
        </Card>

        {/* Additional Info Skeleton */}
        <Card sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
          <CardContent>
            <Skeleton variant="text" width="30%" height={40} sx={{ mb: 2 }} />
            <Box display="flex" flexDirection="column" gap={1}>
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="text" width="95%" />
              <Skeleton variant="text" width="85%" />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Loading Indicator */}
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        mt={4}
        p={2}
      >
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Initializing {demoName || "demo"} components...
        </Typography>
      </Box>
    </Container>
  );
};

export default LoadingFallback;
