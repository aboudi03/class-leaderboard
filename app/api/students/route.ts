import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { serializeStudent } from "@/lib/serializers";
import { StudentModel } from "@/models/Student";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const classId = typeof body.classId === "string" ? body.classId.trim() : "";
    const id = typeof body.id === "string" ? body.id : crypto.randomUUID();

    if (!name || !classId) {
      return NextResponse.json({ error: "Student name and class are required." }, { status: 400 });
    }

    await connectToDatabase();
    const student = await StudentModel.create({
      _id: id,
      classId,
      name,
      photo: typeof body.photo === "string" ? body.photo : null,
      points: 0,
    });

    return NextResponse.json(serializeStudent(student.toObject()), { status: 201 });
  } catch (error) {
    console.error("Failed to create student", error);
    return NextResponse.json({ error: "Unable to create student." }, { status: 500 });
  }
}
