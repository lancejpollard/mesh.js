
const CONFIG = require('./config')
const { reserve: reserveIdList, resolve } = require('./id')
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
    t.biginteger('chunk_id_salt').notNull().defaultTo(0)
    t.biginteger('chunk_id').notNull().defaultTo(0)
    t.string('shard_url')
    t.integer('id_size').defaultTo(8).notNull()
    t.boolean('current').defaultTo(true).notNull()
    t.biginteger('last_index').defaultTo(0).notNull()
    t.biginteger('id_salt').defaultTo(0).notNull()
  })
}

function getRandomSalt() {
  return getRandomBigIntegerBetween(1000000000000n, 9223372036854775807n)
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

  const [ record ] = await knex(CONFIG.CHUNK_SHARD_TABLE_NAME)
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
  return await knex(CONFIG.CHUNK_SHARD_SHARD_TABLE_NAME)
    .insert({})
    .returning('*')
}

/**
 * Create main app organization.
 */

async function createInitialOrganizationRecord(knex) {

}

async function createEachInitialChunkShardRecord(knex) {
  const organizationSalt = getRandomSalt()
  const typeSalt = getRandomSalt()
  const propertySalt = getRandomSalt()
  const propertyTypeSalt = getRandomSalt()
  const organizationId = resolve(0n, organizationSalt, 8)

  const typeId = resolve(0n, typeSalt, 4)
  const propertyTypeId = resolve(1n, typeSalt, 4)
  const propertyTypeTypeId = resolve(2n, typeSalt, 4)
  const organizationTypeId = resolve(3n, typeSalt, 4)

  CONFIG.DEFAULT_ORGANIZATION_ID = organizationId

  // create type
  let { chunk_id: typeChunkId } = await createInitialChunkShardRecord(knex, {
    organizationId,
    typeId,
    idSalt: typeSalt,
  })

  CONFIG.UPDATE_SCHEMA({
    type: {
      id: typeId,
      chunkId: typeChunkId
    }
  })

  let { chunk_id: propertyChunkId } = await createInitialChunkShardRecord(knex, {
    organizationId,
    typeId: propertyTypeId,
    idSalt: propertySalt,
  })

  CONFIG.UPDATE_SCHEMA({
    property: {
      id: propertyTypeId,
      chunkId: propertyChunkId
    }
  })

  let { chunk_id: propertyTypeChunkId } = await createInitialChunkShardRecord(knex, {
    organizationId,
    typeId: propertyTypeTypeId,
    idSalt: propertyTypeSalt
  })

  CONFIG.UPDATE_SCHEMA({
    property_type: {
      id: propertyTypeTypeId,
      chunkId: propertyTypeChunkId
    }
  })

  let { chunk_id: organizationChunkId } = await createInitialChunkShardRecord(knex, {
    organizationId,
    typeId: organizationTypeId,
  })

  CONFIG.UPDATE_SCHEMA({
    organization: {
      id: organizationTypeId,
      chunkId: organizationChunkId
    }
  })

  let typeIndex = 4n

  for (let type in CONFIG.SCHEMA) {
    const typeDef = CONFIG.SCHEMA[type]
    if (typeDef.id == null) {
      let typeId = resolve(typeIndex++, typeSalt, 4)
      let { chunk_id: chunkId } = await createInitialChunkShardRecord(knex, {
        organizationId,
        typeId,
      })

      CONFIG.UPDATE_SCHEMA({
        [type]: {
          id: typeId,
          chunkId
        }
      })
    }
  }

  for (let type in CONFIG.SCHEMA) {
    const typeDef = CONFIG.SCHEMA[type]
    for (let propertyName in typeDef.properties) {
      const propertyDef = typeDef.properties[propertyName]

      // property record base
      const [propertyObjectId] = await reserveIdList(knex, {
        organizationId: CONFIG.DEFAULT_ORGANIZATION_ID,
        typeId: propertyTypeId
      })

      propertyDef.id = propertyObjectId
    }
  }

  for (let type in CONFIG.SCHEMA) {
    const typeDef = CONFIG.SCHEMA[type]
    for (let propertyName in typeDef.properties) {
      const propertyDef = typeDef.properties[propertyName]

      // property belongs to type
      await createObjectBindingRecord(knex, {
        organizationId: CONFIG.DEFAULT_ORGANIZATION_ID,
        typeId: CONFIG.getIdForType('property'),
        objectId: propertyDef.id,
        propertyId: CONFIG.getIdForProperty('property', 'type_id'),
        valueOrganizationId: CONFIG.DEFAULT_ORGANIZATION_ID,
        valueTypeId: CONFIG.getIdForType('type'),
        valueObjectId: typeDef.id,
      })

      // create property.name
      await createStringValueRecord(knex, {
        organizationId: CONFIG.DEFAULT_ORGANIZATION_ID,
        typeId: CONFIG.getIdForType('property'),
        objectId: propertyDef.id,
        propertyId: CONFIG.getIdForProperty('property', 'name'),
        value: propertyName,
      })

      // create property.isList
      await createBooleanValueRecord(knex, {
        organizationId: CONFIG.DEFAULT_ORGANIZATION_ID,
        typeId: CONFIG.getIdForType('property'),
        objectId: propertyDef.id,
        propertyId: CONFIG.getIdForProperty('property', 'is_list'),
        value: !!propertyDef.isList,
      })

      // property type
      for (let propertyTypeName in propertyDef.type) {
        const propertyTypeDef = propertyDef.type[propertyTypeName]

        // propertyType record
        const [propertyTypeObjectId] = await reserveIdList(knex, {
          organizationId: CONFIG.DEFAULT_ORGANIZATION_ID,
          typeId: CONFIG.getIdForType('property_type'),
        })

        // propertyType belongs to property
        await createObjectBindingRecord(knex, {
          organizationId: CONFIG.DEFAULT_ORGANIZATION_ID,
          typeId: CONFIG.getIdForType('property_type'),
          objectId: propertyTypeObjectId,
          propertyId: CONFIG.getIdForProperty('property_type', 'property_id'),
          valueOrganizationId: CONFIG.DEFAULT_ORGANIZATION_ID,
          valueTypeId: CONFIG.getIdForType('property'),
          valueObjectId: propertyDef.id,
        })

        propertyTypeDef.id = propertyTypeObjectId
      }
    }

    CONFIG.UPDATE_SCHEMA({
      [type]: typeDef
    })
  }
}

async function createTypeChunkShardRecord(knex) {
  // create type id record
  await createChunkShardRecord(knex, {
    organizationId: 0,
    typeId: 0,
    idSize: 4
  })

  // create property id record
  await createChunkShardRecord(knex, {
    organizationId: 0,
    typeId: 0,
    idSize: 4
  })

  const typeNames = Object.keys(CONFIG.TYPE_ID)

  const ids = await reserveIdList(knex, {
    organizationId: 0,
    typeId: 0,
    count: typeNames.length
  })

  typeNames.forEach((name, i) => {
    CONFIG.addType(name, ids[i])
  })
}

async function createTypeType(knex) {
  const [objectId] = await reserveIdList(knex, {
    organizationId: CONFIG.DEFAULT_ORGANIZATION_ID, // main app organization
    typeId: CONFIG.TYPE_ID.type // type: 'type'
  })

  // create type type.name
  await createStringValueRecord(knex, {
    organizationId: CONFIG.DEFAULT_ORGANIZATION_ID,
    typeId: 0,
    objectId,
    propertyId: CONFIG.PROPERTY_ID.property.name, // name property on type
    value: 'type'
  })
}

async function createTypeProperty(knex) {
  // create property id
  await createChunkShardRecord(knex, {
    organizationId: CONFIG.DEFAULT_ORGANIZATION_ID,
    typeId: CONFIG.TYPE_ID.property,
    idSize: 4,
    idSalt: 0,
  })

  const [objectId] = await reserveIdList(knex, {
    organizationId: CONFIG.DEFAULT_ORGANIZATION_ID, // main app organization
    typeId: CONFIG.TYPE_ID.type // type: 'type'
  })

  // create type property.name
  await createStringValueRecord(knex, {
    organizationId: CONFIG.DEFAULT_ORGANIZATION_ID,
    typeId: CONFIG.TYPE_ID.type,
    objectId,
    propertyId: CONFIG.PROPERTY_ID.property.name, // name property on type
    value: 'property'
  })
}

async function createTypePropertyType(knex) {
  // create propertyType id
  await createChunkShardRecord(knex, {
    organizationId: CONFIG.DEFAULT_ORGANIZATION_ID,
    typeId: CONFIG.TYPE_ID.propertyType,
    idSize: 4,
    idSalt: 0,
  })

  const [objectId] = await reserveIdList(knex, {
    organizationId: CONFIG.DEFAULT_ORGANIZATION_ID, // main app organization
    typeId: CONFIG.TYPE_ID.type // type: 'type'
  })

  // create property propertyType.name
  await createStringValueRecord(knex, {
    organizationId: CONFIG.DEFAULT_ORGANIZATION_ID,
    typeId: 0,
    objectId,
    propertyId: CONFIG.PROPERTY_ID.propertyType.name, // name property on type
    value: 'propertyType'
  })
}

/**
 * This is the first record in the tree/graph of records.
 *
 * The most generic thing of all.
 */

async function createTypeTypeSchema(knex) {
  await createEachInitialChunkShardRecord(knex)
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
    t.biginteger('object_organization_id').notNull()
    t.integer('object_type_id').notNull()
    t.integer('object_id').notNull()
    t.integer('object_property_id').notNull()
    t.biginteger('value_organization_id').notNull()
    t.integer('value_type_id').notNull()
    t.integer('value_object_id').notNull()
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
  valueObjectId,
}) {
  await knex('mesh_object_binding')
    .insert({
      object_organization_id: organizationId,
      object_type_id: typeId,
      object_id: objectId,
      object_property_id: propertyId,
      value_organization_id: valueOrganizationId,
      value_type_id: valueTypeId,
      value_object_id: valueObjectId,
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
