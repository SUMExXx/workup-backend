const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const UnverifiedEmailSP = require('../models/unverifiedEmailSP');
const bcrypt = require('bcrypt');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { transporter } = require('../utils/email');
const Customer = require('../models/customer');
const { storage } = require('../storage');
const { serviceProviderLogin, serviceProviderRegister, serviceProviderVerify, serviceProviderVerifyToken } = require('../controllers/serviceProviderControllers');
const { addCategory, addSubcategory, addTask, updateCategory, updateSubcategory, updateTask, deleteCategory, deleteSubcategory, deleteTask, getCategory, getSubcategory, getTask } = require('../controllers/categoryControllers');
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

router.post('/addCategory', storage.single('image'), addCategory);

router.post('/addSubcategory', addSubcategory);

router.post('/addTask', addTask);

router.put('/updateCategory', storage.single('image'), updateCategory);

router.put('/updateSubcategory', updateSubcategory);

router.put('/updateTask', updateTask);

router.get('/getCategory', getCategory);

router.get('/getSubcategory', getSubcategory);

router.get('/getTask', getTask);

router.delete('/deleteCategory', deleteCategory);

router.delete('/deleteSubcategory', deleteSubcategory);

router.delete('/deleteTask', deleteTask);

module.exports = router;