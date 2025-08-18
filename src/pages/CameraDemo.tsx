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
import { CameraAlt, ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export const CameraDemo: React.FC = () => {
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
          Camera Demo
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 4 }}>
        This demo will be implemented in a future task. It will showcase camera
        access, photo capture, and video recording capabilities.
      </Alert>

      <Card>
        <CardContent sx={{ textAlign: "center", py: 6 }}>
          <CameraAlt sx={{ fontSize: 80, color: "primary.main", mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Camera Access Demo
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            This demo will demonstrate:
          </Typography>
          <Box
            component="ul"
            sx={{ textAlign: "left", maxWidth: 400, mx: "auto" }}
          >
            <li>Live camera preview</li>
            <li>Photo capture functionality</li>
            <li>Video recording</li>
            <li>Camera permission handling</li>
            <li>Front/back camera switching</li>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CameraDemo;
