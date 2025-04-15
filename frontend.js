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

const removeExtraEscaping = str => str.replace(/\\+n/g, '\n')

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
await editorIsReady

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
`

const objectBrowserHeader = mk(0, objectBrowser)
objectBrowserHeader.className = 'object-browser-header'
mk(0, objectBrowser, 'br')

let ctxMenu
const ctxMenuBtn = mk('.ctx-menu-btn', objectBrowserHeader)
ctxMenuBtn.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
`
const ctxMenuBtnRect = ctxMenuBtn.getBoundingClientRect()
ctxMenuBtn.addEventListener('click', (e) => {
  if (ctxMenu) {
    ctxMenu.remove()
    ctxMenu = null
    return
  }
  ctxMenu = mk('.ctx-menu', app)
  const style = mk(null, ctxMenu, 'style')
  style.innerHTML = `
    .ctx-menu {
      position: absolute;
      background: #f3f3f3;
      box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
    }
    .ctx-menu-item {
      padding: 5px 0;
      cursor: pointer;
    }
    .ctx-menu-item:hover {
      background:rgb(221, 221, 221);
    }
  `
  ctxMenu.style.left = `${ctxMenuBtnRect.left}px`
  ctxMenu.style.top = `${ctxMenuBtnRect.top + ctxMenuBtnRect.height}px`
  ctxMenu.style.position = 'absolute'
  ctxMenu.style.background = '#f3f3f3'
  ctxMenu.style.boxShadow = 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px'
  ctxMenu.style.zIndex = '1000'

  const importDump = async (db, file) => {
    const r = new FileReader()
    r.readAsText(file)
    r.onload = async() => {      
      await db.exec(r.result)

      const objects = await systemObjectsRepository.getObjects()
      for (let i = 0; i < objects.length; i++) {
        const o = objects[i]
        if (!o.data.code) continue
        o.data.code = removeExtraEscaping(o.data.code)
        await systemObjectsRepository.updateObjectData(o.id, o.data)
      }
      console.log('import complete')
      document.location.reload()
    }
  }

  const exportDump = async (db) => {
    if (inProgress) return
    inProgress = true

    const { pgDump } = await import('https://cdn.jsdelivr.net/npm/@electric-sql/pglite-tools/dist/pg_dump.js')
    const dump = await pgDump({ pg: db })

    const a = document.createElement('a')
    a.href = URL.createObjectURL(dump)
    a.download = dump.name
    a.click()
    URL.revokeObjectURL(a.href)

    inProgress = false
  }

  const itemSystemImport = mk(null, ctxMenu)
  itemSystemImport.className = 'ctx-menu-item'
  itemSystemImport.textContent = 'Import system objects'

  let fInput = mk(null, itemSystemImport, 'input')
  fInput.type = 'file'
  fInput.style.marginLeft = '10px'
  fInput.addEventListener('change', async(e) => {
    const file = e.target.files[0]
    if (!file) return    
    importDump(dbSystem, file)
  })

  let inProgress = false

  const itemSystemExport = mk(null, ctxMenu)
  itemSystemExport.className = 'ctx-menu-item'
  itemSystemExport.textContent = 'Export system objects'
  itemSystemExport.addEventListener('click', async () => {
    exportDump(dbSystem)
  })

  const itemUserImport = mk(null, ctxMenu)
  itemUserImport.className = 'ctx-menu-item'
  itemUserImport.textContent = 'Import user objects'

  fInput = mk(null, itemUserImport, 'input')
  fInput.type = 'file'
  fInput.style.marginLeft = '10px'
  fInput.addEventListener('change', async (e) => {
    const file = e.target.files[0]
    if (!file) return    
    await dbDropTables(dbUser)
    await importDump(dbUser, file)
  })

  const itemUserExport = mk(null, ctxMenu)
  itemUserExport.className = 'ctx-menu-item'
  itemUserExport.textContent = 'Export user objects'
  itemUserExport.addEventListener('click', (e) => {
    e.preventDefault()
    exportDump(dbUser)
  })
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

const createTabManager = (target, mk, width) => {

  const tabsContainer = mk('tabs-container', target)
  tabsContainer.style.width = width
  const style = mk(null, tabsContainer, 'style')
  style.innerHTML = `
    #tabs-bar {
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
  
  const tabsBar = mk('tabs-bar', tabsContainer)
  const tabsBarHeight = 35
  const tabsView = mk('tabs-view', tabsContainer)
  tabsView.style.height = window.innerHeight - tabsBarHeight + 'px' 
  tabsView.style.overflow = 'scroll'

  let activeTab

  const openTab = (object) => {
    const tab = mk(null, tabsBar)
    tab.className = 'tab active'
    tab.setAttribute('object-id', object.id)

    tab.name = mk(null, tab)
    tab.name.className = 'tab-name'
    tab.name.innerText = object.data.name
    
    tab.closeBtn = mk('close-tab-btn', tab)
    tab.closeBtn.addEventListener('click', (e) => {
      e.stopPropagation()

      let tabForActivation

      if (tab === activeTab.tab) {
        const tabs = tabsBar.children
        const tabIndex = Array.from(tabs).indexOf(tab)
        const nextTab = tabIndex > 0 
          ? tabs[tabIndex - 1]
          : tabs[tabIndex + 1];

        if (nextTab) {
          tabForActivation = { 
            tab: nextTab,
            tabView: nextTab.view 
          }
        }
      }

      closeTab({ tab, tabView: tab.view })
      //todo add second param as source which opened object before, in this case it's tabManager
      objectManager.closeObject(object, 'tabManager')

      if (tabForActivation) {
        activateTab(tabForActivation)
        saveActiveTab(tabForActivation.tab.getAttribute('object-id'))
      }
    })
    tab.closeBtn.innerHTML += `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"></path>
      </svg>
    `
    tab.view = mk(null, tabsView)
    tab.view.className = 'tab-view'

    const pre = mk(null, tab.view, 'div')
    pre.style.height = window.innerHeight - tabsBarHeight + 'px' 
    pre.className = 'object-code'

    const code = removeExtraEscaping(object.data.code)
    const editor = monaco.editor.create(pre, {
      value: code, 
      language: 'javascript',
      theme: 'vs-dark', 
      automaticLayout: true, 
      fontSize: 15
    })

    const openedObjects = objectManager.getOpenedObjects()
    const pos = openedObjects[object.id]
    if (pos && typeof pos === 'object') editor.revealPositionInCenter(pos)

    editor.onDidChangeModelContent((e) => {
      if (!object.id) return
      
      const pos = editor.getPosition()
      objectManager.openObject(object, pos) //rename this name?
      object.data.code = editor.getValue()
      systemObjectsRepository.updateObjectData(object.id, object.data)
    })

    const tabForActivation = { tab, tabView: tab.view }
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

  const saveActiveTab = (id) => kvRepository.setKey('activeTabId', id)

  const restoreLastActiveTab = async () => {
    const value = await kvRepository.getKey('activeTabId')
    if (!value) return

    const tab = tabsBar.querySelector(`[object-id="${value}"]`)
    const tabView = tab.view

    if (tab && tabView) {
      activateTab({ tab, tabView })
    }
  }

  return { openTab, saveActiveTab, restoreLastActiveTab }
}

const tabManagerWidth = `calc(100% - ${objectBrowserWidth + objectBrowserPadding * 2}px)`
const tabManager = createTabManager(app, mk, tabManagerWidth)

//const objectsView = mk('objects-view', app)



const { PGlite } = await import('https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/index.js')
const createDb = async (dbName) => await PGlite.create(`idb://${dbName}`)
const dbSystem = await createDb('db-system')
const dbUser = await createDb('db-user')

const dbGetTables = async (db) => {
  const { rows } = await db.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `)
  return rows.map(row => row.table_name)
}
const dbDropTables = async (db) => {
  const tables = await dbGetTables(db)
  for (const table of tables) {
    await db.query(`DROP TABLE IF EXISTS ${table}`)
  }
}

const baseRepository = {
  db: null,
  table: null,
  init(db) { 
    this.db = db
  },
  async getById(id) {
    const { rows } = await this.db.query(`SELECT * FROM ${this.table} WHERE id = $1`, [id])
    return rows[0]
  },
  async isExists() {
    const tables = await dbGetTables(this.db)
    return tables.includes(this.table)
  },
}

const createRepository = (child) => Object.assign(Object.create(baseRepository), child)

const createObjectsRepository = (child = {}) => createRepository({
  table: 'objects',
  async getObjects() {
    const { rows } = await this.db.query(`SELECT * FROM public.${this.table}`)
    return rows
  },
  async updateObjectData(objectId, data) {
    await this.db.query(`UPDATE public.${this.table} SET data = $1 WHERE id = $2`, [data, objectId])
  },
  async getNextObjects(objectId) {
    const iterateSql = `
      WITH RECURSIVE next_objects AS (
        SELECT o.* FROM objects o
        WHERE o.id = $1
        UNION ALL
        SELECT o.* FROM objects o
        INNER JOIN next_objects no ON o.id = no.next_id
      )
      SELECT * FROM next_objects
      WHERE id != $1;
    `;
    return await this.db.query(iterateSql, [objectId])
  },
  ...child
})

const systemObjectsRepository = createObjectsRepository()
systemObjectsRepository.init(dbSystem)
const userObjectsRepository = createObjectsRepository()
userObjectsRepository.init(dbUser)

const kvRepository = createRepository({
  table: 'kv',
  async initTable() {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS ${this.table} (
        key character varying(26) NOT NULL PRIMARY KEY,
        value text
      )
    `)
  },
  async getKey(key) {
    const { rows } = await this.db.query(`SELECT * FROM ${this.table} WHERE key = $1`, [key])
    if (rows.length > 0) {
      const [ { value } ] = rows
      return value
    }
  },
  async setKey(key, value) {
    await this.db.query(`INSERT INTO ${this.table} (key, value) VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, [key, value])
  }
})
kvRepository.init(dbUser)

const objectManager = {
  objects: new Map(),
  openedObjectsIds: {},

  set(object, source = '') {
    this.objects.set(object.id, object)
  },
  get(objectId) {
    return this.objects.get(objectId)
  },
  delete(objectId) {
    this.objects.delete(objectId)
  },
  async init(dbSystem, dbUser) {
    this.dbSystem = dbSystem
    this.dbUser = dbUser

    const value = await kvRepository.getKey('openedObjectsIds')
    if (value) {
      this.openedObjectsIds = JSON.parse(value)
    }
  },
  getOpenedObjects() {
    return this.openedObjectsIds
  },
  isObjectOpened(objectId) {
    return Boolean(this.openedObjectsIds[objectId])
  },
  openObject(object, pos) {
    this.openedObjectsIds[object.id] = pos ? pos : 1
    this.saveOpenedObjects()
  },
  openObjectWithObject(object, otherObject) {},
  closeObject(object) {
    delete this.openedObjectsIds[object.id]
    this.saveOpenedObjects()
  },
  saveOpenedObjects() {
    kvRepository.setKey('openedObjectsIds', JSON.stringify(this.openedObjectsIds))
  },
}

const renderObjectName = (object, target) => {
  const dom = mk(object.id, target)
  dom.className = 'object'

  const name = mk(null, dom)
  name.innerText = object.data.name
  name.addEventListener('click', async (e) => {
    if (objectManager.isObjectOpened(object.id)) return
    tabManager.openTab(object)
    tabManager.saveActiveTab(object.id)
    objectManager.openObject(object)
  })

  const children = mk(null, dom)
  children.className = 'children'
  children.style.marginLeft = '1em'

  return { children }
}

const runObjectCode = async (x) => {
  const { object, objectBrowser, objectManager, tabManager, 
    renderObjectName, systemObjectsRepository, userObjectsRepository } = x
  const code = `export default async ($) => { 
    ${removeExtraEscaping(object.data.code)}
  }`
  const blob = new Blob([code], { type: 'application/javascript' })
  try {
    const m = (await import(URL.createObjectURL(blob)))
    m.default({ 
      o: object, objectBrowser, objectManager, tabManager, renderObjectName, 
      systemObjectsRepository, userObjectsRepository
    })
  } catch (e) {
    console.error(e)
  }
}


if (!await kvRepository.isExists()) await kvRepository.initTable()
await objectManager.init(dbSystem, dbUser)

let mainObject
if (await systemObjectsRepository.isExists()) {
  mainObject = await systemObjectsRepository.getById('main')
  await renderObjectName(mainObject, objectBrowser.systemSection)
  await runObjectCode({ 
    object: mainObject, objectBrowser, 
    objectManager, tabManager, renderObjectName,
    systemObjectsRepository, userObjectsRepository
  })
} else {
  //import system db from dump
  console.log('need to import std data backup from backend')
  //const mainObject = await processMainObject()
}

//actually objects opened by tabManager
const openedObjects = await objectManager.getOpenedObjects()
const isMainFound = Object.keys(openedObjects).find(id => id.trim() === 'main')
if (isMainFound) tabManager.openTab(mainObject)