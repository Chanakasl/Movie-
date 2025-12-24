import mongoose from "mongoose";

const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGODB_URI = process.env.MONGODB_URI;
const CHANNEL_ID = process.env.CHANNEL_ID;

// 🔌 MongoDB connection (safe for Vercel)
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(MONGODB_URI);
  isConnected = true;
}

// 🎬 Movie Schema
const movieSchema = new mongoose.Schema(
  {
    file_id: String,
    file_name: String,
    file_size: Number,
    mime_type: String
  },
  { timestamps: true }
);

const Movie = mongoose.models.Movie || mongoose.model("Movie", movieSchema);

// 🌐 Telegram API helper
async function telegram(method, data) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}

// 🚀 MAIN HANDLER
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("OK");
  }

  try {
    await connectDB();

    const update = req.body;

    /* ===============================
       🎬 CHANNEL MOVIE UPLOAD HANDLER
       =============================== */
    if (update.channel_post) {
      const msg = update.channel_post;

      if (
        msg.chat.id == CHANNEL_ID &&
        msg.video
      ) {
        await Movie.create({
          file_id: msg.video.file_id,
          file_name: msg.caption || "Movie",
          file_size: msg.video.file_size,
          mime_type: msg.video.mime_type
        });

        return res.status(200).send("Movie saved");
      }
    }

    /* ===============================
       👤 USER MESSAGE HANDLER
       =============================== */
    if (update.message) {
      const msg = update.message;

      if (msg.text === "/movie") {
        const latest = await Movie.findOne().sort({ createdAt: -1 });

        if (!latest) {
          await telegram("sendMessage", {
            chat_id: msg.chat.id,
            text: "❌ No movies found"
          });
        } else {
          await telegram("sendVideo", {
            chat_id: msg.chat.id,
            video: latest.file_id
          });
        }
      }
    }

    return res.status(200).send("OK");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error");
  }
}
