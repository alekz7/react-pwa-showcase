import React from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
} from "@mui/material";
import { Mic, ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export const MicrophoneDemo: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" mb={4}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/")}
          sx={{ mr: 2 }}
        >
          Back to Home
        </Button>
        <Typography variant="h4" component="h1">
          Microphone Demo
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 4 }}>
        This demo will be implemented in a future task. It will showcase
        microphone access, audio recording, and real-time audio analysis.
      </Alert>

      <Card>
        <CardContent sx={{ textAlign: "center", py: 6 }}>
          <Mic sx={{ fontSize: 80, color: "primary.main", mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Microphone Access Demo
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            This demo will demonstrate:
          </Typography>
          <Box
            component="ul"
            sx={{ textAlign: "left", maxWidth: 400, mx: "auto" }}
          >
            <li>Real-time audio level visualization</li>
            <li>Audio recording functionality</li>
            <li>Playback controls</li>
            <li>Frequency spectrum analysis</li>
            <li>Voice activity detection</li>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default MicrophoneDemo;
