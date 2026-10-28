import { NextRequest, NextResponse } from 'next/server'
import { sandboxManager } from '@/services/sandbox'

export async function GET(): Promise<NextResponse> {
  const environments = sandboxManager.getAllEnvironments()
  return NextResponse.json({ environments })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { name, description, databases } = body

    const environment = await sandboxManager.createEnvironment(name, description, databases || [])

    return NextResponse.json({ environment })
  } catch (error) {
    console.error('Create sandbox error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create sandbox' }, { status: 500 })
  }
}