import mongoose from 'mongoose';

const { Schema } = mongoose;

const CommunitySchema = new Schema(
  {
    communityId: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true, trim: true, maxlength: 120 },
    admin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    roles: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, required: true }
    }],
    events: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
    posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
    mutedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    pendingMembers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    pendingRoles: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, required: true },
      proposedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    }],
    isFacultyChannel: { type: Boolean, default: false },
    isAnnouncement: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

CommunitySchema.index({ name: 'text' });

export default mongoose.model('Community', CommunitySchema);
