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
// --------------------------------
//
//      https://github.com/seedcode/dayback-extensions-library/tree/main/salesforce-client
//
// General Usage:
// ---------------
//
//      const sf = SalesforceClient(); // autodetects Canvas vs REST mode
//
//      const [resp, rows] = await sf.query(`SELECT Id, Name FROM Contact WHERE Email = ${escapeSOQL(email)}`);
//      const [r2, ins]   = await sf.create("Contact", { FirstName: "Ada", LastName: "Lovelace" });
//      const [r3]        = await sf.update("Contact", ins.id, { Title: "CTO" });
//      const [r4, got]   = await sf.retrieve("Contact", ins.id, ["Id","Name","Title"]);
//      const [r5, res]   = await sf.apex("POST", "/PauseSession", { body: { /* ... */ } });
//      const [r6, out]   = await sf.batch([ { method:"GET", url:"/sobjects/Contact/" + ins.id, referenceId:"c1" } ]);
//      const [r7, trees] = await sf.createTree("Contact", [ { attributes:{type:"Contact", referenceId:"ref1"}, FirstName:"A", LastName:"One" } ]);
//      const [r8]        = await sf.delete("Contact", ins.id);
//
// This client will auto-detect the mode. It is also self-authenticating
// in REST mode if sfApi.settings.restURL and sfApi.settings.token are missing.
//
// Useful helper functions:
//
//      escapeSOQL(value) || sf.quote(value)
//          Used to escape string literals for SOQL queries.
//              Example: O'Neil -> 'O\'Neil'
//          Use whichever name you find more intuitive.
//
//      sf.showError(err)
//          Present errors via utilities.showModal / showMessage.
//          Alternatively, catch and inspect the error object yourself.
//          Error messages are also thrown to the console for easy debugging.
//
// Optional Try/Catch Error handling:
// ----------------------------------
//
// Errors are thrown as rich Error objects with properties:
//
//      ok:     (e.g. true || false)
//      status: (e.g., 400, 401, 403, 404, 500…)
//      error: { 
//          message: (e.g. message || "Salesforce Error")
//          code: (e.g. code || "UNKNOWN_ERROR")
//      }
//      payload: (e.g. raw SF payload, array or object)
//      method: (e.g. GET, PATCH, etc.)
//      url:    (e.g. full URL we hit)
//      source: (e.g. "canvas" | "rest" | "composite"),
//
// Example error handling:
// -----------------------
//
//      try {
//         const [response, contacts] = await sf.query(`
//                 SELECT Id, Name FROM Contact WHERE Email = ${escapeSOQL(email)}
//         `);
//         await sf.update('Contact', contacts[0].Id, { Custom_Field__c: "value" });
//      } catch (err) {
//        sf.showError(err);
//      }
//
// If you wish to check errors yourself, you can create a SalesforceClient instance 
// with { errorMode: "return" } parameter. In this mode, errors are returned
// as part of the result tuple [response, data] where response.ok === false.
//
//      const sf = SalesforceClient({ errorMode: "return" });
//      const [resp, rows] = await sf.query("SELECT Id FROM Contact LIMIT 20");
//      if (!resp.ok) {
//          console.error(`Salesforce error ${resp.error.code}, ${resp.error.message}`);
//          sf.showError(resp); // optional
//      } else {
//          console.log("rows", rows);
//      }
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
            const code = err.code ? ` ${err.code}` : "";
            const status = err.httpStatus ? `[${err.httpStatus}]` : "";
            const details = (() => {
                if (Array.isArray(err.payload) && err.payload[0]?.fields) {
                    return `\nFields: ${err.payload[0].fields.join(", ")}`;
                }
                return "";
            })();

            const text = `${status}${code} ${err.message}${details}`;

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
         * Build helpers from either Canvas context or REST settings.
         */
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
            // Core ops
            // =========================
            async function query(soql, { pageAll = true } = {}) {
                const res = useCanvas
                    ? await ajax("GET", `${endpoints.queryUrl}?q=${encodeURIComponent(soql)}`)
                    : await ajax("GET", `${endpoints.queryUrl}/`, { params: { q: soql } });

                if (!res.ok) return [res, []];
                let all = (res.payload?.records) || [];
                // ... follow nextRecordsUrl if pageAll ...
                return [res, all];
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
                const norm = (u) => {
                    const ver = endpoints.version; // e.g., "v61.0"
                    if (!u) return `/services/data/${ver}/`;

                    // Already correct (/services/data/vXX.X/...)
                    if (/^\/services\/data\/v[\d.]+\//.test(u)) return u;

                    // Starts with /vXX.X/...   -> prefix /services/data
                    if (/^\/v[\d.]+\//.test(u)) return `/services/data${u}`;

                    // Starts with vXX.X/... (no leading slash)
                    if (/^v[\d.]+\//.test(u)) return `/services/data/${u}`;

                    // Starts with "/" (e.g., /sobjects/..., /query/..., etc.)
                    if (u.startsWith('/')) return `/services/data/${ver}${u}`;

                    // Plain relative (e.g., sobjects/Account/...)
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