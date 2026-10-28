import { NextRequest, NextResponse } from 'next/server'
import { connectionManager } from '@/services/mongodb'
import { MongoDBConnection } from '@/types'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { name, uri, database, type, options } = body

    if (!uri) {
      return NextResponse.json({ success: false, error: 'URI is required' }, { status: 400 })
    }

    const connection: MongoDBConnection = {
      id: 'test-' + Date.now(),
      name: name || 'Test Connection',
      uri,
      database,
      type: type || 'local',
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      options,
    }

    const result = await connectionManager.testConnection(connection)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Test connection error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test connection',
      },
      { status: 500 }
    )
  }
}
