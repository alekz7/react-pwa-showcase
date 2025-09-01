import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Accessibility as AccessibilityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  Keyboard as KeyboardIcon,
  VolumeUp as VolumeIcon,
  Contrast as ContrastIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { useAccessibility } from "../hooks/useAccessibility";
import { getColorContrastAnalyzer } from "../utils/colorContrast";

interface AccessibilityDashboardProps {
  compact?: boolean;
}

const AccessibilityDashboard: React.FC<AccessibilityDashboardProps> = ({
  compact = false,
}) => {
  const {
    features,
    audit,
    isScreenReaderActive,
    isHighContrastMode,
    isReducedMotionPreferred,
    isKeyboardNavigating,
    runAudit,
    announceToScreenReader,
  } = useAccessibility();

  const [showDetails, setShowDetails] = useState(false);
  const [contrastIssues, setContrastIssues] = useState<
    Array<{
      element: HTMLElement;
      result: {
        ratio: number;
        level: string;
        passes: { AA: boolean; AAA: boolean };
      };
      selector: string;
    }>
  >([]);

  useEffect(() => {
    // Run contrast analysis
    const analyzer = getColorContrastAnalyzer();
    const issues = analyzer.auditPageContrast();
    setContrastIssues(issues);
  }, []);

  const getScoreColor = (score: number): "success" | "warning" | "error" => {
    if (score >= 90) return "success";
    if (score >= 70) return "warning";
    return "error";
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
      case "serious":
        return <ErrorIcon color="error" />;
      case "moderate":
        return <WarningIcon color="warning" />;
      case "minor":
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon />;
    }
  };

  const handleRunAudit = () => {
    runAudit();
    announceToScreenReader("Accessibility audit completed");
  };

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      features,
      audit,
      contrastIssues: contrastIssues.map((issue) => ({
        selector: issue.selector,
        ratio: issue.result.ratio,
        level: issue.result.level,
        passes: issue.result.passes,
      })),
      url: window.location.href,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accessibility-report-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (compact) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1 }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box display="flex" alignItems="center">
              <AccessibilityIcon sx={{ mr: 1, color: "primary.main" }} />
              <Typography variant="body2">
                Accessibility Score: {audit?.score || 0}
              </Typography>
              <Chip
                size="small"
                label={audit?.wcagLevel || "Unknown"}
                color={getScoreColor(audit?.score || 0)}
                sx={{ ml: 1 }}
              />
            </Box>
            <Button size="small" onClick={() => setShowDetails(true)}>
              Details
            </Button>
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
              <AccessibilityIcon sx={{ mr: 1 }} />
              Accessibility Dashboard
            </Typography>
            <Box>
              <Tooltip title="Run accessibility audit">
                <IconButton onClick={handleRunAudit} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export accessibility report">
                <IconButton onClick={exportReport} size="small">
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Accessibility Score */}
          <Box mb={3}>
            <Box display="flex" alignItems="center" mb={1}>
              <Typography variant="h4" sx={{ mr: 2 }}>
                {audit?.score || 0}
              </Typography>
              <Box flexGrow={1}>
                <Typography variant="body2" color="text.secondary">
                  WCAG {audit?.wcagLevel || "Unknown"} Compliance Score
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={audit?.score || 0}
                  color={getScoreColor(audit?.score || 0)}
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Box>
          </Box>

          {/* Feature Detection */}
          <Grid container spacing={2} mb={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: "center" }}>
                  <VolumeIcon
                    color={isScreenReaderActive ? "success" : "disabled"}
                    sx={{ fontSize: 40, mb: 1 }}
                  />
                  <Typography variant="body2">Screen Reader</Typography>
                  <Chip
                    size="small"
                    label={isScreenReaderActive ? "Active" : "Not Detected"}
                    color={isScreenReaderActive ? "success" : "default"}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: "center" }}>
                  <KeyboardIcon
                    color={isKeyboardNavigating ? "success" : "disabled"}
                    sx={{ fontSize: 40, mb: 1 }}
                  />
                  <Typography variant="body2">Keyboard Navigation</Typography>
                  <Chip
                    size="small"
                    label={isKeyboardNavigating ? "Active" : "Not Detected"}
                    color={isKeyboardNavigating ? "success" : "default"}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: "center" }}>
                  <ContrastIcon
                    color={isHighContrastMode ? "success" : "disabled"}
                    sx={{ fontSize: 40, mb: 1 }}
                  />
                  <Typography variant="body2">High Contrast</Typography>
                  <Chip
                    size="small"
                    label={isHighContrastMode ? "Enabled" : "Disabled"}
                    color={isHighContrastMode ? "success" : "default"}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: "center" }}>
                  <VisibilityIcon
                    color={isReducedMotionPreferred ? "success" : "disabled"}
                    sx={{ fontSize: 40, mb: 1 }}
                  />
                  <Typography variant="body2">Reduced Motion</Typography>
                  <Chip
                    size="small"
                    label={
                      isReducedMotionPreferred ? "Preferred" : "Not Preferred"
                    }
                    color={isReducedMotionPreferred ? "success" : "default"}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Accessibility Issues */}
          {audit?.issues && audit.issues.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  Accessibility Issues ({audit?.issues?.length || 0})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {audit?.issues?.map((issue, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {getSeverityIcon(issue.severity)}
                      </ListItemIcon>
                      <ListItemText
                        primary={issue.message}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              WCAG {issue.wcagCriterion} • {issue.severity}
                            </Typography>
                            {issue.suggestion && (
                              <Typography
                                component="div"
                                variant="body2"
                                color="text.secondary"
                              >
                                Suggestion: {issue.suggestion}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Color Contrast Issues */}
          {contrastIssues.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  Color Contrast Issues ({contrastIssues.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {contrastIssues.slice(0, 10).map((issue, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <ContrastIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Contrast ratio: ${issue.result.ratio}:1`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              Element: {issue.selector} • Level:{" "}
                              {issue.result.level}
                            </Typography>
                            <Typography
                              component="div"
                              variant="body2"
                              color="text.secondary"
                            >
                              {issue.result.passes.AA
                                ? "Passes AA"
                                : "Fails AA"}{" "}
                              •
                              {issue.result.passes.AAA
                                ? "Passes AAA"
                                : "Fails AAA"}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                  {contrastIssues.length > 10 && (
                    <ListItem>
                      <ListItemText
                        primary={`... and ${contrastIssues.length - 10} more issues`}
                        sx={{ fontStyle: "italic" }}
                      />
                    </ListItem>
                  )}
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Recommendations */}
          {audit?.recommendations && audit.recommendations.length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Accessibility Recommendations
              </Typography>
              <List dense>
                {audit?.recommendations?.map((recommendation, index) => (
                  <ListItem key={index} sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <InfoIcon color="info" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={recommendation} />
                  </ListItem>
                ))}
              </List>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Accessibility Details</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Detailed accessibility information and compliance status.
          </Typography>
          {/* Add detailed accessibility information here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AccessibilityDashboard;
