// In-memory storage for when database is not available
class MemoryStorage {
  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.questions = new Map();
    this.feedbacks = new Map();
    
    // Initialize with some sample data
    this.initializeSampleData();
  }

  initializeSampleData() {
    // Sample questions for different interview types
    const sampleQuestions = [
      // Behavioral Questions
      {
        id: '1',
        type: 'behavioral',
        question: 'Tell me about a time when you faced a challenging problem at work.',
        category: 'Problem Solving',
        difficulty: 'medium'
      },
      {
        id: '2',
        type: 'behavioral',
        question: 'Describe a situation where you had to work with a difficult team member.',
        category: 'Teamwork',
        difficulty: 'medium'
      },
      {
        id: '3',
        type: 'behavioral',
        question: 'Give me an example of a time you had to learn something new quickly.',
        category: 'Adaptability',
        difficulty: 'easy'
      },
      {
        id: '4',
        type: 'behavioral',
        question: 'Tell me about a time when you failed at something.',
        category: 'Self-awareness',
        difficulty: 'hard'
      },
      {
        id: '5',
        type: 'behavioral',
        question: 'Describe a time when you had to meet a tight deadline.',
        category: 'Time Management',
        difficulty: 'medium'
      },

      // HR Round Questions
      {
        id: '6',
        type: 'hr',
        question: 'Why do you want to work for our company?',
        category: 'Company Interest',
        difficulty: 'easy'
      },
      {
        id: '7',
        type: 'hr',
        question: 'What are your salary expectations?',
        category: 'Compensation',
        difficulty: 'medium'
      },
      {
        id: '8',
        type: 'hr',
        question: 'Where do you see yourself in 5 years?',
        category: 'Career Goals',
        difficulty: 'easy'
      },
      {
        id: '9',
        type: 'hr',
        question: 'What are your greatest strengths and weaknesses?',
        category: 'Self-assessment',
        difficulty: 'medium'
      },
      {
        id: '10',
        type: 'hr',
        question: 'Why are you leaving your current job?',
        category: 'Career Change',
        difficulty: 'medium'
      },

      // Technical Questions
      {
        id: '11',
        type: 'technical',
        question: 'Explain the difference between var, let, and const in JavaScript.',
        category: 'JavaScript',
        difficulty: 'easy'
      },
      {
        id: '12',
        type: 'technical',
        question: 'What is the difference between SQL and NoSQL databases?',
        category: 'Database',
        difficulty: 'medium'
      },
      {
        id: '13',
        type: 'technical',
        question: 'How would you optimize a slow-performing web application?',
        category: 'Performance',
        difficulty: 'hard'
      },
      {
        id: '14',
        type: 'technical',
        question: 'Explain the concept of RESTful APIs.',
        category: 'API Design',
        difficulty: 'medium'
      },
      {
        id: '15',
        type: 'technical',
        question: 'What is version control and why is it important?',
        category: 'Development Tools',
        difficulty: 'easy'
      }
    ];

    sampleQuestions.forEach(q => this.questions.set(q.id, q));
    console.log(`📚 Initialized ${sampleQuestions.length} sample questions`);
  }

  // User operations
  createUser(userData) {
    const id = Date.now().toString();
    const user = { id, ...userData, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  getUserById(id) {
    return this.users.get(id);
  }

  getUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  // Session operations
  createSession(sessionData) {
    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = { id, ...sessionData, createdAt: new Date() };
    this.sessions.set(id, session);
    return session;
  }

  getSessionById(id) {
    return this.sessions.get(id);
  }

  updateSession(id, updateData) {
    const session = this.sessions.get(id);
    if (session) {
      const updated = { ...session, ...updateData, updatedAt: new Date() };
      this.sessions.set(id, updated);
      return updated;
    }
    return null;
  }

  // Question operations
  getAllQuestions() {
    return Array.from(this.questions.values());
  }

  getQuestionById(id) {
    return this.questions.get(id);
  }

  getRandomQuestions(count = 5, type = null) {
    let questions = Array.from(this.questions.values());
    
    if (type) {
      questions = questions.filter(q => q.type === type);
    }
    
    // Shuffle and return requested count
    const shuffled = questions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Feedback operations
  createFeedback(feedbackData) {
    const id = Date.now().toString();
    const feedback = { id, ...feedbackData, createdAt: new Date() };
    this.feedbacks.set(id, feedback);
    return feedback;
  }

  getFeedbackBySessionId(sessionId) {
    for (const feedback of this.feedbacks.values()) {
      if (feedback.sessionId === sessionId) return feedback;
    }
    return null;
  }

  // Analytics
  getStats() {
    return {
      totalUsers: this.users.size,
      totalSessions: this.sessions.size,
      totalQuestions: this.questions.size,
      totalFeedbacks: this.feedbacks.size,
      storage: 'memory'
    };
  }

  // Clear all data
  clear() {
    this.users.clear();
    this.sessions.clear();
    this.questions.clear();
    this.feedbacks.clear();
    this.initializeSampleData();
  }
}

export default new MemoryStorage();