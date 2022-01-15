
const CONFIG = {
  CHUNK_SHARD_TABLE_NAME: 'mesh_chunk_shard',
  CHUNK_SHARD_SHARD_TABLE_NAME: 'mesh_chunk_shard_shard',
  DEFAULT_IP: '127.0.0.1',
  DEFAULT_ORGANIZATION_ID: 0,

  TYPE_ID: {
    type: 0,
    property: 1,
    propertyType: 2
  },

  PROPERTY_ID: {
    type: {
      name: 0,
      properties: 1,
    },
    property: {
      name: 2,
      propertyTypes: 3,
      isList: 4,
      defaultValue: 5,
      title: 6,
      description: 7,
      examples: 8,
      typeId: 9
    },
    propertyType: {
      name: 10,
      propertyId: 11,
    }
  },
}

CONFIG.PROPERTY_NAME = {
  type: {},
  property: {},
}

Object.keys(CONFIG.PROPERTY_ID.property).forEach(name => {
  const id = CONFIG.PROPERTY_ID.property[name]
  CONFIG.PROPERTY_NAME.property[id] = name
})

module.exports = CONFIG
