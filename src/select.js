
const _ = require('lodash')
const CONFIG = require('./config')

async function selectType(knex, { name }) {
  const { type } = await selectRecord(knex, {
    type: {
      single: true,
      filter: {
        name
      },
      select: {
        name: true,
        properties: {
          select: {
            name: true,
            propertyTypes: {
              select: {
                name: true
              }
            }
          }
        }
      }
    }
  })
}

async function selectFromRecordTable(knex, query) {
  // for (const typeName in query) {
  //   const typeConfig = query[typeName]
  //   await
  // }
}

async function selectEveryTypeRecord(knex, { organizationId, typeId }) {
  const listAttachment = await knex(CONFIG.TABLE.ATTACHMENT)
    .select('*')
    .where('object_organization_id', organizationId)
    .where('object_type_id', typeId)
  const listString = await knex(CONFIG.TABLE.STRING)
    .select('*')
    .where('object_organization_id', organizationId)
    .where('object_type_id', typeId)
  const listText = await knex(CONFIG.TABLE.TEXT)
    .select('*')
    .where('object_organization_id', organizationId)
    .where('object_type_id', typeId)
  const listDecimal = await knex(CONFIG.TABLE.DECIMAL)
    .select('*')
    .where('object_organization_id', organizationId)
    .where('object_type_id', typeId)
  const listInteger = await knex(CONFIG.TABLE.INTEGER)
    .select('*')
    .where('object_organization_id', organizationId)
    .where('object_type_id', typeId)
  const listBoolean = await knex(CONFIG.TABLE.BOOLEAN)
    .select('*')
    .where('object_organization_id', organizationId)
    .where('object_type_id', typeId)
  const listTimestamp = await knex(CONFIG.TABLE.TIMESTAMP)
    .select('*')
    .where('object_organization_id', organizationId)
    .where('object_type_id', typeId)
  const listProperty = await knex(CONFIG.TABLE.PROPERTY)
    .select('*')
    .where('object_organization_id', organizationId)
    .where('object_type_id', typeId)
  const listObject = await knex(CONFIG.TABLE.ASSOCIATION)
    .select('*')
    .where('object_organization_id', organizationId)
    .where('object_type_id', typeId)

  return listAttachment.map(x => ({ type: 'attachment', ...x }))
    .concat(listString.map(x => ({ type: 'string', ...x })))
    .concat(listText.map(x => ({ type: 'text', ...x })))
    .concat(listDecimal.map(x => ({ type: 'decimal', ...x })))
    .concat(listInteger.map(x => ({ type: 'integer', ...x })))
    .concat(listBoolean.map(x => ({ type: 'boolean', ...x })))
    .concat(listTimestamp.map(x => ({ type: 'timestamp', ...x })))
    .concat(listProperty.map(x => ({ type: 'property', ...x })))
    .concat(listObject.map(x => ({ type: 'object', ...x })))
}

async function selectEveryType(knex) {
  const typeList = await knex(CONFIG.TABLE.OBJECT)
    .select('*')
    .where('object_organization_id', CONFIG.DEFAULT_ORGANIZATION_ID)
    .where('object_type_id', CONFIG.getIdForType('type'))

  const typeMap = typeList.reduce((m, x) => {
    const org = m[x.object_organization_id] = m[x.object_organization_id] ?? {}
    const typeName = CONFIG.getNameForType(x.object_id)
    const type = org[typeName] = org[typeName] ?? { properties: {} }
    return m
  }, {})

  const propertyList = await selectEveryTypeRecord(knex, {
    organizationId: CONFIG.DEFAULT_ORGANIZATION_ID,
    typeId: CONFIG.getIdForType('type_property'),
  })

  // const propertyTypeList = await selectEveryTypeRecord(knex, {
  //   organizationId: CONFIG.DEFAULT_ORGANIZATION_ID,
  //   typeId: CONFIG.getIdForType('type_property_type'),
  // })

  // const propertyTypeMap = typeList.reduce((m, x) => {
  //   const org = m[x.object_organization_id] = m[x.object_organization_id] ?? {}
  //   const typeName = CONFIG.getNameForType(x.object_id)
  //   const type = org[typeName] = org[typeName] ?? { properties: {} }
  //   return m
  // }, {})

  const propertyMap = {}

  propertyList.forEach(x => {
    const org = propertyMap[x.object_organization_id] = propertyMap[x.object_organization_id] ?? {}
    const typeName = CONFIG.getNameForType(x.object_type_id)
    const type = org[typeName] = org[typeName] ?? {}
    const obj = type[x.object_id] = type[x.object_id] ?? {}
    const propertyName = CONFIG.getNameForProperty(x.object_type_id, x.object_property_id)
    let value
    switch (x.type) {
      case 'attachment':
        value = {
          bucket_id: x.bucket_id
        }
        break
      case 'string':
      case 'text':
      case 'decimal':
      case 'integer':
      case 'boolean':
      case 'timestamp':
        value = x.value
        break
      case 'property':
        value = {
          value_organization_id: x.value_organization_id,
          value_type_id: x.value_type_id,
          value_object_id: x.value_object_id,
          value_property_id: x.value_property_id,
        }
        break
      case 'object':
        value = {
          value_organization_id: x.value_organization_id,
          value_type_id: x.value_type_id,
          value_object_id: x.value_object_id,
        }
        break
    }
    const prop = obj[propertyName] = obj[propertyName] ?? value
  })

  Object.keys(propertyMap).forEach(orgId => {
    const org = propertyMap[orgId]
    Object.keys(org).forEach(firstTypeName => {
      const collection = org[firstTypeName]
      Object.keys(collection).forEach(propertyId => {
        const property = collection[propertyId]
        const typeName = CONFIG.getNameForType(property.type.value_object_id)
        const typeOrgId = property.type.value_organization_id
        const typeOrg = typeMap[typeOrgId] = typeMap[typeOrgId] ?? {}
        const type = typeOrg[typeName] = typeOrg[typeName] ?? { properties: {} }
        const typeProperty = type.properties[property.name] = {}
        Object.keys(_.omit(property, ['type', 'name'])).forEach(key => {
          typeProperty[key] = property[key]
        })
      })
    })
  })

  // console.log(JSON.stringify(typeMap, null, 2))

  // return typeMap
}

module.exports = {
  selectType,
  selectFromRecordTable,
  selectEveryType,
}
