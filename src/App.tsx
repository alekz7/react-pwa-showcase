import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Stack,
} from "@mui/material";
import { ThemeProvider } from "./theme/ThemeProvider";

function App() {
  const [count, setCount] = React.useState(0);

  return (
    <ThemeProvider>
      <Router basename="/react-pwa-showcase">
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Box textAlign="center" mb={4}>
            <Typography variant="h2" component="h1" gutterBottom>
              React PWA Showcase
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Demonstrating Modern Web Capabilities
            </Typography>
          </Box>

          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Setup Complete! 🎉
              </Typography>
              <Typography variant="body1" paragraph>
                Your React PWA project is now configured with:
              </Typography>
              <Stack spacing={1} sx={{ mb: 3 }}>
                <Typography variant="body2">
                  ✅ Material-UI (MUI) v5 with custom theme
                </Typography>
                <Typography variant="body2">
                  ✅ React Router v6 for navigation
                </Typography>
                <Typography variant="body2">✅ TypeScript support</Typography>
                <Typography variant="body2">
                  ✅ GitHub Pages deployment ready
                </Typography>
              </Stack>
              <Box textAlign="center">
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => setCount((count) => count + 1)}
                  sx={{ mr: 2 }}
                >
                  Count: {count}
                </Button>
                <Button variant="outlined" size="large">
                  Ready for Next Task
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Typography variant="body2" color="text.secondary" textAlign="center">
            Next: Implement basic app structure and routing
          </Typography>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App;
