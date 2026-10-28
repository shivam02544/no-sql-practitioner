import { NextRequest, NextResponse } from 'next/server'
import { connectionManager } from '@/services/mongodb'
import { MongoDBConnection } from '@/types'
import { schemaInferenceService } from '@/services/mongodb'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; database: string; collection: string }> }
): Promise<NextResponse> {
  try {
    const { id, database, collection } = await params
    const searchParams = request.nextUrl.searchParams
    const sampleSize = parseInt(searchParams.get('sampleSize') || '1000')

    const connection: MongoDBConnection = {
      id,
      name: 'Test',
      uri: '',
      type: 'local',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const client = await connectionManager.getClient(id, connection)
    const db = client.db(database)

    const schema = await schemaInferenceService.inferSchema(db, collection, database, sampleSize)
    const visualization = await schemaInferenceService.generateVisualization(db, collection)
    const profile = await schemaInferenceService.profileCollection(db, collection)

    return NextResponse.json({ schema, visualization, profile })
  } catch (error) {
    console.error('Get schema error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to infer schema' }, { status: 500 })
  }
}