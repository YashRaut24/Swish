import mongoose from 'mongoose';

const { Schema } = mongoose;

const CommunitySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 120 },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    admin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, versionKey: false },
);

CommunitySchema.index({ name: 'text' });

export default mongoose.model('Community', CommunitySchema);
