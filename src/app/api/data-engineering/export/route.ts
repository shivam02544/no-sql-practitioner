import { NextRequest, NextResponse } from 'next/server'
import { importExportService } from '@/services/data-engineering'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { documents, format, filename } = body

    if (!documents || !Array.isArray(documents)) {
      return NextResponse.json({ error: 'Documents array is required' }, { status: 400 })
    }

    let content: string
    let contentType: string
    let extension: string

    switch (format) {
      case 'csv':
        content = await importExportService.generateCSV(documents)
        contentType = 'text/csv'
        extension = 'csv'
        break
      case 'json':
        content = await importExportService.generateJSON(documents)
        contentType = 'application/json'
        extension = 'json'
        break
      case 'jsonl':
        content = await importExportService.generateJSONL(documents)
        contentType = 'application/jsonl'
        extension = 'jsonl'
        break
      default:
        return NextResponse.json({ error: 'Unsupported export format' }, { status: 400 })
    }

    const finalFilename = filename || `export.${extension}`

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${finalFilename}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to export data' }, { status: 500 })
  }
}