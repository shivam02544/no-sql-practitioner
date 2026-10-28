import { NextRequest, NextResponse } from 'next/server'
import { connectionManager, getConnection } from '@/services/mongodb'
import { MongoDBConnection } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const rawUri = request.headers.get('x-connection-uri')

    const connection: MongoDBConnection | null =
      getConnection(id) ||
      (rawUri
        ? {
            id,
            name: 'Direct Connection',
            uri: rawUri,
            type: 'local',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        : null)

    if (!connection || !connection.uri) {
      return NextResponse.json(
        { error: 'No active MongoDB connection found. Please connect to a database in Connection Manager.' },
        { status: 404 }
      )
    }

    const databases = await connectionManager.getDatabases(id, connection)
    return NextResponse.json({ databases })
  } catch (error) {
    console.error('Get databases error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch databases' },
      { status: 500 }
    )
  }
}