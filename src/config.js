
const CONFIG = {
  CHUNK_SHARD_TABLE_NAME: 'mesh_chunk_shard',
  CHUNK_SHARD_SHARD_TABLE_NAME: 'mesh_chunk_shard_shard',
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
      Object.keys(typeConfig).forEach(propertyName => {
        const propertyConfig = typeConfig[propertyName]
        const propertyDef = typeDef[propertyName]
        const reversePropertyDef = reverseTypeDef.properties[propertyConfig.id]
          = reverseTypeDef.properties[propertyConfig.id] ?? {
            name: propertyName,
            type: {}
          }
        propertyDef.id = propertyConfig.id
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
    propertyDef.isList = propertyConfig.isList
    propertyConfig.type.forEach(propertyTypeName => {
      propertyDef.type[propertyTypeName] = {}
    })
  })
}

TYPE('type', {
  name: {
    type: ['string'],
    required: true,
  },
  properties: {
    isList: true,
    type: ['property']
  },
  title: {
    type: ['text']
  },
  description: {
    type: ['text']
  },
})

TYPE('property', {
  name: {
    type: ['string']
  },
  property_types: {
    isList: true,
    type: ['property_type']
  },
  isList: {
    type: ['boolean'],
    default: false
  },
  default: {
    type: [],
  },
  title: {
    type: ['text']
  },
  description: {
    type: ['text']
  },
  typeId: {
    type: ['object_binding']
  }
})

TYPE('property_type', {
  name: {
    type: ['string'],
    required: true,
  },
  property_id: {
    type: ['property_binding'],
    required: true,
  },
  title: {
    type: ['text']
  },
  description: {
    type: ['text']
  },
})

TYPE('organization', {
  slug: {
    type: ['string'],
    required: true,
  },
  title: {
    type: ['text']
  },
  description: {
    type: ['text']
  },
  image: {
    type: ['image']
  },
  keywords: {
    type: ['term'],
    isList: true
  }
})

TYPE('image_source', {
  base: {
    type: ['image'],
    required: true,
  },
  width: {
    type: ['integer'],
    required: true,
  },
  height: {
    type: ['integer'],
    required: true,
  },
  size: {
    type: ['integer'],
    required: true,
  },
})

TYPE('image', {
  bucket: {
    type: ['biginteger'],
    required: true,
  },
  media_type: {
    type: ['string'],
    required: true,
  },
  sources: {
    type: ['image_source'],
    isList: true
  },
  preview: {
    type: ['text'],
    required: true,
  },
  title: {
    type: ['text']
  },
  description: {
    type: ['text']
  },
  keywords: {
    type: ['term'],
    isList: true
  }
})

TYPE('agent', {
  expiration_date: {
    type: ['datetime'],
  },
  secret: {
    type: ['string'],
    required: true
  },
  category: {
    type: ['integer'],
    required: true,
    default: 1
    // 1 = guest user
    // 2 = logged in user
    // 3 = logged in machine
  }
})

TYPE('actor', {
  agent_id: {
    type: ['property_binding']
  }
})

TYPE('agent_authentication', {
  username: {
    type: ['string']
  },
  password: {
    type: ['string']
  },
  agent_id: {
    type: ['property_binding']
  }
})

TYPE('action', {
  kind: {
    type: ['integer'],
    required: true,
    default: 1,
  }, // (create, update, delete)
  timestamp: {
    type: ['datetime'],
    required: true
  },
  agent_id: {
    type: ['property_binding']
  },
  value_id: {
    type: ['property_binding']
  }
})

TYPE('vote', {
  kind: {
    type: ['integer'],
    default: 1
  }, // (flag, agreement, disagreement)
  action_id: {
    type: ['property_binding']
  }
})

TYPE('term', {
  text: {
    type: ['string']
  },
  language_id: {
    type: ['property_binding']
  },
  script_id: {
    type: ['property_binding']
  }
})

TYPE('language', {
  slug: {
    type: ['string']
  },
  code2: {
    type: ['string']
  },
  code3: {
    type: ['string']
  },
  title: {
    type: ['text']
  },
  native_title: {
    type: ['text']
  }
})

TYPE('script', {
  slug: {
    type: ['string']
  },
  title: {
    type: ['text']
  },
  native_title: {
    type: ['text']
  }
})

TYPE('membership', {
  organization_id: {
    type: ['property_binding']
  },
  actor_id: {
    type: ['property_binding']
  },
})

module.exports = CONFIG
