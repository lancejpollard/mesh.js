
const CONFIG = require('./config')

const SELECT_FOR_UPDATE = `
SELECT last_index
FROM ${CONFIG.CHUNK_SHARD_TABLE_NAME}
WHERE organization_id = :organizationId:
  AND type_id = :typeId:
LIMIT 1
FOR UPDATE;
`

const UPDATE = `
UPDATE ${CONFIG.CHUNK_SHARD_TABLE_NAME}
SET last_index = :lastIndex:
WHERE organization_id = :organizationId:
  AND type_id = :typeId:;
`

async function reserve(knex, { count = 1n, organizationId, typeId }) {
  const result = await knex.raw(SELECT_FOR_UPDATE, {
    organizationId,
    typeId
  })

  console.log(result)

  const record = result.rows[0]
  const lastId = BigInt(record.last_index)
  const nextId = lastId + count

  await knex.raw(UPDATE, {
    organizationId,
    typeId,
    lastIndex: String(nextId)
  })

  return nextId
}

module.exports = reserve
