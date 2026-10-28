import { NextRequest, NextResponse } from 'next/server'
import { sandboxManager } from '@/services/sandbox'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()
    const { database, collection, operation, params: queryParams } = body

    if (!database || !collection || !operation) {
      return NextResponse.json({ error: 'Database, collection, and operation are required' }, { status: 400 })
    }

    const result = await sandboxManager.executeQuery(id, database, collection, operation, queryParams || {})

    return NextResponse.json({ result })
  } catch (error) {
    console.error('Sandbox query error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to execute query' }, { status: 500 })
  }
}