import mongoose from "mongoose"

const feedbackSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
  eyeContact: { type: Number }, // 0-100
  confidence: { type: Number }, // 0-100
  pace: { type: Number }, // 1-5
  paceComment: String,
  bodyLanguage: String,
  suggestion: String,
  emotion: String,
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model("Feedback", feedbackSchema)
