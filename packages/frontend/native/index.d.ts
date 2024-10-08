/* auto-generated by NAPI-RS */
/* eslint-disable */
export declare class SqliteConnection {
  constructor(path: string)
  connect(): Promise<void>
  addBlob(key: string, blob: Uint8Array): Promise<void>
  getBlob(key: string): Promise<BlobRow | null>
  deleteBlob(key: string): Promise<void>
  getBlobKeys(): Promise<Array<string>>
  getUpdates(docId?: string | undefined | null): Promise<Array<UpdateRow>>
  deleteUpdates(docId?: string | undefined | null): Promise<void>
  getUpdatesCount(docId?: string | undefined | null): Promise<number>
  getAllUpdates(): Promise<Array<UpdateRow>>
  insertUpdates(updates: Array<InsertRow>): Promise<void>
  replaceUpdates(docId: string | undefined | null, updates: Array<InsertRow>): Promise<void>
  getServerClock(key: string): Promise<BlobRow | null>
  setServerClock(key: string, data: Uint8Array): Promise<void>
  getServerClockKeys(): Promise<Array<string>>
  clearServerClock(): Promise<void>
  delServerClock(key: string): Promise<void>
  getSyncMetadata(key: string): Promise<BlobRow | null>
  setSyncMetadata(key: string, data: Uint8Array): Promise<void>
  getSyncMetadataKeys(): Promise<Array<string>>
  clearSyncMetadata(): Promise<void>
  delSyncMetadata(key: string): Promise<void>
  initVersion(): Promise<void>
  setVersion(version: number): Promise<void>
  getMaxVersion(): Promise<number>
  close(): Promise<void>
  get isClose(): boolean
  static validate(path: string): Promise<ValidationResult>
  migrateAddDocId(): Promise<void>
  /**
   * Flush the WAL file to the database file.
   * See https://www.sqlite.org/pragma.html#pragma_wal_checkpoint:~:text=PRAGMA%20schema.wal_checkpoint%3B
   */
  checkpoint(): Promise<void>
}

export interface BlobRow {
  key: string
  data: Buffer
  timestamp: Date
}

export interface InsertRow {
  docId?: string
  data: Uint8Array
}

export declare function mintChallengeResponse(resource: string, bits?: number | undefined | null): Promise<string>

export interface UpdateRow {
  id: number
  timestamp: Date
  data: Buffer
  docId?: string
}

export declare enum ValidationResult {
  MissingTables = 0,
  MissingDocIdColumn = 1,
  MissingVersionColumn = 2,
  GeneralError = 3,
  Valid = 4
}

export declare function verifyChallengeResponse(response: string, bits: number, resource: string): Promise<boolean>

