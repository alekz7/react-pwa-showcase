import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  Speed as SpeedIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { usePerformanceOptimization } from "../hooks/usePerformanceOptimization";
import type { PerformanceMetrics as PerformanceMetricsType } from "../utils/performanceMonitor";

interface PerformanceMetricsProps {
  showInProduction?: boolean;
}

/**
 * Development component to display performance metrics
 */
const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  showInProduction = false,
}) => {
  const { getMetrics, reportPerformance } = usePerformanceOptimization();
  const [expanded, setExpanded] = useState(false);
  const [metrics, setMetrics] = useState<{
    performanceMonitor: PerformanceMetricsType;
    customMetrics: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(getMetrics());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 2000);

    return () => clearInterval(interval);
  }, [getMetrics]);

  // Don't render in production unless explicitly enabled
  if (!import.meta.env.DEV && !showInProduction) {
    return null;
  }

  const handleRefresh = () => {
    reportPerformance();
    setMetrics(getMetrics());
  };

  const formatTime = (time: number) => {
    if (time < 1000) {
      return `${time.toFixed(2)}ms`;
    }
    return `${(time / 1000).toFixed(2)}s`;
  };

  const getPerformanceColor = (metric: string, value: number) => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[metric.toLowerCase()];
    if (!threshold) return "default";

    if (value <= threshold.good) return "success";
    if (value <= threshold.poor) return "warning";
    return "error";
  };

  if (!metrics) {
    return null;
  }

  return (
    <Card
      sx={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 1300,
        minWidth: 300,
        maxWidth: 500,
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <SpeedIcon sx={{ mr: 1, color: "primary.main" }} />
            <Typography variant="subtitle2">Performance</Typography>
          </Box>
          <Box>
            <IconButton size="small" onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Core Web Vitals Summary */}
        <Box display="flex" gap={1} mt={1} flexWrap="wrap">
          {metrics.performanceMonitor.lcp && (
            <Chip
              size="small"
              label={`LCP: ${formatTime(metrics.performanceMonitor.lcp)}`}
              color={getPerformanceColor("lcp", metrics.performanceMonitor.lcp)}
            />
          )}
          {metrics.performanceMonitor.fid && (
            <Chip
              size="small"
              label={`FID: ${formatTime(metrics.performanceMonitor.fid)}`}
              color={getPerformanceColor("fid", metrics.performanceMonitor.fid)}
            />
          )}
          {metrics.performanceMonitor.cls !== undefined && (
            <Chip
              size="small"
              label={`CLS: ${metrics.performanceMonitor.cls.toFixed(3)}`}
              color={getPerformanceColor("cls", metrics.performanceMonitor.cls)}
            />
          )}
        </Box>

        <Collapse in={expanded}>
          <Box mt={2}>
            {/* Performance Monitor Metrics */}
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Core Metrics
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Metric</TableCell>
                    <TableCell align="right">Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(metrics.performanceMonitor).map(
                    ([key, value]) => (
                      <TableRow key={key}>
                        <TableCell>{key.toUpperCase()}</TableCell>
                        <TableCell align="right">
                          {typeof value === "number"
                            ? key === "cls"
                              ? value.toFixed(3)
                              : formatTime(value)
                            : String(value)}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Custom Metrics */}
            {Object.keys(metrics.customMetrics).length > 0 && (
              <>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  Custom Metrics
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Metric</TableCell>
                        <TableCell align="right">Duration</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(metrics.customMetrics).map(
                        ([key, value]) => (
                          <TableRow key={key}>
                            <TableCell>{key}</TableCell>
                            <TableCell align="right">
                              {formatTime(value as number)}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetrics;
