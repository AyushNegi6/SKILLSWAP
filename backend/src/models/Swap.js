import mongoose from 'mongoose';

const swapSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    skillOffered: {
      type: String,
      required: [true, 'Please specify the skill being offered'],
    },
    skillRequested: {
      type: String,
      required: [true, 'Please specify the skill being requested'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed'],
      default: 'pending',
    },
    meetingLink: {
      type: String, 
    }
  },
  {
    timestamps: true,
  }
);

const Swap = mongoose.model('Swap', swapSchema);
export default Swap;