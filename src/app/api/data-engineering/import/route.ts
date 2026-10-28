import { NextRequest, NextResponse } from 'next/server'
import { importExportService } from '@/services/data-engineering'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const format = formData.get('format') as string || 'auto'

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    const text = await file.text()
    let documents
    let detectedFormat = format

    if (format === 'auto') {
      detectedFormat = await importExportService.detectFormat(text)
    }

    switch (detectedFormat) {
      case 'csv':
        documents = await importExportService.parseCSV(text)
        break
      case 'json':
        documents = await importExportService.parseJSON(text)
        break
      case 'jsonl':
        documents = await importExportService.parseJSONL(text)
        break
      default:
        return NextResponse.json({ error: 'Unsupported file format' }, { status: 400 })
    }

    // Return preview (first 100 documents)
    const preview = documents.slice(0, 100)

    return NextResponse.json({
      documents: preview,
      totalCount: documents.length,
      format: detectedFormat,
      sampleSize: preview.length,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to import file' }, { status: 500 })
  }
}