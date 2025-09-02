import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  Tab,
  Tabs,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";
import { Grid } from "@mui/material";
import {
  Devices as DevicesIcon,
  PlayArrow as RunIcon,
  Stop as StopIcon,
  GetApp as DownloadIcon,
  Share as ShareIcon,
  History as HistoryIcon,
  Assessment as ReportIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Accessibility as AccessibilityIcon,
  Camera as CameraIcon,
  Mic as MicIcon,
  LocationOn as LocationIcon,
  Sensors as SensorsIcon,
  Folder as FileIcon,
  Notifications as NotificationIcon,
} from "@mui/icons-material";
import { DeviceTestRunner } from "../utils/deviceTesting";
import type { TestSuite, DeviceTestResult } from "../utils/deviceTesting";
import { PerformanceTester } from "../utils/performanceTesting";
import ComprehensiveTestSuite from "../components/ComprehensiveTestSuite";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`testing-tabpanel-${index}`}
      aria-labelledby={`testing-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CrossDeviceTestingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [testRunner] = useState(() => new DeviceTestRunner());
  const [performanceTester] = useState(() => new PerformanceTester());
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>("");
  const [testResults, setTestResults] = useState<TestSuite[]>([]);
  const [selectedResult, setSelectedResult] = useState<TestSuite | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);

  useEffect(() => {
    // Load saved test results
    const savedResults = DeviceTestRunner.getSavedResults();
    setTestResults(savedResults);
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const runQuickCompatibilityTest = async () => {
    setIsRunning(true);
    setCurrentTest("Starting compatibility test...");

    try {
      const testSuite = await testRunner.runAllTests();
      testRunner.saveResults(testSuite);

      const updatedResults = DeviceTestRunner.getSavedResults();
      setTestResults(updatedResults);
      setSelectedResult(testSuite);
      setShowResultDialog(true);
    } catch (error) {
      console.error("Test failed:", error);
    } finally {
      setIsRunning(false);
      setCurrentTest("");
    }
  };

  const runPerformanceTest = async () => {
    setIsRunning(true);
    setCurrentTest("Running performance tests...");

    try {
      const results = await performanceTester.runComprehensiveTest();
      console.log("Performance test results:", results);

      // Convert performance results to test suite format
      const performanceTestSuite: TestSuite = {
        browser: testRunner.getBrowserInfo(),
        timestamp: new Date().toISOString(),
        results: results.map((result) => ({
          feature: result.name,
          supported: true,
          tested: true,
          performance: result.value,
          notes: result.details,
        })),
        overallScore: 100, // Performance tests don't have a failure state
      };

      testRunner.saveResults(performanceTestSuite);
      const updatedResults = DeviceTestRunner.getSavedResults();
      setTestResults(updatedResults);
      setSelectedResult(performanceTestSuite);
      setShowResultDialog(true);
    } catch (error) {
      console.error("Performance test failed:", error);
    } finally {
      setIsRunning(false);
      setCurrentTest("");
    }
  };

  const exportTestResults = (testSuite: TestSuite) => {
    const report = testRunner.generateReport(testSuite);
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `device-test-report-${testSuite.timestamp}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const shareTestResults = async (testSuite: TestSuite) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "PWA Device Compatibility Test Results",
          text: `Device compatibility score: ${testSuite.overallScore}% on ${testSuite.browser.name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Sharing failed:", error);
      }
    } else {
      // Fallback: copy to clipboard
      const report = testRunner.generateReport(testSuite);
      await navigator.clipboard.writeText(report);
      alert("Test results copied to clipboard!");
    }
  };

  const getFeatureIcon = (feature: string) => {
    const featureLower = feature.toLowerCase();
    if (featureLower.includes("camera")) return <CameraIcon />;
    if (featureLower.includes("microphone") || featureLower.includes("audio"))
      return <MicIcon />;
    if (
      featureLower.includes("location") ||
      featureLower.includes("geolocation")
    )
      return <LocationIcon />;
    if (featureLower.includes("motion") || featureLower.includes("sensor"))
      return <SensorsIcon />;
    if (featureLower.includes("file")) return <FileIcon />;
    if (featureLower.includes("notification")) return <NotificationIcon />;
    if (featureLower.includes("performance")) return <SpeedIcon />;
    if (featureLower.includes("pwa") || featureLower.includes("service"))
      return <SecurityIcon />;
    if (featureLower.includes("accessibility")) return <AccessibilityIcon />;
    return <DevicesIcon />;
  };

  const getStatusColor = (result: DeviceTestResult) => {
    if (!result.tested) return "default";
    if (result.supported) return "success";
    if (result.error) return "error";
    return "warning";
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Cross-Device Testing Suite
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Comprehensive testing of PWA functionality across different devices
          and browsers
        </Typography>

        {/* Test Status */}
        {isRunning && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Box>
              <Typography variant="body2" gutterBottom>
                {currentTest}
              </Typography>
              <LinearProgress variant="indeterminate" />
            </Box>
          </Alert>
        )}

        {/* Quick Actions */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              startIcon={isRunning ? <StopIcon /> : <RunIcon />}
              onClick={runQuickCompatibilityTest}
              disabled={isRunning}
              size="large"
            >
              {isRunning ? "Testing..." : "Quick Test"}
            </Button>
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<SpeedIcon />}
              onClick={runPerformanceTest}
              disabled={isRunning}
              size="large"
            >
              Performance Test
            </Button>
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<HistoryIcon />}
              onClick={() => setActiveTab(1)}
              size="large"
            >
              Test History
            </Button>
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<ReportIcon />}
              onClick={() => setActiveTab(2)}
              size="large"
            >
              Reports
            </Button>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Comprehensive Testing" />
            <Tab label="Test History" />
            <Tab label="Device Reports" />
            <Tab label="Real-time Testing" />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <ComprehensiveTestSuite />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Typography variant="h5" gutterBottom>
            Test History
          </Typography>
          {testResults.length === 0 ? (
            <Alert severity="info">
              No test results available. Run a test to see results here.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Browser</TableCell>
                    <TableCell>Platform</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Tests</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {testResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {new Date(result.timestamp).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {result.browser.name} {result.browser.version}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={result.browser.mobile ? "Mobile" : "Desktop"}
                          size="small"
                          color={result.browser.mobile ? "primary" : "default"}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${result.overallScore}%`}
                          color={
                            result.overallScore >= 80
                              ? "success"
                              : result.overallScore >= 60
                                ? "warning"
                                : "error"
                          }
                        />
                      </TableCell>
                      <TableCell>{result.results.length}</TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            onClick={() => {
                              setSelectedResult(result);
                              setShowResultDialog(true);
                            }}
                          >
                            <ReportIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Export">
                          <IconButton onClick={() => exportTestResults(result)}>
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Share">
                          <IconButton onClick={() => shareTestResults(result)}>
                            <ShareIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Typography variant="h5" gutterBottom>
            Device Compatibility Reports
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Detailed analysis of device capabilities and compatibility across
            different browsers and platforms.
          </Alert>

          {testResults.length > 0 && (
            <Grid container spacing={3}>
              {testResults.slice(0, 6).map((result, index) => (
                <Grid xs={12} md={6} key={index}>
                  <Card>
                    <CardContent>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={2}
                      >
                        <Typography variant="h6">
                          {result.browser.name} {result.browser.version}
                        </Typography>
                        <Chip
                          label={`${result.overallScore}%`}
                          color={
                            result.overallScore >= 80
                              ? "success"
                              : result.overallScore >= 60
                                ? "warning"
                                : "error"
                          }
                        />
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        {new Date(result.timestamp).toLocaleString()}
                      </Typography>

                      <Box mt={2}>
                        <Typography variant="subtitle2" gutterBottom>
                          Feature Support:
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {result.results.slice(0, 5).map((testResult, idx) => (
                            <Chip
                              key={idx}
                              label={testResult.feature}
                              size="small"
                              color={getStatusColor(testResult)}
                              icon={getFeatureIcon(testResult.feature)}
                            />
                          ))}
                          {result.results.length > 5 && (
                            <Chip
                              label={`+${result.results.length - 5} more`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>

                      <Box mt={2}>
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedResult(result);
                            setShowResultDialog(true);
                          }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Typography variant="h5" gutterBottom>
            Real-time Device Testing
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This section allows you to test device capabilities in real-time as
            you interact with the application.
          </Alert>

          <Grid container spacing={3}>
            <Grid xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Live Capability Monitor
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Monitor device capabilities and permissions in real-time.
                  </Typography>
                  <Button variant="outlined" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Monitor
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Real-time performance metrics and optimization suggestions.
                  </Typography>
                  <Button variant="outlined" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Results Dialog */}
        <Dialog
          open={showResultDialog}
          onClose={() => setShowResultDialog(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            Test Results Details
            {selectedResult && (
              <Typography variant="subtitle2" color="text.secondary">
                {selectedResult.browser.name} •{" "}
                {new Date(selectedResult.timestamp).toLocaleString()}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent>
            {selectedResult && (
              <Box>
                <Alert
                  severity={
                    selectedResult.overallScore >= 80
                      ? "success"
                      : selectedResult.overallScore >= 60
                        ? "warning"
                        : "error"
                  }
                  sx={{ mb: 2 }}
                >
                  Overall Compatibility Score: {selectedResult.overallScore}%
                </Alert>

                <List>
                  {selectedResult.results.map((result, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          {getFeatureIcon(result.feature)}
                        </ListItemIcon>
                        <ListItemText
                          primary={result.feature}
                          secondary={
                            <Box>
                              <Chip
                                label={
                                  result.supported
                                    ? "Supported"
                                    : "Not Supported"
                                }
                                size="small"
                                color={getStatusColor(result)}
                                sx={{ mr: 1 }}
                              />
                              {result.performance && (
                                <Chip
                                  label={`${result.performance.toFixed(2)}ms`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mr: 1 }}
                                />
                              )}
                              {result.error && (
                                <Typography
                                  variant="caption"
                                  color="error"
                                  display="block"
                                >
                                  Error: {result.error}
                                </Typography>
                              )}
                              {result.notes && (
                                <Typography variant="caption" display="block">
                                  {result.notes}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < selectedResult.results.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowResultDialog(false)}>Close</Button>
            {selectedResult && (
              <>
                <Button
                  onClick={() => exportTestResults(selectedResult)}
                  startIcon={<DownloadIcon />}
                >
                  Export
                </Button>
                <Button
                  onClick={() => shareTestResults(selectedResult)}
                  startIcon={<ShareIcon />}
                >
                  Share
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default CrossDeviceTestingPage;
