import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Session from './models/Session.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gemini-clone')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Auth Middleware (simulated)
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (token && token === 'Bearer simulation-token') {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', authMiddleware, async (req, res) => {
  const { sessionId, prompt, image } = req.body;

  try {
    let session = sessionId ? await Session.findById(sessionId) : null;
    if (!session) {
      session = new Session({ 
        title: prompt.substring(0, 50) || 'New Chat',
        messages: [] 
      });
      await session.save();
    }

    // Context window: take the last 10 messages
    const history = session.messages.slice(-10).map(msg => ({
      role: msg.role,
      parts: msg.parts.map(p => ({ text: p.text })),
    }));

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Start chat with history
    const chat = model.startChat({
      history: history,
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Access-Control-Expose-Headers', 'x-session-id');
    res.setHeader('x-session-id', session._id.toString());

    const promptParts = [{ text: prompt }];
    if (image) {
      const [header, data] = image.split(',');
      const mimeType = header.match(/:(.*?);/)[1];
      promptParts.push({
        inlineData: {
          data,
          mimeType,
        },
      });
    }

    const result = await chat.sendMessageStream(promptParts);
    
    let fullResponse = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      res.write(chunkText);
    }

    // Save user prompt and AI response to session
    session.messages.push({ role: 'user', parts: [{ text: prompt }] });
    session.messages.push({ role: 'model', parts: [{ text: fullResponse }] });
    await session.save();

    res.end();
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Get session history
app.get('/api/session/:id', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// List all sessions
app.get('/api/sessions', authMiddleware, async (req, res) => {
  try {
    const sessions = await Session.find().sort({ isPinned: -1, updatedAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Search sessions
app.get('/api/chats/search', authMiddleware, async (req, res) => {
  const { q } = req.query;
  try {
    const sessions = await Session.find({
      title: { $regex: q, $options: 'i' }
    }).sort({ updatedAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search sessions' });
  }
});

// Update session (rename/pin)
app.put('/api/chats/:id', authMiddleware, async (req, res) => {
  const { title, isPinned } = req.body;
  const update = {};
  if (title !== undefined) update.title = title;
  if (isPinned !== undefined) update.isPinned = isPinned;
  
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Delete session
app.delete('/api/chats/:id', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Create new session
app.post('/api/session', authMiddleware, async (req, res) => {
  try {
    const session = new Session({ messages: [] });
    await session.save();
    res.json({ sessionId: session._id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
