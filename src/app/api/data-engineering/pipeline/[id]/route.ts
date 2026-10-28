import { NextRequest, NextResponse } from 'next/server'
import { TransformationPipeline } from '@/types'

const pipelines: Map<string, TransformationPipeline> = new Map()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const pipeline = pipelines.get(id)

  if (!pipeline) {
    return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 })
  }

  return NextResponse.json({ pipeline })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const body = await request.json()

  const existing = pipelines.get(id)
  if (!existing) {
    return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 })
  }

  const pipeline: TransformationPipeline = {
    ...existing,
    ...body,
    id,
    updatedAt: new Date(),
  }

  pipelines.set(id, pipeline)

  return NextResponse.json({ pipeline })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  pipelines.delete(id)
  return NextResponse.json({ success: true })
}