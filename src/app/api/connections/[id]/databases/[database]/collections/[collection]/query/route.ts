import { NextRequest, NextResponse } from 'next/server'
import { connectionManager } from '@/services/mongodb'
import { MongoDBConnection, QueryFilter, AggregationPipeline, Document } from '@/types'
import { commandGeneratorService } from '@/services/mongodb'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; database: string; collection: string }> }
): Promise<NextResponse> {
  try {
    const { id, database, collection } = await params
    const body = await request.json()
    const { type, filter, projection, sort, limit, skip, pipeline, update, upsert, command } = body

    const connection: MongoDBConnection = {
      id,
      name: 'Test',
      uri: '',
      type: 'local',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    let result: unknown

    switch (type) {
      case 'find': {
        const queryFilter: QueryFilter = {
          filter: filter || {},
          projection,
          sort,
          limit: limit || 20,
          skip: skip || 0,
        }
        result = await connectionManager.findDocuments(id, connection, database, collection, queryFilter)
        break
      }
      case 'findOne': {
        const doc = await connectionManager.findDocuments(id, connection, database, collection, {
          filter: filter || {},
          projection,
          limit: 1,
        })
        result = { documents: doc.documents, totalCount: doc.totalCount, hasMore: false, executionTimeMs: doc.executionTimeMs }
        break
      }
      case 'count': {
        const count = await connectionManager.findDocuments(id, connection, database, collection, {
          filter: filter || {},
          limit: 0,
        })
        result = { count: count.totalCount }
        break
      }
      case 'distinct': {
        const client = await connectionManager.getClient(id, connection)
        const db = client.db(database)
        const coll = db.collection(collection)
        const values = await coll.distinct(body.field, filter || {})
        result = { values }
        break
      }
      case 'aggregate': {
        const aggPipeline: AggregationPipeline = {
          stages: pipeline.map((p: Document) => ({ name: Object.keys(p)[0], operator: Object.keys(p)[0], expression: p, enabled: true })),
          options: body.options,
        }
        result = await connectionManager.aggregate(id, connection, database, collection, aggPipeline)
        break
      }
      case 'insertOne': {
        result = await connectionManager.insertDocument(id, connection, database, collection, body.document)
        break
      }
      case 'insertMany': {
        result = await connectionManager.insertDocuments(id, connection, database, collection, body.documents)
        break
      }
      case 'updateOne': {
        result = await connectionManager.updateDocument(id, connection, database, collection, filter || {}, update, { upsert })
        break
      }
      case 'updateMany': {
        result = await connectionManager.updateDocument(id, connection, database, collection, filter || {}, update, { upsert, multi: true })
        break
      }
      case 'deleteOne': {
        result = await connectionManager.deleteDocument(id, connection, database, collection, filter || {})
        break
      }
      case 'deleteMany': {
        result = await connectionManager.deleteDocument(id, connection, database, collection, filter || {}, { multi: true })
        break
      }
      case 'command': {
        result = await connectionManager.runCommand(id, connection, database, command)
        break
      }
      default:
        return NextResponse.json({ error: `Unknown query type: ${type}` }, { status: 400 })
    }

    // Generate command preview
    let commandPreview
    if (type === 'find' || type === 'findOne') {
      commandPreview = commandGeneratorService.generateFindCommand(connection, database, collection, {
        filter: filter || {},
        projection,
        sort,
        limit,
        skip,
      })
    } else if (type === 'aggregate') {
      const aggPipeline: AggregationPipeline = {
        stages: pipeline.map((p: Document) => ({ name: Object.keys(p)[0], operator: Object.keys(p)[0], expression: p, enabled: true })),
        options: body.options,
      }
      commandPreview = commandGeneratorService.generateAggregateCommand(connection, database, collection, aggPipeline)
    } else if (type === 'insertOne') {
      commandPreview = commandGeneratorService.generateInsertOneCommand(connection, database, collection, body.document)
    } else if (type === 'insertMany') {
      commandPreview = commandGeneratorService.generateInsertManyCommand(connection, database, collection, body.documents)
    } else if (type === 'updateOne') {
      commandPreview = commandGeneratorService.generateUpdateOneCommand(connection, database, collection, filter || {}, update, { upsert })
    } else if (type === 'updateMany') {
      commandPreview = commandGeneratorService.generateUpdateManyCommand(connection, database, collection, filter || {}, update, { upsert })
    } else if (type === 'deleteOne') {
      commandPreview = commandGeneratorService.generateDeleteOneCommand(connection, database, collection, filter || {})
    } else if (type === 'deleteMany') {
      commandPreview = commandGeneratorService.generateDeleteManyCommand(connection, database, collection, filter || {})
    }

    return NextResponse.json({ result, command: commandPreview })
  } catch (error) {
    console.error('Execute query error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to execute query' }, { status: 500 })
  }
}