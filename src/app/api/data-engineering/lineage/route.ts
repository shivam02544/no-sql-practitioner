import { NextRequest, NextResponse } from 'next/server'
import { lineageTracker } from '@/services/data-engineering'

export async function GET(): Promise<NextResponse> {
  const lineage = lineageTracker.getLineage()
  return NextResponse.json({ lineage })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'addSource':
        lineageTracker.addSourceNode(params.id, params.name, params.type, params.metadata)
        break
      case 'addTransformation':
        lineageTracker.addTransformationNode(params.id, params.name, params.metadata)
        break
      case 'addDestination':
        lineageTracker.addDestinationNode(params.id, params.name, params.metadata)
        break
      case 'addEdge':
        lineageTracker.addEdge(params.sourceId, params.targetId, params.type, params.metadata)
        break
      case 'trackPipeline':
        lineageTracker.trackPipeline(params.pipeline)
        break
      case 'clear':
        lineageTracker.clear()
        break
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    return NextResponse.json({ lineage: lineageTracker.getLineage() })
  } catch (error) {
    console.error('Lineage error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update lineage' }, { status: 500 })
  }
}