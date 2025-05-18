const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  Image: [String],
  Price: String,
  ProductDescription: String,
  ProductName: String,
  Size: String,
});
module.exports = mongoose.model("Product", productSchema, "products");