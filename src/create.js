
const CONFIG = require('./config')

async function createInitialShard(knex) {
  return await knex(CONFIG.RECORD_SHARD_TABLE_NAME)
    .insert({})
    .returning('*')
}

async function createShardTable(knex) {
  await knex.schema.createTable(CONFIG.RECORD_SHARD_TABLE_NAME, t => {
    t.bigincrements('id')
    t.string('url')
  })
}

async function createStringValueTable(knex) {
  await knex.schema.createTable('object', t => {
    t.integer('organization_id')
    t.integer('type_id')
    t.integer('shard_id')
    t.biginteger('object_id')
  })
}

/**
 * - object table
 *   - org (integer)
 *   - type (integer)
 *   - shard (integer)
 *   - source (biginteger)
 */

async function createObjectTable(knex, { organizationId, typeId }) {
  const name = `object_${organizationId}_${typeId}`
  // this seems weird that it's only an `id`.
  // but it makes it so we can add to
  // the table without blocking other writes.
  await knex.schema.createTable(name, t => {
    t.integer('id')
  })
}

/**
 * This is the local table on a shard/database.
 */

async function createShardMappingTable(knex) {
  await knex.schema.createTable('shard_local_table', t => {
    t.integer('organization_id')
    t.integer('type_id')
    t.boolean('appendable')
  })
}

module.exports = {
  createInitialShard,
  createShardTable,
  createShardMappingTable,
  createStringValueTable,
  createObjectTable,
}
