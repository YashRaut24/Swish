import mongoose from 'mongoose';

const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const ChatSchema = new Schema(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    messages: [MessageSchema],
    isGroup: { type: Boolean, default: false },
    groupName: { type: String, trim: true, maxlength: 80 },
  },
  { timestamps: true, versionKey: false },
);

ChatSchema.index({ groupName: 'text' });

export default mongoose.model('Chat', ChatSchema);
