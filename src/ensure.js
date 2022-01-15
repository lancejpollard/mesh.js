
const CONFIG = require('./config')
const {
  PROPERTY_TABLE_CREATOR,
  createChunkShardShardTable,
  createChunkShardTable,
  createInitialChunkShardShardRecord,
  createTypeTypeRecord,
} = require('./create')

async function ensureCenter(knex) {
  await ensureChunkShardShardTable(knex)
  await ensureChunkShardTable(knex)
  await ensureInitialChunkShardShardRecord(knex)
}

async function ensureChunkShardShardTable(knex) {
  const hasTable = await knex.schema.hasTable(CONFIG.CHUNK_SHARD_SHARD_TABLE_NAME)
  if (!hasTable) {
    await createChunkShardShardTable(knex)
  }
}

async function ensureChunkShardTable(knex) {
  const hasTable = await knex.schema.hasTable(CONFIG.CHUNK_SHARD_TABLE_NAME)
  if (!hasTable) {
    await createChunkShardTable(knex)
  }
}

async function ensureInitialChunkShardShardRecord(knex) {
  const shard = await knex(CONFIG.CHUNK_SHARD_SHARD_TABLE_NAME)
    .where('id', 0)
    .first()

  if (shard) {
    return shard
  }

  return await createInitialChunkShardShardRecord(knex)
}

/**
 * Creates the base schemas on the base database connection,
 * to keep things simple for smaller-scale apps (or beginnings).
 */

async function ensureBaseSchema(knex) {
  await ensureEachPropertyTable(knex)
  await ensureTypeTypeRecord(knex)
}

async function ensureEachPropertyTable(knex) {
  for (const name in PROPERTY_TABLE_CREATOR) {
    const call = PROPERTY_TABLE_CREATOR[name]
    const hasTable = await knex.schema.hasTable(`mesh_${name}`)
    if (!hasTable) {
      await call(knex)
    }
  }
}

async function ensureTypeTypeRecord(knex) {
  await createTypeTypeRecord(knex)
}

module.exports = {
  ensureCenter,
  ensureChunkShardShardTable,
  ensureBaseSchema,
}
