import React from "react";
import {
  Box,
  CircularProgress,
  Typography,
  LinearProgress,
  Fade,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const LoadingContainer = styled(Box)(({ theme }) => ({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: `linear-gradient(135deg, ${theme.palette.primary.main}10 0%, ${theme.palette.secondary.main}10 100%)`,
  backdropFilter: "blur(10px)",
  zIndex: 9999,
}));

const LogoContainer = styled(Box)({
  animation: `${pulse} 2s ease-in-out infinite`,
  marginBottom: "2rem",
});

const ProgressContainer = styled(Box)({
  width: "300px",
  maxWidth: "80vw",
  marginTop: "2rem",
});

interface ProductionLoadingScreenProps {
  message?: string;
  progress?: number;
  showProgress?: boolean;
}

const ProductionLoadingScreen: React.FC<ProductionLoadingScreenProps> = ({
  message = "Loading PWA Showcase...",
  progress,
  showProgress = false,
}) => {
  return (
    <Fade in timeout={300}>
      <LoadingContainer>
        <LogoContainer>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: (theme) =>
                `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: (theme) => theme.shadows[8],
            }}
          >
            <Typography
              variant="h4"
              sx={{
                color: "white",
                fontWeight: "bold",
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              PWA
            </Typography>
          </Box>
        </LogoContainer>

        <CircularProgress
          size={60}
          thickness={4}
          sx={{
            color: (theme) => theme.palette.primary.main,
            marginBottom: 3,
          }}
        />

        <Typography
          variant="h6"
          sx={{
            color: (theme) => theme.palette.text.primary,
            textAlign: "center",
            fontWeight: 500,
            marginBottom: 1,
          }}
        >
          {message}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: (theme) => theme.palette.text.secondary,
            textAlign: "center",
            maxWidth: "400px",
            lineHeight: 1.6,
          }}
        >
          Initializing device capabilities and performance monitoring...
        </Typography>

        {showProgress && (
          <ProgressContainer>
            <LinearProgress
              variant={progress !== undefined ? "determinate" : "indeterminate"}
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: (theme) => theme.palette.grey[200],
                "& .MuiLinearProgress-bar": {
                  borderRadius: 4,
                  background: (theme) =>
                    `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                },
              }}
            />
            {progress !== undefined && (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  textAlign: "center",
                  marginTop: 1,
                  color: (theme) => theme.palette.text.secondary,
                }}
              >
                {Math.round(progress)}%
              </Typography>
            )}
          </ProgressContainer>
        )}

        <Box
          sx={{
            position: "absolute",
            bottom: 32,
            textAlign: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: (theme) => theme.palette.text.secondary,
              opacity: 0.7,
            }}
          >
            React PWA Showcase v{import.meta.env.VITE_APP_VERSION || "1.0.0"}
          </Typography>
        </Box>
      </LoadingContainer>
    </Fade>
  );
};

export default ProductionLoadingScreen;
