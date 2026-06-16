/**
 * Screen Sharing Template
 *
 * This template demonstrates how to implement screen sharing functionality
 * using the OmniRTC WebSDK.
 */

import { getRTCInstance, IOmniRTC, IOmniRTCClient, ILocalVideoTrack, ILocalAudioTrack } from 'omnirtc-web';

interface ScreenShareConfig {
  token: string;
  screenVideoContainer: string;
  includeSystemAudio?: boolean;
  videoQuality?: '720p' | '1080p' | '1080p_1';
}

class ScreenSharing {
  private engine: IOmniRTC;
  private client: IOmniRTCClient;
  private screenVideoTrack: ILocalVideoTrack | null = null;
  private screenAudioTrack: ILocalAudioTrack | null = null;
  private isSharing: boolean = false;

  constructor(private config: ScreenShareConfig) {
    this.engine = getRTCInstance(config.token);
    this.client = this.engine.createClient({
      mode: 'rtc',
      codec: 'h264'
    });
  }

  /**
   * Initialize RTC and join room
   */
  async initialize(): Promise<void> {
    this.setupEventHandlers();

    const uid = await this.client.join();
    console.log('Joined room with UID:', uid);
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Handle remote screen shares
    this.client.on('user-published', async (user, mediaType) => {
      if (mediaType === 'screen') {
        console.log('User started sharing screen:', user.uid);

        try {
          const track = await this.client.subscribe(user, mediaType);
          track.play(this.config.screenVideoContainer, {
            fit: 'contain'
          });
        } catch (error) {
          console.error('Failed to subscribe to screen share:', error);
        }
      } else if (mediaType === 'audio') {
        const track = await this.client.subscribe(user, mediaType);
        track.play();
      }
    });

    this.client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'screen') {
        console.log('User stopped sharing screen:', user.uid);
      }
    });

    this.client.on('connection-state-change', (curState, prevState) => {
      console.log('Connection state:', prevState, '->', curState);
    });
  }

  /**
   * Start sharing screen
   */
  async startSharing(): Promise<void> {
    if (this.isSharing) {
      console.warn('Already sharing screen');
      return;
    }

    try {
      const includeAudio = this.config.includeSystemAudio ?? false;

      if (includeAudio) {
        // Share screen with system audio
        const result = await this.engine.createScreenVideoTrack({
          encoderConfig: this.config.videoQuality || '1080p',
          optimizationMode: 'detail'  // Use 'detail' for screen sharing
        }, 'enable');

        // Result is a tuple: [videoTrack, audioTrack]
        if (Array.isArray(result)) {
          [this.screenVideoTrack, this.screenAudioTrack] = result;
          console.log('Created screen tracks with audio');
        } else {
          this.screenVideoTrack = result;
          console.log('Created screen track without audio');
        }

      } else {
        // Share screen without audio
        this.screenVideoTrack = await this.engine.createScreenVideoTrack({
          encoderConfig: this.config.videoQuality || '1080p',
          optimizationMode: 'detail'
        }, 'disable');
        console.log('Created screen track');
      }

      // Setup track-ended handler (user stops sharing via browser UI)
      this.screenVideoTrack.on('track-ended', () => {
        console.log('Screen sharing ended by user');
        this.stopSharing();
      });

      // Preview local screen share
      this.screenVideoTrack.play(this.config.screenVideoContainer, {
        fit: 'contain'
      });

      // Publish screen tracks
      const tracksToPublish = this.screenAudioTrack
        ? [this.screenVideoTrack, this.screenAudioTrack]
        : [this.screenVideoTrack];

      await this.client.publish(tracksToPublish);
      this.isSharing = true;
      console.log('Started screen sharing');

    } catch (error) {
      console.error('Failed to start screen sharing:', error);

      // Cleanup on error
      this.cleanupTracks();
      throw error;
    }
  }

  /**
   * Stop sharing screen
   */
  async stopSharing(): Promise<void> {
    if (!this.isSharing) {
      console.warn('Not currently sharing screen');
      return;
    }

    try {
      // Unpublish tracks
      const tracksToUnpublish = [];
      if (this.screenVideoTrack) tracksToUnpublish.push(this.screenVideoTrack);
      if (this.screenAudioTrack) tracksToUnpublish.push(this.screenAudioTrack);

      if (tracksToUnpublish.length > 0) {
        await this.client.unpublish(tracksToUnpublish);
      }

      // Cleanup tracks
      this.cleanupTracks();

      this.isSharing = false;
      console.log('Stopped screen sharing');

    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  }

  /**
   * Cleanup screen tracks
   */
  private cleanupTracks(): void {
    if (this.screenVideoTrack) {
      this.screenVideoTrack.close();
      this.screenVideoTrack = null;
    }

    if (this.screenAudioTrack) {
      this.screenAudioTrack.close();
      this.screenAudioTrack = null;
    }
  }

  /**
   * Check if currently sharing
   */
  isCurrentlySharing(): boolean {
    return this.isSharing;
  }

  /**
   * Leave room and cleanup
   */
  async cleanup(): Promise<void> {
    if (this.isSharing) {
      await this.stopSharing();
    }

    await this.client.leave();
    console.log('Left room');
  }
}

// Usage example
async function startScreenShare() {
  const screenShare = new ScreenSharing({
    token: 'YOUR_JWT_TOKEN',
    screenVideoContainer: 'screen-video',
    includeSystemAudio: true,  // Include system audio if supported
    videoQuality: '1080p'
  });

  try {
    // Initialize and join room
    await screenShare.initialize();

    // Start screen sharing
    await screenShare.startSharing();
    console.log('Screen sharing started');

  } catch (error) {
    console.error('Failed to start screen share:', error);
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    screenShare.cleanup();
  });

  return screenShare;
}

// Example: Screen sharing with camera
async function screenShareWithCamera() {
  const engine = getRTCInstance('YOUR_JWT_TOKEN');
  const client = engine.createClient({ mode: 'rtc', codec: 'h264' });

  // Join room
  await client.join();

  // Create camera and microphone tracks
  const [audioTrack, cameraTrack] = await engine.createMicrophoneAndCameraTracks();

  // Create screen track
  const screenTrack = await engine.createScreenVideoTrack({
    encoderConfig: '1080p',
    optimizationMode: 'detail'
  }, 'disable');

  // Play local previews
  cameraTrack.play('local-camera', { mirror: true });
  screenTrack.play('local-screen', { fit: 'contain' });

  // Publish both camera and screen
  await client.publish([audioTrack, cameraTrack, screenTrack]);

  console.log('Publishing camera and screen simultaneously');

  // Cleanup function
  return async () => {
    await client.unpublish();
    audioTrack.close();
    cameraTrack.close();
    screenTrack.close();
    await client.leave();
  };
}

export { ScreenSharing, ScreenShareConfig, startScreenShare, screenShareWithCamera };
