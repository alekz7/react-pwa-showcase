import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { Grid } from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import {
  PerformanceTester,
  type PerformanceReport,
  type PerformanceMetrics,
  performanceOptimizations,
} from "../utils/performanceTesting";

interface PerformanceOptimizerProps {
  onReportGenerated?: (report: PerformanceReport) => void;
}

const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  onReportGenerated,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<PerformanceMetrics | null>(
    null
  );
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoringCleanup, setMonitoringCleanup] = useState<
    (() => void) | null
  >(null);

  const performanceTester = useMemo(() => new PerformanceTester(), []);

  useEffect(() => {
    return () => {
      if (monitoringCleanup) {
        monitoringCleanup();
      }
      performanceTester.cleanup();
    };
  }, [monitoringCleanup, performanceTester]);

  const runPerformanceAnalysis = async () => {
    setIsAnalyzing(true);

    try {
      const newReport = await performanceTester.generateReport();
      setReport(newReport);

      if (onReportGenerated) {
        onReportGenerated(newReport);
      }
    } catch (error) {
      console.error("Performance analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startLiveMonitoring = () => {
    if (isMonitoring) {
      if (monitoringCleanup) {
        monitoringCleanup();
        setMonitoringCleanup(null);
      }
      setIsMonitoring(false);
      setLiveMetrics(null);
    } else {
      const cleanup = performanceTester.startMonitoring((metrics) => {
        setLiveMetrics(metrics);
      }, 2000);

      setMonitoringCleanup(() => cleanup);
      setIsMonitoring(true);
    }
  };

  const applyOptimizations = () => {
    // Apply basic optimizations
    performanceOptimizations.enableLazyLoading();
    performanceOptimizations.optimizeFonts();

    // Show success message
    alert("Basic optimizations applied! Refresh the page to see improvements.");
  };

  const downloadReport = () => {
    if (!report) return;

    const reportData = {
      ...report,
      generatedAt: new Date().toISOString(),
      url: window.location.href,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "success";
    if (score >= 70) return "warning";
    return "error";
  };

  const getRecommendationIcon = (category: string) => {
    switch (category) {
      case "critical":
        return <ErrorIcon color="error" />;
      case "warning":
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const formatMetricValue = (key: string, value: number) => {
    if (
      key.includes("Time") ||
      key === "lcp" ||
      key === "fid" ||
      key === "fcp" ||
      key === "ttfb"
    ) {
      return `${value.toFixed(2)}ms`;
    }
    if (key.includes("Size") || key === "bundleSize") {
      return `${(value / 1024 / 1024).toFixed(2)}MB`;
    }
    if (key === "cls") {
      return value.toFixed(3);
    }
    if (key === "cacheHitRatio") {
      return `${(value * 100).toFixed(1)}%`;
    }
    if (key === "downlink") {
      return `${value}Mbps`;
    }
    if (key === "rtt") {
      return `${value}ms`;
    }
    return value.toString();
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 2 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <SpeedIcon sx={{ mr: 1, color: "primary.main" }} />
            <Typography variant="h4" component="h1">
              Performance Optimizer
            </Typography>
          </Box>

          <Typography variant="body1" color="text.secondary" paragraph>
            Analyze and optimize your PWA's performance with comprehensive
            metrics, recommendations, and automated optimizations.
          </Typography>

          {/* Control Buttons */}
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              startIcon={
                isAnalyzing ? (
                  <CircularProgress size={20} />
                ) : (
                  <TrendingUpIcon />
                )
              }
              onClick={runPerformanceAnalysis}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? "Analyzing..." : "Run Performance Analysis"}
            </Button>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={startLiveMonitoring}
              color={isMonitoring ? "secondary" : "primary"}
            >
              {isMonitoring ? "Stop Monitoring" : "Start Live Monitoring"}
            </Button>

            <Button variant="outlined" onClick={applyOptimizations}>
              Apply Basic Optimizations
            </Button>

            {report && (
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={downloadReport}
              >
                Download Report
              </Button>
            )}
          </Box>

          {/* Live Metrics */}
          {isMonitoring && liveMetrics && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Live Performance Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid xs={6} sm={3}>
                  <Typography variant="body2">
                    Memory:{" "}
                    {liveMetrics.jsHeapSize
                      ? `${(liveMetrics.jsHeapSize / 1024 / 1024).toFixed(1)}MB`
                      : "N/A"}
                  </Typography>
                </Grid>
                <Grid xs={6} sm={3}>
                  <Typography variant="body2">
                    Connection: {liveMetrics.effectiveType || "Unknown"}
                  </Typography>
                </Grid>
                <Grid xs={6} sm={3}>
                  <Typography variant="body2">
                    Resources: {liveMetrics.resourceCount || 0}
                  </Typography>
                </Grid>
                <Grid xs={6} sm={3}>
                  <Typography variant="body2">
                    Cache Hit:{" "}
                    {liveMetrics.cacheHitRatio
                      ? `${(liveMetrics.cacheHitRatio * 100).toFixed(1)}%`
                      : "N/A"}
                  </Typography>
                </Grid>
              </Grid>
            </Alert>
          )}

          {/* Performance Report */}
          {report && (
            <Box>
              {/* Overall Score */}
              <Alert
                severity={
                  report.score >= 90
                    ? "success"
                    : report.score >= 70
                      ? "warning"
                      : "error"
                }
                sx={{ mb: 3 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Typography variant="h6">
                      Performance Score: {report.score}/100
                    </Typography>
                    <Typography variant="body2">
                      Generated on {new Date(report.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                  <CircularProgress
                    variant="determinate"
                    value={report.score}
                    size={60}
                    color={getScoreColor(report.score)}
                  />
                </Box>
              </Alert>

              {/* Core Web Vitals */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Core Web Vitals</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {report.metrics.lcp && (
                      <Grid xs={12} sm={4}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              Largest Contentful Paint
                            </Typography>
                            <Typography variant="h6">
                              {(report.metrics.lcp / 1000).toFixed(2)}s
                            </Typography>
                            <Chip
                              size="small"
                              label={
                                report.metrics.lcp <= 2500
                                  ? "Good"
                                  : report.metrics.lcp <= 4000
                                    ? "Needs Improvement"
                                    : "Poor"
                              }
                              color={
                                report.metrics.lcp <= 2500
                                  ? "success"
                                  : report.metrics.lcp <= 4000
                                    ? "warning"
                                    : "error"
                              }
                            />
                          </CardContent>
                        </Card>
                      </Grid>
                    )}

                    {report.metrics.fid && (
                      <Grid xs={12} sm={4}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              First Input Delay
                            </Typography>
                            <Typography variant="h6">
                              {report.metrics.fid.toFixed(2)}ms
                            </Typography>
                            <Chip
                              size="small"
                              label={
                                report.metrics.fid <= 100
                                  ? "Good"
                                  : report.metrics.fid <= 300
                                    ? "Needs Improvement"
                                    : "Poor"
                              }
                              color={
                                report.metrics.fid <= 100
                                  ? "success"
                                  : report.metrics.fid <= 300
                                    ? "warning"
                                    : "error"
                              }
                            />
                          </CardContent>
                        </Card>
                      </Grid>
                    )}

                    {report.metrics.cls !== undefined && (
                      <Grid xs={12} sm={4}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              Cumulative Layout Shift
                            </Typography>
                            <Typography variant="h6">
                              {report.metrics.cls.toFixed(3)}
                            </Typography>
                            <Chip
                              size="small"
                              label={
                                report.metrics.cls <= 0.1
                                  ? "Good"
                                  : report.metrics.cls <= 0.25
                                    ? "Needs Improvement"
                                    : "Poor"
                              }
                              color={
                                report.metrics.cls <= 0.1
                                  ? "success"
                                  : report.metrics.cls <= 0.25
                                    ? "warning"
                                    : "error"
                              }
                            />
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Detailed Metrics */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Detailed Metrics</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Metric</TableCell>
                          <TableCell align="right">Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(report.metrics).map(
                          ([key, value]) =>
                            value !== undefined && (
                              <TableRow key={key}>
                                <TableCell>
                                  {key
                                    .replace(/([A-Z])/g, " $1")
                                    .replace(/^./, (str) => str.toUpperCase())}
                                </TableCell>
                                <TableCell align="right">
                                  {typeof value === "number"
                                    ? formatMetricValue(key, value)
                                    : value}
                                </TableCell>
                              </TableRow>
                            )
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>

              {/* Recommendations */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    Optimization Recommendations (
                    {report.recommendations.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {report.recommendations.length === 0 ? (
                    <Alert severity="success">
                      <Typography>
                        Great job! No critical performance issues found. Your
                        PWA is performing well.
                      </Typography>
                    </Alert>
                  ) : (
                    <Box>
                      {report.recommendations.map((rec, index) => (
                        <Card key={index} sx={{ mb: 2 }} variant="outlined">
                          <CardContent>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "flex-start",
                                mb: 1,
                              }}
                            >
                              {getRecommendationIcon(rec.category)}
                              <Box sx={{ ml: 1, flexGrow: 1 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                  {rec.title}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  paragraph
                                >
                                  {rec.description}
                                </Typography>

                                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                                  <Chip
                                    size="small"
                                    label={`Impact: ${rec.impact}`}
                                    color={
                                      rec.impact === "high"
                                        ? "error"
                                        : rec.impact === "medium"
                                          ? "warning"
                                          : "default"
                                    }
                                  />
                                  <Chip
                                    size="small"
                                    label={`Effort: ${rec.effort}`}
                                    variant="outlined"
                                  />
                                </Box>

                                <Typography variant="subtitle2" gutterBottom>
                                  Recommended Actions:
                                </Typography>
                                <List dense>
                                  {rec.actions.map((action, actionIndex) => (
                                    <ListItem key={actionIndex} sx={{ py: 0 }}>
                                      <ListItemIcon sx={{ minWidth: 32 }}>
                                        <CheckIcon
                                          fontSize="small"
                                          color="primary"
                                        />
                                      </ListItemIcon>
                                      <ListItemText
                                        primary={action}
                                        primaryTypographyProps={{
                                          variant: "body2",
                                        }}
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PerformanceOptimizer;
