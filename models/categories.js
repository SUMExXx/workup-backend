const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const taskSchema = new mongoose.Schema({
    task_id: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        immutable: true,
        default: uuidv4
    },
    task_name: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        max: 10000,
        min: 50
    }
})

const subcategorySchema = new mongoose.Schema({
    subcategory_id: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        immutable: true,
        default: uuidv4
    },
    subcategory_name: {
        type: String,
        required: true,
        trim: true,
    },
    tasks: [taskSchema],
})

const categorySchema = new mongoose.Schema(
    {
        category_id: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            immutable: true,
            default: uuidv4
        },
        category_name: {
            type: String,
            required: true,
        },
        subcategories: [subcategorySchema],
    } 
);

const Category = mongoose.model("Category", categorySchema);
const Subcategory = mongoose.model("Subcategory", subcategorySchema);
const Task = mongoose.model("Task", taskSchema);

module.exports = {
    Category, Subcategory, Task
}