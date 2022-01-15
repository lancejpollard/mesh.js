
async function revokeCenter(knex) {
  await knex.schema.dropTableIfExists('shard')
  await knex.schema.dropTableIfExists('shard_table')
}

module.exports = {
  revokeCenter,
}
