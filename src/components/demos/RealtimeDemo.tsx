import {
  useState,
  useEffect,
  useRef,
  type FC,
  type KeyboardEvent,
} from "react";
import {
  Container,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Box,
  Alert,
  IconButton,
  Divider,
  Paper,
  Badge,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Send as SendIcon,
  Circle as CircleIcon,
  Refresh as RefreshIcon,
  Chat as ChatIcon,
  People as PeopleIcon,
  LocationOn as LocationIcon,
  Sensors as SensorsIcon,
  ExpandMore as ExpandMoreIcon,
  Share as ShareIcon,
} from "@mui/icons-material";
import { useSocket } from "../../context/SocketContext";
import { useLocation } from "../../hooks/useLocation";
import { useMotionSensors } from "../../hooks/useMotionSensors";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  userName: string;
  timestamp: number;
}

interface SensorData {
  accelerometer?: {
    x: number;
    y: number;
    z: number;
  };
  gyroscope?: {
    alpha: number;
    beta: number;
    gamma: number;
  };
  isShaking: boolean;
  userName: string;
  timestamp: number;
}

interface RealtimeDemoProps {
  title?: string;
  description?: string;
}

const RealtimeDemo: FC<RealtimeDemoProps> = ({
  title = "Real-time Communication Demo",
  description = "Experience live chat and real-time data sharing using Socket.IO WebSocket connections.",
}) => {
  const socketContext = useSocket();
  const {
    isConnected,
    isConnecting,
    error,
    messages,
    users,
    currentRoom,
    currentUser,
    connect,
    disconnect,
    reconnect,
    sendMessage,
    joinRoom,
    setCurrentUser,
  } = socketContext;

  const [messageInput, setMessageInput] = useState("");
  const [userName, setUserName] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Location and sensor sharing state
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const [isSensorSharing, setIsSensorSharing] = useState(false);
  const [sharedLocations, setSharedLocations] = useState<
    Map<string, LocationData>
  >(new Map());
  const [sharedSensorData, setSharedSensorData] = useState<
    Map<string, SensorData>
  >(new Map());

  // Location and sensor hooks
  const location = useLocation();
  const motionSensors = useMotionSensors();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set up socket listeners for location and sensor data
  useEffect(() => {
    if (!isConnected) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const socketService = (socketContext as any).socketService;
    if (!socketService) return;

    // Listen for shared location data
    const handleLocationShare = (data: {
      userId: string;
      userName: string;
      location: LocationData;
      timestamp: number;
    }) => {
      setSharedLocations(
        (prev) =>
          new Map(
            prev.set(data.userId, {
              ...data.location,
              userName: data.userName,
              timestamp: data.timestamp,
            })
          )
      );
    };

    // Listen for shared sensor data
    const handleSensorShare = (data: {
      userId: string;
      userName: string;
      sensorData: SensorData;
      timestamp: number;
    }) => {
      setSharedSensorData(
        (prev) =>
          new Map(
            prev.set(data.userId, {
              ...data.sensorData,
              userName: data.userName,
              timestamp: data.timestamp,
            })
          )
      );
    };

    socketService.on("location-share", handleLocationShare);
    socketService.on("sensor-share", handleSensorShare);

    return () => {
      socketService.off("location-share", handleLocationShare);
      socketService.off("sensor-share", handleSensorShare);
    };
  }, [isConnected, socketContext]);

  // Share location data when enabled
  useEffect(() => {
    if (
      !isLocationSharing ||
      !isConnected ||
      !location.currentLocation ||
      !currentUser
    )
      return;

    const shareLocation = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const socketService = (socketContext as any).socketService;
      if (socketService) {
        socketService.emit("location-share", {
          userId: currentUser.id,
          userName: currentUser.name,
          location: location.currentLocation,
          timestamp: Date.now(),
        });
      }
    };

    const interval = setInterval(shareLocation, 5000); // Share every 5 seconds
    return () => clearInterval(interval);
  }, [
    isLocationSharing,
    isConnected,
    location.currentLocation,
    currentUser,
    socketContext,
  ]);

  // Share sensor data when enabled
  useEffect(() => {
    if (
      !isSensorSharing ||
      !isConnected ||
      !motionSensors.motionData ||
      !currentUser
    )
      return;

    const shareSensorData = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const socketService = (socketContext as any).socketService;
      if (socketService) {
        socketService.emit("sensor-share", {
          userId: currentUser.id,
          userName: currentUser.name,
          sensorData: motionSensors.motionData,
          timestamp: Date.now(),
        });
      }
    };

    const interval = setInterval(shareSensorData, 1000); // Share every second
    return () => clearInterval(interval);
  }, [
    isSensorSharing,
    isConnected,
    motionSensors.motionData,
    currentUser,
    socketContext,
  ]);

  // Generate a random user ID and name
  const generateUserInfo = () => {
    const adjectives = ["Cool", "Smart", "Happy", "Brave", "Quick", "Bright"];
    const nouns = ["User", "Developer", "Coder", "Tester", "Explorer"];
    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 1000);
    return `${randomAdjective}${randomNoun}${randomNumber}`;
  };

  // Initialize user and connect
  const handleJoinChat = async () => {
    if (!userName.trim()) return;

    try {
      // Set current user
      const user = {
        id: `user_${Date.now()}`,
        name: userName.trim(),
        status: "online" as const,
      };
      setCurrentUser(user);

      // Connect to socket
      await connect();

      // Join the demo room
      await joinRoom("showcase-demo");
      setIsJoined(true);
    } catch (err) {
      console.error("Failed to join chat:", err);
    }
  };

  // Leave chat
  const handleLeaveChat = () => {
    disconnect();
    setIsJoined(false);
    setUserName("");
  };

  // Send message
  const handleSendMessage = () => {
    if (!messageInput.trim() || !isConnected) return;

    sendMessage(messageInput.trim());
    setMessageInput("");
  };

  // Handle Enter key press
  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Handle location sharing toggle
  const handleLocationSharingToggle = async (enabled: boolean) => {
    if (enabled) {
      try {
        await location.requestPermission();
        if (location.hasPermission) {
          await location.startTracking();
          setIsLocationSharing(true);
        }
      } catch (error) {
        console.error("Failed to start location sharing:", error);
      }
    } else {
      location.stopTracking();
      setIsLocationSharing(false);
    }
  };

  // Handle sensor sharing toggle
  const handleSensorSharingToggle = async (enabled: boolean) => {
    if (enabled) {
      try {
        await motionSensors.requestPermission();
        if (motionSensors.permissionState === "granted") {
          motionSensors.startListening();
          setIsSensorSharing(true);
        }
      } catch (error) {
        console.error("Failed to start sensor sharing:", error);
      }
    } else {
      motionSensors.stopListening();
      setIsSensorSharing(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get user status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "success";
      case "away":
        return "warning";
      case "offline":
        return "error";
      default:
        return "default";
    }
  };

  // Connection status component
  const ConnectionStatus = () => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <CircleIcon
              sx={{
                color: isConnected ? "success.main" : "error.main",
                fontSize: 12,
              }}
            />
            <Typography variant="body2">
              {isConnected
                ? `Connected to ${currentRoom || "server"}`
                : isConnecting
                  ? "Connecting..."
                  : "Disconnected"}
            </Typography>
            {error && (
              <Chip
                label={error}
                color="error"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Badge badgeContent={users.length} color="primary">
              <PeopleIcon />
            </Badge>
            {!isConnected && (
              <IconButton
                size="small"
                onClick={reconnect}
                disabled={isConnecting}
              >
                <RefreshIcon />
              </IconButton>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Join form component
  const JoinForm = () => (
    <Card>
      <CardHeader title={title} subheader={description} avatar={<ChatIcon />} />
      <CardContent>
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder={generateUserInfo()}
            fullWidth
            onKeyPress={(e) => e.key === "Enter" && handleJoinChat()}
          />
          <Button
            variant="contained"
            onClick={handleJoinChat}
            disabled={!userName.trim() || isConnecting}
            startIcon={<ChatIcon />}
          >
            {isConnecting ? "Connecting..." : "Join Chat"}
          </Button>
          <Alert severity="info">
            Enter your name to join the real-time chat demo. You'll be connected
            with other users currently viewing this page.
          </Alert>
        </Box>
      </CardContent>
    </Card>
  );

  // Chat interface component
  const ChatInterface = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <ConnectionStatus />

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
        }}
      >
        <Box sx={{ flex: { md: 2 } }}>
          <Card>
            <CardHeader
              title="Live Chat"
              subheader={`${messages.length} messages`}
              action={
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleLeaveChat}
                  color="error"
                >
                  Leave Chat
                </Button>
              }
            />
            <CardContent>
              <Paper
                sx={{
                  height: 400,
                  overflow: "auto",
                  p: 1,
                  mb: 2,
                  backgroundColor: "grey.50",
                }}
              >
                {messages.length === 0 ? (
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    height="100%"
                  >
                    <Typography color="text.secondary">
                      No messages yet. Start the conversation!
                    </Typography>
                  </Box>
                ) : (
                  <List dense>
                    {messages.map((message, index) => (
                      <ListItem
                        key={`${message.timestamp}-${index}`}
                        alignItems="flex-start"
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {message.user.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle2" component="span">
                                {message.user}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {formatTime(message.timestamp)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {message.content}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                    <div ref={messagesEndRef} />
                  </List>
                )}
              </Paper>

              <Box display="flex" gap={1}>
                <TextField
                  fullWidth
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={!isConnected}
                  multiline
                  maxRows={3}
                />
                <IconButton
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || !isConnected}
                  color="primary"
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: { md: 1 } }}>
          <Card>
            <CardHeader
              title="Online Users"
              subheader={`${users.length} connected`}
            />
            <CardContent>
              {users.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  No other users online
                </Typography>
              ) : (
                <List dense>
                  {users.map((user) => (
                    <ListItem key={user.id}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {user.name.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.name}
                        secondary={
                          <Chip
                            label={user.status}
                            size="small"
                            color={getStatusColor(user.status)}
                            variant="outlined"
                          />
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}

              {currentUser && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      You are:
                    </Typography>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {currentUser.name.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={currentUser.name}
                        secondary={
                          <Chip
                            label={currentUser.status}
                            size="small"
                            color={getStatusColor(currentUser.status)}
                            variant="filled"
                          />
                        }
                      />
                    </ListItem>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Location and Sensor Sharing */}
      <Box>
        <Card>
          <CardHeader
            title="Real-time Data Sharing"
            subheader="Share your location and sensor data with other users"
            avatar={<ShareIcon />}
          />
          <CardContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Location Sharing Controls */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocationIcon />
                    <Typography>Location Sharing</Typography>
                    <Chip
                      label={isLocationSharing ? "Active" : "Inactive"}
                      color={isLocationSharing ? "success" : "default"}
                      size="small"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isLocationSharing}
                          onChange={(e) =>
                            handleLocationSharingToggle(e.target.checked)
                          }
                          disabled={!location.isSupported}
                        />
                      }
                      label="Share my location with other users"
                    />

                    {location.currentLocation && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Your Current Location:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Lat: {location.currentLocation.latitude.toFixed(6)},
                          Lng: {location.currentLocation.longitude.toFixed(6)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Accuracy: ±
                          {location.currentLocation.accuracy.toFixed(0)}m
                        </Typography>
                      </Box>
                    )}

                    {sharedLocations.size > 0 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Other Users' Locations:
                        </Typography>
                        <List dense>
                          {Array.from(sharedLocations.entries()).map(
                            ([userId, locationData]) => (
                              <ListItem key={userId}>
                                <ListItemAvatar>
                                  <Avatar sx={{ width: 32, height: 32 }}>
                                    <LocationIcon fontSize="small" />
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={locationData.userName}
                                  secondary={
                                    <Box>
                                      <Typography
                                        variant="caption"
                                        display="block"
                                      >
                                        Lat: {locationData.latitude?.toFixed(6)}
                                        , Lng:{" "}
                                        {locationData.longitude?.toFixed(6)}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {new Date(
                                          locationData.timestamp
                                        ).toLocaleTimeString()}
                                      </Typography>
                                    </Box>
                                  }
                                />
                              </ListItem>
                            )
                          )}
                        </List>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Sensor Sharing Controls */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <SensorsIcon />
                    <Typography>Motion Sensor Sharing</Typography>
                    <Chip
                      label={isSensorSharing ? "Active" : "Inactive"}
                      color={isSensorSharing ? "success" : "default"}
                      size="small"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isSensorSharing}
                          onChange={(e) =>
                            handleSensorSharingToggle(e.target.checked)
                          }
                          disabled={!motionSensors.isSupported}
                        />
                      }
                      label="Share my motion sensor data with other users"
                    />

                    {motionSensors.motionData.accelerometer && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Your Motion Data:
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                          }}
                        >
                          <Box>
                            <Typography variant="body2">
                              Accelerometer: X:{" "}
                              {motionSensors.motionData.accelerometer.x.toFixed(
                                2
                              )}
                              , Y:{" "}
                              {motionSensors.motionData.accelerometer.y.toFixed(
                                2
                              )}
                              , Z:{" "}
                              {motionSensors.motionData.accelerometer.z.toFixed(
                                2
                              )}
                            </Typography>
                          </Box>
                          {motionSensors.motionData.gyroscope && (
                            <Box>
                              <Typography variant="body2">
                                Orientation: α:{" "}
                                {motionSensors.motionData.gyroscope.alpha.toFixed(
                                  1
                                )}
                                °, β:{" "}
                                {motionSensors.motionData.gyroscope.beta.toFixed(
                                  1
                                )}
                                °, γ:{" "}
                                {motionSensors.motionData.gyroscope.gamma.toFixed(
                                  1
                                )}
                                °
                              </Typography>
                            </Box>
                          )}
                          {motionSensors.motionData.isShaking && (
                            <Chip
                              label="Shaking Detected!"
                              color="warning"
                              size="small"
                            />
                          )}
                        </Box>
                      </Box>
                    )}

                    {sharedSensorData.size > 0 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Other Users' Motion Data:
                        </Typography>
                        <List dense>
                          {Array.from(sharedSensorData.entries()).map(
                            ([userId, sensorData]) => (
                              <ListItem key={userId}>
                                <ListItemAvatar>
                                  <Avatar sx={{ width: 32, height: 32 }}>
                                    <SensorsIcon fontSize="small" />
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={sensorData.userName}
                                  secondary={
                                    <Box>
                                      {sensorData.accelerometer && (
                                        <Typography
                                          variant="caption"
                                          display="block"
                                        >
                                          Accel: X:
                                          {sensorData.accelerometer.x?.toFixed(
                                            1
                                          )}
                                          , Y:
                                          {sensorData.accelerometer.y?.toFixed(
                                            1
                                          )}
                                          , Z:
                                          {sensorData.accelerometer.z?.toFixed(
                                            1
                                          )}
                                        </Typography>
                                      )}
                                      {sensorData.isShaking && (
                                        <Chip
                                          label="Shaking!"
                                          color="warning"
                                          size="small"
                                        />
                                      )}
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {new Date(
                                          sensorData.timestamp
                                        ).toLocaleTimeString()}
                                      </Typography>
                                    </Box>
                                  }
                                />
                              </ListItem>
                            )
                          )}
                        </List>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {!isJoined ? <JoinForm /> : <ChatInterface />}
    </Container>
  );
};

export default RealtimeDemo;
