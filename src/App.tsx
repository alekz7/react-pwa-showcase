import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";
import { ThemeProvider } from "./theme/ThemeProvider";
import { AppProvider, DeviceProvider, SocketProvider } from "./context";
import { Header } from "./components/Header";
import {
  Home,
  CameraDemo,
  MicrophoneDemo,
  FileSystemDemo,
  MotionSensorsDemo,
  LocationDemo,
  RealtimeDemo,
  PWAFeaturesDemo,
  NotFound,
} from "./pages";

function App() {
  return (
    <AppProvider>
      <DeviceProvider>
        <SocketProvider>
          <ThemeProvider>
            <Router basename="/react-pwa-showcase">
              <Box
                sx={{
                  minHeight: "100vh",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Header />
                <Box component="main" sx={{ flexGrow: 1 }}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/camera" element={<CameraDemo />} />
                    <Route path="/microphone" element={<MicrophoneDemo />} />
                    <Route path="/files" element={<FileSystemDemo />} />
                    <Route path="/motion" element={<MotionSensorsDemo />} />
                    <Route path="/location" element={<LocationDemo />} />
                    <Route path="/realtime" element={<RealtimeDemo />} />
                    <Route path="/pwa" element={<PWAFeaturesDemo />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Box>
              </Box>
            </Router>
          </ThemeProvider>
        </SocketProvider>
      </DeviceProvider>
    </AppProvider>
  );
}

export default App;
