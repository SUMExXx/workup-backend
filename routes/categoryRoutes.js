const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const UnverifiedEmailSP = require('../models/unverifiedEmailSP');
const bcrypt = require('bcrypt');
const multer = require('multer');
const Order = require('../models/order');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { transporter } = require('../utils/email');
const Customer = require('../models/customer');
const { serviceProviderLogin, serviceProviderRegister, serviceProviderVerify, serviceProviderVerifyToken } = require('../controllers/serviceProviderControllers');
const { addCategory, addSubcategory, addTask, updateCategory, updateSubcategory, updateTask } = require('../controllers/categoryControllers');
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const upload = multer({ storage: multer.memoryStorage() });

//body params: uuid, name, email

/* response:
  message: String
*/

router.post('/addCategory', addCategory);

router.post('/addSubcategory', addSubcategory);

router.post('/addTask', addTask);

router.put('/updateCategory', updateCategory);

router.put('/updateSubcategory', updateSubcategory);

router.put('/updateTask', updateTask);

router.post('/getCategories', serviceProviderVerifyToken);

router.post('/getSubcategories', serviceProviderVerifyToken);

router.post('/getTasks', serviceProviderVerifyToken);

router.delete('/deleteCategory', serviceProviderVerifyToken);

router.delete('/deleteSubcategory', serviceProviderVerifyToken);

router.delete('/deleteTask', serviceProviderVerifyToken);

module.exports = router;