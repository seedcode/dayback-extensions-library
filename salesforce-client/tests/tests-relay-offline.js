// ---- SalesforceClient Relay Contract Tests (offline) ----
//
// UNLIKE the other files in this folder, this is NOT a DayBack action. It runs
// under Node and touches no Salesforce org:
//
//     node tests/tests-relay-offline.js
//
// It loads ../on-startup.js in a simulated DayBack eval scope, backed by a stub
// sfApi whose ajaxRequest reproduces the URL-affecting logic verbatim from
// dayback/libraries/dayback/sfApi.js.
//
// SCOPE - read this before adding assertions
// ------------------------------------------
// This file asserts ONLY what the client controls: the arguments it hands to
// sfApi.ajaxRequest. It deliberately does NOT model what the relay server does
// with those arguments, and must not start doing so.
//
// The reason is that a stub which models a remote system confirms the model, not
// the system. Modelling the relay's decoding here produced a fully green suite
// for a client that Salesforce rejected with MALFORMED_QUERY
// ("unexpected token: '%'"), because the SOQL arrived encoded one time too many.
// End-to-end encoding can only be verified against a real relay - that belongs in
// tests-smoke.js.
//
// What IS verifiable here is the invariant that matters most:
//   sfApi discards any query string the caller puts in `url`
//   (sfApi.js: options.url.split('?')[0]) whenever the relay is active. So every
//   SOQL query must reach sfApi in `params`, never inlined into `url`.
//
// Point it at another copy of the client to compare:
//     SF_CLIENT=/path/to/other/on-startup.js node tests/tests-relay-offline.js
//
// Exits non-zero if any assertion fails.

const fs = require('fs');

const CLIENT =
    process.env.SF_CLIENT ||
    __dirname + '/../on-startup.js';

const INSTANCE = 'https://example.my.salesforce.com';
const REST_URL = `${INSTANCE}/services/data/v55.0/`;
const RELAY = 'https://api-connect.dayback.com/api/sfrelay/v1';

// ---------------------------------------------------------------------------
// Stub sfApi. ajaxRequest's URL handling is a verbatim port of sfApi.js.
// ---------------------------------------------------------------------------
function makeSfApi(sent) {
    const proxyOptions = {};

    function ajaxRequest(options, retryCount) {
        // Snapshot what the client asked for. sfApi MUTATES options.url in place
        // during the proxy rewrite below, so this has to be captured first.
        const requestedUrl = options.url;

        // --- begin verbatim port of sfApi.js:570-619 ---
        const requestURL = new URL(options.url);
        const urlParts = requestURL.hostname.split('.');
        const requestDomain = urlParts[urlParts.length - 2];
        if (proxyOptions.enabled) {
            if (requestDomain !== 'dayback') {
                const endpoint = options.url.split('?')[0];
                options.url = `${proxyOptions.url}?apiKey=${encodeURIComponent(proxyOptions.apiKey)}&endpoint=${encodeURIComponent(endpoint)}`;
            }
        }
        let url = options.url;
        const paramList = [];
        if (options.params) {
            const symbols = {questionMark: '?', ampersand: '&', equals: '='};
            if (proxyOptions.enabled && requestDomain !== 'dayback') {
                symbols.questionMark = encodeURIComponent('?');
                symbols.ampersand = encodeURIComponent('&');
                symbols.equals = encodeURIComponent('=');
            }
            for (const param in options.params) {
                paramList.push(
                    `${encodeURIComponent(param)}${symbols.equals}${encodeURIComponent(options.params[param])}`
                );
            }
            url += `${symbols.questionMark}${paramList.join(symbols.ampersand)}`;
        }
        const type = options.type ? options.type.toUpperCase() : 'GET';
        // --- end verbatim port ---

        sent.push({
            method: type,
            // What the client asked for, before sfApi touched anything:
            requestedUrl,
            params: options.params,
            paramKeys: options.params ? Object.keys(options.params) : [],
            body: options.data ? JSON.stringify(options.data) : undefined,
            retryCheck: options.retryCheck,
            retryCount: retryCount || 0,
            // What went on the wire (relay-wrapped when the latch is on):
            wireUrl: url,
            viaRelay: url.startsWith(RELAY),
        });

        setTimeout(() => options.onSuccess({records: [], totalSize: 0, done: true}), 0);
    }

    return {
        settings: {restURL: REST_URL, token: 'TOKEN', config: {}, retryLimit: 2},
        retryCheck: function retryCheck(result) {
            return result;
        },
        ajaxRequest,
        useProxy(apiKey, url) {
            proxyOptions.enabled = true;
            proxyOptions.apiKey = apiKey;
            proxyOptions.url = url ?? RELAY;
        },
        getProxy: () => proxyOptions,
        auth() {
            throw new Error('auth should not be needed: settings already have a token');
        },
    };
}

// ---------------------------------------------------------------------------
// Load the client in a simulated DayBack action scope
// ---------------------------------------------------------------------------
function loadClient(sfApi) {
    const src = fs.readFileSync(CLIENT, 'utf8');
    const scope = {
        sfApi,
        Sfdc: {},
        fbk: {},
        seedcodeCalendar: {get: (k) => (k === 'config' ? {account: 'test'} : [])},
        action: {name: 'Salesforce Client', preventDefault: false, callbacks: {}},
        utilities: {showModal() {}, showMessage() {}, escapeHtml: (s) => s},
        moment: () => ({format: () => ''}),
        globalThis,
    };
    globalThis.sfApi = sfApi;
    globalThis.Sfdc = scope.Sfdc;
    globalThis.fbk = scope.fbk;
    const fn = new Function(
        ...Object.keys(scope),
        `${src}\n;return globalThis.SalesforceClient;`
    );
    return fn(...Object.values(scope));
}

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------
let pass = 0;
let fail = 0;

function check(name, actual, expected) {
    const ok = actual === expected;
    if (ok) {
        pass++;
        console.log(`  PASS  ${name}`);
    } else {
        fail++;
        console.log(`  FAIL  ${name}`);
        console.log(`        expected: ${JSON.stringify(expected)}`);
        console.log(`        actual:   ${JSON.stringify(actual)}`);
    }
}

// A realistic SOQL string: template literals in real actions carry newlines and
// tabs, which is what surfaced the encoding bug in the live org.
const SOQL = `SELECT
\t\t\tId,
\t\t\tSubject
\t\tFROM Event
\t\tWHERE Subject = 'a+b & c=d 100% O\\'Neil'
\t\tLIMIT 1`;

// The core invariants:
//   1. SOQL travels in params, never inlined into the URL (the relay discards a
//      caller-supplied query string).
//   2. Relayed values are pre-encoded, direct values are not. A relayed value
//      must survive two decodes - the relay's own `endpoint`, then Salesforce's
//      query string - and sfApi only supplies one level.
function checkSoqlIsAParam(label, rec, relayOn) {
    const expected = relayOn ? encodeURIComponent(SOQL) : SOQL;
    check(
        `${label}: SOQL passed via params.q, ${relayOn ? 'pre-encoded for the relay' : 'raw'}`,
        rec.params && rec.params.q,
        expected
    );
    check(`${label}: no query string inlined in url`, rec.requestedUrl.indexOf('?'), -1);
}

async function runSuite(label, relayOn) {
    console.log(`\n=== ${label} ===`);
    const sent = [];
    const sfApi = makeSfApi(sent);
    if (relayOn) sfApi.useProxy('SECRET-KEY');
    const SalesforceClient = loadClient(sfApi);
    const sf = SalesforceClient();

    // --- query -------------------------------------------------------------
    sent.length = 0;
    await sf.query(SOQL);
    checkSoqlIsAParam('query', sent[0], relayOn);
    check('query: relay used as expected', sent[0].viaRelay, relayOn);
    check(
        'query: targets the query endpoint',
        new URL(sent[0].requestedUrl).pathname,
        '/services/data/v55.0/query/'
    );
    check('query: retryCheck supplied', typeof sent[0].retryCheck, 'function');

    // --- bulkQuery (the method that was silently dropping SOQL) ------------
    sent.length = 0;
    await sf.bulkQuery.collect({soql: SOQL});
    checkSoqlIsAParam('bulkQuery', sent[0], relayOn);

    sent.length = 0;
    for await (const page of sf.bulkQuery.pages({soql: SOQL})) {
        void page;
    }
    checkSoqlIsAParam('bulkQuery.pages', sent[0], relayOn);

    // --- retrieve ----------------------------------------------------------
    sent.length = 0;
    await sf.retrieve({objectName: 'Contact', id: '003xx', fields: ['Id', 'Name', 'Title']});
    check(
        'retrieve: fields passed via params',
        sent[0].params?.fields,
        relayOn ? encodeURIComponent('Id,Name,Title') : 'Id,Name,Title'
    );
    check('retrieve: no inline query string', sent[0].requestedUrl.indexOf('?'), -1);
    check(
        'retrieve: path',
        new URL(sent[0].requestedUrl).pathname,
        '/services/data/v55.0/sobjects/Contact/003xx'
    );

    // --- describe / getSObjects -------------------------------------------
    // Guarded so this harness can also run against a pre-v2.2 client.
    if (typeof sf.describe === 'function') {
        sent.length = 0;
        await sf.describe({objectName: 'Event'});
        check(
            'describe: path',
            new URL(sent[0].requestedUrl).pathname,
            '/services/data/v55.0/sobjects/Event/describe/'
        );
    } else {
        check('describe: exists', false, true);
    }

    if (typeof sf.getSObjects === 'function') {
        sent.length = 0;
        await sf.getSObjects();
        check(
            'getSObjects: path',
            new URL(sent[0].requestedUrl).pathname,
            '/services/data/v55.0/sobjects/'
        );
    } else {
        check('getSObjects: exists', false, true);
    }

    // --- request (generic) -------------------------------------------------
    if (typeof sf.request === 'function') {
        sent.length = 0;
        await sf.request({base: 'data', path: '/limits', params: {foo: 'a&b'}});
        check(
            'request: path',
            new URL(sent[0].requestedUrl).pathname,
            '/services/data/v55.0/limits'
        );
        // A raw & would split the relay's own query string, so it must be
        // pre-encoded when relayed and left alone when direct.
        check(
            'request: param carrying & encoded for the transport',
            sent[0].params?.foo,
            relayOn ? encodeURIComponent('a&b') : 'a&b'
        );
        check('request: no inline query string', sent[0].requestedUrl.indexOf('?'), -1);
    } else {
        check('request: exists', false, true);
    }

    // --- writes go in the body --------------------------------------------
    sent.length = 0;
    await sf.create({objectName: 'Event', record: {Subject: 'a+b & c=d'}});
    check('create: method', sent[0].method, 'POST');
    check('create: body preserved', sent[0].body, JSON.stringify({Subject: 'a+b & c=d'}));
    check('create: no params', sent[0].paramKeys.length, 0);

    // --- upsert -------------------------------------------------------------
    sent.length = 0;
    let upsertError = null;
    try {
        await sf.upsert({
            objectName: 'Event',
            externalIdField: 'DBK_External_Id__c',
            externalIdValue: 'SMOKE-1',
            record: {Subject: 'x'},
        });
    } catch (e) {
        upsertError = e.message;
    }
    check('upsert: does not throw', upsertError, null);
    check('upsert: body preserved', sent[0] && sent[0].body, JSON.stringify({Subject: 'x'}));
    check(
        'upsert: path',
        sent[0] && new URL(sent[0].requestedUrl).pathname,
        '/services/data/v55.0/sobjects/Event/DBK_External_Id__c/SMOKE-1'
    );
}

(async () => {
    await runSuite('Relay OFF (direct Salesforce Connect)', false);
    await runSuite('Relay ON  (sfApi.useProxy)', true);

    // --- {relay:false} override with the global latch engaged --------------
    console.log('\n=== Override: SalesforceClient({ relay: false }) with useProxy() active ===');
    const sent = [];
    const sfApi = makeSfApi(sent);
    sfApi.useProxy('SECRET-KEY');
    const SalesforceClient = loadClient(sfApi);
    const direct = SalesforceClient({relay: false});
    await direct.query(SOQL);
    check('override: bypasses the relay', sent[0].viaRelay, false);
    check('override: SOQL still passed via params', sent[0].params?.q, SOQL);
    check(
        'override: wire URL goes straight to the instance',
        sent[0].wireUrl.startsWith(INSTANCE),
        true
    );

    console.log(`\n${pass} passed, ${fail} failed`);
    console.log(
        '\nNOTE: end-to-end relay encoding is NOT covered here - see the SCOPE\n' +
        'comment at the top of this file. Verify it with tests-smoke.js\n' +
        'against a real relayed org.'
    );
    process.exit(fail ? 1 : 0);
})();
