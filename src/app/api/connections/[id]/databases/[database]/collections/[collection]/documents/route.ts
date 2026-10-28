import { NextRequest, NextResponse } from 'next/server'
import { connectionManager } from '@/services/mongodb'
import { MongoDBConnection, QueryFilter } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; database: string; collection: string }> }
): Promise<NextResponse> {
  try {
    const { id, database, collection } = await params
    const searchParams = request.nextUrl.searchParams

    const filter: QueryFilter = {
      filter: JSON.parse(searchParams.get('filter') || '{}'),
      projection: JSON.parse(searchParams.get('projection') || '{}'),
      sort: JSON.parse(searchParams.get('sort') || '{}'),
      limit: parseInt(searchParams.get('limit') || '20'),
      skip: parseInt(searchParams.get('skip') || '0'),
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

    const result = await connectionManager.findDocuments(id, connection, database, collection, filter)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Get documents error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; database: string; collection: string }> }
): Promise<NextResponse> {
  try {
    const { id, database, collection } = await params
    const body = await request.json()
    const { documents, isMany } = body

    const connection: MongoDBConnection = {
      id,
      name: 'Test',
      uri: '',
      type: 'local',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    if (isMany && Array.isArray(documents)) {
      const result = await connectionManager.insertDocuments(id, connection, database, collection, documents)
      return NextResponse.json(result)
    } else if (documents) {
      const result = await connectionManager.insertDocument(id, connection, database, collection, documents)
      return NextResponse.json(result)
    } else {
      return NextResponse.json({ error: 'Document(s) required' }, { status: 400 })
    }
  } catch (error) {
    console.error('Insert document error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to insert document' }, { status: 500 })
  }
}