const runFrontend = async (x) => {

  document.body.style.margin = 0

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

  //todo create ObjectManager and it will be facade for open close objects
  const ObjectManager = () => {
    const openObject = (obj) => {
      tabManager.openTab(obj)
      openedObjects[obj.id] = 1
    }
    const closeObject = (obj) => {
      tabManager.closeTab(obj)
      //delete openedObjects[obj.id]
    }
    return {
      openObject,
      closeObject,
    }
  }

  const CreateTabManager = (target) => {
        
    const tabsMainContainer = mk('tabs-main-container', target)
    const shadow = tabsMainContainer.attachShadow({ mode: 'open' })
    const style = mk(null, shadow, 'style')
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

    tabsView.style.height = window.innerHeight + 'px' //improve 
    tabsView.style.overflow = 'scroll'

    let activeTab

    const openObject = (object) => {}
    const openObjectWithObject = (object, otherObject) => {}

    const openTab = (object) => {
      const tab = mk(null, tabsPanel)
      tab.className = 'tab active'

      const name = mk(null, tab)
      name.className = 'tab-name'
      name.innerText = object.id //todo in future it will be object name
      name.style.marginRight = '3px'
      
      const closeTabBtn = mk('close-tab-btn', tab)
      closeTabBtn.addEventListener('click', () => {
        closeTab({ tab, tabView })
      })
      closeTabBtn.innerHTML += `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"></path>
        </svg>
      `

      const tabView = mk(null, tabsView)
      tabView.className = 'tab-view'
      tabView.style.padding = '8px'
      
      const pre = mk(null, tabView, 'pre')
      pre.className = 'object-code'
      pre.style.margin = 0
      pre.setAttribute('contenteditable', 'plaintext-only')
      pre.setAttribute('object-id', object.id)
      pre.innerText = object.data.code
      pre.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return
        e.preventDefault()
        insertTxtAtCursor('    ')
      })
      if (object.id && object.id.trim() === 'main') {
        pre.addEventListener('input', async () => {
          object.data.code = pre.innerText
          await db.query(
           `UPDATE objects SET data = $1 WHERE id = $2`,
           [JSON.stringify(object.data), 'main']
          );
        })
      }

      // const uiContainer = mk(null, tabView) 
      // uiContainer.className = 'dom-container'
      // uiContainer.style.padding = '8px'

      const tabForActivation = { tab, tabView }
      activateTab(tabForActivation)

      tab.addEventListener('click', () => {
        activateTab(tabForActivation)
      })
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

    return {
      openTab,
      openObject,
      openObjectWithObject,
    }
  }

  const tabManager = CreateTabManager(mainContainer)

  // if (Object.keys(openedObjects).length > 0) {
  //   const openedObjectsData = await db.query(`SELECT * FROM objects WHERE id = ANY($1)`, [Object.keys(openedObjects)])
  //   console.log('openedObjectsData', openedObjectsData)
  // }

  //todo get all objects in one query
  const { rows: objectsRows } = await db.query(`SELECT * FROM objects WHERE id = $1`, ['main']);
  const mainObject = objectsRows[0]
  if (!mainObject) {
    console.log('need to import std data backup from backend')
    return
  }

  const runMainObject = async (x) => {
    const { target, object, db } = x

    const dom = mk(object.id, target)
    dom.className = 'object'

    const name = mk(null, dom)
    name.innerText = 'main'
    name.style.fontWeight = 'bold'
    name.addEventListener('click', async (e) => {
      tabManager.openTab(object)
      openedObjects[object.id] = 1
      await db.query(
        `INSERT INTO kv (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        ['openedObjects', JSON.stringify(openedObjects)]
      );
    })
    name.addEventListener('contextmenu', (e) => console.log('contextmenu'))

    const code = `export default async ($) => { ${object.data.code} }`
    const blob = new Blob([code], { type: 'application/javascript' })
    try {
      const m = await import(URL.createObjectURL(blob))
      m.default({ x: x.x, o: object, dom, db })
    } catch (e) {
      console.error(e)
    }
  }
  await runMainObject({ x, target: objectBrowser, object: mainObject, db })

  // run this code in mainObject code, and add ability to edit it in safe mode
  let openedObjects = {}
  {
    const { rows } = await db.query(`SELECT * FROM kv WHERE key = $1`, ['openedObjects'])
    if (rows.length > 0) {
      const [ { value } ] = rows
      openedObjects = JSON.parse(value)
    }
  }
  //run loop for openedObjects and tabManager.openTab for each object
  for (const objectId in openedObjects) {
    if (objectId.trim() === 'main') {
      tabManager.openTab(mainObject)
    }
  }

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

  [
    'https://cdn.jsdelivr.net/npm/codemirror@5.65.5/lib/codemirror.css',
    'https://cdn.jsdelivr.net/npm/codemirror@5.65.5/theme/dracula.css'
  ].forEach(url => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    head.append(link);
  });

  const scripts = document.getElementsByTagName('script')
  
  let script = document.createElement('script')
  script.setAttribute('src', 'https://cdn.jsdelivr.net/npm/codemirror@5.65.5/lib/codemirror.js')
  scripts[0].after(script)
  script.addEventListener('load', function() {
    //  const editor = CodeMirror.fromTextArea(document.getElementById("code"), {
    //  lineNumbers: true,      // отображение номеров строк
    //  mode: "javascript",     // режим подсветки синтаксиса для JavaScript
    // theme: "dracula"        // тема оформления (если подключена)
    //});
  })

  let script2 = document.createElement('script')
  script2.setAttribute('src', 'https://cdn.jsdelivr.net/npm/codemirror@5.65.5/mode/javascript/javascript.js')
  script.after(script)
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
    //${Date.now()}
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
    events: {}, //for possible events in future
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
