import { NextRequest, NextResponse } from 'next/server'
import { connectionManager, getConnection } from '@/services/mongodb'
import { MongoDBConnection } from '@/types'

function resolveConnection(id: string, request: NextRequest): MongoDBConnection | null {
  const rawUri = request.headers.get('x-connection-uri')
  return (
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
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; database: string }> }
): Promise<NextResponse> {
  try {
    const { id, database } = await params
    const connection = resolveConnection(id, request)

    if (!connection || !connection.uri) {
      return NextResponse.json(
        { error: 'No active MongoDB connection found. Please connect to a database in Connection Manager.' },
        { status: 404 }
      )
    }

    const collections = await connectionManager.getCollections(id, connection, database)
    return NextResponse.json({ collections })
  } catch (error) {
    console.error('Get collections error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch collections' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; database: string }> }
): Promise<NextResponse> {
  try {
    const { id, database } = await params
    const body = await request.json()
    const { name, options } = body

    if (!name) {
      return NextResponse.json({ error: 'Collection name is required' }, { status: 400 })
    }

    const connection = resolveConnection(id, request)

    if (!connection || !connection.uri) {
      return NextResponse.json(
        { error: 'No active MongoDB connection found. Please connect to a database in Connection Manager.' },
        { status: 404 }
      )
    }

    await connectionManager.createCollection(id, connection, database, name, options)
    return NextResponse.json({ success: true, name })
  } catch (error) {
    console.error('Create collection error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create collection' },
      { status: 500 }
    )
  }
}