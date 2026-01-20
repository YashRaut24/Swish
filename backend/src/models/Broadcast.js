import mongoose from 'mongoose';

const { Schema } = mongoose;

const BroadcastSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    target: { type: String, enum: ['all', 'class', 'department'], default: 'all' },
    targetClass: { type: String, trim: true },
    targetDepartment: { type: String, trim: true },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model('Broadcast', BroadcastSchema);
