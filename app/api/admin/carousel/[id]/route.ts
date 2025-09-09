import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '../../../../../lib/database'

// PUT - Update carousel slide
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)
    const body = await request.json()
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid slide ID' },
        { status: 400 }
      )
    }
    
    // Remove unused database connection since we're using executeQuery
    
    // Check if slide exists
    const existingSlide = await executeQuery('SELECT id FROM carousel_slides WHERE id = ?', [id])
    if (!existingSlide || (Array.isArray(existingSlide) && existingSlide.length === 0)) {
      return NextResponse.json(
        { error: 'Slide not found' },
        { status: 404 }
      )
    }

    // Build dynamic update query
    const updateFields = []
    const updateValues = []
    
    if (body.title !== undefined) {
      updateFields.push('title = ?' as string)
      updateValues.push(body.title as unknown as never)
    }
    if (body.subtitle !== undefined) {
      updateFields.push('subtitle = ?' as string)
      updateValues.push(body.subtitle as unknown as never)
    }
    if (body.description !== undefined) {
      updateFields.push('description = ?')
      updateValues.push(body.description)
    }
    if (body.ctaText !== undefined) {
      updateFields.push('ctaText = ?' as string)
      updateValues.push(body.ctaText as unknown as never)
    }
    if (body.bgGradient !== undefined) {
      updateFields.push('bgGradient = ?' as string)
      updateValues.push(body.bgGradient)
    }
    if (body.image !== undefined) {
      updateFields.push('image = ?' as string)
      updateValues.push(body.image)
    }
    if (body.isActive !== undefined) {
      updateFields.push('isActive = ?' as string)
      updateValues.push(body.isActive ? 1 : 0)
    }
    if (body.order !== undefined) {
      updateFields.push('display_order = ?' as string)
      updateValues.push(body.order as unknown as never)
    }
    
    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }
    
updateFields.push('updated_at = CURRENT_TIMESTAMP' as never)
    updateValues.push(id as unknown as never)
    
    const query = `UPDATE carousel_slides SET ${updateFields.join(', ')} WHERE id = ?`
    await executeQuery(query, updateValues)
    
    return NextResponse.json({ message: 'Slide updated successfully' })
  } catch (error) {
    console.error('Error updating carousel slide:', error)
    return NextResponse.json(
      { error: 'Failed to update carousel slide' },
      { status: 500 }
    )
  }
}

// DELETE - Delete carousel slide
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid slide ID' },
        { status: 400 }
      )
    }
    
    // Check if slide exists
    const existingSlide = await executeQuery('SELECT id FROM carousel_slides WHERE id = ?', [id])
    if (!existingSlide || (Array.isArray(existingSlide) && existingSlide.length === 0)) {
      return NextResponse.json(
        { error: 'Slide not found' },
        { status: 404 }
      )
    }
    
    await executeQuery('DELETE FROM carousel_slides WHERE id = ?', [id])
    
    return NextResponse.json({ message: 'Slide deleted successfully' })
  } catch (error) {
    console.error('Error deleting carousel slide:', error)
    return NextResponse.json(
      { error: 'Failed to delete carousel slide' },
      { status: 500 }
    )
  }
}