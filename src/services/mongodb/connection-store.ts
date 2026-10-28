import fs from 'fs'
import path from 'path'
import { MongoDBConnection } from '@/types'
import { encrypt, decrypt } from '@/lib/encryption'

const DATA_DIR = path.join(process.cwd(), '.data')
const STORE_FILE = path.join(DATA_DIR, 'connections.json')

const memoryConnections: Map<string, MongoDBConnection> = new Map()
let activeConnectionId: string | null = null
let isInitialized = false

function ensureInitialized() {
  if (isInitialized) return
  isInitialized = true
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, 'utf-8')
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed.connections)) {
        for (const conn of parsed.connections) {
          memoryConnections.set(conn.id, {
            ...conn,
            createdAt: new Date(conn.createdAt || Date.now()),
            updatedAt: new Date(conn.updatedAt || Date.now()),
            lastConnectedAt: conn.lastConnectedAt ? new Date(conn.lastConnectedAt) : undefined,
          })
        }
      }
      if (parsed.activeConnectionId) {
        activeConnectionId = parsed.activeConnectionId
      }
    }
  } catch (err) {
    console.error('Failed to load connections from disk:', err)
  }

  // If memoryConnections is empty and MONGODB_URI is provided in env, seed it
  if (memoryConnections.size === 0 && process.env.MONGODB_URI) {
    const envConn: MongoDBConnection = {
      id: 'conn-local-env',
      name: 'Default Environment MongoDB',
      uri: encrypt(process.env.MONGODB_URI),
      database: process.env.MONGODB_DATABASE || 'test',
      type: 'local',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    memoryConnections.set(envConn.id, envConn)
    activeConnectionId = envConn.id
  }
}

function persistToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    const payload = {
      connections: Array.from(memoryConnections.values()),
      activeConnectionId,
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(payload, null, 2), 'utf-8')
  } catch (err) {
    console.error('Failed to persist connections to disk:', err)
  }
}

export function getAllConnections(): MongoDBConnection[] {
  ensureInitialized()
  return Array.from(memoryConnections.values()).map(conn => ({
    ...conn,
    // Return decrypted URI to caller if needed or keep plain
    uri: decrypt(conn.uri),
    isActive: conn.id === activeConnectionId,
  }))
}

export function getConnection(id: string): MongoDBConnection | null {
  ensureInitialized()

  let conn: MongoDBConnection | null = null

  if (id === 'current' || id === 'active' || id === 'default') {
    if (activeConnectionId && memoryConnections.has(activeConnectionId)) {
      conn = memoryConnections.get(activeConnectionId)!
    } else {
      const first = Array.from(memoryConnections.values())[0]
      if (first) {
        conn = first
      } else if (process.env.MONGODB_URI) {
        return {
          id: 'conn-default',
          name: 'Default Local Connection',
          uri: process.env.MONGODB_URI,
          database: process.env.MONGODB_DATABASE || 'test',
          type: 'local',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }
    }
  } else {
    conn = memoryConnections.get(id) || null
  }

  if (!conn) return null

  return {
    ...conn,
    uri: decrypt(conn.uri),
    isActive: conn.id === activeConnectionId,
  }
}

export function saveConnection(
  conn: Partial<MongoDBConnection> & { name: string; uri: string }
): MongoDBConnection {
  ensureInitialized()
  const id = conn.id || 'conn-' + Date.now()
  const existing = memoryConnections.get(id)

  const isPlainUri = conn.uri.startsWith('mongodb://') || conn.uri.startsWith('mongodb+srv://')
  const encryptedUri = isPlainUri ? encrypt(conn.uri) : conn.uri

  const shouldBeActive = conn.isActive ?? (activeConnectionId === id || memoryConnections.size === 0)

  const fullConn: MongoDBConnection = {
    id,
    name: conn.name,
    uri: encryptedUri,
    database: conn.database || existing?.database,
    type: conn.type || existing?.type || 'local',
    options: conn.options || existing?.options,
    isActive: shouldBeActive,
    createdAt: existing?.createdAt || conn.createdAt || new Date(),
    updatedAt: new Date(),
    lastConnectedAt: conn.lastConnectedAt || existing?.lastConnectedAt,
  }

  memoryConnections.set(id, fullConn)

  if (shouldBeActive) {
    activeConnectionId = id
    for (const [key, c] of memoryConnections.entries()) {
      c.isActive = key === id
    }
  }

  persistToDisk()

  return {
    ...fullConn,
    uri: decrypt(fullConn.uri),
  }
}

export function setActiveConnection(id: string): MongoDBConnection | null {
  ensureInitialized()
  const conn = memoryConnections.get(id)
  if (conn) {
    activeConnectionId = id
    for (const [key, c] of memoryConnections.entries()) {
      c.isActive = key === id
    }
    conn.lastConnectedAt = new Date()
    persistToDisk()
    return {
      ...conn,
      uri: decrypt(conn.uri),
      isActive: true,
    }
  }
  return null
}

export function deleteConnection(id: string): boolean {
  ensureInitialized()
  const deleted = memoryConnections.delete(id)
  if (activeConnectionId === id) {
    activeConnectionId = Array.from(memoryConnections.keys())[0] || null
  }
  if (deleted) {
    persistToDisk()
  }
  return deleted
}
