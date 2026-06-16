# AIGC Integration Reference

## Table of Contents
- [Overview](#overview)
- [Installation and Import](#installation-and-import)
- [Initialization](#initialization)
- [Query Configuration](#query-configuration)
- [Starting AIGC Tasks](#starting-aigc-tasks)
- [Receiving AIGC Messages](#receiving-aigc-messages)
- [ASR Message Format](#asr-message-format)
- [Updating AIGC Tasks](#updating-aigc-tasks)
- [Stopping AIGC](#stopping-aigc)
- [Complete Integration Example](#complete-integration-example)
- [Task Types Reference](#task-types-reference)
- [Configuration Object Types](#configuration-object-types)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Common Issues](#common-issues)
- [Advanced Patterns](#advanced-patterns)

## Overview

The AIGC (AI Generated Content) module extends OmniRTC with AI capabilities including:
- **ASR** (Automatic Speech Recognition): Speech-to-text
- **Voice Chat**: Voice-based AI conversation with TTS
- **Vision Chat**: Multimodal AI conversation with vision capabilities
- **Avatar Chat**: Digital human with voice and visual interaction

## Installation and Import

```typescript
import { getRTCInstance } from 'omnirtc-web';
import { Aigc, TaskTypeEnum, Events } from 'omnirtc-web/aigc';
```

**Important**: AIGC requires RTC to be properly initialized and connected first.

## Initialization

### Create AIGC Instance

```typescript
// Use the SAME token as RTC
const token = 'YOUR_JWT_TOKEN';
const aigc = new Aigc(token);
```

**Critical**: The token must contain `engineConfig.adaptAppId` for AIGC to work.

## Query Configuration

Before starting an AIGC task, query available configurations:

```typescript
const configs = await aigc.query();
console.log('Available AIGC configs:', configs);
```

This returns backend-configured options for ASR, LLM, TTS, and Avatar vendors.

## Starting AIGC Tasks

### ASR (Speech Recognition)

```typescript
const robotId = Math.random().toString().substring(2, 10);

const asrConfig = {
  vendor: 1  // ASR vendor ID from query()
};

await aigc.start('asr', asrConfig, robotId);
```

### Voice Chat

Voice chat combines ASR + LLM + TTS for voice-based AI conversation.

```typescript
const robotId = Math.random().toString().substring(2, 10);

const voiceChatConfig = {
  asrConfig: 1,     // ASR vendor ID (optional)
  llmConfig: 1,     // LLM vendor ID (optional)
  ttsConfig: 1,     // TTS vendor ID (optional)
  prompt: 'You are a helpful math tutor. Help me with my homework.',
  welcome: 'Hello! How can I help you with math today?'
};

// Optional: Additional parameters
const options = {
  extenParams: {
    customField: 'value'
  }
};

await aigc.start('voicechat', voiceChatConfig, robotId, options);
```

**Config Fields**:
- `asrConfig`: ASR configuration ID (optional, uses default if not provided)
- `llmConfig`: LLM configuration ID (optional)
- `ttsConfig`: TTS configuration ID (optional)
- `prompt`: System prompt for the AI (optional, uses backend default if empty)
- `welcome`: Initial greeting message (optional)

### Vision Chat

Similar to voice chat but includes vision capabilities:

```typescript
const robotId = Math.random().toString().substring(2, 10);

const visionChatConfig = {
  asrConfig: 1,
  llmConfig: 2,     // Vision-capable LLM
  ttsConfig: 1,
  prompt: 'You are a visual AI assistant. Describe what you see and help the user.',
  welcome: 'Hello! I can see and understand images. How can I assist you?'
};

await aigc.start('visionchat', visionChatConfig, robotId);
```

### Avatar Chat

Avatar chat includes a digital human avatar:

```typescript
const robotId = Math.random().toString().substring(2, 10);

const avatarChatConfig = {
  asrConfig: 1,
  llmConfig: 1,
  ttsConfig: 1,
  avatarConfig: 1,  // Avatar configuration ID
  prompt: 'You are a friendly virtual teacher.',
  welcome: 'Hi! I am your virtual teacher.'
};

await aigc.start('avatarchat', avatarChatConfig, robotId);
```

## Receiving AIGC Messages

### Bind to RTC Client

```typescript
import { Events } from 'omnirtc-web/aigc';

// Bind AIGC to RTC client to receive messages
aigc.bind(client);

// Listen for AIGC messages
aigc.on(Events.MESSAGE, (data) => {
  console.log('AIGC message:', data);

  // Data can be object, string, or Uint8Array
  if (typeof data === 'object') {
    // Structured message (JSON)
    console.log('Type:', data.type);
    console.log('Content:', data.content);
  } else if (typeof data === 'string') {
    // Text message
    console.log('Text:', data);
  }
});
```

**Message Types**: The AIGC system sends various messages including:
- ASR transcription results
- LLM responses
- TTS status updates
- Avatar animation states
- Custom signaling

## ASR Message Format

ASR messages have a specific structure that differs from other AIGC messages:

```typescript
// ASR message structure
interface AsrMessage {
  type: 'asr';
  msg: {
    tid: string;    // Task ID
    suid: number;   // User ID
    ev: 'se' | 'sm'; // Event type: 'se'=sentence end (final), 'sm'=sentence middle (partial)
    rs: {
      sid: number;   // Sentence ID
      st: number;    // Start time (ms)
      et: number;    // End time (ms)
      tx: string;    // Transcribed text
    };
  };
}
```

### Event Types

| Event | Code | Description |
|-------|------|-------------|
| Sentence End | `se` | Final result, sentence is complete |
| Sentence Middle | `sm` | Partial/intermediate result, still recognizing |

### Handling ASR Messages

```typescript
aigc.on(Events.MESSAGE, (data) => {
  if (typeof data === 'object' && data.type === 'asr') {
    const { ev, rs } = data.msg;
    const text = rs.tx;

    if (ev === 'se') {
      // Final result - sentence is complete
      console.log('Final transcription:', text);
      // Add to transcript history
    } else if (ev === 'sm') {
      // Partial result - still processing
      console.log('Partial transcription:', text);
      // Update real-time display
    }
  }
});
```

### Complete ASR Example

```typescript
// State for ASR results
const asrResults = [];          // Final results history
const currentAsrText = ref(''); // Current partial text

// Handle ASR messages
function handleAsrMessage(data) {
  if (typeof data !== 'object' || data.type !== 'asr') return;

  const { ev, rs } = data.msg;
  if (!rs) return;

  const text = rs.tx || '';

  if (ev === 'se') {
    // Sentence end - final result
    if (text.trim()) {
      asrResults.push({
        text: text.trim(),
        timestamp: Date.now(),
        startTime: rs.st,
        endTime: rs.et
      });
    }
    currentAsrText.value = '';
  } else if (ev === 'sm') {
    // Sentence middle - partial result
    currentAsrText.value = text;
  }
}

// Setup listener
aigc.on(Events.MESSAGE, handleAsrMessage);
```

## Updating AIGC Tasks

### Update System Prompt

```typescript
const promptData = {
  prompt: 'Now you are an English teacher. Correct my grammar and pronunciation.'
};

await aigc.update(TaskTypeEnum.UPDATE_PROMPT, promptData);
```

### Interrupt AI Response

Stop the current AI response:

```typescript
await aigc.update(TaskTypeEnum.BREAK_AI_RESPONSE, null);
```

### Broadcast Content

Make the AI speak specific content:

```typescript
const broadcastData = {
  content: 'Please wait a moment while I process that.'
};

await aigc.update(TaskTypeEnum.BROADCAST_CONTENT, broadcastData);
```

### Send Content to LLM

Manually send text to the LLM:

```typescript
const contentData = {
  prompt: 'What is 2 + 2?'
};

await aigc.update(TaskTypeEnum.SEND_CONTENT_TO_LLM, contentData);
```

### Submit Voice (Manual Mode)

For manual submission mode tasks:

```typescript
await aigc.update(TaskTypeEnum.SUBMIT_VOICE_TO_LLM, null);
```

### Send Custom Signaling

Send custom messages to other clients:

```typescript
const signalingData = {
  message: JSON.stringify({
    type: 'custom_event',
    data: { key: 'value' }
  })
};

await aigc.update(TaskTypeEnum.SEND_SIGNALING_TO_CLIENT, signalingData);
```

## Stopping AIGC

```typescript
await aigc.stop();
```

Optional: Pass additional cleanup parameters:

```typescript
await aigc.stop({
  saveHistory: true
});
```

## Complete Integration Example

```typescript
import { getRTCInstance } from 'omnirtc-web';
import { Aigc, TaskTypeEnum, Events } from 'omnirtc-web/aigc';

async function startAIConversation(token: string) {
  // 1. Initialize RTC
  const engine = getRTCInstance(token);
  const client = engine.createClient({
    mode: 'rtc',
    codec: 'h264'
  });

  // 2. Setup RTC events
  client.on('user-published', async (user, mediaType) => {
    const track = await client.subscribe(user, mediaType);
    if (mediaType === 'audio') {
      track.play();
    } else if (mediaType === 'video') {
      track.play('ai-avatar-container');
    }
  });

  // 3. Join RTC room
  await client.join();

  // 4. Publish local audio (so AI can hear user)
  const audioTrack = await engine.createMicrophoneAudioTrack({
    AEC: true,
    ANS: true
  });
  await client.publish(audioTrack);

  // 5. Initialize AIGC
  const aigc = new Aigc(token);

  // 6. Bind AIGC to receive messages
  aigc.bind(client);

  aigc.on(Events.MESSAGE, (data) => {
    console.log('AI message:', data);

    // Handle different message types
    if (typeof data === 'object') {
      switch (data.type) {
        case 'asr':
          // ASR message - check ev field for final/partial
          const { ev, rs } = data.msg;
          if (ev === 'se') {
            console.log('Final transcription:', rs.tx);
          } else if (ev === 'sm') {
            console.log('Partial transcription:', rs.tx);
          }
          break;
        case 'llm_response':
          console.log('AI replied:', data.text);
          break;
        case 'tts_status':
          console.log('TTS status:', data.status);
          break;
      }
    }
  });

  // 7. Query available configurations
  const configs = await aigc.query();
  console.log('AIGC configs:', configs);

  // 8. Start voice chat
  const robotId = Math.random().toString().substring(2, 10);
  await aigc.start('voicechat', {
    prompt: 'You are a helpful assistant.',
    welcome: 'Hello! How can I help you?'
  }, robotId);

  console.log('AI conversation started!');

  return { engine, client, aigc, audioTrack };
}

// Cleanup function
async function stopAIConversation({ engine, client, aigc, audioTrack }) {
  await aigc.stop();
  await client.unpublish();
  audioTrack.close();
  await client.leave();
}
```

## Task Types Reference

```typescript
enum TaskTypeEnum {
  UPDATE_PROMPT = 1,              // Update system prompt
  BREAK_AI_RESPONSE = 2,          // Interrupt AI response
  BROADCAST_CONTENT = 3,          // Make AI speak content
  SEND_CONTENT_TO_LLM = 4,       // Send text to LLM
  SUBMIT_VOICE_TO_LLM = 5,       // Submit voice (manual mode)
  SEND_SIGNALING_TO_CLIENT = 6   // Custom signaling
}
```

## Configuration Object Types

### ASR Config
```typescript
interface AsrConfig {
  vendor: number;  // ASR vendor ID
}
```

### Chat Config
```typescript
interface ChatConfig {
  asrConfig?: number;    // ASR configuration ID
  llmConfig?: number;    // LLM configuration ID
  ttsConfig?: number;    // TTS configuration ID
  prompt?: string;       // System prompt
  welcome?: string;      // Welcome message
  [key: string]: any;    // Additional custom fields
}
```

### Avatar Config
```typescript
interface AvatarConfig extends ChatConfig {
  avatarConfig?: number;  // Avatar configuration ID
}
```

## Error Handling

```typescript
try {
  await aigc.start('voicechat', config, robotId);
} catch (error) {
  console.error('Failed to start AIGC:', error);

  if (error.message.includes('adaptAppId')) {
    console.error('Token missing engineConfig.adaptAppId');
  }
}
```

## Best Practices

1. **Always bind before starting**: Call `aigc.bind(client)` before `aigc.start()`
2. **Query configurations**: Call `aigc.query()` to see available options
3. **Empty config is valid**: Pass `{}` to use backend defaults
4. **One task at a time**: Stop existing task before starting a new one
5. **Clean up**: Always call `aigc.stop()` when done
6. **Error handling**: Wrap AIGC calls in try-catch
7. **Message parsing**: Handle both JSON and string messages
8. **Token requirements**: Ensure token has `engineConfig.adaptAppId`

## Common Issues

### "Invalid token: missing engineConfig.adaptAppId"
Token doesn't include AIGC configuration. Contact backend team to include `engineConfig.adaptAppId` in token.

### "Aigc task already started"
A task is already running. Call `aigc.stop()` before starting a new task.

### No messages received
- Ensure `aigc.bind(client)` was called
- Verify RTC is connected (`client.connectionState === 'CONNECTED'`)
- Check that AIGC task started successfully

### AI not hearing user
- Ensure local audio track is published
- Check microphone permissions
- Verify audio track is not muted

## Advanced Patterns

### Dynamic Prompt Updates

```typescript
// Start with general prompt
await aigc.start('voicechat', {
  prompt: 'You are a helpful assistant.'
}, robotId);

// Later, switch to specific domain
await aigc.update(TaskTypeEnum.UPDATE_PROMPT, {
  prompt: 'You are now a math tutor. Help with homework.'
});
```

### Interrupt and Broadcast

```typescript
// Interrupt long AI response
await aigc.update(TaskTypeEnum.BREAK_AI_RESPONSE, null);

// Immediately broadcast important info
await aigc.update(TaskTypeEnum.BROADCAST_CONTENT, {
  content: 'Class is ending in 5 minutes.'
});
```

### Custom Message Routing

```typescript
aigc.on(Events.MESSAGE, (data) => {
  if (typeof data === 'object' && data.type === 'custom_event') {
    // Route to custom handler
    handleCustomEvent(data);
  } else {
    // Handle standard AIGC messages
    handleAIMessage(data);
  }
});
```
