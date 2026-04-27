const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    target: {
      type: Number,
      required: true,
      min: 1
    },
    saved: {
      type: Number,
      required: true,
      min: 0
    },
    deadline: {
      type: String,
      required: true
    }
  },
  {
    _id: false
  }
);

const notificationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ["info", "success", "warning"],
      default: "info"
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  {
    _id: false
  }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      default: "Premium Member"
    },
    avatar: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/3607/3607444.png"
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "dark"
      }
    },
    budget: {
      monthlyBudget: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    goals: {
      type: [goalSchema],
      default: [
        // {
        //   id: "goal-1",
        //   title: "Buy Laptop",
        //   target: 2200,
        //   saved: 1180,
        //   deadline: "2026-08-15"
        // },
        // {
        //   id: "goal-2",
        //   title: "Summer Trip",
        //   target: 1800,
        //   saved: 760,
        //   deadline: "2026-09-10"
        // }
      ]
    },
    notifications: {
      type: [notificationSchema],
      default: []
    },
    sessionTokenHash: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
