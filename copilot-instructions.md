# Copilot Instructions · DayBack Extensions Library

> Use these rules when suggesting code. Always prefer existing DayBack APIs, objects, and patterns over inventing new ones. Key references: **Action Objects & Methods**, **APIs & JavaScript**, **Custom App Actions**, and **Custom Event Actions**.

---

## 1. Repository Purpose

This repo is a library of **modular DayBack extensions**: each folder contains a self-contained feature implemented as a custom **App Action**, **Event Action**, or **Button Action**. Extensions are designed for copy-paste into DayBack (Salesforce, FileMaker, or Web). Structure and patterns derive from the existing extensions library conventions.

---

## 2. File & Folder Patterns

* **Per-extension folders**: `my-extension-name/` containing:

  * `*.js` (main action code using ActionStarterTemplate.js format)
  * `*.css` (optional styling; class names must match JS)
  * `README.md` (usage and platform setup)
* **Template**: `action-starter-template/ActionStarterTemplate.js` is the base pattern for **all** examples.

**Copilot: when suggesting new code, include the exact target folder and filename.**

---

## 3. Action Types & Triggers

* **App Actions** — run on app-level events (loading resources, navigation, filters). Examples: `On Sources Fetched`, `On Filters Changed`, `On Calendar Load`, `On Route Change`.
* **Event Actions** — run on event interactions: `On Event Create`, `On Event Click`, `On Event Hover`, `On Field Change`, `Before Events Fetched`, `Before Event Rendered`, `Before Event Save`, `On Event Save`, `On Event Delete`.
* **Button Actions** — manual triggers from popovers or custom menus.

If “Prevent default action” is **true**, you must decide to proceed via `action.callbacks.confirm()` or cancel via `action.callbacks.cancel()`.

---

## 4. DayBack Objects & Methods (Use These—Don’t Invent)

* **`action`**: context; `preventAction`, `callbacks.confirm()/cancel()`
* **`params`**: metadata about trigger origin (filter/view/source changes, etc.)
* **`event` / `editEvent`**: raw event and editable copy
* **`dbk`**: UI helpers (`tooltip`, `showMessage`, `refreshEditPopover`), filter helpers (`mutateFilterField`, `manageFilters`, `resetResources`), event ops (`addEvent(s)`, `createEvent`, `updateEvent`, `deleteEvent`), config (`changeConfigSetting`)
* **`seedcodeCalendar`**: get/init DayBack state (e.g., `get('resources')`, `init('calendars', …)`)
* **`utilities`**, **`environment`**, **filter objects** available per trigger

Built-in libraries available: jQuery, Bootstrap, moment.js. Use Salesforce Canvas SDK (`fbk.client()`, `fbk.context()`) for SFDC REST calls.

---

## 5. Coding Conventions

* Use **ActionStarterTemplate.js** (below) for every action.
* Put **configuration and documentation at the top**; put custom logic in **`run()`**.
* **4-space indent**, **semicolons**, **JSDoc**; ES5/ES2015 compatible; **no build step**.
* Handle async with **confirm/cancel callbacks** when default is prevented.
* Show user-friendly messages via `utilities.showMessage()`; do not expose stack traces.

---

## 6. Few-Shot Examples (ActionStarterTemplate format)

> Paste these into per-feature folders, renaming filenames and adjusting the **Action Type** / **Prevent Default Action** to match your intended trigger.

### 6.1 App Action · Select Calendars for Current User

**Path**: `select-calendars-by-user/SelectCalendarsByUser.js`
**Trigger**: **On Sources Fetched** · **Prevent Default Action**: **No**

```js
// DayBack Custom Action Template v1.03
//
// Purpose:
// Filter the visible calendar sources to those owned by the current user.
// Action Type: On Sources Fetched
// Prevent Default Action: No
//
// More info on custom App Actions here:
// https://docs.dayback.com/article/140-custom-app-actions
//
// @ts-check - Type checking with JSDoc (Remove this line to disable)

// Declare global imports
// @ts-ignore
const globals = { action, dbk, seedcodeCalendar, utilities };

const options = {};
const inputs = {};

try {
  //----------- Configuration -------------------
  /** @type {number} */
  options.runTimeout = 8;

  /** @type {Array<string>} */
  options.restrictedToAccounts = []; // allow everyone

  /** @type {string} */
  inputs.account = globals.seedcodeCalendar.get('config').account;

  //----------- End Configuration -------------------
} catch (error) {
  reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

function run() {
  try {
    // Get current username/email from environment if available; fallback to inputs.account
    var currentUser = (typeof environment !== 'undefined' && environment.username) || inputs.account;

    // Read existing calendars and filter them for the current user
    var calendars = globals.seedcodeCalendar.get('calendars') || [];
    var filtered = calendars.filter(function (c) {
      // Your ownership check may differ; adjust the property used here.
      return c.owner === currentUser || (c.ownerEmail && c.ownerEmail === currentUser);
    });

    // Initialize DayBack with the filtered list
    globals.seedcodeCalendar.init('calendars', filtered);

    // Optional: notify
    globals.dbk.showMessage('Calendars filtered for ' + currentUser, 500, 1500);
  } catch (e) {
    reportError(e);
  }
}

//----------- Run function wrapper and helpers - you shouldn’t need to edit below this line. -------------------

/**
 * @typedef {Object} ActionError
 * @property {string} name
 * @property {string} message
 */

let timeout;

try {
  if (
    !options.restrictedToAccounts ||
    !options.restrictedToAccounts.length ||
    (options.restrictedToAccounts && options.restrictedToAccounts.indexOf(inputs.account) > -1)
  ) {
    if (globals.action.preventDefault && options.runTimeout) {
      timeoutCheck();
    }
    run();
  } else if (globals.action.preventDefault) {
    confirmCallback();
  }
} catch (error) {
  reportError(error);
}

/** @type {() => void} */
function confirmCallback() {
  cancelTimeoutCheck();
  if (globals.action.callbacks.confirm) {
    globals.action.callbacks.confirm();
  }
}

/** @type {() => void} */
function cancelCallback() {
  cancelTimeoutCheck();
  if (globals.action.callbacks.cancel) {
    globals.action.callbacks.cancel();
  }
}

/** @type {() => void} */
function timeoutCheck() {
  timeout = setTimeout(function () {
    const error = {
      name: 'Timeout',
      message: 'The action was unable to execute within the allotted time and has been stopped',
    };
    reportError(error);
  }, options && options.runTimeout ? options.runTimeout * 1000 : 0);
}

/** @type {() => void} */
function cancelTimeoutCheck() {
  if (timeout) {
    clearTimeout(timeout);
  }
}

/** @type {(error: ActionError) => void} */
function reportError(error) {
  const errorTitle = 'Error Running Custom Action';
  const errorMessage = `<p>There was a problem running the action "<span style="white-space: nowrap">${globals.action.name}</span>"</p><p>Error: ${error.message}.</p><p>This may result in unexpected behavior of the calendar.</p>`;
  if (globals.action.preventDefault && globals.action.category !== 'event' && timeout) {
    confirmCallback();
  } else {
    cancelCallback();
  }
  setTimeout(function () {
    globals.utilities.showModal(errorTitle, errorMessage, null, null, 'OK', null, null, null, true, null, true);
  }, 1000);
}
```

**Why this fits DayBack:** App actions are ideal for altering core loading behavior like what calendars/resources appear, using DayBack’s state APIs (`seedcodeCalendar.get/init`).

---

### 6.2 Event Action · Prevent Double-Booking (Before Event Save)

**Path**: `prevent-double-booking/PreventDoubleBooking_BeforeEventSave.js`
**Trigger**: **Before Event Save** · **Prevent Default Action**: **Yes**

```js
// DayBack Custom Action Template v1.03
//
// Purpose:
// Prevent saving if another event overlaps on the same resource.
// Action Type: Before Event Save
// Prevent Default Action: Yes
//
// More info on custom Event Actions here:
// https://docs.dayback.com/article/20-event-actions
//
// @ts-check

// Declare global imports
// @ts-ignore
const globals = { action, dbk, seedcodeCalendar, utilities };

const options = {};
const inputs = {};

try {
  //----------- Configuration -------------------
  /** @type {number} */
  options.runTimeout = 8;

  /** @type {Array<string>} */
  options.restrictedToAccounts = [];

  /** @type {string} */
  inputs.account = globals.seedcodeCalendar.get('config').account;

  //----------- End Configuration -------------------
} catch (error) {
  reportError(error);
}

//----------- The action itself -------------------

function run() {
  try {
    // DayBack exposes event/editEvent in event actions per docs.
    // We access them via the real global names that DayBack injects.
    // @ts-ignore
    var ev = event;
    // @ts-ignore
    var edited = editEvent;

    // Sanity
    if (!edited || !edited.start || !edited.end) {
      globals.utilities.showMessage('Start and End are required.', 500, 2000);
      // Prevent save
      if (globals.action.preventDefault) cancelCallback();
      return;
    }

    // Compare against currently loaded events for conflicts (client-side check).
    var all = globals.seedcodeCalendar.get('events') || [];
    var start = moment(edited.start);
    var end = moment(edited.end);
    var resourceId = edited.resourceId || (Array.isArray(edited.resource) ? edited.resource[0] : edited.resource);

    var conflict = all.some(function (e) {
      if (!resourceId) return false;
      var rid = e.resourceId || (Array.isArray(e.resource) ? e.resource[0] : e.resource);
      if (e.id === ev.id) return false; // skip self
      if (rid !== resourceId) return false;
      var es = moment(e.start);
      var ee = moment(e.end);
      return es.isBefore(end) && start.isBefore(ee);
    });

    if (conflict) {
      globals.utilities.showMessage('Conflict: resource already booked in this time range.', 500, 2500);
      if (globals.action.preventDefault) cancelCallback(); // stop save
      return;
    }

    // No conflicts -> proceed with save
    if (globals.action.preventDefault) confirmCallback();
  } catch (e) {
    reportError(e);
  }
}

//----------- Wrapper / helpers -------------------

/**
 * @typedef {Object} ActionError
 * @property {string} name
 * @property {string} message
 */

let timeout;

try {
  if (
    !options.restrictedToAccounts ||
    !options.restrictedToAccounts.length ||
    (options.restrictedToAccounts && options.restrictedToAccounts.indexOf(inputs.account) > -1)
  ) {
    if (globals.action.preventDefault && options.runTimeout) {
      timeoutCheck();
    }
    run();
  } else if (globals.action.preventDefault) {
    confirmCallback();
  }
} catch (error) {
  reportError(error);
}

/** @type {() => void} */
function confirmCallback() {
  cancelTimeoutCheck();
  if (globals.action.callbacks.confirm) globals.action.callbacks.confirm();
}

/** @type {() => void} */
function cancelCallback() {
  cancelTimeoutCheck();
  if (globals.action.callbacks.cancel) globals.action.callbacks.cancel();
}

/** @type {() => void} */
function timeoutCheck() {
  timeout = setTimeout(function () {
    reportError({ name: 'Timeout', message: 'Save validation timed out.' });
  }, options && options.runTimeout ? options.runTimeout * 1000 : 0);
}

/** @type {() => void} */
function cancelTimeoutCheck() {
  if (timeout) clearTimeout(timeout);
}

/** @type {(error: ActionError) => void} */
function reportError(error) {
  const errorTitle = 'Error Running Custom Action';
  const errorMessage = `<p>There was a problem running the action "<span style="white-space: nowrap">${globals.action.name}</span>"</p><p>Error: ${error.message}.</p><p>This may result in unexpected behavior of the calendar.</p>`;
  // When preventDefault is enabled, default messages are suppressed (per docs).
  // We must confirm/cancel explicitly so DayBack knows what happened.
  if (globals.action.preventDefault && globals.action.category === 'event' && timeout) {
    cancelCallback();
  }
  setTimeout(function () {
    globals.utilities.showModal(errorTitle, errorMessage, null, null, 'OK', null, null, null, true, null, true);
  }, 1000);
}
```

**Why this fits DayBack:** `Before Event Save` is the correct trigger to modify/validate events before persistence; use `prevent default`+callbacks to gate the save flow.

---

### 6.3 Button Action · Jump to Salesforce Record

**Path**: `open-in-salesforce/OpenInSalesforce_Button.js`
**Trigger**: **Button (Popover)** · **Prevent Default Action**: **No**

```js
// DayBack Custom Action Template v1.03
//
// Purpose:
// Open the Salesforce Lightning record for the selected event.
// Action Type: Button Action (Popover)
// Prevent Default Action: No
//
// More info on Button Actions:
// https://docs.dayback.com/article/41-apis
//
// @ts-check

// Declare global imports
// @ts-ignore
const globals = { action, dbk, seedcodeCalendar, utilities };

const options = {};
const inputs = {};

try {
  //----------- Configuration -------------------
  /** @type {number} */
  options.runTimeout = 8;

  /** @type {Array<string>} */
  options.restrictedToAccounts = [];

  /** @type {string} */
  inputs.account = globals.seedcodeCalendar.get('config').account;

  //----------- End Configuration -------------------
} catch (error) {
  reportError(error);
}

//----------- The action itself -------------------

function run() {
  try {
    // @ts-ignore
    var ev = event;
    if (!ev || !ev.Id) {
      globals.utilities.showMessage('Missing Salesforce Id on event.', 500, 2000);
      return;
    }
    // Lightning URL pattern (adjust object name if needed)
    var url = '/lightning/r/Event__c/' + ev.Id + '/view';
    location.href = url;
  } catch (e) {
    reportError(e);
  }
}

//----------- Wrapper / helpers -------------------

/**
 * @typedef {Object} ActionError
 * @property {string} name
 * @property {string} message
 */

let timeout;

try {
  if (
    !options.restrictedToAccounts ||
    !options.restrictedToAccounts.length ||
    (options.restrictedToAccounts && options.restrictedToAccounts.indexOf(inputs.account) > -1)
  ) {
    if (globals.action.preventDefault && options.runTimeout) {
      timeoutCheck();
    }
    run();
  } else if (globals.action.preventDefault) {
    confirmCallback();
  }
} catch (error) {
  reportError(error);
}

/** @type {() => void} */
function confirmCallback() {
  cancelTimeoutCheck();
  if (globals.action.callbacks.confirm) globals.action.callbacks.confirm();
}

/** @type {() => void} */
function cancelCallback() {
  cancelTimeoutCheck();
  if (globals.action.callbacks.cancel) globals.action.callbacks.cancel();
}

/** @type {() => void} */
function timeoutCheck() {
  timeout = setTimeout(function () {
    reportError({ name: 'Timeout', message: 'Navigation timed out.' });
  }, options && options.runTimeout ? options.runTimeout * 1000 : 0);
}

/** @type {() => void} */
function cancelTimeoutCheck() {
  if (timeout) clearTimeout(timeout);
}

/** @type {(error: ActionError) => void} */
function reportError(error) {
  const errorTitle = 'Error Running Custom Action';
  const errorMessage = `<p>There was a problem running the action "<span style="white-space: nowrap">${globals.action.name}</span>"</p><p>Error: ${error.message}.</p><p>This may result in unexpected behavior of the calendar.</p>`;
  setTimeout(function () {
    globals.utilities.showModal(errorTitle, errorMessage, null, null, 'OK', null, null, null, true, null, true);
  }, 1000);
}
```

**Why this fits DayBack:** Button actions are intended for event-specific user operations like navigation to native records.

---

### 6.4 Event Action · Update Popover Fields & Re-Render

**Path**: `edit-popover-sync/EditPopoverSync_OnFieldChange.js`
**Trigger**: **On Field Change** · **Prevent Default Action**: **No**

```js
// DayBack Custom Action Template v1.03
//
// Purpose:
// Keep the edit popover in sync after field changes (e.g., status affects title).
// Action Type: On Field Change
// Prevent Default Action: No
//
// More info:
// https://docs.dayback.com/article/124-action-objects-methods
//
// @ts-check

// Declare global imports
// @ts-ignore
const globals = { action, dbk, seedcodeCalendar, utilities };

const options = {};
const inputs = {};

try {
  //----------- Configuration -------------------
  /** @type {number} */
  options.runTimeout = 8;

  /** @type {Array<string>} */
  options.restrictedToAccounts = [];

  /** @type {string} */
  inputs.account = globals.seedcodeCalendar.get('config').account;

  //----------- End Configuration -------------------
} catch (error) {
  reportError(error);
}

//----------- The action itself -------------------

function run() {
  try {
    // @ts-ignore
    var edited = editEvent;
    if (!edited) return;

    // Example: prepend resource to title for display consistency
    var rid = Array.isArray(edited.resource) ? edited.resource[0] : edited.resource;
    if (rid && edited.title && edited.title.indexOf('[') !== 0) {
      edited.title = '[' + rid + '] ' + edited.title;
      globals.dbk.refreshEditPopover(edited); // re-render popover per docs
    }
  } catch (e) {
    reportError(e);
  }
}

//----------- Wrapper / helpers -------------------

/**
 * @typedef {Object} ActionError
 * @property {string} name
 * @property {string} message
 */

let timeout;

try {
  if (
    !options.restrictedToAccounts ||
    !options.restrictedToAccounts.length ||
    (options.restrictedToAccounts && options.restrictedToAccounts.indexOf(inputs.account) > -1)
  ) {
    if (globals.action.preventDefault && options.runTimeout) {
      timeoutCheck();
    }
    run();
  } else if (globals.action.preventDefault) {
    confirmCallback();
  }
} catch (error) {
  reportError(error);
}

/** @type {() => void} */
function confirmCallback() {
  cancelTimeoutCheck();
  if (globals.action.callbacks.confirm) globals.action.callbacks.confirm();
}

/** @type {() => void} */
function cancelCallback() {
  cancelTimeoutCheck();
  if (globals.action.callbacks.cancel) globals.action.callbacks.cancel();
}

/** @type {() => void} */
function timeoutCheck() {
  timeout = setTimeout(function () {
    reportError({ name: 'Timeout', message: 'Popover update timed out.' });
  }, options && options.runTimeout ? options.runTimeout * 1000 : 0);
}

/** @type {() => void} */
function cancelTimeoutCheck() {
  if (timeout) clearTimeout(timeout);
}

/** @type {(error: ActionError) => void} */
function reportError(error) {
  const errorTitle = 'Error Running Custom Action';
  const errorMessage = `<p>There was a problem running the action "<span style="white-space: nowrap">${globals.action.name}</span>"</p><p>Error: ${error.message}.</p><p>This may result in unexpected behavior of the calendar.</p>`;
  setTimeout(function () {
    globals.utilities.showModal(errorTitle, errorMessage, null, null, 'OK', null, null, null, true, null, true);
  }, 1000);
}
```

**Why this fits DayBack:** `dbk.refreshEditPopover(editEvent)` is the documented way to re-render the open popover after you mutate `editEvent`.

---

## 7. Do / Don’t

**Do**

* Use DayBack’s documented objects/methods only.
* Keep actions self-contained per folder; document trigger and purpose.
* Mirror CSS class names between `.js` and `.css`.
* For Salesforce, use Canvas SDK for REST calls instead of ad-hoc auth.

**Don’t**

* Don’t invent globals (`DayBackAPI`, `CalendarUtils`, etc.).
* Don’t introduce new dependencies or build steps.
* Don’t forget `confirm()/cancel()` when “Prevent default action” is true.

---

## 8. Testing & Debugging

* Test manually in DayBack UI; log with clear prefixes (`console.debug('[before-event-save]', …)`).
* Use `utilities.showMessage()` for user feedback; avoid exposing raw errors.
* For Salesforce/FileMaker, follow per-extension README setup patterns.

---

## 9. Prompting Copilot Inline

Add a **goal comment** above the edit point so Copilot anchors correctly:

```js
// goal: prevent double-booking; use dbk + seedcodeCalendar; no new deps
```

---

### References

* ** Action Objects & Methods **: objects, callbacks, and dbk / seedcodeCalendar APIs: https://docs.dayback.com/article/124-action-objects-methods
* ** APIs & JavaScript in DayBack **: libraries available, Canvas SDK pointers, token guidance: https://docs.dayback.com/article/41-apis
* ** Custom App Actions **: triggers and use cases for app - level behavior: https://docs.dayback.com/article/140-custom-app-actions
* ** Custom Event Actions **: triggers for event lifecycle and prevent -default patterns: https://docs.dayback.com/article/20-event-actions
