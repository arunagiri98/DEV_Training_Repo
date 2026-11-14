require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

const itemSchema = new mongoose.Schema(
  { name: { type: String, required: true, trim: true } },
  { timestamps: true }
);
const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);

// Serverless functions can be frozen and reused, so we reuse one connection
// across requests instead of opening a new one every time.
let connecting = null;
function connectDB() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connecting) {
    connecting = mongoose.connect(process.env.MONGODB_URI).catch((err) => {
      connecting = null;
      throw err;
    });
  }
  return connecting;
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/items', async (req, res, next) => {
  try {
    await connectDB();
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

app.post('/api/items', async (req, res, next) => {
  try {
    const name = (req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name is required' });
    await connectDB();
    const item = await Item.create({ name });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

// Run a local server when started directly (npm start / npm run dev).
// On Vercel the exported app is invoked by the platform instead.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
}

module.exports = app;
