document.body.style.margin = 0

const { 
  promise: serviceWorkerPromise, 
  resolve: serviceWorkerResolve,
  reject: serviceWorkerIReject 
} = Promise.withResolvers()

onload = () => {
  navigator.serviceWorker
      .register('service-worker.js', { scope: '/' })
      .then(reg => {
        console.log('sw registered')
        serviceWorkerResolve(reg)
      })
      .catch(err => {
        console.error('sw reg failed', err)
        serviceWorkerReject()
      })
}
await serviceWorkerPromise

const mk = (id, target, tag = 'div') => {
  const el = document.createElement(tag)
  if (id) {
    if (id[0] === '.') {
      el.className = id.slice(1)
    } else {
      el.id = id
    }
  }
  target.append(el)
  return el
}

const app = mk('app', document.body)
app.style.display = 'flex'

const head = document.head
const fontUrl = 'https://fonts.googleapis.com/css2?family';
[
  `${fontUrl}=Roboto:wght@400;700&display=swap`,
  `${fontUrl}=JetBrains+Mono:wght@400;700&display=swap`
].forEach(url => {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = url
  head.appendChild(link)
})

const { promise: editorIsReady, resolve: editorIsReadyResolve } = Promise.withResolvers()
const requireScript = document.createElement('script');
requireScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.6/require.min.js'
requireScript.onload = () => {
    require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs' } })
    require(['vs/editor/editor.main'], editorIsReadyResolve)
}
head.append(requireScript)
await editorIsReady;

const { PGlite } = await import('https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/index.js')
const createDb = async (dbName) => await PGlite.create(`idb://${dbName}`)
const db = await createDb('my-pgdata')
const dbUser = await createDb('db-user')

const baseRepository = {
  db: null,
  init(db) { this.db = db }
}
const createRepository = (child) => Object.assign(Object.create(baseRepository), child)

const systemObjectsRepository = {}
const kvRepository = createRepository({
  async getKey(key) {
    const { rows } = await this.db.query(`SELECT * FROM kv WHERE key = $1`, [key])
    if (rows.length > 0) {
      const [ { value } ] = rows
      return value
    }
  },
  async setKey(key, value) {
    await this.db.query(`INSERT INTO kv (key, value) VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, [key, value])
  }
})
kvRepository.init(db)

const objectManager = {
  openedObjects: {},
  async init(db) {
    this.db = db

    const { rows } = await this.db.query(`SELECT * FROM kv WHERE key = $1`, ['openedObjects'])
    if (rows.length > 0) {
      const [ { value } ] = rows
      this.openedObjects = JSON.parse(value)
    }
  },
  getOpenedObjects() {
    return this.openedObjects
  },
  isObjectOpened(objectId) {
    return Boolean(this.openedObjects[objectId])
  },
  openObject(object, pos) {
    this.openedObjects[object.id] = pos ? pos : 1
    this.saveOpenedObjects()
  },
  openObjectWithObject(object, otherObject) {},
  closeObject(object) {
    delete this.openedObjects[object.id]
    this.saveOpenedObjects()
  },
  saveOpenedObjects() {
    this.db.query(
      `INSERT INTO kv (key, value) VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      ['openedObjects', JSON.stringify(this.openedObjects)]
    );
  },
}
await objectManager.init(db)

const objectBrowserWidth = 250
const objectBrowserPadding = 8
let objectBrowser = mk('object-browser', app)
objectBrowser.style.width = objectBrowserWidth + 'px'
objectBrowser.style.height = window.innerHeight - objectBrowserPadding * 2 + 'px'
objectBrowser.style.padding = objectBrowserPadding + 'px'

objectBrowser = objectBrowser.attachShadow({mode: 'open'})
const style = mk(0, objectBrowser, 'style')
style.textContent = `
  :host {
    display: block;
    background: #f3f3f3;
    color: #616161;
    font-family: Roboto, monospace;
  }
  .object-browser-section {
    margin-bottom: 0.5em;
  }
  .object-browser-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ctx-menu-btn {
    width: 24px;
    height: 24px;
    cursor: pointer;
  }
  .ctx-menu {
    position: absolute;
    background: #f3f3f3;
    box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
  }
  .ctx-menu-item {
    padding: 5px 15px;
    cursor: pointer;
  }
  .ctx-menu-item:hover {
    background:rgb(221, 221, 221);
  }
`
objectBrowser.appendChild(style)

const objectBrowserHeader = mk(0, objectBrowser)
objectBrowserHeader.className = 'object-browser-header'
mk(0, objectBrowser, 'br')

const ctxMenuBtn = mk('.ctx-menu-btn', objectBrowserHeader)
ctxMenuBtn.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
`
const ctxMenuBtnRect = ctxMenuBtn.getBoundingClientRect()
let ctxMenu

ctxMenuBtn.addEventListener('click', (e) => {
  if (ctxMenu) {
    ctxMenu.remove()
    ctxMenu = null
    return
  }
  ctxMenu = mk('.ctx-menu', objectBrowser)
  ctxMenu.style.left = `${ctxMenuBtnRect.left}px`
  ctxMenu.style.top = `${ctxMenuBtnRect.top + ctxMenuBtnRect.height}px`

  const itemImport = mk(null, ctxMenu)
  itemImport.className = 'ctx-menu-item'
  itemImport.textContent = 'Import system objects'
  itemImport.addEventListener('click', () => {
    console.log('import')
  })
  const itemExport = mk(null, ctxMenu)
  itemExport.className = 'ctx-menu-item'
  itemExport.textContent = 'Export system objects'
  itemExport.addEventListener('click', () => {
    console.log('export')
  })
  // const itemUserImport = mk(null, ctxMenu)
  // itemUserImport.className = 'ctx-menu-item'
  // itemUserImport.textContent = 'Import user objects'
  // itemUserImport.addEventListener('click', () => {
  //   console.log('import')
  // })
  // const itemUserExport = mk(null, ctxMenu)
  // itemUserExport.className = 'ctx-menu-item'
  // itemUserExport.textContent = 'Export user objects'
  // itemUserExport.addEventListener('click', () => {
  //   console.log('export')
  // })
})

const objectBrowserHeading = mk(0, objectBrowserHeader)
objectBrowserHeading.textContent = 'EXPLORER'

objectBrowser.systemSection = mk('object-browser-system-section', objectBrowser)
objectBrowser.systemSection.className = 'object-browser-section'

let sectionHeading = mk(0, objectBrowser.systemSection)
sectionHeading.textContent = 'System:'
sectionHeading.style.fontWeight = 'bold'

objectBrowser.userSection = mk('object-browser-user-section', objectBrowser)
objectBrowser.userSection.className = 'object-browser-section'

sectionHeading = mk(0, objectBrowser.userSection)
sectionHeading.textContent = 'User:'
sectionHeading.style.fontWeight = 'bold'

const createTabManager = (target, mk, db, width) => {

  const tabsContainer = mk('tabs-container', target)

  tabsContainer.style.width = width
  const style = mk(null, tabsContainer, 'style')
  style.innerHTML = `
    #tabs-panel {
      display: flex;
      background: #f3f3f3;
    }
    .tab {
      display: flex;
      align-items: center;
      padding: 8px;
      cursor: pointer;
      background: #ececec;
    }
    .tab.active {
      background: #FFFFFF;
    }
    .tab-name {
      font-family: Roboto, sans-serif;
      margin-right: 3px;
      color: #333333;
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

  const tabsPanel = mk('tabs-panel', tabsContainer)
  const tabsView = mk('tabs-view', tabsContainer)
  tabsView.style.height = window.innerHeight + 'px' 
  tabsView.style.overflow = 'scroll'

  let activeTab

  const openTab = (object) => {
    const tab = mk(null, tabsPanel)
    tab.className = 'tab active'
    tab.setAttribute('object-id', object.id)

    const tabName = mk(null, tab)
    tabName.className = 'tab-name'
    tabName.innerText = object.data.name
    
    const closeTabBtn = mk('close-tab-btn', tab)
    closeTabBtn.addEventListener('click', (e) => {
      e.stopPropagation()

      let tabForActivation

      if (tab === activeTab.tab) {
        const tabs = tabsPanel.children
        const tabIndex = Array.from(tabs).indexOf(tab)
        const nextTab = tabIndex > 0 
          ? tabs[tabIndex - 1]
          : tabs[tabIndex + 1];

        if (nextTab) {
          tabForActivation = { 
            tab: nextTab,
            tabView: tabsView.querySelector(`[object-id="${nextTab.getAttribute('object-id')}"]`) 
          }
        } 
      }

      closeTab({ tab, tabView })
      objectManager.closeObject(object)

      if (tabForActivation) {
        activateTab(tabForActivation)
        saveActiveTab(tabForActivation.tab.getAttribute('object-id'))
      }
    })
    closeTabBtn.innerHTML += `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"></path>
      </svg>
    `
    
    const tabView = mk(null, tabsView)
    tabView.className = 'tab-view'
    tabView.setAttribute('object-id', object.id)

    const pre = mk(null, tabView, 'div')
    pre.style.height = '900px'
    pre.className = 'object-code'
    pre.setAttribute('object-id', object.id)

    const editor = monaco.editor.create(pre, {
      value: object.data.code,
      language: 'javascript',
      theme: 'vs-dark',
      automaticLayout: true,
      fontSize: 15
    })
    const pos = openedObjects[object.id]
    if (pos && typeof pos === 'object') editor.revealPositionInCenter(pos)

    editor.onDidChangeModelContent((e) => {
      if (!object.id) return
      
      const pos = editor.getPosition()
      objectManager.openObject(object, pos) //rename this name
      
      object.data.code = editor.getValue()
      db.query(
        `UPDATE objects SET data = $1 WHERE id = $2`,
        [JSON.stringify(object.data), object.id]
      )
    })

    const tabForActivation = { tab, tabView }
    tab.addEventListener('click', () => {
      activateTab(tabForActivation)
      saveActiveTab(object.id)
    })
    activateTab(tabForActivation)

    return tabForActivation
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

  const saveActiveTab = (id) => {
    db.query(
      `INSERT INTO kv (key, value) VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      ['activeTabId', id]
    )
  }

  const restoreLastActiveTab = async () => {
    const { rows } = await db.query(`SELECT * FROM kv WHERE key = $1`, ['activeTabId'])
    if (!rows.length) return

    const [ { value } ] = rows
    const tab = tabsPanel.querySelector(`[object-id="${value}"]`)
    const tabView = tabsView.querySelector(`[object-id="${value}"]`)

    if (tab && tabView) {
      activateTab({ tab, tabView })
    }
  }

  return { openTab, saveActiveTab, restoreLastActiveTab }
}

const tabManagerWidth = `calc(100% - ${objectBrowserWidth + objectBrowserPadding * 2}px)`
const tabManager = createTabManager(app, mk, db, tabManagerWidth)

const objectsView = mk('objects-view', app)
objectsView.style.position = `absolute`

const renderObjectName = (object, target) => {
  const dom = mk(object.id, target)
  dom.className = 'object'

  const name = mk(null, dom)
  name.innerText = object.data.name
  name.addEventListener('click', async (e) => {
    if (objectManager.openedObjects[object.id]) return
    tabManager.openTab(object)
    tabManager.saveActiveTab(object.id)
    objectManager.openObject(object)
  })

  const children = mk(null, dom)
  children.className = 'children'
  children.style.marginLeft = '1em'

  return { children }
}

const runMainObject = async (x) => {
  const { object, db, objectBrowser, objectManager, tabManager, renderObjectName } = x
  const code = `export default async ($) => { 
    ${object.data.code}
  }`
  const blob = new Blob([code], { type: 'application/javascript' })
  try {
    const m = (await import(URL.createObjectURL(blob)))
    m.default({ o: object, db, objectBrowser, objectManager, tabManager, renderObjectName })
  } catch (e) {
    console.error(e)
  }
}

const processMainObject = async () => {
  const { rows: objectsRows } = await db.query(`SELECT * FROM objects WHERE id = $1`, ['main']);
  const mainObject = objectsRows[0]
  if (!mainObject) {
    console.log('need to import std data backup from backend')
    return
  }
  await renderObjectName(mainObject, objectBrowser.systemSection)
  await runMainObject({ object: mainObject, db, objectBrowser, objectManager, tabManager, renderObjectName })

  return mainObject
}

const mainObject = await processMainObject()

const openedObjects = await objectManager.getOpenedObjects(mainObject)
for (const objectId in openedObjects) {
  if (objectId.trim() === 'main') {
    tabManager.openTab(mainObject)
  }
}