import { NextRequest, NextResponse } from 'next/server'
import { sandboxManager } from '@/services/sandbox'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const environment = sandboxManager.getEnvironment(id)

  if (!environment) {
    return NextResponse.json({ error: 'Environment not found' }, { status: 404 })
  }

  return NextResponse.json({ environment })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const deleted = await sandboxManager.deleteEnvironment(id)

  if (!deleted) {
    return NextResponse.json({ error: 'Environment not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}