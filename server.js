const createDataProxy = (data, x) =>
  new Proxy(() => {}, {
    get(t, prop) {
      if (prop === 'p') return (...args) => x.p(...args)
      if (prop === 's') {
        return (...args) => {
          x.s(...args)
          return x
        }
      }
      if (prop === 'toJSON') return () => data

      return data[prop]
    },
    set(t, prop, value) {
      data[prop] = value
      return true
    },
})

const psbus = () => {
  const x = {
    events: {},
    func: {},

    async p(event, data = {}) {
      const dataObject = typeof data === 'function' ? data : createDataProxy(data, x)

      const func = this.func[event]
      if (!func) {
        const events = this.events
        if (!events[event]) events[event] = []

        const { promise, resolve } = Promise.withResolvers()
        events[event].push({ data, resolve })

        console.log(`deffered event [${event}]`)
        return promise
      }

      if (typeof func !== 'function') console.log(event, func)
      return func(dataObject)
    },
    async s(event, func) {
      this.func[event] = func

      const events = this.events[event]
      if (!events) return this

      console.log(`executed deffered event > [${event}]`)
      for (const { data, resolve } of events) {
        const response = await this.p(event, data)
        resolve(response)
      }
      delete this.events[event]
      return this
    },
  }

  return x
}

const x = psbus()

x.s('fs', async (x) => {
    const { promises: fs } = await import('node:fs')
    try {
      if (x.set) return await fs.writeFile(x.set.path, x.set.data)
      else if (x.get) return await fs.readFile(x.get.path)
      else if (x.del) return await fs.unlink(x.del.path)
      else if (x.readdir) return await fs.readdir(x.readdir.path)
    } catch (e) {
      console.log(e)
    }
  })

  x.s('httpGetFile', async (x) => {
    const { ctx } = x
    const pathname = ctx.url.pathname
    if (pathname === '/favicon.ico') return { fileNotFound: true }

    let ext, mime
    const split = pathname.split('/').pop().split('.')
    if (split.length < 2) return {}
    ext = split.at(-1)
    if (!split) return {}

    mime = {
      html: 'text/html',
      js: 'text/javascript',
      css: 'text/css',
      map: 'application/json',
      woff2: 'font/woff2',
    }[ext]
    try {
      return {
        file: await x.p('fs', { get: { path: '.' + ctx.url.pathname } }),
        mime,
      }
    } catch (e) {
      if (e.code !== 'ENOENT') console.log('Error of resolve file', e)
      return { fileNotFound: true }
    }
  })

  await x.s('httpMkResp', async ({ statusCode = 200, mime, v, isBin }) => {
    const send = (value, contentType) => {
      const headers = {}
      if (contentType) headers['content-type'] = contentType
      return { statusCode, value, headers }
    }
    const plain = 'text/plain; charset=utf-8'

    if (isBin) return send(v, mime ?? '')
    if (typeof v === 'object') {
      return send(JSON.stringify(v), 'application/json')
    }
    if (typeof v === 'string') return send(v, mime ?? plain)
    return send('empty resp', plain)
  })

  await x.s('getHtml', async (x) => {
    return {
      v: `
  <!DOCTYPE html>
  <html>
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  </head>
  <body><script type="module" src="/index.js"></script></body>
  </html>
      `,
      isHtml: true,
    }
  })

  await x.s('httpGetBody', async (x) => {
    const limitMb = x.limit || 12
    const ctx = x.ctx

    let limit = limitMb * 1024 * 1024
    const rq = ctx.rq

    return new Promise((resolve, reject) => {
      let b = []
      let len = 0

      rq.on('data', (chunk) => {
        len += chunk.length
        if (len > limit) {
          rq.destroy()
          resolve({ err: `limit reached [${limitMb} mb]` })
          return
        }
        b.push(chunk)
      })
      rq.on('error', (err) => {
        rq.destroy()
        reject({ err })
      })
      rq.on('end', () => {
        let msg = {}
        if (b.length > 0) {
          msg.b = Buffer.concat(b)
          msg.binMeta = ctx.headers['bin-meta']
            ? JSON.parse(ctx.headers['bin-meta'])
            : {}
        }

        if (ctx.headers['content-type'] === 'application/json') {
          try {
            msg = JSON.parse(b.toString())
          } catch (e) {
            msg = { err: 'json parse error', data: b.toString() }
          }
        }

        resolve(msg)
      })
    })
  })

const httpHandler = async (x) => {
    const { rq } = x
    const ctx = {
        url: new URL('http://t.c' + rq.url),
        query: {},
        rq,
        headers: rq.headers,
    }
    ctx.url.searchParams.forEach((v, k) => (ctx.query[k] = v))

    const r = await x.p('httpGetFile', { ctx })
    if (r.fileNotFound) return await x.p('httpMkResp', { code: 404, v: 'File not found' })
    else if (r.file) return await x.p('httpMkResp', { v: r.file, mime: r.mime, isBin: true })

    let msg = await x.p('httpGetBody', { ctx })
    if (!msg) msg = {}
    if (msg.err) return await x.p('httpMkResp', { v: msg.err })

    if (msg.bin && msg.binMeta) {
        msg.event = msg.binMeta.event
        msg.data = { ...msg.binMeta, v: msg.bin }
    }

    if (Object.keys(msg).length < 1) {
        msg.event = 'getHtml'
    }

    const o = await x.p(msg.event, msg.data)
    if (!o) {
        return await x.p('httpMkResp', { v: { defaultResponse: true } })
    }
    if (o.isHtml) {
        return await x.p('httpMkResp', { v: o.v, mime: 'text/html' })
    }
    return await x.p('httpMkResp', { v: o })
}

const ctx = { filename: process.argv[1].split('/').at(-1) }
const port = process.env.PORT || 3000
const server = (await import('node:http')).createServer({ requestTimeout: 30000 })
server.on('request', async (rq, rs) => {
    rq.on('error', (e) => {
    rq.destroy()
    console.log('request on error', e)
    })
    try {
    const r = await x.p('httpHandler', { runtimeCtx: ctx, rq })
    rs.writeHead(r.statusCode, r.headers).end(r.value)
    } catch (e) {
    const m = 'err in rqHandler'
    console.log(m, e)
    rs.writeHead(503, { 'content-type': 'text/plain; charset=utf-8' }).end(m)
    }
})
server.listen(port, () => console.log(`server start on port: [${port}]`))