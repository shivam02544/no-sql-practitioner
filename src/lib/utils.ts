import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K'
  return num.toString()
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(1)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`
  return `${(ms / 3600000).toFixed(1)}h`
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  })
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(d)
}

export function generateId(prefix = ''): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

export function isEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  keys.forEach((key) => delete result[key])
  return result
}

export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach((key) => {
    if (key in obj) result[key] = obj[key]
  })
  return result
}

export function groupBy<T>(array: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = typeof key === 'function' ? key(item) : String(item[key])
    if (!groups[groupKey]) groups[groupKey] = []
    groups[groupKey].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export function sortBy<T>(array: T[], key: keyof T | ((item: T) => unknown), order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = (typeof key === 'function' ? key(a) : a[key]) as string | number
    const bVal = (typeof key === 'function' ? key(b) : b[key]) as string | number
    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}

export function uniqueBy<T>(array: T[], key: keyof T | ((item: T) => unknown)): T[] {
  const seen = new Set()
  return array.filter((item) => {
    const val = typeof key === 'function' ? key(item) : item[key]
    if (seen.has(val)) return false
    seen.add(val)
    return true
  })
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function parseJSONSafe<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

export function stringifyJSONSafe(obj: unknown, fallback = '{}'): string {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return fallback
  }
}

export function truncate(str: string, length: number, suffix = '...'): string {
  if (str.length <= length) return str
  return str.substring(0, length - suffix.length) + suffix
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

export function camelToSnake(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getColorForString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = hash % 360
  return `hsl(${hue}, 70%, 50%)`
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000,
  backoff = 2
): Promise<T> {
  return fn().catch((err) => {
    if (retries === 0) throw err
    return sleep(delay).then(() => retry(fn, retries - 1, delay * backoff, backoff))
  })
}

export function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  return Object.keys(obj).reduce((acc, key) => {
    const newKey = prefix ? `${prefix}.${key}` : key
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key] as Record<string, unknown>, newKey))
    } else {
      acc[newKey] = obj[key]
    }
    return acc
  }, {} as Record<string, unknown>)
}

export function unflattenObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  Object.keys(obj).forEach((key) => {
    const keys = key.split('.')
    let current: Record<string, unknown> = result
    keys.forEach((k, i) => {
      if (i === keys.length - 1) {
        current[k] = obj[key]
      } else {
        current[k] = current[k] || {}
        current = current[k] as Record<string, unknown>
      }
    })
  })
  return result
}

export function parseMongoDBURI(uri: string): {
  protocol: string
  username?: string
  password?: string
  hosts: Array<{ host: string; port: number }>
  database?: string
  options: Record<string, string>
} | null {
  try {
    const url = new URL(uri)
    const protocol = url.protocol.replace(':', '')
    const username = url.username ? decodeURIComponent(url.username) : undefined
    const password = url.password ? decodeURIComponent(url.password) : undefined
    const hosts = url.hostname.split(',').map((host) => {
      const [hostname, port] = host.split(':')
      return { host: hostname, port: parseInt(port || '27017', 10) }
    })
    const database = url.pathname.slice(1) || undefined
    const options: Record<string, string> = {}
    url.searchParams.forEach((value, key) => {
      options[key] = value
    })
    return { protocol, username, password, hosts, database, options }
  } catch {
    return null
  }
}

export function buildMongoDBURI(config: {
  protocol: string
  username?: string
  password?: string
  hosts: Array<{ host: string; port: number }>
  database?: string
  options?: Record<string, string>
}): string {
  let uri = `${config.protocol}://`
  if (config.username) {
    uri += encodeURIComponent(config.username)
    if (config.password) {
      uri += `:${encodeURIComponent(config.password)}`
    }
    uri += '@'
  }
  uri += config.hosts.map((h) => `${h.host}:${h.port}`).join(',')
  if (config.database) {
    uri += `/${config.database}`
  }
  if (config.options && Object.keys(config.options).length > 0) {
    const params = new URLSearchParams(config.options)
    uri += `?${params.toString()}`
  }
  return uri
}

export function validateJSON(json: string): { valid: boolean; error?: string; parsed?: unknown } {
  try {
    const parsed = JSON.parse(json)
    return { valid: true, parsed }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Invalid JSON' }
  }
}

export function validateMongoDBQuery(query: unknown): { valid: boolean; error?: string } {
  if (query === null || query === undefined) {
    return { valid: false, error: 'Query cannot be null or undefined' }
  }
  if (typeof query !== 'object') {
    return { valid: false, error: 'Query must be an object' }
  }
  if (Array.isArray(query)) {
    return { valid: false, error: 'Query cannot be an array (use aggregation pipeline for arrays)' }
  }
  return { valid: true }
}

export function sanitizeMongoDBQuery(query: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...query }
  const dangerousKeys = ['$where', '$eval', '$function', '$accumulator', '$reduce']
  dangerousKeys.forEach((key) => {
    if (key in sanitized) {
      console.warn(`Potentially dangerous operator ${key} removed from query`)
      delete sanitized[key]
    }
  })
  return sanitized
}

export function estimateDocumentSize(doc: Record<string, unknown>): number {
  try {
    return new TextEncoder().encode(JSON.stringify(doc)).length
  } catch {
    return 0
  }
}

export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0
  return Math.round((part / total) * 10000) / 100
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}