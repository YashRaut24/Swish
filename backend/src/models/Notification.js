import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['like', 'comment', 'follow', 'follow_request', 'follow_accept', 'community_join_request', 'community_join_accept'],
      required: true,
    },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    commentId: { type: mongoose.Schema.Types.ObjectId },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
    read: { type: Boolean, default: false },
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    requesterName: { type: String },
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
    communityName: { type: String },
    requestType: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
