const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },

  type: {
    type: String,
    enum: ["mcq", "subjective"],
    required: true,
  },

  category: {
    type: String,
    trim: true,
    default: "",
  },

  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
  },

  // MCQ = 1 mark
  // Subjective = 5 marks
  marks: {
    type: Number,
    required: true,
    min: 1,
  },

  // Used only for MCQs
  options: {
    type: [optionSchema],
    default: [],
  },

  // Used only for MCQs
  correctAnswer: {
    type: String,
    default: null,
  },

  // Used only for subjective questions
  evaluationCriteria: {
    type: [String],
    default: [],
  },
});

const assessmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    duration: {
      type: Number,
      required: true,
      min: 1,
    },

    totalMarks: {
      type: Number,
      default: 0,
    },

    questions: {
      type: [questionSchema],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Assessment", assessmentSchema);
