
const CONFIG = require('../config')

const PROPERTY_TABLE_CREATOR = {
  attachment: createAttachmentTable,
  string: createStringTable,
  text: createTextTable,
  decimal: createDecimalTable,
  integer: createIntegerTable,
  boolean: createBooleanTable,
  timestamp: createTimestampTable,
  property: createPropertyTable,
  association: createAssociationTable,
  object: createObjectTable,
}

const PROPERTY_RECORD_CREATOR = {
  attachment: createAttachmentValue,
  string: createStringValue,
  text: createTextValue,
  decimal: createDecimalValue,
  integer: createIntegerValue,
  boolean: createBooleanValue,
  timestamp: createTimestampValue,
  property: createPropertyRecord,
  association: createAssociationRecord,
  object: createObjectRecord,
}

/**
 * The global first thing that is encountered.
 */

async function createChunkShardShardTable(knex) {
  await knex.schema.createTable(CONFIG.TABLE.CHUNK_SHARD_SHARD, t => {
    t.increments('id').notNull()
    t.string('shard_url')
  })
}

/**
 * The relatively global second thing that is encountered.
 *
 * Where to search for all the records.
 *
 * - organization_id (bigint)
 * - type_id (int)
 * - chunk_id (bigint)
 * - shard_url (string or null)
 * - current (if it's the currently writable chunk)
 * - last_index (the last object id, which is also the count, for this chunk)
 * - id_salt (so it appears random when resolving, random number between 0 and int)
 */

async function createChunkShardTable(knex) {
  await knex.schema.createTable(CONFIG.TABLE.CHUNK_SHARD, t => {
    t.biginteger('organization_id').notNull()
    t.integer('type_id').notNull()
    t.biginteger('chunk_id_salt').notNull().defaultTo(0)
    t.biginteger('chunk_id').notNull().defaultTo(0)
    t.string('shard_url')
    t.integer('id_size').defaultTo(8).notNull()
    t.boolean('current').defaultTo(true).notNull()
    t.biginteger('last_index').defaultTo(0).notNull()
    t.biginteger('id_salt').defaultTo(0).notNull()
  })
}

async function createInitialChunkShardRecord(knex, {
  organizationId,
  typeId,
  idSalt,
  chunkId,
  chunkIdSalt,
  shardUrl = null,
  idSize = 4
}) {
  if (idSalt == null) {
    idSalt = getRandomSalt()
  }
  if (chunkIdSalt == null) {
    chunkIdSalt = getRandomSalt()
  }

  const [ record ] = await knex(CONFIG.TABLE.CHUNK_SHARD)
    .returning(['chunk_id', 'id_salt'])
    .insert({
      organization_id: organizationId,
      type_id: typeId,
      chunk_id: chunkId,
      chunk_id_salt: chunkIdSalt,
      shard_url: shardUrl,
      id_salt: idSalt,
      id_size: idSize,
    })

  record.chunk_id = resolve(BigInt(record.chunk_id), chunkIdSalt, 8)

  return record
}

/**
 * Point us to the chunk.
 */

async function createInitialChunkShardShardRecord(knex) {
  return await knex(CONFIG.TABLE.CHUNK_SHARD_SHARD)
    .insert({})
    .returning('*')
}

async function createAttachmentTable(knex) {
  await knex.schema.createTable(CONFIG.TABLE.ATTACHMENT, t => {
    t.biginteger('object_organization_id').notNull()
    t.integer('object_type_id').notNull()
    t.biginteger('object_id').notNull()
    t.integer('object_property_id').notNull()
    t.integer('bucket_id')
    t.string('value_hash')
    t.text('debug')
    t.index(['object_organization_id', 'object_type_id'])
    t.index(['object_organization_id', 'object_type_id', 'object_id'])
  })
}

async function createAttachmentValue(knex, {
  organizationId,
  typeId,
  objectId,
  propertyId,
  bucketId,
  valueHash,
  debug,
}) {
  await knex(CONFIG.TABLE.ATTACHMENT)
    .insert({
      object_organization_id: organizationId,
      object_type_id: typeId,
      object_id: objectId,
      object_property_id: propertyId,
      bucket_id: bucketId,
      value_hash: valueHash,
      debug,
    })
}

async function createStringTable(knex) {
  await knex.schema.createTable(CONFIG.TABLE.STRING, t => {
    t.biginteger('object_organization_id').notNull()
    t.integer('object_type_id').notNull()
    t.biginteger('object_id').notNull()
    t.integer('object_property_id').notNull()
    t.string('value')
    t.text('debug')
    t.index(['object_organization_id', 'object_type_id'])
    t.index(['object_organization_id', 'object_type_id', 'object_id'])
  })
}

async function createStringValue(knex, {
  organizationId,
  typeId,
  objectId,
  propertyId,
  value,
  debug,
}) {
  await knex(CONFIG.TABLE.STRING)
    .insert({
      object_organization_id: organizationId,
      object_type_id: typeId,
      object_id: objectId,
      object_property_id: propertyId,
      value,
      debug,
    })
}

async function createTextTable(knex) {
  await knex.schema.createTable(CONFIG.TABLE.TEXT, t => {
    t.biginteger('object_organization_id').notNull()
    t.integer('object_type_id').notNull()
    t.biginteger('object_id').notNull()
    t.integer('object_property_id').notNull()
    t.text('value')
    t.text('debug')
    t.index(['object_organization_id', 'object_type_id'])
    t.index(['object_organization_id', 'object_type_id', 'object_id'])
  })
}

async function createTextValue(knex, {
  organizationId,
  typeId,
  objectId,
  propertyId,
  value,
  debug,
}) {
  await knex(CONFIG.TABLE.TEXT)
    .insert({
      object_organization_id: organizationId,
      object_type_id: typeId,
      object_id: objectId,
      object_property_id: propertyId,
      value,
      debug,
    })
}

async function createDecimalTable(knex) {
  await knex.schema.createTable(CONFIG.TABLE.DECIMAL, t => {
    t.biginteger('object_organization_id').notNull()
    t.integer('object_type_id').notNull()
    t.biginteger('object_id').notNull()
    t.integer('object_property_id').notNull()
    t.decimal('value', null)
    t.text('debug')
    t.index(['object_organization_id', 'object_type_id'])
    t.index(['object_organization_id', 'object_type_id', 'object_id'])
  })
}

async function createDecimalValue(knex, {
  organizationId,
  typeId,
  objectId,
  propertyId,
  value,
  debug,
}) {
  await knex(CONFIG.TABLE.DECIMAL)
    .insert({
      object_organization_id: organizationId,
      object_type_id: typeId,
      object_id: objectId,
      object_property_id: propertyId,
      value,
      debug,
    })
}

async function createIntegerTable(knex) {
  await knex.schema.createTable(CONFIG.TABLE.INTEGER, t => {
    t.biginteger('object_organization_id').notNull()
    t.integer('object_type_id').notNull()
    t.biginteger('object_id').notNull()
    t.integer('object_property_id').notNull()
    t.integer('value')
    t.text('debug')
    t.index(['object_organization_id', 'object_type_id'])
    t.index(['object_organization_id', 'object_type_id', 'object_id'])
  })
}

async function createIntegerValue(knex, {
  organizationId,
  typeId,
  objectId,
  propertyId,
  value,
  debug,
}) {
  await knex(CONFIG.TABLE.INTEGER)
    .insert({
      object_organization_id: organizationId,
      object_type_id: typeId,
      object_id: objectId,
      object_property_id: propertyId,
      value,
      debug,
    })
}

async function createBooleanTable(knex) {
  await knex.schema.createTable(CONFIG.TABLE.BOOLEAN, t => {
    t.biginteger('object_organization_id').notNull()
    t.integer('object_type_id').notNull()
    t.biginteger('object_id').notNull()
    t.integer('object_property_id').notNull()
    t.boolean('value')
    t.text('debug')
    t.index(['object_organization_id', 'object_type_id'])
    t.index(['object_organization_id', 'object_type_id', 'object_id'])
  })
}

async function createBooleanValue(knex, {
  organizationId,
  typeId,
  objectId,
  propertyId,
  value,
  debug,
}) {
  await knex(CONFIG.TABLE.BOOLEAN)
    .insert({
      object_organization_id: organizationId,
      object_type_id: typeId,
      object_id: objectId,
      object_property_id: propertyId,
      value,
      debug,
    })
}

async function createTimestampTable(knex) {
  await knex.schema.createTable(CONFIG.TABLE.TIMESTAMP, t => {
    t.biginteger('object_organization_id').notNull()
    t.integer('object_type_id').notNull()
    t.biginteger('object_id').notNull()
    t.integer('object_property_id').notNull()
    t.timestamp('value', { useTz: false })
    t.text('debug')
    t.index(['object_organization_id', 'object_type_id'])
    t.index(['object_organization_id', 'object_type_id', 'object_id'])
  })
}

async function createTimestampValue(knex, {
  organizationId,
  typeId,
  objectId,
  propertyId,
  value,
  debug,
}) {
  await knex(CONFIG.TABLE.TIMESTAMP)
    .insert({
      object_organization_id: organizationId,
      object_type_id: typeId,
      object_id: objectId,
      object_property_id: propertyId,
      value,
      debug,
    })
}

async function createPropertyTable(knex) {
  await knex.schema.createTable(CONFIG.TABLE.PROPERTY, t => {
    t.biginteger('object_organization_id').notNull()
    t.integer('object_type_id').notNull()
    t.biginteger('object_id').notNull()
    t.integer('object_property_id').notNull()
    t.biginteger('value_organization_id')
    t.integer('value_type_id')
    t.integer('value_object_id')
    t.integer('value_property_id')
    t.text('debug')
    t.index(['object_organization_id', 'object_type_id'])
    t.index(['object_organization_id', 'object_type_id', 'object_id'])
  })
}

async function createPropertyRecord(knex, {
  organizationId,
  typeId,
  objectId,
  propertyId,
  valueOrganizationId,
  valueTypeId,
  valueId,
  valuePropertyId,
  debug,
}) {
  await knex(CONFIG.TABLE.PROPERTY)
    .insert({
      object_organization_id: organizationId,
      object_type_id: typeId,
      object_id: objectId,
      object_property_id: propertyId,
      value_organization_id: valueOrganizationId,
      value_type_id: valueTypeId,
      value_id: valueId,
      value_property_id: valuePropertyId,
      debug,
    })
}

async function createAssociationTable(knex) {
  await knex.schema.createTable(CONFIG.TABLE.ASSOCIATION, t => {
    t.biginteger('object_organization_id').notNull()
    t.integer('object_type_id').notNull()
    t.biginteger('object_id').notNull()
    t.integer('object_property_id').notNull()
    t.biginteger('value_organization_id').notNull()
    t.integer('value_type_id').notNull()
    t.biginteger('value_object_id').notNull()
    t.text('debug')
    t.index(['object_organization_id', 'object_type_id'])
    t.index(['object_organization_id', 'object_type_id', 'object_id'])
  })
}

async function createAssociationRecord(knex, {
  organizationId,
  typeId,
  objectId,
  propertyId,
  valueOrganizationId,
  valueTypeId,
  valueObjectId,
  debug,
}) {
  await knex(CONFIG.TABLE.ASSOCIATION)
    .insert({
      object_organization_id: organizationId,
      object_type_id: typeId,
      object_id: objectId,
      object_property_id: propertyId,
      value_organization_id: valueOrganizationId,
      value_type_id: valueTypeId,
      value_object_id: valueObjectId,
      debug,
    })
}


async function createObjectTable(knex) {
  await knex.schema.createTable(CONFIG.TABLE.OBJECT, t => {
    t.biginteger('object_organization_id').notNull()
    t.integer('object_type_id').notNull()
    t.biginteger('object_id').notNull()
    t.text('debug')
    t.index(['object_organization_id', 'object_type_id'])
    t.index(['object_organization_id', 'object_type_id', 'object_id'])
  })
}

async function createObjectRecord(knex, {
  organizationId,
  typeId,
  objectId,
  debug,
}) {
  await knex(CONFIG.TABLE.OBJECT)
    .insert({
      object_organization_id: organizationId,
      object_type_id: typeId,
      object_id: objectId,
      debug,
    })
}

async function createRecord() {

}

async function createRecordList() {

}

module.exports = {
  PROPERTY_TABLE_CREATOR,
  PROPERTY_RECORD_CREATOR,
  createChunkShardShardTable,
  createChunkShardTable,
  createInitialChunkShardShardRecord,
  createTypeTypeSchema,
  createRecord,
  createRecordList,
}
