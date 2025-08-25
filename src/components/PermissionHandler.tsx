import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Typography,
  Box,
  Chip,
  Badge,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import {
  Camera as CameraIcon,
  Mic as MicIcon,
  LocationOn as LocationIcon,
  Notifications as NotificationsIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import {
  usePermissions,
  type PermissionName,
  type PermissionStatus,
} from "../hooks/usePermissions";

interface PermissionHandlerProps {
  open: boolean;
  onClose: () => void;
  requiredPermissions: PermissionName[];
  onPermissionsGranted?: () => void;
  title?: string;
  description?: string;
}

const permissionConfig = {
  camera: {
    icon: CameraIcon,
    label: "Camera Access",
    description: "Required to capture photos and videos",
    reason:
      "This demo needs camera access to show photo capture and video recording capabilities.",
  },
  microphone: {
    icon: MicIcon,
    label: "Microphone Access",
    description: "Required to record audio",
    reason:
      "This demo needs microphone access to show audio recording and analysis features.",
  },
  geolocation: {
    icon: LocationIcon,
    label: "Location Access",
    description: "Required to access your location",
    reason:
      "This demo needs location access to show GPS tracking and location-based features.",
  },
  notifications: {
    icon: NotificationsIcon,
    label: "Notification Permission",
    description: "Required to send push notifications",
    reason:
      "This demo needs notification permission to show push notification capabilities.",
  },
};

const getStatusColor = (status: PermissionStatus) => {
  switch (status) {
    case "granted":
      return "success";
    case "denied":
      return "error";
    case "prompt":
      return "warning";
    default:
      return "default";
  }
};

const getStatusIcon = (status: PermissionStatus, isRequesting: boolean) => {
  if (isRequesting) return <CircularProgress size={16} />;

  switch (status) {
    case "granted":
      return <CheckIcon color="success" />;
    case "denied":
      return <CloseIcon color="error" />;
    case "prompt":
      return <WarningIcon color="warning" />;
    default:
      return <WarningIcon color="disabled" />;
  }
};

export const PermissionHandler: React.FC<PermissionHandlerProps> = ({
  open,
  onClose,
  requiredPermissions,
  onPermissionsGranted,
  title = "Permissions Required",
  description = "This demo requires the following permissions to function properly:",
}) => {
  const {
    permissions,
    requestPermission,
    checkPermission,
    hasPermission,
    isRequesting,
  } = usePermissions();
  const [activeStep, setActiveStep] = useState(0);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(false);

  // Check all permissions when dialog opens
  useEffect(() => {
    if (open) {
      setIsCheckingPermissions(true);
      Promise.all(
        requiredPermissions.map((permission) => checkPermission(permission))
      ).finally(() => {
        setIsCheckingPermissions(false);
      });
    }
  }, [open, requiredPermissions, checkPermission]);

  // Check if all required permissions are granted
  const allPermissionsGranted = requiredPermissions.every((permission) =>
    hasPermission(permission)
  );

  // Handle permission request for current step
  const handleRequestPermission = async () => {
    const permission = requiredPermissions[activeStep];
    if (permission) {
      const result = await requestPermission(permission);

      if (result === "granted") {
        // Move to next step or finish
        if (activeStep < requiredPermissions.length - 1) {
          setActiveStep(activeStep + 1);
        } else {
          // All permissions granted
          onPermissionsGranted?.();
        }
      }
    }
  };

  const handleNext = () => {
    setActiveStep(activeStep + 1);
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleFinish = () => {
    if (allPermissionsGranted) {
      onPermissionsGranted?.();
    }
    onClose();
  };

  const currentPermission = requiredPermissions[activeStep];
  const currentConfig = currentPermission
    ? permissionConfig[currentPermission]
    : null;
  const currentStatus = currentPermission
    ? permissions[currentPermission]
    : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: 400 },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          {title}
          <Badge
            badgeContent={
              requiredPermissions.filter((p) => hasPermission(p)).length
            }
            max={requiredPermissions.length}
            color="primary"
          >
            <Chip
              label={`${requiredPermissions.length} permissions`}
              size="small"
              variant="outlined"
            />
          </Badge>
        </Box>
      </DialogTitle>

      <DialogContent>
        {isCheckingPermissions ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            py={4}
          >
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Checking permissions...
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" paragraph>
              {description}
            </Typography>

            {/* Permission Overview */}
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Permission Status:
              </Typography>
              <List dense>
                {requiredPermissions.map((permission) => {
                  const config = permissionConfig[permission];
                  const status = permissions[permission];
                  const IconComponent = config.icon;

                  return (
                    <ListItem key={permission}>
                      <ListItemIcon>
                        <IconComponent />
                      </ListItemIcon>
                      <ListItemText
                        primary={config.label}
                        secondary={config.description}
                      />
                      <ListItemSecondaryAction>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getStatusIcon(status.status, status.isRequesting)}
                          <Chip
                            label={status.status}
                            size="small"
                            color={getStatusColor(status.status)}
                            variant="outlined"
                          />
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
            </Box>

            {/* Stepper for permission requests */}
            {!allPermissionsGranted && (
              <Stepper activeStep={activeStep} orientation="vertical">
                {requiredPermissions.map((permission, index) => {
                  const config = permissionConfig[permission];
                  const status = permissions[permission];
                  const IconComponent = config.icon;

                  return (
                    <Step key={permission}>
                      <StepLabel
                        icon={<IconComponent />}
                        error={status.status === "denied"}
                      >
                        {config.label}
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body2" paragraph>
                          {config.reason}
                        </Typography>

                        {status.error && (
                          <Alert severity="error" sx={{ mb: 2 }}>
                            {status.error}
                          </Alert>
                        )}

                        <Box sx={{ mb: 2 }}>
                          <Button
                            variant="contained"
                            onClick={handleRequestPermission}
                            disabled={
                              status.isRequesting || status.status === "granted"
                            }
                            startIcon={
                              status.isRequesting ? (
                                <CircularProgress size={16} />
                              ) : null
                            }
                          >
                            {status.status === "granted"
                              ? "Permission Granted"
                              : status.isRequesting
                                ? "Requesting..."
                                : "Grant Permission"}
                          </Button>

                          {index > 0 && (
                            <Button onClick={handleBack} sx={{ ml: 1 }}>
                              Back
                            </Button>
                          )}

                          {status.status === "granted" &&
                            index < requiredPermissions.length - 1 && (
                              <Button onClick={handleNext} sx={{ ml: 1 }}>
                                Next
                              </Button>
                            )}
                        </Box>
                      </StepContent>
                    </Step>
                  );
                })}
              </Stepper>
            )}

            {allPermissionsGranted && (
              <Alert severity="success">
                <Typography variant="body2">
                  All required permissions have been granted! You can now use
                  all features of this demo.
                </Typography>
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleFinish}
          variant="contained"
          disabled={!allPermissionsGranted}
        >
          {allPermissionsGranted ? "Continue" : "Skip for Now"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PermissionHandler;
