import mongoose from "mongoose";

const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGODB_URI = process.env.MONGODB_URI;
const CHANNEL_ID = process.env.CHANNEL_ID;

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(MONGODB_URI);
  isConnected = true;
}

const MovieSchema = new mongoose.Schema({
  file_id: String,
  file_name: String,
  file_size: Number,
  mime_type: String,
  createdAt: { type: Date, default: Date.now }
});

const Movie =
  mongoose.models.Movie || mongoose.model("Movie", MovieSchema);

export default async function handler(req, res) {
  // ✅ Handle GET safely (prevents 500)
  if (req.method === "GET") {
    return res.status(200).json({ status: "Bot is alive" });
  }

  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    await connectDB();

    const update = req.body;
    if (!update.message) {
      return res.status(200).end();
    }

    const msg = update.message;

    // 🎬 Video
    if (msg.video && msg.chat.id.toString() === CHANNEL_ID) {
      await Movie.create({
        file_id: msg.video.file_id,
        file_name: msg.video.file_name || "video",
        file_size: msg.video.file_size,
        mime_type: msg.video.mime_type
      });
    }

    // 📁 Document (movie as file)
    if (msg.document && msg.chat.id.toString() === CHANNEL_ID) {
      await Movie.create({
        file_id: msg.document.file_id,
        file_name: msg.document.file_name,
        file_size: msg.document.file_size,
        mime_type: msg.document.mime_type
      });
    }

    return res.status(200).end();
  } catch (err) {
    console.error("BOT ERROR:", err);
    return res.status(500).end();
  }
}
