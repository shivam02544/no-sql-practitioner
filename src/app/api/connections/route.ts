import { NextRequest, NextResponse } from 'next/server'
import { getAllConnections, saveConnection } from '@/services/mongodb'

export async function GET(): Promise<NextResponse> {
  try {
    const connections = getAllConnections()
    return NextResponse.json({ connections })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch connections' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { id, name, uri, database, type, options, isActive } = body

    if (!name || !uri) {
      return NextResponse.json({ error: 'Name and URI are required' }, { status: 400 })
    }

    const connection = saveConnection({
      id,
      name,
      uri,
      database,
      type: type || 'local',
      options,
      isActive: isActive ?? true,
    })

    return NextResponse.json({ connection })
  } catch (error) {
    console.error('Create connection error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create connection' }, { status: 500 })
  }
}