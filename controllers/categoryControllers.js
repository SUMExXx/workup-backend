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

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

module.exports.addCategory = async (req, res) => {

  const name = req.body.name;

  var imgPublicId =""

  try {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'workup/categories',
        resource_type: 'image',
      },
      async (error, result) => {
        if (error) {
          return res.status(500).send('Error uploading image to Cloudinary');
        }
        imgPublicId = result.public_id
        const optimizedUrl = cloudinary.url(imgPublicId, {
            fetch_format: 'auto',
            quality: 'auto'
        });
        
        const category = new Category({
          category_name: name,
          image_url: optimizedUrl
        })

        try{
          await category.save().then((c) => {

            res.send({message: `Category with name: ${c.category_name} has been created`});

          });
        }
        catch(err){
            res.status(400).send(err.message);
        }

      }
    );

    uploadStream.end(req.file.buffer);
    
  } catch (error) {
    res.status(500).send({message: error});
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
    task_name: tname,
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
  const imageUpdate = req.body.image_update;

  try {
    const category = await Category.findOne({ category_id: cid });
    
    if (!category) {
      return res.status(404).send({ message: 'Category not found' });
    }

    const oldName = category.category_name;
    const oldImgPublicId = category.image_id;

    let imgPublicId = "";
    let imgUrl = "";

    if (imageUpdate === "true") {
      // Handle image upload and deletion
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'workup/categories',
          resource_type: 'image',
        },
        async (error, result) => {
          if (error) {
            return res.status(500).send('Error uploading image to Cloudinary');
          }

          imgPublicId = result.public_id;
          imgUrl = cloudinary.url(imgPublicId, {
            fetch_format: 'auto',
            quality: 'auto',
          });

          try {
            const deleteResult = await cloudinary.uploader.destroy(oldImgPublicId);

            if (deleteResult.result !== 'ok') {
              return res.status(404).send({ message: 'Old image not found' });
            }

            // Update the category after successfully uploading and deleting the old image
            await updateCategoryInDb();
          } catch (error) {
            return res.status(500).send({ message: 'Error deleting old image', error: error.message });
          }
        }
      );

      uploadStream.end(req.file.buffer);
    } else {
      // If no image update is required, proceed to update the category
      await updateCategoryInDb();
    }

    async function updateCategoryInDb() {
      const result = await Category.updateOne(
        { category_id: cid },
        { $set: { category_name: cname, image_url: imgUrl || category.image_url, image_id: imgPublicId || oldImgPublicId } }
      );

      if (result.matchedCount === 0) {
        console.log('No matching category or subcategory found.');
        return res.status(404).send({ status: 'Not Found', message: 'Category or Subcategory not found' });
      }

      if (result.modifiedCount === 0) {
        console.log('No document was modified.');
        return res.status(304).send({ status: 'Not Modified', message: 'No changes were made' });
      }

      res.status(200).send({ message: `Successfully changed category ${oldName} to new name ${cname}` });
    }

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.updateSubcategory = async (req, res) => {

  const cid = req.body.category_id;   
  const sid = req.body.subcategory_id;
  const newName = req.body.new_name; 

  let oldSubcategoryName;
  let cname;

  Category.findOne({ category_id: cid }).then( async (category) => {
    if (!category) {
      return res.status(404).send({ message: 'Category not found' });
    }

    cname = category.category_name;

    const subcategory = category.subcategories.find(sub => sub.subcategory_id === sid);

    if (!subcategory) {
      return res.status(404).send({ message: 'Subcategory not found' });
    }

    oldSubcategoryName = subcategory.subcategory_name;

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
  });
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

  Category.findOne({ category_id: cid }).then( async (category) => {
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
  });
};

module.exports.getCategory = async (req, res) => {
  const cid = req.body.category_id;

  Category.findOne({ category_id: cid }).then( async (category) => {
    if (!category) {
      return res.status(404).send({ message: 'Category not found' });
    }

    return res.status(200).send(category)
  });
}

module.exports.getSubcategory = async (req, res) => {
  const cid = req.body.category_id;
  const sid = req.body.subcategory_id;

  Category.findOne({ category_id: cid }).then( async (category) => {
    if (!category) {
      return res.status(404).send({ message: 'Category not found' });
    }

    const subcategory = category.subcategories.find(sub => sub.subcategory_id === sid);

    return res.status(200).send(subcategory);
  });
}

module.exports.getTask = async (req, res) => {
  const cid = req.body.category_id;
  const sid = req.body.subcategory_id;
  const tid = req.body.task_id;

  Category.findOne({ category_id: cid }).then( async (category) => {
    if (!category) {
      return res.status(404).send({ message: 'Category not found' });
    }

    const subcategory = category.subcategories.find(sub => sub.subcategory_id === sid);

    const task = subcategory.tasks.find(task => task.task_id === tid);
    return res.status(200).send(task);
  });
}

module.exports.deleteCategory = async (req, res) => {

  const cid = req.body.category_id;

  var cname;

  Category.findOne({category_id: cid}).then( async (c) => {
    if (!c) {
      return res.status(404).send({ message: 'Category not found' });
    }

    cname = c.category_name;

    try{
      const result = await Category.deleteOne(
        {
          category_id: cid,
        },
      );

      if (!result.acknowledged) {
        return res.status(400).send({ status: 'Error', message: 'Delete operation failed' });
      }

      if (result.deletedCount === 0) {
        return res.status(404).send({ status: 'Not Found', message: 'Document not found' });
      }

      return res.status(200).send({ status: 'Success', message: `Successfully deleted category with name ${cname}` });

    }catch(err){
        res.json({message: err.message});
    }  
  })
};

module.exports.deleteSubcategory = async (req, res) => {

  const cid = req.body.category_id;
  const sid = req.body.subcategory_id;
  var cname;
  var sname;

  Category.findOne({category_id: cid}).then( async (c) => {
    if (!c) {
      return res.status(404).send({ message: 'Category not found' });
    }

    cname = c.category_name;

    const subcategoryIndex = c.subcategories.findIndex(sub => sub.subcategory_id === sid);
    
    if (subcategoryIndex === -1) {
      return res.status(404).send({ message: 'Subcategory not found' });
    }

    sname = c.subcategories[subcategoryIndex].subcategory_name;

    try{
      const deletedSubcategory = c.subcategories.splice(subcategoryIndex, 1);

      await c.save();

      return res.status(200).send({
        status: 'Success',
        message: `Successfully deleted subcategory with name ${sname} of category ${cname}`,
      });

    }catch(err){
        res.json({message: err.message});
    }  
  })
};

module.exports.deleteTask = async (req, res) => {

  const cid = req.body.category_id;
  const sid = req.body.subcategory_id;
  const tid = req.body.task_id;
  var cname;
  var sname;
  var tname;

  Category.findOne({category_id: cid}).then( async (c) => {
    if (!c) {
      return res.status(404).send({ message: 'Category not found' });
    }

    cname = c.category_name;

    const subcategoryIndex = c.subcategories.findIndex(sub => sub.subcategory_id === sid);
    
    if (subcategoryIndex === -1) {
      return res.status(404).send({ message: 'Subcategory not found' });
    }

    sname = c.subcategories[subcategoryIndex].subcategory_name;

    const taskIndex = c.subcategories[subcategoryIndex].tasks.findIndex(task => task.task_id === tid);

    if (taskIndex === -1) {
      return res.status(404).send({ message: 'Task not found' });
    }

    tname = c.subcategories[subcategoryIndex].tasks[taskIndex].task_name;

    try{
      const deletedTask = c.subcategories[subcategoryIndex].tasks.splice(taskIndex, 1);

      await c.save();

      return res.status(200).send({
        status: 'Success',
        message: `Successfully deleted task with name ${tname} of subcategory ${sname} of category ${cname}`,
      });

    }catch(err){
        res.json({message: err.message});
    }  
  })
};