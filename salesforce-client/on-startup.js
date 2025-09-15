// Salesforce Client for Canvas and Salesforce Connect - v1.0
//
// Purpose:
// Unified client for Salesforce REST API calls, supporting both
// Canvas apps (Sfdc.canvas.client.ajax) and external apps
// using Salesforce Connect (sfApi.ajaxRequest).
//
// Action Type: On Startup
// Prevent Default Action: No
//
// Full documentation and examples:
//
// https://github.com/seedcode/dayback-extensions-library/tree/main/salesforce-client
//
// General Usage:
//
//   const sf = SalesforceClient(); // autodetects Canvas vs REST mode
//
//   const [resp, rows] = await sf.query(`SELECT Id, Name FROM Contact WHERE Email = ${escapeSOQL(email)}`);
//   const [r2, ins]   = await sf.create("Contact", { FirstName: "Ada", LastName: "Lovelace" });
//   const [r3]        = await sf.update("Contact", ins.id, { Title: "CTO" });
//   const [r4, got]   = await sf.retrieve("Contact", ins.id, ["Id","Name","Title"]);
//   const [r5, res]   = await sf.apex("POST", "/PauseSession", { body: { /* ... */ } });
//   const [r6, out]   = await sf.batch([ { method:"GET", url:"/sobjects/Contact/" + ins.id, referenceId:"c1" } ]);
//   const [r7, trees] = await sf.createTree("Contact", [ { attributes:{type:"Contact", referenceId:"ref1"}, FirstName:"A", LastName:"One" } ]);
//   const [r8]        = await sf.delete("Contact", ins.id);
//
// This client will auto-detect the mode. It is also self-authenticating
// in REST mode if sfApi.settings.restURL and sfApi.settings.token are missing.
//
// Useful helper functions:
//
//   escapeSOQL(value) || sf.quote(value)
//          Used to escape string literals for SOQL queries.
//              Example: O'Neil -> 'O\'Neil'
//          Use whichever name you find more intuitive.
//
//  sf.showError(err)
//      Present errors via utilities.showModal / showMessage.
//      Alternatively, catch and inspect the error object yourself.
//      Error messages are also thrown to the console for easy debugging.
//
// Optional Try/Catch Error handling:
// ----------------------------------
//
// Errors are thrown as rich Error objects with properties:
//
//     - httpStatus (e.g., 400, 401, 403, 404, 500…)
//     - code       (e.g., MALFORMED_QUERY, INVALID_SESSION_ID…)
//     - message    (human-readable message)
//     - payload    (raw SF payload, array or object)
//     - method     (HTTP verb: GET, PATCH, etc.)
//     - url        (full URL we hit)
//     - source     ("canvas" | "rest" | "composite")
//
// Example error handling:
// -----------------------
//  
//  asunch function run() {
//      try {
//  
//         const [response, contacts] = await sf.query(`
//                 SELECT Id, Name FROM Contact WHERE Email = ${escapeSOQL(email)}
//         `);
//  
//         await sf.update('Contact', contacts[0].Id, { Custom_Field__c: "value" });
//  
//      } catch (err) {
//  
//        sf.showError(err);
//      }
// }
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
            const code = err.code ? ` ${err.code}` : "";
            const status = err.httpStatus ? `[${err.httpStatus}]` : "";
            const details = (() => {
                if (Array.isArray(err.payload) && err.payload[0]?.fields) {
                    return `\nFields: ${err.payload[0].fields.join(", ")}`;
                }
                return "";
            })();

            const text = `${status}${code} ${err.message}${details}`;

            if (typeof utilities !== "undefined") {
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
            } else {
                console.error(text, err);
            }
        }

        /**
         * Build helpers from either Canvas context or REST settings.
         */
        function makeEndpointsFromCanvas(context, apiVersion) {
            const version = apiVersion || context.version || "v61.0";
            const base = context.instanceUrl || ""; // e.g., https://yourInstance.my.salesforce.com
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
            } = config;

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
                // Use the provided context (stable), but fetch a FRESH client per request (token can rotate)
                const context = canvasContext || (fbk && fbk.context && fbk.context());
                if (!context) throw new Error("Canvas mode requires fbk.context().");

                endpoints = makeEndpointsFromCanvas(context, apiVersion);

                const getCanvasClient = () => fbk.client();

                // Canvas transport: fresh client per call, no method override, no headers by default, 401 retry
                const canvasAjax = (url, { method = "GET", params, data } = {}, attempt = 0, overrideStep = 0) =>
                    new Promise((resolve, reject) => {
                        // URL + params
                        let u = url;
                        if (params && typeof params === "object") {
                            const qs = Object.keys(params)
                                .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
                                .join("&");
                            u += (u.indexOf("?") === -1 ? "?" : "&") + qs;
                        }

                        // Try native verb; fallback once to method override via URL param only
                        const sendMethod = (overrideStep === 0) ? method.toUpperCase() : "POST";
                        if (overrideStep === 1) {
                            u += (u.indexOf("?") === -1 ? "?" : "&") + `_HttpMethod=${method.toUpperCase()}`;
                        }

                        const hasBody = sendMethod !== "GET" && sendMethod !== "HEAD";
                        const payload = hasBody ? (data != null ? JSON.stringify(data) : "") : undefined;

                        const ajaxOptions = {
                            client: getCanvasClient(),  // fresh token every call
                            method: sendMethod,
                            ...(hasBody ? { contentType: "application/json" } : {}),
                            data: payload,
                            success: (res) => {
                                // Canvas returns {status, payload}. Some proxies surface 401 here.
                                if (res && typeof res.status === "number" && res.status >= 400) {
                                    const parsed = parseSfErrorPayload(res.payload);
                                    return reject(makeSfError({
                                        httpStatus: res.status,
                                        message: parsed.message,
                                        code: parsed.code,
                                        payload: res.payload,
                                        method: method.toUpperCase(),
                                        url: u,
                                        source: "canvas",
                                    }));
                                }
                                if (res && res.status === 401 && attempt === 0) {
                                    // token rotated between fetch & call ⇒ try once more
                                    return canvasAjax(url, { method, params, data }, 1, overrideStep).then(resolve, reject);
                                }
                                resolve(res);
                            },
                            error: (err) => {
                                try {
                                    const code = err?.status || err?.payload?.[0]?.errorCode;
                                    const message = err?.payload?.[0]?.message || err?.message || "Salesforce Error";
                                    // Retry once for auth issues
                                    if ((code === 401 || code === "INVALID_SESSION_ID") && attempt === 0) {
                                        return canvasAjax(url, { method, params, data }, 1, overrideStep).then(resolve, reject);
                                    }
                                    // Fallback to POST + _HttpMethod if verb not allowed
                                    if ((code === 405 || /method not allowed/i.test(message)) && overrideStep === 0) {
                                        return canvasAjax(url, { method, params, data }, attempt, 1).then(resolve, reject);
                                    }
                                    reject(makeSfError({
                                        httpStatus: err?.status,
                                        message,
                                        code: typeof code === "number" ? undefined : code,
                                        payload: err?.payload || err,
                                        method: method.toUpperCase(),
                                        url: u,
                                        source: "canvas",
                                    }));
                                } catch (_) {
                                    reject(makeSfError({
                                        httpStatus: undefined, message: String(err), code: undefined,
                                        payload: err, method: method.toUpperCase(), url: u, source: "canvas",
                                    }));
                                }
                            },
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
                            onSuccess: (response) => resolve({ status: 200, payload: response }),
                            onError: (error) => {
                                try {
                                    const arr = JSON.parse(error);
                                    const parsed = parseSfErrorPayload(arr);
                                    throw makeSfError({
                                        httpStatus: arr[0]?.statusCode || 400,
                                        message: parsed.message,
                                        code: parsed.code,
                                        payload: arr,
                                        method,
                                        url,
                                        source: "rest",
                                    });
                                } catch (e2) {
                                    throw makeSfError({
                                        httpStatus: undefined,
                                        message: String(error),
                                        code: undefined,
                                        payload: error,
                                        method,
                                        url,
                                        source: "rest",
                                    });
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
            // Core ops
            // =========================
            async function query(soql, { pageAll = true } = {}) {
                // First page
                const [firstResp, firstRecords, nextUrl, lastResp] = await (async () => {
                    if (useCanvas) {
                        const u = `${endpoints.queryUrl}?q=${encodeURIComponent(soql)}`;
                        const res = await ajax("GET", u);
                        const recs = (res.payload && res.payload.records) || [];
                        return [res, recs, res.payload && res.payload.nextRecordsUrl, res];
                    } else {
                        // in REST mode endpoints may be created during ensureAuth(), so make sure we have them
                        if (!endpoints) throw new Error("REST endpoints not initialized.");
                        const res = await ajax("GET", `${endpoints.queryUrl}/`, { params: { q: soql } });
                        const recs = (res.payload && res.payload.records) || [];
                        return [res, recs, res.payload && res.payload.nextRecordsUrl, res];
                    }
                })();

                let all = firstRecords.slice();
                let next = nextUrl;
                let last = lastResp;

                while (pageAll && next) {
                    // next is an absolute path like /services/data/vXX.X/query/01g...
                    const url = endpoints.base + next;
                    const res = await ajax("GET", url);
                    const recs = (res.payload && res.payload.records) || [];
                    all = all.concat(recs);
                    next = res.payload && res.payload.nextRecordsUrl;
                    last = res;
                }
                return [last || firstResp, all];
            }

            async function retrieve(sobject, id, fields) {
                const path = `${endpoints.dataBase}/sobjects/${sobject}/${id}`;
                const res = await ajax("GET", path, { params: fields && fields.length ? { fields: fields.join(",") } : undefined });
                return [res, res.payload];
            }

            async function create(sobject, body) {
                const path = `${endpoints.dataBase}/sobjects/${sobject}/`;
                const res = await ajax("POST", path, { body });
                return [res, res.payload];
            }

            async function update(sobject, id, body) {
                const path = `${endpoints.dataBase}/sobjects/${sobject}/${id}`;
                const res = await ajax("PATCH", path, { body });
                return [res, res.payload];
            }

            async function upsert(sobject, externalIdField, externalIdValue, body) {
                const path = `${endpoints.dataBase}/sobjects/${sobject}/${externalIdField}/${encodeURIComponent(externalIdValue)}`;
                const res = await ajax("PATCH", path, { body });
                return [res, res.payload];
            }

            async function del(sobject, id) {
                const path = `${endpoints.dataBase}/sobjects/${sobject}/${id}`;
                const res = await ajax("DELETE", path);
                return [res, res.payload];
            }

            // Composite batch (up to 25 subrequests)
            // request: { method:"GET"|"POST"|"PATCH"|"DELETE", url:"/sobjects/Contact/...", referenceId:"ref1", body?:{} }
            async function batch(requests, { allOrNone = false, collateSubrequests = false } = {}) {
                const path = `${endpoints.dataBase}/composite`;
                // Ensure urls are relative to /services/data/<v> (composite requirement)
                const norm = (u) => u.startsWith("/") ? u.replace(/^.*?\/services\/data\/v[\d.]+/, "") : u;
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
                return [res, res.payload];
            }

            // Composite Tree insert (200 records per request)
            async function createTree(sobject, records, { chunkSize = 200 } = {}) {
                const path = `${endpoints.dataBase}/composite/tree/${sobject}`;
                const chunks = [];
                for (let i = 0; i < records.length; i += chunkSize) {
                    chunks.push(records.slice(i, i + chunkSize));
                }
                const out = [];
                let last = null;
                for (const ch of chunks) {
                    const res = await ajax("POST", path, { body: { records: ch } });
                    last = res;
                    out.push(res.payload);
                }
                return [last, out];
            }

            // Apex REST helper
            // path: "/MyEndpoint" or "MyEndpoint" → will be appended to /services/apexrest
            async function apex(method, path, { params, body } = {}) {
                const clean = path.startsWith("/") ? path : `/${path}`;
                const url = `${endpoints.apexBase}${clean}`;
                const res = await ajax(method, url, { params, body });
                return [res, res.payload];
            }

            // Public surface
            return {
                // endpoints + escape helper
                endpoints,
                escapeSOQL,
                quote: escapeSOQL, // alternate name
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
                showError
            };
        }

        // UMD-ish export
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

/* ==========================================================================

USAGE EXAMPLES (copy/paste)

These examples cover:
- Canvas mode (DayBack/Canvas iFrame)
- REST mode with Auto-Auth for Salesforce Connect (no token upfront)
- CRUD, SOQL with pagination, Apex REST, Composite Batch, Composite Tree
- Upsert pattern
- A simple capacity check sketch using sf.query

=========================================================================== */

// 1) Canvas mode — query + update inside a DayBack action
/*
const sf = SalesforceClient({ mode: "canvas" });

async function run() {
  const cfg = seedcodeCalendar.get('config');
  const email = String(cfg.account).toLowerCase();

  const soql = `
    SELECT Id, Name, Title, Email
    FROM Contact
    WHERE Email = ${escapeSOQL(email)}
    LIMIT 1
  `;
  const [qResp, contacts] = await sf.query(soql);
  if (qResp.status !== 200 || !contacts.length) {
    utilities.showModal("Not Found", "No contact for your login.", "OK", action.callbacks.cancel);
    return;
  }

  const contact = contacts[0];
  const [uResp] = await sf.update("Contact", contact.Id, { Title: "Presenter" });
  if (uResp.status !== 204 && uResp.status !== 200) throw new Error("Update failed");

  action.callbacks.confirm();
}
run().catch(err => utilities.showModal("Error", err.message, "OK", action.callbacks.cancel));
*/

// 2) REST mode with AUTO-AUTH (no token in sfApi.settings)
/*
const sf = SalesforceClient({
  mode: "rest",
  sfApi,    // must exist globally (DayBack's Salesforce Connect)
  auth: {
    // Optionally pass userId/sourceId; otherwise they are discovered from DayBack.
    // userId: "your-user-id",
    // sourceId: "source-id-for-salesforce-connect",
    immediate: true,
    pollIntervalMs: 500,
    timeoutMs: 15000,
  },
});

async function demo() {
  const [resp, rows] = await sf.query("SELECT Id, Name FROM Account ORDER BY Name LIMIT 5");
  console.log(rows);

  const [cResp, created] = await sf.create("Contact", { FirstName: "Ada", LastName: "Lovelace" });
  const [rResp, rec] = await sf.retrieve("Contact", created.id, ["Id","Name"]);
  await sf.update("Contact", created.id, { Title: "CTO" });
  await sf.delete("Contact", created.id);
}
demo().catch(console.error);
*/

// 3) Apex REST (Canvas or REST)
/*
const sf = SalesforceClient();
async function callApex() {
  const [, data] = await sf.apex("POST", "/PauseSession", {
    body: { contactId: "003xx000..." }
  });
  console.log("Apex returned:", data);
}
*/

// 4) Composite Batch (up to 25 subrequests)
/*
const sf = SalesforceClient();
async function batchOps(contactId) {
  const [resp, results] = await sf.batch([
    { method: "GET",   url: `/sobjects/Contact/${contactId}`, referenceId: "getC" },
    { method: "PATCH", url: `/sobjects/Contact/${contactId}`, referenceId: "updC",
      body: { Title: "Updated via Composite" } },
    { method: "GET",   url: `/sobjects/Contact/${contactId}`, referenceId: "chkC" },
  ], { allOrNone: false });
  console.log(results);
}
*/

// 5) Composite Tree (bulk insert)
/*
const sf = SalesforceClient();
async function bulkInsertContacts() {
  const records = [
    { attributes: { type: "Contact", referenceId: "ref1" }, FirstName: "A", LastName: "One" },
    { attributes: { type: "Contact", referenceId: "ref2" }, FirstName: "B", LastName: "Two" },
  ];
  const [res, payloads] = await sf.createTree("Contact", records);
  console.log(payloads);
}
*/

// 6) Upsert with external ID
/*
const sf = SalesforceClient();
async function upsertContactByEmail(email) {
  const [resp] = await sf.upsert("Contact", "Email", email, { LastName: "Unknown" });
  console.log(resp.status); // 201 (created) or 204 (updated)
}
*/

// 7) SOQL with pageAll = false (first page only)
/*
const sf = SalesforceClient();
async function firstPageOnly() {
  const [resp, rows] = await sf.query("SELECT Id, Name FROM Lead ORDER BY CreatedDate DESC", { pageAll: false });
  console.log(rows.length);
}
*/

// 8) Capacity check sketch using sf.query
/*
const sf = SalesforceClient({ mode: "canvas" });
async function checkCapacity(objectName, resourceField, startField, endField, resource, start, stop, limit) {
  const soql = `
    SELECT Id, ${startField}, ${endField}
    FROM ${objectName}
    WHERE ${startField} <= ${escapeSOQL(stop)}
      AND ${endField}   >= ${escapeSOQL(start)}
      AND ${resourceField} = ${escapeSOQL(resource)}
  `;
  const [, records] = await sf.query(soql);

  const mStart = moment(start, "YYYY-MM-DD");
  const mStop  = moment(stop,  "YYYY-MM-DD");
  const over = [];
  for (let d = mStart.clone(); d.diff(mStop, "days") <= 0; d.add(1, "day")) {
    const day = d.format("YYYY-MM-DD");
    let count = 0;
    for (const r of records) {
      const rs = moment(r[startField]);
      const re = moment(r[endField]);
      if (d.isBetween(rs, re, undefined, "[]")) count++;
    }
    if (count + 1 > limit) over.push(day);
  }
  return over; // array of YYYY-MM-DD strings over the limit
}
*/
