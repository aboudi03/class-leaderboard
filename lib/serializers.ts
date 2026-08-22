import type { PointTransactionDocument } from "@/models/PointTransaction";
import type { StudentDocument } from "@/models/Student";

export function serializeStudent(student: StudentDocument) {
  return {
    id: student._id.toString(),
    classId: student.classId,
    name: student.name,
    photo: student.photo ?? null,
    points: student.points,
    createdAt: new Date(student.createdAt).toISOString(),
  };
}

export function serializeTransaction(transaction: PointTransactionDocument) {
  const occurredAt = new Date(transaction.occurredAt);

  return {
    id: transaction._id.toString(),
    studentId: transaction.studentId,
    points: transaction.points,
    type: transaction.type,
    reason: transaction.reason,
    date: occurredAt.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Beirut",
    }),
    time: occurredAt.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Beirut",
    }),
    createdAt: occurredAt.toISOString(),
  };
}
