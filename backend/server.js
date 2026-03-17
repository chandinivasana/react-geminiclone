import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';
import { WebSocketServer } from 'ws';
import http from 'http';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Simulated User (for Prisma relations)
const SIMULATED_USER_ID = "cm7u000000000000000000000";

async function ensureUserExists() {
  const user = await prisma.user.findUnique({ where: { id: SIMULATED_USER_ID } });
  if (!user) {
    await prisma.user.create({
      data: {
        id: SIMULATED_USER_ID,
        email: "demo@gemini-clone.com",
        name: "Demo User"
      }
    });
  }
}

// REST Endpoints
app.post('/api/chat', async (req, res) => {
  const { sessionId, prompt, fileData, mimeType, gemId } = req.body;

  try {
    await ensureUserExists();
    let conversation = sessionId ? await prisma.conversation.findUnique({ 
        where: { id: sessionId },
        include: { messages: { take: 10, orderBy: { createdAt: 'desc' } } }
    }) : null;

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          title: prompt.substring(0, 50) || 'New Chat',
          userId: SIMULATED_USER_ID,
          gemId: gemId || null
        },
        include: { messages: true }
      });
    }

    let systemInstruction = undefined;
    if (conversation.gemId) {
      const gem = await prisma.gem.findUnique({ where: { id: conversation.gemId } });
      if (gem) systemInstruction = gem.systemPrompt;
    }

    const history = conversation.messages.reverse().map(msg => ({
      role: msg.role === 'USER' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const modelOptions = { 
      model: 'gemini-1.5-flash',
      tools: [{ googleSearch: {} }]
    };
    if (systemInstruction) modelOptions.systemInstruction = systemInstruction;
    
    const model = genAI.getGenerativeModel(modelOptions);
    const chat = model.startChat({ history });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Access-Control-Expose-Headers', 'x-session-id');
    res.setHeader('x-session-id', conversation.id);

    const promptParts = [{ text: prompt }];
    if (fileData && mimeType) {
      const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
      promptParts.push({ inlineData: { data: base64Data, mimeType } });
    }

    const result = await chat.sendMessageStream(promptParts);
    let fullResponse = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      res.write(chunkText);
    }

    // Persist to DB
    await prisma.message.create({
        data: { conversationId: conversation.id, role: 'USER', content: prompt }
    });
    await prisma.message.create({
        data: { conversationId: conversation.id, role: 'ASSISTANT', content: fullResponse }
    });

    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Generation failed' });
  }
});

app.get('/api/sessions', async (req, res) => {
  const sessions = await prisma.conversation.findMany({
    where: { userId: SIMULATED_USER_ID },
    orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    include: { gem: true }
  });
  res.json(sessions);
});

// WebSocket for Voice
wss.on('connection', (ws) => {
  console.log('Voice socket connected');
  ws.on('message', async (message) => {
    // Basic echo for transcription visualization simulation
    ws.send(JSON.stringify({ type: 'transcription', text: message.toString() }));
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
