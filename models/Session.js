import mongoose from "mongoose"

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["behavioral", "hr", "technical"], required: true },
  duration: { type: Number }, // in minutes
  score: { type: Number },
  feedback: { type: mongoose.Schema.Types.Mixed },
  answers: [{ questionId: mongoose.Schema.Types.ObjectId, answer: String, feedback: mongoose.Schema.Types.Mixed }],
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model("Session", sessionSchema)
