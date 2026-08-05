// ---- SalesforceClient Smoke Tests ----
//
// Name: SalesforceClient Smoke Tests
// Type: Event Action
//
// One suite for every environment. SalesforceClient auto-detects its transport,
// so this suite does not configure one - it reports what it discovered and runs
// the same assertions either way:
//
//   * DayBack Canvas app  -> Sfdc.canvas.client.ajax
//   * Salesforce Connect  -> sfApi.ajaxRequest
//
// The DayBack relay is likewise not configured here. An On Startup action either
// called sfApi.useProxy(dbkEnv.sfrelayAPIKey) or it did not; this suite detects
// that and, when the relay is active, runs everything a second time with
// SalesforceClient({ relay: false }) so relay-specific failures are unmistakable.
// (The relay only exists on the Connect transport - Canvas never touches sfApi -
// so the second pass simply does not happen in Canvas.)
//
// Run as an Event Action: `event` supplies the baseline record.
//
// THIS WILL CREATE / UPDATE / DELETE REAL RECORDS. Review TEST_CONFIG first.
// Results go to the browser console; every check reports PASS or FAIL and the
// suite finishes even when individual checks fail.
//
// For a fast, org-free check of the sfApi call contract, run
// tests/tests-relay-offline.js under Node instead.

(async function runSalesforceClientSmokeTests() {
	// ---- CONFIG ----
	const TEST_CONFIG = {
		// The object your calendar's events live in.
		objectName: 'Event',

		// Field mapping on that object.
		fields: {
			title: 'Subject',
			description: 'Description',
			location: 'Location',
			start: 'StartDateTime',
			end: 'EndDateTime',
			status: 'Status__c',
		},

		// Valid picklist values for fields.status. The suite only ever writes
		// values from this list, so keep it accurate for your org.
		statusValues: ['Available', 'Pending', 'Ready', 'Out of Office'],

		// Upsert needs a real External ID field on objectName. The suite
		// describes the field first and tells you exactly what is wrong if it
		// cannot be used as an upsert key, listing the External ID fields the
		// object does have. Casing here does not matter - the match is
		// case-insensitive, as Salesforce API names are. Set enabled false to
		// skip.
		upsert: {
			enabled: true,
			externalIdField: 'DBK_External_Id__c',
			externalIdValuePrefix: 'SMOKETEST-',
		},

		// Apex REST endpoints. Off by default because they need an endpoint
		// deployed in your org - otherwise the check fails with a 404 that looks
		// like a client bug. Deploy tests/apex/HelloWorldText.cls and enable, or
		// point path at any Apex REST endpoint you already have.
		apex1: {
			enabled: true,
			method: 'GET',
			path: '/HelloWorld',
		},

		apex2: {
			enabled: true,
			method: 'POST',
			path: '/HelloWorld',
			body: {name: 'SalesforceClient'},
		},

		// When the relay is active, re-run everything with { relay: false } and
		// diff the two result sets. No effect when the relay is off.
		compareRelayAndDirect: true,

		// Pages bulkQuery.pages should walk. A page is 2000 records, so 1 is
		// plenty unless the test day holds more than that.
		bulkQueryMaxPages: 2,

		// false = delete everything the suite created before it finishes.
		keepCreatedRecords: true,
	};

	// Characters that are ambiguous in a URL query string. Round-tripping a
	// value containing these through a SOQL filter is the only way to prove the
	// transport (relay included) preserves parameter values.
	const HOSTILE_CHARS = "a+b & c=d 100% #x O'Neil";

	// ---- HELPERS ----
	let results = [];

	const log = (msg) => console.log('[SF TEST]', msg);
	const toastError = (text) => console.error('[SF TEST ERROR]', text);

	// Record a named outcome so the two passes can be compared.
	const assert = (name, ok, detail) => {
		results.push({name, ok: !!ok, detail});
		console.log(
			`[SF TEST] ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` - ${detail}` : ''}`
		);
		return !!ok;
	};

	// Every check runs inside step(), so one failure never aborts the suite.
	// Returning a string adds detail to the PASS line; throwing fails the check.
	const step = async (name, fn) => {
		try {
			return assert(name, true, await fn());
		} catch (e) {
			return assert(name, false, e && e.message ? e.message : String(e));
		}
	};

	// A check that cannot run yet is a failure with a clear reason, not a crash.
	const needs = (value, what) => {
		if (value === null || value === undefined || value === '') {
			throw new Error(`cannot run: ${what}`);
		}
		return value;
	};

	// Is the DayBack relay active? Only ever true on the Connect transport.
	const relayState = () => {
		if (typeof sfApi === 'undefined' || !sfApi || !sfApi.getProxy) {
			return null;
		}
		const p = sfApi.getProxy();
		return p && p.enabled ? p : null;
	};

	const isoZ = (m) => m.clone().toDate().toISOString();
	const nowStamp = () => moment().format('YYYY-MM-DD HH:mm:ss');

	function assertMoment(m, name) {
		if (!m || typeof m.format !== 'function') {
			throw new Error(`Expected a moment() for ${name}.`);
		}
	}

	// ---- PRECONDITIONS ----
	try {
		if (typeof SalesforceClient !== 'function') {
			throw new Error(
				'SalesforceClient is not loaded. Install the library as an On Startup app action.'
			);
		}
		if (!event || !event.eventID) throw new Error('Missing event.eventID.');
		assertMoment(event.start, 'event.start');
		assertMoment(event.end, 'event.end');
	} catch (e) {
		toastError(`Precondition failed: ${e.message}`);
		if (action?.callbacks?.cancel) return action.callbacks.cancel();
		return;
	}

	// ---- SHARED SETUP ----
	const SOBJ = TEST_CONFIG.objectName;
	const F = TEST_CONFIG.fields;
	const STATUS = TEST_CONFIG.statusValues;

	const dayStart = event.start.clone().startOf('day');
	const dayEnd = event.start.clone().endOf('day');
	const newStart = event.start.clone().startOf('day').add(11, 'hours');
	const newEnd = newStart.clone().add(1, 'hour');

	const soqlDateBetween = (fieldApi, start, end) =>
		`${fieldApi} >= ${isoZ(start)} AND ${fieldApi} <= ${isoZ(end)}`;

	// Event requires a duration alongside its start/end; other objects do not.
	const durationFor = (start, end) =>
		SOBJ === 'Event'
			? {DurationInMinutes: Math.max(1, end.diff(start, 'minutes'))}
			: {};

	// Event's title is always Subject, whatever the calendar maps.
	const titleField = SOBJ === 'Event' ? 'Subject' : F.title;

	// ---- THE SUITE ----
	// Takes the client as a parameter so it can run twice against the same org.
	async function runSuite(sf) {
		// Every record this pass creates, for cleanup at the end.
		const createdIds = [];
		const remember = (id) => {
			if (id) createdIds.push(id);
			return id;
		};

		let baseline = null;
		let createdId = null;
		let dayRowCount = null;
		let transport = null;

		// --- A) RETRIEVE by Id -------------------------------------------
		await step('retrieve: baseline record by Id', async () => {
			const r = await sf.retrieve({
				objectName: SOBJ,
				id: event.eventID,
				fields: [
					'Id',
					F.title,
					F.description,
					F.location,
					F.start,
					F.end,
					F.status,
				],
			});
			if (!r.ok) throw new Error(r.error?.message || 'retrieve not ok');
			baseline = r.data;
			// The response reports which transport served it - this is the
			// authoritative environment check, straight from the client.
			transport = r.source;
			return `${r.status} via ${transport}, title: ${baseline?.[titleField] || '(none)'}`;
		});

		log(
			`Transport in use: ${transport || 'unknown'}` +
				(sf.endpoints?.version ? ` (API ${sf.endpoints.version})` : '')
		);

		// --- B) QUERY by Id ----------------------------------------------
		await step('query: baseline record by Id', async () => {
			const r = await sf.query({
				soql: `SELECT Id, ${F.title}, ${F.start}, ${F.end}, ${F.status}
						FROM ${SOBJ}
						WHERE Id = ${sf.quote(event.eventID)}
						LIMIT 1`,
			});
			if (!r.ok) throw new Error(r.error?.message || 'query not ok');
			if (r.data.length !== 1) {
				throw new Error(`expected 1 row, got ${r.data.length}`);
			}
			return `1 row, totalSize ${r.meta?.totalSize}`;
		});

		// --- C) UPDATE ----------------------------------------------------
		await step('update: baseline title and status', async () => {
			needs(baseline, 'retrieve (A) did not return the baseline');
			const nextStatus =
				STATUS.find((s) => s !== (baseline?.[F.status] || '')) ||
				STATUS[0];
			const r = await sf.update({
				objectName: SOBJ,
				id: event.eventID,
				record: {
					[titleField]: `[TEST ${nowStamp()}] ${baseline?.[titleField] || '(no title)'}`,
					[F.status]: nextStatus,
				},
			});
			if (!r.ok) throw new Error(r.error?.message || 'update not ok');
			return `${r.status}, status -> ${nextStatus}`;
		});

		// --- D) CREATE ----------------------------------------------------
		await step('create: new record on the same day', async () => {
			const r = await sf.create({
				objectName: SOBJ,
				record: {
					[titleField]: `[TEST CREATE] ${nowStamp()}`,
					[F.description]: 'Created by SalesforceClient smoke tests',
					[F.location]: 'Test Location',
					[F.start]: isoZ(newStart),
					[F.end]: isoZ(newEnd),
					[F.status]: STATUS[0],
					...durationFor(newStart, newEnd),
				},
			});
			if (!r.ok) throw new Error(r.error?.message || 'create not ok');
			createdId = remember(r.data?.id);
			if (!createdId) throw new Error('create returned no id');
			return `${r.status}, id ${createdId}`;
		});

		// --- E) RETRIEVE the created record -------------------------------
		await step('retrieve: the created record', async () => {
			needs(createdId, 'create (D) did not produce an id');
			const r = await sf.retrieve({
				objectName: SOBJ,
				id: createdId,
				fields: ['Id', F.title, F.status, F.start, F.end],
			});
			if (!r.ok) throw new Error(r.error?.message || 'retrieve not ok');
			return `${r.status}, title: ${r.data?.[titleField]}`;
		});

		// --- F) QUERY the whole day ---------------------------------------
		const whereDay = soqlDateBetween(F.start, dayStart, dayEnd);
		await step('query: all records on the test day', async () => {
			const r = await sf.query({
				soql: `SELECT Id, ${F.title}, ${F.start}, ${F.end}, ${F.status}
						FROM ${SOBJ}
						WHERE ${whereDay}
						ORDER BY ${F.start}`,
			});
			if (!r.ok) throw new Error(r.error?.message || 'query not ok');
			dayRowCount = r.data.length;
			return `${dayRowCount} row(s)`;
		});

		// --- G) UPSERT ----------------------------------------------------
		if (TEST_CONFIG.upsert.enabled) {
			await step('upsert: UPDATE and INSERT paths', async () => {
				needs(createdId, 'create (D) did not produce an id');
				const configuredField = TEST_CONFIG.upsert.externalIdField;

				// Salesforce answers every bad upsert key with the same message,
				// "Provided external ID field does not exist or is not
				// accessible", whether the field is missing, not flagged
				// External ID, or not usable as a key. Describe distinguishes them.
				const desc = await sf.describe({objectName: SOBJ});
				const fields = desc.data?.fields;
				if (!Array.isArray(fields)) {
					throw new Error(
						`describe(${SOBJ}) returned no fields array ` +
							`(ok=${desc.ok} status=${desc.status})`
					);
				}

				// Salesforce field API names are case-insensitive, so SOQL
				// accepts any casing while a === comparison here does not. Orgs
				// differ in how the same field was typed (DBK_ vs DBk_), so
				// match case-insensitively, then adopt the org's own spelling.
				const meta = fields.find(
					(f) => f.name.toLowerCase() === configuredField.toLowerCase()
				);
				if (!meta) {
					const ext = fields
						.filter((f) => f.externalId)
						.map((f) => f.name);
					throw new Error(
						`${configuredField} does not exist on ${SOBJ}. External ` +
							`ID fields on this object: ` +
							`${ext.length ? ext.join(', ') : '(none)'}. Point ` +
							`TEST_CONFIG.upsert.externalIdField at one of them, ` +
							`or set upsert.enabled = false.`
					);
				}
				const extField = meta.name;
				if (extField !== configuredField) {
					log(
						`   NOTE: this org spells it ${extField}; configured as ` +
							`${configuredField}. Using the org's spelling.`
					);
				}
				if (!meta.externalId) {
					throw new Error(
						`${extField} exists but is not flagged External ID.`
					);
				}
				log(
					`   ${extField}: type=${meta.type} externalId=${meta.externalId} unique=${meta.unique}`
				);
				if (!meta.unique) {
					log(
						`   NOTE: ${extField} is not Unique. If the upsert below fails ` +
							`with NOT_FOUND, enable Unique in Setup and re-run.`
					);
				}

				// Stamp the external ID so the UPDATE path has something to match.
				const extUpdate = `${TEST_CONFIG.upsert.externalIdValuePrefix}${createdId}`;
				const prep = await sf.update({
					objectName: SOBJ,
					id: createdId,
					record: {[extField]: extUpdate},
				});
				if (!prep.ok) {
					throw new Error(
						`could not write ${extField}: ${prep.error?.message}`
					);
				}

				// UPDATE path - matches the record just stamped (expect 204).
				const rUpd = await sf.upsert({
					objectName: SOBJ,
					externalIdField: extField,
					externalIdValue: extUpdate,
					record: {
						[titleField]: `[TEST UPSERT UPDATE] ${nowStamp()}`,
						[F.description]: 'Upsert UPDATE path',
						[F.start]: isoZ(newStart),
						[F.end]: isoZ(newEnd),
						...durationFor(newStart, newEnd),
					},
				});
				if (!rUpd.ok) {
					throw new Error(
						rUpd.error?.message || 'upsert UPDATE not ok'
					);
				}

				// INSERT path - no record has this value, so one is created
				// (expect 201).
				const extInsert = `${extUpdate}-NEW`;
				const insStart = newStart.clone().add(2, 'hours');
				const insEnd = newEnd.clone().add(2, 'hours');
				const rIns = await sf.upsert({
					objectName: SOBJ,
					externalIdField: extField,
					externalIdValue: extInsert,
					record: {
						[titleField]: `[TEST UPSERT INSERT] ${nowStamp()}`,
						[F.description]: 'Upsert INSERT path',
						[F.start]: isoZ(insStart),
						[F.end]: isoZ(insEnd),
						...durationFor(insStart, insEnd),
					},
				});
				if (!rIns.ok) {
					throw new Error(
						rIns.error?.message || 'upsert INSERT not ok'
					);
				}
				remember(rIns.data?.id);

				return `UPDATE ${rUpd.status}, INSERT ${rIns.status}`;
			});
		} else {
			log('(upsert skipped - TEST_CONFIG.upsert.enabled is false)');
		}

		// --- H) COMPOSITE BATCH -------------------------------------------
		await step('batch: composite GET + GET + PATCH', async () => {
			needs(createdId, 'create (D) did not produce an id');
			const r = await sf.batch({
				requests: [
					{
						method: 'GET',
						url: `/sobjects/${SOBJ}/${event.eventID}`,
						referenceId: 'getBaseline',
					},
					{
						method: 'GET',
						url: `/sobjects/${SOBJ}/${createdId}`,
						referenceId: 'getCreated',
					},
					{
						method: 'PATCH',
						url: `/sobjects/${SOBJ}/${createdId}`,
						referenceId: 'updCreated',
						body: {
							[F.status]: STATUS[1] || STATUS[0],
							[titleField]: `[TEST BATCH] ${nowStamp()}`,
						},
					},
				],
				allOrNone: false,
			});
			if (!r.ok) throw new Error(r.error?.message || 'batch not ok');
			const parts = r.data?.compositeResponse || [];
			const bad = parts.filter(
				(p) => ![200, 201, 204].includes(p.httpStatusCode)
			);
			if (bad.length) {
				throw new Error(
					`subrequest(s) failed: ${bad
						.map((p) => `${p.referenceId}:${p.httpStatusCode}`)
						.join(', ')}`
				);
			}
			return parts
				.map((p) => `${p.referenceId}:${p.httpStatusCode}`)
				.join(', ');
		});

		// --- I) CREATE TREE -----------------------------------------------
		await step('createTree: two records in one call', async () => {
			const aStart = event.start.clone().startOf('day').add(13, 'hours');
			const aEnd = aStart.clone().add(1, 'hour');
			const bStart = aEnd.clone();
			const bEnd = bStart.clone().add(1, 'hour');

			const r = await sf.createTree({
				objectName: SOBJ,
				records: [
					{
						attributes: {type: SOBJ, referenceId: 'tree1'},
						[titleField]: `[TEST TREE #1] ${nowStamp()}`,
						[F.description]: 'Composite Tree (1/2)',
						[F.start]: isoZ(aStart),
						[F.end]: isoZ(aEnd),
						[F.status]: STATUS[1] || STATUS[0],
						...durationFor(aStart, aEnd),
					},
					{
						attributes: {type: SOBJ, referenceId: 'tree2'},
						[titleField]: `[TEST TREE #2] ${nowStamp()}`,
						[F.description]: 'Composite Tree (2/2)',
						[F.start]: isoZ(bStart),
						[F.end]: isoZ(bEnd),
						[F.status]: STATUS[0],
						...durationFor(bStart, bEnd),
					},
				],
			});
			if (!r.ok) throw new Error(r.error?.message || 'createTree not ok');

			const payloads = Array.isArray(r.data) ? r.data : [r.data];
			const ids = [];
			for (const p of payloads) {
				for (const res of p?.results || []) {
					if (res?.id) ids.push(remember(res.id));
				}
			}
			if (!ids.length) throw new Error('createTree returned no ids');
			return `${ids.length} record(s)`;
		});

		// --- J) COMPOUND BATCH --------------------------------------------
		await step('compoundBatch: chunked composite create', async () => {
			const base = event.start.clone().startOf('day').add(16, 'hours');
			const records = [0, 1, 2].map((i) => {
				const s = base.clone().add(i * 10, 'minutes');
				const e = s.clone().add(5, 'minutes');
				return {
					attributes: {type: SOBJ},
					[titleField]: `[TEST COMPOUND ${i}] ${nowStamp()}`,
					[F.description]: 'Inserted via compoundBatch',
					[F.start]: isoZ(s),
					[F.end]: isoZ(e),
					...durationFor(s, e),
				};
			});

			const r = await sf.compoundBatch({
				requests: records,
				batchSize: 200,
				envelopeSize: 25,
			});
			if (!r.ok) {
				throw new Error(r.error?.message || 'compoundBatch not ok');
			}

			const ids = [];
			for (const envelope of r.data || []) {
				for (const sub of envelope?.compositeResponse || []) {
					for (const rec of Array.isArray(sub.body) ? sub.body : []) {
						if (rec?.id) ids.push(remember(rec.id));
					}
				}
			}
			if (!ids.length) {
				throw new Error('compoundBatch returned no record ids');
			}
			return `${ids.length} record(s)`;
		});

		// --- K-N) BULK QUERY, all four consumption modes -------------------
		const bulkSoql = `SELECT Id, ${titleField} FROM ${SOBJ} WHERE ${whereDay} ORDER BY ${F.start}`;

		await step('bulkQuery: async iterator over rows', async () => {
			let seen = 0;
			for await (const row of sf.bulkQuery({soql: bulkSoql})) {
				if (!row || !row.Id) throw new Error('row without an Id');
				seen++;
			}
			if (dayRowCount !== null && seen < dayRowCount) {
				throw new Error(
					`saw ${seen} rows, the day query saw at least ${dayRowCount}`
				);
			}
			return `${seen} row(s) streamed`;
		});

		await step('bulkQuery: onRow callback', async () => {
			let count = 0;
			const returned = await sf.bulkQuery({
				soql: bulkSoql,
				onRow: () => {
					count++;
				},
			});
			// With onRow supplied, bulkQuery runs to completion and resolves.
			if (returned && typeof returned.next === 'function') {
				throw new Error(
					'onRow form returned an iterator instead of running'
				);
			}
			if (!count) throw new Error('onRow was never called');
			return `${count} callback(s)`;
		});

		await step('bulkQuery.collect: all rows in one array', async () => {
			const rows = await sf.bulkQuery.collect({soql: bulkSoql});
			if (!Array.isArray(rows)) {
				throw new Error('collect() did not return an array');
			}
			if (!rows.length) throw new Error('collect() returned no rows');
			return `${rows.length} row(s)`;
		});

		await step('bulkQuery.pages: page iterator', async () => {
			let pages = 0;
			let rows = 0;
			for await (const page of sf.bulkQuery.pages({
				soql: bulkSoql,
				maxPages: TEST_CONFIG.bulkQueryMaxPages,
			})) {
				if (!Array.isArray(page)) {
					throw new Error('pages() yielded a non-array');
				}
				pages++;
				rows += page.length;
			}
			if (!pages) throw new Error('pages() yielded nothing');
			return `${pages} page(s), ${rows} row(s)`;
		});

		// --- O) METADATA: global sObject list ------------------------------
		await step('getSObjects: lists the org objects', async () => {
			const r = await sf.getSObjects();
			if (!r.ok)
				throw new Error(r.error?.message || 'getSObjects not ok');
			const list = r.data?.sobjects;
			if (!Array.isArray(list) || !list.length) {
				throw new Error('no sobjects returned');
			}
			if (!list.some((o) => o.name === SOBJ)) {
				throw new Error(`${SOBJ} missing from the list`);
			}
			return `${list.length} object(s), ${SOBJ} present`;
		});

		// --- P) METADATA: describe one object ------------------------------
		await step('describe: returns field metadata', async () => {
			const r = await sf.describe({objectName: SOBJ});
			if (!r.ok) throw new Error(r.error?.message || 'describe not ok');
			const fields = r.data?.fields;
			if (!Array.isArray(fields) || !fields.length) {
				throw new Error('no fields returned');
			}
			if (!fields.some((f) => f.name === 'Id')) {
				throw new Error('Id field missing');
			}
			return `${fields.length} field(s) on ${r.data?.name}`;
		});

		// --- Q) GENERIC REQUEST --------------------------------------------
		// Uses the "resources by version" endpoint rather than /limits: /limits
		// answers API_DISABLED_FOR_ORG on some editions and permission sets,
		// which would look like a client failure. This endpoint is available
		// wherever the REST API itself is.
		await step('request: reaches an endpoint with no method', async () => {
			const r = await sf.request({
				base: 'data',
				path: '/',
				method: 'GET',
			});
			if (!r.ok) throw new Error(r.error?.message || 'request not ok');
			if (!r.data || typeof r.data !== 'object') {
				throw new Error('no payload');
			}
			if (!r.data.sobjects) {
				throw new Error(
					`unexpected payload keys: ${Object.keys(r.data).join(', ')}`
				);
			}
			return `${Object.keys(r.data).length} resource(s) listed`;
		});

		// --- R/S) APEX ------------------------------------------------------
		for (const key of ['apex1', 'apex2']) {
			const cfg = TEST_CONFIG[key];
			if (!cfg.enabled) {
				log(`(${key} skipped - TEST_CONFIG.${key}.enabled is false)`);
				continue;
			}
			await step(`apex: ${cfg.method} ${cfg.path}`, async () => {
				const r = await sf.apex({
					method: cfg.method,
					path: cfg.path,
					body: cfg.body,
				});
				if (!r.ok) throw new Error(r.error?.message || 'apex not ok');
				return `${r.status}`;
			});
		}

		// --- T) ENCODING ROUND TRIP -----------------------------------------
		// Writes a value containing every character that is ambiguous in a query
		// string, then finds it again by filtering on that exact value.
		//
		// This is the check that proves the transport preserves parameter values.
		// On the relay it is decisive: passing both relayed and direct means no
		// encoding compensation is needed; passing direct but failing relayed
		// identifies the characters that do need it.
		//
		// Asserted explicitly because the failure is silent - a mangled filter
		// returns zero rows rather than raising an error.
		await step(
			'encoding: ambiguous characters survive a SOQL filter',
			async () => {
				const hostileTitle = `[TEST ENC ${nowStamp()}] ${HOSTILE_CHARS}`;
				const s = event.start.clone().startOf('day').add(18, 'hours');
				const e = s.clone().add(15, 'minutes');

				const created = await sf.create({
					objectName: SOBJ,
					record: {
						[titleField]: hostileTitle,
						[F.start]: isoZ(s),
						[F.end]: isoZ(e),
						...durationFor(s, e),
					},
				});
				if (!created.ok) {
					throw new Error(created.error?.message || 'create failed');
				}
				remember(created.data?.id);

				// 1. query() must find it by the exact value.
				const found = await sf.query({
					soql: `SELECT Id, ${titleField} FROM ${SOBJ} WHERE ${titleField} = ${sf.quote(hostileTitle)}`,
				});
				if (!found.ok) {
					throw new Error(found.error?.message || 'query failed');
				}
				if (!found.data.length) {
					throw new Error(
						'query() matched 0 rows - the filter was altered in transit'
					);
				}

				// 2. the stored value must come back byte-identical.
				const returned = found.data[0][titleField];
				if (returned !== hostileTitle) {
					throw new Error(
						`value changed in transit: ${JSON.stringify(returned)}`
					);
				}

				// 3. bulkQuery builds its URL the same way, so it must agree.
				const bulk = await sf.bulkQuery.collect({
					soql: `SELECT Id FROM ${SOBJ} WHERE ${titleField} = ${sf.quote(hostileTitle)}`,
				});
				if (!bulk.length) {
					throw new Error(
						'bulkQuery matched 0 rows - its filter was altered in transit'
					);
				}

				return 'query + bulkQuery matched, value byte-identical';
			}
		);

		// --- U) CLEANUP -----------------------------------------------------
		// Runs regardless of what failed above, against everything actually
		// created, so a mid-suite failure never strands records.
		if (!createdIds.length) {
			log('(nothing to clean up)');
		} else if (TEST_CONFIG.keepCreatedRecords) {
			log(
				`(keeping ${createdIds.length} created record(s): ${createdIds.join(', ')})`
			);
		} else {
			await step('cleanup: delete created records', async () => {
				const failed = [];
				for (const id of createdIds) {
					const r = await sf.delete({objectName: SOBJ, id});
					if (!r.ok) failed.push(id);
				}
				if (failed.length) {
					throw new Error(`could not delete: ${failed.join(', ')}`);
				}
				return `${createdIds.length} record(s) deleted`;
			});
		}

		return {transport};
	}

	// ---- EXECUTE ----
	try {
		const relay = relayState();
		const summarize = (rs) =>
			`${rs.filter((r) => r.ok).length}/${rs.length} passed`;

		log('──────────────────────────────────────────────');
		log(`DayBack relay: ${relay ? `ON via ${relay.url}` : 'OFF'}`);
		log('(transport is reported below, once the first call returns)');
		log('──────────────────────────────────────────────');

		// Pass 1: however the environment is configured right now.
		results = [];
		const first = await runSuite(SalesforceClient());
		const primary = results.slice();
		log(
			`Pass 1 - ${first.transport || 'unknown'}${relay ? ' via relay' : ''}: ${summarize(primary)}`
		);
		const failed1 = primary.filter((r) => !r.ok);
		if (failed1.length) {
			console.error(
				'[SF TEST] FAILURES:',
				failed1.map((r) => `${r.name} (${r.detail})`)
			);
		}

		// Pass 2 only makes sense when there is a relay to bypass. Canvas never
		// has one, so this is skipped there automatically.
		if (relay && TEST_CONFIG.compareRelayAndDirect) {
			log('──────────────────────────────────────────────');
			log('Re-running with SalesforceClient({ relay: false })');
			log('──────────────────────────────────────────────');
			results = [];
			await runSuite(SalesforceClient({relay: false}));
			const direct = results.slice();
			log(`Pass 2 - direct, relay bypassed: ${summarize(direct)}`);

			const byName = {};
			direct.forEach((r) => {
				byName[r.name] = r;
			});
			const relayOnly = primary.filter(
				(r) => !r.ok && byName[r.name]?.ok
			);
			if (relayOnly.length) {
				console.error(
					'[SF TEST] RELAY-ONLY FAILURES - these pass direct and fail relayed:',
					relayOnly.map((r) => `${r.name} (${r.detail})`)
				);
			} else {
				log('No relay-only failures: relayed and direct agree.');
			}
		}

		log('✅ Smoke tests complete.');
		if (action?.callbacks?.confirm) action.callbacks.confirm();
	} catch (e) {
		toastError(e.message || String(e));
		if (action?.callbacks?.cancel) action.callbacks.cancel();
	}
})();
