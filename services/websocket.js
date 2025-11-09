// WebSocket service for real-time communication
import { WebSocketServer } from 'ws';
import candidateAnalysisService from './candidateAnalysis.js';

class WebSocketService {
  constructor() {
    this.wss = null;
    this.connections = new Map(); // sessionId -> connection
    this.userSessions = new Map(); // userId -> sessionId
  }

  initialize(server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      perMessageDeflate: false
    });
    
    this.wss.on('connection', (ws, req) => {
      console.log('🔗 New WebSocket connection established');
      
      // Send welcome message
      this.sendToClient(ws, {
        type: 'connection_established',
        message: 'WebSocket connected successfully',
        timestamp: new Date()
      });
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleMessage(ws, data);
        } catch (error) {
          console.error('❌ WebSocket message error:', error);
          this.sendToClient(ws, {
            type: 'error',
            message: 'Invalid message format'
          });
        }
      });

      ws.on('close', () => {
        // Remove connection from active sessions
        for (const [sessionId, connection] of this.connections.entries()) {
          if (connection === ws) {
            this.connections.delete(sessionId);
            console.log(`📱 Session ${sessionId} disconnected`);
            break;
          }
        }
        console.log('🔌 WebSocket connection closed');
      });

      ws.on('error', (error) => {
        console.error('🚨 WebSocket error:', error);
      });
    });

    console.log('🌐 WebSocket server initialized');
  }

  async handleMessage(ws, data) {
    switch (data.type) {
      case 'join_session':
        await this.handleJoinSession(ws, data);
        break;
        
      case 'facial_analysis':
        await this.handleFacialAnalysis(ws, data);
        break;
        
      case 'webcam_frame':
        await this.handleWebcamFrame(ws, data);
        break;
        
      case 'audio_chunk':
        await this.handleAudioChunk(ws, data);
        break;
        
      case 'end_session':
        await this.handleEndSession(ws, data);
        break;
        
      case 'ping':
        this.sendToClient(ws, { type: 'pong', timestamp: new Date() });
        break;
        
      default:
        console.log('❓ Unknown message type:', data.type);
        this.sendToClient(ws, {
          type: 'error',
          message: `Unknown message type: ${data.type}`
        });
    }
  }

  async handleJoinSession(ws, data) {
    const { sessionId, userId } = data;
    
    if (!sessionId) {
      this.sendToClient(ws, {
        type: 'error',
        message: 'Session ID is required'
      });
      return;
    }
    
    // Initialize analysis session
    candidateAnalysisService.initializeSession(sessionId, userId || 'anonymous');
    
    this.connections.set(sessionId, ws);
    if (userId) {
      this.userSessions.set(userId, sessionId);
    }
    
    this.sendToClient(ws, {
      type: 'session_joined',
      sessionId,
      message: 'Successfully joined session',
      timestamp: new Date()
    });
    
    console.log(`👤 User joined session: ${sessionId}`);
  }

  async handleFacialAnalysis(ws, data) {
    try {
      const { sessionId, faceData, timestamp } = data;
      
      if (!sessionId || !faceData) {
        this.sendToClient(ws, {
          type: 'error',
          message: 'Session ID and face data are required'
        });
        return;
      }

      // Process facial data through AI analysis service
      const analysisResult = candidateAnalysisService.processFacialData(sessionId, faceData);
      
      if (analysisResult) {
        // Send analysis results back to client
        this.sendToClient(ws, {
          type: 'analysis_result',
          sessionId,
          analysis: analysisResult.analysis,
          currentScores: analysisResult.currentScores,
          recommendations: analysisResult.recommendations,
          timestamp: new Date()
        });
      }
      
    } catch (error) {
      console.error('❌ Facial analysis error:', error);
      this.sendToClient(ws, {
        type: 'error',
        message: 'Failed to process facial analysis'
      });
    }
  }

  async handleEndSession(ws, data) {
    const { sessionId } = data;
    
    if (!sessionId) {
      this.sendToClient(ws, {
        type: 'error',
        message: 'Session ID is required'
      });
      return;
    }

    // Get final analysis summary
    const summary = candidateAnalysisService.endSession(sessionId);
    
    this.sendToClient(ws, {
      type: 'session_ended',
      sessionId,
      summary,
      timestamp: new Date()
    });
    
    // Clean up connections
    this.connections.delete(sessionId);
    
    console.log(`🏁 Session ended: ${sessionId}`);
  }

  async handleWebcamFrame(ws, data) {
    try {
      const { frameData, sessionId, timestamp } = data;
      
      if (!frameData) {
        this.sendToClient(ws, {
          type: 'error',
          message: 'Frame data is required'
        });
        return;
      }

      // Analyze the frame with AI service
      const analysis = await aiAnalysisService.analyzeBehavior(frameData, sessionId);
      
      // Send real-time feedback
      this.sendToClient(ws, {
        type: 'behavior_analysis',
        data: {
          ...analysis,
          frameTimestamp: timestamp,
          processedAt: new Date()
        }
      });
      
    } catch (error) {
      console.error('📹 Webcam frame processing error:', error);
      this.sendToClient(ws, {
        type: 'error',
        message: 'Failed to process webcam frame'
      });
    }
  }

  async handleAudioChunk(ws, data) {
    try {
      const { audioData, sessionId, timestamp } = data;
      
      if (!audioData) {
        this.sendToClient(ws, {
          type: 'error',
          message: 'Audio data is required'
        });
        return;
      }

      // Analyze the audio with AI service
      const analysis = await aiAnalysisService.analyzeSpeech(audioData, sessionId);
      
      // Send real-time feedback
      this.sendToClient(ws, {
        type: 'speech_analysis',
        data: {
          ...analysis,
          audioTimestamp: timestamp,
          processedAt: new Date()
        }
      });
      
    } catch (error) {
      console.error('🎤 Audio chunk processing error:', error);
      this.sendToClient(ws, {
        type: 'error',
        message: 'Failed to process audio chunk'
      });
    }
  }

  sendToClient(ws, data) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  sendToSession(sessionId, data) {
    const connection = this.connections.get(sessionId);
    if (connection) {
      this.sendToClient(connection, data);
      return true;
    }
    return false;
  }

  sendToUser(userId, data) {
    const sessionId = this.userSessions.get(userId);
    if (sessionId) {
      return this.sendToSession(sessionId, data);
    }
    return false;
  }

  broadcastToAll(data) {
    this.wss.clients.forEach((client) => {
      this.sendToClient(client, data);
    });
  }

  getActiveConnections() {
    return {
      total: this.connections.size,
      sessions: Array.from(this.connections.keys())
    };
  }
}

export default new WebSocketService();