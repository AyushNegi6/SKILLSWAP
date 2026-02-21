import http from 'http';
import dotenv from 'dotenv';
import app from './src/app.js';
import connectDB from './src/config/db.js';

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 8080;

// 🚀 FUTURE-PROOFING FOR CHAT:
// Instead of app.listen(), we wrap Express in a raw HTTP server.
// When you are ready to build the chat service, you just pass this 'server' 
// variable into Socket.io, and it will run alongside Express seamlessly!
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});