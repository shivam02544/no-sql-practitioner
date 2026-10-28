import { NextResponse } from 'next/server'
import { sandboxManager } from '@/services/sandbox'

export async function GET(): Promise<NextResponse> {
  const datasets = sandboxManager.getTutorialDatasets()
  return NextResponse.json({ datasets })
}