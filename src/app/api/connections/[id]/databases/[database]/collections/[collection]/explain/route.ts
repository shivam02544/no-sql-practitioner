import { NextRequest, NextResponse } from 'next/server'
import { connectionManager } from '@/services/mongodb'
import { MongoDBConnection } from '@/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; database: string; collection: string }> }
): Promise<NextResponse> {
  try {
    const { id, database, collection } = await params
    const body = await request.json()
    const { filter } = body

    const connection: MongoDBConnection = {
      id,
      name: 'Test',
      uri: '',
      type: 'local',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const explainPlan = await connectionManager.explainQuery(id, connection, database, collection, {
      filter: filter || {},
    })

    return NextResponse.json({ explainPlan })
  } catch (error) {
    console.error('Explain query error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to explain query' }, { status: 500 })
  }
}