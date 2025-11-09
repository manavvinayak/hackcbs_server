import express from 'express';
import aiAnalysisService from '../services/aiAnalysis.js';
import websocketService from '../services/websocket.js';
import { sendResponse, sendError, processVideoFrame, processAudioChunk } from '../utils/helpers.js';

const router = express.Router();

// POST /api/webcam/analyze-frame - Analyze single webcam frame
router.post('/analyze-frame', async (req, res) => {
  try {
    const { frameData, sessionId } = req.body;
    
    if (!frameData) {
      return sendError(res, 400, 'Frame data is required');
    }

    // Process the video frame
    const processedFrame = processVideoFrame(frameData);
    
    // Analyze with AI service
    const analysis = await aiAnalysisService.analyzeBehavior(processedFrame, sessionId);
    
    // Send real-time feedback via WebSocket if sessionId provided
    if (sessionId) {
      websocketService.sendToSession(sessionId, {
        type: 'behavior_analysis',
        data: analysis
      });
    }
    
    sendResponse(res, 200, true, 'Frame analyzed successfully', analysis);
  } catch (error) {
    console.error('Frame analysis error:', error);
    sendError(res, 500, 'Failed to analyze frame', error.message);
  }
});

// POST /api/webcam/analyze-audio - Analyze audio chunk
router.post('/analyze-audio', async (req, res) => {
  try {
    const { audioData, sessionId } = req.body;
    
    if (!audioData) {
      return sendError(res, 400, 'Audio data is required');
    }

    // Process the audio chunk
    const processedAudio = processAudioChunk(audioData);
    
    // Analyze with AI service
    const analysis = await aiAnalysisService.analyzeSpeech(processedAudio, sessionId);
    
    // Send real-time feedback via WebSocket if sessionId provided
    if (sessionId) {
      websocketService.sendToSession(sessionId, {
        type: 'speech_analysis',
        data: analysis
      });
    }
    
    sendResponse(res, 200, true, 'Audio analyzed successfully', analysis);
  } catch (error) {
    console.error('Audio analysis error:', error);
    sendError(res, 500, 'Failed to analyze audio', error.message);
  }
});

// POST /api/webcam/start-session - Start a new analysis session
router.post('/start-session', async (req, res) => {
  try {
    const { userId, interviewType } = req.body;
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Here you would create a new session in your database
    const sessionData = {
      id: sessionId,
      userId,
      interviewType,
      startTime: new Date(),
      status: 'active'
    };
    
    sendResponse(res, 200, true, 'Session started successfully', sessionData);
  } catch (error) {
    console.error('Session start error:', error);
    sendError(res, 500, 'Failed to start session', error.message);
  }
});

// POST /api/webcam/end-session - End analysis session and get feedback
router.post('/end-session', async (req, res) => {
  try {
    const { sessionId, behaviorData, speechData, answers } = req.body;
    
    if (!sessionId) {
      return sendError(res, 400, 'Session ID is required');
    }
    
    // Generate comprehensive feedback
    const feedback = aiAnalysisService.generateFeedback(behaviorData, speechData, answers);
    
    // Here you would save the session data and feedback to database
    
    sendResponse(res, 200, true, 'Session ended successfully', {
      sessionId,
      feedback,
      endTime: new Date()
    });
  } catch (error) {
    console.error('Session end error:', error);
    sendError(res, 500, 'Failed to end session', error.message);
  }
});

// GET /api/webcam/test - Test webcam connectivity
router.get('/test', (req, res) => {
  sendResponse(res, 200, true, 'Webcam service is running', {
    timestamp: new Date(),
    status: 'ready',
    features: {
      behaviorAnalysis: true,
      speechAnalysis: true,
      realTimeWebSocket: true
    }
  });
});

export default router;