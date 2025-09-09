import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import AdmZip from "adm-zip"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    const uploadedUrls: string[] = []
    const validExtensions = [".obj", ".mtl", ".zip", ".jpg", ".jpeg", ".png", ".bmp", ".tga", ".glb", ".gltf"]
    let objFileFound = false
    let glbFileFound = false
    let baseFileName = ""

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "3d-models")
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Generate unique base filename for this upload session
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    baseFileName = `3d-model-${timestamp}-${randomString}`

    for (const file of files) {
      const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`
      
      // Validate file extension
      if (!validExtensions.includes(fileExtension)) {
        return NextResponse.json({ 
          error: `Invalid file type for ${file.name}. Supported: .obj, .mtl, .zip, .jpg, .jpeg, .png, .bmp, .tga, .glb, .gltf` 
        }, { status: 400 })
      }

      // Validate file size (200MB limit for all files)
      const maxSize = 200 * 1024 * 1024
      if (file.size > maxSize) {
        return NextResponse.json({ 
          error: `File ${file.name} is too large. Maximum size is ${maxSize / (1024 * 1024)}MB` 
        }, { status: 400 })
      }

      // Handle ZIP file extraction
      if (fileExtension === ".zip") {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const zip = new AdmZip(buffer)
        const zipEntries = zip.getEntries()
        
        let objFound = false
        let glbFound = false
        const extractedFiles: { name: string; buffer: Buffer; ext: string }[] = []
        
        // Extract and validate ZIP contents
        zipEntries.forEach((entry) => {
          if (!entry.isDirectory) {
            const entryExt = `.${entry.entryName.split(".").pop()?.toLowerCase()}`
            if (validExtensions.includes(entryExt)) {
              extractedFiles.push({
                name: entry.entryName,
                buffer: entry.getData(),
                ext: entryExt
              })
              if (entryExt === ".obj") objFound = true
              if (entryExt === ".glb" || entryExt === ".gltf") glbFound = true
            }
          }
        })
        
        if (!objFound && !glbFound) {
          return NextResponse.json({ 
            error: "ZIP file must contain at least one 3D model file (.obj or .glb/.gltf)" 
          }, { status: 400 })
        }
        
        // First pass: collect file mappings
        const fileMapping: { [key: string]: string } = {}
        const filesToSave: { fileName: string; buffer: Buffer; ext: string; originalName: string }[] = []
        
        for (const extractedFile of extractedFiles) {
          const fileName = extractedFile.ext === ".obj" 
            ? `${baseFileName}.obj`
            : extractedFile.ext === ".glb"
            ? `${baseFileName}.glb`
            : extractedFile.ext === ".gltf"
            ? `${baseFileName}.gltf`
            : `${baseFileName}-${extractedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
          
          fileMapping[extractedFile.name] = fileName
          filesToSave.push({
            fileName,
            buffer: extractedFile.buffer,
            ext: extractedFile.ext,
            originalName: extractedFile.name
          })
        }
        
        // Second pass: save files and update MTL references
        for (const fileToSave of filesToSave) {
          let bufferToSave = fileToSave.buffer
          
          // Update MTL file references to match renamed texture files
          if (fileToSave.ext === ".mtl") {
            let mtlContent = bufferToSave.toString('utf8')
            
            // Update texture file references in MTL
            for (const [originalName, newName] of Object.entries(fileMapping)) {
              if (originalName !== newName && (originalName.endsWith('.jpg') || originalName.endsWith('.jpeg') || originalName.endsWith('.png') || originalName.endsWith('.bmp') || originalName.endsWith('.tga'))) {
                const regex = new RegExp(originalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
                mtlContent = mtlContent.replace(regex, newName)
              }
            }
            
            bufferToSave = Buffer.from(mtlContent, 'utf8')
            console.log("Updated MTL file references for:", fileToSave.fileName)
          }
          
          const filePath = path.join(uploadsDir, fileToSave.fileName)
          await writeFile(filePath, bufferToSave)
          
          if (fileToSave.ext === ".obj") {
            const publicUrl = `/uploads/3d-models/${fileToSave.fileName}`
            uploadedUrls.push(publicUrl)
            objFileFound = true
          } else if (fileToSave.ext === ".glb" || fileToSave.ext === ".gltf") {
            const publicUrl = `/uploads/3d-models/${fileToSave.fileName}`
            uploadedUrls.push(publicUrl)
            glbFileFound = true
          }
          
          console.log("Extracted and saved:", fileToSave.fileName, "Size:", bufferToSave.length)
        }
        
      } else {
        // Handle individual files
        let fileName: string
        
        if (fileExtension === ".obj") {
          fileName = `${baseFileName}.obj`
          objFileFound = true
        } else if (fileExtension === ".glb") {
          fileName = `${baseFileName}.glb`
          glbFileFound = true
        } else if (fileExtension === ".gltf") {
          fileName = `${baseFileName}.gltf`
          glbFileFound = true
        } else if (fileExtension === ".mtl") {
          fileName = `${baseFileName}.mtl`
        } else {
          // Texture files
          const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
          fileName = `${baseFileName}-${originalName}`
        }
        
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const filePath = path.join(uploadsDir, fileName)
        
        await writeFile(filePath, buffer)
        
        // Add OBJ and GLB/GLTF files to the returned URLs
        if (fileExtension === ".obj" || fileExtension === ".glb" || fileExtension === ".gltf") {
          const publicUrl = `/uploads/3d-models/${fileName}`
          uploadedUrls.push(publicUrl)
        }
        
        console.log("3D model file uploaded:", fileName, "Size:", file.size, "Type:", file.type)
      }
    }
    
    // Ensure at least one 3D model file was uploaded
    if (!objFileFound && !glbFileFound) {
      return NextResponse.json({ 
        error: "At least one 3D model file (.obj or .glb/.gltf) is required" 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      urls: uploadedUrls,
      message: `${uploadedUrls.length} 3D model(s) uploaded successfully!`
    })
  } catch (error) {
    console.error("3D model upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}