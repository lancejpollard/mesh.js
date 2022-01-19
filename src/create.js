
const CONFIG = require('./config')
const { reserve: reserveIdList, resolve } = require('./id')
const {
  getRandomBetween: getRandomBigIntegerBetween,
} = require('./biginteger')

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

  await createObjectRecord(knex, {
    organizationId,
    typeId,
    objectId: typeId,
    debug: `type:type`
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

  await createObjectRecord(knex, {
    organizationId,
    typeId,
    objectId: propertyTypeId,
    debug: `type:property`
  })

  CONFIG.UPDATE_SCHEMA({
    type_property: {
      id: propertyTypeId,
      chunkId: propertyChunkId
    }
  })

  let { chunk_id: propertyTypeChunkId } = await createInitialChunkShardRecord(knex, {
    organizationId,
    typeId: propertyTypeTypeId,
    idSalt: propertyTypeSalt
  })

  await createObjectRecord(knex, {
    organizationId,
    typeId,
    objectId: propertyTypeTypeId,
    debug: `type:property_type`
  })

  CONFIG.UPDATE_SCHEMA({
    type_property_type: {
      id: propertyTypeTypeId,
      chunkId: propertyTypeChunkId
    }
  })

  let { chunk_id: organizationChunkId } = await createInitialChunkShardRecord(knex, {
    organizationId,
    typeId: organizationTypeId,
  })

  await createObjectRecord(knex, {
    organizationId,
    typeId,
    objectId: organizationTypeId,
    debug: `type:organization`
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
      let newTypeId = resolve(typeIndex++, typeSalt, 4)
      let { chunk_id: chunkId } = await createInitialChunkShardRecord(knex, {
        organizationId,
        typeId: newTypeId,
      })

      await createObjectRecord(knex, {
        organizationId,
        typeId,
        objectId: newTypeId,
        debug: `type:${type}`
      })

      CONFIG.UPDATE_SCHEMA({
        [type]: {
          id: newTypeId,
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

      await createObjectRecord(knex, {
        organizationId,
        typeId: CONFIG.getIdForType('type_property'),
        objectId: propertyObjectId,
        debug: `type_property:${propertyName}`
      })
    }
  }

  for (let type in CONFIG.SCHEMA) {
    const typeDef = CONFIG.SCHEMA[type]
    for (let propertyName in typeDef.properties) {
      const propertyDef = typeDef.properties[propertyName]

      // property belongs to type
      await createAssociationRecord(knex, {
        organizationId: CONFIG.DEFAULT_ORGANIZATION_ID,
        typeId: CONFIG.getIdForType('type_property'),
        objectId: propertyDef.id,
        propertyId: CONFIG.getIdForProperty('type_property', 'type'),
        valueOrganizationId: CONFIG.DEFAULT_ORGANIZATION_ID,
        valueTypeId: CONFIG.getIdForType('type'),
        valueObjectId: typeDef.id,
        debug: `type_property:${propertyName}:type:${type}`,
      })

      // create property.name
      await createStringValue(knex, {
        organizationId: CONFIG.DEFAULT_ORGANIZATION_ID,
        typeId: CONFIG.getIdForType('type_property'),
        objectId: propertyDef.id,
        propertyId: CONFIG.getIdForProperty('type_property', 'name'),
        value: propertyName,
        debug: `type_property:name:${propertyName}`,
      })

      // create property.isList
      await createBooleanValue(knex, {
        organizationId: CONFIG.DEFAULT_ORGANIZATION_ID,
        typeId: CONFIG.getIdForType('type_property'),
        objectId: propertyDef.id,
        propertyId: CONFIG.getIdForProperty('type_property', 'is_list'),
        value: !!propertyDef.isList,
        debug: `type_property:is_list:${!!propertyDef.isList}`,
      })

      // property type
      for (let propertyTypeName in propertyDef.type) {
        const propertyTypeDef = propertyDef.type[propertyTypeName]

        // propertyType record
        const [propertyTypeObjectId] = await reserveIdList(knex, {
          organizationId: CONFIG.DEFAULT_ORGANIZATION_ID,
          typeId: CONFIG.getIdForType('type_property_type'),
        })

        propertyTypeDef.id = propertyTypeObjectId

        await createObjectRecord(knex, {
          organizationId,
          typeId: CONFIG.getIdForType('type_property_type'),
          objectId: propertyTypeObjectId,
          debug: `type_property_type:${propertyName}:${propertyTypeName}`
        })

        // propertyType belongs to property
        await createAssociationRecord(knex, {
          organizationId: CONFIG.DEFAULT_ORGANIZATION_ID,
          typeId: CONFIG.getIdForType('type_property_type'),
          objectId: propertyTypeObjectId,
          propertyId: CONFIG.getIdForProperty('type_property_type', 'property'),
          valueOrganizationId: CONFIG.DEFAULT_ORGANIZATION_ID,
          valueTypeId: CONFIG.getIdForType('type_property'),
          valueObjectId: propertyDef.id,
        })

        // create propertyType.name
        await createStringValue(knex, {
          organizationId: CONFIG.DEFAULT_ORGANIZATION_ID,
          typeId: CONFIG.getIdForType('type_property_type'),
          objectId: propertyTypeObjectId,
          propertyId: CONFIG.getIdForProperty('type_property_type', 'name'),
          value: propertyTypeName,
        })
      }
    }

    CONFIG.UPDATE_SCHEMA({
      [type]: typeDef
    })
  }
}

/**
 * This is the first record in the tree/graph of records.
 *
 * The most generic thing of all.
 */

async function createTypeTypeSchema(knex) {
  await createEachInitialChunkShardRecord(knex)
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
