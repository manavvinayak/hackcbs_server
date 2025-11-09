import express from "express"
import memoryStorage from "../utils/memoryStorage.js"

const router = express.Router()

// GET /api/questions - Fetch questions based on type
router.get("/", async (req, res) => {
  try {
    const { type } = req.query
    console.log(`🔍 Fetching questions for type: ${type || 'all'}`);
    
    let questions;
    
    if (type) {
      // Get random questions for specific type
      questions = memoryStorage.getAllQuestions().slice(0, 5);
    } else {
      // Get all questions if no type specified
      questions = memoryStorage.getAllQuestions().slice(0, 5);
    }
    
    console.log(`📝 Found ${questions.length} questions`, questions);
    
    res.json({ 
      success: true,
      questions,
      count: questions.length,
      type: type || 'all'
    })
  } catch (err) {
    console.error("❌ Error fetching questions:", err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching questions", 
      error: err.message 
    })
  }
})

// POST /api/questions - Create new question
router.post("/", async (req, res) => {
  try {
    const { text, category, difficulty, topic } = req.body
    
    const questionData = {
      question: text,
      type: category,
      category: topic || category,
      difficulty: difficulty || 'medium',
      createdAt: new Date()
    }
    
    // For now, just return success since we're using sample data
    console.log("📝 Question creation request:", questionData);
    
    res.status(201).json({
      success: true,
      message: "Question received (using sample data for now)",
      question: questionData
    })
  } catch (err) {
    console.error("❌ Error creating question:", err);
    res.status(500).json({ 
      success: false,
      message: "Error creating question", 
      error: err.message 
    })
  }
})

export default router
