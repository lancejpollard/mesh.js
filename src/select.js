
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
  const typeList = await knex('mesh_string')
    .select('*')
    .where({
      object_organization_id: 0,
      object_type_id: 0,
    })

  const propertyList = await knex('mesh_string')
    .select('*')
    .where('object_organization_id', 0)
    .whereIn('object_type_id', typeList.map(type => type.object_id))
    // .reduce()

  console.log(propertyList)

  return typeList.reduce((m, x) => {
    const type = m[x.object_type_id] = m[x.object_type_id] ?? {}
    const obj = type[x.object_id] = type[x.object_id] ?? {}
    if (x.object_property_id === 0) {
      obj.name = x.value
    }
    return m
  }, {})
}

module.exports = {
  selectType,
  selectFromRecordTable,
  selectEveryType,
}
