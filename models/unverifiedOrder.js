const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const taskItemSchema = new mongoose.Schema({
    taskId: {
        type: String,
    },
    qty: {
        type: Number,
        min: 0,
        max: 100
    }
});

const subcategoryItemSchema = new mongoose.Schema({
    subcategoryId: {
        type: String,
    },
    tasks: [taskItemSchema]
});

const unverifiedOrderSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            trim: true,
            unique: true,
            immutable: true,
            default: uuidv4
        },
        sid: {
            type: String,
            required: true,
            trim: true,
            immutable: true
        },
        dateTime: {
            type: Date,
            unique: true,
            immutable: true,
            default: Date.now
        },
        items: [subcategoryItemSchema]
    } 
);

// userSchema.pre('save', async function(next) {
//   const user = this;
//   if (!user.isModified('password')) return next();
  
//   try {
//     const hashedPassword = await bcrypt.hash(user.password, 10); // 10 is the saltRounds
//     user.password = hashedPassword;
//     next();
//   } catch (error) {
//     return next(error);
//   }
// });

module.exports = mongoose.model("UnverifiedOrder", unverifiedOrderSchema);