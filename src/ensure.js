
const CONFIG = require('./config')
const {
  createShardTable,
  createShardMappingTable,
  createInitialShard,
  createStringValueTable,
  createObjectTable,
} = require('./create')

async function ensureCenter(knex) {
  await ensureShardTable(knex)
  await ensureShardMappingTable(knex)
  await ensureInitialShard(knex)
}

async function ensureInitialShard(knex) {
  const shard = await knex(CONFIG.RECORD_SHARD_TABLE_NAME)
    .where('id', 0)
    .first()

  if (shard) {
    return shard
  }

  return await createInitialShard(knex)
}

/**
 * Creates the base schemas on the base database connection,
 * to keep things simple for smaller-scale apps (or beginnings).
 */

async function ensureBaseSchemaSet(knex) {
  await ensureObjectTable(knex)
}

async function ensureObjectTable(knex) {
  const hasTable = await knex.schema.hasTable('object')
  if (!hasTable) {
    await createObjectTable(knex)
  }
}

async function ensureEachPropertyValueTable(knex) {
  await ensureStringValueTable()
}

async function ensureStringValueTable(knex) {
  const hasTable = await knex.schema.hasTable('value_string')
  if (!hasTable) {
    await createStringValueTable(knex)
  }
}

async function ensureShardTable(knex) {
  const hasTable = await knex.schema.hasTable(CONFIG.RECORD_SHARD_TABLE_NAME)
  if (!hasTable) {
    await createShardTable(knex)
  }
}

async function ensureShardMappingTable(knex) {
  const hasTable = await knex.schema.hasTable('shard_local_table')
  if (!hasTable) {
    await createShardMappingTable(knex)
  }
}

module.exports = {
  ensureCenter,
  ensureShardTable,
  ensureBaseSchemaSet,
  ensureObjectTable,
  ensureEachPropertyValueTable,
  ensureStringValueTable,
}
