const { createHash } = require('crypto')

class NodeSafeHashedChunkIdsPlugin {
  constructor(buildId) {
    this.buildId = buildId
  }

  apply(compiler) {
    compiler.hooks.compilation.tap('NodeSafeHashedChunkIdsPlugin', compilation => {
      compilation.hooks.beforeChunkIds.tap(
        'NodeSafeHashedChunkIdsPlugin',
        chunks => {
          for (const chunk of chunks) {
            if (chunk.id === null && chunk.name) {
              const id = chunk.name.replace(this.buildId, '')
              chunk.id = createHash('sha256')
                .update(id)
                .digest('hex')
                .substr(0, 4)
              continue
            }

            const ids = [...chunk.modulesIterable]
              .map(m => m.id)
              .sort()
            const h = createHash('sha256')
            ids.forEach(id => h.update(String(id)))
            chunk.id = h.digest('hex').substr(0, 4)
          }
        }
      )
    })
  }
}

module.exports = {
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/.git/**',
          '**/node_modules/**',
          '**/anmeldelser/**',
          '**/data/**',
          '**/fdirs/**',
          '**/hist.dk/**',
          '**/static/**'
        ]
      }
    }

    if (!isServer) {
      // Fixes npm packages that depend on the `fs` module in browser bundles.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false
      }
    }

    config.plugins = config.plugins.map(plugin => {
      if (plugin && plugin.constructor.name === 'HashedChunkIdsPlugin') {
        return new NodeSafeHashedChunkIdsPlugin(plugin.buildId)
      }

      return plugin
    })

    return config
  }
}
