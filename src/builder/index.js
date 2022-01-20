
const { reserve: reserveIdList, resolve } = require('../id')
const Transaction = require('../transaction')
const {
  getRandomBetween: getRandomBigIntegerBetween,
} = require('../utility/biginteger')

function initialize(t) {
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

function assessTree(t) {

}

function selectTree(t) {

}

function createTree(t) {
  resolvePolicies(t)
}

function createList(t) {

}

function updateTree(t) {

}

function updateList(t) {

}

function getRandomSalt() {
  return getRandomBigIntegerBetween(1000000000000n, 9223372036854775807n)
}

module.exports = {
  initialize
}
