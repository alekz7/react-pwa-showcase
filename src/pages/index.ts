import React from "react";

// Export all page components for easier imports
export { default as Home } from "./Home";
export { default as CameraDemo } from "./CameraDemo";
export { default as MicrophoneDemo } from "./MicrophoneDemo";
export { default as NotFound } from "./NotFound";

// File System Demo
export { default as FileSystemDemo } from "./FileSystemDemo";
export const MotionSensorsDemo = () =>
  React.createElement("div", null, "Motion Sensors Demo - Coming Soon");
export const LocationDemo = () =>
  React.createElement("div", null, "Location Demo - Coming Soon");
export const RealtimeDemo = () =>
  React.createElement("div", null, "Real-time Demo - Coming Soon");
export const PWAFeaturesDemo = () =>
  React.createElement("div", null, "PWA Features Demo - Coming Soon");
