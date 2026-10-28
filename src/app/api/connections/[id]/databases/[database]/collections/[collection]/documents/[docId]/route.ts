import { NextRequest, NextResponse } from 'next/server'
import { connectionManager } from '@/services/mongodb'
import { MongoDBConnection } from '@/types'
import { ObjectId } from 'mongodb'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; database: string; collection: string; docId: string }> }
): Promise<NextResponse> {
  try {
    const { id, database, collection, docId } = await params

    const connection: MongoDBConnection = {
      id,
      name: 'Test',
      uri: '',
      type: 'local',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await connectionManager.findDocuments(id, connection, database, collection, {
      filter: { _id: new ObjectId(docId) },
      limit: 1,
    })

    if (result.documents.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ document: result.documents[0] })
  } catch (error) {
    console.error('Get document error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch document' }, { status: 500 })
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

    const connection: MongoDBConnection = {
      id,
      name: 'Test',
      uri: '',
      type: 'local',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await connectionManager.updateDocument(
      id,
      connection,
      database,
      collection,
      { _id: new ObjectId(docId) },
      update,
      { upsert }
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Update document error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update document' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; database: string; collection: string; docId: string }> }
): Promise<NextResponse> {
  try {
    const { id, database, collection, docId } = await params

    const connection: MongoDBConnection = {
      id,
      name: 'Test',
      uri: '',
      type: 'local',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await connectionManager.deleteDocument(
      id,
      connection,
      database,
      collection,
      { _id: new ObjectId(docId) }
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Delete document error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete document' }, { status: 500 })
  }
}