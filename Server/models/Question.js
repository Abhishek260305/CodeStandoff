const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  'Question ID': { type: Number, required: true },
  'Question Title': { type: String, required: true },
  'Question Text': { type: String, required: true },
  'Difficulty Level': { type: String, required: true },
  'Input': { type: String, required: true },
  'Expected Output': { type: String, required: true },
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = questionSchema;

