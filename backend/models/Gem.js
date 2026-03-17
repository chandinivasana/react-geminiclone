import mongoose from 'mongoose';

const GemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  systemPrompt: { type: String, required: true },
  icon: { type: String, default: 'bot' },
  isPublic: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Gem', GemSchema);
