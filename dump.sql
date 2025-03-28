--
-- PostgreSQL database dump
--

-- Dumped from database version 16.3 (PGlite 0.2.0)
-- Dumped by pg_dump version 16.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'SQL_ASCII';
SET standard_conforming_strings = off;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET escape_string_warning = off;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: kv; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kv (
    key character varying(26) NOT NULL,
    value text
);


ALTER TABLE public.kv OWNER TO postgres;

--
-- Name: objects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.objects (
    id character(26) NOT NULL,
    data jsonb NOT NULL,
    previous_id character(26),
    next_id character(26),
    parent_id character(26),
    internal_id character(26)
);


ALTER TABLE public.objects OWNER TO postgres;

--
-- Name: objects_operations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.objects_operations (
    id character(26) NOT NULL,
    data jsonb NOT NULL
);


ALTER TABLE public.objects_operations OWNER TO postgres;

--
-- Data for Name: objects; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.objects VALUES ('01JAB79NZ7NNB6C5H299R50D18', '{"code": "const { x, o, dom } = $\\n\\nconst header = await x.p(''addHeader'', { dom })\\n\\nawait x.p(''objectName'', { target: header, o })\\nawait x.p(''codeShowCtrl'', {\\n    in: { objectDom: dom, target: header, o }\\n})\\n\\nconst ulid = (await import(location.href + ''/module/ulid.js'')).default\\n\\nconst btn = document.createElement(''span'')\\nheader.append(btn)\\nbtn.className = ''btn''\\nbtn.style.marginLeft = ''5px''\\nbtn.innerText = ''add object''\\nbtn.style.fontFamily = ''Roboto, sans-serif''\\nbtn.addEventListener(''click'', async () => {\\n    const o = {\\n        id: ulid(),\\n        code: `\\nconst { x, o, dom } = $\\nawait x.p(''stdObjectControls'', { target: dom, o })\\n`,\\n    }\\n    const app = document.getElementById(''app'')\\n    await x.p(''renderObject'', { target: app, object: o })\\n})\\n\\n//right click show context menu\\n\\nreturn\\n\\n  const selfId = document.currentScript.getAttribute(''self-id'')\\n  const self = document.getElementById(selfId)\\n\\n  const props = self.getElementsByClassName(''props'')\\n  if (props.length > 0) {\\n      console.log(props)\\n  }\\n\\n  self.addEventListener(''getProps'', (e) => {\\n    console.log(''getProps'');\\n  });\\n\\n  const view = document.createElement(''div'')\\n  view.className = ''view''\\n  self.append(view)\\n\\n  const target = document.createElement(''input'')\\n  target.className = ''targetInput''\\n  view.append(target)\\n\\n  //const btn = document.createElement(''div'')\\n  //btn.innerText = ''trigger''\\n  //btn.style.border = ''1px solid''\\n  //btn.style.width = ''fit-content''\\n  //btn.style.cursor = ''pointer''\\n  //btn.addEventListener(''click'', (e) => {\\n  //    const data = { name: ''cat'' }\\n  //    const event = new CustomEvent(''trigger'', { detail: data});\\n\\n//      const el = document.getElementById(target.value)\\n//      if (!el) return;\\n //     el.dispatchEvent(event);\\n // })\\n\\n  view.append(btn)\\n\\n", "name": "addObject"}', '01JAB790AXWSKXZCF5W6NS868G', '01JAB7A37DGN99ANRFWSVH644R', NULL, NULL);
INSERT INTO public.objects VALUES ('01JAB7A37DGN99ANRFWSVH644R', '{"code": "const { x, o, dom } = $\\n\\nawait x.p(''stdObjectControls'', { target: dom, o })\\n\\nconst style = document.createElement(''style'')\\nstyle.innerHTML = `\\n\\n:root {\\n  --green-color: #8afd8a;\\n}\\n\\nhtml {\\n  font-size: 100%;\\n  text-size-adjust: 100%;\\n  -webkit-text-size-adjust: 100%;\\n  -moz-text-size-adjust: 100%;\\n}\\nbody {\\n    font-variant-ligatures: none;\\n    background: #3d3d3d;\\n    font-size: 1rem;\\n    color: var(--green-color);\\n}\\n.object {\\n    display: inline-block;\\n    vertical-align: top;\\n    min-width: 10px;\\n    min-height: 10px;\\n\\n    margin: 3px;\\n    padding: 10px;\\n    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1), \\n              0 6px 20px rgba(0, 0, 0, 0.1);\\n    transition: box-shadow 0.3s ease;\\n    background: rgb(80 80 80);\\n}\\n.object-name {\\n    color: var(--green-color);\\n    font-size: 1.07rem;\\n    margin-bottom: 10px;\\n    font-family: ''Roboto'', sans-serif;\\n    outline: none;\\n}\\n.object-code {\\n    margin: 0;\\n    padding-top: 0.5rem;\\n    font-size: 0.85rem;\\n    outline: none;\\n    font-family: ''JetBrains Mono'', monospace;\\n    font-weight: normal;\\n    font-style: normal;\\n    font-variant-ligatures: none;\\n}\\n.btn {\\n    padding: 1px 2px;\\n    font-family: monospace;\\n    font-size: 0.9rem;\\n    border: 2px solid var(--green-color);\\n    border-radius: 4px;\\n}\\n.btn:hover {\\n    background: var(--green-color);\\n    color: black;\\n    border: 2px solid var(--green-color);\\n    cursor: pointer;\\n}\\n.hidden { display:none; }\\n`\\n\\nconst head = document.getElementsByTagName(''head'')[0]\\nhead.append(style)\\n", "name": "css custom"}', '01JAB79NZ7NNB6C5H299R50D18', '01JEDYXHQJFMDQ2XD2178YEM28', NULL, NULL);
INSERT INTO public.objects VALUES ('01JF0KM168HK7F8WSEDHVJ52QJ', '{"code": "\\nconst { x, o, dom } = $\\n\\nawait x.p(''stdObjectControls'', { target: dom, o })\\n\\n// create object with std.btn\\n// const btn = document.createElement(''span'')\\n// target.append(btn)\\n// btn.className = ''btn''\\n// btn.innerText = ''code''\\n// btn.style.fontFamily = ''Roboto, sans-serif''\\n\\n//if there are no data in db, than init db structure and load std project. \\n//everything we need we can build on backend. (npm packages, vite), we not tie to webcontainer usage\\n\\n//add dataBrowser and editorWithTabs as classical interface\\n\\n//ability to create value object and inspect it''s interface like this is typescript\\n//with ability to static type checking with reactivity\\n\\n//ability to insert objects in objects\\n\\n//add priority or make std as array for ordering support?\\n\\n//disable script execution in context menu\\n\\n//hide std element in special std block\\n\\n//todo remove, select, mover, copy, auth, signin, signup, signout\\n\\n//ability to hide show code\\n\\n//store font and blocks in indexed db\\n\\n//for reorder need custom script, for access field via x.api() app blocks\\n\\n//todo show names of blocks or just show some icon of block (minecraft)\\n\\n//implement send messages to future blocks\\n//the same future message can be sended to not inited script blocks\\n//todo editor for styles\\n//todo elements can be loaded on backend\\n//todo defence agains destroy element with div.prepend(block)\\n\\n//todo переделать на base64 загрузку файлов", "name": "todo list"}', '01JF0DMVY1FHFEENHT3FJE87E6', '01JF0KTTCS21CHV5CDJHA6VYX5', NULL, NULL);
INSERT INTO public.objects VALUES ('01JP22650SMSN9MV9DJ5D9J7YT', '{"code": "\\nconst { x, o, dom } = $\\nawait x.p(''stdObjectControls'', { target: dom, o })\\n\\nconst { ulid } = await import(''https://cdn.jsdelivr.net/npm/ulid/+esm'')\\nconst { PGlite } = await import(''https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/index.js'');\\nconst db = new PGlite(''idb://my-pgdata'')\\n\\n\\nif (false) {\\n    const r = await db.exec(`\\n        CREATE TABLE objects (\\n            id CHAR(26) PRIMARY KEY,\\n            data JSONB NOT NULL,\\n            internal_id CHAR(26) REFERENCES objects(id) ON DELETE SET NULL,\\n            previous_id CHAR(26) REFERENCES objects(id) ON DELETE SET NULL,\\n            next_id CHAR(26) REFERENCES objects(id) ON DELETE SET NULL\\n        );\\n        CREATE TABLE objects_operations (\\n            id CHAR(26) PRIMARY KEY,\\n            data JSONB NOT NULL\\n        );\\n    `);\\n    console.log(r);\\n\\nconsole.log(await db.query(`SELECT * FROM objects`));\\n\\n} else {\\n  const object = await x.p(''getObject'', { id: ''main'' })\\n  const json = JSON.stringify(object)\\n  //console.log(await db.query(`DROP TABLE objects`));\\n  //await db.query(`INSERT INTO objects (id, data) VALUES ($1, $2);`, [''main'', json]);\\n  //await db.query(`INSERT INTO objects (id, data) VALUES ($1, $2);`, [''main2'', json]);\\n  //await db.query(`INSERT INTO objects (id, data) VALUES ($1, $2);`, [''main3'', json]);\\n  //await db.query(`INSERT INTO objects (id, data) VALUES ($1, $2);`, [ulid(), json]);\\n\\n  //console.log(await db.query(`SELECT id, data FROM objects`));\\n  //console.log(tables)\\n}\\n\\n\\n", "name": "std.storage"}', '01JF0KTTCS21CHV5CDJHA6VYX5', NULL, NULL, NULL);
INSERT INTO public.objects VALUES ('01JAB790AXWSKXZCF5W6NS868G', '{"code": "const { x, o, dom } = $\\n\\nawait x.s(o.name, async (x) => {\\n    const { dom } = x\\n\\n    const header = document.createElement(''div'')\\n    dom.prepend(header)\\n    return header\\n})\\n\\nawait x.p(''stdObjectControls'', { target: dom, o })", "name": "addHeader"}', '01JAB78517YFQYZ93J64GM4BHY', '01JAB79NZ7NNB6C5H299R50D18', NULL, NULL);
INSERT INTO public.objects VALUES ('01JEDYXHQJFMDQ2XD2178YEM28', '{"code": "const { x, o, dom } = $\\n\\nconst name = o.name\\nawait x.s(name, async (x) => {\\n    const { target, o } = x    \\n\\n    const header = await x.p(''addHeader'', { dom: target })\\n\\n    await x.p(''objectName'', { target: header, o })\\n    await x.p(''codeShowCtrl'', {\\n        in: { objectDom: target, target: header, o }\\n    })\\n\\n    return { header }\\n})\\n\\nawait x.p(''stdObjectControls'', { target: dom, o })", "name": "stdObjectControls"}', '01JAB7A37DGN99ANRFWSVH644R', '01JEEGZHFSHXWB42XXG3FNG63S', NULL, NULL);
INSERT INTO public.objects VALUES ('01JEEGZHFSHXWB42XXG3FNG63S', '{"code": "const { x, o, dom } = $\\n\\nawait x.p(''stdObjectControls'', { target: dom, o })\\n\\nconst menu = await x.p(''docMkElement'', { class: ''context-menu'' })\\n//dom.append(shadowContainer)\\n\\ndocument.body.append(menu)\\n\\n//const oShadow = shadowContainer.attachShadow({ mode: ''open'' })\\n//oShadow.append(contextMenu)\\n\\n//console.log(oShadow)\\n\\nwindow.oncontextmenu = (e) => {\\n    console.log(''test'', e.target)\\n}\\n\\n\\n", "name": "std.context-menu"}', '01JEDYXHQJFMDQ2XD2178YEM28', '01JEEW4BW4BR3MT9M1W1JPB18T', NULL, NULL);
INSERT INTO public.objects VALUES ('main                      ', '{"code": "const { x, o, dom, db } = $\\n\\nx.s(''docMkElement'', (x) => {\\n    const { id, tag, txt, html, events, css, attributes } = x\\n\\n    const o = document.createElement(tag || ''div'')\\n    if (id) o.id = id\\n    if (x[''class''])\\n      o.className = Array.isArray(x[''class''])\\n        ? x[''class''].join('' '')\\n        : x[''class'']\\n    if (txt) o.innerText = txt\\n    if (html) o.innerHTML = html\\n    if (css) for (let k in css) o.style[k] = css[k]\\n    if (attributes) for (let k in attributes) o.setAttribute(k, attributes[k])\\n    if (events) for (let k in events) o.addEventListener(k, events[k])\\n\\n    return o\\n})\\nx.s(''server.send'', async (x) => {\\n    const bin = x?.data?.bin\\n    const headers = { ''content-type'': ''application/json'' }\\n    if (bin) {\\n      headers[''content-type''] = ''application/octet-stream''\\n      headers[''bin-meta''] = JSON.stringify(x.data.binMeta)\\n    }\\n    const r = await fetch(''/'', {\\n      method: ''POST'',\\n      headers,\\n      body: bin || JSON.stringify(x),\\n    })\\n    return r.json()\\n})\\nx.s(''set'', async (x) => {\\n    if (x.repo === ''idb'') return await idb.set(x)\\n    return await x.p(''server.send'', { event: ''set'', data: x })\\n})\\nx.s(''get'', async (x) => {\\n    if (x.repo === ''idb'') return await idb.get(x)\\n    return await x.p(''server.send'', { event: ''get'', data: x })\\n})\\n\\nconst objectStorageInit = (x) => {\\n    const objects = {}\\n\\n    x.s(''getObject'', (x) => objects[x.id])\\n    x.s(''setObject'', async (x) => objects[x.o.id] = x.o)\\n    x.s(''saveObject'', async (x) => {\\n      const id = x.id\\n      const object = objects[id]\\n      if (!object) return\\n\\n      console.log(''update object in pglite'', object)\\n      //await x.p(''set'', { id, data: JSON.stringify(object) })\\n    })\\n}\\nobjectStorageInit(x)\\n\\nx.s(''objectFactory'', async (x) => {\\n    const { object } = x\\n\\n    const isObj = (o) => typeof o === ''object'' && o !== null\\n    const updateCallback = () => x.p(''saveObject'', { id: object.id })\\n    const mkObservable = (obj) => {\\n      for (const k in obj) {\\n        if (isObj(obj[k]) && k !== ''_'') {\\n          obj[k] = mkObservable(obj[k])\\n        }\\n      }\\n\\n      return new Proxy(obj, {\\n        set: (target, prop, value) => {\\n          if (isObj(value)) {\\n            value = mkObservable(value)\\n          }\\n          if (Array.isArray(target) && prop === ''length'') return true\\n\\n          //create oplog item and store it in operations, sync operation with other nodes\\n          target[prop] = value\\n\\n          if (prop === ''_'') return true\\n\\n          updateCallback()\\n          return true\\n        },\\n        deleteProperty: (target, prop) => {\\n          delete target[prop]\\n          updateCallback()\\n          return true\\n        },\\n      })\\n    }\\n\\n    return mkObservable(object)\\n})\\n\\n\\nawait x.s(''getDomById'', async (x) => document.getElementById(x.id))\\n\\nawait x.s(''subToCodeInput'', (x) => {\\n    document.addEventListener(''input'', async (e) => {\\n      const t = e.target\\n      if (!t.classList || !t.classList.contains(''object-code'')) return\\n      const id = t.getAttribute(''object-id'')\\n      if (!id || id.trim() === ''main'') return\\n\\n      const object = await x.p(''getObject'', { id })\\n      console.log(object)\\n      //object.data.code = t.innerText\\n    })\\n})\\n\\nconst insertTxtAtCursor = (txt) => {\\n    const selection = window.getSelection()\\n    if (!selection.rangeCount) return\\n\\n    const range = selection.getRangeAt(0)\\n    range.deleteContents()\\n\\n    const txtNode = document.createTextNode(txt)\\n    range.insertNode(txtNode)\\n\\n    range.setStartAfter(txtNode)\\n    range.setEndAfter(txtNode)\\n    selection.removeAllRanges()\\n    selection.addRange(range)\\n}\\n\\nawait x.s(''renderObject'', async (x) => {\\n\\n  const { target, object } = x\\n    \\n  const o = await x.p(''objectFactory'', { object })\\n  await x.p(''setObject'', { o })\\n\\n  const dom = document.createElement(''div'')\\n  dom.id = object.id\\n  dom.className = ''object''\\n  target.append(dom)\\n\\n  if (o.data && o.data.name) {\\n      const name = document.createElement(''div'')\\n      name.innerText = o.data.name\\n      name.style.fontWeight = ''bold''\\n      dom.append(name)\\n  }\\n  if (o.data && o.data.code) {\\n      const pre = document.createElement(''pre'')\\n      pre.className = ''object-code''\\n      pre.setAttribute(''contenteditable'', ''plaintext-only'')\\n      pre.setAttribute(''object-id'', object.id)\\n      pre.innerText = o.data.code\\n      pre.addEventListener(''keydown'', (e) => {\\n         if (e.key !== ''Tab'') return\\n         e.preventDefault()\\n         if (e.shiftKey) return\\n         insertTxtAtCursor(''    '')\\n      })\\n      dom.append(pre)\\n\\n      const code = `export default async ($) => { ${o.data.code}; }`\\n      const blob = new Blob([code], { type: ''application/javascript'' })\\n      try {\\n        //const m = await import(URL.createObjectURL(blob))\\n        //m.default({ x, o, dom })\\n      } catch (e) {\\n        console.error(e)\\n      }\\n  }\\n\\n  const internal = document.createElement(''div'')\\n  internal.className = ''internal-objects''\\n  internal.style.marginLeft = ''1em''\\n  dom.append(internal)\\n\\n  return { o, dom, internal }\\n})\\n\\nconst targetForRender = document.getElementById(''objectBrowser'')\\n\\nconst renderStdObjects = async (target) => {\\n    const q = `WITH RECURSIVE next_objects AS (\\n      SELECT \\n          o.*,\\n          0 AS level,\\n          ''base'' AS relation\\n      FROM objects o\\n      WHERE o.id = $1\\n      UNION ALL    \\n      SELECT\\n          o.*,\\n          no.level + 1 AS level,\\n          ''next'' AS relation\\n      FROM objects o\\n      INNER JOIN next_objects no ON o.id = no.next_id\\n    )\\n    SELECT * FROM next_objects;`;\\n\\n    const { rows } = await db.query(q, [''main''])\\n\\n    const std = rows.find((row) => row.data && row.data.name === ''std'')\\n    const { rows: stdProjectObjects } = await db.query(q, [std.internal_id])\\n\\n    //const { internal } = await x.p(''renderObject'', { target, object: std })\\n\\n    for (let i = 0; i < stdProjectObjects.length; i++) {\\n        //await x.p(''renderObject'', { target: internal, object: stdProjectObjects[i] })\\n    }\\n}\\nawait renderStdObjects(targetForRender)\\n\\n//console.log( (await db.query(''SELECT * FROM objects WHERE id = $1'', [''main''])).rows )\\n\\n//const objects = await x.p(''get'', { project: ''std'', getAll: {} })\\n//console.log(objects)\\n\\n//for (let i = 0; i < objects.length; i++) {\\n//    let object\\n//    try {\\n//       object = JSON.parse(objects[i])\\n//    } catch (e) {\\n//       console.log(e); continue\\n//    }\\n//    if (object.id === ''main'') {\\n//        continue\\n//    }\\n//    await x.p(''renderObject'', { target: app, object })\\n//}\\n\\nconst dumpDownload = async () => {\\n    const { pgDump } = await import(''https://cdn.jsdelivr.net/npm/@electric-sql/pglite-tools/dist/pg_dump.js'')\\n    const dump = await pgDump({ pg: db })\\n\\n    const a2 = document.createElement(''a'')\\n    a2.href = URL.createObjectURL(dump)\\n    a2.download = dump.name\\n    a2.click()\\n}\\n\\nconst a = document.createElement(''a'')\\na.textContent = ''export database dump in sql''\\na.style.display = ''block''\\na.href = ''#''\\na.onclick = (e) => {\\n    e.preventDefault()\\n    dumpDownload()\\n}\\ndom.prepend(a)\\n\\n//import sql from backup\\n//await pg2.exec(sql)\\n\\n\\nawait x.p(''subToCodeInput'')\\n\\nsetTimeout(() => {\\n  const scroll = localStorage.getItem(''scroll'')\\n  if (scroll) {\\n      const { x, y } = JSON.parse(scroll)\\n      window.scrollTo(x, y)\\n  }\\n  window.addEventListener(''scroll'', () => {\\n    const s = { x: window.scrollX, y: window.scrollY }\\n    localStorage.setItem(''scroll'', JSON.stringify(s))\\n  })\\n}, 250)\\n\\nreturn;\\n\\nconst header = await x.p(''addHeader'', { dom })\\nawait x.p(''objectName'', { target: header, name: ''main'' })\\n\\nawait x.p(''codeShowCtrl'', {\\n    in: { objectDom: dom, target: header, o }\\n})\\n\\n"}', NULL, '01JPDPBQ2R5FSAYD1PWYCTK4PD', NULL, NULL);
INSERT INTO public.objects VALUES ('01JPDPBQ2R5FSAYD1PWYCTK4PD', '{"name": "std"}', 'main                      ', NULL, NULL, '01JAB77AXR7SR4HEYVF7RHJ1FE');
INSERT INTO public.objects VALUES ('01JAB78517YFQYZ93J64GM4BHY', '{"code": "const { x, o, dom } = $\\n\\nawait x.s(o.name, async (x) => {\\n    const { target, name, o } = x    \\n\\n    const bName = await x.p(''docMkElement'', { tag: ''div'', class: ''object-name'' })\\n    target.append(bName)\\n\\n    if (o) {\\n        bName.innerText = o.name || ''default name''\\n    } else {\\n        bName.innerText = name        \\n    }\\n    bName.setAttribute(''contenteditable'', ''plaintext-only'')\\n    bName.addEventListener(''keyup'', () => {\\n        o.name = bName.innerText.trim()\\n    })\\n})\\n\\nawait x.p(''stdObjectControls'', { target: dom, o })", "name": "objectName"}', '01JAB77AXR7SR4HEYVF7RHJ1FE', '01JAB790AXWSKXZCF5W6NS868G', NULL, NULL);
INSERT INTO public.objects VALUES ('01JEEW4BW4BR3MT9M1W1JPB18T', '{"code": "const { x, o, dom } = $\\n\\nconst name = o.name\\nawait x.s(name, async (x) => {\\n    const { target, o } = x    \\n\\n    const header = await x.p(''addHeader'', { dom: target })\\n\\n    await x.p(''objectName'', { target: header, o })\\n    await x.p(''codeShowCtrl'', {\\n        in: { objectDom: target, target: header, o }\\n    })\\n\\n    return { header }\\n})\\n\\nawait x.p(''stdObjectControls'', { target: dom, o })\\n\\n", "name": "project.manager"}', '01JEEGZHFSHXWB42XXG3FNG63S', '01JEZWTF1KYPX7N204G25J52QA', NULL, NULL);
INSERT INTO public.objects VALUES ('01JEZWTF1KYPX7N204G25J52QA', '{"code": "//can it be totaly isolated frontend and backend function?\\n\\nconst { x, o, dom } = $\\n\\nawait x.p(''stdObjectControls'', { target: dom, o })\\n\\n//input.addEventListener(''change'', event => {\\n// const file = event.target.files[0]\\n//  if (!file) return\\n//    const reader = new FileReader()\\n//    reader.readAsArrayBuffer(file)\\n//    reader.onload = async () => {\\n//      const arrBuf = reader.result\\n//      const data = { bin: reader.result, binMeta: { name: file.name } }\\n//      await x.p(''set'', data)\\n//    }\\n//})", "name": "uploadFile"}', '01JEEW4BW4BR3MT9M1W1JPB18T', '01JF0DMVY1FHFEENHT3FJE87E6', NULL, NULL);
INSERT INTO public.objects VALUES ('01JF0DMVY1FHFEENHT3FJE87E6', '{"code": "const { x, o, dom } = $\\n\\n//\\n\\nawait x.p(''stdObjectControls'', { target: dom, o })", "name": "account"}', '01JEZWTF1KYPX7N204G25J52QA', '01JF0KM168HK7F8WSEDHVJ52QJ', NULL, NULL);
INSERT INTO public.objects VALUES ('01JF0KTTCS21CHV5CDJHA6VYX5', '{"code": "\\nconst { x, o, dom } = $\\nawait x.p(''stdObjectControls'', { target: dom, o })\\n\\n//every object can be with docs", "name": "std.get started (docs)"}', '01JF0KM168HK7F8WSEDHVJ52QJ', '01JP22650SMSN9MV9DJ5D9J7YT', NULL, NULL);
INSERT INTO public.objects VALUES ('01JAB77AXR7SR4HEYVF7RHJ1FE', '{"code": "const { x, o, dom } = $\\n\\nconst name = ''codeShowCtrl''\\n\\nawait x.s(name, async (x) => {\\n    if (x.in) {\\n        const { objectDom, target, o, forceShow } = x.in\\n        if (!o) return\\n\\n        const objectCode = objectDom.getElementsByClassName(''object-code'')[0]\\n\\n        const btn = document.createElement(''span'')\\n        target.append(btn)\\n        btn.className = ''btn''\\n        btn.innerText = ''code''\\n        btn.style.fontFamily = ''Roboto, sans-serif''\\n\\n        if (!o.showCode) {\\n            objectCode.classList.add(''hidden'')\\n        }\\n        if (forceShow) {\\n            objectCode.classList.remove(''hidden'')\\n        }\\n        btn.addEventListener(''pointerdown'', async (e) => {\\n            if (o.showCode) {\\n                delete o.showCode                \\n                objectCode.classList.add(''hidden'')\\n            } else {\\n                o.showCode = true\\n                objectCode.classList.remove(''hidden'')\\n            }\\n        })\\n    }\\n})\\n\\nconst header = await x.p(''addHeader'', { dom })\\n\\nawait x.p(''objectName'', { target: header, name })\\nawait x.p(''codeShowCtrl'', {\\n    in: { objectDom: dom, target: header, o }\\n})\\n", "showCode": true}', NULL, '01JAB78517YFQYZ93J64GM4BHY', '01JPDPBQ2R5FSAYD1PWYCTK4PD', NULL);


--
-- Data for Name: objects_operations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Name: kv kv_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kv
    ADD CONSTRAINT kv_pkey PRIMARY KEY (key);


--
-- Name: objects_operations objects_operations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.objects_operations
    ADD CONSTRAINT objects_operations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: objects objects_internal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.objects
    ADD CONSTRAINT objects_internal_id_fkey FOREIGN KEY (internal_id) REFERENCES public.objects(id) ON DELETE SET NULL;


--
-- Name: objects objects_next_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.objects
    ADD CONSTRAINT objects_next_id_fkey FOREIGN KEY (next_id) REFERENCES public.objects(id) ON DELETE SET NULL;


--
-- Name: objects objects_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.objects
    ADD CONSTRAINT objects_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.objects(id) ON DELETE SET NULL;


--
-- Name: objects objects_previous_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.objects
    ADD CONSTRAINT objects_previous_id_fkey FOREIGN KEY (previous_id) REFERENCES public.objects(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

