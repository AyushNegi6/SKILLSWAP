import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false, 
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot be more than 500 characters'],
    },
    skillsHave: [{
      type: String,
      trim: true,
    }],
    skillsWant: [{
      type: String,
      trim: true,
    }],
    avatarUrl: {
      type: String,
      default: 'default-avatar.png',
    }
  },
  {
    timestamps: true, 
  }
);

const User = mongoose.model('User', userSchema);
export default User;