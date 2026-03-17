import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Session from './models/Session.js';
import Gem from './models/Gem.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for file uploads

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
  const { sessionId, prompt, fileData, mimeType, gemId } = req.body;

  try {
    let session = sessionId ? await Session.findById(sessionId) : null;
    if (!session) {
      session = new Session({ 
        title: prompt.substring(0, 50) || 'New Chat',
        messages: [],
        gemId: gemId || null
      });
      await session.save();
    }

    // Fetch associated gem for system prompt
    let systemInstruction = undefined;
    if (session.gemId) {
      const gem = await Gem.findById(session.gemId);
      if (gem && gem.systemPrompt) {
        systemInstruction = gem.systemPrompt;
      }
    }

    // Context window: take the last 10 messages
    const history = session.messages.slice(-10).map(msg => ({
      role: msg.role,
      parts: msg.parts.map(p => ({ text: p.text })),
    }));

    const modelOptions = { 
      model: 'gemini-1.5-flash',
      tools: [{ googleSearch: {} }]
    };
    if (systemInstruction) {
      modelOptions.systemInstruction = systemInstruction;
    }
    const model = genAI.getGenerativeModel(modelOptions);
    
    // Start chat with history
    const chat = model.startChat({
      history: history,
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Access-Control-Expose-Headers', 'x-session-id');
    res.setHeader('x-session-id', session._id.toString());

    const promptParts = [{ text: prompt }];
    if (fileData && mimeType) {
      const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
      promptParts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
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

// Deep Research endpoint
app.post('/api/research', authMiddleware, async (req, res) => {
  const { query } = req.body;
  
  try {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      tools: [{ googleSearch: {} }],
      systemInstruction: "You are an expert research assistant. Deconstruct the user's query into 3-5 sub-topics, synthesize a comprehensive report with an Executive Summary, Detailed Findings, and Conclusion. Format entirely in Markdown."
    });

    const result = await model.generateContentStream(`Conduct deep research on: ${query}`);
    
    for await (const chunk of result.stream) {
      res.write(chunk.text());
    }
    res.end();
  } catch (error) {
    console.error('Error in /api/research:', error);
    res.status(500).json({ error: 'Deep research failed' });
  }
});

// --- Gems endpoints ---
app.get('/api/gems', authMiddleware, async (req, res) => {
  try {
    const gems = await Gem.find().sort({ createdAt: -1 });
    res.json(gems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gems' });
  }
});

app.post('/api/gems', authMiddleware, async (req, res) => {
  const { name, description, systemPrompt, icon } = req.body;
  try {
    const newGem = new Gem({ name, description, systemPrompt, icon });
    await newGem.save();
    res.json(newGem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create gem' });
  }
});

// --- Session endpoints ---
app.get('/api/session/:id', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('gemId');
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

app.get('/api/sessions', authMiddleware, async (req, res) => {
  try {
    const sessions = await Session.find().sort({ isPinned: -1, updatedAt: -1 }).populate('gemId');
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

app.get('/api/chats/search', authMiddleware, async (req, res) => {
  const { q } = req.query;
  try {
    const sessions = await Session.find({
      title: { $regex: q, $options: 'i' }
    }).sort({ updatedAt: -1 }).populate('gemId');
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search sessions' });
  }
});

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

app.delete('/api/chats/:id', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

app.post('/api/session', authMiddleware, async (req, res) => {
  try {
    const session = new Session({ messages: [], gemId: req.body.gemId || null });
    await session.save();
    res.json({ sessionId: session._id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});