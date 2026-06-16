/**
 * AI Voice Assistant Template
 *
 * This template demonstrates how to implement an AI voice assistant using
 * OmniRTC WebSDK's AIGC capabilities.
 */

import { getRTCInstance, IOmniRTC, IOmniRTCClient, IMicrophoneAudioTrack } from 'omnirtc-web';
import { Aigc, Events, TaskTypeEnum, ChatConfig } from 'omnirtc-web/aigc';

interface AIAssistantConfig {
  token: string;
  avatarVideoContainer?: string;
  aiPrompt?: string;
  welcomeMessage?: string;
  enableAvatar?: boolean;
}

interface AIMessage {
  type: string;
  content: any;
  timestamp: number;
}

class AIVoiceAssistant {
  private engine: IOmniRTC;
  private client: IOmniRTCClient;
  private aigc: Aigc;
  private audioTrack: IMicrophoneAudioTrack | null = null;
  private robotId: string;
  private messageHistory: AIMessage[] = [];
  private onMessageCallback?: (message: AIMessage) => void;

  constructor(private config: AIAssistantConfig) {
    this.engine = getRTCInstance(config.token);
    this.client = this.engine.createClient({
      mode: 'rtc',
      codec: 'h264'
    });
    this.aigc = new Aigc(config.token);
    this.robotId = this.generateRobotId();
  }

  /**
   * Generate a unique robot ID
   */
  private generateRobotId(): string {
    return Math.random().toString().substring(2, 10);
  }

  /**
   * Initialize and start the AI assistant
   */
  async start(): Promise<void> {
    // Setup RTC event handlers
    this.setupRTCEventHandlers();

    // Join RTC room
    const uid = await this.client.join();
    console.log('Joined RTC room with UID:', uid);

    // Create and publish microphone audio
    await this.publishMicrophoneAudio();

    // Setup AIGC message handler
    this.setupAIGCHandlers();

    // Query available AIGC configurations
    const configs = await this.aigc.query();
    console.log('Available AIGC configurations:', configs);

    // Start AI voice chat
    await this.startAIChat();
  }

  /**
   * Setup RTC event handlers
   */
  private setupRTCEventHandlers(): void {
    // Handle remote user (AI avatar) joining
    this.client.on('user-joined', (user) => {
      console.log('AI user joined:', user.uid);
    });

    // Handle AI publishing media (avatar video/audio)
    this.client.on('user-published', async (user, mediaType) => {
      console.log('AI published:', mediaType);

      try {
        const track = await this.client.subscribe(user, mediaType);

        if (mediaType === 'audio') {
          // Play AI voice
          track.play();
          console.log('Playing AI audio');
        } else if (mediaType === 'video' && this.config.avatarVideoContainer) {
          // Play AI avatar video
          track.play(this.config.avatarVideoContainer, {
            fit: 'cover'
          });
          console.log('Playing AI avatar video');
        }
      } catch (error) {
        console.error('Failed to subscribe to AI media:', error);
      }
    });

    // Connection state monitoring
    this.client.on('connection-state-change', (curState, prevState) => {
      console.log('Connection:', prevState, '->', curState);
    });

    // Handle autoplay restrictions
    this.engine.onAudioAutoplayFailed = () => {
      console.warn('Audio autoplay failed - user interaction required');
      this.notifyMessage({
        type: 'system',
        content: 'Please click anywhere to enable audio',
        timestamp: Date.now()
      });
    };
  }

  /**
   * Publish microphone audio so AI can hear the user
   */
  private async publishMicrophoneAudio(): Promise<void> {
    try {
      this.audioTrack = await this.engine.createMicrophoneAudioTrack({
        AEC: true,  // Echo cancellation (critical for AI)
        AGC: true,  // Auto gain control
        ANS: true,  // Noise suppression
        encoderConfig: 'high_quality'
      });

      await this.client.publish(this.audioTrack);
      console.log('Published microphone audio');

    } catch (error) {
      console.error('Failed to publish microphone:', error);
      throw error;
    }
  }

  /**
   * Setup AIGC message handlers
   */
  private setupAIGCHandlers(): void {
    // Bind AIGC to RTC client to receive messages
    this.aigc.bind(this.client);

    // Listen for AI messages
    this.aigc.on(Events.MESSAGE, (data) => {
      console.log('AI message received:', data);

      const message: AIMessage = {
        type: typeof data === 'object' && data.type ? data.type : 'unknown',
        content: data,
        timestamp: Date.now()
      };

      this.messageHistory.push(message);
      this.notifyMessage(message);

      // Handle specific message types
      this.handleAIMessage(message);
    });
  }

  /**
   * Handle specific AI message types
   */
  private handleAIMessage(message: AIMessage): void {
    const data = message.content;

    if (typeof data === 'object') {
      switch (data.type) {
        case 'asr':
          // ASR message - check ev field for final/partial result
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

        case 'error':
          console.error('AI error:', data.message);
          break;

        default:
          console.log('Unknown message type:', data.type);
      }
    }
  }

  /**
   * Start AI voice chat
   */
  private async startAIChat(): Promise<void> {
    const chatConfig: ChatConfig = {
      prompt: this.config.aiPrompt || 'You are a helpful voice assistant.',
      welcome: this.config.welcomeMessage || 'Hello! How can I help you today?'
    };

    try {
      if (this.config.enableAvatar) {
        // Start with avatar
        await this.aigc.start('avatarchat', {
          ...chatConfig,
          avatarConfig: 1  // Use default avatar config
        }, this.robotId);
        console.log('Started AI avatar chat');
      } else {
        // Voice-only chat
        await this.aigc.start('voicechat', chatConfig, this.robotId);
        console.log('Started AI voice chat');
      }
    } catch (error) {
      console.error('Failed to start AI chat:', error);
      throw error;
    }
  }

  /**
   * Update the AI's system prompt dynamically
   */
  async updatePrompt(newPrompt: string): Promise<void> {
    try {
      await this.aigc.update(TaskTypeEnum.UPDATE_PROMPT, {
        prompt: newPrompt
      });
      console.log('Updated AI prompt');
    } catch (error) {
      console.error('Failed to update prompt:', error);
    }
  }

  /**
   * Interrupt the AI's current response
   */
  async interruptAI(): Promise<void> {
    try {
      await this.aigc.update(TaskTypeEnum.BREAK_AI_RESPONSE, null);
      console.log('Interrupted AI response');
    } catch (error) {
      console.error('Failed to interrupt AI:', error);
    }
  }

  /**
   * Make the AI speak specific content
   */
  async speakContent(content: string): Promise<void> {
    try {
      await this.aigc.update(TaskTypeEnum.BROADCAST_CONTENT, {
        content
      });
      console.log('AI broadcasting content');
    } catch (error) {
      console.error('Failed to broadcast content:', error);
    }
  }

  /**
   * Send text to the AI (bypassing voice)
   */
  async sendTextToAI(text: string): Promise<void> {
    try {
      await this.aigc.update(TaskTypeEnum.SEND_CONTENT_TO_LLM, {
        prompt: text
      });
      console.log('Sent text to AI');
    } catch (error) {
      console.error('Failed to send text:', error);
    }
  }

  /**
   * Mute/unmute microphone
   */
  async muteMicrophone(muted: boolean): Promise<void> {
    if (this.audioTrack) {
      await this.audioTrack.setMuted(muted);
      console.log('Microphone', muted ? 'muted' : 'unmuted');
    }
  }

  /**
   * Set callback for new messages
   */
  onMessage(callback: (message: AIMessage) => void): void {
    this.onMessageCallback = callback;
  }

  /**
   * Notify message to callback
   */
  private notifyMessage(message: AIMessage): void {
    if (this.onMessageCallback) {
      this.onMessageCallback(message);
    }
  }

  /**
   * Get message history
   */
  getMessageHistory(): AIMessage[] {
    return [...this.messageHistory];
  }

  /**
   * Clear message history
   */
  clearHistory(): void {
    this.messageHistory = [];
  }

  /**
   * Stop the AI assistant and cleanup
   */
  async stop(): Promise<void> {
    try {
      // Stop AIGC
      await this.aigc.stop();
      console.log('Stopped AIGC');

      // Unpublish and close audio track
      if (this.audioTrack) {
        await this.client.unpublish();
        this.audioTrack.close();
        this.audioTrack = null;
      }

      // Leave RTC room
      await this.client.leave();
      console.log('Left RTC room');

    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Usage example
async function startAIAssistant() {
  const assistant = new AIVoiceAssistant({
    token: 'YOUR_JWT_TOKEN',
    aiPrompt: 'You are a helpful math tutor. Help students with their homework.',
    welcomeMessage: 'Hi! I am your math tutor. What would you like to learn today?',
    enableAvatar: false  // Set true to enable avatar
  });

  // Setup message callback
  assistant.onMessage((message) => {
    console.log('New message:', message);

    // Update UI with message
    if (message.type === 'asr') {
      // ASR message - ev: 'se'=final, 'sm'=partial
      const { ev, rs } = message.content.msg;
      if (ev === 'se') {
        // Final transcription - display user's speech
        updateUI('user', rs.tx);
      }
      // 'sm' is partial result, can show real-time typing indicator
    } else if (message.type === 'llm_response') {
      // Display AI's response
      updateUI('ai', message.content.text);
    }
  });

  try {
    await assistant.start();
    console.log('AI assistant started');

    // Example: Change topic after 30 seconds
    setTimeout(() => {
      assistant.updatePrompt('You are now an English tutor. Help with grammar and vocabulary.');
    }, 30000);

  } catch (error) {
    console.error('Failed to start AI assistant:', error);
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    assistant.stop();
  });

  return assistant;
}

function updateUI(sender: 'user' | 'ai', text: string) {
  // Implement your UI update logic here
  console.log(`[${sender}]: ${text}`);
}

export { AIVoiceAssistant, AIAssistantConfig, AIMessage, startAIAssistant };
