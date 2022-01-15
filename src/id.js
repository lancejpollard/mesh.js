
const permute = require('@lancejpollard/configured-quadratic-residue-prng.js')
const CONFIG = require('./config')

const SELECT_FOR_UPDATE = `
SELECT last_index, id_salt, id_size
FROM ${CONFIG.CHUNK_SHARD_TABLE_NAME}
WHERE organization_id = :organizationId:
  AND type_id = :typeId:
LIMIT 1
FOR UPDATE;
`

async function reserve(knex, { count = 1n, organizationId, typeId }) {
  const result = await knex.raw(SELECT_FOR_UPDATE, {
    organizationId,
    typeId
  })

  const record = result.rows[0]
  const lastId = BigInt(record.last_index)
  const idSalt = BigInt(record.id_salt)
  const nextId = lastId + count
  const idSize = record.id_size * 4

  await knex(CONFIG.CHUNK_SHARD_TABLE_NAME)
    .update({
      last_index: nextId
    })
    .where({
      organization_id: organizationId,
      type_id: typeId,
    })

  const diff = Number(nextId - lastId)
  const array = new Array(diff)
  const usePermutation = idSalt !== 0n

  let i = 0n
  while (i < diff) {
    const baseId = lastId + i
    array[i] = usePermutation
      ? permute(baseId, idSalt, idSize)
      : baseId
    i++
  }

  return array
}

module.exports = reserve
