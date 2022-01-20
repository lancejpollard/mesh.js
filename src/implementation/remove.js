
const CONFIG = require('./config')
const {
  PROPERTY_TABLE_CREATOR,
} = require('./create')

async function revokeCenter(knex) {
  await knex.schema.dropTableIfExists(CONFIG.TABLE.CHUNK_SHARD_SHARD)
  await knex.schema.dropTableIfExists(CONFIG.TABLE.CHUNK_SHARD)
}

async function revokeEachPropertyTable(knex) {
  for (const name in PROPERTY_TABLE_CREATOR) {
    await knex.schema.dropTableIfExists(`weave_${name}`)
  }
}

module.exports = {
  revokeCenter,
  revokeEachPropertyTable,
}
