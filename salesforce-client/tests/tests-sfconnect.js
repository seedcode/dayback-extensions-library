// ---- SF Client Smoke Tests (Canvas or REST) ----
//
// Requires the SalesforceClient library to be loaded.
// Please note that these tests will CREATE/UPDATE/DELETE real records in your Salesforce org.
// Be sure to review and customize the TEST_CONFIG section below before running.
//
// Check console for the result of tests

(async function runSfClientSmokeTestsHarness() {
    // ---- CONFIG ----
    const TEST_CONFIG = {
        // Prefer the mapped object from the schedule; otherwise override with your sObject:
        sobject: 'Event',

        // Field mapping on your event object:
        fields: {
            title: "Subject",
            description: "Description",
            location: "Location",
            start: "StartDateTime",
            end: "EndDateTime",
            status: "Status__c"
        },

        // Allowed status values:
        statusValues: ["Available", "Pending", "Ready", "Out of Office"],

        // Optional: set this to run an UPSERT test (must be a real External ID field)
        upsert: {
            enabled: true,
            externalIdField: 'DBK_External_Id__c',           // <-- change to your external id field
            externalIdValuePrefix: "SMOKETEST-",             // will append a timestamp
        },

        // Optional: test an Apex REST endpoint
        apex1: {
            enabled: true,
            method: "GET",                                  // "GET" | "POST" | "PATCH" | "DELETE" | "PUT"
            path: "/HelloWorld"
        },

        apex2: {
            enabled: true,
            method: "POST",                                  // "GET" | "POST" | "PATCH" | "DELETE" | "PUT"
            path: "/HelloWorld",
            body: { name: "SalesforceClient" }
        },

        // Cleanup
        keepCreatedRecords: false, // true = leave the test-created record behind
    };

    // ---- HELPERS ----
    const log = (msg) => {
        console.log("[SF TEST]", msg);
    };

    const toastError = (text) => {
        console.error("[SF TEST ERROR]", text);
    };

    function assertMoment(m, name) {
        if (!m || typeof m.format !== "function") {
            throw new Error(`Expected a moment() for ${name}.`);
        }
    }

    function isoZ(m) {
        // ISO8601 with Z—safest for SF Datetime fields
        return m.clone().toDate().toISOString();
    }

    const nowStamp = () => moment().format("YYYY-MM-DD HH:mm:ss");

    // ---- PRECONDITIONS ----
    try {
        if (!event || !event.eventID) throw new Error("Missing event.eventID.");
        assertMoment(event.start, "event.start");
        assertMoment(event.end, "event.end");
    } catch (e) {
        toastError(`Precondition failed: ${e.message}`);
        if (action?.callbacks?.cancel) return action.callbacks.cancel();
        return;
    }

    // ---- SF CLIENT ----
    // Autodetect Canvas vs REST; you can force with { mode: "canvas" } if desired
    const sf = SalesforceClient();

    // Convenience aliases
    const SOBJ = TEST_CONFIG.sobject;
    const F = TEST_CONFIG.fields;

    // Build day window on the original event’s date
    const dayStart = event.start.clone().startOf("day");
    const dayEnd = event.start.clone().endOf("day");

    // For creating a test record: keep it on the same day as the original event
    const newStart = event.start.clone().startOf("day").add(11, "hours"); // 11:00
    const newEnd = newStart.clone().add(1, "hour");                     // 12:00

    // Track the created record to optionally clean up later
    let createdId = null;
    let treeCreatedIds = [];

    // Pretty SOQL date filters (quoted)
    const soqlDateBetween = (fieldApi, start, end) => {
        // const a = sf.quote(isoZ(start));
        // const b = sf.quote(isoZ(end));
        return `${fieldApi} >= ${isoZ(start)} AND ${fieldApi} <= ${isoZ(end)}`;
    };

    // ---- RUN TESTS ----
    try {
        // A) RETRIEVE by Id
        log(`🔎 Retrieve baseline ${SOBJ} by Id (${event.eventID})`);
        const [rA, baseline] = await sf.retrieve(SOBJ, event.eventID, [
            "Id", F.title, F.description, F.location, F.start, F.end, F.status
        ]);
        log(`Retrieve OK: ${rA.status} – title: ${baseline?.[F.title] || "(none)"}`);

        // B) QUERY by Id
        log(`🔎 Query by Id`);
        const [rB, qRows] = await sf.query(
            `SELECT Id, ${F.title}, ${F.start}, ${F.end}, ${F.status}
       FROM ${SOBJ}
       WHERE Id = ${sf.quote(event.eventID)}
       LIMIT 1`
        );
        log(`Query OK: rows = ${qRows.length}`);

        // C) UPDATE the baseline record’s lightweight fields
        log(`✏️  Update baseline (title/status)`);
        const newTitle = `[TEST ${nowStamp()}] ${baseline?.[F.title] || "(no title)"}`;
        const newStatus = TEST_CONFIG.statusValues.find(s => s !== (baseline?.[F.status] || "")) || TEST_CONFIG.statusValues[0];
        const [rC] = await sf.update(SOBJ, event.eventID, {
            [F.title]: newTitle,
            [F.status]: newStatus
        });
        log(`Update OK: ${rC.status}`);

        // D) CREATE a new record on the same day
        log(`➕ Create new ${SOBJ} on the same day`);
        const [rD, created] = await sf.create(SOBJ, {
            [F.title]: `[TEST CREATE] ${nowStamp()}`,
            [F.description]: "Smoke test created via SalesforceClient",
            [F.location]: "Test Location",
            [F.start]: isoZ(newStart),
            [F.end]: isoZ(newEnd),
            [F.status]: "Tentative"
        });
        createdId = created?.id;
        log(`Create OK: ${rD.status} – id: ${createdId}`, created);

        // E) RETRIEVE created record
        log(`📥 Retrieve created record`);
        const [rE, createdRec] = await sf.retrieve(SOBJ, createdId, ["Id", F.title, F.status, F.start, F.end]);
        log(`Retrieve created OK: ${rE.status} – title: ${createdRec?.[F.title]}`);

        // F) QUERY all records on that day (by start field)
        log(`📅 Query all ${SOBJ} on the same day`);
        const whereDay = soqlDateBetween(F.start, dayStart, dayEnd);
        const [rF, dayRows] = await sf.query(
            `SELECT Id, ${F.title}, ${F.start}, ${F.end}, ${F.status}
       FROM ${SOBJ}
       WHERE ${whereDay}
       ORDER BY ${F.start}`
        );
        log(`Day query OK: ${dayRows.length} row(s)`);

        // G) UPSERT (Event-safe: include required fields + title/description/start/end)
        if (TEST_CONFIG.upsert.enabled) {
            const extField = TEST_CONFIG.upsert.externalIdField; // e.g., "DBk_External_Id__c"
            const titleField = (SOBJ === "Event") ? "Subject" : F.title;
            const startField = (SOBJ === "Event") ? "StartDateTime" : F.start;
            const endField = (SOBJ === "Event") ? "EndDateTime" : F.end;

            // Tie the created record to an External ID so we can hit the UPDATE path
            const extValueUpdate = `${TEST_CONFIG.upsert.externalIdValuePrefix}${createdId}`;
            log(`🔁 Prepare for upsert: set ${extField} on created record ${createdId}`);
            await sf.update(SOBJ, createdId, { [extField]: extValueUpdate });

            // Duration needed for Event inserts/updates
            const durMins = Math.max(1, newEnd.diff(newStart, "minutes"));

            // --- UPDATE path (should return 204) ---
            log(`🔁 Upsert (UPDATE path) via ${extField}=${extValueUpdate}`);
            const updateBody = {
                [titleField]: `[TEST UPSERT UPDATE] ${nowStamp()}`,
                [F.description]: "Upsert UPDATE path",
                [F.location]: "Upsert Location",
                ...(SOBJ === "Event"
                    ? { StartDateTime: isoZ(newStart), EndDateTime: isoZ(newEnd), DurationInMinutes: durMins }
                    : { [startField]: isoZ(newStart), [endField]: isoZ(newEnd) })
            };
            const [rG1] = await sf.upsert(SOBJ, extField, extValueUpdate, updateBody);
            log(`Upsert UPDATE status: ${rG1.status}`);

            // --- INSERT path (should return 201) ---
            const extValueInsert = `${TEST_CONFIG.upsert.externalIdValuePrefix}${createdId}-NEW`;
            log(`🔁 Upsert (INSERT path) via ${extField}=${extValueInsert}`);
            const insertStart = newStart.clone().add(2, "hours");
            const insertEnd = newEnd.clone().add(2, "hours");
            const insertDur = Math.max(1, insertEnd.diff(insertStart, "minutes"));

            const insertBody = {
                [titleField]: `[TEST UPSERT INSERT] ${nowStamp()}`,
                [F.description]: "Upsert INSERT path",
                [F.location]: "Upsert Location (new)",
                ...(SOBJ === "Event"
                    ? { StartDateTime: isoZ(insertStart), EndDateTime: isoZ(insertEnd), DurationInMinutes: insertDur }
                    : { [startField]: isoZ(insertStart), [endField]: isoZ(insertEnd) }),
                ...(SOBJ !== "Event" && F.status ? { [F.status]: "Tentative" } : {})
            };
            const [rG2, insertedPayload] = await sf.upsert(SOBJ, extField, extValueInsert, insertBody);
            log(`Upsert INSERT status: ${rG2.status}`);
            const upsertInsertedId = insertedPayload?.id;

            // Optional cleanup of the upsert-inserted record
            if (!TEST_CONFIG.keepCreatedRecords && upsertInsertedId) {
                const [rDelIns] = await sf.delete(SOBJ, upsertInsertedId);
                log(`Deleted upsert-inserted record ${upsertInsertedId}: ${rDelIns.status}`);
            }
        } else {
            log(`(Upsert skipped – enable TEST_CONFIG.upsert.enabled and provide a real External ID field)`);
        }

        // H) BATCH (composite): GET both baseline + created, then PATCH created
        log(`📦 Composite batch GET + PATCH`);
        const batchReqs = [
            { method: "GET", url: `/sobjects/${SOBJ}/${event.eventID}`, referenceId: "getBaseline" },
            { method: "GET", url: `/sobjects/${SOBJ}/${createdId}`, referenceId: "getCreated" },
            {
                method: "PATCH", url: `/sobjects/${SOBJ}/${createdId}`, referenceId: "updCreated",
                body: { [F.status]: "Confirmed", [F.title]: `[TEST BATCH] ${nowStamp()}` }
            }
        ];
        const [rH, composite] = await sf.batch(batchReqs, { allOrNone: false });
        const per = composite?.compositeResponse || composite; // depends on SF version
        const texts = (per || []).map(p => `${p.referenceId}:${p.httpStatusCode}`).join(", ");
        log(`Composite OK: ${texts}`);
        console.log("Composite response:", rH, composite);

        // I) OPTIONAL APEX
        if (TEST_CONFIG.apex1.enabled) {
            log(`⚡ Apex ${TEST_CONFIG.apex1.method} ${TEST_CONFIG.apex1.path}`);
            const [rI, response] = await sf.apex(TEST_CONFIG.apex1.method, TEST_CONFIG.apex1.path, { body: TEST_CONFIG.apex1.body });
            log(`Apex OK: ${rI.status}`, rI, response);
            console.log("Apex response:", rI, response);
        } else {
            log(`(Apex skipped – enable TEST_CONFIG.apex1.enabled and set path/body)`);
        }

        // J) OPTIONAL APEX
        if (TEST_CONFIG.apex2.enabled) {
            log(`⚡ Apex ${TEST_CONFIG.apex2.method} ${TEST_CONFIG.apex2.path}`);
            const [rI, response] = await sf.apex(TEST_CONFIG.apex2.method, TEST_CONFIG.apex2.path, { body: TEST_CONFIG.apex2.body });
            log(`Apex OK: ${rI.status}`, rI, response);
            console.log("Apex response:", rI, response);
        } else {
            log(`(Apex skipped – enable TEST_CONFIG.apex2.enabled and set path/body)`);
        }

        // K) CLEANUP (optional)
        if (createdId && !TEST_CONFIG.keepCreatedRecords) {
            log(`🗑️  Delete created record`);
            const [rJ] = await sf.delete(SOBJ, createdId);
            log(`Delete OK: ${rJ.status}`);
        } else if (createdId) {
            log(`(Keeping created record ${createdId})`);
        }

        // L) CREATE TREE (two records on the same day)
        log(`🌳 Composite Tree insert (two ${SOBJ} records on the same day)`);

        // Place these later in the same day (e.g., 1–2pm and 2–3pm)
        const treeStartA = event.start.clone().startOf("day").add(13, "hours"); // 1:00 PM
        const treeEndA = treeStartA.clone().add(1, "hour");                   // 2:00 PM
        const treeStartB = treeEndA.clone();                                    // 2:00 PM
        const treeEndB = treeStartB.clone().add(1, "hour");                   // 3:00 PM

        const treeRecords = [
            {
                attributes: { type: SOBJ, referenceId: "tree1" },
                [F.title]: `[TEST TREE #1] ${nowStamp()}`,
                [F.description]: "Inserted via Composite Tree (1/2)",
                [F.location]: "Tree Test A",
                [F.start]: isoZ(treeStartA),
                [F.end]: isoZ(treeEndA),
                [F.status]: "Pending"
            },
            {
                attributes: { type: SOBJ, referenceId: "tree2" },
                [F.title]: `[TEST TREE #2] ${nowStamp()}`,
                [F.description]: "Inserted via Composite Tree (2/2)",
                [F.location]: "Tree Test B",
                [F.start]: isoZ(treeStartB),
                [F.end]: isoZ(treeEndB),
                [F.status]: "Confirmed"
            }
        ];

        const [rK, treePayloads] = await sf.createTree(SOBJ, treeRecords);
        // treePayloads is an array of per-chunk payloads; each payload has {hasErrors, results:[{referenceId,id,errors:[]}, ...]}
        const treePayloadArray = Array.isArray(treePayloads) ? treePayloads : [treePayloads];

        let treeMsg = [];
        for (const payload of treePayloadArray) {
            const results = payload?.results || [];
            for (const res of results) {
                if (res?.id) treeCreatedIds.push(res.id);
                treeMsg.push(`${res.referenceId}:${res.id || "ERR"}`);
            }
        }
        log(`CreateTree OK: ${treeMsg.join(", ")}`);

        // Optional cleanup of tree records
        if (!TEST_CONFIG.keepCreatedRecords && treeCreatedIds.length) {
            log(`🧹 Delete ${treeCreatedIds.length} tree record(s)`);
            for (const id of treeCreatedIds) {
                const [rDel] = await sf.delete(SOBJ, id);
                log(`  - ${id}: ${rDel.status}`);
            }
        } else if (treeCreatedIds.length) {
            log(`(Keeping tree records: ${treeCreatedIds.join(", ")})`);
        }

        // Done!
        log("✅ Salesforce client smoke tests complete.");
        if (action?.callbacks?.confirm) action.callbacks.confirm();

    } catch (e) {
        // Rich errors from the client have httpStatus/code/message/payload
        if (sf && typeof sf.showError === "function") {
            sf.showError(e);
        } else {
            toastError(e.message || String(e));
        }
        if (action?.callbacks?.cancel) action.callbacks.cancel();
    }
})();
