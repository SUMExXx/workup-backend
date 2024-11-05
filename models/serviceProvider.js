const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const geoCoordinateSchema = new mongoose.Schema({
    longitude: {
        type: Number
    },
    latitude: {
        type: Number
    }
});


const reviewSchema = new mongoose.Schema({
    customerID: {
        type: String,
    },
    rating :{
        type: Number,
        min: 0,
        max: 5,
        default: 0,
        enum: [1,2,3,4,5]
    },
    text:{
        type: String,
        trim: true
    }
});

const serviceProviderSchema = new mongoose.Schema({
    uuid: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        immutable: true,
        default: uuidv4
    },
    firstName: {
        type: String,
        maxlength: 20,
        trim: true,
        default: null
    },
    middleName: {
        type: String,
        maxlength: 20,
        trim: true,
        default: null
    },
    lastName: {
        type: String,
        maxlength: 20,
        trim: true,
        default: null
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        required: true
    },
    password: {
        type: String,
        trim: true,
        required: true
    },
    phoneNumber: {
        type: String,
        trim: true,
        default: null
    },
    dateOfBirth: {
        type: Date,
        default: null
    },
    imgURL: {
        type: String,
        trim: true,
        default: null
    },
    imgPublicId: {
        type: String,
        trim: true,
        default: null
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        required: true,
        default: 0
    },
    reviews: [reviewSchema], 
    newSProvider: {
        type: Boolean,
        default: true
    },
    info: {
        type: String,
        trim: true,
    },
    startingPrice: {
        type: Number,
        default: 0
    },
    category: {
        type: String,
        trim: true,
    },
    subcategories: [String],
    languages: {
        type: [String],
    },
    joiningDate: {
        type: Date,
        default: Date.now()
    },
    location: {
        type: Object, 
        default: null
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    activityStatus: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'inactive'
    },
    location: geoCoordinateSchema
});

module.exports = mongoose.model("ServiceProvider", serviceProviderSchema);
