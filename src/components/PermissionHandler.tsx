import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  Box,
  Alert,
  Chip,
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Collapse,
  LinearProgress,
} from "@mui/material";
import {
  Camera as CameraIcon,
  Mic as MicIcon,
  LocationOn as LocationIcon,
  Notifications as NotificationIcon,
  Sensors as SensorIcon,
  CheckCircle as GrantedIcon,
  Cancel as DeniedIcon,
  Help as PromptIcon,
  Block as UnsupportedIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { usePermissions } from "../hooks/usePermissions";
import type { PermissionName, PermissionState } from "../hooks/usePermissions";

interface PermissionHandlerProps {
  open: boolean;
  onClose: () => void;
  requiredPermissions?: PermissionName[];
  title?: string;
  description?: string;
  onAllGranted?: () => void;
  onSomeGranted?: (granted: PermissionName[]) => void;
  onAllDenied?: () => void;
}

const PERMISSION_ICONS: Record<PermissionName, React.ReactElement> = {
  camera: <CameraIcon />,
  microphone: <MicIcon />,
  geolocation: <LocationIcon />,
  notifications: <NotificationIcon />,
  accelerometer: <SensorIcon />,
  gyroscope: <SensorIcon />,
  magnetometer: <SensorIcon />,
};

const PERMISSION_LABELS: Record<PermissionName, string> = {
  camera: "Camera",
  microphone: "Microphone",
  geolocation: "Location",
  notifications: "Notifications",
  accelerometer: "Motion Sensors",
  gyroscope: "Orientation",
  magnetometer: "Compass",
};

const PERMISSION_DESCRIPTIONS: Record<PermissionName, string> = {
  camera: "Access your camera to take photos and record videos",
  microphone: "Access your microphone to record audio",
  geolocation: "Access your location for location-based features",
  notifications: "Send you notifications about app updates and features",
  accelerometer: "Access motion sensors for interactive features",
  gyroscope: "Access device orientation for enhanced interactions",
  magnetometer: "Access compass data for navigation features",
};

const getStateIcon = (state: PermissionState) => {
  switch (state) {
    case "granted":
      return <GrantedIcon color="success" />;
    case "denied":
      return <DeniedIcon color="error" />;
    case "prompt":
      return <PromptIcon color="info" />;
    case "unsupported":
      return <UnsupportedIcon color="disabled" />;
    default:
      return <PromptIcon color="disabled" />;
  }
};

const getStateColor = (state: PermissionState) => {
  switch (state) {
    case "granted":
      return "success" as const;
    case "denied":
      return "error" as const;
    case "prompt":
      return "info" as const;
    case "unsupported":
      return "default" as const;
    default:
      return "default" as const;
  }
};

export const PermissionHandler: React.FC<PermissionHandlerProps> = ({
  open,
  onClose,
  requiredPermissions = [],
  title = "Permissions Required",
  description = "This feature requires the following permissions to work properly.",
  onAllGranted,
  onSomeGranted,
  onAllDenied,
}) => {
  const {
    permissions,
    requestPermission,
    requestMultiplePermissions,
    refreshPermissions,
    getPermissionInstructions,
  } = usePermissions();

  const [activeStep, setActiveStep] = useState(0);
  const [isRequesting, setIsRequesting] = useState(false);
  const [expandedInstructions, setExpandedInstructions] = useState<
    Record<string, boolean>
  >({});

  // Filter permissions to show only required ones or all if none specified
  const permissionsToShow =
    requiredPermissions.length > 0
      ? requiredPermissions
      : (Object.keys(permissions) as PermissionName[]);

  const relevantPermissions = permissionsToShow.map((name) => ({
    ...permissions[name],
    name,
  }));

  const grantedCount = relevantPermissions.filter(
    (p) => p.state === "granted"
  ).length;
  const deniedCount = relevantPermissions.filter(
    (p) => p.state === "denied"
  ).length;
  const supportedCount = relevantPermissions.filter(
    (p) => p.isSupported
  ).length;

  // Handle permission request
  const handleRequestPermission = async (name: PermissionName) => {
    setIsRequesting(true);

    try {
      await requestPermission(name, {
        onGranted: () => {
          console.log(`${name} permission granted`);
        },
        onDenied: () => {
          console.log(`${name} permission denied`);
        },
        onError: (error) => {
          console.error(`${name} permission error:`, error);
        },
      });
    } finally {
      setIsRequesting(false);
    }
  };

  // Handle request all permissions
  const handleRequestAll = async () => {
    setIsRequesting(true);

    const supportedPermissions = relevantPermissions
      .filter((p) => p.isSupported && p.state !== "granted")
      .map((p) => p.name);

    if (supportedPermissions.length > 0) {
      await requestMultiplePermissions(supportedPermissions);
    }

    setIsRequesting(false);
  };

  // Toggle instruction expansion
  const toggleInstructions = (name: PermissionName) => {
    setExpandedInstructions((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  // Check completion status
  useEffect(() => {
    const granted = relevantPermissions.filter((p) => p.state === "granted");
    const denied = relevantPermissions.filter((p) => p.state === "denied");
    const supported = relevantPermissions.filter((p) => p.isSupported);

    if (granted.length === supported.length && supported.length > 0) {
      onAllGranted?.();
    } else if (granted.length > 0) {
      onSomeGranted?.(granted.map((p) => p.name));
    } else if (denied.length === supported.length && supported.length > 0) {
      onAllDenied?.();
    }
  }, [
    permissions,
    relevantPermissions,
    onAllGranted,
    onSomeGranted,
    onAllDenied,
  ]);

  const steps = [
    {
      label: "Review Permissions",
      description: "See what permissions are needed and why",
    },
    {
      label: "Grant Permissions",
      description: "Allow access to required features",
    },
    {
      label: "Complete Setup",
      description: "Verify all permissions are working",
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: "60vh" },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{title}</Typography>
          <Box display="flex" gap={1}>
            <Badge badgeContent={grantedCount} color="success">
              <Chip
                icon={<GrantedIcon />}
                label="Granted"
                size="small"
                color="success"
                variant="outlined"
              />
            </Badge>
            {deniedCount > 0 && (
              <Badge badgeContent={deniedCount} color="error">
                <Chip
                  icon={<DeniedIcon />}
                  label="Denied"
                  size="small"
                  color="error"
                  variant="outlined"
                />
              </Badge>
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          {description}
        </Typography>

        <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 2 }}>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {step.description}
                </Typography>

                {index === 0 && (
                  <List>
                    {relevantPermissions.map((permission) => (
                      <ListItem key={permission.name} divider>
                        <ListItemIcon>
                          {PERMISSION_ICONS[permission.name]}
                        </ListItemIcon>
                        <ListItemText
                          primary={PERMISSION_LABELS[permission.name]}
                          secondary={PERMISSION_DESCRIPTIONS[permission.name]}
                        />
                        <ListItemSecondaryAction>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              icon={getStateIcon(permission.state)}
                              label={permission.state}
                              size="small"
                              color={getStateColor(permission.state)}
                              variant="outlined"
                            />
                            {permission.state === "denied" && (
                              <IconButton
                                size="small"
                                onClick={() =>
                                  toggleInstructions(permission.name)
                                }
                              >
                                {expandedInstructions[permission.name] ? (
                                  <CollapseIcon />
                                ) : (
                                  <ExpandIcon />
                                )}
                              </IconButton>
                            )}
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}

                {index === 1 && (
                  <Box>
                    {isRequesting && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          Requesting permissions...
                        </Typography>
                        <LinearProgress />
                      </Box>
                    )}

                    <List>
                      {relevantPermissions.map((permission) => (
                        <Box key={permission.name}>
                          <ListItem>
                            <ListItemIcon>
                              {PERMISSION_ICONS[permission.name]}
                            </ListItemIcon>
                            <ListItemText
                              primary={PERMISSION_LABELS[permission.name]}
                              secondary={
                                permission.state === "granted"
                                  ? "Permission granted"
                                  : permission.state === "denied"
                                    ? "Permission denied - see instructions below"
                                    : permission.state === "unsupported"
                                      ? "Not supported on this device"
                                      : "Click to request permission"
                              }
                            />
                            <ListItemSecondaryAction>
                              <Box display="flex" alignItems="center" gap={1}>
                                {getStateIcon(permission.state)}
                                {permission.state === "prompt" &&
                                  permission.isSupported && (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() =>
                                        handleRequestPermission(permission.name)
                                      }
                                      disabled={isRequesting}
                                    >
                                      Request
                                    </Button>
                                  )}
                                {permission.state === "denied" && (
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      toggleInstructions(permission.name)
                                    }
                                  >
                                    <SettingsIcon />
                                  </IconButton>
                                )}
                              </Box>
                            </ListItemSecondaryAction>
                          </ListItem>

                          <Collapse in={expandedInstructions[permission.name]}>
                            <Box sx={{ pl: 4, pr: 2, pb: 2 }}>
                              <Alert severity="info" sx={{ mb: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  How to enable{" "}
                                  {PERMISSION_LABELS[permission.name]}{" "}
                                  permission:
                                </Typography>
                                <List dense>
                                  {getPermissionInstructions(
                                    permission.name
                                  ).map((instruction, idx) => (
                                    <ListItem key={idx} sx={{ py: 0.5 }}>
                                      <Typography variant="body2">
                                        {idx + 1}. {instruction}
                                      </Typography>
                                    </ListItem>
                                  ))}
                                </List>
                              </Alert>
                            </Box>
                          </Collapse>
                        </Box>
                      ))}
                    </List>
                  </Box>
                )}

                {index === 2 && (
                  <Box>
                    <Alert
                      severity={
                        grantedCount === supportedCount ? "success" : "warning"
                      }
                      sx={{ mb: 2 }}
                    >
                      <Typography variant="body2">
                        {grantedCount === supportedCount
                          ? "All permissions have been granted! You can now use all features."
                          : `${grantedCount} of ${supportedCount} permissions granted. Some features may be limited.`}
                      </Typography>
                    </Alert>

                    <Typography variant="body2" color="text.secondary">
                      You can change these permissions later in your browser
                      settings or by clicking the lock icon in the address bar.
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                  {index > 0 && (
                    <Button onClick={() => setActiveStep(index - 1)}>
                      Back
                    </Button>
                  )}
                  {index < steps.length - 1 && (
                    <Button
                      variant="contained"
                      onClick={() => setActiveStep(index + 1)}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>

      <DialogActions>
        <Button onClick={refreshPermissions} startIcon={<RefreshIcon />}>
          Refresh
        </Button>
        {supportedCount > grantedCount && (
          <Button
            variant="outlined"
            onClick={handleRequestAll}
            disabled={isRequesting}
          >
            Request All
          </Button>
        )}
        <Button onClick={onClose} variant="contained">
          {grantedCount === supportedCount ? "Done" : "Continue Anyway"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PermissionHandler;
