import { NextRequest, NextResponse } from 'next/server'
import { connectionManager, getConnection, saveConnection, deleteConnection } from '@/services/mongodb'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const connection = getConnection(id)
    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }
    return NextResponse.json({ connection })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch connection' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()
    const connection = saveConnection({
      ...body,
      id,
    })
    return NextResponse.json({ success: true, connection })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update connection' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    await connectionManager.closeConnection(id).catch(() => {})
    deleteConnection(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete connection' },
      { status: 500 }
    )
  }
}