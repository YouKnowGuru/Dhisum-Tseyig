import mongoose, { Schema, Document } from 'mongoose'

export interface ITrial extends Document {
  deviceId: string
  userId?: mongoose.Types.ObjectId
  startDate: Date
  duration: number // in days
  createdAt: Date
}

const TrialSchema: Schema = new Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'PosUser',
      default: null,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    duration: {
      type: Number,
      required: true,
      default: 7,
    },
  },
  {
    timestamps: true,
  }
)

// Prevent model recompilation in dev
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.Trial
}

export default mongoose.models.Trial || mongoose.model<ITrial>('Trial', TrialSchema)
