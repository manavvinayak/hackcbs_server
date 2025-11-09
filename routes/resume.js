import express from "express"
import multer from "multer"
import pdfParse from "pdf-parse"
import User from "../models/User.js"

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

// Simple resume analysis (keyword extraction)
const analyzeResume = (text) => {
  const skillKeywords = [
    "javascript",
    "react",
    "python",
    "java",
    "node.js",
    "mongodb",
    "sql",
    "aws",
    "docker",
    "git",
    "typescript",
    "express",
    "tailwind",
    "html",
    "css",
  ]
  const skills = skillKeywords.filter((skill) => text.toLowerCase().includes(skill))

  const yearsMatch = text.match(/(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/i)
  const yearsExperience = yearsMatch ? Number.parseInt(yearsMatch[1]) : 0

  return {
    skills,
    yearsExperience,
    fullText: text.substring(0, 500),
  }
}

router.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    // Parse PDF
    const pdfData = await pdfParse(req.file.buffer)
    const analysis = analyzeResume(pdfData.text)

    // Save resume info to user
    await User.findByIdAndUpdate(req.user.userId, {
      resume: req.file.originalname,
    })

    res.json({ analysis, message: "Resume uploaded successfully" })
  } catch (err) {
    res.status(500).json({ message: "Error processing resume", error: err.message })
  }
})

export default router
