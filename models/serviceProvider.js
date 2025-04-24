const mongoose       = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Schema for individual reviews
const reviewSchema = new mongoose.Schema({
  _id:        { type: String, default: uuidv4 },   // Unique ID for each review
  customerID: { type: String, required: true },
  rating:     { type: Number, required: true, min: 1, max: 5 },
  text:       { type: String, trim: true },
  createdAt:  { type: Date, default: Date.now }
});

// Main ServiceProvider schema
const serviceProviderSchema = new mongoose.Schema({
  uuid: {
    type: String,
    default: uuidv4,
    unique: true,
    immutable: true
  },
  firstName:      { type: String, maxlength: 20, trim: true, default: null },
  middleName:     { type: String, maxlength: 20, trim: true, default: null },
  lastName:       { type: String, maxlength: 20, trim: true, default: null },
  email:          { type: String, required: true, trim: true, lowercase: true },
  password:       { type: String, required: true, trim: true },
  phoneNumber:    { type: String, trim: true, default: null },
  dateOfBirth:    { type: Date, default: null },
  imgURL:         { type: String, trim: true, default: null },
  imgPublicId:    { type: String, trim: true, default: null },

  // **Aggregates** for fast filtering/sorting
  rating:      { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },

  // Embedded reviews
  reviews:     [reviewSchema],

  newSProvider:       { type: Boolean, default: true },
  info:               { type: String, trim: true },
  startingPrice:      { type: Number, default: 0 },
  category:           { type: String, trim: true },
  subcategories:      { type: [String], default: [] },
  languages:          { type: [String], default: [] },
  availability:       { type: [String], default: [] },
  verificationStatus: { type: String, enum: ['pending','verified','rejected'], default: 'pending' },
  activityStatus:     { type: String, enum: ['active','inactive','suspended'], default: 'inactive' }
}, { timestamps: true });

/**
 * Before saving, recalculate:
 *  - reviewCount = number of embedded reviews
 *  - rating     = average of embedded review ratings
 */
serviceProviderSchema.pre('save', function(next) {
  if (this.isModified('reviews')) {
    const cnt = this.reviews.length;
    this.reviewCount = cnt;
    if (cnt > 0) {
      const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
      this.rating = sum / cnt;
    } else {
      this.rating = 0;
    }
  }
  next();
});

module.exports = mongoose.model('ServiceProvider', serviceProviderSchema);
