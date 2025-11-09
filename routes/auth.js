import express from "express"
import jwt from "jsonwebtoken"
import User from "../models/User.js"

const router = express.Router()

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "User already exists" })
    }

    const user = await User.create({ name, email, password })
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || "secret", {
      expiresIn: "7d",
    })

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    })
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
})

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || "secret", {
      expiresIn: "7d",
    })

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    })
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
})

export default router
