
const resolveSteps = require('@lancejpollard/resolve-action-tree.js')
const CONFIG = require('./config')

class Transaction {
  constructor() {
    this.events = []
  }

  commit(knex) {

  }

  createAttachmentValue(input) {
    return this.track({
      action: 'createAttachmentValue',
      group: CONFIG.TABLE.ATTACHMENT,
      input
    })
  }

  createStringValue(input) {
    return this.track({
      action: 'createStringValue',
      group: CONFIG.TABLE.STRING,
      input
    })
  }

  createTextValue(input) {
    return this.track({
      action: 'createTextValue',
      group: CONFIG.TABLE.TEXT,
      input
    })
  }

  createDecimalValue(input) {
    return this.track({
      action: 'createDecimalValue',
      group: CONFIG.TABLE.DECIMAL,
      input
    })
  }

  createIntegerValue(input) {
    return this.track({
      action: 'createIntegerValue',
      group: CONFIG.TABLE.INTEGER,
      input
    })
  }

  createBooleanValue(input) {
    return this.track({
      action: 'createBooleanValue',
      group: CONFIG.TABLE.BOOLEAN,
      input
    })
  }

  createTimestampValue(input) {
    return this.track({
      action: 'createTimestampValue',
      group: CONFIG.TABLE.TIMESTAMP,
      input
    })
  }

  createPropertyRecord(input) {
    return this.track({
      action: 'createPropertyRecord',
      group: CONFIG.TABLE.PROPERTY,
      input
    })
  }

  createAssociationRecord(input) {
    return this.track({
      action: 'createAssociationRecord',
      group: CONFIG.TABLE.ASSOCIATION,
      input
    })
  }

  createObjectRecord(input) {
    return this.track({
      action: 'createObjectRecord',
      group: CONFIG.TABLE.OBJECT,
      input
    })
  }

  createInitialChunkShardRecord(input) {
    return this.track({
      action: 'createInitialChunkShardRecord',
      group: CONFIG.TABLE.CHUNK_SHARD,
      input
    })
  }

  createInitialChunkShardShardRecord(input) {
    return this.track({
      action: 'createInitialChunkShardShardRecord',
      group: CONFIG.TABLE.CHUNK_SHARD_SHARD,
      input
    })
  }

  updateConfigSchema(input) {
    return this.track({
      action: 'updateConfigSchema',
      group: 'schema',
      input
    })
  }

  reserveIdList(input) {
    return this.track({
      action: 'reserveIdList',
      group: 'id',
      input
    })
  }

  track({ action, group, input }) {
    const output = this.events.length
    this.events.push({
      action,
      group,
      input,
      output
    })
    return output
  }
}

module.exports = Transaction
