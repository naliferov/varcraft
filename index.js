const runFrontend = async (x) => {
  globalThis.x = x

  if (!Array.prototype.at) {
    Array.prototype.at = function (i) {
      return i < 0 ? this[this.length + i] : this[i]
    }
  }

  x.s('docMkElement', (x) => {
    const { id, tag, txt, html, events, css, attributes } = x

    const o = document.createElement(tag || 'div')
    if (id) o.id = id
    if (x['class'])
      o.className = Array.isArray(x['class'])
        ? x['class'].join(' ')
        : x['class']
    if (txt) o.innerText = txt
    if (html) o.innerHTML = html
    if (css) for (let k in css) o.style[k] = css[k]
    if (attributes) for (let k in attributes) o.setAttribute(k, attributes[k])
    if (events) for (let k in events) o.addEventListener(k, events[k])

    return o
  })

  x.s('getUUID', () => {
    if (!window.crypto?.randomUUID) {
      const replaceFunc = (c) => {
        const uuid = (Math.random() * 16) | 0,
          v = c == 'x' ? uuid : (uuid & 0x3) | 0x8
        return uuid.toString(16)
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        replaceFunc
      )
    }
    return crypto.randomUUID()
  })

  x.s('blockObserver', async (x) => {
    const state = x.state || {}
    const cb = (update) => x.p('setBlock', { id: state.id })
    const isObj = (o) => typeof o === 'object' && o !== null

    const makeObjectObservable = (obj) => {
      for (let key in obj) {
        if (isObj(obj[key])) {
          obj[key] = makeObjectObservable(obj[key])
        }
      }

      return new Proxy(obj, {
        set: (target, property, value) => {
          const oldValue = target[property]

          if (isObj(value)) {
            value = makeObjectObservable(value)
          }
          if (Array.isArray(target) && property === 'length') {
            return true
          }

          target[property] = value
          cb({
            type: 'update',
            target,
            property,
            oldValue,
            newValue: value,
          })
          return true
        },
        deleteProperty: (target, property) => {
          const oldValue = target[property]
          delete target[property]
          cb({
            type: 'delete',
            target,
            property,
            oldValue,
          })
          return true
        },
      })
    }
    return makeObjectObservable(state)
  })

  x.s('port', async (x) => {
    const bin = x?.data?.bin
    const headers = { 'content-type': 'application/json' }
    if (bin) {
      headers['content-type'] = 'application/octet-stream'
      headers['bin-meta'] = JSON.stringify(x.data.binMeta)
    }
    const r = await fetch('/', {
      method: 'POST',
      headers,
      body: bin || JSON.stringify(x),
    })
    return r.json()
  })
  x.s('set', async (x) => {
    if (x.repo === 'idb') return await idb.set(x)
    return await x.p('port', { event: 'set', data: x })
  })
  x.s('get', async (x) => {
    if (x.repo === 'idb') return await idb.get(x)
    return await x.p('port', { event: 'get', data: x })
  })
  x.s('getDomById', async (x) => document.getElementById(x.id))

  const blocks = {}

  x.s('getBlock', (x) => blocks[x.id])
  x.s('setBlock', async (x) => {
    const id = x.id
    const block = blocks[id]
    if (!block) return

    await x.p('set', { namespace: 'std', id, v: JSON.stringify(block) })
  })
  x.s('renderBlocks', async (x) => {
    const insertTxtAtCursor = (text) => {
      const selection = window.getSelection()
      if (!selection.rangeCount) return

      const range = selection.getRangeAt(0)
      range.deleteContents()

      const textNode = document.createTextNode(text)
      range.insertNode(textNode)

      range.setStartAfter(textNode)
      range.setEndAfter(textNode)
      selection.removeAllRanges()
      selection.addRange(range)
    }

    for (let id in x.blocks) {
      const block = await x.p('blockObserver', {
        state: JSON.parse(x.blocks[id]),
      })
      blocks[id] = block

      const dom = await x.p('docMkElement', {
        attributes: { id },
        class: 'block',
      })
      x.app.append(dom)

      const pre = await x.p('docMkElement', { tag: 'pre', class: 'block-code' })
      pre.setAttribute('contenteditable', 'plaintext-only')
      pre.setAttribute('block-id', id)
      pre.innerText = block.code
      pre.addEventListener('keydown', (e) => {
        if (event.key === 'Tab') {
          event.preventDefault()
          insertTxtAtCursor('    ')
        }
      })
      dom.append(pre)

      const code = `
        export default async ($) => {
          ${block.code}
        }
      `
      const url = URL.createObjectURL(
        new Blob([code], { type: 'application/javascript' })
      )
      try {
        const m = await import(url)
        await m.default({ x, sysId: id, domId: id })
      } catch (e) {
        console.error(e)
      }
    }
  })

  await x.s('subToCodeInput', (x) => {
    document.addEventListener('input', async (e) => {
      const t = e.target
      if (!t.classList || !t.classList.contains('block-code')) return
      const id = t.getAttribute('block-id')
      if (!id) return

      const block = await x.p('getBlock', { id })
      block.code = t.innerText
    })
  })

  const app = await x.p('docMkElement', { id: 'app' })
  document.body.append(app)

  const { IndexedDb } = await import('/module/IndexedDb.js')
  const idb = new IndexedDb()
  await idb.open()

  const stdBlocks = await x.p('get', { getAll: {} })
  await x.p('renderBlocks', { app, blocks: stdBlocks })
  await x.p('subToCodeInput')

  document.fonts.ready.then(() => {
    const scroll = localStorage.getItem('scroll')
    if (!scroll) return
    const { x, y } = JSON.parse(scroll)
    window.scrollTo(x, y)
  })
  window.addEventListener('scroll', () => {
    const s = { x: window.scrollX, y: window.scrollY }
    localStorage.setItem('scroll', JSON.stringify(s))
  })
}

const runBackend = async (x) => {
  x.s('set', async (x) => {
    const { id, v } = x
    if (id && v) {
      await x.p('repo', { set: { id, v }, repo: 'std' })
      return { id, v }
    }
  })
  x.s('get', async (x) => {
    let { id, auth, project, getAll } = x
    if (id) return await x.p('repo', { get: { id }, repo: 'std' })
    if (getAll) return await x.p('repo', { getAll, repo: 'std' })
  })
  x.s('repo', async (x) => {
    const repo = x.repo
    const statePath = `state/${repo}`

    if (x.set) {
      const { isBin, id, v } = x.set
      const path = `${statePath}/${id}`
      const format = typeof v === 'string' ? null : 'json'

      return await x.p('fs', { set: { path, v, format } })
    }
    if (x.get) {
      const { id } = x.get
      const path = `${statePath}/${id}`
      const block = await x.p('fs', { get: { path } })
      if (block) return block.toString()
    }
    if (x.getAll) {
      const list = await x.p('fs', { readdir: { path: statePath } })
      const r = {}
      for (let i of list) {
        r[i] = await x.p('fs', {
          get: { path: `${statePath}/${i}` },
        })
        r[i] = r[i].toString()
      }
      return r
    }
    if (x.del) {
      const { id } = x.del
      const path = `${statePath}/${id}`
      return x.p('fs', { del: { path } })
    }
  })
  x.s('fs', async (x) => {
    const { promises: fs } = await import('node:fs')
    try {
      if (x.set) return await fs.writeFile(x.set.path, x.set.v)
      if (x.get) return await fs.readFile(x.get.path)
      if (x.del) return await fs.unlink(x.del.path)
      if (x.readdir) return await fs.readdir(x.readdir.path)
    } catch (e) {
      console.log(e)
    }
  })
  x.s('getStdBlocks', async (x) => {})
  x.s('getUserBlocks', async (x) => {})
  x.s('signUp', async (x) => {
    //check user by user name
  })
  x.s('signIn', async (x) => {
    //check user by user name
  })
  x.s('httpGetFile', async (x) => {
    let ext, mime
    const { ctx } = x
    const pathname = ctx.url.pathname
    //todo block rq to state dir

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

  await x.s('httpMkResp', async ({ code = 200, mime, v, isBin }) => {
    const send = (value, typeHeader) => ({
      status: code,
      value,
      headers: { 'content-type': typeHeader },
    })
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
  <body>
    <script type="module" src="/index.js?${Date.now()}"></script>
  </body>
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

  await x.s('httpHandler', async (x) => {
    const { b, runtimeCtx, rq, fs } = x
    const ctx = {
      rq,
      headers: rq.headers,
      url: new URL('http://t.c' + rq.url),
      query: {},
    }
    ctx.url.searchParams.forEach((v, k) => (ctx.query[k] = v))
    const r = await x.p('httpGetFile', { ctx, fs })

    if (r.file)
      return await x.p('httpMkResp', { v: r.file, mime: r.mime, isBin: true })
    if (r.fileNotFound)
      return await x.p('httpMkResp', { code: 404, v: 'File not found' })

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

  await x.s('startServer', async (x) => {
    const server = (await import('node:http')).createServer({
      requestTimeout: 30000,
    })
    const ctx = { filename: process.argv[1].split('/').at(-1) }

    server.on('request', async (rq, rs) => {
      rq.on('error', (e) => {
        rq.destroy()
        console.log('request no error', e)
      })
      try {
        const r = await x.p('httpHandler', { runtimeCtx: ctx, rq })
        rs.writeHead(r.status, r.headers).end(r.value)
      } catch (e) {
        const m = 'err in rqHandler'
        console.log(m, e)
        rs.writeHead(503, {
          'content-type': 'text/plain; charset=utf-8',
        }).end(m)
      }
    })
    server.listen(process.env.PORT, () =>
      console.log(`server start on port: [${process.env.PORT}]`)
    )
  })
  await x.p('startServer')
}

;(async () => {
  
  const X = () => {
    const x = {
      IF_NO_SUB_IGNORE: Symbol('ignore-if-no-sub'),

      events: {},
      func: {},

      async p(event, data = {}) {
        const dataObj = typeof data === 'function' ? data : createProxy(data)

        const func = this.func[event]
        if (!func) {
          if (data[this.IF_NO_SUB_IGNORE]) return

          if (!this.events[event]) this.events[event] = []
          this.events[event].push(data)

          console.log(`send event to future [${event}]`)
          return
        }

        if (typeof func !== 'function') {
          console.log(event, func)
        }

        return func(dataObj)
      },
      async s(event, func) {
        this.func[event] = func

        const events = this.events[event]
        if (!events) return this

        console.log(`receive event from past [${event}]`)
        for (let eventData of events) {
          this.p(event, eventData)
        }
        delete this.events[event]
        return this
      },
    }

    const createProxy = (data) =>
      new Proxy(() => {}, {
        get(t, prop) {
          if (prop === 'p') return (...args) => x.p(...args)
          if (prop === 's')
            return (...args) => {
              x.s(...args)
              return x
            }
          if (prop === 'toJSON') return () => data

          return data[prop]
        },
        set(t, prop, value) {
          data[prop] = value
          return true
        },
      })

    return x
  }
  const x = X()

  globalThis.Window ? runFrontend(x) : runBackend(x)
})()
