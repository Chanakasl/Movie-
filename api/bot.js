import TelegramBot from "node-telegram-bot-api";
import { connectDB } from "../lib/db.js";
import Movie from "../models/Movie.js";

const bot = new TelegramBot(process.env.BOT_TOKEN);
await connectDB();

/* 🔹 AUTO SAVE WHEN MOVIE UPLOADED TO CHANNEL */
bot.on("channel_post", async (msg) => {
  if (!msg.video && !msg.document) return;

  const fileId = msg.video
    ? msg.video.file_id
    : msg.document.file_id;

  const title = msg.caption || "Untitled Movie";

  // prevent duplicates
  const exists = await Movie.findOne({ telegram_file_id: fileId });
  if (exists) return;

  await Movie.create({
    title,
    telegram_file_id: fileId
  });

  console.log("Movie saved:", title);
});

/* 🔹 USER COMMAND */
bot.onText(/\/movies/, async (msg) => {
  const chatId = msg.chat.id;
  const movies = await Movie.find().sort({ createdAt: -1 });

  if (!movies.length) {
    return bot.sendMessage(chatId, "No movies available ❌");
  }

  for (const movie of movies) {
    await bot.sendVideo(chatId, movie.telegram_file_id, {
      caption: movie.title
    });
  }
});

export default async function handler(req, res) {
  res.status(200).send("Bot running");
}
