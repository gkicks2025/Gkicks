import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/tiff", "image/avif"]

    // Validate file type
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: `Invalid file type for ${file.name}. Allowed types: JPG, PNG, GIF, WebP, BMP, TIFF, AVIF` 
      }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: `File ${file.name} is too large. Maximum size is 10MB` 
      }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "payment-screenshots")
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split(".").pop()
    const fileName = `payment-${timestamp}-${randomString}.${fileExtension}`

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = path.join(uploadsDir, fileName)
    
    await writeFile(filePath, buffer)
    
    // Return the public URL
    const publicUrl = `/uploads/payment-screenshots/${fileName}`
    
    console.log("Payment screenshot uploaded:", fileName, "Size:", file.size, "Type:", file.type)
    
    return NextResponse.json({ 
      url: publicUrl,
      message: "Payment screenshot uploaded successfully!"
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}