const mongoose = require('mongoose');
const deliveredSchema = new mongoose.Schema({
  Name: String,
  Email: String,
  PhoneNumber: Number,
  Address: String,
  City: String,
  PinCode: Number,
  orders: [
    {
      id: String,
      image:String,
      quantity: Number,
      price: Number
    }
  ],
  PaymentMode: String,
  OrderDate: String,
});
module.exports = mongoose.model("Delivered", deliveredSchema, "delivered");