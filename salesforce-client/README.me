# Salesforce Client for Canvas & Salesforce Connect REST

A tiny, dependency‑free client that unifies Salesforce REST calls across two environments:

- **Canvas apps** (via `Sfdc.canvas.client.ajax`)
- **Salesforce Connect / external apps** (via `sfApi.ajaxRequest`)

It auto‑detects the environment, **auto‑authenticates** in REST mode (if needed). It also standardizes responses and errors, and using the async/await architecture for clean and predictable flow control.

---

## Important Notes

- **Single API** for Canvas and REST - no need to use fbk.client() / Sfdc or sfApi flow control
- **Auto‑auth (REST mode):** acquires authentication token automatically if not available
- **Simple tuples:** every call returns `[rawResponseObject, data]`
- **Rich errors:** thrown with `httpStatus`, `code`, `message`, `payload`, `method`, `url`, `source`
- **Batteries included:** SOQL (`query`), CRUD (`create`, `retrieve`, `update`, `delete`, `upsert`), Composite (`batch`, `createTree`), Apex REST (`apex`)
- **Helpers:** `escapeSOQL` (also available on the client as `sf.quote`), `showError` presenter for DayBack client interface


---

## Quick Start Library Synopsis

```js

const sf = SalesforceClient(); // Get a new client.

const [resp, rows] = await sf.query(`SELECT Id, Name FROM Contact WHERE Email = ${escapeSOQL(email)}`);
const [r2, ins]   = await sf.create("Contact", { FirstName: "Ada", LastName: "Lovelace" });
const [r3]        = await sf.update("Contact", ins.id, { Title: "CTO" });
const [r4, got]   = await sf.retrieve("Contact", ins.id, ["Id","Name","Title"]);
const [r5, res]   = await sf.apex("POST", "/PauseSession", { body: { /* ... */ } });
const [r6, out]   = await sf.batch([ { method:"GET", url:"/sobjects/Contact/" + ins.id, referenceId:"c1" } ]);
const [r7, trees] = await sf.createTree("Contact", [ { attributes:{type:"Contact", referenceId:"ref1"}, FirstName:"A", LastName:"One" } ]);
const [r8]        = await sf.delete("Contact", ins.id);
```

## Basic Usage

```js
// Autodetect Canvas vs REST (Salesforce Connect) at runtime:
const sf = SalesforceClient();

// Run a SOQL query (all pages by default)
const [resp, rows] = await sf.query(`
  SELECT Id, Name
  FROM Contact
  WHERE Email = ${sf.quote("ada@example.com")}
`);

// Update a record
await sf.update("Contact", rows[0].Id, { Title: "CTO" });
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

You can pass `userId` / `sourceId` explicitly, or the library will attempt to discover them from `seedcodeCalendar` / `sc`:

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

### `query(soql: string, options?: { pageAll?: boolean })`
Run a SOQL query. If `pageAll` is `true` (default), it follows `nextRecordsUrl` to collect all rows.

```js
const [resp, rows] = await sf.query(`
  SELECT Id, Name
  FROM Account
  ORDER BY Name
`, { pageAll: true });
```

### `retrieve(sobject: string, id: string, fields?: string[])`
Get a record by Id, optionally limiting returned fields.

```js
const [r, account] = await sf.retrieve("Account", "001xx000000123A", ["Id","Name"]);
```

### `create(sobject: string, body: object)`
Create a record. Returns `{ id, success, errors }` as `data`.

```js
const [r, contact] = await sf.create("Contact", { FirstName: "Ada", LastName: "Lovelace" });
```

### `update(sobject: string, id: string, body: object)`
Update a record. `rawResponse.status` is typically **204**. You don't necessarily need to inspect the response if you are in a try catch structure. The try catch will automatically capture errors while ensuring normal flow control otherwise.

```js
const [r] = await sf.update("Contact", out.id, { Title: "CTO" });

// or 

try {
    await sf.update("Contact", out.id, { Title: "CTO" });
} catch(e) {
    sf.showError(e);  
}
```

### `upsert(sobject: string, externalIdField: string, externalIdValue: string, body: object)`
Upsert by external Id. Status **201** (created) or **204** (updated).

```js
await sf.upsert("Contact", "Email", "ada@example.com", { LastName: "Unknown" });
```

### `delete(sobject: string, id: string)`
Delete a record. Status **204**.

```js
await sf.delete("Contact", out.id);
```

### `batch(requests: CompositeRequest[], options?: { allOrNone?: boolean, collateSubrequests?: boolean })`
Composite (up to 25 subrequests). Each request: `{ method, url, referenceId?, body? }`.
**Note:** `url` must be relative to `/services/data/vXX.X`.

```js
const [r, results] = await sf.batch([
  { method: "GET",   url: "/sobjects/Contact/" + out.id, referenceId: "getC" },
  { method: "PATCH", url: "/sobjects/Contact/" + out.id, referenceId: "updC",
    body: { Title: "Updated via Composite" } }
], { allOrNone: false });
```

### `createTree(sobject: string, records: object[], options?: { chunkSize?: number })`
Composite Tree insert (default chunk 200).

```js
const records = [
  { attributes: { type: "Contact", referenceId: "ref1" }, FirstName: "A", LastName: "One" },
  { attributes: { type: "Contact", referenceId: "ref2" }, FirstName: "B", LastName: "Two" }
];
const [r, payloads] = await sf.createTree("Contact", records);
```

### `apex(method: "GET"|"POST"|"PATCH"|"DELETE"|"PUT", path: string, init?: { params?: object, body?: object })`
Call your Apex REST endpoints at `/services/apexrest`.

```js
const [, data] = await sf.apex("POST", "/MyApexClass", { body: { contactId: "003xx000..." } });
```

### `escapeSOQL(value: any)` / `sf.quote(value: any)`
Escape a string literal for SOQL: `O'Neil` → `'O\'Neil'`.

```js
const email = sf.quote("ada@example.com");
await sf.query(`SELECT Id FROM Contact WHERE Email = ${email}`);
// or
await sf.query(`SELECT Id FROM Contact WHERE Email = ${sf.quote(email)}`);
```

### `showError(err: Error)`
Convenience presenter for DayBack/Canvas:
- 4xx → `utilities.showMessage(...)` (toast)
- others → `utilities.showModal(...)`

```js
try {
  await sf.update("Contact", out.id, { Title: "CTO" });
} catch (e) {
  sf.showError(e);
}
```

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

