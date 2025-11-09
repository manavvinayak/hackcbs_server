import mongoose from "mongoose"

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  category: { type: String, enum: ["behavioral", "hr", "technical"], required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"] },
  topic: { type: String },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model("Question", questionSchema)
