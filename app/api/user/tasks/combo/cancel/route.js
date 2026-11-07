import { NextResponse } from "next/server";
import { requireFirebaseAuth } from "@/lib/apiAuth";

export async function POST(request) {
  try {
    await requireFirebaseAuth(request);

    return NextResponse.json(
      {
        success: false,
        message: "A combined task cannot be cancelled. Complete all orders to unfreeze your balance.",
      },
      { status: 403 }
    );
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;

    if (status === 500) {
      console.error("Failed to cancel combined task:", error);
    }

    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}