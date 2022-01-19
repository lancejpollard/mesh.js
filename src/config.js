
const CONFIG = {
  TABLE: {
    CHUNK_SHARD: 'weave_chunk_shard',
    CHUNK_SHARD_SHARD: 'weave_chunk_shard_shard',
    STRING: 'weave_string',
    ATTACHMENT: 'weave_attachment',
    TEXT: 'weave_text',
    DECIMAL: 'weave_decimal',
    INTEGER: 'weave_integer',
    BOOLEAN: 'weave_boolean',
    TIMESTAMP: 'weave_timestamp',
    PROPERTY: 'weave_property',
    ASSOCIATION: 'weave_association',
    OBJECT: 'weave_object'
  },

  DEFAULT_IP: '127.0.0.1',

  SCHEMA: {},
  SCHEMA_REVERSE: {},

  UPDATE_SCHEMA(types) {
    Object.keys(types).forEach(type => {
      const typeConfig = types[type]
      const typeDef = CONFIG.SCHEMA[type]
      const reverseTypeDef = CONFIG.SCHEMA_REVERSE[typeConfig.id]
        = CONFIG.SCHEMA_REVERSE[typeConfig.id] ?? {
          name: type,
          properties: {}
        }
      typeDef.id = typeConfig.id
      typeDef.chunkId = typeConfig.chunkId
      if (!typeConfig.properties) return
      Object.keys(typeConfig.properties).forEach(propertyName => {
        const propertyConfig = typeConfig.properties[propertyName]
        const propertyDef = typeDef.properties[propertyName]
        const reversePropertyDef = reverseTypeDef.properties[propertyConfig.id]
          = reverseTypeDef.properties[propertyConfig.id] ?? {
            name: propertyName,
            type: {}
          }
        propertyDef.id = propertyConfig.id
        if (!propertyConfig.type) return
        Object.keys(propertyConfig.type).forEach(propertyTypeName => {
          const id = propertyConfig.type[propertyTypeName]
          reversePropertyDef.type[id] = propertyTypeName
          propertyDef.type[propertyTypeName].id = id
        })
      })
    })
  },

  getIdForType(type) {
    return CONFIG.SCHEMA[type].id
  },

  getNameForType(typeId) {
    return CONFIG.SCHEMA_REVERSE[typeId].name
  },

  getIdForProperty(type, propertyName) {
    return CONFIG.SCHEMA[type].properties[propertyName].id
  },

  getNameForProperty(typeId, propertyId) {
    return CONFIG.SCHEMA_REVERSE[typeId].properties[propertyId].name
  },
}

const TYPE = (name, properties) => {
  const typeDef = CONFIG.SCHEMA[name] = { properties: {} }
  Object.keys(properties).forEach(propertyName => {
    const propertyConfig = properties[propertyName]
    const propertyDef = typeDef.properties[propertyName] = { type: {} }
    propertyDef.isList = propertyConfig.is_list
    propertyConfig.type.forEach(propertyType => {
      propertyDef.type[propertyType.name] = propertyType
    })
  })
}

TYPE('type', {
  name: {
    type: [{ name: 'string' }],
    required: true,
  },
  properties: {
    is_list: true,
    type: [{ name: 'type_property' }],
    inverse: ['type'],
  },
  title: {
    type: [{ name: 'text' }]
  },
  description: {
    type: [{ name: 'text' }]
  },
})

TYPE('type_property', {
  name: {
    type: [{ name: 'string' }]
  },
  property_types: {
    is_list: true,
    type: [{ name: 'property_type' }]
  },
  is_list: {
    type: [{ name: 'boolean' }],
    default: false
  },
  default: {
    type: [],
  },
  title: {
    type: [{ name: 'text' }]
  },
  description: {
    type: [{ name: 'text' }]
  },
  type: { // the type the property belongs to.
    type: [{ name: 'type' }]
  }
})

TYPE('type_property_type', {
  name: {
    type: [{ name: 'string' }],
    required: true,
  },
  property: { // the property it belongs to.
    type: [{ name: 'type_property' }],
    required: true,
  },
  title: {
    type: [{ name: 'text' }]
  },
  description: {
    type: [{ name: 'text' }]
  },
})

TYPE('organization', {
  slug: {
    type: [{ name: 'string' }],
    required: true,
  },
  title: {
    type: [{ name: 'text' }]
  },
  description: {
    type: [{ name: 'text' }]
  },
  image: {
    type: [{ name: 'image' }]
  },
  keywords: {
    type: [{ name: 'term' }],
    is_list: true
  }
})

TYPE('image', {
  bucket: {
    type: [{ name: 'biginteger' }],
    required: true,
  },
  media_type: {
    type: [{ name: 'string' }],
    required: true,
  },
  sources: {
    type: [{ name: 'image_source' }],
    is_list: true
  },
  preview: {
    type: [{ name: 'text' }],
    required: true,
  },
  title: {
    type: [{ name: 'text' }]
  },
  description: {
    type: [{ name: 'text' }]
  },
  keywords: {
    type: [{ name: 'term' }],
    is_list: true
  }
})

TYPE('image_source', {
  base: {
    type: [{ name: 'image' }],
    required: true,
  },
  width: {
    type: [{ name: 'integer' }],
    required: true,
  },
  height: {
    type: [{ name: 'integer' }],
    required: true,
  },
  size: {
    type: [{ name: 'integer' }],
    required: true,
  },
})

TYPE('agent', {
  avatar: {
    type: [{ name: 'image' }]
  },
  description: {
    type: [{ name: 'text' }]
  }
})

TYPE('session', {
  expiration_date: {
    type: [{ name: 'datetime' }],
  },
  secret: {
    type: [{ name: 'string' }],
    required: true
  },
  category: {
    type: [{ name: 'integer' }],
    required: true,
    default: 1
    // 1 = guest user
    // 2 = logged in user
    // 3 = logged in machine
  },
  agent: {
    type: [{ name: 'agent' }]
  }
})

TYPE('actor', {
  agent: {
    type: [{ name: 'agent' }]
  }
})

TYPE('agent_authentication', {
  username: {
    type: [{ name: 'string' }]
  },
  password: {
    type: [{ name: 'string' }]
  },
  agent: {
    type: [{ name: 'agent' }]
  }
})

TYPE('action', {
  kind: {
    type: [{ name: 'integer' }],
    required: true,
    default: 1,
  }, // (create, update, delete)
  timestamp: {
    type: [{ name: 'datetime' }],
    required: true
  },
  agent: {
    type: [{ name: 'agent' }]
  },
  datatype: {
    type: [{ name: 'integer' }]
  },
  value: {
    type: [{ name: 'property' }]
  }
})

TYPE('vote', {
  kind: {
    type: [{ name: 'integer' }],
    default: 1
  }, // (flag, agreement, disagreement)
  action: {
    type: [{ name: 'action' }]
  }
})

TYPE('term', {
  text: {
    type: [{ name: 'string' }]
  },
  language: {
    type: [{ name: 'language' }]
  },
  script: {
    type: [{ name: 'script' }]
  }
})

TYPE('language', {
  slug: {
    type: [{ name: 'string' }]
  },
  code2: {
    type: [{ name: 'string' }]
  },
  code3: {
    type: [{ name: 'string' }]
  },
  title: {
    type: [{ name: 'text' }]
  },
  native_title: {
    type: [{ name: 'text' }]
  }
})

TYPE('script', {
  slug: {
    type: [{ name: 'string' }]
  },
  title: {
    type: [{ name: 'text' }]
  },
  native_title: {
    type: [{ name: 'text' }]
  }
})

TYPE('membership', {
  organization: {
    type: [{ name: 'organization' }]
  },
  actor: {
    type: [{ name: 'actor' }]
  },
})

module.exports = CONFIG
