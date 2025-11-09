
import express from "express"
import { createServer } from "http"
import cors from "cors"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.js"
import questionsRoutes from "./routes/questions.js"
import sessionsRoutes from "./routes/sessions.js"
import analyzeRoutes from "./routes/analyze.js"
import resumeRoutes from "./routes/resume.js"
import webcamRoutes from "./routes/webcam.js"
import { authenticateToken, optionalAuth } from "./middleware/auth.js"
import { connectDB } from "./utils/helpers.js"
import websocketService from "./services/websocket.js"

dotenv.config()

const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 5000

// Initialize WebSocket service
websocketService.initialize(server)

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}))
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true }))

// Database Connection
connectDB()

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/questions", questionsRoutes)
app.use("/api/sessions", optionalAuth, sessionsRoutes)
app.use("/api/analyze", authenticateToken, analyzeRoutes)
app.use("/api/resume", authenticateToken, resumeRoutes)
app.use("/api/webcam", authenticateToken, webcamRoutes)

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "Server is running",
    environment: process.env.NODE_ENV,
    port: PORT,
    features: {
      webcam: true,
      websocket: true,
      aiAnalysis: true
    },
    timestamp: new Date().toISOString()
  })
})

// WebSocket connection test endpoint
app.get("/api/ws-test", (req, res) => {
  const connections = websocketService.getActiveConnections();
  res.json({
    websocket: {
      status: "active",
      connections: connections.total,
      sessions: connections.sessions
    }
  })
})

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV}`)
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL}`)
  console.log(`🔗 WebSocket enabled for real-time communication`)
  console.log(`📹 Webcam analysis ready`)
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} is already in use`)
    console.log(`💡 Try stopping other servers first or use a different port`)
    console.log(`🔧 Kill processes: taskkill /IM node.exe /F`)
    process.exit(1)
  } else {
    console.error('❌ Server error:', err)
    process.exit(1)
  }
})
