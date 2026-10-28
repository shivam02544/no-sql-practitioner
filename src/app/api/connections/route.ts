import { NextRequest, NextResponse } from 'next/server'
import { connectionManager } from '@/services/mongodb'

export async function GET(): Promise<NextResponse> {
  try {
    // In a real app, you'd fetch from a database
    // For now, return mock data or from storage
    return NextResponse.json({ connections: [] })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { name, uri, database, type, options } = body

    if (!name || !uri) {
      return NextResponse.json({ error: 'Name and URI are required' }, { status: 400 })
    }

    const connection = await connectionManager.createConnection({
      name,
      uri,
      database,
      type: type || 'local',
      options,
    })

    return NextResponse.json({ connection })
  } catch (error) {
    console.error('Create connection error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create connection' }, { status: 500 })
  }
}