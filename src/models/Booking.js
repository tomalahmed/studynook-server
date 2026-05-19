const mongoose = require('mongoose');

const { Schema } = mongoose;

function normalizeToUtcMidnight(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

const bookingSchema = new Schema(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      set: normalizeToUtcMidnight,
    },
    startHour: {
      type: Number,
      required: true,
      min: 8,
      max: 20,
    },
    endHour: {
      type: Number,
      required: true,
      min: 9,
      max: 21,
      validate: {
        validator(value) {
          return value > this.startHour;
        },
        message: 'endHour must be greater than startHour',
      },
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ roomId: 1, date: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);