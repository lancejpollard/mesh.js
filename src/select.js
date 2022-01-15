
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
  for (const typeName in query) {
    const typeConfig = query[typeName]
  }
}

module.exports = {
  selectType,
  selectFromRecordTable,
}
