import mongoose from 'mongoose';

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    username: { type: String, required: true, trim: true, minlength: 3, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['Student', 'Faculty', 'Admin'], default: 'Student' },
    profilePic: { type: String, default: '' },
    bio: { type: String, trim: true, maxlength: 280 },
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    followRequests: [{ type: Schema.Types.ObjectId, ref: 'User' }], // incoming requests
    followRequested: [{ type: Schema.Types.ObjectId, ref: 'User' }], // outgoing requests
    communities: [{ type: Schema.Types.ObjectId, ref: 'Community' }],
    isBlocked: { type: Boolean, default: false },
    refreshTokens: [{ type: String }],
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret.password;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

UserSchema.index({ username: 'text', email: 'text' });

export default mongoose.model('User', UserSchema);
