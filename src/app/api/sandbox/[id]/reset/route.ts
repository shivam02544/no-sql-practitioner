import { NextRequest, NextResponse } from 'next/server'
import { sandboxManager } from '@/services/sandbox'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const reset = await sandboxManager.resetEnvironment(id)

  if (!reset) {
    return NextResponse.json({ error: 'Environment not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}