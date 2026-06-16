/**
 * Basic Video Call Template
 *
 * This template demonstrates how to implement a basic 1-on-1 or group video call
 * using the OmniRTC WebSDK.
 */

import { getRTCInstance, IOmniRTC, IOmniRTCClient, ILocalAudioTrack, ICameraVideoTrack } from 'omnirtc-web';

interface VideoCallConfig {
  token: string;
  localVideoContainer: string;
  remoteVideoContainer: string;
  mode?: 'rtc' | 'live';
  codec?: 'h264' | 'vp8' | 'vp9';
}

class BasicVideoCall {
  private engine: IOmniRTC;
  private client: IOmniRTCClient;
  private audioTrack: ILocalAudioTrack | null = null;
  private videoTrack: ICameraVideoTrack | null = null;

  constructor(private config: VideoCallConfig) {
    this.engine = getRTCInstance(config.token);
    this.client = this.engine.createClient({
      mode: config.mode || 'rtc',
      codec: config.codec || 'h264'
    });
  }

  /**
   * Initialize and join the video call
   */
  async start(): Promise<void> {
    // Setup event handlers
    this.setupEventHandlers();

    // Setup autoplay failure handler
    this.setupAutoplayHandler();

    // Join the room
    const uid = await this.client.join();
    console.log('Joined room with UID:', uid);

    // Create and publish local tracks
    await this.publishLocalTracks();
  }

  /**
   * Setup event handlers for remote users
   */
  private setupEventHandlers(): void {
    // User joined
    this.client.on('user-joined', (user) => {
      console.log('User joined:', user.uid);
    });

    // User left
    this.client.on('user-left', (user, reason) => {
      console.log('User left:', user.uid, 'Reason:', reason);
    });

    // User published media
    this.client.on('user-published', async (user, mediaType) => {
      console.log('User published:', user.uid, mediaType);

      try {
        // Subscribe to the remote track
        const track = await this.client.subscribe(user, mediaType);

        if (mediaType === 'audio') {
          // Play audio directly
          track.play();
        } else if (mediaType === 'video') {
          // Play video in container
          track.play(this.config.remoteVideoContainer);
        }
      } catch (error) {
        console.error('Failed to subscribe:', error);
      }
    });

    // User unpublished media
    this.client.on('user-unpublished', (user, mediaType) => {
      console.log('User unpublished:', user.uid, mediaType);
    });

    // Connection state changes
    this.client.on('connection-state-change', (curState, prevState, reason) => {
      console.log('Connection state changed:', prevState, '->', curState);
      if (reason) {
        console.log('Reason:', reason);
      }
    });

    // Exception handling
    this.client.on('exception', (event) => {
      console.error('RTC Exception:', event.code, event.msg);
    });

    // Token expiration
    this.client.on('token-privilege-will-expire', async () => {
      console.warn('Token will expire soon, renewing...');
      // TODO: Fetch new token from your server
      // const newToken = await fetchTokenFromServer();
      // await this.client.renewToken(newToken);
    });
  }

  /**
   * Setup autoplay failure handler
   */
  private setupAutoplayHandler(): void {
    this.engine.onAudioAutoplayFailed = () => {
      console.warn('Audio autoplay failed. User interaction required.');
      // TODO: Show UI to prompt user to click/tap to enable audio
    };
  }

  /**
   * Create and publish local audio/video tracks
   */
  private async publishLocalTracks(): Promise<void> {
    try {
      // Create microphone and camera tracks
      const [audioTrack, videoTrack] = await this.engine.createMicrophoneAndCameraTracks({
        // Audio config
        AEC: true,  // Echo cancellation
        AGC: true,  // Auto gain control
        ANS: true,  // Noise suppression
        encoderConfig: 'high_quality'
      }, {
        // Video config
        encoderConfig: '720p',
        optimizationMode: 'motion'
      });

      this.audioTrack = audioTrack;
      this.videoTrack = videoTrack;

      // Play local video preview
      videoTrack.play(this.config.localVideoContainer, {
        mirror: true,
        fit: 'cover'
      });

      // Publish tracks to the room
      await this.client.publish([audioTrack, videoTrack]);
      console.log('Published local tracks');

    } catch (error) {
      console.error('Failed to publish local tracks:', error);
      throw error;
    }
  }

  /**
   * Mute/unmute local audio
   */
  async muteAudio(muted: boolean): Promise<void> {
    if (this.audioTrack) {
      await this.audioTrack.setMuted(muted);
    }
  }

  /**
   * Mute/unmute local video
   */
  async muteVideo(muted: boolean): Promise<void> {
    if (this.videoTrack) {
      await this.videoTrack.setMuted(muted);
    }
  }

  /**
   * Switch camera (front/back)
   */
  async switchCamera(): Promise<void> {
    if (!this.videoTrack) return;

    const cameras = await this.engine.getCameras();
    if (cameras.length < 2) {
      console.warn('No additional cameras available');
      return;
    }

    // Find a different camera
    const currentDeviceId = this.videoTrack.getMediaStreamTrack().getSettings().deviceId;
    const newCamera = cameras.find(cam => cam.deviceId !== currentDeviceId);

    if (newCamera) {
      await this.videoTrack.setDevice(newCamera.deviceId);
      console.log('Switched to camera:', newCamera.label);
    }
  }

  /**
   * Get current call statistics
   */
  getStats() {
    return {
      rtc: this.client.getRTCStats(),
      localAudio: this.client.getLocalAudioStats(),
      localVideo: this.client.getLocalVideoStats(),
      remoteAudio: this.client.getRemoteAudioStats(),
      remoteVideo: this.client.getRemoteVideoStats()
    };
  }

  /**
   * Leave the call and cleanup resources
   */
  async stop(): Promise<void> {
    try {
      // Unpublish tracks
      if (this.audioTrack || this.videoTrack) {
        await this.client.unpublish();
      }

      // Close tracks
      if (this.audioTrack) {
        this.audioTrack.close();
        this.audioTrack = null;
      }

      if (this.videoTrack) {
        this.videoTrack.close();
        this.videoTrack = null;
      }

      // Leave the room
      await this.client.leave();
      console.log('Left the room');

    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Usage example
async function startVideoCall() {
  const videoCall = new BasicVideoCall({
    token: 'YOUR_JWT_TOKEN',
    localVideoContainer: 'local-video',
    remoteVideoContainer: 'remote-video',
    mode: 'rtc',
    codec: 'h264'
  });

  try {
    await videoCall.start();
    console.log('Video call started successfully');

    // Example: Mute audio after 5 seconds
    setTimeout(() => {
      videoCall.muteAudio(true);
    }, 5000);

  } catch (error) {
    console.error('Failed to start video call:', error);
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    videoCall.stop();
  });

  return videoCall;
}

export { BasicVideoCall, VideoCallConfig, startVideoCall };
