import { NextRequest, NextResponse } from 'next/server'
import { transformationEngine } from '@/services/data-engineering'
import { TransformationPipeline, Document } from '@/types'

const pipelines: Map<string, TransformationPipeline> = new Map()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const pipeline = pipelines.get(id)

  if (!pipeline) {
    return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const { sourceData } = body

    if (!sourceData || !Array.isArray(sourceData)) {
      return NextResponse.json({ error: 'Source data array is required' }, { status: 400 })
    }

    // Mock write function - in production, write to destination
    const writeFn = async (documents: Document[]) => {
      console.log(`Writing ${documents.length} documents to destination`)
    }

    const stats = await transformationEngine.executePipeline(pipeline, sourceData, writeFn)

    // Update pipeline last run info
    pipeline.lastRunAt = new Date()
    pipeline.lastRunStatus = stats.errors.length > 0 ? 'failed' : 'success'
    pipeline.lastRunStats = stats
    pipelines.set(id, pipeline)

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Execute pipeline error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to execute pipeline' }, { status: 500 })
  }
}