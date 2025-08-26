// Note: Components are now lazy-loaded in App.tsx for better performance
// This file is kept for potential future non-lazy imports if needed

// Core pages that might need eager loading
export { default as Home } from "./Home";
export { default as NotFound } from "./NotFound";

// Demo components are lazy-loaded in App.tsx to reduce initial bundle size
// Uncomment these exports if you need eager loading for any component:
// export { default as CameraDemo } from "./CameraDemo";
// export { default as MicrophoneDemo } from "./MicrophoneDemo";
// export { default as FileSystemDemo } from "./FileSystemDemo";
// export { default as MotionSensorsDemo } from "./MotionSensorsDemo";
// export { default as LocationDemo } from "./LocationDemo";
// export { default as RealtimeDemo } from "../components/demos/RealtimeDemo";
// export { default as PWAFeaturesDemo } from "../components/demos/PWAFeaturesDemo";
