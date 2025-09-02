import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  GetApp as DownloadIcon,
  Devices as DevicesIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Accessibility as AccessibilityIcon,
} from "@mui/icons-material";
import { DeviceTestRunner } from "../utils/deviceTesting";
import type { TestSuite, DeviceTestResult } from "../utils/deviceTesting";
import { PerformanceTester } from "../utils/performanceTesting";

interface TestCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  tests: string[];
}

const testCategories: TestCategory[] = [
  {
    id: "device-apis",
    name: "Device APIs",
    description: "Test device capability access",
    icon: <DevicesIcon />,
    tests: [
      "camera",
      "microphone",
      "geolocation",
      "motion",
      "fileSystem",
      "notifications",
    ],
  },
  {
    id: "pwa-features",
    name: "PWA Features",
    description: "Test Progressive Web App functionality",
    icon: <SecurityIcon />,
    tests: [
      "serviceWorker",
      "manifest",
      "offline",
      "installation",
      "backgroundSync",
    ],
  },
  {
    id: "performance",
    name: "Performance",
    description: "Test application performance metrics",
    icon: <SpeedIcon />,
    tests: [
      "loadTime",
      "renderTime",
      "memoryUsage",
      "bundleSize",
      "coreWebVitals",
    ],
  },
  {
    id: "accessibility",
    name: "Accessibility",
    description: "Test accessibility compliance",
    icon: <AccessibilityIcon />,
    tests: [
      "screenReader",
      "keyboard",
      "colorContrast",
      "focusManagement",
      "ariaLabels",
    ],
  },
];

export const ComprehensiveTestSuite: React.FC = () => {
  const [testRunner] = useState(() => new DeviceTestRunner());
  const [performanceTester] = useState(() => new PerformanceTester());
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);

  useEffect(() => {
    // Load previous test results from localStorage
    const savedResults = localStorage.getItem("pwa-test-results");
    if (savedResults) {
      try {
        setTestSuites(JSON.parse(savedResults));
      } catch (error) {
        console.error("Failed to load saved test results:", error);
      }
    }
  }, []);

  const saveTestResults = (suites: TestSuite[]) => {
    try {
      localStorage.setItem("pwa-test-results", JSON.stringify(suites));
    } catch (error) {
      console.error("Failed to save test results:", error);
    }
  };

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setProgress(0);
    setCurrentTest("Initializing...");

    try {
      const results: DeviceTestResult[] = [];
      const totalTests = testCategories.reduce(
        (sum, category) => sum + category.tests.length,
        0
      );
      let completedTests = 0;

      // Run device API tests
      setCurrentTest("Testing Device APIs...");
      const deviceTests = [
        () => testRunner.testCamera(),
        () => testRunner.testMicrophone(),
        () => testRunner.testGeolocation(),
        () => testRunner.testMotionSensors(),
        () => testRunner.testFileSystem(),
        () => testRunner.testNotifications(),
      ];

      for (const test of deviceTests) {
        try {
          const result = await test();
          results.push(result);
        } catch (error) {
          results.push({
            feature: "Unknown",
            supported: false,
            tested: true,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
        completedTests++;
        setProgress((completedTests / totalTests) * 100);
      }

      // Run PWA tests
      setCurrentTest("Testing PWA Features...");
      const pwaTests = await testRunner.testPWAFeatures();
      results.push(...pwaTests);
      completedTests += pwaTests.length;
      setProgress((completedTests / totalTests) * 100);

      // Run performance tests
      setCurrentTest("Testing Performance...");
      const performanceResults = await performanceTester.runComprehensiveTest();
      results.push(
        ...performanceResults.map((result) => ({
          feature: result.name,
          supported: true,
          tested: true,
          performance: result.value,
          details: result.details,
        }))
      );
      completedTests += 5; // Approximate number of performance tests
      setProgress((completedTests / totalTests) * 100);

      // Run accessibility tests
      setCurrentTest("Testing Accessibility...");
      const accessibilityResults = await testRunner.testAccessibility();
      results.push(...accessibilityResults);
      completedTests += accessibilityResults.length;
      setProgress(100);

      // Create test suite
      const testSuite: TestSuite = {
        id: `test-${Date.now()}`,
        browser: testRunner.getBrowserInfo(),
        timestamp: new Date().toISOString(),
        results,
        overallScore: calculateOverallScore(results),
      };

      const updatedSuites = [testSuite, ...testSuites];
      setTestSuites(updatedSuites);
      saveTestResults(updatedSuites);
      setSelectedSuite(testSuite);
      setShowResults(true);
    } catch (error) {
      console.error("Test suite failed:", error);
    } finally {
      setIsRunning(false);
      setCurrentTest(null);
      setProgress(0);
    }
  };

  const calculateOverallScore = (results: DeviceTestResult[]): number => {
    if (results.length === 0) return 0;

    const supportedCount = results.filter((r) => r.supported).length;
    return Math.round((supportedCount / results.length) * 100);
  };

  const getStatusColor = (result: DeviceTestResult) => {
    if (!result.tested) return "default";
    if (result.supported) return "success";
    if (result.error) return "error";
    return "warning";
  };

  const getStatusIcon = (result: DeviceTestResult) => {
    if (!result.tested) return <InfoIcon />;
    if (result.supported) return <CheckIcon />;
    if (result.error) return <ErrorIcon />;
    return <WarningIcon />;
  };

  const exportResults = (suite: TestSuite) => {
    const dataStr = JSON.stringify(suite, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pwa-test-results-${suite.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Comprehensive Device Testing Suite
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Test all PWA functionality across different devices and browsers to
        ensure compatibility.
      </Typography>

      {/* Test Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
            <Box flex="1" minWidth="300px">
              <Button
                variant="contained"
                startIcon={isRunning ? <StopIcon /> : <PlayIcon />}
                onClick={runComprehensiveTest}
                disabled={isRunning}
                size="large"
              >
                {isRunning ? "Running Tests..." : "Run Comprehensive Test"}
              </Button>
            </Box>
            <Box flex="1" minWidth="300px">
              {isRunning && (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    {currentTest}
                  </Typography>
                  <LinearProgress variant="determinate" value={progress} />
                  <Typography variant="caption" color="text.secondary">
                    {Math.round(progress)}% Complete
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Test Categories Overview */}
      <Box display="flex" flexWrap="wrap" gap={3} sx={{ mb: 3 }}>
        {testCategories.map((category) => (
          <Box flex="1" minWidth="250px" key={category.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  {category.icon}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {category.name}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {category.description}
                </Typography>
                <Chip
                  label={`${category.tests.length} tests`}
                  size="small"
                  variant="outlined"
                />
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Previous Test Results */}
      {testSuites.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Test History
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Browser</TableCell>
                    <TableCell>Device</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Tests</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {testSuites.map((suite) => (
                    <TableRow key={suite.id}>
                      <TableCell>
                        {new Date(suite.timestamp).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{suite.browser.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={suite.browser.mobile ? "Mobile" : "Desktop"}
                          size="small"
                          color={suite.browser.mobile ? "primary" : "default"}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${suite.overallScore}%`}
                          color={
                            suite.overallScore >= 80
                              ? "success"
                              : suite.overallScore >= 60
                                ? "warning"
                                : "error"
                          }
                        />
                      </TableCell>
                      <TableCell>{suite.results.length} tests</TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            onClick={() => {
                              setSelectedSuite(suite);
                              setShowResults(true);
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Export Results">
                          <IconButton onClick={() => exportResults(suite)}>
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Results Dialog */}
      <Dialog
        open={showResults}
        onClose={() => setShowResults(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Test Results
          {selectedSuite && (
            <Typography variant="subtitle2" color="text.secondary">
              {selectedSuite.browser.name} •{" "}
              {new Date(selectedSuite.timestamp).toLocaleString()}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedSuite && (
            <Box>
              {/* Overall Score */}
              <Alert
                severity={
                  selectedSuite.overallScore >= 80
                    ? "success"
                    : selectedSuite.overallScore >= 60
                      ? "warning"
                      : "error"
                }
                sx={{ mb: 2 }}
              >
                Overall Compatibility Score: {selectedSuite.overallScore}%
              </Alert>

              {/* Results by Category */}
              {testCategories.map((category) => {
                const categoryResults = selectedSuite.results.filter((result) =>
                  category.tests.some((test) =>
                    result.feature.toLowerCase().includes(test.toLowerCase())
                  )
                );

                if (categoryResults.length === 0) return null;

                return (
                  <Accordion key={category.id}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box display="flex" alignItems="center" width="100%">
                        {category.icon}
                        <Typography sx={{ ml: 1, flexGrow: 1 }}>
                          {category.name}
                        </Typography>
                        <Chip
                          label={`${categoryResults.filter((r) => r.supported).length}/${categoryResults.length}`}
                          size="small"
                          color={
                            categoryResults.every((r) => r.supported)
                              ? "success"
                              : categoryResults.some((r) => r.supported)
                                ? "warning"
                                : "error"
                          }
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List>
                        {categoryResults.map((result, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>{getStatusIcon(result)}</ListItemIcon>
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
                                      label={`${result.performance}ms`}
                                      size="small"
                                      variant="outlined"
                                      sx={{ mr: 1 }}
                                    />
                                  )}
                                  {result.error && (
                                    <Typography variant="caption" color="error">
                                      {result.error}
                                    </Typography>
                                  )}
                                  {result.details && (
                                    <Typography
                                      variant="caption"
                                      display="block"
                                    >
                                      {result.details}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResults(false)}>Close</Button>
          {selectedSuite && (
            <Button
              onClick={() => exportResults(selectedSuite)}
              startIcon={<DownloadIcon />}
            >
              Export Results
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComprehensiveTestSuite;
