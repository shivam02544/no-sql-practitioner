import { NextRequest, NextResponse } from 'next/server'
import { connectionManager, getConnection } from '@/services/mongodb'
import { MongoDBConnection } from '@/types'
import { ObjectId } from 'mongodb'

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

function parseDocId(docId: string): unknown {
  if (ObjectId.isValid(docId) && String(new ObjectId(docId)) === docId) {
    return new ObjectId(docId)
  }
  return docId
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; database: string; collection: string; docId: string }> }
): Promise<NextResponse> {
  try {
    const { id, database, collection, docId } = await params
    const connection = resolveConnection(id, request)

    if (!connection || !connection.uri) {
      return NextResponse.json(
        { error: 'No active MongoDB connection found. Please connect to a database in Connection Manager.' },
        { status: 404 }
      )
    }

    const idFilter = parseDocId(docId)
    const result = await connectionManager.findDocuments(id, connection, database, collection, {
      filter: { _id: idFilter },
      limit: 1,
    })

    if (result.documents.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ document: result.documents[0] })
  } catch (error) {
    console.error('Get document error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch document' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; database: string; collection: string; docId: string }> }
): Promise<NextResponse> {
  try {
    const { id, database, collection, docId } = await params
    const body = await request.json()
    const { update, upsert } = body

    const connection = resolveConnection(id, request)

    if (!connection || !connection.uri) {
      return NextResponse.json(
        { error: 'No active MongoDB connection found. Please connect to a database in Connection Manager.' },
        { status: 404 }
      )
    }

    const idFilter = parseDocId(docId)
    const result = await connectionManager.updateDocument(
      id,
      connection,
      database,
      collection,
      { _id: idFilter },
      update,
      { upsert }
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Update document error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update document' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; database: string; collection: string; docId: string }> }
): Promise<NextResponse> {
  try {
    const { id, database, collection, docId } = await params
    const connection = resolveConnection(id, request)

    if (!connection || !connection.uri) {
      return NextResponse.json(
        { error: 'No active MongoDB connection found. Please connect to a database in Connection Manager.' },
        { status: 404 }
      )
    }

    const idFilter = parseDocId(docId)
    const result = await connectionManager.deleteDocument(
      id,
      connection,
      database,
      collection,
      { _id: idFilter }
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Delete document error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete document' },
      { status: 500 }
    )
  }
}