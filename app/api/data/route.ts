import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { serializeStudent, serializeTransaction } from "@/lib/serializers";
import { PointTransactionModel } from "@/models/PointTransaction";
import { StudentModel } from "@/models/Student";

export async function GET() {
  try {
    await connectToDatabase();
    const [students, transactions] = await Promise.all([
      StudentModel.find().sort({ createdAt: 1 }).lean(),
      PointTransactionModel.find().sort({ occurredAt: -1 }).lean(),
    ]);

    return NextResponse.json({
      students: students.map(serializeStudent),
      transactions: transactions.map(serializeTransaction),
    });
  } catch (error) {
    console.error("Failed to load leaderboard data", error);
    return NextResponse.json({ error: "Unable to load leaderboard data." }, { status: 500 });
  }
}
