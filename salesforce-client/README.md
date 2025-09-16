# Salesforce Client Library (for Canvas Apps & Salesforce Connect)

If you build on top of the **DayBack Salesforce Canvas App**, or **Salesforce Connect**, this helper library lets you work with Salesforce records with a unified client that speaks SOQL and Apex in both environments. Drop it into an `On Startup` app action and you're good to go: the library auto-detects where it's running, handles authentication when needed, and gives you consistent responses and errors so you can focus on your app, not DayBack's plumbing.

### Why you’ll like it

* All API calls works both in DayBack's Canvas app and over Salesforce Connect (REST endpoint).
* Environment detection and authentication are handled for you.
* Uses async/await, so your logic reads top-to-bottom like synchronous code.
* Standardized handling for success and failure to make code straightforward.

### Async/Await versus Promise Chaining

Most of our legacy sample code leans on `.then().catch()` promise chains. Those can get gnarly fast—especially when you're doing multi-step operations or branching error paths. This can lead to nested callbacks and harder-to-read code. With `async/await`, you get simple, linear flow and clear `try/catch` handling, which makes your Salesforce code easier to read, maintain, and debug.

---

## Quick Start Library Synopsis

Here's a brief overview of the functions available in this library:
```js

const sf = SalesforceClient(); // Get a new client.

const [r1, rows]  = await sf.query(`SELECT Id, Name FROM Contact WHERE Email = ${escapeSOQL(email)}`);
const [r2, ins]   = await sf.create("Contact", { FirstName: "Ada", LastName: "Lovelace" });
const [r3]        = await sf.update("Contact", ins.Id, { Title: "CTO" });
const [r4, got]   = await sf.retrieve("Contact", ins.Id, ["Id","Name","Title"]);
const [r5, res]   = await sf.apex("POST", "/PauseSession", { body: { /* ... */ } });
const [r6, out]   = await sf.batch([ { method:"GET", url:"/sobjects/Contact/" + ins.Id, referenceId:"c1" } ]);
const [r7, trees] = await sf.createTree("Contact", [ 
    { attributes:{type:"Contact", referenceId:"ref1"}, FirstName:"A", LastName:"One" },
    { attributes:{type:"Contact", referenceId:"ref2"}, FirstName:"B", LastName:"Two" } 
]);
const [r8]        = await sf.delete("Contact", ins.Id);
```

## Error Handling

All of these operations can be ran with a `try/catch` or manual workflow:

#### Default (throw):

```js
const sf = SalesforceClient(); // throw
try {
  const [, rows] = await sf.query("SELECT Id FROM Contact LIMIT 1");
  await sf.update("Contact", rows[0].Id, { Title: "CTO" });
} catch (err) {
  sf.showError(err); // err = { status: ..., code: ..., message: ... }
}
```

#### Manual handling (no throws):

```js
const sf = SalesforceClient({ errorMode: "return" });

const [qRes, rows] = await sf.query("SELECT Id FROM Contact LIMIT 1");
if (!qRes.ok) return sf.showError({ httpStatus: qRes.status, message: qRes.error?.message, code: qRes.error?.code });

const [uRes] = await sf.update("Contact", rows[0].Id, { Title: "CTO" });
if (!uRes.ok) return utilities.showMessage(`${uRes.status} ${uRes.error?.code}: ${uRes.error?.message}`, 0, 6000);
```

## Important Notes

All API calls return simple *tuples* in the form `[rawResponseObject, payload]`, making it easy to work with responses. Errors are rich and informative, including details such as `httpStatus`, Salesforce error `code`, `message`, `payload`, and request context (`method`, `url`, `source`). You always have the option to accept only one of the *duples* as follows:

```js
const [responseObject, records] = await sf.query(...);  // Get response details, and records
const [, records]               = await sf.query(...);  // Get only the results
const [responseObject]          = await sf.update(...); // Get only the response details
await sf.update(...);                                   // Get neither, and use try/catch to interact with response

```

The library is fully featured, supporting SOQL queries, all CRUD operations, composite requests, and Apex REST calls. It also includes helpful utilities like `escapeSOQL` (also available as `sf.quote`) for building queries, and a `showError` presenter function for automatically displaying errors as a toast or a popover.

## Basic Usage

```js
// Autodetect Canvas vs REST (Salesforce Connect) at runtime:
const sf = SalesforceClient();

// Run a SOQL query 
const [resp, rows] = await sf.query(`
  SELECT Id, Name
  FROM Contact
  WHERE Email = ${sf.quote("ada@example.com")}
`);

// Update a record
await sf.update("Contact", rows[0].Id, { Title: "Macrodata Refiner" });
```

> In DayBack/Canvas, errors can be presented with `sf.showError(e)` which uses `utilities.showMessage` / `utilities.showModal`. Errors are also logged to the console.

---

## Modes

### Auto (default)

Detects Canvas if `Sfdc.canvas` and `fbk.context()` are present; otherwise uses REST via `sfApi.ajaxRequest`.

```js
const sf = SalesforceClient(); // or SalesforceClient({ mode: "auto" })
```

### Force Canvas

```js
const sf = SalesforceClient({ mode: "canvas" });
```

### Force REST (Salesforce Connect)

```js
const sf = SalesforceClient({
  mode: "rest",
  sfApi, // must be available globally
  // optional: override API version or restURL/token (not needed if sfApi is configured)
});
```

---

## Auto‑Auth (REST mode)

If `sfApi.settings.restURL` or `sfApi.settings.token` are missing, the client will:

1. Call `sfApi.auth(userId, sourceId, ...)`
2. Poll until both `restURL` and `token` are available (default 15s timeout)
3. Retry once automatically on `401 / INVALID_SESSION_ID`

This is automatic. However, you can pass `userId` / `sourceId` explicitly, or the library will attempt to discover them from the `seedcodeCalendar` object.

```js
const sf = SalesforceClient({
  mode: "rest",
  sfApi,
  auth: {
    userId:    "USER_ID_OPTIONAL",
    sourceId:  "SALESFORCE_CONNECT_SOURCE_ID_OPTIONAL",
    immediate: true,
    pollIntervalMs: 500,
    timeoutMs: 15000
  }
});
```

---

## API Reference

All methods return a tuple: **`[rawResponse, data]`**. On error, a rich `Error` is thrown.

#### 🔎 `sf.query(soql: string, options?: { pageAll?: boolean })`
> Run a SOQL query. If `pageAll` is `true` (default), it follows `nextRecordsUrl` to collect all rows. The second paramter is optional.
> 
> ```js
> const [resp, rows] = await sf.query(`
>   SELECT Id, Name
>   FROM Account
>   ORDER BY Name
> `, { pageAll: true });
> ```

#### 📥 `sf.retrieve(sobject: string, id: string, fields?: string[])`
> Get a record by `Id`, optionally limiting returned fields.
> 
> ```js
> const [r, account] = await sf.retrieve("Account", "001xx000000123A", ["Id","Name"]);
> ```

#### ➕ `sf.create(sobject: string, body: object)`
> Create a record. Returns `{ id, success, errors }` as `data`.
> 
> ```js
> const [r, contact] = await sf.create("Contact", { FirstName: "Ada", LastName: "Lovelace" });
> ```

#### ✏️ `sf.update(sobject: string, id: string, body: object)`
> Update a record. `r.status` is typically **204**. You don't necessarily need to inspect the response if you  are in a `try/catch` structure. The `try/catch` will automatically capture errors while ensuring normal flow control otherwise.
> 
> ```js
> const [r] = await sf.update("Contact", out.id, { Title: "CTO" });
> 
> // or 
> 
> try {
>     await sf.update("Contact", out.id, { Title: "CTO" });
> } catch(e) {
>     sf.showError(e);  
> }
> ```

#### 🔁 `sf.upsert(sobject: string, externalIdField: string, externalIdValue: string, body: object)`
> Upsert by external `Id`. Status **201** (created) or **204** (updated).
> 
> ```js
> await sf.upsert("Contact", "Email", "ada@example.com", { LastName: "Unknown" });
> ```

#### 🗑️ `sf.delete(sobject: string, id: string)`
> Delete a record. Status **204**.
> 
> ```js
> await sf.delete("Contact", out.id);
> ```

#### 📦 `sf.batch(requests: CompositeRequest[], options?: { allOrNone?: boolean, collateSubrequests?: boolean })`
Executes a Salesforce Composite API batch request with up to 25 subrequests. Each subrequest is an object containing `method`, `url`, optional `referenceId`, and optional `body`.

- **requests**: Array of subrequest objects. Each object must specify:
  - `method`: HTTP method (e.g., "GET", "PATCH").
  - `url`: Relative to `/services/data/vXX.X`.
  - `referenceId` (optional): A unique string identifier for the subrequest. This allows you to reference the result of one subrequest in subsequent subrequests within the same batch, enabling dependencies between operations.
  - `body` (optional): Request payload for methods like "PATCH" or "POST".
- **options** (optional):
  - `allOrNone`: If `true`, all subrequests succeed or all fail as a single transaction.
  - `collateSubrequests`: If `true`, groups subrequests by type for efficiency.

**Note:** The `referenceId` is especially useful for chaining requests, as it allows later subrequests to refer to the results of earlier ones within the same batch.
> Composite (up to 25 subrequests). Each request: `{ method, url, referenceId?, body? }`.
> **Note:** `url` must be relative to `/services/data/vXX.X`.
> 
> ```js
> const [r, results] = await sf.batch([
>   { method: "GET",   url: "/sobjects/Contact/" + out.id, referenceId: "getC" },
>   { method: "PATCH", url: "/sobjects/Contact/" + out.id, referenceId: "updC",
>     body: { Title: "Updated via Composite" } }
> ], { allOrNone: false });
> ```

#### 🌳 `sf.createTree(sobject: string, records: object[], options?: { chunkSize?: number })`
> Composite Tree insert (default chunk 200).
> 
> ```js
> const records = [
>   { attributes: { type: "Contact", referenceId: "ref1" }, FirstName: "A", LastName: "One" },
>   { attributes: { type: "Contact", referenceId: "ref2" }, FirstName: "B", LastName: "Two" }
> ];
> const [r, payloads] = await sf.createTree("Contact", records);
> ```

#### ⚡ `sf.apex(method: "GET"|"POST"|"PATCH"|"DELETE"|"PUT", path: string, init?: { params?: object, body?: object })`
> Call your Apex REST endpoints at `/services/apexrest`.
> 
> ```js
> const [, data] = await sf.apex("POST", "/MyApexClass", { body: { contactId: "003xx000..." } });
> ```

#### 🔤 `sf.escapeSOQL(value: any)` / `sf.quote(value: any)`
> Escape a string literal for SOQL: `O'Neil` → `'O\'Neil'`.
> 
> ```js
> const email = sf.quote("ada@example.com");
> await sf.query(`SELECT Id FROM Contact WHERE Email = ${email}`);
> // or
> await sf.query(`SELECT Id FROM Contact WHERE Email = ${sf.quote(email)}`);
> ```

#### 🚨 `sf.showError(err: Error)`
> Convenience presenter for DayBack/Canvas:
> - 4xx → `utilities.showMessage(...)` (toast)
> - others → `utilities.showModal(...)`
> 
> ```js
> try {
>   await sf.update("Contact", out.id, { Title: "CTO" });
> } catch (e) {
>   sf.showError(e);
> }
> ```

---

## Error Model

Every thrown error includes:

- `httpStatus` – e.g., 400, 401, 403, 404, 500
- `code` – Salesforce error code, e.g., `MALFORMED_QUERY`, `INVALID_SESSION_ID`
- `message` – human‑readable description
- `payload` – raw SF response payload (array or object)
- `method`, `url`, `source` – request context

### Common statuses (how to react)

| HTTP | Typical causes (example codes) | Suggested handling |
|-----:|--------------------------------|--------------------|
| 200  | OK (GET/query)                  | ✓ |
| 201  | Created (POST /sobjects)        | ✓ |
| 204  | No Content (PATCH/DELETE)       | ✓ |
| 300  | Upsert external Id conflict     | Ask user to disambiguate |
| 400  | `MALFORMED_QUERY`, validation   | Fix SOQL/body; toast via `showError` |
| 401  | `INVALID_SESSION_ID`            | Auto‑retry once; if still failing, re‑auth |
| 403  | `INSUFFICIENT_ACCESS`, limits   | Inform about perms/limits; reduce scope |
| 404  | Wrong URL or API version        | Check endpoint base/version/object |
| 405  | Method not allowed              | Canvas fallback to `POST + ?_HttpMethod=VERB` (handled) |
| 415  | Unsupported media type          | Send JSON body with `contentType` |
| 429  | Too many requests               | Backoff/retry |
| 500/503 | Server errors                | Modal + retry option |
| 207  | Composite (per‑part status)     | Inspect `compositeResponse[i]` and surface failures |

