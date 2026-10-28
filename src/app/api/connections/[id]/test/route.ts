import { NextRequest, NextResponse } from 'next/server'
import { connectionManager } from '@/services/mongodb'
import { MongoDBConnection } from '@/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    // In a real app, fetch connection from storage
    // For now, create a mock connection from request body
    const body = await request.json()
    const { name, uri, database, type, options } = body

    if (!uri) {
      return NextResponse.json({ error: 'URI is required' }, { status: 400 })
    }

    const connection: MongoDBConnection = {
      id,
      name: name || 'Test Connection',
      uri: uri, // Already encrypted or plain for testing
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
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to test connection' }, { status: 500 })
  }
}