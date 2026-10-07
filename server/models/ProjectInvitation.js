const mongoose = require('mongoose');

const projectInvitationSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    maxUses: {
      type: Number,
      default: 10,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'DISABLED', 'FULL'],
      default: 'ACTIVE',
      index: true,
    },
    role: {
      type: String,
      enum: ['member', 'manager'],
      default: 'member',
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify if invitation can still be used
projectInvitationSchema.methods.isValid = function () {
  if (this.status !== 'ACTIVE') return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  if (this.maxUses > 0 && this.usedCount >= this.maxUses) return false;
  return true;
};

module.exports = mongoose.model('ProjectInvitation', projectInvitationSchema);
