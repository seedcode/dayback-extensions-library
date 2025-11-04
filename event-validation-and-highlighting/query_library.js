// Salesforce Client for Canvas + Direct REST (sfApi.ajaxRequest)
// --------------------------------------------------------------
// Usage:
//   const sf = SalesforceClient({ mode: 'canvas' }); // inside Canvas app
//   const sf = SalesforceClient({ mode: 'rest', sfApi }); // outside Canvas app
//
//   const [resp, rows] = await sf.query("SELECT Id, Name FROM Contact WHERE Email = " + escapeSOQL(email));
//   const [r2, ins]   = await sf.create("Contact", { FirstName: "Ada", LastName: "Lovelace" });
//   const [r3]        = await sf.update("Contact", ins.id, { Title: "CTO" });
//   const [r4, got]   = await sf.retrieve("Contact", ins.id, ["Id","Name","Title"]);
//   const [r5, res]   = await sf.apex("POST", "/PauseSession", { body: { /* ... */ } });
//   const [r6, out]   = await sf.batch([ { method:"GET", url:"/sobjects/Contact/" + ins.id, referenceId:"c1" } ]);
//
// Notes:
// - All methods return a tuple: [rawResponse, data].
// - Errors are thrown (reject) with Error.message and Error.code (if supplied by SF).
//
// Dependencies (auto-detected):
// - Canvas mode: Sfdc.canvas.client.ajax, fbk.client(), fbk.context()
// - REST mode:   sfApi.ajaxRequest with sfApi.settings.restURL + sfApi.settings.token

(() => {
    /**
     * Escape a string literal for SOQL.
     * Example: "O'Neil" -> `'O\'Neil'`
     */
    function escapeSOQL(value) {
        return "'" + String(value).replace(/'/g, "\\'") + "'";
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

    function SalesforceClient(config = {}) {
        const {
            mode = "auto", // "canvas" | "rest" | "auto"
            // Canvas extras
            canvasClient = (typeof fbk !== "undefined" && fbk.client) ? fbk.client() : null,
            canvasContext = (typeof fbk !== "undefined" && fbk.context) ? fbk.context() : null,
            apiVersion,    // optional override like "v61.0"
            // REST extras
            restURL,       // optional manual override if not using sfApi.settings.restURL
            accessToken,   // optional manual override if not using sfApi.settings.token
        } = config;

        // Decide transport
        let useCanvas = false;
        if (mode === "canvas") useCanvas = true;
        else if (mode === "rest") useCanvas = false;
        else {
            useCanvas = typeof Sfdc?.canvas() !== "undefined" && typeof fbk?.context() !== "undefined";
        }

        // Endpoints + transport functions
        let endpoints, ajax;

        if (useCanvas) {
            const client = canvasClient || (fbk && fbk.client && fbk.client());
            const context = canvasContext || (fbk && fbk.context && fbk.context());
            if (!client || !context) throw new Error("Canvas mode requires fbk.client() and fbk.context().");

            endpoints = makeEndpointsFromCanvas(context, apiVersion);

            // --- PATCH: robust Canvas transport for POST/PATCH/DELETE/PUT ---
            const canvasAjax = (url, { method = "GET", params, data, headers } = {}) =>
                new Promise((resolve, reject) => {
                    // Append query params
                    let u = url;
                    if (params && typeof params === "object") {
                        const qs = Object.keys(params)
                            .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
                            .join("&");
                        u += (u.indexOf("?") === -1 ? "?" : "&") + qs;
                    }

                    // Canvas proxy is happiest with GET/POST only.
                    // For PATCH/DELETE/PUT, use POST + method override (header + query param for safety).
                    const needsOverride = /^(PATCH|DELETE|PUT)$/i.test(method);
                    const sendMethod = needsOverride ? "POST" : method.toUpperCase();

                    // Add _HttpMethod override in the URL too (older proxies expect this)
                    if (needsOverride) {
                        u += (u.indexOf("?") === -1 ? "?" : "&") + `_HttpMethod=${method.toUpperCase()}`;
                    }

                    // Canvas expects JSON string for bodies; avoid passing plain objects.
                    const hasBody = sendMethod !== "GET" && sendMethod !== "HEAD";
                    const payload = hasBody ? (data != null ? JSON.stringify(data) : "") : undefined;

                    const hdrs = Object.assign(
                        {},
                        headers || {},
                        hasBody ? { "Content-Type": "application/json", "Accept": "application/json" } : {},
                        needsOverride ? { "X-HTTP-Method-Override": method.toUpperCase() } : {}
                    );

                    Sfdc.canvas.client.ajax(u, {
                        client,
                        method: sendMethod,
                        contentType: "application/json",
                        headers: hdrs,
                        data: payload,
                        success: (res) => resolve(res),
                        error: (err) => reject(err),
                    });
                });

            ajax = async (method, url, { params, body } = {}) => {
                const res = await canvasAjax(url, { method, params, data: body });
                // Normalize: ensure { status, payload }
                if (typeof res === "object" && "status" in res && "payload" in res) {
                    return res;
                }
                return { status: 200, payload: res };
            };

        } else {
            const _sfApi = sfApi;
            if (!_sfApi || !_sfApi.ajaxRequest || !_sfApi.settings) {
                if (!restURL || !accessToken) {
                    throw new Error("REST mode requires sfApi.ajaxRequest + sfApi.settings.{restURL,token} OR restURL + accessToken.");
                }
            }
            const _restURL = _sfApi ? _sfApi.settings.restURL : restURL;
            const _token = _sfApi ? _sfApi.settings.token : accessToken;
            endpoints = splitRestURL(_restURL);

            const sfAjax = ({ url, method = "GET", params, data }) =>
                new Promise((resolve, reject) => {
                    (_sfApi || { ajaxRequest: () => { } }).ajaxRequest ? _sfApi.ajaxRequest({
                        url,
                        type: method,
                        params,
                        data,
                        preventErrorReporter: true,
                        access_token: _token,
                        onSuccess: (response) => resolve({ status: 200, payload: response }),
                        onError: (error) => {
                            try {
                                const arr = JSON.parse(error);
                                const e = new Error(arr[0]?.message || "Salesforce Error");
                                e.code = arr[0]?.errorCode;
                                e.raw = arr;
                                reject(e);
                            } catch (e2) {
                                reject(new Error(String(error)));
                            }
                        },
                    }) : reject(new Error("sfApi.ajaxRequest not found"));
                });

            ajax = (method, url, { params, body } = {}) =>
                sfAjax({ url, method, params, data: body });
        }

        // Core ops
        async function query(soql, { pageAll = true } = {}) {
            // First page
            const [firstResp, firstRecords, nextUrl, lastResp] = await (async () => {
                if (useCanvas) {
                    const u = `${endpoints.queryUrl}?q=${encodeURIComponent(soql)}`;
                    const res = await ajax("GET", u);
                    const recs = (res.payload && res.payload.records) || [];
                    return [res, recs, res.payload && res.payload.nextRecordsUrl, res];
                } else {
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
        };
    }

    // UMD-ish export
    globalThis.SalesforceClient = SalesforceClient;
    globalThis.escapeSOQL = escapeSOQL;
})();
