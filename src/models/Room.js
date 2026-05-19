const mongoose = require('mongoose');

const { Schema } = mongoose;

const AMENITIES = [
  'Whiteboard',
  'Projector',
  'Wi-Fi',
  'Power Outlets',
  'Quiet Zone',
  'Air Conditioning',
];

const roomSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
    floor: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    hourlyRate: {
      type: Number,
      required: true,
      min: 0,
    },
    amenities: [
      {
        type: String,
        enum: AMENITIES,
      },
    ],
    owner: {
      _id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
      photo: {
        type: String,
        default: '',
        trim: true,
      },
    },
    bookingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

roomSchema.index({ name: 'text' });
roomSchema.index({ 'owner._id': 1 });
roomSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Room', roomSchema);