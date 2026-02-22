import express from 'express';
import cors from 'cors';

const app = express();

// --- Middlewares ---
// Allow cross-origin requests from your Next.js frontend
app.use(cors()); 

// Allow Express to parse incoming JSON payloads (req.body)
app.use(express.json()); 

// --- Test Route ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'SkillSwap API is running!' });
});

// We will import and use our user, swap, and message routes here later
// e.g., app.use('/api/users', userRoutes);

export default app;