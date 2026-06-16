---
name: websdk-integration
description: Integration guide for OmniRTC WebSDK, a unified WebRTC SDK supporting real-time audio/video communication and AI capabilities (AIGC). Use when implementing WebRTC features such as video calls, audio calls, screen sharing, or AI voice/avatar assistants. Triggers when user mentions integrating websdk, omnirtc-web, implementing video/audio calls, screen sharing, or AI voice chat using this specific SDK.
---

# WebSDK Integration Guide

OmniRTC WebSDK is a unified WebRTC SDK supporting multiple engines (Agora, VolcEngine, Core) with real-time audio/video, screen sharing, and AIGC capabilities.

## Integration Decision Tree

```
User Request
├─ Need video/audio calls?
│  ├─ Basic 1-on-1 or group calls → See "Video Call Integration"
│  ├─ Live streaming (host/audience) → Use mode: 'live'
│  └─ Audio only → Create audio tracks only
│
├─ Need screen sharing?
│  ├─ Screen share only → See "Screen Sharing Integration"
│  ├─ Screen + camera → Publish both video tracks
│  └─ Include system audio → Use 'enable' option
│
├─ Need AI capabilities?
│  ├─ Voice assistant → See "AI Voice Chat Integration"
│  ├─ With avatar → Use 'avatarchat' task type
│  ├─ With vision → Use 'visionchat' task type
│  └─ Speech-to-text only → Use 'asr' task type
│
└─ Custom requirements → See references/ for detailed docs
```

## Video Call Integration

**Critical**: Set up event handlers **before** `client.join()`, or you'll miss initial user-published events.

```typescript
import { getRTCInstance } from 'omnirtc-web';

const engine = getRTCInstance(token);
const client = engine.createClient({ mode: 'rtc', codec: 'h264' });

// Setup events BEFORE join
client.on('user-published', async (user, mediaType) => {
  const track = await client.subscribe(user, mediaType);
  // DOM element must exist in document BEFORE calling play()
  mediaType === 'video' ? track.play('video-div') : track.play();
});

client.on('user-left', (user) => { /* handle cleanup */ });

await client.join();

// Create and publish local tracks
const [audio, video] = await engine.createMicrophoneAndCameraTracks(
  { AEC: true, ANS: true },   // Echo cancellation + noise suppression
  { encoderConfig: '720p' }
);
video.play('local-video');    // DOM element must exist before this call
await client.publish([audio, video]);
```

**Cleanup**:
```typescript
await client.unpublish();
audioTrack.close();
videoTrack.close();
await client.leave();
```

For complete implementation with mute/device switching: [assets/basic-video-call.ts](./assets/basic-video-call.ts)
For advanced API (events, quality config, error codes): [references/webrtc-integration.md](./references/webrtc-integration.md)

## Screen Sharing Integration

```typescript
// Screen only
const screenTrack = await engine.createScreenVideoTrack({
  encoderConfig: '1080p',
  optimizationMode: 'detail'  // Use 'detail' for text clarity, not 'motion'
}, 'disable');

// Handle user stopping share via browser button
screenTrack.on('track-ended', () => { /* update UI */ });
await client.publish(screenTrack);

// With system audio: returns [videoTrack, audioTrack]
const [screenVideo, screenAudio] = await engine.createScreenVideoTrack({
  encoderConfig: '1080p',
  optimizationMode: 'detail'
}, 'enable');
await client.publish([screenVideo, screenAudio]);
```

For screen + camera combination: [assets/screen-sharing.ts](./assets/screen-sharing.ts)

## AI Voice Chat Integration

**Prerequisites** (in order):
1. RTC client must join room first
2. Publish microphone with `AEC: true` (AI won't hear user otherwise)
3. Token must include `engineConfig.adaptAppId`
4. Call `aigc.bind(client)` before `aigc.start()`

```typescript
import { Aigc, Events, TaskTypeEnum } from 'omnirtc-web/aigc';

// 1. Setup RTC
const engine = getRTCInstance(token);  // token must have adaptAppId
const client = engine.createClient({ mode: 'rtc', codec: 'h264' });
await client.join();

// 2. Publish mic (required — AI must hear user)
const audioTrack = await engine.createMicrophoneAudioTrack({ AEC: true, ANS: true });
await client.publish(audioTrack);

// 3. Initialize AIGC
const aigc = new Aigc(token);
aigc.bind(client);  // Must bind before start()

aigc.on(Events.MESSAGE, (data) => {
  if (data.type === 'asr') {
    // data.msg.ev: 'se' = final result, 'sm' = partial result
    // data.msg.rs.tx = transcript text
    console.log(data.msg.ev === 'se' ? '[Final]' : '[Partial]', data.msg.rs.tx);
  }
});

// 4. Start AI task
const robotId = Math.random().toString().substring(2, 10);
await aigc.start('voicechat', {
  prompt: 'You are a helpful assistant.',
  welcome: 'Hello! How can I help?'
}, robotId);
```

**Task types**: `'asr'` | `'voicechat'` | `'visionchat'` | `'avatarchat'`

**Dynamic updates during session**:
```typescript
// Update system prompt
await aigc.update(TaskTypeEnum.UPDATE_PROMPT, { prompt: 'Now be a math tutor.' });

// Interrupt AI response
await aigc.update(TaskTypeEnum.BREAK_AI_RESPONSE, null);

// Make AI speak specific content
await aigc.update(TaskTypeEnum.BROADCAST_CONTENT, { content: 'Please wait.' });

// Send text to AI (bypass voice)
await aigc.update(TaskTypeEnum.SEND_CONTENT_TO_LLM, { prompt: 'What is 2+2?' });
```

For complete implementation: [assets/ai-voice-assistant.ts](./assets/ai-voice-assistant.ts)
For all config options, message formats, advanced patterns: [references/aigc-integration.md](./references/aigc-integration.md)

## Common Operations

### Mute / Device Switching
```typescript
await audioTrack.setMuted(true);           // Mute (keeps track active)
await audioTrack.setEnabled(false);        // Disable (stops track)

const cameras = await engine.getCameras();
await videoTrack.setDevice(cameras[1].deviceId);
```

### Token Renewal
```typescript
client.on('token-privilege-will-expire', async () => {
  await client.renewToken(await fetchFromServer());
});
```

### Autoplay Handling
```typescript
engine.onAudioAutoplayFailed = () => {
  // Show UI prompting user to click/tap, then retry track.play()
};
```

## Error Handling

```typescript
// RTC errors
try {
  await client.join();
} catch (error) {
  if (error.code === 'PERMISSION_DENIED') { /* camera/mic denied */ }
  else if (error.code === 'NETWORK_ERROR') { /* network issue */ }
}

// AIGC errors
try {
  await aigc.start('voicechat', config, robotId);
} catch (error) {
  if (error.message.includes('adaptAppId')) { /* token missing field */ }
  else if (error.message.includes('already started')) {
    await aigc.stop();  // Stop existing task first
  }
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No remote video/audio | Events must be set up before `client.join()`; DOM element must exist before `track.play(id)` |
| Echo in audio | Enable `AEC: true` in `createMicrophoneAudioTrack()` |
| AI not hearing user | Verify mic published + `AEC: true` + `aigc.bind(client)` called before start |
| AIGC token error | Token needs `engineConfig.adaptAppId`; different from standard RTC token |
| Screen share blurry | Use `'1080p'` + `optimizationMode: 'detail'` (not `'motion'`) |
| Video play silent/fail | DOM element must be rendered and attached to document before `track.play(id)` |

## Resources

### Code Templates
- [basic-video-call.ts](./assets/basic-video-call.ts) — Complete video call with mute/device switching/cleanup
- [ai-voice-assistant.ts](./assets/ai-voice-assistant.ts) — AI voice assistant with dynamic prompts and message handling
- [screen-sharing.ts](./assets/screen-sharing.ts) — Screen sharing with system audio and camera options

### Reference Documentation
- [webrtc-integration.md](./references/webrtc-integration.md) — Full WebRTC API: all methods, events, quality config, advanced features
- [aigc-integration.md](./references/aigc-integration.md) — Full AIGC guide: all task types, message formats, config options, examples
