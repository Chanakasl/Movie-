import mongoose from "mongoose";

const MovieSchema = new mongoose.Schema({
  title: String,
  telegram_file_id: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Movie ||
  mongoose.model("Movie", MovieSchema);
