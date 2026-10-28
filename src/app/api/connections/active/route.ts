import { NextRequest, NextResponse } from 'next/server'
import { getConnection, setActiveConnection } from '@/services/mongodb/connection-store'

export async function GET(): Promise<NextResponse> {
  try {
    const connection = getConnection('current')
    return NextResponse.json({ connection })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get active connection' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Connection ID is required' }, { status: 400 })
    }

    const connection = setActiveConnection(id)
    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, connection })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to set active connection' },
      { status: 500 }
    )
  }
}
