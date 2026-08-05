// Salesforce Client for Canvas and Salesforce Connect - v2.2 (Object Response API)
//
// Name: Salesforce Client
// Type: App Action
// Purpose:
// Unified client for Salesforce API calls in both Canvas (Sfdc.canvas.client.ajax)
// and Salesforce Connect REST (sfApi.ajaxRequest). Auto-detects environment and
// self-authenticates in REST mode if token / restURL are missing. Transparently
// supports the DayBack Salesforce relay (sfApi.useProxy) in REST mode.
//
// Full docs & migration guide:
//   https://github.com/seedcode/dayback-extensions-library/tree/main/salesforce-client
//
// Changelog - v2.1 to v2.2:
// -------------------------
// New
//   * Metadata API: getSObjects() (alias objects()) lists the org's sObjects,
//     describe({ objectName }) returns one sObject's full metadata, and
//     request({ base, path, method, params, body }) reaches any REST endpoint
//     that has no dedicated method.
//   * DayBack relay support. The client detects sfApi.useProxy() and adapts in
//     two ways: query parameters are always sent to sfApi as `params`, the only
//     form the relay preserves, and relayed parameter values get a second
//     encoding pass because they are decoded twice before Salesforce sees them
//     (once by the relay, once by Salesforce) where sfApi supplies only one.
//     A relay option on the constructor - SalesforceClient({ relay: false }) -
//     forces a direct connection for one instance, and { relay: true } requires
//     the relay.
//   * Version reporting. SalesforceClient.version and
//     SalesforceClient.getClientVersion() report the version without building a
//     client; an instance answers sf.getClientVersion(). Neither exists before
//     v2.2, so call them optionally - SalesforceClient.version ?? "2.1 or
//     earlier" - when the deployed version is unknown.
//
// Fixed
//   * bulkQuery() and bulkQuery.pages() inlined the SOQL into the request URL.
//     Under the DayBack relay that query string is discarded, so relayed bulk
//     queries ran with no SOQL at all.
//   * Relayed queries whose filter contained &, %, # or + reached Salesforce as
//     a malformed URL and were rejected with "Illegal Request". The same query
//     succeeded on a direct connection.
//   * upsert() referenced an undefined identifier and always threw a
//     ReferenceError.
//   * retryCheck was read from sfApi.settings, where it does not exist, so
//     sfApi never refreshed an expired session on the client's behalf. It is
//     now taken from sfApi itself.
//   * onError assumed a JSON string, but sfApi hands it a parsed array when
//     retryCheck matches. Every such error collapsed to httpStatus 0 with an
//     unusable message. The real HTTP status is now reported.
//   * The 401 / INVALID_SESSION_ID retry only ran under errorMode "throw". It
//     now also runs under errorMode "return", which resolves instead of throwing.
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
//   const r = await sf.create({ objectName: "Contact", record: { FirstName: "Ada", LastName: "Lovelace" } });
//   await sf.update({ objectName: "Contact", id: r.data.id, record: { Title: "CTO" } });
//   const r = await sf.retrieve({ objectName: "Contact", id: r.data.id, fields: ["Id","Name","Title"] });
//   const r = await sf.apex({ method: "POST", path: "/PauseSession", body: { /* ... */ } });
//   const r = await sf.batch({ requests: [ { method: "GET", url: "/sobjects/Contact/" + r.data.id, referenceId: "getC" } ] });
//   await sf.delete({ objectName: "Contact", id: r.data.id });
//   const r = await sf.compoundBatch({
//      requests: [ /* objectName create/update/delete subrequests */],
//          batchSize: 200,        // max records per inner objectName-composite
//          envelopeSize: 25,      // max requests per outer composite
//          allOrNone: true
//      });
//
//   // Metadata / introspection:
//
//   const r = await sf.getSObjects();                        // org-wide sObject list
//   const r = await sf.describe({ objectName: "Contact" });  // one sObject's metadata
//
//   // Generic endpoint access (use only when no dedicated method fits):
//
//   const r = await sf.request({ base: "data", path: "/limits", method: "GET" });
//
// Helper functions:
//   sf.escapeSOQL(value) / sf.quote(value) - escape string literal for SOQL
//   sf.showError(error)  - present errors via toast or modal in Canvas
//   sf.formatDateTime(momentObj) - format a moment object for Salesforce DateTime fields
//
// DayBack Relay (Salesforce Connect only):
// ----------------------------------------
// When an On Startup action calls sfApi.useProxy(dbkEnv.sfrelayAPIKey), every
// Salesforce call is relayed through DayBack's servers so that refresh tokens are
// managed server-side and sessions do not expire. The relay authenticates itself
// using the top-level query string of its own URL (apiKey + endpoint), which means
// a request may NOT carry its own top-level query string - sfApi discards it
// (options.url.split('?')[0]).
//
// This client passes every query parameter to sfApi as `params`, and inlines
// nothing. sfApi encodes the separators so the parameters ride inside `endpoint`.
// That is the same code path DayBack's own event fetching uses, so the client
// behaves consistently with the rest of the app, relayed or direct.
//
// Three rules apply to code you write:
//
//   1. Pass query parameters via `params`. A query string written into a URL is
//      dropped when the relay is active.
//   2. Pass parameter values raw. A relayed value must survive two decodes - the
//      relay's own `endpoint`, then Salesforce's query string - and this client
//      supplies the second encoding pass when, and only when, the relay is active.
//      Pre-encoding a value yourself double-encodes it.
//   3. Request bodies (create/update/upsert/batch/compoundBatch) are always safe;
//      the relay never touches them.
//
// sfApi.useProxy() is global and has no counterpart, so the constructor accepts a
// per-instance override - useful for comparing relayed and direct behaviour:
//
//   const sfDirect = SalesforceClient({ relay: false });  // ignore the relay
//   const sfRelay  = SalesforceClient({ relay: true });   // require the relay
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
//     await sf.update({ objectName: "Contact", id: q.data[0].Id, record: { Custom_Field__c: "value" } });
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

        // The one place the version is declared. Keep it in step with the
        // banner at the top of this file when promoting a new version.
        //
        // Reachable two ways, both of which older clients lack - so callers
        // must always probe with optional calls rather than assume:
        //
        //   SalesforceClient.version                     // no instance needed
        //   SalesforceClient()?.getClientVersion?.()     // from an instance
        //
        // The static form is preferable for a capability check, because
        // constructing a client can throw in REST mode when there is no token
        // or restURL yet. Treat undefined as "2.1 or earlier".
        const CLIENT_VERSION = "2.2";

        function getClientVersion() {
            return CLIENT_VERSION;
        }

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
         * Converts a moment object into a Salesforce-friendly DateTime string.
         * 
         * Salesforce accepts ISO-like datetime strings for both Date and Time fields.
         * We now return a full datetime value:
         *   YYYY-MM-DDTHH:mm:ss.SSSZ
         *
         * The "T" and "Z" must be *literal characters*, not interpreted tokens,
         * so they are wrapped in square brackets.
         *
         * @param {object} momentObj - A moment.js object
         * @returns {string} Salesforce datetime string (e.g. '2025-01-14T14:30:00.000Z')
         */
        function formatDateTime(momentObj) {
            if (!momentObj || typeof momentObj.format !== 'function') return '';
            return momentObj.format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]");
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

                // DayBack relay (REST mode only). Leave undefined to follow
                // sfApi.useProxy(); pass false to force a direct connection, or
                // true to require the relay and fail fast if it isn't configured.
                relay,

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

                // -------------------------------------------------------------
                // DayBack relay awareness
                // -------------------------------------------------------------
                // sfApi.useProxy() routes calls through DayBack's relay so refresh
                // tokens live server-side. The relay authenticates using the
                // top-level query string of its own URL (apiKey + endpoint), and
                // sfApi must reclaim that query string to build it - so it DISCARDS
                // any query string in `url` (sfApi.js: options.url.split('?')[0]).
                //
                // Two consequences for the code below:
                //
                //   * Pass query parameters as `params` and let sfApi fold them in;
                //     it encodes the separators as %3F/%3D/%26 so they stay inside
                //     `endpoint`. Never inline a query string into a URL.
                //   * Pass values raw. sfApi encodes them, and a second encoding
                //     pass makes Salesforce reject the SOQL with MALFORMED_QUERY
                //     ("unexpected token: '%'").
                //
                // This is the same path DayBack's own event fetching uses, so the
                // client matches the rest of the app rather than encoding its own way.

                // Is the relay in play for this client instance?
                function relayEnabled() {
                    if (relay === false) return false;
                    const p = (_sfApi && _sfApi.getProxy) ? _sfApi.getProxy() : null;
                    if (relay === true) {
                        if (!(p && p.url)) {
                            throw new Error("SalesforceClient({ relay: true }) requires sfApi.useProxy() to have been called first.");
                        }
                        return true;
                    }
                    return !!(p && p.enabled);
                }

                // A relayed parameter value has to survive TWO decodes: the relay
                // decodes its own `endpoint` parameter, then Salesforce decodes the
                // query string of the URL the relay forwards. sfApi applies one
                // level of encoding, so the second one has to come from here.
                //
                // Without it, a value containing & % # or + arrives at Salesforce
                // as a malformed URL - `100% #x` becomes an invalid percent-escape
                // and a raw fragment marker - and Salesforce answers "Illegal
                // Request" rather than running the query.
                //
                // This is the same compensation DayBack's own source applies in
                // app/sources/source-definitions/salesforce/shared.js, which
                // pre-encodes all-day datetimes (whose ISO offsets contain +) when
                // sfApi.getProxy().enabled. Applying it to every parameter, rather
                // than one known-bad field, is the general form.
                //
                // Direct connections must NOT get this second pass - that would
                // double-encode them. Hence the relayEnabled() gate.
                function encodeParamsForTransport(params) {
                    if (!params || !relayEnabled()) return params;
                    const out = {};
                    Object.keys(params).forEach((k) => {
                        const v = params[k];
                        out[k] = (v === undefined || v === null)
                            ? v
                            : encodeURIComponent(String(v));
                    });
                    return out;
                }

                // Guard against a caller (or a future edit) reintroducing an inline
                // query string, which the relay silently truncates.
                function assertNoInlineQuery(url) {
                    if (relayEnabled() && url.indexOf("?") !== -1 && url.indexOf(".dayback.com") === -1) {
                        console.warn(
                            "SalesforceClient: a query string was inlined into a URL while the DayBack relay is active. "
                            + "sfApi will discard it - pass query parameters via `params` instead. URL: " + url
                        );
                    }
                }

                // Opting out of the relay takes more than declining to use it: while
                // the latch is on, sfApi rewrites every non-dayback URL itself. So
                // for { relay: false } we clear the latch across the synchronous URL
                // construction inside ajaxRequest and restore it immediately.
                // Nothing can interleave - JS is single threaded, and ajaxRequest
                // has computed its URL and called send() before it yields.
                function withRelaySuppressed(fn) {
                    const p = (_sfApi && _sfApi.getProxy) ? _sfApi.getProxy() : null;
                    if (relay !== false || !p || !p.enabled) return fn();
                    p.enabled = false;
                    try {
                        return fn();
                    } finally {
                        p.enabled = true;
                    }
                }

                // Low-level ajax using sfApi.ajaxRequest
                const rawAjax = ({ url, method = "GET", params, data }) =>
                    new Promise((resolve, reject) => {
                        const s = getSettings();
                        // Hand `params` to sfApi rather than folding them into the
                        // URL ourselves: under the relay sfApi encodes the
                        // separators so the parameters ride inside `endpoint`.
                        assertNoInlineQuery(url);
                        const sendUrl = url;
                        (_sfApi || { ajaxRequest: () => { } }).ajaxRequest ? withRelaySuppressed(() => _sfApi.ajaxRequest({
                            url: sendUrl,
                            type: method,
                            params: encodeParamsForTransport(params),
                            data,
                            preventErrorReporter: true,
                            access_token: s.token,
                            // Let sfApi recognize an expired session, refresh the
                            // token, and retry before surfacing the error to us.
                            //
                            // Suppressed under { relay: false }: sfApi's internal
                            // retry re-enters ajaxRequest asynchronously, after the
                            // latch has been restored, so the retry would quietly
                            // travel through the relay this instance asked to avoid.
                            // Our own ajax() wrapper recovers from an expired
                            // session instead, re-suppressing on each attempt.
                            retryCheck: relay === false ? undefined : (_sfApi && _sfApi.retryCheck),
                            onSuccess: (response) => resolve({ ok: true, status: 200, payload: response, method, url: sendUrl, source: "rest" }),
                            // sfApi calls onError(payload, httpStatus, preventDeauth).
                            // `payload` is a JSON string for ordinary Salesforce
                            // errors, but an already-parsed array when retryCheck
                            // matched - so normalize before parsing.
                            onError: (error, httpStatus) => {
                                try {
                                    const payload = typeof error === "string" ? JSON.parse(error) : error;
                                    const parsed = parseSfErrorPayload(payload);
                                    const e = {
                                        httpStatus: Number(httpStatus) || payload?.[0]?.statusCode || 400,
                                        message: parsed.message,
                                        code: parsed.code,
                                        payload,
                                        method,
                                        url: sendUrl,
                                        source: "rest",
                                    };
                                    return shouldThrow ? reject(makeSfError(e)) : resolve(asResult(e));
                                } catch (e2) {
                                    const e = { httpStatus: Number(httpStatus) || 0, message: String(error), payload: error, method, url: sendUrl, source: "rest" };
                                    return shouldThrow ? reject(makeSfError(e)) : resolve(asResult(e));
                                }
                            },
                        })) : reject(new Error("sfApi.ajaxRequest not found"));
                    });

                // Does a result/error represent an expired Salesforce session?
                const isSessionError = (e) =>
                    e && (e.code === "INVALID_SESSION_ID" || /unauthorized|401/i.test(e.message || ""));

                // Wrap rawAjax with ensureAuth + 401 retry
                ajax = async (method, url, { params, body } = {}) => {
                    // Ensure we have a token/restURL (auto-auth if needed)
                    await ensureAuth();

                    try {
                        const res = await rawAjax({ url, method, params, data: body });
                        // In errorMode "return" rawAjax resolves rather than throws,
                        // so the retry below has to inspect the resolved result too.
                        if (!res.ok && isSessionError(res.error)) {
                            await ensureAuth({ force: true });
                            return await rawAjax({ url, method, params, data: body });
                        }
                        return res;
                    } catch (e) {
                        // Retry once on 401/INVALID_SESSION_ID
                        if (isSessionError(e)) {
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

            // The query endpoint. Canvas takes context.links.queryUrl as-is; REST
            // wants the trailing slash. The SOQL is always supplied separately as a
            // `q` parameter, never inlined here.
            function queryBaseUrl() {
                return useCanvas ? endpoints.queryUrl : `${endpoints.queryUrl}/`;
            }

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

                // The SOQL travels as a query parameter in both transports. Never
                // inline it into the URL string: under the DayBack relay sfApi
                // discards a caller-supplied query string.
                const res = await ajax("GET", queryBaseUrl(), { params: { q: soql } });

                if (!res.ok) return buildResponse(res, { data: [] });
                let all = (res.payload?.records) || [];
                let nextUrl = res.payload?.nextRecordsUrl;
                if ((opts.pageAll ?? true) && nextUrl) {
                    // paginate until done (REST only; Canvas nextRecordsUrl may differ)
                    while (nextUrl) {
                        const more = await ajax("GET", `${endpoints.base}${nextUrl}`);
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

            /**
             * getObjects()
             * ------------
             * Lists every sObject available in the org, along with its basic
             * attributes (name, label, createable, queryable, keyPrefix, ...).
             * Use describe() when you need a single object's fields.
             *
             * @returns {Promise<object>} response.data = the global describe body,
             *   whose `sobjects` property is the array of object descriptions.
             */
            async function getObjects() {
                const path = `${endpoints.dataBase}/sobjects/`;
                const res = await ajax("GET", path);
                return buildResponse(res, { data: res.payload });
            }

            /**
             * describe({ objectName })
             * -----------------------
             * Full metadata for one sObject: fields with their types, picklist
             * values, relationships, record types, and permissions.
             *
             * @param {object} params
             * @param {string} params.objectName - API name, e.g. "Contact"
             * @returns {Promise<object>} response.data = the sObject describe body
             */
            async function describe({ objectName } = {}) {
                if (!objectName) throw new Error("describe({ objectName }) requires objectName");
                const path = `${endpoints.dataBase}/sobjects/${objectName}/describe/`;
                const res = await ajax("GET", path);
                return buildResponse(res, { data: res.payload });
            }

            async function retrieve({ objectName, id, fields } = {}) {
                if (!objectName || !id) throw new Error("retrieve({ objectName, id, fields? }) requires objectName & id");
                const path = `${endpoints.dataBase}/sobjects/${objectName}/${id}`;
                const res = await ajax("GET", path, { params: fields && fields.length ? { fields: fields.join(",") } : undefined });
                return buildResponse(res, { data: res.payload });
            }

            async function create({ objectName, record } = {}) {
                if (!objectName || !record) throw new Error("create({ objectName, record }) requires objectName & record");
                const path = `${endpoints.dataBase}/sobjects/${objectName}/`;
                const res = await ajax("POST", path, { body: record });
                return buildResponse(res, { data: res.payload });
            }

            async function update({ objectName, id, record } = {}) {
                if (!objectName || !id || !record) throw new Error("update({ objectName, id, record }) requires objectName, id & record");
                const path = `${endpoints.dataBase}/sobjects/${objectName}/${id}`;
                const res = await ajax("PATCH", path, { body: record });
                return buildResponse(res, { data: res.payload });
            }

            async function upsert({ objectName, externalIdField, externalIdValue, record } = {}) {
                if (!objectName || !externalIdField || externalIdValue == null || !record) throw new Error("upsert({ objectName, externalIdField, externalIdValue, record }) requires all parameters");
                const path = `${endpoints.dataBase}/sobjects/${objectName}/${externalIdField}/${encodeURIComponent(externalIdValue)}`;
                const res = await ajax("PATCH", path, { body: record });
                return buildResponse(res, { data: res.payload });
            }

            async function del({ objectName, id } = {}) {
                if (!objectName || !id) throw new Error("delete({ objectName, id }) requires objectName & id");
                const path = `${endpoints.dataBase}/sobjects/${objectName}/${id}`;
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

            async function createTree({ objectName, records, chunkSize = 200 } = {}) {
                if (!objectName || !Array.isArray(records)) throw new Error("createTree({ objectName, records }) requires objectName & records array");
                const path = `${endpoints.dataBase}/composite/tree/${objectName}`;
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

            /**
             * request({ base, path, method, params, body })
             * --------------------------------------------
             * Escape hatch for endpoints without a dedicated method. Always prefer
             * a dedicated method when one exists.
             *
             * Pass query parameters via `params` - do NOT append a query string to
             * `path`, or it will be lost when the DayBack relay is active.
             *
             * @param {object} config
             * @param {string} [config.base="data"] - "data" (/services/data/vXX),
             *   "query" (the query endpoint), "apex" (/services/apexrest), or "raw"
             *   (path is a full URL, or is appended to the instance origin).
             * @param {string} [config.path=""] - path appended to the chosen base
             * @param {string} [config.method="GET"] - HTTP method
             * @param {object} [config.params] - query parameters
             * @param {object} [config.body] - request body for POST/PATCH/PUT
             * @returns {Promise<object>} standard response object; data = raw payload
             */
            async function request({ base = "data", path = "", method = "GET", params, body } = {}) {
                const bases = {
                    data: endpoints.dataBase,
                    query: endpoints.queryUrl,
                    apex: endpoints.apexBase,
                    raw: endpoints.base,
                };
                if (!Object.prototype.hasOwnProperty.call(bases, base)) {
                    throw new Error(`request({ base }) must be one of ${Object.keys(bases).join(", ")}`);
                }
                // "raw" accepts a fully-qualified URL as the path
                const url = (base === "raw" && /^https?:\/\//.test(path))
                    ? path
                    : `${bases[base]}${path && !path.startsWith("/") ? "/" : ""}${path}`;
                const res = await ajax(method, url, { params, body });
                return buildResponse(res, { data: res.payload });
            }

            /**
             * compoundBatch({
             *   requests: [ {...}, {...}, ... ],  // array of objectName records (POST/PATCH)
             *   batchSize: 200,                   // max records per inner composite/sobjects (SF limit)
             *   envelopeSize: 25,                 // max compositeRequest items in outer batch
             *   method: "POST" | "PATCH",         // inferred from requests if omitted
             *   allOrNone: true
             * })
             *
             * Returns a single composite result object.
             */
            async function compoundBatch({
                requests,
                batchSize = 200,
                envelopeSize = 25,
                method,               // optional override for POST vs PATCH
                allOrNone = true,
            } = {}) {
                if (!Array.isArray(requests)) {
                    throw new Error("compoundBatch requires an array of the sObject's records.");
                }

                // Determine POST/PATCH dynamically if not supplied
                const inferredMethod = method || (requests[0]?.id ? "PATCH" : "POST");

                // Step 1: Chunk into inner /composite/sobjects batches
                const innerBatches = [];
                for (let i = 0; i < requests.length; i += batchSize) {
                    innerBatches.push(requests.slice(i, i + batchSize));
                }

                // Step 2: Build compositeRequest entries
                const compositeRequests = innerBatches.map((batch, i) => ({
                    method: inferredMethod,
                    url: `/services/data/${endpoints.version}/composite/sobjects`,
                    referenceId: `batch${i}`,
                    body: {
                        allOrNone,
                        records: batch.map(rec => ({
                            attributes: { type: rec.attributes?.type },
                            id: rec.id,
                            ...Object.fromEntries(
                                Object.entries(rec)
                                    .filter(([k]) => !["id", "attributes"].includes(k))
                            )
                        }))
                    }
                }));

                // Step 3: Outer composite envelope chunking (25 max)
                const envelopes = [];
                for (let i = 0; i < compositeRequests.length; i += envelopeSize) {
                    envelopes.push(compositeRequests.slice(i, i + envelopeSize));
                }

                // Step 4: Execute envelopes serially (required for dependencies)
                let lastResponse = null;
                const results = [];

                for (let e = 0; e < envelopes.length; e++) {
                    const body = {
                        allOrNone,
                        compositeRequest: envelopes[e]
                    };

                    const url = `${endpoints.dataBase}/composite`;

                    const res = await ajax("POST", url, { body });
                    lastResponse = res;
                    results.push(res.payload);

                    if (!res.ok) {
                        // Stop immediately on composite-level error
                        return buildResponse(res, { data: results });
                    }

                    // Check for inner composite errors
                    const inner = res.payload?.compositeResponse || [];
                    const innerErr = inner.find(r =>
                        r.httpStatusCode !== 200 &&
                        r.httpStatusCode !== 201 &&
                        r.httpStatusCode !== 204
                    );

                    if (innerErr) {
                        // Propagate error in format consistent with SalesforceClient
                        const p = parseSfErrorPayload(innerErr?.body);
                        const err = {
                            httpStatus: innerErr.httpStatusCode,
                            message: p.message,
                            code: p.code,
                            payload: innerErr.body,
                            method: inferredMethod,
                            url,
                            source: "rest"
                        };
                        return shouldThrow
                            ? Promise.reject(makeSfError(err))
                            : asResult(err);
                    }
                }

                return buildResponse(lastResponse || { ok: true, status: 200 }, {
                    data: results
                });
            }

            /**
             * bulkQuery({ soql, onRow, delayMs, maxPages })
             * -----------
             * A streaming, memory-efficient SOQL query API.
             * Supports:
             *   - auto-pagination
             *   - async iteration over rows
             *   - async iteration over pages
             *   - optional throttling (delay)
             *   - optional max page limit
             *   - optional full collect()
             *
             * Usage:
             *    for await (const row of sf.bulkQuery({ soql })) { ... }
             *
             *    const rows = await sf.bulkQuery.collect({ soql });
             *
             *    for await (const page of sf.bulkQuery.pages({ soql })) { ... }
             *
             * If onRow is supplied:
             *    - bulkQuery returns a Promise
             *    - generator is consumed internally
             *
             * If onRow is omitted:
             *    - bulkQuery returns an async iterator
             */
            function bulkQueryBase({ soql, onRow, delayMs = 0, maxPages = Infinity } = {}) {
                if (!soql) throw new Error("bulkQuery({ soql }) requires a SOQL string");

                async function* rowGenerator() {
                    // First page sends the SOQL as a `q` parameter; every following
                    // page is a nextRecordsUrl, which carries no query string.
                    let nextUrl = queryBaseUrl();
                    let nextParams = { q: soql };
                    let pageCount = 0;

                    while (nextUrl && pageCount < maxPages) {
                        const res = await ajax("GET", nextUrl, { params: nextParams });
                        nextParams = undefined;

                        if (!res.ok) {
                            const p = parseSfErrorPayload(res.payload);
                            throw makeSfError({
                                httpStatus: res.status,
                                message: p.message,
                                code: p.code,
                                payload: res.payload,
                                method: res.method,
                                url: res.url,
                                source: res.source
                            });
                        }

                        const records = res.payload?.records || [];
                        for (const r of records) yield r;

                        pageCount++;

                        const nxt = res.payload?.nextRecordsUrl;
                        nextUrl = nxt ? `${endpoints.base}${nxt}` : null;

                        if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));
                    }
                }

                // If the user provides onRow, run immediately and return a Promise.
                if (typeof onRow === "function") {
                    return (async () => {
                        for await (const row of rowGenerator()) {
                            await onRow(row);
                        }
                    })();
                }

                // Otherwise return the async iterator itself.
                return rowGenerator();
            }

            // ----- Full collector -----
            bulkQueryBase.collect = async function ({ soql, delayMs = 0, maxPages = Infinity } = {}) {
                const rows = [];
                for await (const row of bulkQueryBase({ soql, delayMs, maxPages })) {
                    rows.push(row);
                }
                return rows;
            };

            // ----- Page generator -----
            bulkQueryBase.pages = async function* ({ soql, delayMs = 0, maxPages = Infinity } = {}) {
                if (!soql) throw new Error("bulkQuery.pages({ soql }) requires a SOQL string");

                // See rowGenerator: SOQL as a parameter on page one, bare
                // nextRecordsUrl thereafter.
                let nextUrl = queryBaseUrl();
                let nextParams = { q: soql };
                let pageCount = 0;

                while (nextUrl && pageCount < maxPages) {
                    const res = await ajax("GET", nextUrl, { params: nextParams });
                    nextParams = undefined;

                    if (!res.ok) {
                        const p = parseSfErrorPayload(res.payload);
                        throw makeSfError({
                            httpStatus: res.status,
                            message: p.message,
                            code: p.code,
                            payload: res.payload,
                            method: res.method,
                            url: res.url,
                            source: res.source
                        });
                    }

                    const page = res.payload?.records || [];
                    yield page;

                    pageCount++;
                    const nxt = res.payload?.nextRecordsUrl;
                    nextUrl = nxt ? `${endpoints.base}${nxt}` : null;

                    if (delayMs > 0) {
                        await new Promise(r => setTimeout(r, delayMs));
                    }
                }
            };

            const bulkQuery = bulkQueryBase;

            // Public surface (new object-based API)
            return {
                endpoints,
                getClientVersion,
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
                // Metadata / introspection
                objects: getObjects,
                getSObjects: getObjects,
                describe,
                // Advanced
                batch,
                createTree,
                apex,
                request,
                showError,
                compoundBatch,
                bulkQuery
            };
        }

        // Global export. `version` and `getClientVersion` hang off the
        // constructor so a caller can check what it is dealing with without
        // building a client first.
        SalesforceClient.version = CLIENT_VERSION;
        SalesforceClient.getClientVersion = getClientVersion;
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
