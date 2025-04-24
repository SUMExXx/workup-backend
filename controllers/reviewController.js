const ServiceProvider = require('../models/serviceProvider');
const Order           = require('../models/order');        // adjust path as needed

exports.submitReview = async (req, res) => {
  try {
    const { orderId, rating, text } = req.body;

    // 1) Find the order to get its providerUUID & customerID
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // Prevent double-reviews
    if (order.reviewed) {
      return res.status(400).json({
        success: false,
        message: 'This order has already been reviewed.'
      });
    }

    const providerUUID = order.providerUUID;  
    const customerID   = order.customerID;

    // 2) Find the service provider
    const provider = await ServiceProvider.findOne({ uuid: providerUUID });
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Service provider not found.'
      });
    }

    // 3) Append the review sub-document (using orderId as its _id)
    provider.reviews.push({
      _id:        orderId,
      customerID,
      rating,
      text
    });

    // 4) Mark order as reviewed
    order.reviewed = true;

    // 5) Save both documents
    await order.save();
    await provider.save();     // triggers your pre-save hook

    return res.json({
      success: true,
      message: 'Review submitted successfully.'
    });

  } catch (err) {
    console.error('submitReview error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};
