import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (password === process.env.ADMIN_PASSWORD) {
    const response = NextResponse.json({ success: true });

    response.cookies.set("admin_auth", "true", {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      // ❌ No maxAge
      // ❌ No expires
    });

    return response;
  }

  return new NextResponse("Unauthorized", { status: 401 });
}