// Defines the shape of a user document in MongoDB

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,               // Remove leading/trailing whitespace
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,             // No two users can share the same email
      lowercase: true,          // Always store email in lowercase
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,            // Never return password in queries by default
    },

    role: {
      type: String,
      enum: ['user', 'admin'], // Only these two roles are allowed
      default: 'user',
    },

    // Stores hashed refresh tokens so we can invalidate them later
    refreshTokens: {
      type: [String],
      select: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Track failed login attempts to help detect brute-force attacks
    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date, // If set, the account is temporarily locked until this time
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// ─── Hash password before saving ────────────────────────────────────────────
// This middleware runs before every .save() call
userSchema.pre('save', async function (next) {
  // Only re-hash if the password was actually changed
  if (!this.isModified('password')) return next();

  // bcrypt salt rounds: higher = slower but more secure (12 is a good balance)
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Instance method: Compare entered password with stored hash ───────────
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// ─── Instance method: Check if account is locked ─────────────────────────
userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

// ─── Instance method: Handle failed login (increment lockout counter) ─────
userSchema.methods.handleFailedLogin = async function () {
  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  this.loginAttempts += 1;

  if (this.loginAttempts >= MAX_ATTEMPTS) {
    this.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
    this.loginAttempts = 0; // Reset counter after locking
  }

  await this.save();
};

// ─── Instance method: Reset login attempts on successful login ────────────
userSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

const User = mongoose.model('User', userSchema);
export default User;