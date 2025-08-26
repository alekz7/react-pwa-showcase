import React from "react";
import { Container, Box, Button } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import CameraDemo from "../components/demos/CameraDemo";

export const CameraDemoPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/")}
          sx={{ mr: 2 }}
        >
          Back to Home
        </Button>
      </Box>
      <CameraDemo />
    </Container>
  );
};

export default CameraDemoPage;
