import { NextRequest, NextResponse } from 'next/server'
import { connectionManager } from '@/services/mongodb'
import { MongoDBConnection } from '@/types'
import { performanceMonitor } from '@/services/monitoring'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const database = searchParams.get('database')

    if (!database) {
      return NextResponse.json({ error: 'Database parameter is required' }, { status: 400 })
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

    const client = await connectionManager.getClient(id, connection)
    const db = client.db(database)

    const metrics = await performanceMonitor.collectMetrics(db, database)

    return NextResponse.json({ metrics })
  } catch (error) {
    console.error('Get performance metrics error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch performance metrics' }, { status: 500 })
  }
}