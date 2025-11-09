import jwt from "jsonwebtoken"

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "No token provided" })
  }

  jwt.verify(token, process.env.JWT_SECRET || "secret", (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" })
    req.user = user
    next()
  })
}

// Optional authentication - allows guest access
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    // No token provided, set as guest user
    req.user = { userId: 'guest' }
    return next()
  }

  jwt.verify(token, process.env.JWT_SECRET || "secret", (err, user) => {
    if (err) {
      // Invalid token, set as guest user
      req.user = { userId: 'guest' }
    } else {
      req.user = user
    }
    next()
  })
}
