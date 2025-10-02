const mongoose = require("mongoose");

const neumaticSchema = new mongoose.Schema({
  brand: { type: String, required: true, index: true },
  model: { type: String, required: true, index: true },
  code: { type: String, required: true, index: true },
  size: { type: String, required: true, index: true },
  category: { type: String, required: true, index: true },
  description: { type: String },
  price: { type: Number, required: true, index: false },
  stock: { type: Number, required: true, index: false },
  thumbnails: [{ type: String }],
});

module.exports = mongoose.model("Neumatic", neumaticSchema);
