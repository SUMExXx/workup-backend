const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const UnverifiedEmailSP = require('../models/unverifiedEmailSP');
const bcrypt = require('bcrypt');
const multer = require('multer');
const unverifiedOrder = require('../models/unverifiedOrder');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { transporter } = require('../utils/email');
const ServiceProvider = require('../models/serviceProvider');
require('dotenv').config();

module.exports.serviceProviderRegister = async (req, res) => {

  const email = req.body.email;
  const password = req.body.password;

  await UnverifiedEmailSP.findOneAndDelete({email: email})

  const hashedPassword = await bcrypt.hash(password, 10);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const unverifiedEmailSP = new UnverifiedEmailSP(
    {
      email: email,
      password: hashedPassword,
      otp: otp
    }
  )

  try{
    await unverifiedEmailSP.save().then(() => {

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

module.exports.serviceProviderVerify  = async (req, res) => {

  const email = req.body.email;
  const otp = req.body.otp;


  try{
      await UnverifiedEmailSP.findOne({email: email}).then( async (uvemailSP) =>{

        if(uvemailSP.otp == otp){

          const serviceProvider = new ServiceProvider(
            {
              email: uvemailSP.email,
              password: uvemailSP.password,
            }
          )

          try{
            await serviceProvider.save().then(async () => {

              try{
                await UnverifiedEmailSP.deleteOne({ _id: uvemailSP._id }).then(() => {
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

module.exports.serviceProviderLogin = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const serviceProvider = await ServiceProvider.findOne({ email: email });
    if (!serviceProvider) {
      return res.status(400).json({ message: 'Invalid Email', code: 'InvalidEmail' });
    }

    const isMatch = await bcrypt.compare(password, serviceProvider.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Password', code: 'InvalidCode' });
    }

    const token = jwt.sign({ userId: serviceProvider._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, code: "Success" });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error, code: "Error" });
  }
};

module.exports.serviceProviderVerifyToken = async (req, res) => {
  const email = req.body.email;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  try {
    const serviceProvider = await ServiceProvider.findOne({ email: email });
    if (!serviceProvider) {
      return res.status(400).json({ message: 'Invalid Email', code: 'InvalidEmail' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.Status(403).json({ message: "Unverified", code: "unverified" });
      if(serviceProvider._id == user.userId){
        res.status(200).send({message: "Verified", code: "verified"})
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error, code: "Error" });
  }
};

module.exports.serviceProviderUpdateDetails = async (req, res) => {
  const { email, firstName, middleName, lastName, phoneNumber, info } = req.body;

  try {
    const serviceProvider = await ServiceProvider.findOne({ email: email });
    if (!serviceProvider) {
      return res.status(400).json({ message: 'Invalid Email', code: 'InvalidEmail' });
    }

    if (firstName) serviceProvider.firstName = firstName;
    if (middleName) serviceProvider.middleName = middleName;
    if (lastName) serviceProvider.lastName = lastName;
    if (phoneNumber) serviceProvider.phoneNumber = phoneNumber;
    if (info) serviceProvider.info = info;

    const saved = await serviceProvider.save();

    if(saved){
      res.status(200).send({
        message: `Service provider with email: ${email} has been updated`
      })
    } else {
      res.status(500).send({
        message: `Error occured`
      })
    }

  } catch (error) {
    res.status(500).json({ message: 'Server error', error, code: "Error" });
  }
};

module.exports.getServiceProviderDetails = async (req, res) => {

  const email = req.body.email;

  const serviceProvider = await ServiceProvider.findOne({ email: email}, "uuid firstName middleName lastName imgURL newSProvider phoneNumber rating reviewCount languages activityStatus");

  if(!serviceProvider){
    return res.status(400).send({message: "No service providers found"});
  }

  res.status(200).send(serviceProvider)
}