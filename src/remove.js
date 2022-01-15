
const CONFIG = require('./config')
const {
  PROPERTY_TABLE_CREATOR,
} = require('./create')

async function revokeCenter(knex) {
  await knex.schema.dropTableIfExists(CONFIG.CHUNK_SHARD_SHARD_TABLE_NAME)
  await knex.schema.dropTableIfExists(CONFIG.CHUNK_SHARD_TABLE_NAME)
}

async function revokeEachPropertyTable(knex) {
  for (const name in PROPERTY_TABLE_CREATOR) {
    await knex.schema.dropTableIfExists(`mesh_${name}`)
  }
}

module.exports = {
  revokeCenter,
  revokeEachPropertyTable,
}
