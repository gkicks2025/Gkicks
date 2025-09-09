import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import jwt from "jsonwebtoken"
import { executeQuery } from "@/lib/database"

export async function POST(request: NextRequest) {
  console.log('🔍 UPLOAD-AVATAR: API called');
  
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    let token = null
    
    console.log('🔍 UPLOAD-AVATAR: Raw auth header:', authHeader);
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '')
      console.log('🔍 UPLOAD-AVATAR: Using token from Authorization header');
    } else {
      const cookieToken = request.cookies.get('token')?.value
      if (cookieToken) {
        token = cookieToken
        console.log('🔍 UPLOAD-AVATAR: Using token from cookie');
      }
    }
    
    console.log('🔍 UPLOAD-AVATAR: Auth header:', authHeader ? 'Present' : 'Missing');
    console.log('🔍 UPLOAD-AVATAR: Final token:', token ? 'Present' : 'Missing');
    console.log('🔍 UPLOAD-AVATAR: Token length:', token ? token.length : 0);
    console.log('🔍 UPLOAD-AVATAR: Token parts:', token ? token.split('.').length : 0);
    console.log('🔍 UPLOAD-AVATAR: Token preview:', token ? token.substring(0, 50) + '...' : 'None');
    
    if (!token) {
      console.log('❌ UPLOAD-AVATAR: No authentication token found');
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      console.log('✅ UPLOAD-AVATAR: Token verified for user:', decoded.userId);
    } catch (jwtError) {
      console.log('❌ UPLOAD-AVATAR: Invalid token:', jwtError);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    console.log('📁 UPLOAD-AVATAR: File received:', file ? file.name : 'No file');

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/tiff"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split(".").pop()
    const fileName = `avatar-${timestamp}-${randomString}.${fileExtension}`

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "avatars")
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = path.join(uploadsDir, fileName)
    
    await writeFile(filePath, buffer)
    
    // Return the public URL
    const publicUrl = `/uploads/avatars/${fileName}`
    
    console.log("✅ UPLOAD-AVATAR: File saved successfully:", fileName, "Size:", file.size, "Type:", file.type)
    
    // Update user's avatar_url in the database
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      console.log('🔄 UPLOAD-AVATAR: Updating user avatar in database for user:', decoded.userId);
      
      const updateResult = await executeQuery(
        'UPDATE users SET avatar_url = ? WHERE id = ?',
        [publicUrl, decoded.userId]
      );
      
      console.log('✅ UPLOAD-AVATAR: Database update result:', updateResult);
      
      // Also update the profiles table if it exists
      try {
        const profileUpdateResult = await executeQuery(
          'UPDATE profiles SET avatar_url = ? WHERE user_id = ?',
          [publicUrl, decoded.userId]
        );
        console.log('✅ UPLOAD-AVATAR: Profile table update result:', profileUpdateResult);
      } catch (profileError) {
        console.log('ℹ️ UPLOAD-AVATAR: Profile table update failed (table may not exist):', profileError);
      }
      
    } catch (dbError) {
      console.error('❌ UPLOAD-AVATAR: Database update failed:', dbError);
      // Don't fail the upload if database update fails, just log it
    }
    
    console.log("✅ UPLOAD-AVATAR: Avatar upload and database update completed successfully")
    
    return NextResponse.json({ 
      url: publicUrl,
      message: "Avatar uploaded successfully!"
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
