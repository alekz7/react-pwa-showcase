import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";
import { lazy, Suspense } from "react";
import { ThemeProvider } from "./theme/ThemeProvider";
import { AppProvider, DeviceProvider, SocketProvider } from "./context";
import { Header } from "./components/Header";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { ServiceWorkerStatus } from "./components/ServiceWorkerStatus";
import { OfflineIndicator } from "./components/OfflineIndicator";
import ErrorBoundary from "./components/ErrorBoundary";
import DemoErrorBoundary from "./components/DemoErrorBoundary";
import LoadingFallback from "./components/LoadingFallback";
import AccessibilityNavigation from "./components/AccessibilityNavigation";

// Lazy load page components for better performance
const Home = lazy(() => import("./pages/Home"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy load demo components to reduce initial bundle size
const CameraDemo = lazy(() => import("./pages/CameraDemo"));
const MicrophoneDemo = lazy(() => import("./pages/MicrophoneDemo"));
const FileSystemDemo = lazy(() => import("./pages/FileSystemDemo"));
const MotionSensorsDemo = lazy(() => import("./pages/MotionSensorsDemo"));
const LocationDemo = lazy(() => import("./pages/LocationDemo"));
const RealtimeDemo = lazy(() => import("./components/demos/RealtimeDemo"));
const PWAFeaturesDemo = lazy(
  () => import("./components/demos/PWAFeaturesDemo")
);

function App() {
  return (
    <ErrorBoundary>
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
                  {/* Accessibility Navigation and Skip Links */}
                  <AccessibilityNavigation
                    mainContentId="main-content"
                    navigationId="main-navigation"
                  />

                  <Header />
                  <Box
                    component="main"
                    id="main-content"
                    tabIndex={-1}
                    sx={{
                      flexGrow: 1,
                      outline: "none", // Remove focus outline for main content
                    }}
                  >
                    <Suspense fallback={<LoadingFallback />}>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route
                          path="/camera"
                          element={
                            <DemoErrorBoundary demoName="Camera">
                              <Suspense
                                fallback={<LoadingFallback demoName="Camera" />}
                              >
                                <CameraDemo />
                              </Suspense>
                            </DemoErrorBoundary>
                          }
                        />
                        <Route
                          path="/microphone"
                          element={
                            <DemoErrorBoundary demoName="Microphone">
                              <Suspense
                                fallback={
                                  <LoadingFallback demoName="Microphone" />
                                }
                              >
                                <MicrophoneDemo />
                              </Suspense>
                            </DemoErrorBoundary>
                          }
                        />
                        <Route
                          path="/files"
                          element={
                            <DemoErrorBoundary demoName="File System">
                              <Suspense
                                fallback={
                                  <LoadingFallback demoName="File System" />
                                }
                              >
                                <FileSystemDemo />
                              </Suspense>
                            </DemoErrorBoundary>
                          }
                        />
                        <Route
                          path="/motion"
                          element={
                            <DemoErrorBoundary demoName="Motion Sensors">
                              <Suspense
                                fallback={
                                  <LoadingFallback demoName="Motion Sensors" />
                                }
                              >
                                <MotionSensorsDemo />
                              </Suspense>
                            </DemoErrorBoundary>
                          }
                        />
                        <Route
                          path="/location"
                          element={
                            <DemoErrorBoundary demoName="Location">
                              <Suspense
                                fallback={
                                  <LoadingFallback demoName="Location" />
                                }
                              >
                                <LocationDemo />
                              </Suspense>
                            </DemoErrorBoundary>
                          }
                        />
                        <Route
                          path="/realtime"
                          element={
                            <DemoErrorBoundary demoName="Real-time Communication">
                              <Suspense
                                fallback={
                                  <LoadingFallback demoName="Real-time Communication" />
                                }
                              >
                                <RealtimeDemo />
                              </Suspense>
                            </DemoErrorBoundary>
                          }
                        />
                        <Route
                          path="/pwa"
                          element={
                            <DemoErrorBoundary demoName="PWA Features">
                              <Suspense
                                fallback={
                                  <LoadingFallback demoName="PWA Features" />
                                }
                              >
                                <PWAFeaturesDemo />
                              </Suspense>
                            </DemoErrorBoundary>
                          }
                        />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </Box>

                  {/* PWA Components */}
                  <PWAInstallPrompt />
                  <ServiceWorkerStatus />
                  <OfflineIndicator showPersistent />
                </Box>
              </Router>
            </ThemeProvider>
          </SocketProvider>
        </DeviceProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
