import mongoose from 'mongoose';

const { Schema } = mongoose;

const MediaSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    publicId: { type: String, trim: true },
  },
  { _id: false },
);

const CommentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const PostSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    caption: { type: String, trim: true, maxlength: 2200 },
    media: [MediaSchema],
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [CommentSchema],
    savedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isFacultyPost: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isImportant: { type: Boolean, default: false },
    isExamRelated: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    pollOptions: [{ type: String }],
    pollVotes: [{ user: { type: Schema.Types.ObjectId, ref: 'User' }, option: { type: Number } }],
    channel: { type: Schema.Types.ObjectId, ref: 'Community' },
    isBroadcast: { type: Boolean, default: false },
    broadcastTarget: { type: String, enum: ['class', 'department'] },
    shares: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

PostSchema.index({ caption: 'text' });

export default mongoose.model('Post', PostSchema);
