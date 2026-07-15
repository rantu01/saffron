import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "A combined task cannot be cancelled. Complete all orders to unfreeze your balance.",
    },
    { status: 403 }
  );
}
