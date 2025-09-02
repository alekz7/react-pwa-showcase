import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
} from "@mui/material";
import { Grid } from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Smartphone as MobileIcon,
  Computer as DesktopIcon,
  Wifi as NetworkIcon,
  Security as SecurityIcon,
} from "@mui/icons-material";
import DeviceTestSuite from "../components/DeviceTestSuite";
import PerformanceOptimizer from "../components/PerformanceOptimizer";
import { DeviceTestRunner, type TestSuite } from "../utils/deviceTesting";

const TestingPage: React.FC = () => {
  const [savedResults, setSavedResults] = useState<TestSuite[]>([]);

  useEffect(() => {
    // Load saved test results
    const results = DeviceTestRunner.getSavedResults();
    setSavedResults(results);
  }, []);

  const handleTestComplete = (results: TestSuite) => {
    setSavedResults((prev) => [results, ...prev]);
  };

  const handlePerformanceReport = () => {
    // Report handling can be implemented here if needed
  };

  const testingGuidelines = [
    {
      category: "Mobile Device Testing",
      icon: <MobileIcon />,
      items: [
        "Test on both iOS and Android devices",
        "Try different screen sizes (phone, tablet)",
        "Test in both portrait and landscape orientations",
        "Verify touch interactions and gestures",
        "Check PWA installation on mobile browsers",
        "Test offline functionality",
      ],
    },
    {
      category: "Desktop Browser Testing",
      icon: <DesktopIcon />,
      items: [
        "Test on Chrome, Firefox, Safari, and Edge",
        "Verify keyboard navigation",
        "Test responsive design at different window sizes",
        "Check PWA installation prompts",
        "Test with different zoom levels",
        "Verify accessibility features",
      ],
    },
    {
      category: "Network Conditions",
      icon: <NetworkIcon />,
      items: [
        "Test with fast WiFi connection",
        "Test with slow 3G connection",
        "Test offline functionality",
        "Verify service worker caching",
        "Test background sync when connection returns",
        "Check push notification delivery",
      ],
    },
    {
      category: "Security & Permissions",
      icon: <SecurityIcon />,
      items: [
        "Test with all permissions granted",
        "Test with permissions denied",
        "Verify graceful degradation",
        "Test permission re-request flows",
        "Check HTTPS requirements",
        "Verify secure context features",
      ],
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "error";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckIcon color="success" />;
    if (score >= 60) return <WarningIcon color="warning" />;
    return <ErrorIcon color="error" />;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Comprehensive Device Testing
      </Typography>

      <Typography variant="h6" color="text.secondary" paragraph>
        Test all PWA functionality across different devices, browsers, and
        network conditions. This comprehensive testing suite helps ensure your
        PWA works reliably for all users.
      </Typography>

      <Grid container spacing={4}>
        {/* Testing Guidelines */}
        <Grid xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Testing Guidelines
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Follow these guidelines to ensure comprehensive testing across
                all target devices and scenarios.
              </Typography>

              {testingGuidelines.map((guideline, index) => (
                <Accordion key={index}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {guideline.icon}
                      <Typography variant="h6">{guideline.category}</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {guideline.items.map((item, itemIndex) => (
                        <ListItem key={itemIndex}>
                          <ListItemIcon>
                            <InfoIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={item} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Test History */}
        <Grid xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Test History
              </Typography>

              {savedResults.length === 0 ? (
                <Alert severity="info">
                  No test results yet. Run the test suite below to start
                  tracking compatibility across devices.
                </Alert>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Previous test results from different devices and browsers.
                  </Typography>

                  {savedResults.slice(0, 5).map((result, index) => (
                    <Box
                      key={index}
                      sx={{
                        mb: 2,
                        p: 2,
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          {getScoreIcon(result.overallScore)}
                          <Typography variant="subtitle1">
                            {result.browser.name} {result.browser.version}
                          </Typography>
                        </Box>
                        <Chip
                          label={`${result.overallScore}%`}
                          color={getScoreColor(result.overallScore)}
                          size="small"
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary">
                        {result.browser.platform} •{" "}
                        {result.browser.mobile ? "Mobile" : "Desktop"}
                        {result.browser.pwa && " • PWA Mode"}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        {new Date(result.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  ))}

                  {savedResults.length > 5 && (
                    <Typography variant="body2" color="text.secondary">
                      ... and {savedResults.length - 5} more results
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Device Test Suite */}
        <Grid xs={12}>
          <DeviceTestSuite onTestComplete={handleTestComplete} />
        </Grid>

        {/* Performance Optimizer */}
        <Grid xs={12}>
          <PerformanceOptimizer onReportGenerated={handlePerformanceReport} />
        </Grid>

        {/* Testing Checklist */}
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Manual Testing Checklist
              </Typography>

              <Typography variant="body2" color="text.secondary" paragraph>
                In addition to automated testing, manually verify these critical
                user flows:
              </Typography>

              <Grid container spacing={3}>
                <Grid xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Core Functionality
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon />
                      </ListItemIcon>
                      <ListItemText primary="Camera demo works with photo capture" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon />
                      </ListItemIcon>
                      <ListItemText primary="Microphone demo records and plays audio" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon />
                      </ListItemIcon>
                      <ListItemText primary="Location demo shows current position" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon />
                      </ListItemIcon>
                      <ListItemText primary="Motion sensors respond to device movement" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon />
                      </ListItemIcon>
                      <ListItemText primary="File system demo handles file selection" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon />
                      </ListItemIcon>
                      <ListItemText primary="Real-time demo connects and sends messages" />
                    </ListItem>
                  </List>
                </Grid>

                <Grid xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    PWA Features
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon />
                      </ListItemIcon>
                      <ListItemText primary="App installs as PWA" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon />
                      </ListItemIcon>
                      <ListItemText primary="Works offline after installation" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon />
                      </ListItemIcon>
                      <ListItemText primary="Service worker updates properly" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon />
                      </ListItemIcon>
                      <ListItemText primary="Push notifications work (if supported)" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon />
                      </ListItemIcon>
                      <ListItemText primary="App icon appears on home screen" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon />
                      </ListItemIcon>
                      <ListItemText primary="Splash screen displays on launch" />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  Testing Tips
                </Typography>
                <Typography variant="body2">
                  • Test with different user interaction patterns (touch, mouse,
                  keyboard)
                  <br />
                  • Verify error handling when permissions are denied
                  <br />
                  • Check responsive design at various screen sizes
                  <br />
                  • Test with slow network connections
                  <br />• Verify accessibility with screen readers
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TestingPage;
