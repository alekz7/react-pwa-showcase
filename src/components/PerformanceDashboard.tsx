import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  IconButton,
  Collapse,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { usePerformanceMonitor } from "../hooks/usePerformanceMonitor";
import { getBundleAnalyzer } from "../utils/bundleAnalyzer";

interface PerformanceDashboardProps {
  compact?: boolean;
  showRecommendations?: boolean;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  compact = false,
  showRecommendations = true,
}) => {
  const { metrics, score, exportMetrics, refreshMetrics } =
    usePerformanceMonitor();

  const [expanded, setExpanded] = useState(!compact);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportData, setExportData] = useState("");

  const handleExport = () => {
    const performanceData = exportMetrics();
    const bundleData = getBundleAnalyzer().exportAnalysis();

    const combinedData = {
      performance: JSON.parse(performanceData),
      bundle: JSON.parse(bundleData),
      timestamp: new Date().toISOString(),
    };

    setExportData(JSON.stringify(combinedData, null, 2));
    setShowExportDialog(true);
  };

  const downloadExport = () => {
    const blob = new Blob([exportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportDialog(false);
  };

  const getScoreColor = (score: number): "success" | "warning" | "error" => {
    if (score >= 90) return "success";
    if (score >= 70) return "warning";
    return "error";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircleIcon />;
    if (score >= 70) return <WarningIcon />;
    return <ErrorIcon />;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (compact && !expanded) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1 }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box display="flex" alignItems="center">
              <SpeedIcon sx={{ mr: 1, color: "primary.main" }} />
              <Typography variant="body2">
                Performance Score: {score}
              </Typography>
              <Chip
                size="small"
                label={
                  score >= 90
                    ? "Excellent"
                    : score >= 70
                      ? "Good"
                      : "Needs Work"
                }
                color={getScoreColor(score)}
                sx={{ ml: 1 }}
              />
            </Box>
            <IconButton size="small" onClick={() => setExpanded(true)}>
              <ExpandMoreIcon />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
          >
            <Typography variant="h6" display="flex" alignItems="center">
              <AssessmentIcon sx={{ mr: 1 }} />
              Performance Dashboard
            </Typography>
            <Box>
              <IconButton onClick={refreshMetrics} size="small">
                <RefreshIcon />
              </IconButton>
              <IconButton onClick={handleExport} size="small">
                <DownloadIcon />
              </IconButton>
              {compact && (
                <IconButton onClick={() => setExpanded(false)} size="small">
                  <ExpandLessIcon />
                </IconButton>
              )}
            </Box>
          </Box>

          <Collapse in={expanded}>
            {/* Performance Score */}
            <Box mb={3}>
              <Box display="flex" alignItems="center" mb={1}>
                {getScoreIcon(score)}
                <Typography variant="h4" sx={{ ml: 1, mr: 2 }}>
                  {score}
                </Typography>
                <Box flexGrow={1}>
                  <Typography variant="body2" color="text.secondary">
                    Overall Performance Score
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={score}
                    color={getScoreColor(score)}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Core Web Vitals */}
            <Grid container spacing={2} mb={3}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: "center" }}>
                    <Typography variant="h6" color="primary">
                      {metrics.lcp ? formatTime(metrics.lcp) : "N/A"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Largest Contentful Paint
                    </Typography>
                    {metrics.lcp && (
                      <Chip
                        size="small"
                        label={
                          metrics.lcp <= 2500
                            ? "Good"
                            : metrics.lcp <= 4000
                              ? "Needs Work"
                              : "Poor"
                        }
                        color={
                          metrics.lcp <= 2500
                            ? "success"
                            : metrics.lcp <= 4000
                              ? "warning"
                              : "error"
                        }
                        sx={{ mt: 1 }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: "center" }}>
                    <Typography variant="h6" color="primary">
                      {metrics.fid ? formatTime(metrics.fid) : "N/A"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      First Input Delay
                    </Typography>
                    {metrics.fid && (
                      <Chip
                        size="small"
                        label={
                          metrics.fid <= 100
                            ? "Good"
                            : metrics.fid <= 300
                              ? "Needs Work"
                              : "Poor"
                        }
                        color={
                          metrics.fid <= 100
                            ? "success"
                            : metrics.fid <= 300
                              ? "warning"
                              : "error"
                        }
                        sx={{ mt: 1 }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: "center" }}>
                    <Typography variant="h6" color="primary">
                      {metrics.cls ? metrics.cls.toFixed(3) : "N/A"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cumulative Layout Shift
                    </Typography>
                    {metrics.cls && (
                      <Chip
                        size="small"
                        label={
                          metrics.cls <= 0.1
                            ? "Good"
                            : metrics.cls <= 0.25
                              ? "Needs Work"
                              : "Poor"
                        }
                        color={
                          metrics.cls <= 0.1
                            ? "success"
                            : metrics.cls <= 0.25
                              ? "warning"
                              : "error"
                        }
                        sx={{ mt: 1 }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Additional Metrics */}
            <Grid container spacing={2} mb={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      display="flex"
                      alignItems="center"
                    >
                      <SpeedIcon sx={{ mr: 1 }} />
                      Load Performance
                    </Typography>
                    <List dense>
                      {metrics.loadTime && (
                        <ListItem>
                          <ListItemText
                            primary="Load Time"
                            secondary={formatTime(metrics.loadTime)}
                          />
                        </ListItem>
                      )}
                      {metrics.renderTime && (
                        <ListItem>
                          <ListItemText
                            primary="Render Time"
                            secondary={formatTime(metrics.renderTime)}
                          />
                        </ListItem>
                      )}
                      {metrics.interactionTime && (
                        <ListItem>
                          <ListItemText
                            primary="Interaction Time"
                            secondary={formatTime(metrics.interactionTime)}
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      display="flex"
                      alignItems="center"
                    >
                      <MemoryIcon sx={{ mr: 1 }} />
                      Resource Usage
                    </Typography>
                    <List dense>
                      {metrics.memoryUsage && (
                        <>
                          <ListItem>
                            <ListItemText
                              primary="Memory Used"
                              secondary={formatBytes(metrics.memoryUsage.used)}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Memory Total"
                              secondary={formatBytes(metrics.memoryUsage.total)}
                            />
                          </ListItem>
                        </>
                      )}
                      {metrics.resourceCount && (
                        <ListItem>
                          <ListItemText
                            primary="Resources Loaded"
                            secondary={`${metrics.resourceCount} files`}
                          />
                        </ListItem>
                      )}
                      {metrics.totalResourceSize && (
                        <ListItem>
                          <ListItemText
                            primary="Total Resource Size"
                            secondary={formatBytes(metrics.totalResourceSize)}
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Recommendations */}
            {showRecommendations && (
              <Alert severity="info" icon={<TrendingUpIcon />}>
                <Typography variant="subtitle2" gutterBottom>
                  Performance Recommendations
                </Typography>
                <List dense>
                  {score < 90 && (
                    <ListItem>
                      <ListItemIcon>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText primary="Consider implementing more aggressive code splitting and lazy loading" />
                    </ListItem>
                  )}
                  {metrics.lcp && metrics.lcp > 2500 && (
                    <ListItem>
                      <ListItemIcon>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText primary="Optimize Largest Contentful Paint by reducing image sizes and improving server response times" />
                    </ListItem>
                  )}
                  {metrics.fid && metrics.fid > 100 && (
                    <ListItem>
                      <ListItemIcon>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText primary="Reduce First Input Delay by minimizing JavaScript execution time" />
                    </ListItem>
                  )}
                  {metrics.cls && metrics.cls > 0.1 && (
                    <ListItem>
                      <ListItemIcon>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText primary="Improve Cumulative Layout Shift by setting dimensions for images and ads" />
                    </ListItem>
                  )}
                </List>
              </Alert>
            )}
          </Collapse>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Export Performance Data</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Performance and bundle analysis data in JSON format:
          </Typography>
          <TextField
            multiline
            rows={15}
            value={exportData}
            fullWidth
            variant="outlined"
            InputProps={{
              readOnly: true,
              sx: { fontFamily: "monospace", fontSize: "0.875rem" },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExportDialog(false)}>Cancel</Button>
          <Button
            onClick={downloadExport}
            variant="contained"
            startIcon={<DownloadIcon />}
          >
            Download JSON
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PerformanceDashboard;
