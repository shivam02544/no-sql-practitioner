import { NextRequest, NextResponse } from 'next/server'
import { connectionManager, getConnection } from '@/services/mongodb'
import { MongoDBConnection, IndexDefinition } from '@/types'

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
  { params }: { params: Promise<{ id: string; database: string; collection: string }> }
): Promise<NextResponse> {
  try {
    const { id, database, collection } = await params
    const connection = resolveConnection(id, request)

    if (!connection || !connection.uri) {
      return NextResponse.json(
        { error: 'No active MongoDB connection found. Please connect to a database in Connection Manager.' },
        { status: 404 }
      )
    }

    const indexes = await connectionManager.getIndexes(id, connection, database, collection)
    return NextResponse.json({ indexes })
  } catch (error) {
    console.error('Get indexes error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch indexes' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; database: string; collection: string }> }
): Promise<NextResponse> {
  try {
    const { id, database, collection } = await params
    const body = await request.json()
    const { name, keys, options } = body

    if (!keys || Object.keys(keys).length === 0) {
      return NextResponse.json({ error: 'Index keys are required' }, { status: 400 })
    }

    const connection = resolveConnection(id, request)

    if (!connection || !connection.uri) {
      return NextResponse.json(
        { error: 'No active MongoDB connection found. Please connect to a database in Connection Manager.' },
        { status: 404 }
      )
    }

    const index: IndexDefinition = {
      name: name || Object.keys(keys).map(k => `${k}_${keys[k]}`).join('_'),
      keys,
      options: options || {},
    }

    const result = await connectionManager.createIndex(id, connection, database, collection, index)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Create index error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create index' }, { status: 500 })
  }
}