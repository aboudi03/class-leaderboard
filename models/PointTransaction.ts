import mongoose, { Model, Schema } from "mongoose";

export type PointTransactionDocument = {
  _id: string;
  studentId: string;
  points: number;
  type: "positive" | "negative";
  reason: string;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

const pointTransactionSchema = new Schema<PointTransactionDocument>(
  {
    _id: { type: String, required: true },
    studentId: { type: String, required: true, ref: "Student", index: true },
    points: { type: Number, required: true },
    type: { type: String, required: true, enum: ["positive", "negative"] },
    reason: { type: String, required: true, trim: true, maxlength: 240 },
    occurredAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true, versionKey: false },
);

pointTransactionSchema.index({ studentId: 1, occurredAt: -1 });

export const PointTransactionModel: Model<PointTransactionDocument> =
  (mongoose.models.PointTransaction as Model<PointTransactionDocument> | undefined) ??
  mongoose.model<PointTransactionDocument>("PointTransaction", pointTransactionSchema);
