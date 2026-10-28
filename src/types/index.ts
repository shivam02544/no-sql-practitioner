export interface MongoDBConnection {
  id: string
  name: string
  uri: string
  database?: string
  type: 'local' | 'atlas' | 'sandbox'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastConnectedAt?: Date
  options?: ConnectionOptions
}

export interface ConnectionOptions {
  ssl?: boolean
  replicaSet?: string
  authSource?: string
  maxPoolSize?: number
  minPoolSize?: number
  maxIdleTimeMS?: number
  serverSelectionTimeoutMS?: number
  socketTimeoutMS?: number
  connectTimeoutMS?: number
}

export interface DatabaseInfo {
  name: string
  sizeOnDisk: number
  dataSize: number
  indexSize: number
  collections: number
  views: number
  objects: number
  avgObjSize: number
  storageSize: number
  freeStorageSize: number
}

export interface CollectionInfo {
  name: string
  type: 'collection' | 'view'
  count: number
  size: number
  avgObjSize: number
  storageSize: number
  freeStorageSize: number
  totalIndexSize: number
  indexes: IndexInfo[]
  capped?: boolean
  max?: number
  validator?: Document
  validationLevel?: 'off' | 'strict' | 'moderate'
  validationAction?: 'error' | 'warn'
}

export interface IndexInfo {
  name: string
  key: Document
  unique: boolean
  sparse: boolean
  background: boolean
  version: number
  collation?: Collation
  partialFilterExpression?: Document
  expireAfterSeconds?: number
  weights?: Document
  default_language?: string
  language_override?: string
  textIndexVersion?: number
  sphereVersion?: number
  bits?: number
  min?: number
  max?: number
  bucketSize?: number
}

export interface Collation {
  locale: string
  caseLevel?: boolean
  caseFirst?: 'upper' | 'lower' | 'off'
  strength?: 1 | 2 | 3 | 4 | 5
  numericOrdering?: boolean
  alternate?: 'non-ignorable' | 'shifted'
  maxVariable?: 'punct' | 'space'
  backwards?: boolean
  normalization?: boolean
}

export interface Document {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export interface QueryFilter {
  filter: Document
  projection?: Document
  sort?: Document
  limit?: number
  skip?: number
  collation?: Collation
  hint?: Document | string
  maxTimeMS?: number
  batchSize?: number
}

export interface FindResult<T = Document> {
  documents: T[]
  totalCount: number
  hasMore: boolean
  executionTimeMs: number
  explainPlan?: ExplainPlan
}

export interface ExplainPlan {
  queryPlanner: QueryPlanner
  executionStats?: ExecutionStats
  serverInfo: ServerInfo
  ok: number
}

export interface QueryPlanner {
  namespace: string
  indexFilterSet: boolean
  parsedQuery: Document
  queryHash: string
  planCacheKey: string
  winningPlan: PlanNode
  rejectedPlans: PlanNode[]
}

export interface PlanNode {
  stage: string
  inputStage?: PlanNode
  inputStages?: PlanNode[]
  indexName?: string
  indexBounds?: Document
  direction?: 'forward' | 'backward'
  docsExamined?: number
  keysExamined?: number
  seeks?: number
  filter?: Document
  nReturned?: number
  executionTimeMillisEstimate?: number
  works?: number
  advanced?: number
  needTime?: number
  needYield?: number
  saveState?: number
  restoreState?: number
  isEOF?: number
}

export interface ExecutionStats {
  executionSuccess: boolean
  nReturned: number
  executionTimeMillis: number
  totalKeysExamined: number
  totalDocsExamined: number
  executionStages: PlanNode
}

export interface ServerInfo {
  host: string
  port: number
  version: string
  gitVersion: string
}

export interface AggregationPipeline {
  stages: AggregationStage[]
  options?: AggregationOptions
}

export interface AggregationStage {
  id?: string
  name: string
  operator: string
  expression: Document
  description?: string
  enabled: boolean
}

export interface AggregationOptions {
  allowDiskUse?: boolean
  bypassDocumentValidation?: boolean
  collation?: Collation
  maxTimeMS?: number
  batchSize?: number
  let?: Document
  comment?: string
}

export interface AggregationResult {
  documents: Document[]
  executionTimeMs: number
  explainPlan?: ExplainPlan
  pipeline: AggregationStage[]
}

export interface SchemaField {
  name: string
  type: BSONType
  required: boolean
  description?: string
  validation?: FieldValidation
  defaultValue?: unknown
  enumValues?: unknown[]
  embeddedFields?: SchemaField[]
  reference?: ReferenceInfo
  arrayItemType?: SchemaField
}

export type BSONType =
  | 'double'
  | 'string'
  | 'object'
  | 'array'
  | 'binData'
  | 'undefined'
  | 'objectId'
  | 'bool'
  | 'date'
  | 'null'
  | 'regex'
  | 'dbPointer'
  | 'javascript'
  | 'symbol'
  | 'javascriptWithScope'
  | 'int'
  | 'timestamp'
  | 'long'
  | 'decimal'
  | 'minKey'
  | 'maxKey'
  | 'mixed'

export interface FieldValidation {
  bsonType?: BSONType | BSONType[]
  minimum?: number
  maximum?: number
  exclusiveMinimum?: boolean
  exclusiveMaximum?: boolean
  multipleOf?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  enum?: unknown[]
  items?: FieldValidation
  properties?: Record<string, FieldValidation>
  required?: string[]
  additionalProperties?: boolean | FieldValidation
}

export interface ReferenceInfo {
  collection: string
  field: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  cascadeDelete?: boolean
}

export interface CollectionSchema {
  collectionName: string
  databaseName: string
  fields: SchemaField[]
  validationRules?: Document
  validationLevel?: 'off' | 'strict' | 'moderate'
  validationAction?: 'error' | 'warn'
  indexes: IndexDefinition[]
  relationships: Relationship[]
  sampleSize: number
  inferredAt: Date
}

export interface IndexDefinition {
  name: string
  keys: Record<string, 1 | -1 | 'text' | '2dsphere' | '2d' | 'hashed'>
  options: IndexOptions
}

export interface IndexOptions {
  unique?: boolean
  sparse?: boolean
  background?: boolean
  expireAfterSeconds?: number
  partialFilterExpression?: Document
  weights?: Record<string, number>
  default_language?: string
  language_override?: string
  textIndexVersion?: number
  sphereVersion?: number
  bits?: number
  min?: number
  max?: number
  bucketSize?: number
  collation?: Collation
}

export interface Relationship {
  fromCollection: string
  fromField: string
  toCollection: string
  toField: string
  type: 'embeds' | 'references' | 'referencedBy'
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-many' | 'many-to-one'
}

export interface SchemaVisualization {
  nodes: SchemaNode[]
  edges: SchemaEdge[]
}

export interface SchemaNode {
  id: string
  label: string
  collectionName: string
  fieldCount: number
  documentCount: number
  size: number
  position?: { x: number; y: number }
}

export interface SchemaEdge {
  id: string
  source: string
  target: string
  type: 'embeds' | 'references' | 'referencedBy'
  label?: string
  cardinality: string
}

export interface DataProfile {
  collectionName: string
  databaseName: string
  totalDocuments: number
  fieldProfiles: FieldProfile[]
  missingValues: MissingValueInfo[]
  duplicates: DuplicateInfo[]
  dataQualityScore: number
  analyzedAt: Date
}

export interface FieldProfile {
  fieldName: string
  type: BSONType
  count: number
  nullCount: number
  uniqueCount: number
  minValue?: unknown
  maxValue?: unknown
  avgLength?: number
  minLength?: number
  maxLength?: number
  topValues: ValueFrequency[]
  histogram?: HistogramBucket[]
  sampleValues: unknown[]
}

export interface ValueFrequency {
  value: unknown
  count: number
  percentage: number
}

export interface HistogramBucket {
  min: number
  max: number
  count: number
}

export interface MissingValueInfo {
  fieldName: string
  missingCount: number
  missingPercentage: number
}

export interface DuplicateInfo {
  fields: string[]
  duplicateCount: number
  duplicatePercentage: number
  sampleDocuments: Document[]
}

export interface TransformationPipeline {
  id: string
  name: string
  description: string
  steps: TransformationStep[]
  source: DataSource
  destination: DataDestination
  schedule?: ScheduleConfig
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastRunAt?: Date
  lastRunStatus?: 'success' | 'failed' | 'running'
  lastRunStats?: RunStats
}

export interface TransformationStep {
  id: string
  name: string
  type: TransformationType
  config: Document
  order: number
  enabled: boolean
}

export type TransformationType =
  | 'filter'
  | 'project'
  | 'map'
  | 'reduce'
  | 'join'
  | 'union'
  | 'deduplicate'
  | 'validate'
  | 'enrich'
  | 'aggregate'
  | 'pivot'
  | 'unpivot'
  | 'custom'

export interface DataSource {
  type: 'mongodb' | 'csv' | 'json' | 'api' | 'database' | 'file'
  connectionId?: string
  collection?: string
  query?: Document
  filePath?: string
  apiConfig?: APIConfig
}

export interface DataDestination {
  type: 'mongodb' | 'csv' | 'json' | 'file'
  connectionId?: string
  collection?: string
  filePath?: string
  writeMode: 'insert' | 'upsert' | 'replace' | 'append'
  options?: Document
}

export interface APIConfig {
  url: string
  method: 'GET' | 'POST'
  headers?: Record<string, string>
  body?: Document
  pagination?: PaginationConfig
}

export interface PaginationConfig {
  type: 'offset' | 'cursor' | 'page'
  pageParam?: string
  limitParam?: string
  cursorParam?: string
  responsePath: string
}

export interface ScheduleConfig {
  cron: string
  timezone: string
  enabled: boolean
}

export interface RunStats {
  documentsRead: number
  documentsWritten: number
  documentsFailed: number
  durationMs: number
  errors: string[]
}

export interface DataLineage {
  nodes: LineageNode[]
  edges: LineageEdge[]
}

export interface LineageNode {
  id: string
  name: string
  type: 'source' | 'transformation' | 'destination' | 'collection'
  metadata: Document
  position?: { x: number; y: number }
}

export interface LineageEdge {
  id: string
  source: string
  target: string
  type: 'reads' | 'writes' | 'transforms'
  metadata?: Document
}

export interface PerformanceMetrics {
  collectionName: string
  databaseName: string
  timestamp: Date
  operations: OperationMetrics
  latency: LatencyMetrics
  throughput: ThroughputMetrics
  connections: ConnectionMetrics
  memory: MemoryMetrics
  locks: LockMetrics
  indexUsage: IndexUsageMetrics[]
}

export interface OperationMetrics {
  insert: number
  query: number
  update: number
  delete: number
  getmore: number
  command: number
}

export interface LatencyMetrics {
  read: LatencyPercentiles
  write: LatencyPercentiles
  command: LatencyPercentiles
}

export interface LatencyPercentiles {
  p50: number
  p90: number
  p95: number
  p99: number
  max: number
}

export interface ThroughputMetrics {
  readsPerSecond: number
  writesPerSecond: number
  commandsPerSecond: number
}

export interface ConnectionMetrics {
  current: number
  available: number
  totalCreated: number
}

export interface MemoryMetrics {
  resident: number
  virtual: number
  mapped: number
  mappedWithJournal: number
}

export interface LockMetrics {
  global: LockMetric
  database: LockMetric
  collection: LockMetric
  mutex: LockMetric
}

export interface LockMetric {
  acquireCount: number
  acquireWaitCount: number
  timeAcquiringMicros: number
  deadlockCount: number
}

export interface IndexUsageMetrics {
  indexName: string
  accesses: number
  hits: number
  misses: number
  hitRatio: number
  size: number
}

export interface SlowQuery {
  query: Document
  collection: string
  database: string
  durationMs: number
  timestamp: Date
  planSummary: string
  keysExamined: number
  docsExamined: number
  nReturned: number
}

export interface OptimizationSuggestion {
  type: 'index' | 'query' | 'schema' | 'configuration'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  impact: string
  effort: 'low' | 'medium' | 'high'
  suggestedAction: string
  relatedQuery?: Document
  relatedIndex?: IndexDefinition
}

export interface SavedQuery {
  id: string
  name: string
  description?: string
  connectionId: string
  database: string
  collection: string
  type: 'find' | 'aggregate' | 'update' | 'delete' | 'index' | 'command'
  query: Document
  tags: string[]
  isFavorite: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  runCount: number
  lastRunAt?: Date
}

export interface QueryHistoryEntry {
  id: string
  connectionId: string
  database: string
  collection: string
  type: 'find' | 'aggregate' | 'update' | 'delete' | 'index' | 'command'
  query: Document
  result?: Document
  error?: string
  executionTimeMs: number
  timestamp: Date
  executedBy: string
}

export interface Tutorial {
  id: string
  title: string
  description: string
  category: TutorialCategory
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTimeMinutes: number
  steps: TutorialStep[]
  prerequisites: string[]
  tags: string[]
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

export type TutorialCategory =
  | 'getting-started'
  | 'crud'
  | 'querying'
  | 'aggregation'
  | 'indexing'
  | 'data-modeling'
  | 'performance'
  | 'data-engineering'
  | 'administration'

export interface TutorialStep {
  id: string
  title: string
  description: string
  type: 'instruction' | 'action' | 'verification' | 'explanation'
  content: string
  expectedAction?: ExpectedAction
  validation?: ValidationRule
  hints?: string[]
  commandPreview?: CommandPreview
}

export interface ExpectedAction {
  type: 'connect' | 'query' | 'create' | 'update' | 'delete' | 'aggregate' | 'index'
  target?: string
  parameters?: Document
}

export interface ValidationRule {
  type: 'result-count' | 'field-exists' | 'value-equals' | 'command-executed'
  expected: unknown
  field?: string
}

export interface CommandPreview {
  shell: string
  driver: string
  description: string
}

export interface SandboxEnvironment {
  id: string
  name: string
  description: string
  databases: SandboxDatabase[]
  isActive: boolean
  expiresAt?: Date
  createdAt: Date
  resetAt?: Date
}

export interface SandboxDatabase {
  name: string
  collections: SandboxCollection[]
}

export interface SandboxCollection {
  name: string
  documents: Document[]
  indexes: IndexDefinition[]
  validationRules?: Document
}

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'admin' | 'user' | 'viewer'
  preferences: UserPreferences
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  defaultConnectionId?: string
  editorTheme: 'vs-dark' | 'vs-light' | 'hc-black'
  fontSize: number
  tabSize: number
  wordWrap: 'on' | 'off' | 'bounded'
  minimapEnabled: boolean
  autoSave: boolean
  showLineNumbers: boolean
  formatOnSave: boolean
  language: string
}

export interface AppNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionLabel?: string
}

export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: APIError
  meta?: ResponseMeta
}

export interface APIError {
  code: string
  message: string
  details?: Document
  statusCode: number
}

export interface ResponseMeta {
  timestamp: Date
  requestId: string
  executionTimeMs: number
  version: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationInfo
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export type ViewMode = 'table' | 'json' | 'tree' | 'cards'

export interface EditorState {
  content: string
  language: 'javascript' | 'json' | 'mongodb' | 'yaml'
  theme: 'vs-dark' | 'vs-light' | 'hc-black'
  readOnly: boolean
  minimap: boolean
  lineNumbers: boolean
  wordWrap: 'on' | 'off' | 'bounded'
  tabSize: number
  fontSize: number
}

export interface DragDropItem {
  id: string
  type: string
  data: unknown
}

export interface ChartDataPoint {
  x: string | number | Date
  y: number
  [key: string]: unknown
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'scatter' | 'heatmap' | 'histogram'
  xKey: string
  yKeys: string[]
  title?: string
  xLabel?: string
  yLabel?: string
  colors?: string[]
  legend?: boolean
  tooltip?: boolean
  grid?: boolean
  animation?: boolean
  responsive?: boolean
}