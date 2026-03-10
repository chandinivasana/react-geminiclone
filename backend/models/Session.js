import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'model'], required: true },
  parts: [{ text: { type: String, required: true } }],
  createdAt: { type: Date, default: Date.now },
});

const SessionSchema = new mongoose.Schema({
  title: { type: String, default: 'New Chat' },
  messages: [MessageSchema],
  isPinned: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Session', SessionSchema);
