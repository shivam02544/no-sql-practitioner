import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const TAG_LENGTH = 16
const SALT_LENGTH = 64
const ITERATIONS = 100000

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }
  if (key.length !== KEY_LENGTH) {
    throw new Error(`ENCRYPTION_KEY must be ${KEY_LENGTH} characters long`)
  }
  return Buffer.from(key, 'utf8')
}

function getEncryptionIV(): Buffer {
  const iv = process.env.ENCRYPTION_IV
  if (!iv) {
    throw new Error('ENCRYPTION_IV environment variable is not set')
  }
  if (iv.length !== IV_LENGTH) {
    throw new Error(`ENCRYPTION_IV must be ${IV_LENGTH} characters long`)
  }
  return Buffer.from(iv, 'utf8')
}

export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey()
    const iv = getEncryptionIV()
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()
    const result = Buffer.concat([iv, encrypted, authTag])
    return result.toString('base64')
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

export function decrypt(encryptedData: string): string {
  try {
    const key = getEncryptionKey()
    const buffer = Buffer.from(encryptedData, 'base64')
    const iv = buffer.subarray(0, IV_LENGTH)
    const authTag = buffer.subarray(buffer.length - TAG_LENGTH)
    const encrypted = buffer.subarray(IV_LENGTH, buffer.length - TAG_LENGTH)
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return decrypted.toString('utf8')
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH)
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256')
  return `${salt.toString('base64')}:${hash.toString('base64')}`
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  try {
    const [saltB64, hashB64] = hashedPassword.split(':')
    const salt = Buffer.from(saltB64, 'base64')
    const hash = Buffer.from(hashB64, 'base64')
    const verifyHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256')
    return crypto.timingSafeEqual(hash, verifyHash)
  } catch {
    return false
  }
}

export function generateSecureToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

export function generateApiKey(prefix = 'mdb'): string {
  const randomPart = crypto.randomBytes(24).toString('base64url')
  return `${prefix}_${randomPart}`
}

export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex')
}