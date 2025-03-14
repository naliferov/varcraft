const runFrontend = async (x) => {

  const insertTxtAtCursor = (txt) => {
    const selection = window.getSelection()
    if (!selection.rangeCount) return

    const range = selection.getRangeAt(0)
    range.deleteContents()

    const textNode = document.createTextNode(txt)
    range.insertNode(textNode)

    range.setStartAfter(textNode)
    range.setEndAfter(textNode)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  const { PGlite } = await import('https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/index.js')
  const db = new PGlite('idb://my-pgdata')
  const app = document.createElement('div')
  app.id = 'app'
  document.body.append(app)

  const { rows } = await db.query(`SELECT * FROM objects WHERE id = $1`, ['main']);
  const stdMainObject = rows[0]
  if (!stdMainObject) {
    console.log('need to import std data backup from backend')
    return
  }

  const renderMainObject = async (x) => {
    const { target, object, db } = x

    const dom = document.createElement('div')
    dom.id = object.id
    dom.className = 'object'
    target.append(dom)

    const pre = document.createElement('pre')
    pre.className = 'object-code'
    pre.setAttribute('contenteditable', 'plaintext-only')
    pre.setAttribute('object-id', object.id)
    pre.innerText = object.data.code
    pre.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return
      e.preventDefault()
      insertTxtAtCursor('    ')
    })
    pre.addEventListener('input', async () => {
      object.data.code = pre.innerText
      await db.query(
        `UPDATE objects SET data = $1 WHERE id = $2`,
        [JSON.stringify(object.data), 'main']
      );
    })
    dom.append(pre)

    const code = `export default async ($) => { ${object.data.code} }`
    const blob = new Blob([code], { type: 'application/javascript' })
    try {
      const m = await import(URL.createObjectURL(blob))
      m.default({ x: x.x, o: object, dom, db })
    } catch (e) {
      console.error(e)
    }
  }
  await renderMainObject({ x, target: app, object: stdMainObject, db })
}

const runBackend = async (x) => {

  x.s('set', async (x) => {
    const { auth, project = 'std', id, data } = x
    const path = `project/${project}/${id}`

    await x.p('state', { path, set: { data } })
    return { id, data }
  })
  x.s('get', async (x) => {
    let { auth, project = 'std', get, getAll } = x
    const path = `project/${project}`

    if (getAll) return await x.p('state', { auth, path, getAll })
    if (get) return await x.p('state', { auth, path, get })
  })
  x.s('state', async (x) => {
    const { path } = x
    const statePath = `state/${path}`

    if (x.set) return await x.p('fs', { set: { path: statePath, data: x.set.data } })
    if (x.get) {
      const { id } = x.get
      const path = `${statePath}/${id}`
      const object = await x.p('fs', { get: { path } })
      if (object) return { object : object.toString() } //in case id.bin don't make toString
    }
    if (x.getAll) {
      const list = await x.p('fs', { readdir: { path: statePath } })
      const r = []
      for (let i of list) {
        const str = await x.p('fs', { get: { path: `${statePath}/${i}` } })
        r.push(str.toString())
      }
      return r
    }
    if (x.del) {
      //const { id } = x.del
      //const path = `${statePath}/${id}`
      //return x.p('fs', { del: { path } })
    }
  })
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
  x.s('signUp', async (x) => {})
  x.s('signIn', async (x) => {})
  x.s('httpGetFile', async (x) => {
    const { ctx } = x
    const pathname = ctx.url.pathname
    if (pathname === '/favicon.ico') return { fileNotFound: true }
    //todo block direct request to state dir

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
    const fontUrl = `https://fonts.googleapis.com/css2?family`
    return {
      v: `
  <!DOCTYPE html><html>
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <link href="${fontUrl}=Roboto:wght@400;700&display=swap" rel="stylesheet">
  <link href="${fontUrl}=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  </head>
  <body><script type="module" src="/index.js?${Date.now()}"></script></body></html>
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

  await x.s('httpHandler', async (x) => {
    const { rq, fs } = x
    const ctx = {
      rq,
      headers: rq.headers,
      url: new URL('http://t.c' + rq.url),
      query: {},
    }
    ctx.url.searchParams.forEach((v, k) => (ctx.query[k] = v))
    const r = await x.p('httpGetFile', { ctx, fs })

    if (r.fileNotFound) return await x.p('httpMkResp', { code: 404, v: 'File not found' })
    else if (r.file) return await x.p('httpMkResp', { v: r.file, mime: r.mime, isBin: true })

    let msg = await x.p('httpGetBody', { ctx })
    if (!msg) msg = {}
    if (msg.err) return await x.p('httpMkResp', { v: msg.err })

    // if (msg.bin && msg.binMeta) {
    //   msg.event = msg.binMeta.event
    //   msg.data = { ...msg.binMeta, v: msg.bin }
    // }

    if (Object.keys(msg).length < 1) msg.event = 'getHtml'

    const o = await x.p(msg.event, msg.data)
    if (!o) {
      return await x.p('httpMkResp', { v: { defaultResponse: true } })
    }
    if (o.isHtml) {
      return await x.p('httpMkResp', { v: o.v, isBin: true, mime: 'text/html' })
    }
    return await x.p('httpMkResp', { v: o })
  })

  //const { PGlite } = await import('@electric-sql/pglite');
  //const db = new PGlite('./state/dbdata')

  // console.log(await db.query(`
  //   CREATE TABLE IF NOT EXISTS objects (
  //       id SERIAL PRIMARY KEY, data JSONB NOT NULL
  //   );
  // `));

  // await db.query(`INSERT INTO objects (data) VALUES ($1);`, ['{"name": "alisa"}']);
  // const r = await db.query(`SELECT * FROM objects`)
  // console.log(r.rows)

  // const res = await client.query(`
  //   CREATE TABLE objects (
  //     id SERIAL PRIMARY KEY,
  //     data JSONB NOT NULL,
  //     previous_id INTEGER REFERENCES objects(id) ON DELETE SET NULL,
  //     next_id INTEGER REFERENCES objects(id) ON DELETE SET NULL
  //   );
  // `)
  // console.log(res)
  // await client.end()

  await x.s('serverStart', async (x) => {
    const server = (await import('node:http')).createServer({ requestTimeout: 30000 })
    const ctx = { filename: process.argv[1].split('/').at(-1) }
    const port = process.env.PORT || 3000

    server.on('request', async (rq, rs) => {
      rq.on('error', (e) => {
        rq.destroy()
        console.log('request no error', e)
      })
      try {
        const r = await x.p('httpHandler', { runtimeCtx: ctx, rq })
        rs.writeHead(r.statusCode, r.headers).end(r.value)
      } catch (e) {
        const m = 'err in rqHandler'
        console.log(m, e)
        rs.writeHead(503, {
          'content-type': 'text/plain; charset=utf-8',
        }).end(m)
      }
    })
    server.listen(port, () =>
      console.log(`server start on port: [${port}]`)
    )
  })
  await x.p('serverStart')
}

;(async () => {
  const { psbus } = await import('./module/psbus.js')
  const x = psbus()
  globalThis.Window ? runFrontend(x) : runBackend(x)
})()
