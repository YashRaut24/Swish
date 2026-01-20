import mongoose from 'mongoose';

const { Schema } = mongoose;

const ReportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['Post', 'User'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    status: { type: String, enum: ['pending', 'resolved', 'ignored'], default: 'pending' },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolution: { type: String, enum: ['removed', 'ignored'] },
    resolvedAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.model('Report', ReportSchema);
