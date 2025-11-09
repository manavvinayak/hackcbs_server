// AI-powered candidate analysis service
import WebSocket from 'ws';

class CandidateAnalysisService {
  constructor() {
    this.activeSessions = new Map();
    this.analysisData = new Map();
  }

  // Initialize analysis session
  initializeSession(sessionId, userId) {
    const sessionData = {
      sessionId,
      userId,
      startTime: Date.now(),
      eyeContactCount: 0,
      eyeContactDuration: 0,
      handMovements: [],
      facialExpressions: [],
      posture: [],
      speechPatterns: [],
      confidenceScore: 0,
      engagementScore: 0,
      professionalismScore: 0,
      lastAnalysis: Date.now()
    };

    this.activeSessions.set(sessionId, sessionData);
    this.analysisData.set(sessionId, []);
    
    console.log(`🎯 Analysis session initialized: ${sessionId}`);
    return sessionData;
  }

  // Process facial analysis data from client
  processFacialData(sessionId, faceData) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    const analysis = this.analyzeFacialFeatures(faceData);
    
    // Debug logging for eye contact
    if (analysis.valid) {
      console.log(`👁️ Eye Contact Analysis:`, {
        isLookingAtCamera: analysis.eyeContact,
        method: analysis.eyeContactMethod,
        duration: analysis.eyeContactDuration
      });
    }
    
    // Update session metrics
    session.eyeContactCount += analysis.eyeContact ? 1 : 0;
    session.eyeContactDuration += analysis.eyeContactDuration;
    session.facialExpressions.push({
      timestamp: Date.now(),
      emotion: analysis.dominantEmotion,
      confidence: analysis.emotionConfidence,
      expressions: analysis.expressions
    });

    // Calculate real-time scores
    this.updateScores(session, analysis);
    
    // Store analysis point
    const analysisPoint = {
      timestamp: Date.now(),
      type: 'facial',
      data: analysis,
      scores: {
        confidence: session.confidenceScore,
        engagement: session.engagementScore,
        professionalism: session.professionalismScore
      }
    };

    this.analysisData.get(sessionId).push(analysisPoint);
    session.lastAnalysis = Date.now();

    return {
      sessionId,
      analysis: analysisPoint,
      currentScores: {
        confidence: session.confidenceScore,
        engagement: session.engagementScore,
        professionalism: session.professionalismScore,
        eyeContact: this.calculateEyeContactPercentage(session)
      },
      recommendations: this.generateRecommendations(session, analysis)
    };
  }

  // Analyze facial features from Face API.js data
  analyzeFacialFeatures(faceData) {
    if (!faceData || !faceData.detection) {
      return { valid: false, error: 'No face detected' };
    }

    const { detection, expressions, landmarks } = faceData;
    
    // Eye contact analysis using gaze estimation
    const eyeContact = this.analyzeEyeContact(landmarks, detection);
    
    // Facial expression analysis
    const emotionAnalysis = this.analyzeEmotions(expressions);
    
    // Confidence indicators
    const confidenceIndicators = this.analyzeConfidenceIndicators(expressions, landmarks);
    
    // Professionalism metrics
    const professionalismMetrics = this.analyzeProfessionalism(expressions, landmarks);

    return {
      valid: true,
      timestamp: Date.now(),
      eyeContact: eyeContact.isLookingAtCamera,
      eyeContactDuration: eyeContact.duration,
      eyeContactMethod: eyeContact.method,
      gazeDirection: eyeContact.direction,
      dominantEmotion: emotionAnalysis.dominant,
      emotionConfidence: emotionAnalysis.confidence,
      expressions: expressions,
      confidenceIndicators,
      professionalismMetrics,
      facePosition: {
        x: detection.box.x,
        y: detection.box.y,
        width: detection.box.width,
        height: detection.box.height
      }
    };
  }

  // Analyze eye contact and gaze direction
  analyzeEyeContact(landmarks, detection) {
    // If no landmarks, use simplified detection based on face position
    if (!landmarks || !landmarks.getLeftEye || !landmarks.getRightEye) {
      return this.simplifiedEyeContactAnalysis(detection);
    }

    try {
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const nose = landmarks.getNose();

      // Simple gaze estimation based on eye and nose positions
      const eyeCenterX = (leftEye[0].x + rightEye[3].x) / 2;
      const eyeCenterY = (leftEye[0].y + rightEye[3].y) / 2;
      const noseTipX = nose[6].x;
      const noseTipY = nose[6].y;

      // Calculate gaze direction
      const horizontalGaze = eyeCenterX - noseTipX;
      const verticalGaze = eyeCenterY - noseTipY;

      // Determine if looking at camera (within threshold)
      const horizontalThreshold = detection.box.width * 0.15;
      const verticalThreshold = detection.box.height * 0.15;
      
      const isLookingAtCamera = 
        Math.abs(horizontalGaze) < horizontalThreshold && 
        Math.abs(verticalGaze) < verticalThreshold;

      let direction = 'center';
      if (horizontalGaze > horizontalThreshold) direction = 'right';
      else if (horizontalGaze < -horizontalThreshold) direction = 'left';
      if (verticalGaze > verticalThreshold) direction += '_down';
      else if (verticalGaze < -verticalThreshold) direction += '_up';

      return {
        isLookingAtCamera,
        direction,
        duration: isLookingAtCamera ? 1000 : 0, // 1 second per detection
        horizontalGaze,
        verticalGaze,
        method: 'landmarks'
      };
    } catch (error) {
      console.warn('Landmark-based eye contact analysis failed, using simplified method:', error);
      return this.simplifiedEyeContactAnalysis(detection);
    }
  }

  // Simplified eye contact analysis for fallback mode
  simplifiedEyeContactAnalysis(detection) {
    if (!detection || !detection.box) {
      return { isLookingAtCamera: false, direction: 'unknown', duration: 0, method: 'none' };
    }

    // Assume eye contact if face is centered and of reasonable size
    const { x, y, width, height } = detection.box;
    
    // Estimate if face is centered (looking at camera)
    const faceCenter = x + width / 2;
    const faceCenterY = y + height / 2;
    
    // Assume video dimensions (can be passed in later)
    const videoCenterX = 320; // Assuming 640px width
    const videoCenterY = 240; // Assuming 480px height
    
    const horizontalDistance = Math.abs(faceCenter - videoCenterX);
    const verticalDistance = Math.abs(faceCenterY - videoCenterY);
    
    // If face is reasonably centered, assume eye contact
    const isLookingAtCamera = horizontalDistance < 100 && verticalDistance < 80;
    
    // Determine general direction
    let direction = 'center';
    if (faceCenter > videoCenterX + 50) direction = 'right';
    else if (faceCenter < videoCenterX - 50) direction = 'left';
    if (faceCenterY > videoCenterY + 40) direction += '_down';
    else if (faceCenterY < videoCenterY - 40) direction += '_up';

    return {
      isLookingAtCamera,
      direction,
      duration: isLookingAtCamera ? 1000 : 0,
      horizontalDistance,
      verticalDistance,
      method: 'simplified'
    };
  }

  // Analyze emotions from expressions
  analyzeEmotions(expressions) {
    if (!expressions) {
      return { dominant: 'neutral', confidence: 0, analysis: {} };
    }

    // Find dominant emotion
    let dominantEmotion = 'neutral';
    let maxConfidence = 0;

    Object.entries(expressions).forEach(([emotion, confidence]) => {
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        dominantEmotion = emotion;
      }
    });

    // Debug logging for emotions
    console.log(`😊 Emotion Analysis:`, {
      dominant: dominantEmotion,
      confidence: Math.round(maxConfidence * 100),
      allEmotions: Object.keys(expressions).map(emotion => ({
        emotion,
        confidence: Math.round(expressions[emotion] * 100)
      }))
    });

    return {
      dominant: dominantEmotion,
      confidence: maxConfidence,
      analysis: expressions
    };
  }

  // Analyze confidence indicators
  analyzeConfidenceIndicators(expressions, landmarks) {
    const indicators = {
      nervousness: 0,
      anxiety: 0,
      composure: 0,
      alertness: 0
    };

    if (expressions) {
      // Handle various emotion types flexibly
      const fear = expressions.fearful || expressions.fear || 0;
      const surprise = expressions.surprised || expressions.surprise || 0;
      const sad = expressions.sad || expressions.sadness || 0;
      const happy = expressions.happy || expressions.happiness || 0;
      const neutral = expressions.neutral || 0;
      const confident = expressions.confident || expressions.confidence || 0;
      const focused = expressions.focused || expressions.focus || 0;
      const thoughtful = expressions.thoughtful || 0;
      const dull = expressions.dull || expressions.bored || 0;

      // High fear/surprise indicates nervousness
      indicators.nervousness = fear + surprise * 0.7;
      
      // Anxiety from sad + fearful expressions
      indicators.anxiety = sad + fear + dull * 0.5;
      
      // Composure from neutral + happy + confident
      indicators.composure = neutral + happy + confident + thoughtful * 0.5 - dull * 0.3;
      
      // Alertness from happy + surprised + focused (positive attention)
      indicators.alertness = happy + surprise * 0.5 + focused + confident * 0.8 - dull * 0.6;
    }

    return indicators;
  }

  // Analyze professionalism metrics
  analyzeProfessionalism(expressions, landmarks) {
    const metrics = {
      appropriateExpressions: 0,
      facialStability: 0,
      attentiveness: 0
    };

    if (expressions) {
      // Handle various emotion types flexibly
      const neutral = expressions.neutral || 0;
      const happy = expressions.happy || expressions.happiness || 0;
      const surprise = expressions.surprised || expressions.surprise || 0;
      const angry = expressions.angry || expressions.anger || 0;
      const disgust = expressions.disgusted || expressions.disgust || 0;
      const fear = expressions.fearful || expressions.fear || 0;
      const confident = expressions.confident || expressions.confidence || 0;
      const focused = expressions.focused || expressions.focus || 0;
      const thoughtful = expressions.thoughtful || 0;
      const dull = expressions.dull || expressions.bored || 0;

      // Professional expressions (neutral, happy, confident, focused, thoughtful) - minus dull
      metrics.appropriateExpressions = 
        neutral * 1.0 +
        happy * 0.8 +
        confident * 1.2 +
        focused * 1.1 +
        thoughtful * 0.9 +
        surprise * 0.3 -
        dull * 0.5; // Dullness reduces appropriateness

      // Facial stability (low negative emotions including dullness)
      metrics.facialStability = 1 - (angry + disgust + fear + dull * 0.3);

      // Attentiveness (alert but professional) - dullness heavily penalized
      metrics.attentiveness = 
        neutral * 0.7 +
        happy * 0.9 +
        confident * 1.0 +
        focused * 1.2 +
        thoughtful * 0.8 +
        Math.min(surprise, 0.3) -
        dull * 0.8; // Dullness significantly reduces attentiveness
    }

    return metrics;
  }

  // Update session scores based on analysis
  updateScores(session, analysis) {
    const weight = 0.1; // Smoothing factor for real-time updates

    if (analysis.valid) {
      // Confidence score based on expressions and eye contact
      const confidenceFromExpression = 
        (analysis.confidenceIndicators.composure - analysis.confidenceIndicators.nervousness) * 100;
      const confidenceFromEyeContact = analysis.eyeContact ? 20 : -10;
      const newConfidence = Math.max(0, Math.min(100, confidenceFromExpression + confidenceFromEyeContact));
      
      session.confidenceScore = session.confidenceScore * (1 - weight) + newConfidence * weight;

      // Engagement score based on eye contact and facial activity
      const eyeContactBonus = analysis.eyeContact ? 30 : 0;
      const expressionActivity = Math.min(50, Object.values(analysis.expressions || {}).reduce((a, b) => a + b, 0) * 100);
      const newEngagement = eyeContactBonus + expressionActivity;
      
      session.engagementScore = session.engagementScore * (1 - weight) + newEngagement * weight;

      // Professionalism score
      const professionalismFromExpression = analysis.professionalismMetrics.appropriateExpressions * 100;
      const stabilityBonus = analysis.professionalismMetrics.facialStability * 20;
      const newProfessionalism = professionalismFromExpression + stabilityBonus;
      
      session.professionalismScore = session.professionalismScore * (1 - weight) + newProfessionalism * weight;
    }
  }

  // Calculate eye contact percentage
  calculateEyeContactPercentage(session) {
    const totalDuration = Date.now() - session.startTime;
    if (totalDuration === 0) return 0;
    
    return Math.min(100, (session.eyeContactDuration / totalDuration) * 100);
  }

  // Generate real-time recommendations
  generateRecommendations(session, analysis) {
    const recommendations = [];

    // Eye contact recommendations
    const eyeContactPercent = this.calculateEyeContactPercentage(session);
    if (eyeContactPercent < 60) {
      recommendations.push({
        type: 'eye_contact',
        priority: 'high',
        message: 'Try to maintain more eye contact with the camera. Aim for 60-70% eye contact.',
        action: 'Look directly at the camera lens, not the screen.'
      });
    }

    // Confidence recommendations
    if (session.confidenceScore < 50) {
      recommendations.push({
        type: 'confidence',
        priority: 'medium',
        message: 'Show more confidence through your facial expressions.',
        action: 'Sit up straight, smile naturally, and speak with conviction.'
      });
    }

    // Expression recommendations
    if (analysis.valid && analysis.dominantEmotion) {
      if (analysis.dominantEmotion === 'fearful' || analysis.dominantEmotion === 'sad') {
        recommendations.push({
          type: 'expression',
          priority: 'medium',
          message: 'Try to relax and show more positive expressions.',
          action: 'Take a deep breath and think of positive aspects of the role.'
        });
      }
    }

    // Engagement recommendations
    if (session.engagementScore < 40) {
      recommendations.push({
        type: 'engagement',
        priority: 'high',
        message: 'Show more engagement and interest in the conversation.',
        action: 'Nod appropriately, maintain eye contact, and use facial expressions to show understanding.'
      });
    }

    return recommendations;
  }

  // Get session analysis summary
  getSessionSummary(sessionId) {
    const session = this.activeSessions.get(sessionId);
    const analysisPoints = this.analysisData.get(sessionId) || [];
    
    if (!session) return null;

    const duration = Date.now() - session.startTime;
    const eyeContactPercent = this.calculateEyeContactPercentage(session);
    
    // Calculate averages
    const emotionDistribution = this.calculateEmotionDistribution(analysisPoints);
    const averageScores = {
      confidence: Math.round(session.confidenceScore),
      engagement: Math.round(session.engagementScore),
      professionalism: Math.round(session.professionalismScore)
    };

    return {
      sessionId,
      duration: Math.round(duration / 1000), // seconds
      eyeContactPercentage: Math.round(eyeContactPercent),
      averageScores,
      emotionDistribution,
      totalAnalysisPoints: analysisPoints.length,
      recommendations: this.generateFinalRecommendations(session, analysisPoints),
      timeline: this.generateTimelineData(analysisPoints)
    };
  }

  // Calculate emotion distribution
  calculateEmotionDistribution(analysisPoints) {
    const emotions = {};
    let totalPoints = 0;

    analysisPoints.forEach(point => {
      if (point.type === 'facial' && point.data.valid) {
        const dominant = point.data.dominantEmotion;
        emotions[dominant] = (emotions[dominant] || 0) + 1;
        totalPoints++;
      }
    });

    // Convert to percentages
    Object.keys(emotions).forEach(emotion => {
      emotions[emotion] = Math.round((emotions[emotion] / totalPoints) * 100);
    });

    return emotions;
  }

  // Generate final recommendations
  generateFinalRecommendations(session, analysisPoints) {
    const recommendations = [];
    const eyeContactPercent = this.calculateEyeContactPercentage(session);

    // Overall performance recommendations
    if (session.confidenceScore < 60) {
      recommendations.push({
        category: 'Confidence',
        suggestion: 'Work on building confidence through practice and preparation.',
        impact: 'high'
      });
    }

    if (eyeContactPercent < 50) {
      recommendations.push({
        category: 'Eye Contact',
        suggestion: 'Practice maintaining eye contact with the camera during mock interviews.',
        impact: 'high'
      });
    }

    if (session.engagementScore < 50) {
      recommendations.push({
        category: 'Engagement',
        suggestion: 'Show more enthusiasm and interest through facial expressions and body language.',
        impact: 'medium'
      });
    }

    return recommendations;
  }

  // Generate timeline data for visualization
  generateTimelineData(analysisPoints) {
    const timeline = [];
    const intervalSize = 10000; // 10 seconds
    
    if (analysisPoints.length === 0) return timeline;

    const startTime = analysisPoints[0].timestamp;
    const endTime = analysisPoints[analysisPoints.length - 1].timestamp;
    
    for (let time = startTime; time <= endTime; time += intervalSize) {
      const pointsInInterval = analysisPoints.filter(
        point => point.timestamp >= time && point.timestamp < time + intervalSize
      );

      if (pointsInInterval.length > 0) {
        const avgScores = this.calculateAverageScores(pointsInInterval);
        timeline.push({
          timestamp: time,
          interval: Math.round((time - startTime) / 1000),
          scores: avgScores,
          pointCount: pointsInInterval.length
        });
      }
    }

    return timeline;
  }

  // Calculate average scores for a set of points
  calculateAverageScores(points) {
    let confidence = 0, engagement = 0, professionalism = 0;
    let count = 0;

    points.forEach(point => {
      if (point.scores) {
        confidence += point.scores.confidence;
        engagement += point.scores.engagement;
        professionalism += point.scores.professionalism;
        count++;
      }
    });

    return count > 0 ? {
      confidence: Math.round(confidence / count),
      engagement: Math.round(engagement / count),
      professionalism: Math.round(professionalism / count)
    } : { confidence: 0, engagement: 0, professionalism: 0 };
  }

  // End analysis session
  endSession(sessionId) {
    const summary = this.getSessionSummary(sessionId);
    
    // Clean up session data (keep for a while for retrieval)
    setTimeout(() => {
      this.activeSessions.delete(sessionId);
      this.analysisData.delete(sessionId);
    }, 300000); // Keep for 5 minutes after session ends

    console.log(`📊 Analysis session ended: ${sessionId}`);
    return summary;
  }
}

export default new CandidateAnalysisService();