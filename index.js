const mk = (id, target, tag = 'div') => {
  const el = document.createElement(tag)
  if (id) el.id = id
  target.append(el)
  return el
}

const kvRepository = {
  db: null,
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
  },
}

document.body.style.margin = 0

const { PGlite } = await import('https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/index.js')
const db = new PGlite('idb://my-pgdata')
const head = document.getElementsByTagName('head')[0]
const fontUrl = 'https://fonts.googleapis.com/css2?family';

const { promise: editorIsReady, resolve: editorIsReadyResolve } = Promise.withResolvers()
const requireScript = document.createElement('script');
requireScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.6/require.min.js'
requireScript.onload = () => {
    require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs' } })
    require(['vs/editor/editor.main'], editorIsReadyResolve)
}
document.head.append(requireScript)
await editorIsReady;

[
  `${fontUrl}=Roboto:wght@400;700&display=swap`,
  `${fontUrl}=JetBrains+Mono:wght@400;700&display=swap`
].forEach(url => {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = url
  head.appendChild(link)
});

const objectManager = {
  openedObjects: {},
  setDb(db) {
    this.db = db
  },
  async initOpenedObjects() {
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
    this.saveInDb()
  },
  openObjectWithObject(object, otherObject) {},
  closeObject(object) {
    delete this.openedObjects[object.id]
    this.saveInDb()
  },
  saveInDb() {
    this.db.query(
      `INSERT INTO kv (key, value) VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      ['openedObjects', JSON.stringify(this.openedObjects)]
    );
  },
}
objectManager.setDb(db)
await objectManager.initOpenedObjects()


const app = mk('app', document.body)
app.style.display = 'flex'
app.style.alignItems = 'flex-start'

const objectBrowserWidth = 250
const objectBrowserPadding = 8
const objectBrowser = mk('object-browser', app)
objectBrowser.style.width = objectBrowserWidth + 'px'
objectBrowser.style.height = window.innerHeight - objectBrowserPadding * 2 + 'px'
objectBrowser.style.padding = objectBrowserPadding + 'px'

objectBrowser.style.background = '#f3f3f3'
objectBrowser.style.color = '#616161'
objectBrowser.style.fontFamily = 'Roboto, monospace'

const smallHeading = mk(0, objectBrowser)
smallHeading.innerText = 'EXPLORER'
mk(0, objectBrowser, 'br')

const mainContainer = mk('main-container', app)
mainContainer.style.width = `calc(100% - ${objectBrowserWidth + objectBrowserPadding * 2}px)`

const objectsView = mk('objects-view', app)
objectsView.style.position = `absolute`

const createTabManager = (target, mk, head) => {

  let activeTab

  const tabsContainer = mk('tabs-container', target)
  const style = mk(null, head, 'style')
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

  const openTab = (object) => {
    const tab = mk(null, tabsPanel)
    tab.className = 'tab active'
    tab.setAttribute('tab-object-id', object.id)

    const name = mk(null, tab)
    name.className = 'tab-name'
    name.innerText = object.data.name
    name.style.marginRight = '3px'
    
    const closeTabBtn = mk('close-tab-btn', tab)
    closeTabBtn.addEventListener('click', (e) => {

      e.stopPropagation()

      const tabs = tabsPanel.children
      const activeTabIndex = Array.from(tabs).indexOf(tab)

      let tabForActivation
      const nextTab = activeTabIndex > 0 
        ? tabs[activeTabIndex - 1]
        : tabs[activeTabIndex + 1];
      if (nextTab) {
        const nextTabView = tabsView.querySelector(`[tab-view-object-id="${nextTab.getAttribute('tab-object-id')}"]`);
        tabForActivation = { tab: nextTab, tabView: nextTabView };
      }
      closeTab({ tab, tabView })
      objectManager.closeObject(object)

      if (tabForActivation) activateTab(tabForActivation)
    })
    closeTabBtn.innerHTML += `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"></path>
      </svg>
    `
    
    const tabView = mk(null, tabsView)
    tabView.className = 'tab-view'
    tabView.setAttribute('tab-view-object-id', object.id)

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
      if (!object.id || object.id.trim() !== 'main') {
        return
      }
      const pos = editor.getPosition()
      objectManager.openObject(object, pos)
      
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
const tabManager = createTabManager(mainContainer, mk, head)

//todo send this to main script
const renderObjectName = (object, target) => {
  const dom = mk(object.id, target)
  dom.className = 'object'

  const name = mk(null, dom)
  name.innerText = object.data.name
  name.addEventListener('click', async (e) => {
    if (objectManager.openedObjects[object.id]) return
    tabManager.openTab(object)
    objectManager.openObject(object)
  })

  const internal = mk(null, dom)
  internal.className = 'internal-objects'
  internal.style.marginLeft = '1em'

  return { internal }
}

const runObject = async (x) => {
  const { object, db, objectBrowser, objectManager, tabManager, renderObjectName } = x
  const code = `export default async ($) => { 
    ${object.data.code}
  }`
  const blob = new Blob([code], { type: 'application/javascript' })
  try {
    const m = (await import(URL.createObjectURL(blob)))
    m.default({ o: object, db, objectBrowser, objectManager, tabManager, runObject, renderObjectName })
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
  await renderObjectName(mainObject, objectBrowser)
  await runObject({ object: mainObject, db, objectBrowser, objectManager, tabManager, renderObjectName })

  return mainObject
}

const mainObject = await processMainObject()

const openedObjects = await objectManager.getOpenedObjects(mainObject)
console.log(openedObjects)


for (const objectId in openedObjects) {
  if (objectId.trim() === 'main') {
    tabManager.openTab(mainObject)
  }
}
