import { NextRequest, NextResponse } from 'next/server'
import { connectionManager } from '@/services/mongodb'
import { MongoDBConnection } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; database: string }> }
): Promise<NextResponse> {
  try {
    const { id, database } = await params

    const connection: MongoDBConnection = {
      id,
      name: 'Test',
      uri: '',
      type: 'local',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const collections = await connectionManager.getCollections(id, connection, database)

    return NextResponse.json({ collections })
  } catch (error) {
    console.error('Get collections error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch collections' }, { status: 500 })
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

    const connection: MongoDBConnection = {
      id,
      name: 'Test',
      uri: '',
      type: 'local',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await connectionManager.createCollection(id, connection, database, name, options)

    return NextResponse.json({ success: true, name })
  } catch (error) {
    console.error('Create collection error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create collection' }, { status: 500 })
  }
}