import mongoose from "mongoose";

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const MONGODB_URI = process.env.MONGODB_URI;

// Mongo connect
if (!mongoose.connection.readyState) {
  await mongoose.connect(MONGODB_URI);
}

// Schema
const movieSchema = new mongoose.Schema({
  file_id: String,
  file_name: String,
  file_size: Number,
  mime_type: String,
  createdAt: { type: Date, default: Date.now }
});

const Movie = mongoose.models.Movie || mongoose.model("Movie", movieSchema);

export default async function handler(req, res) {
  try {
    const update = req.body;

    // ✅ CHANNEL POST HANDLER (IMPORTANT)
    if (update.channel_post) {
      const post = update.channel_post;

      if (String(post.chat.id) !== CHANNEL_ID) {
        return res.status(200).send("Ignored");
      }

      const file =
        post.video ||
        post.document;

      if (!file) {
        return res.status(200).send("No file");
      }

      await Movie.create({
        file_id: file.file_id,
        file_name: file.file_name || "video",
        file_size: file.file_size,
        mime_type: file.mime_type
      });

      return res.status(200).send("Saved");
    }

    // ✅ USER MESSAGE HANDLER
    if (update.message) {
      const msg = update.message;

      if (msg.text === "/movie") {
        const latest = await Movie.findOne().sort({ createdAt: -1 });

        if (!latest) {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: msg.chat.id,
              text: "❌ No movies found"
            })
          });
        } else {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendVideo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: msg.chat.id,
              video: latest.file_id
            })
          });
        }
      }
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
}
