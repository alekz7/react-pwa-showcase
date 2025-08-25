import React from "react";
import { Box, Chip, Badge, Tooltip, IconButton } from "@mui/material";
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
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { usePermissions } from "../hooks/usePermissions";
import type { PermissionName, PermissionState } from "../hooks/usePermissions";

interface PermissionStatusIndicatorProps {
  permissions?: PermissionName[];
  showLabels?: boolean;
  size?: "small" | "medium";
  onPermissionClick?: (permission: PermissionName) => void;
  onSettingsClick?: () => void;
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
  accelerometer: "Motion",
  gyroscope: "Orientation",
  magnetometer: "Compass",
};

const getStateIcon = (
  state: PermissionState,
  size: "small" | "medium" = "small"
) => {
  const iconProps = { fontSize: size };

  switch (state) {
    case "granted":
      return <GrantedIcon color="success" {...iconProps} />;
    case "denied":
      return <DeniedIcon color="error" {...iconProps} />;
    case "prompt":
      return <PromptIcon color="info" {...iconProps} />;
    case "unsupported":
      return <UnsupportedIcon color="disabled" {...iconProps} />;
    default:
      return <PromptIcon color="disabled" {...iconProps} />;
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

const getTooltipText = (
  name: PermissionName,
  state: PermissionState
): string => {
  const label = PERMISSION_LABELS[name];

  switch (state) {
    case "granted":
      return `${label} permission granted`;
    case "denied":
      return `${label} permission denied - click to see instructions`;
    case "prompt":
      return `${label} permission not requested - click to request`;
    case "unsupported":
      return `${label} not supported on this device`;
    default:
      return `${label} permission status unknown`;
  }
};

export const PermissionStatusIndicator: React.FC<
  PermissionStatusIndicatorProps
> = ({
  permissions: permissionFilter,
  showLabels = false,
  size = "small",
  onPermissionClick,
  onSettingsClick,
}) => {
  const { permissions } = usePermissions();

  // Filter permissions to show
  const permissionsToShow =
    permissionFilter || (Object.keys(permissions) as PermissionName[]);
  const relevantPermissions = permissionsToShow
    .map((name) => ({ ...permissions[name], name }))
    .filter((p) => p.isSupported); // Only show supported permissions

  const grantedCount = relevantPermissions.filter(
    (p) => p.state === "granted"
  ).length;
  const deniedCount = relevantPermissions.filter(
    (p) => p.state === "denied"
  ).length;
  const totalCount = relevantPermissions.length;

  if (totalCount === 0) {
    return null;
  }

  return (
    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
      {relevantPermissions.map((permission) => (
        <Tooltip
          key={permission.name}
          title={getTooltipText(permission.name, permission.state)}
          arrow
        >
          <Chip
            icon={PERMISSION_ICONS[permission.name]}
            label={showLabels ? PERMISSION_LABELS[permission.name] : undefined}
            size={size}
            color={getStateColor(permission.state)}
            variant={permission.state === "granted" ? "filled" : "outlined"}
            onClick={() => onPermissionClick?.(permission.name)}
            clickable={!!onPermissionClick}
            sx={{
              cursor: onPermissionClick ? "pointer" : "default",
              "& .MuiChip-icon": {
                fontSize: size === "small" ? "1rem" : "1.25rem",
              },
            }}
          />
        </Tooltip>
      ))}

      {/* Summary badge */}
      {totalCount > 3 && (
        <Tooltip
          title={`${grantedCount}/${totalCount} permissions granted`}
          arrow
        >
          <Badge
            badgeContent={`${grantedCount}/${totalCount}`}
            color={
              grantedCount === totalCount
                ? "success"
                : deniedCount > 0
                  ? "error"
                  : "info"
            }
            max={999}
          >
            <Chip
              icon={getStateIcon(
                grantedCount === totalCount ? "granted" : "prompt",
                size
              )}
              label="Permissions"
              size={size}
              variant="outlined"
              onClick={onSettingsClick}
              clickable={!!onSettingsClick}
            />
          </Badge>
        </Tooltip>
      )}

      {/* Settings button */}
      {onSettingsClick && (
        <Tooltip title="Manage permissions" arrow>
          <IconButton
            size={size}
            onClick={onSettingsClick}
            sx={{
              ml: 1,
              color: "text.secondary",
              "&:hover": {
                color: "primary.main",
              },
            }}
          >
            <SettingsIcon fontSize={size} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default PermissionStatusIndicator;
