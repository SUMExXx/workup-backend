const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const UnverifiedEmail = require('../models/unverifiedEmail');
const bcrypt = require('bcrypt');
const multer = require('multer');
const {Category, Subcategory, Task} = require('../models/categories');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { transporter } = require('../utils/email');
const Customer = require('../models/customer');
const ServiceProvider = require('../models/serviceProvider');
const UnverifiedOrder = require('../models/unverifiedOrder');
require('dotenv').config();

module.exports.customerRegister = async (req, res) => {

  const email = req.body.email;
  const password = req.body.password;

  await UnverifiedEmail.findOneAndDelete({email: email})

  const hashedPassword = await bcrypt.hash(password, 10);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const unverifiedEmail = new UnverifiedEmail(
    {
      email: email,
      password: hashedPassword,
      otp: otp
    }
  )

  try{
    await unverifiedEmail.save().then(() => {

      res.send({message: `Verify Email`});

      let mailOptions = {
        from: `Work Up <${process.env.EMAIL_USER}>`, // Sender address
        to: `${email}`, // List of receivers
        subject: 'Work Up email verification', // Subject line
        text: `Your OTP for verification is ${otp}`, // Plain text body
        html: `<div style="max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); text-align: center; background-color: #f9f9f9;"><h2 style="margin-bottom: 20px; font-size: 24px; color: #333;">OTP Verification</h2><p style="font-size: 18px; margin-bottom: 20px;">Your OTP for verification is <strong style="font-size: 36px; font-weight: bold; color: #28a745;">${otp}</strong></p></div>`// HTML body
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      });
    });
  }
  catch(err){
      res.status(400).send(err.message);
  }
};

module.exports.customerVerify  = async (req, res) => {

  const email = req.body.email;
  const otp = req.body.otp;
  

  try{
      await UnverifiedEmail.findOne({email: email}).then( async (uvemail) =>{
        
        if(uvemail.otp == otp){
          
          const customer = new Customer(
            {
              email: uvemail.email,
              password: uvemail.password,
            }
          )
          
          try{
            await customer.save().then(async () => {
              
              try{
                await UnverifiedEmail.deleteOne({ _id: uvemail._id }).then(() => {
                  res.status(200).send({message: "Verification successful"});
                });
                
              } catch (err) {
                res.status(400).json({message: err.message});
              }
            });
          } catch (err){
            res.status(400).json({message: err.message});
          }
        } else {
          res.status(400).send({message: "Verification unsuccessful"});
        }
      })

  }catch(err){
      res.json({message: err.message});
  }  
  
};

module.exports.customerLogin = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const customer = await Customer.findOne({ email: email });
    if (!customer) {
      return res.status(400).json({ message: 'Invalid Email', code: 'InvalidEmail' });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Password', code: 'InvalidCode' });
    }
    
    const token = jwt.sign({ userId: customer._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, code: "Success" });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error, code: "Error" });
  }
};

module.exports.customerVerifyToken = async (req, res) => {
  const email = req.body.email;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  try {
    const customer = await Customer.findOne({ email: email });
    if (!customer) {
      return res.status(400).json({ message: 'Invalid Email', code: 'InvalidEmail' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.Status(403).json({ message: "Unverified", code: "unverified" });
      if(customer._id == user.userId){
        res.status(200).send({message: "Verified", code: "verified"})
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error, code: "Error" });
  }
};

module.exports.getCategories = async (req, res) => {

  Category.find({}, "category_name image_url category_id").then( async (categories) => {
    if (!categories) {
      return res.status(404).send({ message: 'Categories not found' });
    }

    return res.status(200).send(categories)
  });
}

module.exports.getSubcategories = async (req, res) => {
  const category_id = req.body.category_id

  const category = await Category.findOne({ category_id: category_id}, "subcategories");

  if(!category){
    return res.status(400).send({message: "No subcategories found"});
  }

  const newArray = category.subcategories.map(({ subcategory_id, subcategory_name }) => ({ subcategory_id, subcategory_name }));

  res.status(200).send(newArray)
}

module.exports.getServiceProviders = async (req, res) => {

  const category = req.body.category;
  const email = req.body.email;

  const serviceProvider = await ServiceProvider.find({ category: category}, "uuid firstName middleName lastName imgURL rating reviewCount newSProvider info startingPrice");

  if(!serviceProvider){
    return res.status(400).send({message: "No service providers found"});
  }

  res.status(200).send(serviceProvider)
}

module.exports.getCustomerDetails = async (req, res) => {

  const email = req.body.email;

  const customer = await Customer.findOne({ email: email}, "uuid firstName middleName lastName imgUrl phoneNumber religion addressLine1 addressLine2 city state zipCode");

  if(!customer){
    return res.status(400).send({message: "No customers found"});
  }

  res.status(200).send(customer)
}

module.exports.updateCustomerDetails = async (req, res) => {

  const { email, firstName, middleName, lastName, phoneNumber, religion, addressLine1, addressLine2, city, state, zipCode } = req.body;

  const updateFields = {};

  if (firstName != null) updateFields.firstName = firstName;
  if (middleName != null) updateFields.middleName = middleName;
  if (lastName != null) updateFields.lastName = lastName;
  if (phoneNumber != null) updateFields.phoneNumber = phoneNumber;
  if (religion != null) updateFields.religion = religion;
  if (addressLine1 != null) updateFields.addressLine1 = addressLine1;
  if (addressLine2 != null) updateFields.addressLine2 = addressLine2;
  if (city != null) updateFields.city = city;
  if (state != null) updateFields.state = state;
  if (zipCode != null) updateFields.zipCode = zipCode;

  const customer = await Customer.findOneAndUpdate({ email: email}, { $set: updateFields },);

  if(!customer){
    return res.status(400).send({message: "No Customer found"});
  }

  res.status(200).send({message: "Customer Updated"})
}

module.exports.getServiceProviderData = async (req, res) => {

  const { sID } = req.body;

  const sp = await ServiceProvider.findOne({ uuid: sID }, {
    imgURL: 1,
    firstName: 1,
    middleName: 1,
    lastName: 1,
    newSProvider: 1,
    sName: 1,
    rating: 1,
    reviewCount: 1,
    uuid: 1,
    info: 1,
    startingPrice: 1,
    category: 1,

  },);

  if (!sp) {
    return res.status(400).send({ message: "No Customer found" });
  }

  const category = await Category.findOne({ category_id: sp.category }, "category_name");

  const data = {
    imgURL: sp.imgURL,
    sName: sp.firstName + " " + sp.middleName + " " + sp.lastName,
    rating: sp.rating,
    reviews: sp.reviewCount,
    sID: sp.uuid,
    info: sp.info,
    startingPrice: sp.startingPrice,
    category_id: sp.category,
    category: category.category_name,
    away: 1,
    saved: false,
    ordersCompleted: 50,
    newSProvider: sp.newSProvider
  }

  res.status(200).send(data)
}

module.exports.getServiceProviderSubcategories = async (req, res) => {

  const { sID } = req.body;

  const sp = await ServiceProvider.findOne({ uuid: sID }, {
    category: 1,
  },);

  if (!sp) {
    return res.status(400).send({ message: "No Customer found" });
  }

  const subcategories = await Category.findOne({ category_id: sp.category }, "subcategories");

  res.status(200).send(subcategories.subcategories)
}

module.exports.placeOrder = async (req, res) => {

  const data = req.body;

  if(data.sp == null || data.data == null || data.email == null || data.data.isEmpty){
    return res.status(400).send({message: "Invalid data"});
  }

  const order = new UnverifiedOrder(
    {
      sid: data.sp,
      items: data.data,
      email: data.email,
    }
  )

  const savedOrder = await order.save();
  if(!savedOrder){
    return res.status(400).send({message: "Order not placed"});
  }

  res.status(200).send({message: "OrderPlaced"})
}