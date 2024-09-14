const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const {Category, Subcategory, Task} = require('../models/categories');
const bcrypt = require('bcrypt');
const multer = require('multer');
const Order = require('../models/order');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { transporter } = require('../utils/email');
const ServiceProvider = require('../models/serviceProvider');
require('dotenv').config();

module.exports.addCategory = async (req, res) => {

  const name = req.body.name;

  const category = new Category({
    category_name: name
  })

  try{
    await category.save().then((c) => {

      res.send({message: `Category with name: ${c.name} has been created`});

    });
  }
  catch(err){
      res.status(400).send(err.message);
  }
};

module.exports.addSubcategory = async (req, res) => {

  const cid = req.body.category_id;
  const sname = req.body.subcategory_name;
  
  const subcategory = new Subcategory({
    subcategory_name: sname
  })

  try{
    const result = await Category.updateOne({category_id: cid}, { 
      $push: { 
        subcategories: subcategory
      } 
    });

    if (result.matchedCount === 0) {
      console.log('No matching category or subcategory found.');
      return { status: 'Not Found', message: 'Category or Subcategory not found' };
    }

    if (result.modifiedCount === 0) {
      console.log('No document was modified.');
      return { status: 'Not Modified', message: 'No changes were made' };
    }

    Category.findOne({category_id: cid}).then((c) => {
      res.status(200).send({message: `Successfully added subcategory of ${c.category_name} with name ${sname}`});
    })

  }catch(err){
      res.json({message: err.message});
  }  
  
};

module.exports.addTask = async (req, res) => {

  const cid = req.body.category_id;
  const sid = req.body.subcategory_id;
  const tname = req.body.task_name;
  const price = req.body.price;
  
  const task = new Task({
    
    price: price,
  })

  try{
    const result = await Category.updateOne(
      {
        category_id: cid,
        'subcategories.subcategory_id': sid 
      },
      {
        $push: {
          'subcategories.$.tasks': task 
        }
      }
    );

    if (result.matchedCount === 0) {
      console.log('No matching category or subcategory found.');
      return { status: 'Not Found', message: 'Category or Subcategory not found' };
    }

    if (result.modifiedCount === 0) {
      console.log('No document was modified.');
      return { status: 'Not Modified', message: 'No changes were made' };
    }

    Category.findOne({category_id: cid}).then((c) => {
      if (!c) {
        return res.status(404).send({ message: 'Category not found' });
      }

      const subcategory = c.subcategories.find(sub => sub.subcategory_id === sid);

      if (!subcategory) {
        return res.status(404).send({ message: 'Subcategory not found' });
      }
      res.status(200).send({message: `Successfully added Task "${tname}" with price ${price} of subcategory ${subcategory.subcategory_name} of category ${c.category_name}`});
    })

  }catch(err){
      res.json({message: err.message});
  }  
  
};

module.exports.updateCategory = async (req, res) => {

  const cid = req.body.category_id;
  const cname = req.body.new_name;

  var oldName;

  Category.findOne({category_id: cid}).then((c) => {
    if (!c) {
      return res.status(404).send({ message: 'Category not found' });
    }

    oldName = c.category_name;
  })

  try{
    const result = await Category.updateOne(
      {
        category_id: cid,
      },
      {
        $set: {
          category_name: cname 
        }
      }
    );

    if (result.matchedCount === 0) {
      console.log('No matching category or subcategory found.');
      return { status: 'Not Found', message: 'Category or Subcategory not found' };
    }

    if (result.modifiedCount === 0) {
      console.log('No document was modified.');
      return { status: 'Not Modified', message: 'No changes were made' };
    }

    res.status(200).send({message: `Successfully changed category ${oldName} to new name ${cname}`});

  }catch(err){
      res.json({message: err.message});
  }  
  
};

module.exports.updateSubcategory = async (req, res) => {

  const cid = req.body.category_id;   
  const sid = req.body.subcategory_id;
  const newName = req.body.new_name; 

  let oldSubcategoryName;
  let cname;

  Category.findOne({ category_id: cid }).then((category) => {
    if (!category) {
      return res.status(404).send({ message: 'Category not found' });
    }

    cname = category.category_name;

    const subcategory = category.subcategories.find(sub => sub.subcategory_id === sid);

    if (!subcategory) {
      return res.status(404).send({ message: 'Subcategory not found' });
    }

    oldSubcategoryName = subcategory.subcategory_name;
  });

  try {
    
    const result = await Category.updateOne(
      {
        category_id: cid,
        'subcategories.subcategory_id': sid
      },
      {
        $set: {
          'subcategories.$.subcategory_name': newName 
        }
      }
    );

    if (result.matchedCount === 0) {
      console.log('No matching category or subcategory found.');
      return res.status(404).send({ message: 'Category or Subcategory not found' });
    }

    if (result.modifiedCount === 0) {
      console.log('No document was modified.');
      return res.status(304).send({ message: 'No changes were made' });
    }

    res.status(200).send({
      message: `Successfully changed subcategory ${oldSubcategoryName} of category ${cname} to new subcategory name ${newName}`
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.updateTask = async (req, res) => {

  const cid = req.body.category_id;     
  const sid = req.body.subcategory_id;   
  const tid = req.body.task_id;        
  const newTaskName = req.body.new_name;
  let newPrice = req.body.new_price;

  let oldTaskName;
  let oldPrice;
  let cname;
  let sname;

  Category.findOne({ category_id: cid }).then((category) => {
    if (!category) {
      return res.status(404).send({ message: 'Category not found' });
    }

    cname = category.category_name;

    const subcategory = category.subcategories.find(sub => sub.subcategory_id === sid);
    if (!subcategory) {
      return res.status(404).send({ message: 'Subcategory not found' });
    }

    sname = subcategory.subcategory_name;

    const task = subcategory.tasks.find(t => t.task_id === tid);
    if (!task) {
      return res.status(404).send({ message: 'Task not found' });
    }

    oldTaskName = task.task_name;
    oldPrice = task.price;
  });

  try {
    
    const result = await Category.updateOne(
      {
        category_id: cid,                     
        'subcategories.subcategory_id': sid,   
        'subcategories.tasks.task_id': tid     
      },
      {
        $set: {
          'subcategories.$[sub].tasks.$[task].task_name': newTaskName,
          'subcategories.$[sub].tasks.$[task].price': newPrice
        }
      },
      {
        arrayFilters: [
          { 'sub.subcategory_id': sid },   
          { 'task.task_id': tid }          
        ]
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: 'Category, Subcategory, or Task not found' });
    }

    if (result.modifiedCount === 0) {
      return res.status(304).send({ message: 'No changes were made' });
    }

    res.status(200).send({
      message: `Successfully changed task ${oldTaskName} with price ${oldPrice} of subcategory ${sname} in category ${cname} to new task name ${newTaskName} with new price ${newPrice}`
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};