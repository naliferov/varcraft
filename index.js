const runFrontend = async (x) => {

  x.s('docMkElement', (x) => {
    const { id, tag, txt, html, events, css, attrs, attributes } = x

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
    if (attrs) for (let k in attrs) o.setAttribute(k, attrs[k])
    if (events) for (let k in events) o.addEventListener(k, events[k])

    return o
  })

  x.s('oFactory', async (x) => {
    const state = x.state
    const isObj = (o) => typeof o === 'object' && o !== null
    const updateCallback = () => x.p('saveObject', { id: state.id })

    const makeObjectObservable = (obj) => {
      for (const key in obj) {
        if (isObj(obj[key]) && key !== '_') {
          obj[key] = makeObjectObservable(obj[key])
        }
      }

      return new Proxy(obj, {
        set: (target, prop, value) => {
          if (isObj(value)) {
            value = makeObjectObservable(value)
          }
          if (Array.isArray(target) && prop === 'length') return true

          target[prop] = value

          if (prop === '_') return true

          updateCallback()
          return true
        },
        deleteProperty: (target, prop) => {
          delete target[prop]
          updateCallback()
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


  const objects = {}

  x.s('getObject', (x) => objects[x.id])
  x.s('setObject', async (x) => objects[x.o.id] = x.o)
  x.s('saveObject', async (x) => {
    const id = x.id
    const object = objects[id]
    if (!object) return

    await x.p('set', { id, data: JSON.stringify(object) })
  })

  const remove4CharsBeforeCursor = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
  
    const range = selection.getRangeAt(0);
    const startOffset = range.startOffset;
  
    if (startOffset >= 4) {
      const currentNode = range.startContainer;
      const cursorPosition = startOffset - 4;
  
      range.setStart(range.startContainer, cursorPosition);
      range.deleteContents();
      range.setStart(currentNode, cursorPosition)
      range.collapse(true)
  
      selection.removeAllRanges();
      //selection.addRange(range);
    }
  }

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

  x.s('renderMainObject', async (x) => {
    const { target, object: objectData, updateOnInput } = x
    
      const oData = JSON.parse(objectData)
      const id = oData.id

      objects[id] = await x.p('oFactory', { state: oData })
      const object = objects[id]

      const dom = await x.p('docMkElement', {
        attributes: { id },
        class: 'object',
      })
      target.append(dom)

      const pre = await x.p('docMkElement', { tag: 'pre', class: 'object-code' })
      pre.setAttribute('contenteditable', 'plaintext-only')
      pre.setAttribute('object-id', id)
      pre.innerText = object.code
      pre.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return
        e.preventDefault()
        if (e.shiftKey) {
          remove4CharsBeforeCursor()
          return
        }
        insertTxtAtCursor('    ')
      })
      if (updateOnInput) {
        pre.addEventListener('input', () => object.code = pre.innerText)
      }
      dom.append(pre)

      const code = `export default async ($) => { ${object.code} }`
      const url = URL.createObjectURL(new Blob([code], { type: 'application/javascript' }))
      try {
        const m = await import(url)
        m.default({ x, o: object, dom, id, sysId: id, domId: id })
      } catch (e) {
        console.error(e)
      }
  })

  const app = await x.p('docMkElement', { id: 'app' })
  document.body.append(app)

  const stdMainObject = await x.p('get', { project: 'std', get: { id: 'main' } })
  await x.p('renderMainObject', { target: app, object: stdMainObject.object, updateOnInput: true })

  //const { codeEditorFactory } = await import('/module/codeEditor.js')
  //const codeEditor = codeEditorFactory()
  //const codeEditorDom = await codeEditor.init(x, 'some code')
  //app.append(codeEditorDom)
}

const runBackend = async (x) => {
  x.s('set', async (x) => {
    const { auth, project, id, data } = x
    const path = `project/std/${id}`

    await x.p('state', { path, set: { data } })
    return { id, data }
  })
  x.s('get', async (x) => {
    let { auth, project, get, getAll } = x
    const path = 'project/' + project

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
    const { ctx } = x
    const pathname = ctx.url.pathname
    if (pathname === '/favicon.ico') return { fileNotFound: true }
    //todo block rq to state dir

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

    if (r.file) return await x.p('httpMkResp', { v: r.file, mime: r.mime, isBin: true })
    if (r.fileNotFound) return await x.p('httpMkResp', { code: 404, v: 'File not found' })

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
    const port = process.env.PORT || 3000

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
    server.listen(port, () =>
      console.log(`server start on port: [${port}]`)
    )
  })
  await x.p('startServer')
}

;(async () => {
    
  const X = () => {
    const x = {
      events: {},
      func: {},

      async p(event, data = {}) {
        const dataObj = typeof data === 'function' ? data : createProxy(data)

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
        return func(dataObj)
      },
      async s(event, func) {
        this.func[event] = func

        if (event.at(0) === '@') {
          console.log('closure event', event) 
        }

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

    const createProxy = (data) =>
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

    return x
  }
  const x = X()

  globalThis.Window ? runFrontend(x) : runBackend(x)
})()
