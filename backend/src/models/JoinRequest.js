import mongoose from 'mongoose';

const { Schema } = mongoose;

const JoinRequestSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    communityId: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
    email: { type: String },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.model('JoinRequest', JoinRequestSchema);
