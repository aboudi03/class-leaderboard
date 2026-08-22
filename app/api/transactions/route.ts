import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { serializeStudent, serializeTransaction } from "@/lib/serializers";
import { PointTransactionModel } from "@/models/PointTransaction";
import { StudentModel, type StudentDocument } from "@/models/Student";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const requestedPoints = Number(body.points);
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const studentId = typeof body.studentId === "string" ? body.studentId : "";

    if (!studentId || !reason || !Number.isInteger(requestedPoints) || requestedPoints === 0) {
      return NextResponse.json({ error: "Student, reason, and non-zero whole points are required." }, { status: 400 });
    }

    await connectToDatabase();
    const session = await mongoose.startSession();
    let updatedStudent: StudentDocument | null = null;
    let createdTransaction = null;

    try {
      await session.withTransaction(async () => {
        const student = await StudentModel.findById(studentId).session(session);
        if (!student) throw new Error("STUDENT_NOT_FOUND");

        const newPoints = Math.max(0, student.points + requestedPoints);
        const actualPoints = newPoints - student.points;
        student.points = newPoints;
        await student.save({ session });

        const [transaction] = await PointTransactionModel.create([{
          _id: crypto.randomUUID(),
          studentId,
          points: actualPoints,
          type: requestedPoints > 0 ? "positive" : "negative",
          reason,
          occurredAt: new Date(),
        }], { session });

        updatedStudent = student.toObject();
        createdTransaction = transaction.toObject();
      });
    } finally {
      await session.endSession();
    }

    if (!updatedStudent || !createdTransaction) {
      throw new Error("Transaction did not complete.");
    }

    return NextResponse.json({
      student: serializeStudent(updatedStudent),
      transaction: serializeTransaction(createdTransaction),
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "STUDENT_NOT_FOUND") {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }
    console.error("Failed to change points", error);
    return NextResponse.json({ error: "Unable to save the point change." }, { status: 500 });
  }
}
