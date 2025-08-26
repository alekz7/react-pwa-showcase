import React from "react";

// Export all page components for easier imports
export { default as Home } from "./Home";
export { default as CameraDemo } from "./CameraDemo";
export { default as MicrophoneDemo } from "./MicrophoneDemo";
export { default as NotFound } from "./NotFound";

// File System Demo
export { default as FileSystemDemo } from "./FileSystemDemo";
// Motion Sensors Demo
export { default as MotionSensorsDemo } from "./MotionSensorsDemo";
// Location Demo
export { default as LocationDemo } from "./LocationDemo";
export { default as RealtimeDemo } from "../components/demos/RealtimeDemo";
export const PWAFeaturesDemo = () =>
  React.createElement("div", null, "PWA Features Demo - Coming Soon");
