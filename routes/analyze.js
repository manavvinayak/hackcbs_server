import express from "express"
import Feedback from "../models/Feedback.js"

const router = express.Router()

router.post("/", async (req, res) => {
  try {
    const { question, sessionId, emotionData } = req.body

    const emotionArray = typeof emotionData === "string" ? JSON.parse(emotionData) : emotionData || []
    const averageConfidence =
      emotionArray.length > 0
        ? Math.round(emotionArray.reduce((acc, e) => acc + e.confidence, 0) / emotionArray.length)
        : 50

    const emotionCounts = {}
    emotionArray.forEach((e) => {
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1
    })
    const dominantEmotion =
      Object.keys(emotionCounts).length > 0
        ? Object.keys(emotionCounts).reduce((a, b) => (emotionCounts[a] > emotionCounts[b] ? a : b))
        : "neutral"

    const feedbackData = {
      eyeContact: Math.floor(Math.random() * 40 + 60),
      confidence: averageConfidence,
      pace: Math.floor(Math.random() * 3 + 2),
      paceComment: "Good pacing. Try to pause for emphasis.",
      bodyLanguage: "Good posture. Maintain consistent hand gestures.",
      emotion: dominantEmotion,
      suggestion: "Your answer was comprehensive. Try to structure it with a brief intro, main points, and conclusion.",
    }

    if (sessionId) {
      await Feedback.create({
        sessionId,
        ...feedbackData,
      })
    }

    res.json(feedbackData)
  } catch (err) {
    res.status(500).json({ message: "Error analyzing feedback", error: err.message })
  }
})

export default router
