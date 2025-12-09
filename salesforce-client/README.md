# Salesforce Client Library (for Canvas Apps & Salesforce Connect)

This helper library lets you work with Salesforce records with a unified client that speaks SOQL and Apex in both the **DayBack Canvas App** and **Salesforce Connect** environments. Drop it into an `On Startup` app action and you're good to go: the library auto-detects where it's running, handles Salesforce Connect authentication when needed, and gives you consistent responses and errors so you can focus on building your app, not DayBack's internal plumbing.

### Benefits of this Library

* Works in both DayBack Canvas and Salesforce Connect (REST) environments.
* Environment detection and authentication handled for you.
* Async/await for top‑to‑bottom readable logic.
* Consistent response and error model across every method.

### Async/Await versus Promise Chaining

Most of our legacy examples used `.then().catch()` methodology. This can be useful when you need to run multiple Salesforce operations independently and respond to each as soon as it completes. For example, if you want to fetch several records in parallel:

```js
// Promise chaining for parallel operations
sf.query("SELECT Id FROM Contact")
  .then(resp => sf.retrieve({ sobject: "Account", id: resp.data[0].Id }))
  .then(accountResp => console.log(accountResp.data))
  .catch(e => sf.showError(e));
```

Or, using `Promise.all` to run several queries at once and wait for all results:

```js
const queries = [
  sf.query("SELECT Id FROM Contact LIMIT 1"),
  sf.query("SELECT Id FROM Account LIMIT 1"),
  sf.query("SELECT Id FROM Opportunity LIMIT 1")
];

const results = await Promise.all(queries);
results.forEach(resp => {
  if (!resp.ok) return sf.showError(resp.error);
  console.log(resp.data);
});
```

However, most of our code depends on operations executing sequentially, so that the result of one operation can be used in another. With `async/await`, you get linear flow and clean `try/catch` blocks, which make code easier to read, refactor, and debug:

```js
try {
  const contactResp = await sf.query({ soql: "SELECT Id FROM Contact LIMIT 1" });
  if (!contactResp.ok) throw contactResp.error;

  const accountResp = await sf.retrieve({ sobject: "Account", id: contactResp.data[0].Id });
  if (!accountResp.ok) throw accountResp.error;

  console.log(accountResp.data);
} catch (e) {
  sf.showError(e);
}
```

**Use async/await** when you need sequential logic and error handling.  
**Use Promise chaining or `Promise.all`** when you want to run multiple operations in parallel and handle their results together.

---
## Quick Start (New Response Object API)

The SalesforceClient library provides the following methods:

**Create Salesforce Client Instance**
```js
const sf = SalesforceClient(); // new API (object responses)
```
**Query by SOQL string**
```js
const response = await sf.query(`SELECT Id, Name FROM Contact WHERE Email = ${sf.quote(email)}`);
if (!response.ok) return sf.showError(response.error); // response.data = array of records
console.log(response.data.length, response.meta.totalSize);
```
**Query by SOQL, using Object Notation**
```js
const response = await sf.query({ 
  soql: `SELECT Id, Name FROM Contact WHERE Email = ${sf.quote(email)}` 
});
if (!response.ok) return sf.showError(response.error); // q.data = array of records
console.log(response.data.length, response.meta.totalSize);
```
**Create new record for SObject**
```js
const response = await sf.create({ 
  sobject: "Contact", 
  record: { FirstName: "Ada", LastName: "Lovelace" } 
});
const newId = response.data?.id;
```
**Update record in existing SObject**
```js
await sf.update({ 
  sobject: "Contact", 
  id: newId, 
  record: { Title: "CTO" } 
});
```
**Retrieve selected fields from an SObject**
```js
const response = await sf.retrieve({ 
  sobject: "Contact", 
  id: newId, 
  fields: ["Id","Name","Title"] 
});
```
**Apex REST API Call**
```js
const response = await sf.apex({ 
  method: "POST", 
  path: "/PauseSession", 
  body: { /* ... */ } 
});
```
**Composite batch**
```js
const response = await sf.batch({ 
  requests: [ 
    { 
      method: "GET", 
      url: "/sobjects/Contact/" + newId, 
      referenceId: "getContact1" 
    }
  ] 
});
```
**Compound Composite Batch**
```js
const response = await sf.compoundBatch({
   requests: [ {...}, {...}, ... ],  // array of sObject records (POST/PATCH)
   batchSize: 200,                   // max records per inner composite/sobjects (SF limit)
   envelopeSize: 25,                 // max compositeRequest items in outer batch
   method: "POST" | "PATCH",         // inferred from requests if omitted
   allOrNone: true
});
```
**Tree insert**
```js
const response = await sf.createTree({ 
  sobject: "Contact", 
  records: [
    { 
      attributes: { type:"Contact", referenceId:"ref1" }, 
      FirstName:"A", 
      LastName:"One" 
    },
    { 
      attributes: { type:"Contact", referenceId:"ref2" }, 
      FirstName:"B", 
      LastName:"Two" 
    }
  ] 
});
```
**Delete**
```js
await sf.delete({ 
  sobject: "Contact", 
  id: newId 
});
```
---
## Error Handling

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

Utilities: `sf.escapeSOQL()` / `sf.quote()`; presenter `sf.showError()`. Supports SOQL, CRUD, composite, tree, Apex REST. `sf.formatDateTime(moment)` for moment to Salesforce datetime conversion.

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
Run SOQL. Auto‑pages when `pageAll` true (default). `resp.meta` includes paging info, but blocks
execution until all pages are collected. 
```js
const q = await sf.query({ soql: `SELECT Id, Name FROM Account ORDER BY Name` });
console.log(q.data.length, q.meta.totalSize);
```

#### 🔎 `sf.bulkQuery({ soql, onRow?, delayMs?, maxPages? })`
Run multi-page version of `sf.quey()` with various pagination conrols. Please [see section below](#-bulk-query-sfbulkquery) for full documentation.

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

#### 📦 `sf.compoundBatch({ requests, allOrNone?, method?, batchSize?, envelopeSize? })`

Salesforce limits you to:

* **200 CRUD operations per `/composite/sobjects` call**, and
* **25 subrequests per outer `/composite` call**

This function automatically:

1. **Chunks your records into groups of 200**, each wrapped in `/composite/sobjects`
2. **Groups those subrequests into envelopes of 25**
3. **Executes them in sequence**, preserving order and supporting all-or-none semantics

For example:

```js
const payload = events.map(ev => ({
  attributes: { type: "Lesson__c" },
  id: ev.Id, // omit for POST
  Status__c: "Scheduled",
  Instructor__c: ev.InstructorId
}));

const r = await sf.compoundBatch({ 
  requests: payload,
  allOrNone: true
});
```

Optional Variables

```js
const response = await sf.compoundBatch({
   requests: [ {...}, {...}, ... ],  // array of sObject records (POST/PATCH)
   batchSize: 200,                   // max records per inner composite/sobjects (SF limit)
   envelopeSize: 25,                 // max compositeRequest items in outer batch
   method: "POST" | "PATCH",         // inferred from requests if omitted
   allOrNone: true
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

#### 🕒 `sf.formatDateTime(momentObj)`
Format a moment.js object to a Salesforce-compatible time string (`HH:mm:ss.SSSZ`):

```js
const timeString = sf.formatDateTime(moment());
console.log(timeString); // e.g., '14:30:00.000+0000'
```

---
## 🆕 **Bulk Query (`sf.bulkQuery`)**

A powerful, memory-safe SOQL reader with **three usage modes**:

1. **Callback mode** — for processing each row
2. **Async iterator mode** — streaming row by row
3. **Page iterator mode** — streaming page by page
4. **Collector helper** — gather all rows into an array

#### 1. Callback mode (easy row processing)

```js
await sf.bulkQuery({
  soql: "SELECT Id, Name FROM Contact",
  onRow: row => processRow(row)   // called for each record
});
```

Async callbacks are supported:

```js
await sf.bulkQuery({
  soql,
  onRow: async row => {
    await saveToExternalSystem(row);
  }
});
```

#### 2. Async iterator — stream rows efficiently

```js
for await (const row of sf.bulkQuery({ soql })) {
  console.log(row.Id, row.Name);
}
```

Useful for:

* Very large result sets
* ETL pipelines
* Building DayBack caches
* Avoiding memory overhead from large `query()` results

#### 3. Page iterator — process SOQL pages in batches

```js
for await (const page of sf.bulkQuery.pages({ soql })) {
  console.log("Page size:", page.length);
}
```

#### 4. Collector — get all rows into a single array

```js
const rows = await sf.bulkQuery.collect({ soql });
console.log(rows.length);
```

#### Options

```ts
interface BulkQueryOptions {
  soql: string;
  onRow?: (record: any) => void | Promise<void>;
  delayMs?: number;       // throttle between pages
  maxPages?: number;      // stop early
}
```

#### Why use `bulkQuery()` instead of `sf.query()`?

| Feature                        | `sf.query()` | `sf.bulkQuery()` |
| ------------------------------ | ------------ | ---------------- |
| Automatically paginate         | Yes          | Yes              |
| Load all data into memory      | Always       | Optional         |
| Stream rows                    | No           | Yes              |
| Stream pages                   | No           | Yes              |
| Throttling between pages       | No           | Yes              |
| Safe for huge (>100k) datasets | Risky        | Excellent        |
| Callback-based processing      | No           | Yes              |

---
# Error Model

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
