import { NextRequest, NextResponse } from 'next/server'
import { TransformationPipeline } from '@/types'

// In-memory storage for pipelines (use database in production)
const pipelines: Map<string, TransformationPipeline> = new Map()

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ pipelines: Array.from(pipelines.values()) })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const pipeline: TransformationPipeline = {
      ...body,
      id: body.id || crypto.randomUUID(),
      createdAt: new Date(body.createdAt) || new Date(),
      updatedAt: new Date(),
    }

    pipelines.set(pipeline.id, pipeline)

    return NextResponse.json({ pipeline })
  } catch (error) {
    console.error('Create pipeline error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create pipeline' }, { status: 500 })
  }
}