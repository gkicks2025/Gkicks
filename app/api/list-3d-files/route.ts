import { NextRequest, NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { prefix } = await request.json();
    
    if (!prefix) {
      return NextResponse.json({ error: 'Prefix is required' }, { status: 400 });
    }
    
    console.log('🔍 Looking for MTL files with prefix:', prefix);
    
    // Read the 3d-models directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads', '3d-models');
    const files = await readdir(uploadsDir);
    
    // Find MTL files that start with the same prefix
    const mtlFiles = files.filter(file => {
      return file.startsWith(prefix) && file.endsWith('.mtl');
    });
    
    console.log('✅ Found MTL files:', mtlFiles);
    
    return NextResponse.json({
      success: true,
      mtlFiles,
      totalFiles: files.length
    });
    
  } catch (error) {
    console.error('❌ Error listing 3D files:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        mtlFiles: []
      },
      { status: 500 }
    );
  }
}