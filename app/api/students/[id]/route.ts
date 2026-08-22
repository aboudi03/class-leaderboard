import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { serializeStudent } from "@/lib/serializers";
import { StudentModel } from "@/models/Student";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const [{ id }, body] = await Promise.all([context.params, request.json()]);
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json({ error: "Student name is required." }, { status: 400 });
    }

    await connectToDatabase();
    const student = await StudentModel.findByIdAndUpdate(
      id,
      { name, photo: typeof body.photo === "string" ? body.photo : null },
      { new: true, runValidators: true },
    ).lean();

    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    return NextResponse.json(serializeStudent(student));
  } catch (error) {
    console.error("Failed to update student", error);
    return NextResponse.json({ error: "Unable to update student." }, { status: 500 });
  }
}
