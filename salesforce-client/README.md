# Salesforce Client Library (for Canvas Apps & Salesforce Connect)

This helper library lets you work with Salesforce records with a unified client that speaks SOQL and Apex in both the **DayBack Canvas App** and **Salesforce Connect** environments. Drop it into an `On Startup` app action and you're good to go: the library auto-detects where it's running, handles Salesforce Connect authentication when needed, and gives you consistent responses and errors so you can focus on building your app, not DayBack's internal plumbing.

### Benefits of this Library

* Works in both DayBack Canvas and Salesforce Connect (REST) environments.
* Environment detection and authentication handled for you.
* Async/await for top‑to‑bottom readable logic.
* Consistent response and error model across every method.

### Async/Await versus Promise Chaining

Most of our legacy examples used `.then().catch()` methodology. This can be useful if we need to run
multiple Salesforce operations at once and respond to each asynchronously. However, most of our code depends on code executing sequentially, so that the result of one operation can be used in another. With `async/await` methodology, you get linear flow and clean `try/catch` blocks, which make code easier to read, refactor, and debug.

---
## Quick Start (New Response Object API)

The SalesforceClient library provides the methods

```js
const sf = SalesforceClient(); // new API (object responses)

// Calling by string (SOQL only)
const response = await sf.query(`SELECT Id, Name FROM Contact WHERE Email = ${sf.quote(email)}`);
if (!response.ok) return sf.showError(response.error); // response.data = array of records
console.log(response.data.length, response.meta.totalSize);

// Query by Object Notation
const response = await sf.query({ soql: `SELECT Id, Name FROM Contact WHERE Email = ${sf.quote(email)}` });
if (!response.ok) return sf.showError(response.error); // q.data = array of records
console.log(response.data.length, response.meta.totalSize);

// Create
const response = await sf.create({ sobject: "Contact", record: { FirstName: "Ada", LastName: "Lovelace" } });
const newId = response.data?.id;

// Update
await sf.update({ sobject: "Contact", id: newId, record: { Title: "CTO" } });

// Retrieve selected fields
const response = await sf.retrieve({ sobject: "Contact", id: newId, fields: ["Id","Name","Title"] });

// Apex REST
const response = await sf.apex({ method: "POST", path: "/PauseSession", body: { /* ... */ } });

// Composite batch
const response = await sf.batch({ requests: [ { method: "GET", url: "/sobjects/Contact/" + newId, referenceId: "getC" } ] });

// Tree insert
const response = await sf.createTree({ sobject: "Contact", records: [
  { attributes:{ type:"Contact", referenceId:"ref1" }, FirstName:"A", LastName:"One" },
  { attributes:{ type:"Contact", referenceId:"ref2" }, FirstName:"B", LastName:"Two" }
] });

// Delete
await sf.delete({ sobject: "Contact", id: newId });
```

---
## Error Handling

Use `try/catch` (default throws) or inspect response objects when `errorMode: "return"`.

### Default (throws)
```js
const sf = SalesforceClient();
try {
  const q = await sf.query({ soql: "SELECT Id FROM Contact LIMIT 1" });
  await sf.update({ sobject: "Contact", id: q.data[0].Id, record: { Title: "CTO" } });
} catch (e) {
  sf.showError(e);
}
```

### Non‑throw mode
```js
const sf = SalesforceClient({ errorMode: "return" });
const resp = await sf.query({ soql: "SELECT Id FROM Contact LIMIT 1" });
if (!resp.ok) return sf.showError(resp.error);

const resp2 = await sf.update({ sobject: "Contact", id: resp.data[0].Id, record: { Title: "CTO" } });
if (!resp2.ok) return sf.showError(resp2.error);
```

---
## Response Object Shape

Each call returns this object:

```ts
interface SfResponse<T=any> {
  ok: boolean;             // true if HTTP 2xx
  status: number;          // HTTP status
  data: T;                 // mapped payload (records array, result object, etc.)
  raw: any;                // original Salesforce payload
  error?: { message: string; code?: string }; // present if !ok
  method: string;          // HTTP verb used
  url: string;             // full request URL
  source: string;          // 'canvas' | 'rest'
  meta?: Record<string,any>; // extra context (query paging, etc.)
}
```

Utilities: `sf.escapeSOQL()` / `sf.quote()`; presenter `sf.showError()`. Supports SOQL, CRUD, composite, tree, Apex REST.

---
## Basic Usage

```js
const sf = SalesforceClient(); // auto-detect environment

const q = await sf.query({ soql: `SELECT Id, Name FROM Contact WHERE Email = ${sf.quote("ada@example.com")}` });
if (!q.ok) return sf.showError(q.error);

await sf.update({ sobject: "Contact", id: q.data[0].Id, record: { Title: "Macrodata Refiner" } });
```

> Use `sf.showError(e)` in Canvas/DayBack to surface errors elegantly.

---
## Modes

### Auto (default)
Detects Canvas if `Sfdc.canvas` and `fbk.context()` present; otherwise uses REST.
```js
const sf = SalesforceClient(); // or SalesforceClient({ mode: "auto" })
```

### Force Canvas
```js
const sf = SalesforceClient({ mode: "canvas" });
```

### Force REST (Salesforce Connect)
```js
const sf = SalesforceClient({ mode: "rest", sfApi });
```

---
## Auto‑Auth (REST mode)

If `sfApi.settings.restURL` or `sfApi.settings.token` are missing, the client:
1. Calls `sfApi.auth(userId, sourceId, ...)`
2. Polls until `restURL` and `token` are available (default 15s timeout)
3. Retries once on `401 / INVALID_SESSION_ID`

Config example:
```js
const sf = SalesforceClient({
  mode: "rest",
  sfApi,
  auth: {
    userId: "USER_ID_OPTIONAL",
    sourceId: "SALESFORCE_CONNECT_SOURCE_ID_OPTIONAL",
    immediate: true,
    pollIntervalMs: 500,
    timeoutMs: 15000
  }
});
```

---
## API Reference (Object Signatures)

All methods return an `SfResponse`.

#### 🔎 `sf.query({ soql, pageAll? })`
Run SOQL. Auto‑pages when `pageAll` true (default). `resp.meta` includes paging info.
```js
const q = await sf.query({ soql: `SELECT Id, Name FROM Account ORDER BY Name` });
console.log(q.data.length, q.meta.totalSize);
```

#### 📥 `sf.retrieve({ sobject, id, fields? })`
Fetch a record by Id with optional field selection.
```js
const r = await sf.retrieve({ sobject: "Account", id: "001xx000000123A", fields: ["Id","Name"] });
```

#### ➕ `sf.create({ sobject, record })`
Create. `resp.data` includes Salesforce create payload (`id`, `success`, `errors`).
```js
const c = await sf.create({ sobject: "Contact", record: { FirstName: "Ada", LastName: "Lovelace" } });
```

#### ✏️ `sf.update({ sobject, id, record })`
Update (status usually 204).
```js
await sf.update({ sobject: "Contact", id: c.data.id, record: { Title: "CTO" } });
```

#### 🔁 `sf.upsert({ sobject, externalIdField, externalIdValue, record })`
Create or update based on external Id.
```js
await sf.upsert({ sobject: "Contact", externalIdField: "Email", externalIdValue: "ada@example.com", record: { LastName: "Unknown" } });
```

#### 🗑️ `sf.delete({ sobject, id })`
Delete by Id.
```js
await sf.delete({ sobject: "Contact", id: c.data.id });
```

#### 📦 `sf.batch({ requests, allOrNone?, collateSubrequests? })`
Composite Batch (≤25). Each request: `{ method, url, referenceId?, body? }`. `url` relative to `/services/data/vXX.X`.
```js
const b = await sf.batch({
  requests: [
    { method: "GET", url: "/sobjects/Contact/" + c.data.id, referenceId: "getC" },
    { method: "PATCH", url: "/sobjects/Contact/" + c.data.id, referenceId: "updC", body: { Title: "Updated via Composite" } }
  ],
  allOrNone: false
});
```

#### 🌳 `sf.createTree({ sobject, records, chunkSize? })`
Tree insert in batches (`chunkSize` default 200). Returns array of chunk payloads.
```js
const t = await sf.createTree({ sobject: "Contact", records: [
  { attributes:{ type:"Contact", referenceId:"ref1" }, FirstName:"A", LastName:"One" },
  { attributes:{ type:"Contact", referenceId:"ref2" }, FirstName:"B", LastName:"Two" }
] });
```

#### ⚡ `sf.apex({ method, path, params?, body? })`
Call Apex REST endpoint at `/services/apexrest`.
```js
const a = await sf.apex({ method: "POST", path: "/MyApexClass", body: { contactId: c.data.id } });
```

#### 🔤 `sf.escapeSOQL(value)` / `sf.quote(value)`
Escape a literal for SOQL.
```js
const email = sf.quote("ada@example.com");
await sf.query({ soql: `SELECT Id FROM Contact WHERE Email = ${email}` });
```

#### 🚨 `sf.showError(error)`
Show errors with appropriate UI affordance in Canvas.
```js
try { await sf.update({ sobject:"Contact", id:c.data.id, record:{ Title:"CTO" } }); } catch(e) { sf.showError(e); }
```

---
## Error Model

Thrown errors (or `resp.error` in return mode) include:
* `httpStatus`
* `code` (Salesforce error code)
* `message`
* `payload` (raw response)
* `method`, `url`, `source`

### Common statuses (how to react)

| HTTP | Typical causes (example codes) | Suggested handling |
|-----:|--------------------------------|--------------------|
| 200  | OK (GET/query)                  | ✓ |
| 201  | Created (POST /sobjects)        | ✓ |
| 204  | No Content (PATCH/DELETE)       | ✓ |
| 300  | Upsert external Id conflict     | Ask user to disambiguate |
| 400  | MALFORMED_QUERY, validation     | Fix SOQL/body; toast via showError |
| 401  | INVALID_SESSION_ID              | Auto‑retry then re‑auth |
| 403  | INSUFFICIENT_ACCESS, limits     | Inform about perms/limits |
| 404  | Wrong URL or version            | Check endpoint base/version/object |
| 405  | Method not allowed              | Automatic verb override handled |
| 415  | Unsupported media type          | Ensure JSON body & contentType |
| 429  | Too many requests               | Backoff/retry |
| 500/503 | Server errors                | Modal + retry option |
| 207  | Composite multi-status          | Inspect per-part results |
