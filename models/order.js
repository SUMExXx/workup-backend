const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId:      {
    type: String,
    required: true,
    unique: true
  },
  customerID:   {
    type: String,
    required: true
  },
  providerUUID: {
    type: String,
    required: true
  },
  // You can add more fields like totalAmount, items, date, etc.
  reviewed:     {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
