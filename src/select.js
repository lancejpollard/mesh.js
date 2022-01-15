
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

async function selectEveryType(knex) {
  // const typeList = await knex('mesh_string')
  //   .select(['object_id', 'object_property_id', 'value'])
  //   .where({
  //     object_organization_id: CONFIG.DEFAULT_ORGANIZATION_ID,
  //     object_type_id: 0,
  //   })

  // type_id = property type
  // object_id = property instance id
  const propertyTypeStringList = await knex('mesh_string')
    .select([
      'object_organization_id',
      'object_type_id',
      'object_id',
      'object_property_id',
      'value'
    ])
    .where('object_organization_id', CONFIG.DEFAULT_ORGANIZATION_ID)
    .where('object_type_id', CONFIG.TYPE_ID.property)

  const propertyTypeBindingList = await knex('mesh_object_binding')
    .select([
      'object_organization_id',
      'object_type_id',
      'object_id',
      'object_property_id',
      'value_organization_id',
      'value_type_id',
      'value_object_id',
    ])
    .where('object_organization_id', CONFIG.DEFAULT_ORGANIZATION_ID)
    .where('object_type_id', CONFIG.TYPE_ID.property)

  const propertyTypeBooleanList = await knex('mesh_boolean')
    .select([
      'object_organization_id',
      'object_type_id',
      'object_id',
      'object_property_id',
      'value'
    ])
    .where('object_organization_id', CONFIG.DEFAULT_ORGANIZATION_ID)
    .where('object_type_id', CONFIG.TYPE_ID.property)

  const propertyMap = propertyTypeStringList
    .reduce((m, x) => {
      const prime = `${x.object_organization_id}:${x.object_type_id}:${x.object_id}`
      const property = m[prime] = m[prime] ?? {}
      // such as "property.name = 'foo'"
      const name = CONFIG.PROPERTY_NAME.property[x.object_property_id]
      property[name] = x.value
      return m
    }, {})

  propertyTypeBooleanList.forEach(x => {
    const prime = `${x.object_organization_id}:${x.object_type_id}:${x.object_id}`
    const property = propertyMap[prime]
    const name = CONFIG.PROPERTY_NAME.property[x.object_property_id]
    property[name] = x.value
  })

  console.log(propertyTypeBooleanList)

  const typeMap = propertyTypeBindingList
    .reduce((m, x) => {
      const propertyPrime = `${x.object_organization_id}:${x.object_type_id}:${x.object_id}`
      const property = propertyMap[propertyPrime]
      const typePrime = `${x.value_organization_id}:${x.value_type_id}:${x.value_object_id}`
      const type = m[typePrime] = m[typePrime] ?? { properties: [] }
      type.properties.push(property)
      return m
    }, {})

  console.log(JSON.stringify(typeMap))
  return typeMap
}

module.exports = {
  selectType,
  selectFromRecordTable,
  selectEveryType,
}
