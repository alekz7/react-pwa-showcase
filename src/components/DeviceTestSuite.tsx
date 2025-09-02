import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import {
  DeviceTestRunner,
  type TestSuite,
  type DeviceTestResult,
  getDeviceCapabilities,
} from "../utils/deviceTesting";

interface DeviceTestSuiteProps {
  onTestComplete?: (results: TestSuite) => void;
}

const DeviceTestSuite: React.FC<DeviceTestSuiteProps> = ({
  onTestComplete,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [testResults, setTestResults] = useState<TestSuite | null>(null);

  const [capabilities] = useState(getDeviceCapabilities());

  const runTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setCurrentTest("Initializing...");

    const testRunner = new DeviceTestRunner();
    const tests = [
      { name: "Camera", fn: () => testRunner.testCamera() },
      { name: "Microphone", fn: () => testRunner.testMicrophone() },
      { name: "Geolocation", fn: () => testRunner.testGeolocation() },
      { name: "Motion Sensors", fn: () => testRunner.testMotionSensors() },
      { name: "File System", fn: () => testRunner.testFileSystem() },
      { name: "PWA Features", fn: () => testRunner.testPWA() },
      {
        name: "Network & Offline",
        fn: () => testRunner.testNetworkAndOffline(),
      },
      { name: "Performance", fn: () => testRunner.testPerformance() },
    ];

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      setCurrentTest(`Testing ${test.name}...`);
      setProgress(((i + 1) / tests.length) * 100);

      try {
        await test.fn();
        await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay for UX
      } catch (error) {
        console.error(`Test failed: ${test.name}`, error);
      }
    }

    const results = await testRunner.runAllTests();
    testRunner.saveResults(results);

    setTestResults(results);
    setIsRunning(false);
    setCurrentTest("");
    setProgress(0);

    if (onTestComplete) {
      onTestComplete(results);
    }
  };

  const downloadReport = () => {
    if (!testResults) return;

    const testRunner = new DeviceTestRunner();
    const report = testRunner.generateReport(testResults);

    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `device-test-report-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareResults = async () => {
    if (!testResults || !navigator.share) return;

    try {
      await navigator.share({
        title: "PWA Device Test Results",
        text: `Device compatibility score: ${testResults.overallScore}% on ${testResults.browser.name}`,
        url: window.location.href,
      });
    } catch (error) {
      console.log("Share failed:", error);
    }
  };

  const getStatusIcon = (result: DeviceTestResult) => {
    if (result.supported) {
      return <CheckIcon color="success" />;
    } else if (result.error) {
      return <ErrorIcon color="error" />;
    } else {
      return <WarningIcon color="warning" />;
    }
  };

  const getStatusColor = (supported: boolean) => {
    return supported ? "success" : "error";
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 2 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Device Compatibility Test Suite
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Comprehensive testing of PWA capabilities across your device and
            browser. This test suite will check camera, microphone, location,
            sensors, and other modern web features.
          </Typography>

          {/* Quick Capabilities Overview */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Capability Check
            </Typography>
            <Grid container spacing={1}>
              {Object.entries(capabilities).map(([key, supported]) => (
                <Grid key={key}>
                  <Chip
                    label={key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                    color={getStatusColor(supported)}
                    size="small"
                    icon={supported ? <CheckIcon /> : <ErrorIcon />}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Test Controls */}
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={runTests}
              disabled={isRunning}
              size="large"
            >
              {isRunning ? "Running Tests..." : "Run Full Test Suite"}
            </Button>

            {testResults && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={downloadReport}
                >
                  Download Report
                </Button>

                {"share" in navigator && (
                  <Button
                    variant="outlined"
                    startIcon={<ShareIcon />}
                    onClick={shareResults}
                  >
                    Share Results
                  </Button>
                )}

                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => setTestResults(null)}
                >
                  Clear Results
                </Button>
              </>
            )}
          </Box>

          {/* Progress Indicator */}
          {isRunning && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                {currentTest}
              </Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          )}

          {/* Test Results */}
          {testResults && (
            <Box>
              <Alert
                severity={
                  testResults.overallScore >= 80
                    ? "success"
                    : testResults.overallScore >= 60
                      ? "warning"
                      : "error"
                }
                sx={{ mb: 2 }}
              >
                <Typography variant="h6">
                  Overall Compatibility Score: {testResults.overallScore}%
                </Typography>
                <Typography variant="body2">
                  {testResults.browser.name} {testResults.browser.version} on{" "}
                  {testResults.browser.platform}
                  {testResults.browser.mobile && " (Mobile)"}
                  {testResults.browser.pwa && " (PWA Mode)"}
                </Typography>
              </Alert>

              {/* Detailed Results */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Detailed Test Results</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Feature</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Performance</TableCell>
                          <TableCell>Notes</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {testResults.results.map((result, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                {getStatusIcon(result)}
                                {result.feature}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  result.supported
                                    ? "Supported"
                                    : "Not Supported"
                                }
                                color={getStatusColor(result.supported)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {result.performance
                                ? `${result.performance.toFixed(2)}ms`
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {result.notes ||
                                  result.error ||
                                  "No additional information"}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>

              {/* Browser Information */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Browser Information</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid xs={12} sm={6}>
                      <Typography variant="subtitle2">Browser</Typography>
                      <Typography variant="body2">
                        {testResults.browser.name} {testResults.browser.version}
                      </Typography>
                    </Grid>
                    <Grid xs={12} sm={6}>
                      <Typography variant="subtitle2">Platform</Typography>
                      <Typography variant="body2">
                        {testResults.browser.platform}
                      </Typography>
                    </Grid>
                    <Grid xs={12} sm={6}>
                      <Typography variant="subtitle2">Device Type</Typography>
                      <Typography variant="body2">
                        {testResults.browser.mobile ? "Mobile" : "Desktop"}
                      </Typography>
                    </Grid>
                    <Grid xs={12} sm={6}>
                      <Typography variant="subtitle2">PWA Mode</Typography>
                      <Typography variant="body2">
                        {testResults.browser.pwa ? "Yes" : "No"}
                      </Typography>
                    </Grid>
                    <Grid xs={12}>
                      <Typography variant="subtitle2">Test Date</Typography>
                      <Typography variant="body2">
                        {new Date(testResults.timestamp).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Recommendations */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Recommendations</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    {testResults.overallScore < 100 && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Improve Compatibility
                        </Typography>
                        <Typography variant="body2">
                          Some features are not supported on your current
                          browser/device. Consider testing on different browsers
                          or updating to the latest version.
                        </Typography>
                      </Alert>
                    )}

                    {!testResults.browser.pwa && (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Install as PWA
                        </Typography>
                        <Typography variant="body2">
                          For the best experience, install this app as a PWA.
                          Look for the install prompt or use your browser's
                          install option.
                        </Typography>
                      </Alert>
                    )}

                    {testResults.browser.mobile && (
                      <Alert severity="info">
                        <Typography variant="subtitle2" gutterBottom>
                          Mobile Testing
                        </Typography>
                        <Typography variant="body2">
                          You're testing on a mobile device. Some features may
                          require user interaction or specific permissions. Try
                          testing individual demos for full functionality.
                        </Typography>
                      </Alert>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DeviceTestSuite;
