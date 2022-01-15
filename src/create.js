
const CONFIG = require('./config')
const reserveIdList = require('./id')
const {
  getRandomBetween: getRandomBigIntegerBetween,
} = require('./biginteger')

const PROPERTY_TABLE_CREATOR = {
  attachment: createAttachmentValueTable,
  string: createStringValueTable,
  text: createTextValueTable,
  decimal: createDecimalValueTable,
  integer: createIntegerValueTable,
  boolean: createBooleanValueTable,
  timestamp: createTimestampValueTable,
  property_binding: createPropertyBindingTable,
  object_binding: createObjectBindingTable,
}

const PROPERTY_RECORD_CREATOR = {
  attachment: createAttachmentValueRecord,
  string: createStringValueRecord,
  text: createTextValueRecord,
  decimal: createDecimalValueRecord,
  integer: createIntegerValueRecord,
  boolean: createBooleanValueRecord,
  timestamp: createTimestampValueRecord,
  property_binding: createPropertyBindingRecord,
  object_binding: createObjectBindingRecord,
}

const TYPE_ID = {
  type: 0,
  property: 1,
}

const PROPERTY_ID = {
  type: {
    name: 0,
    properties: 1,
  },
  property: {
    name: 2,
    propertyTypes: 3,
    isList: 4,
    defaultValue: 5,
    title: 6,
    description: 7,
    examples: 8,
  }
}

/**
 * The global first thing that is encountered.
 */

async function createChunkShardShardTable(knex) {
  await knex.schema.createTable(CONFIG.CHUNK_SHARD_SHARD_TABLE_NAME, t => {
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
  await knex.schema.createTable(CONFIG.CHUNK_SHARD_TABLE_NAME, t => {
    t.biginteger('organization_id').notNull()
    t.integer('type_id').notNull()
    t.biginteger('chunk_id').notNull().defaultTo(0)
    t.string('shard_url')
    t.integer('id_size').defaultTo(8).notNull()
    t.boolean('current').defaultTo(true).notNull()
    t.biginteger('last_index').defaultTo(0).notNull()
    t.biginteger('id_salt').defaultTo(0).notNull()
  })
}

async function createChunkShardRecord(knex, {
  organizationId,
  typeId,
  chunkId = 0,
  shardUrl = null,
  idSalt,
  idSize = 8
}) {
  const salt = String(
    isNaN(idSalt)
      ? getRandomBigIntegerBetween(1n, 9223372036854775807n)
      : idSalt
  )

  await knex(CONFIG.CHUNK_SHARD_TABLE_NAME)
    .insert({
      organization_id: organizationId,
      type_id: typeId,
      chunk_id: chunkId,
      shard_url: shardUrl,
      id_salt: salt,
      id_size: idSize,
    })
}

/**
 * Point us to the chunk.
 */

async function createInitialChunkShardShardRecord(knex) {
  return await knex(CONFIG.CHUNK_SHARD_SHARD_TABLE_NAME)
    .insert({})
    .returning('*')
}

/**
 * Create main app organization.
 */

async function createInitialOrganizationRecord(knex) {

}

/**
 * This is the first record in the tree/graph of records.
 *
 * The most generic thing of all.
 */

async function createTypeTypeRecord(knex) {
  // create type id
  await createChunkShardRecord(knex, {
    organizationId: 0,
    typeId: TYPE_ID.type,
    idSalt: 0,
  })

  const [typeObjectId] = await reserveIdList(knex, {
    organizationId: 0, // main app organization
    typeId: TYPE_ID.type // type: 'type'
  })

  // create type type.name
  await createStringValueRecord(knex, {
    organizationId: 0,
    typeId: 0,
    objectId: typeObjectId,
    propertyId: PROPERTY_ID.property.name, // name property on type
    value: 'type'
  })

  // create property id
  await createChunkShardRecord(knex, {
    organizationId: 0,
    typeId: TYPE_ID.property,
    idSalt: 0,
  })

  const [propertyObjectId] = await reserveIdList(knex, {
    organizationId: 0, // main app organization
    typeId: TYPE_ID.type // type: 'type'
  })

  // create type type.name
  await createStringValueRecord(knex, {
    organizationId: 0,
    typeId: 0,
    objectId: propertyObjectId,
    propertyId: PROPERTY_ID.property.name, // name property on type
    value: 'property'
  })

  // create type properties
  await createEachTypePropertyRecord(knex, {
    objectId: TYPE_ID.type,
    properties: [
      {
        name: 'name',
        propertyTypes: ['string'],
      },
      {
        name: 'slug',
        propertyTypes: ['string'],
      },
      {
        name: 'properties',
        propertyTypes: ['property'],
        isList: true
      }
    ]
  })

  // create property properties
  await createEachTypePropertyRecord(knex, {
    objectId: TYPE_ID.property,
    properties: [
      {
        name: 'name',
        propertyTypes: ['string'],
      },
      {
        name: 'slug',
        propertyTypes: ['string'],
      },
      {
        name: 'propertyTypes',
        propertyTypes: ['type'],
        isList: true
      },
      {
        name: 'isList',
        propertyTypes: ['boolean'],
      }
    ]
  })
}

async function createTypeAgentRecord(knex) {
  await createType(knex, {
    name: 'agent',
    properties: [

    ]
  })
}

/**
 * Create organization.
 *
 * - slug
 * - title
 * - image
 * - logo
 */

async function createTypeOrganizationRecord(knex) {
  await createType(knex, {
    name: 'organization',
    properties: [
      {
        name: 'slug',
        propertyTypes: ['string'],
      },
      {
        name: 'title',
        propertyTypes: ['text'],
      },
      {
        name: 'image',
        propertyTypes: ['object_binding'],
      },
    ]
  })
}

async function createPropertyRecord(knex) {
  const create = PROPERTY_RECORD_CREATOR[type]
  await create(knex, { value })
}

async function createAttachmentValueTable(knex) {
  await knex.schema.createTable('mesh_attachment', t => {
    t.biginteger('object_organization_id')
    t.integer('object_type_id')
    t.integer('object_id')
    t.integer('object_property_id')
    t.integer('bucket_id')
    t.string('value_hash')
    t.index(['object_organization_id', 'object_type_id'])
    t.index(['object_organization_id', 'object_type_id', 'object_id'])
  })
}

async function createAttachmentValueRecord(knex, {
  organizationId,
  typeId,
  objectId,
  propertyId,
  bucketId,
  valueHash,
}) {
  await knex('mesh_attachment')
    .insert({
      object_organization_id: organizationId,
      object_type_id: typeId,
      object_id: objectId,
      object_property_id: propertyId,
      bucket_id: bucketId,
      value_hash: valueHash,
    })
}

async function createStringValueTable(knex) {
  await knex.schema.createTable('mesh_string', t => {
    t.biginteger('object_organization_id')
    t.integer('object_type_id')
    t.integer('object_id')
    t.integer('object_property_id')
    t.string('value')
    t.index(['object_organization_id', 'object_type_id'])
    t.index(['object_organization_id', 'object_type_id', 'object_id'])
  })
}

async function createStringValueRecord(knex, {
  organizationId,
  typeId,
  objectId,
  propertyId,
  value
}) {
  await knex('mesh_string')
    .insert({
      object_organization_id: organizationId,
      object_type_id: typeId,
      object_id: objectId,
      object_property_id: propertyId,
      value
    })
}

async function createTextValueTable(knex) {
  await knex.schema.createTable('mesh_text', t => {
    t.biginteger('object_organization_id')
    t.integer('object_type_id')
    t.integer('object_id')
    t.integer('object_property_id')
    t.text('value')
    t.index(['object_organization_id', 'object_type_id'])
    t.index(['object_organization_id', 'object_type_id', 'object_id'])
  })
}

async function createTextValueRecord(knex, {
  organizationId,
  typeId,
  objectId,
  propertyId,
  value
}) {
  await knex('mesh_text')
    .insert({
      object_organization_id: organizationId,
      object_type_id: typeId,
      object_id: objectId,
      object_property_id: propertyId,
      value
    })

}

async function createDecimalValueTable(knex) {
  await knex.schema.createTable('mesh_decimal', t => {
    t.biginteger('object_organization_id')
    t.integer('object_type_id')
    t.integer('object_id')
    t.integer('object_property_id')
    t.decimal('value', null)
    t.index(['object_organization_id', 'object_type_id'])
    t.index(['object_organization_id', 'object_type_id', 'object_id'])
  })
}

async function createDecimalValueRecord(knex, {
  organizationId,
  typeId,
  objectId,
  propertyId,
  value
}) {
  await knex('mesh_decimal')
    .insert({
      object_organization_id: organizationId,
      object_type_id: typeId,
      object_id: objectId,
      object_property_id: propertyId,
      value
    })

}

async function createIntegerValueTable(knex) {
  await knex.schema.createTable('mesh_integer', t => {
    t.biginteger('object_organization_id')
    t.integer('object_type_id')
    t.integer('object_id')
    t.integer('object_property_id')
    t.integer('value')
    t.index(['object_organization_id', 'object_type_id'])
    t.index(['object_organization_id', 'object_type_id', 'object_id'])
  })
}

async function createIntegerValueRecord(knex, {
  organizationId,
  typeId,
  objectId,
  propertyId,
  value
}) {
  await knex('mesh_integer')
    .insert({
      object_organization_id: organizationId,
      object_type_id: typeId,
      object_id: objectId,
      object_property_id: propertyId,
      value
    })
}

async function createBooleanValueTable(knex) {
  await knex.schema.createTable('mesh_boolean', t => {
    t.biginteger('object_organization_id')
    t.integer('object_type_id')
    t.integer('object_id')
    t.integer('object_property_id')
    t.boolean('value')
    t.index(['object_organization_id', 'object_type_id'])
    t.index(['object_organization_id', 'object_type_id', 'object_id'])
  })
}

async function createBooleanValueRecord(knex, {
  organizationId,
  typeId,
  objectId,
  propertyId,
  value
}) {
  await knex('mesh_boolean')
    .insert({
      object_organization_id: organizationId,
      object_type_id: typeId,
      object_id: objectId,
      object_property_id: propertyId,
      value
    })
}

async function createTimestampValueTable(knex) {
  await knex.schema.createTable('mesh_timestamp', t => {
    t.biginteger('object_organization_id')
    t.integer('object_type_id')
    t.integer('object_id')
    t.integer('object_property_id')
    t.timestamp('value')
    t.index(['object_organization_id', 'object_type_id'])
    t.index(['object_organization_id', 'object_type_id', 'object_id'])
  })
}

async function createTimestampValueRecord(knex, {
  organizationId,
  typeId,
  objectId,
  propertyId,
  value
}) {
  await knex('mesh_timestamp')
    .insert({
      object_organization_id: organizationId,
      object_type_id: typeId,
      object_id: objectId,
      object_property_id: propertyId,
      value
    })
}

async function createPropertyBindingTable(knex) {
  await knex.schema.createTable('mesh_property_binding', t => {
    t.biginteger('object_organization_id')
    t.integer('object_type_id')
    t.integer('object_id')
    t.integer('object_property_id')
    t.biginteger('value_organization_id')
    t.integer('value_type_id')
    t.integer('value_object_id')
    t.integer('value_property_id')
    t.index(['object_organization_id', 'object_type_id'])
    t.index(['object_organization_id', 'object_type_id', 'object_id'])
  })
}

async function createPropertyBindingRecord(knex, {
  organizationId,
  typeId,
  objectId,
  propertyId,
  valueOrganizationId,
  valueTypeId,
  valueId,
  valuePropertyId,
}) {
  await knex('mesh_property_binding')
    .insert({
      object_organization_id: organizationId,
      object_type_id: typeId,
      object_id: objectId,
      object_property_id: propertyId,
      value_organization_id: valueOrganizationId,
      value_type_id: valueTypeId,
      value_id: valueId,
      value_property_id: valuePropertyId,
    })
}

async function createObjectBindingTable(knex) {
  await knex.schema.createTable('mesh_object_binding', t => {
    t.biginteger('object_organization_id')
    t.integer('object_type_id')
    t.integer('object_id')
    t.integer('object_property_id')
    t.biginteger('value_organization_id')
    t.integer('value_type_id')
    t.integer('value_object_id')
    t.index(['object_organization_id', 'object_type_id'])
    t.index(['object_organization_id', 'object_type_id', 'object_id'])
  })
}

async function createObjectBindingRecord(knex, {
  organizationId,
  typeId,
  objectId,
  propertyId,
  valueOrganizationId,
  valueTypeId,
  valueId,
}) {
  await knex('mesh_object_binding')
    .insert({
      object_organization_id: organizationId,
      object_type_id: typeId,
      object_id: objectId,
      object_property_id: propertyId,
      value_organization_id: valueOrganizationId,
      value_type_id: valueTypeId,
      value_id: valueId,
    })
}

async function createType(knex, { name, properties = [] }) {
  const [objectId] = await reserveIdList(knex, {
    organizationId: 0, // main app organization
    typeId: TYPE_ID.type // type: 'type'
  })

  await createChunkShardRecord(knex, {
    organizationId: 0,
    typeId: objectId,
  })

  // create type.name
  await createStringValueRecord(knex, {
    organizationId: 0,
    typeId: 0,
    objectId,
    propertyId: PROPERTY_ID.property.name, // name property on type
    value: name
  })

  // create type.properties
  await createEachTypePropertyRecord(knex, { objectId, properties })

  // create type.title
  // create type.description
}

async function createEachTypePropertyRecord(knex, {
  objectId,
  properties
}) {
  for (let i = 0, n = properties.length; i < n; i++) {
    const propertyAttributeSet = properties[i]
    await createTypePropertyRecord(knex, {
      typeId: objectId,
      ...propertyAttributeSet
    })
  }
}

async function createTypePropertyRecord(knex, {
  typeId,
  name,
  propertyTypes = [],
  isList = false,
  defaultValue,
  title,
  description,
  examples,
}) {
  const [objectId] = await reserveIdList(knex, {
    organizationId: 0, // main app organization
    typeId: TYPE_ID.property // type: 'type'
  })

  // create property.name
  await createStringValueRecord(knex, {
    organizationId: 0,
    typeId: TYPE_ID.property,
    objectId,
    propertyId: PROPERTY_ID.type.name,
    value: name,
  })

  // create property.propertyTypes
  // for each property type
  for (let i = 0, n = propertyTypes.length; i < n; i++) {
    let propertyType = propertyTypes[i]
  }

  // create property.isList
  await createBooleanValueRecord(knex, {
    organizationId: 0,
    typeId: TYPE_ID.type,
    objectId,
    propertyId: PROPERTY_ID.type.isList,
    value: isList,
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
  createTypeTypeRecord,
  createTypeOrganizationRecord,
  createRecord,
  createRecordList,
}
