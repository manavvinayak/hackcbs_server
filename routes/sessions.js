import express from "express"
import Session from "../models/Session.js"

const router = express.Router()

router.get("/", async (req, res) => {
  try {
    console.log('🔍 Fetching sessions for user:', req.user?.userId)
    const sessions = await Session.find({ userId: req.user?.userId || 'guest' }).sort({ createdAt: -1 })
    console.log('📊 Found sessions:', sessions.length)
    
    // Calculate analytics
    const analytics = {
      totalSessions: sessions.length,
      averageScore: sessions.length > 0 ? 
        Math.round(sessions.reduce((sum, session) => sum + (session.score || 0), 0) / sessions.length) : 0,
      totalTime: sessions.reduce((sum, session) => sum + (session.duration || 0), 0),
      bestScore: sessions.length > 0 ? Math.max(...sessions.map(s => s.score || 0)) : 0,
      recentImprovement: sessions.length >= 2 ? 
        (sessions[0].score || 0) - (sessions[sessions.length - 1].score || 0) : 0,
      sessionsByType: {
        behavioral: sessions.filter(s => s.type === 'behavioral').length,
        hr: sessions.filter(s => s.type === 'hr').length,
        technical: sessions.filter(s => s.type === 'technical').length
      }
    }
    
    console.log('📈 Analytics:', analytics)
    res.json({ sessions, analytics })
  } catch (err) {
    console.error('❌ Error fetching sessions:', err)
    res.status(500).json({ message: "Error fetching sessions", error: err.message })
  }
})

router.post("/", async (req, res) => {
  try {
    const { type, duration, score, feedback, answers } = req.body
    const session = await Session.create({
      userId: req.user.userId,
      type,
      duration,
      score,
      feedback,
      answers,
    })
    res.status(201).json(session)
  } catch (err) {
    res.status(500).json({ message: "Error creating session", error: err.message })
  }
})

router.get("/:id", async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate("userId")
    if (!session) {
      return res.status(404).json({ message: "Session not found" })
    }
    res.json(session)
  } catch (err) {
    res.status(500).json({ message: "Error fetching session", error: err.message })
  }
})

// Generate sample data for testing (remove in production)
router.post("/generate-sample", async (req, res) => {
  try {
    const sampleSessions = [
      {
        userId: 'guest',
        type: 'behavioral',
        duration: 25,
        score: 85,
        feedback: { overall: 'Good confidence and clear communication' },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      },
      {
        userId: 'guest',
        type: 'hr',
        duration: 15,
        score: 78,
        feedback: { overall: 'Well prepared answers' },
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        userId: 'guest',
        type: 'technical',
        duration: 30,
        score: 92,
        feedback: { overall: 'Strong technical knowledge' },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        userId: 'guest',
        type: 'behavioral',
        duration: 20,
        score: 88,
        feedback: { overall: 'Improved storytelling and structure' },
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      }
    ]

    await Session.insertMany(sampleSessions)
    res.json({ message: "Sample sessions created successfully", count: sampleSessions.length })
  } catch (err) {
    res.status(500).json({ message: "Error creating sample sessions", error: err.message })
  }
})

export default router
