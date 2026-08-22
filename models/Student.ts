import mongoose, { Model, Schema } from "mongoose";

export type StudentDocument = {
  _id: string;
  classId: string;
  name: string;
  photo: string | null;
  points: number;
  createdAt: Date;
  updatedAt: Date;
};

const studentSchema = new Schema<StudentDocument>(
  {
    _id: { type: String, required: true },
    classId: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    photo: { type: String, default: null },
    points: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false },
);

studentSchema.index({ classId: 1, points: -1 });

export const StudentModel: Model<StudentDocument> =
  (mongoose.models.Student as Model<StudentDocument> | undefined) ??
  mongoose.model<StudentDocument>("Student", studentSchema);
