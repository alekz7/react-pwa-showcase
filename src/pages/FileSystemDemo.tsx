import React from "react";
import { Container, Box, Button } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import FileExplorerDemo from "../components/demos/FileExplorerDemo";

export const FileSystemDemoPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/")}
          sx={{ mb: 2 }}
        >
          Back to Home
        </Button>
      </Box>
      <FileExplorerDemo />
    </Container>
  );
};

export default FileSystemDemoPage;
