// Salesforce Client for Canvas and Salesforce Connect - v2.0 (Object Response API)
//
// Purpose:
// Unified client for Salesforce API calls in both Canvas (Sfdc.canvas.client.ajax)
// and Salesforce Connect REST (sfApi.ajaxRequest). Auto-detects environment and
// self-authenticates in REST mode if token / restURL are missing.
//
// Full docs & migration guide:
//   https://github.com/seedcode/dayback-extensions-library/tree/main/salesforce-client
//
// New Usage (single options object + single response object):
// -----------------------------------------------------------
//   const sf = SalesforceClient();
//
//   // Calling by object
//
//   const r = await sf.query({ soql: `SELECT Id, Name FROM Contact WHERE Email = ${sf.quote(email)}` });
//   if (!r.ok) return sf.showError(r.error);
//
//   // Calling by string (SOQL only)
//
//   const r = await sf.query(`SELECT Id, Name FROM Contact WHERE Email = ${sf.quote(email)`);
//
//   // All other calls use object notation:
//
//   const r = await sf.create({ sobject: "Contact", record: { FirstName: "Ada", LastName: "Lovelace" } });
//   await sf.update({ sobject: "Contact", id: r.data.id, record: { Title: "CTO" } });
//   const r = await sf.retrieve({ sobject: "Contact", id: r.data.id, fields: ["Id","Name","Title"] });
//   const r = await sf.apex({ method: "POST", path: "/PauseSession", body: { /* ... */ } });
//   const r = await sf.batch({ requests: [ { method: "GET", url: "/sobjects/Contact/" + r.data.id, referenceId: "getC" } ] });
//   await sf.delete({ sobject: "Contact", id: r.data.id });
//
// Helper functions:
//   sf.escapeSOQL(value) / sf.quote(value) - escape string literal for SOQL
//   sf.showError(error)  - present errors via toast or modal in Canvas
//
// Response Object Shape:
//   { ok, status, data, raw, error?, method, url, source, meta? }
//   - ok: boolean (HTTP success)
//   - data: mapped payload (records, create result, etc.)
//   - raw: original Salesforce response body
//   - error: { message, code? } if not ok (or thrown Error when errorMode="throw")
//   - meta: query paging info (totalSize, done, pageCount, nextRecordsUrl, soql)
//
// Error Handling:
// ---------------
// Default (throws):
//   try {
//     const q = await sf.query({ soql: `SELECT Id, Name FROM Contact WHERE Email = ${sf.quote(email)}` });
//     await sf.update({ sobject: "Contact", id: q.data[0].Id, record: { Custom_Field__c: "value" } });
//   } catch (e) {
//     sf.showError(e);
//   }
//
// Return mode (no throws):
//   const sfR = SalesforceClient({ errorMode: "return" });
//   const q2 = await sfR.query({ soql: "SELECT Id FROM Contact LIMIT 20" });
//   if (!q2.ok) {
//     console.error(`Salesforce error ${q2.error?.code || ''} ${q2.error?.message}`);
//     sfR.showError(q2.error || q2);
//   } else {
//     console.log("rows", q2.data);
//   }
//
// -------------------------------------------------------------------
// You do not need to modify anything below this line to use the client
// -------------------------------------------------------------------

(() => {

    var options = {}; var inputs = {};

    try {
        //----------- Configuration -------------------

        // Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
        // Leave this set to 0 to avoid unexpected behavior

        options.runTimeout = 0;

        // Defines the current account name running this action. Leave this defined
        // to the default. You may use the inputs.restrictedToAccounts to restrict action to 
        // certain individuals; leave empty to enable it for everyone. 

        inputs.account = seedcodeCalendar.get('config').account;

        options.restrictedToAccounts = [];

        //----------- End Configuration -------------------        
    }
    catch (error) {
        reportError(error);
    }

    function run() {

        // Escape a string literal for SOQL. Example: "O'Neil" -> `'O\'Neil'`

        function escapeSOQL(value) {
            return "'" + String(value).replace(/'/g, "\\'") + "'";
        }

        // Create a rich Error object from various inputs
        function makeSfError({ httpStatus, message, code, payload, method, url, source }) {
            const err = new Error(message || "Salesforce Error");
            err.httpStatus = httpStatus;    // e.g., 400, 401, 403, 404, 500…
            err.code = code;                // e.g., MALFORMED_QUERY, INVALID_SESSION_ID…
            err.payload = payload;          // raw SF payload (array or object)
            err.method = method;            // GET, PATCH, etc.
            err.url = url;                  // full URL we hit
            err.source = source;            // "canvas" | "rest" | "composite"
            return err;
        }

        // Parse a typical SF error payload (array of {message,errorCode})
        function parseSfErrorPayload(p) {
            if (Array.isArray(p) && p.length) {
                return {
                    message: p[0]?.message || JSON.stringify(p),
                    code: p[0]?.errorCode,
                };
            }
            if (p && typeof p === "object") {
                return {
                    message: p.message || JSON.stringify(p),
                    code: p.errorCode,
                };
            }
            return { message: String(p || "Salesforce Error"), code: undefined };
        }

        // Present an error using utilities.showModal / showMessage if available
        function showError(err) {

            if (!err.code || err?.error?.code)
                err = err.error || err;

            const code = err.code ? ` ${err.code}` : "";
            const status = err.httpStatus ? `[${err.httpStatus}]` : "";
            const text = `${status}${code} ${err.message}`;

            if (err.httpStatus >= 400 && err.httpStatus < 500) {
                // Soft toast for client errors (e.g., 400 malformed, field errors)
                const html = '<span class="message-icon-separator error">'
                    + '<i class="fa fa-exclamation-triangle" style="color: red;"></i></span>'
                    + `<span style="color: red;">Salesforce Error: </span> ${utilities.escapeHtml ? utilities.escapeHtml(text) : text}</span>`;
                // 6s toast, adjust as you like
                console.error(`Salesforce Error: ${text}`);
                utilities.showMessage(html, 0, 6000, null, null);
            } else {
                // Modal for server/auth issues
                utilities.showModal("Salesforce Error", text, "OK", null);
            }
        }

        /**
         * Converts a moment object to a Salesforce time string (HH:mm:ss.SSSZ)
         * @param {object} momentObj - A moment.js object
         * @returns {string} Salesforce time string (e.g., '14:30:00.000+0000')
         */
        function formatDateTime(momentObj) {
            if (!momentObj || typeof momentObj.format !== 'function') return '';
            return momentObj.format('HH:mm:ss.SSSZ');
        }

        // Build helpers from either Canvas context or REST settings.
        function makeEndpointsFromCanvas(context, apiVersion) {
            const version = apiVersion || context.version || "v61.0";
            const base = context.instanceUrl || "";
            return {
                base,
                version,
                dataBase: `${base}/services/data/${version}`,
                queryUrl: (context.links && context.links.queryUrl)
                    ? context.links.queryUrl
                    : `${base}/services/data/${version}/query`,
                apexBase: `${base}/services/apexrest`,
            };
        }

        // Split a restURL into its components
        function splitRestURL(restURL) {
            // restURL like: https://instance/services/data/v61.0/
            const m = /^https?:\/\/[^/]+/.exec(restURL);
            const base = m ? m[0] : "";
            const v = restURL.match(/\/services\/data\/(v[\d.]+)\//);
            const version = (v && v[1]) || "v61.0";
            return {
                base,
                version,
                dataBase: `${base}/services/data/${version}`,
                queryUrl: `${base}/services/data/${version}/query`,
                apexBase: `${base}/services/apexrest`,
            };
        }

        // Convert an error-like object to a standard result object
        function asResult({ httpStatus, message, code, payload, method, url, source }) {
            return {
                ok: false,
                status: httpStatus ?? 0,
                error: message || code ? { message, code } : undefined,
                payload,
                method, url, source,
            };
        }

        // -------------------------
        // The SalesforceClient itself
        // -------------------------

        function SalesforceClient(config = {}) {
            const {
                // Will autodetect if not provided
                mode = "auto", // "canvas" | "rest" | "auto"

                // Canvas extras
                canvasClient = (typeof fbk !== "undefined" && fbk.client) ? fbk.client() : null,
                canvasContext = (typeof fbk !== "undefined" && fbk.context) ? fbk.context() : null,
                apiVersion, // optional override like "v61.0"

                // REST extras
                sfApi = (typeof globalThis !== "undefined" && globalThis.sfApi) ? globalThis.sfApi : undefined,
                restURL,       // optional manual override (if not using sfApi.settings.restURL)
                accessToken,   // optional manual override (if not using sfApi.settings.token)

                // Auto-auth options (REST mode)
                auth = {
                    // you can pass userId / sourceId directly if you prefer:
                    // userId: undefined,
                    // sourceId: undefined,
                    immediate: true,
                    pollIntervalMs: 500,
                    timeoutMs: 15000,
                },

                // Errior handling
                errorMode = "throw", // "throw" | "return"
            } = config;

            // Error handling mode
            const shouldThrow = errorMode === "throw";

            // Decide transport
            let useCanvas = false;
            if (mode === "canvas") useCanvas = true;
            else if (mode === "rest") useCanvas = false;
            else {
                // robust autodetect for Canvas
                useCanvas = typeof Sfdc.canvas === "function" && typeof fbk.context === "function" && typeof fbk.context() !== "undefined";
            }

            // Endpoints + transport functions
            let endpoints, ajax;

            // =========================
            // Canvas transport
            // =========================
            if (useCanvas) {
                // Use a stable context, but fetch a FRESH client per call (token can rotate)
                const context = canvasContext || (fbk && fbk.context && fbk.context());
                if (!context) throw new Error("Canvas mode requires fbk.context().");
                endpoints = makeEndpointsFromCanvas(context, apiVersion);

                const getCanvasClient = () => (canvasClient || (fbk && fbk.client && fbk.client()));

                // Low-level ajax using Sfdc.canvas.client.ajax with retries for auth and method override
                const canvasAjax = (url, { method = "GET", params, data } = {}, attempt = 0, overrideStep = 0) =>
                    new Promise((resolve, reject) => {
                        // Build URL + query params
                        let u = url;
                        if (params && typeof params === "object") {
                            const qs = Object.keys(params)
                                .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
                                .join("&");
                            u += (u.indexOf("?") === -1 ? "?" : "&") + qs;
                        }

                        // Try native verb first; on 405 fallback to POST + _HttpMethod
                        const sendMethod = (overrideStep === 0) ? method.toUpperCase() : "POST";
                        if (overrideStep === 1) {
                            u += (u.indexOf("?") === -1 ? "?" : "&") + `_HttpMethod=${method.toUpperCase()}`;
                        }

                        const hasBody = sendMethod !== "GET" && sendMethod !== "HEAD";
                        const payload = hasBody ? (data != null ? JSON.stringify(data) : "") : undefined;

                        const ajaxOptions = {
                            client: getCanvasClient(),
                            method: sendMethod,
                            ...(hasBody ? { contentType: "application/json" } : {}),
                            data: payload,
                            success: (res) => {
                                // Canvas sometimes returns non-2xx on the "success" path
                                if (res && typeof res.status === "number" && res.status >= 400) {
                                    const parsed = parseSfErrorPayload(res.payload);
                                    const e = {
                                        httpStatus: res.status,
                                        message: parsed.message,
                                        code: parsed.code,
                                        payload: res.payload,
                                        method: method.toUpperCase(),
                                        url: u,
                                        source: "canvas",
                                    };
                                    return shouldThrow ? reject(makeSfError(e)) : resolve(asResult(e));
                                }
                                if (res && res.status === 401 && attempt === 0) {
                                    return canvasAjax(url, { method, params, data }, 1, overrideStep).then(resolve, reject);
                                }
                                const status = res?.status ?? 200;
                                resolve({ ok: true, status, payload: res?.payload, method: method.toUpperCase(), url: u, source: "canvas" });
                            },
                            error: (err) => {
                                try {
                                    const code = err?.status || err?.payload?.[0]?.errorCode;
                                    const message = err?.payload?.[0]?.message || err?.message || "Salesforce Error";

                                    // Retry once on auth
                                    if ((code === 401 || code === "INVALID_SESSION_ID") && attempt === 0) {
                                        return canvasAjax(url, { method, params, data }, 1, overrideStep).then(resolve, reject);
                                    }
                                    // Fallback once to method override if verb not allowed
                                    if ((code === 405 || /method not allowed/i.test(message)) && overrideStep === 0) {
                                        return canvasAjax(url, { method, params, data }, attempt, 1).then(resolve, reject);
                                    }

                                    const e = {
                                        httpStatus: err?.status,
                                        message,
                                        code: typeof code === "number" ? undefined : code,
                                        payload: err?.payload || err,
                                        method: method.toUpperCase(),
                                        url: u,
                                        source: "canvas",
                                    };
                                    return shouldThrow ? reject(makeSfError(e)) : resolve(asResult(e));
                                } catch (_) {
                                    const e = { httpStatus: 0, message: String(err), payload: err, method: method.toUpperCase(), url: u, source: "canvas" };
                                    return shouldThrow ? reject(makeSfError(e)) : resolve(asResult(e));
                                }
                            }
                        };

                        Sfdc.canvas.client.ajax(u, ajaxOptions);
                    });

                ajax = async (method, url, { params, body } = {}) => {
                    const res = await canvasAjax(url, { method, params, data: body });
                    return (res && "status" in res && "payload" in res) ? res : { status: 200, payload: res };
                };

                // =========================
                // REST transport (sfApi.ajaxRequest)
                // =========================
            } else {
                const _sfApi = sfApi || (typeof globalThis !== "undefined" ? globalThis.sfApi : undefined);

                // Auto-auth helpers
                const getSettings = () => (_sfApi && _sfApi.settings) ? _sfApi.settings : { restURL, token: accessToken };
                const hasToken = () => {
                    const s = getSettings();
                    return !!(s && s.token && s.restURL);
                };

                // Discover defaults for userId and sourceId if not provided
                function deriveAuthContext() {
                    // Try DayBack globals
                    const sc = (typeof globalThis !== "undefined" && (globalThis.sc || globalThis.seedcodeCalendar))
                        ? (globalThis.sc || globalThis.seedcodeCalendar)
                        : undefined;

                    let userId;
                    try {
                        userId =
                            (config && config.userID) ||
                            (sc && sc.get && sc.get("config") && sc.get("config").userID) ||
                            auth.userId;
                    } catch (e) {
                        userId = auth.userId;
                    }

                    let sourceId;
                    try {
                        const sources = sc && sc.get ? sc.get("sources") : [];
                        sourceId = (auth.sourceId) ||
                            (sources && sources.find(s => s.sourceTypeID === 10 && s.localParent === true)?.id);
                    } catch (e) {
                        sourceId = auth.sourceId;
                    }

                    return { userId, sourceId };
                }

                function startAuth() {
                    if (!_sfApi || !_sfApi.auth) {
                        throw new Error("REST mode requires sfApi.auth/sfApi.ajaxRequest or an explicit restURL + accessToken.");
                    }
                    const s = _sfApi.settings || (_sfApi.settings = {});
                    s.config = s.config || {};
                    s.config.immediate = (auth && typeof auth.immediate === "boolean") ? auth.immediate : true;

                    const { userId, sourceId } = deriveAuthContext();
                    if (!userId || !sourceId) {
                        throw new Error("Auto-auth could not determine userId/sourceId. Pass them via config.auth.{userId, sourceId}.");
                    }

                    // Signature: auth(userId, sourceId, ..., successCb, completeCb)
                    _sfApi.auth(
                        userId,
                        sourceId,
                        null, null, null, null, null, null,
                        function () { /* onSuccess noop */ },
                        function completeCb() { /* noop; we'll poll below */ }
                    );
                }

                function waitForAuth() {
                    const poll = (resolve, reject, started) => {
                        const s = getSettings();
                        if (s && s.token && s.restURL) return resolve();
                        if (Date.now() - started > (auth.timeoutMs || 15000)) {
                            return reject(new Error("Salesforce auto-auth timed out."));
                        }
                        setTimeout(() => poll(resolve, reject, started), auth.pollIntervalMs || 500);
                    };
                    return new Promise((resolve, reject) => poll(resolve, reject, Date.now()));
                }

                async function ensureAuth(options = { force: false }) {
                    if (options.force || !hasToken()) {
                        startAuth();
                        await waitForAuth();
                        // refresh endpoints from the newly authenticated settings
                        const s = getSettings();
                        endpoints = splitRestURL(s.restURL);
                    } else if (!endpoints) {
                        endpoints = splitRestURL(getSettings().restURL);
                    }
                }

                // Low-level ajax using sfApi.ajaxRequest
                const rawAjax = ({ url, method = "GET", params, data }) =>
                    new Promise((resolve, reject) => {
                        const s = getSettings();
                        (_sfApi || { ajaxRequest: () => { } }).ajaxRequest ? _sfApi.ajaxRequest({
                            url,
                            type: method,
                            params,
                            data,
                            preventErrorReporter: true,
                            access_token: s.token,
                            onSuccess: (response) => resolve({ ok: true, status: 200, payload: response, method, url, source: "rest" }),
                            onError: (error) => {
                                try {
                                    const arr = JSON.parse(error);
                                    const parsed = parseSfErrorPayload(arr);
                                    const e = { httpStatus: arr[0]?.statusCode || 400, message: parsed.message, code: parsed.code, payload: arr, method, url, source: "rest" };
                                    return shouldThrow ? reject(makeSfError(e)) : resolve(asResult(e));
                                } catch (e2) {
                                    const e = { httpStatus: 0, message: String(error), payload: error, method, url, source: "rest" };
                                    return shouldThrow ? reject(makeSfError(e)) : resolve(asResult(e));
                                }
                            },
                        }) : reject(new Error("sfApi.ajaxRequest not found"));
                    });

                // Wrap rawAjax with ensureAuth + 401 retry
                ajax = async (method, url, { params, body } = {}) => {
                    // Ensure we have a token/restURL (auto-auth if needed)
                    await ensureAuth();

                    try {
                        return await rawAjax({ url, method, params, data: body });
                    } catch (e) {
                        // Retry once on 401/INVALID_SESSION_ID
                        if ((e.code === "INVALID_SESSION_ID" || /unauthorized|401/i.test(e.message || ""))) {
                            await ensureAuth({ force: true });
                            return await rawAjax({ url, method, params, data: body });
                        }
                        throw e;
                    }
                };

                // initialize endpoints if we already have settings
                if (hasToken()) {
                    endpoints = splitRestURL(getSettings().restURL);
                }
            }

            // =========================
            // Core ops (Response Object API)
            // =========================

            // Helper to standardize response object shape
            function buildResponse(res, { data, meta } = {}) {
                return {
                    ok: !!res.ok,
                    status: res.status,
                    data: data,
                    raw: res.payload,
                    error: res.error,
                    method: res.method,
                    url: res.url,
                    source: res.source,
                    meta: meta || undefined,
                };
            }

            async function query(input, pageAll = true) {
                // Support both object form and string SOQL
                let soql, opts;
                if (typeof input === "string") {
                    soql = input;
                    opts = { pageAll };
                } else if (typeof input === "object" && input !== null) {
                    soql = input.soql;
                    opts = input;
                } else {
                    throw new Error("query requires a SOQL string or an options object");
                }
                if (!soql) throw new Error("query({ soql }) requires a SOQL string");

                const res = useCanvas
                    ? await ajax("GET", `${endpoints.queryUrl}?q=${encodeURIComponent(soql)}`)
                    : await ajax("GET", `${endpoints.queryUrl}/`, { params: { q: soql } });

                if (!res.ok) return buildResponse(res, { data: [] });
                let all = (res.payload?.records) || [];
                let nextUrl = res.payload?.nextRecordsUrl;
                if ((opts.pageAll ?? true) && nextUrl) {
                    // paginate until done (REST only; Canvas nextRecordsUrl may differ)
                    while (nextUrl) {
                        const url = useCanvas ? `${endpoints.base}${nextUrl}` : `${endpoints.base}${nextUrl}`;
                        const more = await ajax("GET", url);
                        if (!more.ok) {
                            // stop paging but keep original data
                            break;
                        }
                        all = all.concat(more.payload?.records || []);
                        nextUrl = more.payload?.nextRecordsUrl;
                        if (!more.payload?.done && !nextUrl) break;
                    }
                }
                return buildResponse(res, {
                    data: all,
                    meta: {
                        totalSize: res.payload?.totalSize,
                        done: res.payload?.done,
                        pageCount: all.length,
                        nextRecordsUrl: res.payload?.nextRecordsUrl,
                        soql,
                    }
                });
            }

            async function retrieve({ sobject, id, fields } = {}) {
                if (!sobject || !id) throw new Error("retrieve({ sobject, id, fields? }) requires sobject & id");
                const path = `${endpoints.dataBase}/sobjects/${sobject}/${id}`;
                const res = await ajax("GET", path, { params: fields && fields.length ? { fields: fields.join(",") } : undefined });
                return buildResponse(res, { data: res.payload });
            }

            async function create({ sobject, record } = {}) {
                if (!sobject || !record) throw new Error("create({ sobject, record }) requires sobject & record");
                const path = `${endpoints.dataBase}/sobjects/${sobject}/`;
                const res = await ajax("POST", path, { body: record });
                return buildResponse(res, { data: res.payload });
            }

            async function update({ sobject, id, record } = {}) {
                if (!sobject || !id || !record) throw new Error("update({ sobject, id, record }) requires sobject, id & record");
                const path = `${endpoints.dataBase}/sobjects/${sobject}/${id}`;
                const res = await ajax("PATCH", path, { body: record });
                return buildResponse(res, { data: res.payload });
            }

            async function upsert({ sobject, externalIdField, externalIdValue, record } = {}) {
                if (!sobject || !externalIdField || externalIdValue == null || !record) throw new Error("upsert({ sobject, externalIdField, externalIdValue, record }) requires all parameters");
                const path = `${endpoints.dataBase}/sobjects/${sobject}/${externalIdField}/${encodeURIComponent(externalIdValue)}`;
                const res = await ajax("PATCH", path, { body: record });
                return buildResponse(res, { data: res.payload });
            }

            async function del({ sobject, id } = {}) {
                if (!sobject || !id) throw new Error("delete({ sobject, id }) requires sobject & id");
                const path = `${endpoints.dataBase}/sobjects/${sobject}/${id}`;
                const res = await ajax("DELETE", path);
                return buildResponse(res, { data: res.payload });
            }

            async function batch({ requests, allOrNone = false, collateSubrequests = false } = {}) {
                if (!Array.isArray(requests)) throw new Error("batch({ requests }) requires an array of requests");
                const path = `${endpoints.dataBase}/composite`;
                const norm = (u) => {
                    const ver = endpoints.version;
                    if (!u) return `/services/data/${ver}/`;
                    if (/^\/services\/data\/v[\d.]+\//.test(u)) return u;
                    if (/^\/v[\d.]+\//.test(u)) return `/services/data${u}`;
                    if (/^v[\d.]+\//.test(u)) return `/services/data/${u}`;
                    if (u.startsWith('/')) return `/services/data/${ver}${u}`;
                    return `/services/data/${ver}/${u}`;
                };
                const body = {
                    allOrNone,
                    collateSubrequests,
                    compositeRequest: requests.map(r => ({
                        method: r.method,
                        url: norm(r.url),
                        referenceId: r.referenceId || undefined,
                        body: r.body,
                    })),
                };
                const res = await ajax("POST", path, { body });
                return buildResponse(res, { data: res.payload });
            }

            async function createTree({ sobject, records, chunkSize = 200 } = {}) {
                if (!sobject || !Array.isArray(records)) throw new Error("createTree({ sobject, records }) requires sobject & records array");
                const path = `${endpoints.dataBase}/composite/tree/${sobject}`;
                const chunks = [];
                for (let i = 0; i < records.length; i += chunkSize) chunks.push(records.slice(i, i + chunkSize));
                const out = [];
                let last = null;
                for (const ch of chunks) {
                    const res = await ajax("POST", path, { body: { records: ch } });
                    last = res;
                    out.push(res.payload);
                }
                return buildResponse(last || { ok: true, status: 200, payload: {} }, { data: out });
            }

            async function apex({ method = "GET", path, params, body } = {}) {
                if (!path) throw new Error("apex({ path }) requires path");
                const clean = path.startsWith("/") ? path : `/${path}`;
                const url = `${endpoints.apexBase}${clean}`;
                const res = await ajax(method, url, { params, body });
                return buildResponse(res, { data: res.payload });
            }

            // Public surface (new object-based API)
            return {
                endpoints,
                escapeSOQL,
                quote: escapeSOQL,
                formatDateTime,
                // CRUD / Query
                query,
                retrieve,
                create,
                update,
                upsert,
                delete: del,
                // Advanced
                batch,
                createTree,
                apex,
                showError,
            };
        }

        // Global export
        globalThis.SalesforceClient = SalesforceClient;
        globalThis.escapeSOQL = escapeSOQL;
    }

    //----------- Run function wrapper and helpers - you shouldn’t need to edit below this line. -------------------

    // Variables used for helper functions below
    var timeout;

    // Execute the run function as defined above
    try {

        if (!options.restrictedToAccounts ||
            !options.restrictedToAccounts.length ||
            (options.restrictedToAccounts && options.restrictedToAccounts.indexOf(inputs.account) > -1)
        ) {
            if (action.preventDefault && options.runTimeout) {
                timeoutCheck();
            }
            run();
        }
        else if (action.preventDefault) {
            confirmCallback();
        }
    }
    catch (error) {
        reportError(error);
    }

    // Run confirm callback when preventDefault is true. Used for async actions
    function confirmCallback() {
        cancelTimeoutCheck();
        if (action.callbacks.confirm) {
            action.callbacks.confirm();
        }
    }

    // Run cancel callback when preventDefault is true. Used for async actions
    function cancelCallback() {
        cancelTimeoutCheck();
        if (action.callbacks.cancel) {
            action.callbacks.cancel();
        }
    }

    // Check if the action has run within the specified time limit when preventDefault is enabled
    function timeoutCheck() {
        timeout = setTimeout(function () {
            var error = {
                name: 'Timeout',
                message: 'The action was unable to execute within the allotted time and has been stopped'
            };
            reportError(error, true);
        }, (options && options.runTimeout ? options.runTimeout * 1000 : 0));
    }

    function cancelTimeoutCheck() {
        if (timeout) {
            clearTimeout(timeout);
        }
    }

    // Function to report any errors that occur when running this action
    // Follows standard javascript error reporter format of an object with name and message properties
    function reportError(error) {
        var errorTitle = 'Error Running Custom Action';
        var errorMessage = '<p>There was a problem running the action "<span style="white-space: nowrap">' + action.name + '</span>"</p><p>Error: ' + error.message + '.</p><p>This may result in unexpected behavior of the calendar.</p>';
        if (action.preventDefault && timeout) {
            confirmCallback();
        }
        else {
            cancelCallback();
        }

        setTimeout(function () {
            utilities.showModal(errorTitle, errorMessage, null, null, 'OK', null, null, null, true, null, true);
        }, 1000);
    }

})();