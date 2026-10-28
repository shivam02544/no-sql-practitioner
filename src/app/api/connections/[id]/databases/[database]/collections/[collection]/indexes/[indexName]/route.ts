import { NextRequest, NextResponse } from 'next/server'
import { connectionManager } from '@/services/mongodb'
import { MongoDBConnection } from '@/types'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; database: string; collection: string; indexName: string }> }
): Promise<NextResponse> {
  try {
    const { id, database, collection, indexName } = await params

    const connection: MongoDBConnection = {
      id,
      name: 'Test',
      uri: '',
      type: 'local',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await connectionManager.dropIndex(id, connection, database, collection, indexName)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Drop index error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to drop index' }, { status: 500 })
  }
}