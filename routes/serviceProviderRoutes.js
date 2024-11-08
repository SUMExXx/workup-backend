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
const { serviceProviderLogin, serviceProviderRegister, serviceProviderVerify, serviceProviderVerifyToken, serviceProviderUpdateDetails, getServiceProviderDetails } = require('../controllers/serviceProviderControllers');
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

router.post('/registerSP', serviceProviderRegister);

router.post('/verifySP', serviceProviderVerify);

router.post('/loginSP', serviceProviderLogin);

router.post('/verifyTokenSP', serviceProviderVerifyToken);

router.put('/updateDetailsSP', serviceProviderUpdateDetails);

router.post('/getServiceProviderDetails', getServiceProviderDetails);

module.exports = router;