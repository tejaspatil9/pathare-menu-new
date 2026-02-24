import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as "dishes" | "alcohol";

    if (!file || !type) {
      return NextResponse.json(
        { error: "Missing file or type" },
        { status: 400 }
      );
    }

    // ✅ File size check (1MB limit)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image must be under 1MB" },
        { status: 400 }
      );
    }

    // ✅ Ensure it is an image
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    const imageUrl = await uploadToR2(file, type);

    return NextResponse.json({ url: imageUrl });

  } catch (error: any) {
    console.error("UPLOAD ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}