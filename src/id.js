
const permute = require('@lancejpollard/configured-quadratic-residue-prng.js')
const CONFIG = require('./config')

const SELECT_FOR_UPDATE = `
SELECT last_index, id_salt, id_size
FROM ${CONFIG.TABLE.CHUNK_SHARD}
WHERE organization_id = :organizationId:
  AND type_id = :typeId:
LIMIT 1
FOR UPDATE;
`

const OFFSET = {
  16: -2147483648n,
  32: -9223372036854775808n
}

function resolve(i, salt, size) {
  const fullSize = size * 4
  const value = permute(i, salt, fullSize)
  return value + OFFSET[fullSize]
}

async function reserve(knex, { count = 1n, organizationId, typeId }) {
  const result = await knex.raw(SELECT_FOR_UPDATE, {
    organizationId: knex.raw(organizationId),
    typeId: knex.raw(typeId)
  })

  const record = result.rows[0]
  const lastId = BigInt(record.last_index)
  const idSalt = BigInt(record.id_salt)
  const nextId = lastId + count
  const idSize = record.id_size * 4

  await knex(CONFIG.TABLE.CHUNK_SHARD)
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
    const value = usePermutation
      ? permute(baseId, idSalt, idSize)
      : baseId
    array[i] = value + OFFSET[idSize]
    i++
  }

  return array
}

module.exports = {
  reserve,
  resolve,
}
