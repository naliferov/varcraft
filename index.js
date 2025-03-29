const runFrontend = async (x) => {

  document.body.style.margin = 0

  const { PGlite } = await import('https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/index.js')
  const db = new PGlite('idb://my-pgdata')
  const head = document.getElementsByTagName('head')[0]
  const fontUrl = 'https://fonts.googleapis.com/css2?family';

  [
    `${fontUrl}=Roboto:wght@400;700&display=swap`,
    `${fontUrl}=JetBrains+Mono:wght@400;700&display=swap`
  ].forEach(url => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url
    head.appendChild(link)
  });

  const mk = (id, target, tag = 'div') => {
    const el = document.createElement(tag)
    if (id) el.id = id
    target.append(el)
    return el
  }

  const app = mk('app', document.body)
  app.style.display = 'flex'
  app.style.alignItems = 'flex-start'

  const objectBrowserWidth = 250
  const objectBrowserPadding = 8
  const objectBrowser = mk('object-browser', app)
  objectBrowser.style.padding = objectBrowserPadding + 'px'
  objectBrowser.style.width = objectBrowserWidth + 'px'
  objectBrowser.style.height = (window.innerHeight - 16) + 'px' //minus padding
  objectBrowser.style.background = '#F3F3F3'

  const mainContainer = mk('main-container', app)
  mainContainer.style.width = `calc(100% - ${objectBrowserWidth + objectBrowserPadding * 2}px)`

  const objectsView = mk('objects-view', app)
  objectsView.style.position = `absolute`

  const ObjectManager = {
    openObject(object) {

    },
    openObjectWithObject(object, objectOpener) {

    },
    closeObject(object) {

    },
  }

  const { promise: editorIsReady, resolve: editorIsReadyResolve } = Promise.withResolvers()
  const requireScript = document.createElement('script');
  requireScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.6/require.min.js'
  requireScript.onload = () => {
      require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs' } })
      require(['vs/editor/editor.main'], editorIsReadyResolve)
  }
  document.head.append(requireScript)
  await editorIsReady

  let openedObjects = {}

  const CreateTabManager = (target) => {
        
    const tabsMainContainer = mk('tabs-main-container', target)
    const shadow = tabsMainContainer
    const style = mk(null, head, 'style')
    style.innerHTML = `
      #tabs-panel {
        display: flex;
        background: #F3F3F3;
      }
      .tab {
        display: flex;
        align-items: center;
        padding: 8px;
        cursor: pointer;
      }
      .tab.active {
        background: #FFFFFF;
      }
      .tab-view.hidden {
        display: none;
      }
      .object-code {
        font-family: 'JetBrains Mono', monospace;
      }
      #close-tab-btn {
        width: 18px;
        height: 18px;
        stroke: currentColor;
      }
    `

    const tabsPanel = mk('tabs-panel', shadow)
    const tabsView = mk('tabs-view', shadow)

    tabsView.style.height = window.innerHeight + 'px' 
    tabsView.style.overflow = 'scroll'

    let activeTab

    const openTab = (object) => {
      const tab = mk(null, tabsPanel)
      tab.className = 'tab active'

      const name = mk(null, tab)
      name.className = 'tab-name'
      name.innerText = object.data.name
      name.style.marginRight = '3px'
      
      const closeTabBtn = mk('close-tab-btn', tab)
      closeTabBtn.addEventListener('click', () => {
        closeTab({ tab, tabView })
        delete openedObjects[object.id]
        db.query(
          `INSERT INTO kv (key, value) VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          ['openedObjects', JSON.stringify(openedObjects)]
        );
      })
      closeTabBtn.innerHTML += `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"></path>
        </svg>
      `

      const tabView = mk(null, tabsView)
      tabView.className = 'tab-view'
      const pre = mk(null, tabView, 'div')
      pre.style.height = '900px'
      pre.className = 'object-code'
      pre.setAttribute('object-id', object.id)

      const editor = monaco.editor.create(pre, {
        value: object.data.code,
        language: 'javascript',
        theme: 'vs-light',
        automaticLayout: true,
        fontSize: 15
      })
      const pos = openedObjects[object.id]
      if (pos && typeof pos === 'object') editor.revealPositionInCenter(pos)

      editor.onDidChangeModelContent((e) => {
        if (!object.id || object.id.trim() !== 'main') {
          return
        }
        const pos = editor.getPosition()
        openedObjects[object.id] = { lineNumber: pos.lineNumber, column: pos.column }
        db.query(
          `INSERT INTO kv (key, value) VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          ['openedObjects', JSON.stringify(openedObjects)]
        );
        
        object.data.code = editor.getValue()
        db.query(
         `UPDATE objects SET data = $1 WHERE id = $2`,
         [JSON.stringify(object.data), 'main']
        )
      })

      const tabForActivation = { tab, tabView }
      tab.addEventListener('click', () => {
        activateTab(tabForActivation)
      })
      activateTab(tabForActivation)
    }

    const closeTab = (tabForDeactivation) => {
      const { tab, tabView } = tabForDeactivation
      tab.remove()
      tabView.remove()
    }

    const activateTab = (tabForActivation) => {

      if (activeTab) {
        const { tab, tabView } = activeTab
        tab.classList.remove('active')
        tabView.classList.add('hidden')
      }

      const { tab, tabView } = tabForActivation
      tab.classList.add('active')
      tabView.classList.remove('hidden')
      activeTab = tabForActivation
    }

    return { openTab }
  }
  const tabManager = CreateTabManager(mainContainer)

  const renderInObjectBrowser = (x) => {
    const { object, target } = x

    const dom = mk(object.id, target)
    dom.className = 'object'

    const name = mk(null, dom)
    name.innerText = object.data.name
    name.style.fontWeight = 'bold'
    name.addEventListener('click', async (e) => {
      if (openedObjects[object.id]) return

      tabManager.openTab(object)
      openedObjects[object.id] = 1
      await db.query(
        `INSERT INTO kv (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        ['openedObjects', JSON.stringify(openedObjects)]
      );
    })
  }

  const runObject = async (x) => {
    const { object, db, objectBrowser } = x

    const code = `export default async ($) => { ${object.data.code} }`
    const blob = new Blob([code], { type: 'application/javascript' })
    try {
      const m = (await import(URL.createObjectURL(blob)))
      m.default({ x: x.x, o: object, db, objectBrowser, runObject })
    } catch (e) {
      console.error(e)
    }
  }

  const { rows: objectsRows } = await db.query(`SELECT * FROM objects WHERE id = $1`, ['main']);
  const mainObject = objectsRows[0]
  if (!mainObject) {
    console.log('need to import std data backup from backend')
    return
  }

  await renderInObjectBrowser({ x, target: objectBrowser, object: mainObject })
  await runObject({ x, object: mainObject, db, objectBrowser })
  
  {
    const { rows } = await db.query(`SELECT * FROM kv WHERE key = $1`, ['openedObjects'])
    if (rows.length > 0) {
      const [ { value } ] = rows
      openedObjects = JSON.parse(value)
    }
    for (const objectId in openedObjects) {
      if (objectId.trim() === 'main') {
        tabManager.openTab(mainObject)
      }
    }
  }
}

const runBackend = async (x) => {
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

  await x.s('httpHandler', async (x) => {
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
  })

  {
    const server = (await import('node:http')).createServer({ requestTimeout: 30000 })
    const ctx = { filename: process.argv[1].split('/').at(-1) }
    const port = process.env.PORT || 3000

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
  }
}

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

;(async () => {
  const x = psbus()
  globalThis.Window ? runFrontend(x) : runBackend(x)
})()
