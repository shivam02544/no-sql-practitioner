import { NextRequest, NextResponse } from 'next/server'
import { performanceMonitor } from '@/services/monitoring'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await params
    const searchParams = _request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100')
    const collection = searchParams.get('collection')

    let queries
    if (collection) {
      queries = performanceMonitor.getSlowQueriesByCollection(collection)
    } else {
      queries = performanceMonitor.getSlowQueries(limit)
    }

    return NextResponse.json({ queries })
  } catch (error) {
    console.error('Get slow queries error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch slow queries' }, { status: 500 })
  }
}