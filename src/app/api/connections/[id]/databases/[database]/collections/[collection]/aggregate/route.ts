import { NextRequest, NextResponse } from 'next/server'
import { connectionManager } from '@/services/mongodb'
import { MongoDBConnection, AggregationPipeline } from '@/types'
import { aggregationBuilderService } from '@/services/mongodb'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; database: string; collection: string }> }
): Promise<NextResponse> {
  try {
    const { id, database, collection } = await params
    const body = await request.json()
    const { stages, options, validate, optimize } = body

    if (!stages || !Array.isArray(stages) || stages.length === 0) {
      return NextResponse.json({ error: 'Pipeline stages are required' }, { status: 400 })
    }

    const pipeline: AggregationPipeline = {
      stages: stages.map((s: Record<string, unknown>) => ({
        id: String(s.id || crypto.randomUUID()),
        name: String(s.name || ''),
        operator: String(s.operator || ''),
        expression: (s.expression || {}) as Record<string, unknown>,
        description: s.description ? String(s.description) : undefined,
        enabled: s.enabled !== false,
      })),
      options,
    }

    if (validate) {
      const validation = aggregationBuilderService.validatePipeline(pipeline)
      if (!validation.valid) {
        return NextResponse.json({ valid: false, errors: validation.errors }, { status: 400 })
      }
    }

    let finalPipeline = pipeline
    if (optimize) {
      finalPipeline = aggregationBuilderService.optimizePipeline(pipeline)
    }

    const connection: MongoDBConnection = {
      id,
      name: 'Test',
      uri: '',
      type: 'local',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await connectionManager.aggregate(id, connection, database, collection, finalPipeline)

    return NextResponse.json({ result, pipeline: finalPipeline })
  } catch (error) {
    console.error('Aggregate error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to execute aggregation' }, { status: 500 })
  }
}