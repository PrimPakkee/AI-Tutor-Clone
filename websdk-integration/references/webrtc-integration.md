# WebRTC Integration Reference

## Table of Contents
- [Overview](#overview)
- [SDK Initialization](#sdk-initialization)
- [Client Creation and Configuration](#client-creation-and-configuration)
- [Event Handling](#event-handling)
- [Joining and Leaving Rooms](#joining-and-leaving-rooms)
- [Publishing Media](#publishing-media)
- [Screen Sharing](#screen-sharing)
- [Subscribing to Remote Media](#subscribing-to-remote-media)
- [Track Management](#track-management)
- [Audio/Video Settings](#audiovideo-settings)
- [Statistics and Monitoring](#statistics-and-monitoring)
- [Error Handling](#error-handling)
- [Device Management](#device-management)
- [Advanced Features](#advanced-features)
- [Browser Compatibility](#browser-compatibility)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)

## Overview

OmniRTC is a unified WebRTC SDK that supports multiple engines (Agora, VolcEngine, Core). It provides real-time audio/video communication capabilities with a consistent API.

## SDK Initialization

### Getting RTC Instance

The SDK uses a token-based initialization. The token contains engine type, app ID, room ID, and authentication information.

```typescript
import { getRTCInstance } from 'omnirtc-web';

// Token should be obtained from backend
const token = 'YOUR_JWT_TOKEN';
const engine = getRTCInstance(token);
```

**Token Structure**: JWT containing:
- `type`: Engine type (Agora/Core/VolcEngine)
- `appid`: Application ID
- `roomStr`: Room identifier
- `user`: User ID
- `attachToken` or `token`: SDK authentication token
- `planid`: Plan identifier

## Client Creation and Configuration

### Create Client

```typescript
const client = engine.createClient({
  mode: 'live',        // 'live' or 'rtc'
  codec: 'h264',       // 'h264', 'vp8', 'vp9', 'av1'
  role: 'host'         // 'host' or 'audience' (for live mode)
});
```

**Mode Options**:
- `rtc`: Real-time communication (all participants can publish)
- `live`: Live broadcasting (hosts publish, audience subscribes)

**Codec Options**: h264 (recommended), vp8, vp9, av1

## Event Handling

### Essential Events

```typescript
// User joined the room
client.on('user-joined', (user) => {
  console.log('User joined:', user.uid);
});

// User left the room
client.on('user-left', (user, reason) => {
  console.log('User left:', user.uid, reason);
});

// Remote user published media
client.on('user-published', async (user, mediaType) => {
  console.log('User published:', user.uid, mediaType);

  // Subscribe to the track
  const track = await client.subscribe(user, mediaType);

  if (mediaType === 'audio') {
    track.play();
  } else if (mediaType === 'video') {
    track.play('video-container-id');
  }
});

// Remote user unpublished media
client.on('user-unpublished', (user, mediaType) => {
  console.log('User unpublished:', user.uid, mediaType);
});

// Connection state changes
client.on('connection-state-change', (curState, prevState, reason) => {
  console.log('Connection state:', curState);
});
```

**Media Types**: 'audio', 'video', 'screen'

## Joining and Leaving Rooms

### Join Room

```typescript
try {
  const uid = await client.join();
  console.log('Joined with UID:', uid);
} catch (error) {
  console.error('Failed to join:', error);
}
```

### Leave Room

```typescript
await client.leave();
```

## Publishing Media

### Create and Publish Audio/Video Tracks

```typescript
// Create microphone and camera tracks
const tracks = await engine.createMicrophoneAndCameraTracks();
const [audioTrack, videoTrack] = tracks;

// Play local video preview
videoTrack.play('local-video-container');

// Publish to room (must call after client.join)
await client.publish(tracks);
```

### Create Individual Tracks

```typescript
// Audio only
const audioTrack = await engine.createMicrophoneAudioTrack({
  encoderConfig: 'high_quality',
  AEC: true,    // Acoustic Echo Cancellation
  AGC: true,    // Automatic Gain Control
  ANS: true,    // Automatic Noise Suppression
  microphoneId: 'device-id'  // Optional
});

// Video only
const videoTrack = await engine.createCameraVideoTrack({
  encoderConfig: '720p',
  facingMode: 'user',  // 'user' or 'environment'
  cameraId: 'device-id',
  optimizationMode: 'motion'  // 'motion' or 'detail'
});
```

### Video Encoder Presets

Common presets: '360p', '480p', '720p', '1080p', '720p_1', '1080p_1'

### Audio Encoder Presets

- `speech_low_quality`: Low bitrate speech
- `speech_standard`: Standard speech
- `music_standard`: Music quality
- `high_quality`: High quality audio
- `high_quality_stereo`: High quality stereo

## Screen Sharing

```typescript
// Without audio
const screenTrack = await engine.createScreenVideoTrack({
  encoderConfig: '1080p',
  optimizationMode: 'detail'
}, 'disable');

// With audio (system audio)
const [screenVideoTrack, screenAudioTrack] = await engine.createScreenVideoTrack({
  encoderConfig: '1080p',
  optimizationMode: 'detail'
}, 'enable');

// Publish screen tracks
await client.publish([screenVideoTrack, screenAudioTrack]);
```

## Subscribing to Remote Media

### Manual Subscription

```typescript
client.on('user-published', async (user, mediaType) => {
  // Subscribe to specific media type
  const track = await client.subscribe(user, mediaType);

  if (mediaType === 'audio') {
    track.play();
  } else if (mediaType === 'video' || mediaType === 'screen') {
    track.play('remote-video-container');
  }
});
```

### Unsubscribe

```typescript
// Unsubscribe from specific media type
await client.unsubscribe(user, 'video');

// Unsubscribe from all media
await client.unsubscribe(user);
```

## Track Management

### Mute/Unmute Local Tracks

```typescript
// Mute/unmute (stops sending but keeps track active)
await audioTrack.setMuted(true);
await videoTrack.setMuted(false);

// Enable/disable (completely stops the track)
await audioTrack.setEnabled(false);
await videoTrack.setEnabled(true);
```

### Close Tracks

```typescript
// Close and release resources
audioTrack.close();
videoTrack.close();
```

### Change Device

```typescript
// Get available devices
const cameras = await engine.getCameras();
const microphones = await engine.getMicrophones();

// Switch device
await videoTrack.setDevice(cameras[1].deviceId);
await audioTrack.setDevice(microphones[0].deviceId);
```

## Audio/Video Settings

### Volume Control

```typescript
// Set local audio volume (0-100)
audioTrack.setVolume(50);

// Set remote audio volume
remoteAudioTrack.setVolume(80);

// Get volume level
const level = audioTrack.getVolumeLevel();
```

### Video Player Configuration

```typescript
videoTrack.play('container-id', {
  mirror: true,           // Mirror the video
  fit: 'cover'           // 'cover', 'contain', 'fill'
});
```

## Statistics and Monitoring

### Get RTC Stats

```typescript
const stats = client.getRTCStats();
console.log('Duration:', stats.Duration);
console.log('Send bitrate:', stats.SendBitrate);
console.log('Recv bitrate:', stats.RecvBitrate);
console.log('RTT:', stats.RTT);
console.log('User count:', stats.UserCount);
```

### Track Stats

```typescript
// Local audio stats
const localAudioStats = client.getLocalAudioStats();

// Local video stats
const localVideoStats = client.getLocalVideoStats();

// Remote stats (keyed by uid)
const remoteAudioStats = client.getRemoteAudioStats();
const remoteVideoStats = client.getRemoteVideoStats();
```

## Error Handling

### Autoplay Restrictions

Browsers restrict autoplay. Handle autoplay failures:

```typescript
engine.onAudioAutoplayFailed = () => {
  console.log('Audio autoplay failed');
  // Show UI to prompt user interaction
  // After user interaction, call track.play() again
};

engine.onAutoplayFailed = () => {
  console.log('Autoplay failed');
};
```

### Error Events

```typescript
client.on('exception', (event) => {
  console.error('Exception:', event.code, event.msg, event.uid);
});
```

## Device Management

### List Devices

```typescript
const devices = await engine.getDevices();
const cameras = await engine.getCameras();
const microphones = await engine.getMicrophones();
const speakers = await engine.getPlaybackDevices();
```

### Device Change Events

```typescript
engine.onCameraChanged = (deviceInfo) => {
  console.log('Camera changed:', deviceInfo.device);
};

engine.onMicrophoneChanged = (deviceInfo) => {
  console.log('Microphone changed:', deviceInfo.device);
};

engine.onPlaybackDeviceChanged = (deviceInfo) => {
  console.log('Speaker changed:', deviceInfo.device);
};
```

## Advanced Features

### Volume Indicator

```typescript
client.enableAudioVolumeIndicator();

client.on('volume-indicator', (volumes) => {
  volumes.forEach(({ uid, level }) => {
    console.log(`User ${uid} volume: ${level}`);
  });
});
```

### Token Renewal

```typescript
client.on('token-privilege-will-expire', async () => {
  const newToken = await fetchNewTokenFromServer();
  await client.renewToken(newToken);
});

client.on('token-privilege-did-expire', async () => {
  console.log('Token expired, renewing...');
  const newToken = await fetchNewTokenFromServer();
  await client.renewToken(newToken);
});
```

### Client Role (Live Mode)

```typescript
// Switch between host and audience
await client.setClientRole('audience', {
  level: 1  // AudienceLatencyLevelType
});

await client.setClientRole('host');
```

## Browser Compatibility

### Check System Requirements

```typescript
const isSupported = engine.checkSystemRequirements();
if (!isSupported) {
  console.warn('Browser not supported');
}
```

### Get Supported Codecs

```typescript
const codecs = await engine.getSupportedCodec();
console.log('Video codecs:', codecs.video);
console.log('Audio codecs:', codecs.audio);
```

## Best Practices

1. **Always handle events**: Set up event listeners before joining
2. **Error handling**: Wrap async calls in try-catch blocks
3. **Resource cleanup**: Close tracks and leave room when done
4. **Autoplay handling**: Provide UI for user interaction if autoplay fails
5. **Token management**: Monitor token expiration and renew proactively
6. **Device permissions**: Request permissions before creating tracks
7. **Network quality**: Monitor connection state and network quality
8. **Statistics**: Use stats for debugging and quality monitoring

## Common Patterns

### Basic Video Call

```typescript
import { getRTCInstance } from 'omnirtc-web';

async function startVideoCall(token: string, containerId: string) {
  const engine = getRTCInstance(token);
  const client = engine.createClient({
    mode: 'rtc',
    codec: 'h264'
  });

  // Setup events
  client.on('user-published', async (user, mediaType) => {
    const track = await client.subscribe(user, mediaType);
    if (mediaType === 'video') {
      track.play(containerId);
    } else {
      track.play();
    }
  });

  // Join room
  await client.join();

  // Create and publish local tracks
  const [audioTrack, videoTrack] = await engine.createMicrophoneAndCameraTracks();
  videoTrack.play('local-video');
  await client.publish([audioTrack, videoTrack]);

  return { client, audioTrack, videoTrack };
}
```

### Cleanup Function

```typescript
async function cleanup(client, tracks) {
  // Unpublish tracks
  await client.unpublish();

  // Close tracks
  tracks.forEach(track => track.close());

  // Leave room
  await client.leave();
}
```
