import { NextRequest, NextResponse } from 'next/server'
import { connectionManager } from '@/services/mongodb'
import { MongoDBConnection } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    // In a real app, fetch connection from storage
    const connection: MongoDBConnection = {
      id,
      name: 'Test',
      uri: '',
      type: 'local',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const databases = await connectionManager.getDatabases(id, connection)

    return NextResponse.json({ databases })
  } catch (error) {
    console.error('Get databases error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch databases' }, { status: 500 })
  }
}