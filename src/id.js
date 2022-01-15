
const SELECT_FOR_UPDATE = `
SELECT last_id
FROM object_id
WHERE organization_id = $1
  AND type_id = $2
LIMIT 1
FOR UPDATE;
`

const UPDATE = `
UPDATE object_id
SET last_id = $3
WHERE organization_id = $1
  AND type_id = $2;
`

async function select(knex, { count = 1n, organizationId, typeId }) {
  const result = await knex.query({
    text: SELECT_FOR_UPDATE,
    values: [ organizationId, typeId ]
  })

  const record = result.rows[0]
  const lastId = BigInt(record.last_id)
  const nextId = lastId + count

  await knex.query({
    text: UPDATE,
    values: [ organizationId, typeId, String(nextId) ]
  })

  return lastId
}
