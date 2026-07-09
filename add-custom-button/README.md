# Add Custom Button

**Version:** 2.0
**Purpose:** Injects one or more custom floating buttons (or a collapsible button launcher/drawer) into DayBack's bottom-right corner. Provides a registry API for dynamic button management — buttons can be added, removed, and updated at runtime from any action.

Also known as: **button tray**, **button launcher**, **button menu**, **floating button drawer**.

## Action Type

| Property | Value |
|---|---|
| **Type** | App Action |
| **Trigger** | On Startup + Before Calendar Rendered + After Events Rendered |
| **Prevent Default** | No (all three parts) |
| **Platform** | All |

## Architecture

This extension uses the **centralized architecture** pattern:

- **Part 1 (On Startup)** — The library. Creates the `customButtonTray` registry object with all logic: DOM construction, drawer management, visibility evaluation, and the public `register()`/`unregister()` API.
- **Part 2 (Before Calendar Rendered)** — Thin delegate. Calls `customButtonTray.appActions.beforeCalendarRendered()` to build the DOM.
- **Part 3 (After Events Rendered)** — Thin delegate. Calls `customButtonTray.appActions.afterEventsRendered()` for view-conditional visibility and analytics bar offset.

## Files

| File | Trigger | Description |
|---|---|---|
| `AddCustomButton_Part1.js` | On Startup | Registry API, DOM engine, all centralized logic |
| `AddCustomButton_Part2.js` | Before Calendar Rendered | Thin delegate — triggers DOM build |
| `AddCustomButton_Part3.js` | After Events Rendered | Thin delegate — triggers visibility evaluation |
| `AddCustomButton.css` | — | Styles for the floating button drawer and individual buttons |
| `LICENSE` | — | License file |

## `customButtonTray` API

After Part 1 runs, the registry is available via:

```js
var tray = seedcodeCalendar.get('customButtonTray');
```

### `tray.register(buttonDef)`

Add a button to the tray.

- **Throws** if `buttonDef.uniqueId` is missing (displays error modal).
- If a button with the same `uniqueId` already exists, **overwrites** it and logs a `console.warn`.
- If the DOM is ready (BCR has run), schedules a **debounced rebuild** — multiple `register()` calls in the same tick produce one DOM update.

### `tray.unregister(uniqueId)`

Remove a button from the tray by its `uniqueId`.

- No-op if the `uniqueId` is not found.
- Triggers a debounced rebuild if the DOM is ready.
- Drawer open/closed state is **preserved** across rebuilds.

### `tray.clearDefaults()` → `number`

Remove all buttons marked with `isExample: true`.

- Returns the number of buttons removed.
- Safe to call multiple times (idempotent — removes only what remains).
- Triggers a debounced rebuild if the DOM is ready and buttons were removed.
- Use this when replacing the bundled example buttons with your own.

```js
const tray = seedcodeCalendar.get('customButtonTray');
const removed = tray.clearDefaults();
console.log('Cleared ' + removed + ' example buttons');
tray.register({ uniqueId: 'myButton', ... });
```

### `tray.clearAll()` → `number`

Remove all registered buttons regardless of `isExample` flag.

- Returns the number of buttons removed.
- Triggers a debounced rebuild if the DOM is ready and buttons were removed.
- If all buttons are removed, the tray container is also removed from the DOM.

### `tray.getRegistered()` → `Array<ButtonDefinition>`

Return a **shallow copy** of all currently registered button definitions.

- Useful for inspecting the registry before conditionally clearing or filtering buttons.
- Mutations to the returned array do not affect the internal registry.

```js
const buttons = tray.getRegistered();
const examples = buttons.filter(b => b.isExample);
console.log('Example buttons:', examples.map(b => b.uniqueId));
```

### `tray.getToggleState(uniqueId)` → `'on' | 'off' | null`

Return the current toggle state for a button.

- Returns `null` if the button is not a toggle or does not exist.

### `tray.setToggleState(uniqueId, state)`

Programmatically set a toggle button to `'on'` or `'off'`.

- Updates the DOM visuals (icon, label, color) immediately.
- Runs the appropriate `onToggleOn` / `onToggleOff` callback.
- Logs a `console.error` and returns early if the button is not a toggle or the state value is invalid.
- No-op if the button is already in the requested state.

### `tray.getDrawerOpenState()` → `boolean | null`

Return the current open/closed state of the drawer (container mode only).

- Returns `true` if the drawer is open, `false` if closed.
- Returns `null` if `showContainer` is disabled (static mode), including when it is auto-overridden off because only one button is registered/visible — see `tray.getEffectiveShowContainer()`.

### `tray.setDrawerOpenState(isOpen)` → `boolean`

Programmatically open or close the drawer (container mode only).

- Returns `true` if the state was applied, `false` if `showContainer` is disabled (or auto-overridden off) or the DOM is not yet ready.
- Opening uses `restoreDrawerOpenState()` internally — no label flash.
- Closing collapses the button list and resets all label spans.

### `tray.setContainerPreference({ showContainer, showContainerAsOpen })`

Update the container drawer preference at runtime. Either property may be omitted to leave it unchanged.

- Triggers an automatic DOM rebuild if called after calendar renders.
- Use this instead of mutating `tray.config` directly once the tray has rendered — direct mutation won't trigger a rebuild.

```js
const tray = seedcodeCalendar.get('customButtonTray');
tray.setContainerPreference({showContainer: false});
```

### `tray.getEffectiveShowContainer()` → `boolean`

Returns the container mode actually being rendered right now.

- This is `tray.config.showContainer` automatically forced to `false` whenever only one button is currently registered/visible (post-`restrict()`), since the drawer chrome isn't relevant for a single button.
- Use this instead of reading `tray.config.showContainer` directly when you need to know the real rendered mode.

### `tray.config`

Configuration object. Set these properties in On Startup before BCR fires:

| Property | Type | Default | Description |
|---|---|---|---|
| `cssGroupName` | `string` | `'custom_btn'` | CSS class prefix for the button container |
| `showContainer` | `boolean` | `false` | `true` = collapsible drawer, `false` = static button stack. This is the raw preference — see `tray.getEffectiveShowContainer()` for the actual rendered mode, which is auto-forced to `false` when only one button is registered/visible. |
| `showContainerAsOpen` | `boolean` | `false` | If drawer mode, whether to start open |

After the tray has rendered, prefer `tray.setContainerPreference()` over mutating `tray.config` directly so the DOM rebuilds automatically.

### `tray.appActions`

Lifecycle delegate methods called by the thin Part 1 and Part 2 scripts:

- `beforeCalendarRendered({ action })` — Builds the button tray DOM.
- `afterEventsRendered({ action })` — Evaluates `visibleWhen` per button, adjusts analytics offset.

## Button Definition

Each button is an object with these properties:

| Property | Type | Required | Description |
|---|---|---|---|
| `uniqueId` | `string` | **Yes** | Registry key and DOM element id. Must be unique. |
| `icon` | `string` | Yes (standard) | Font Awesome 4.7 class (e.g., `'fa-comment'`). [Icon reference](https://fontawesome.com/v4.7/icons/) |
| `action` | `function` | Yes (standard) | Click handler function |
| `label` | `string` or `function` | No | Text badge next to button. Use a function for dynamic labels. |
| `color` | `string` | No | Button background color (CSS notation). Default: `#3164d2` |
| `isExample` | `boolean` | No | Marks button as a bundled example. Removed by `tray.clearDefaults()`. Default: `false` |
| `toggle` | `ToggleConfig` | No | Toggle config object. When present, replaces `icon`, `label`, `color`, and `action`. See Toggle Buttons below. |
| `restrict` | `function` | No | Access control. Return `false` to exclude from DOM entirely. Evaluated at render time. |
| `visibleWhen` | `function` | No | Contextual visibility. Return `false` to hide. Re-evaluated each After Events Rendered cycle. |
| `order` | `number` | No | Sort key. Lower = bottom of stack. Buttons without `order` appear after ordered buttons in registration order. |

## Toggle Buttons

A button becomes a toggle by adding a `toggle` object in place of `icon`, `label`, `color`, and `action`. The button has two visual states — **off** (default) and **on** — each with its own icon, label, color, and callback.

```js
tray.register({
    uniqueId: 'weekendToggle',
    order: 4,
    toggle: {
        defaultState: 'off',          // 'off' (default) or 'on'
        off: {
            icon: 'fa-eye-slash',
            label: 'Show Weekends',
            color: '#999',
        },
        on: {
            icon: 'fa-eye',
            label: 'Hide Weekends',
            color: '#4CAF50',
        },
        onToggleOn() {
            // Runs when switched from off → on
        },
        onToggleOff() {
            // Runs when switched from on → off
        },
    },
});
```

### ToggleConfig properties

| Property | Type | Required | Description |
|---|---|---|---|
| `off` | `object` | **Yes** | Visual state when OFF. Properties: `icon` (string), `label` (string, optional), `color` (string, optional). |
| `on` | `object` | **Yes** | Visual state when ON. Same properties as `off`. |
| `onToggleOn` | `function` | **Yes** | Runs when the button is switched from OFF to ON. |
| `onToggleOff` | `function` | **Yes** | Runs when the button is switched from ON to OFF. |
| `defaultState` | `'on'\|'off'` | No | Initial state. Defaults to `'off'`. |

Programmatic control of toggle state:

```js
const tray = seedcodeCalendar.get('customButtonTray');
tray.getToggleState('weekendToggle');          // → 'off'
tray.setToggleState('weekendToggle', 'on');    // updates DOM + fires onToggleOn
```

### `restrict` vs `visibleWhen`

- **`restrict`** — Permissions gate. "Is this user allowed to see this button?" Evaluated once per render. If `false`, the button's DOM element is never created.
- **`visibleWhen`** — Contextual visibility. "Should this button be visible right now?" Re-evaluated every AER cycle. Toggles `display: flex/none` on an existing DOM element.

## Usage Examples

### Static registration (all buttons defined in On Startup)

```js
// In the On Startup script, after customButtonTray is created:

var tray = seedcodeCalendar.get('customButtonTray');
tray.config.showContainer = true;

tray.register({
    uniqueId: 'contactUs',
    icon: 'fa-comment',
    label: 'Contact Us',
    color: '#72009c',
    action: function () {
        open('https://dayback.com/contact/', '_blank');
    },
});

tray.register({
    uniqueId: 'salesWorkflow',
    icon: 'fa-dollar',
    label: 'Sales Workflow',
    color: '#3164d2',
    action: function () {
        // Navigate to bookmark
        var bookmarkID = '1629418383414e4573855796';
        location.hash = location.hash.includes('?')
            ? location.hash + '&bookmarkID=' + bookmarkID
            : '#/?bookmarkID=' + bookmarkID;
    },
    restrict: function () {
        return seedcodeCalendar.get('config').accountName === 'John Smith';
    },
});
```

### Dynamic registration (adding a button from After Calendar Rendered)

```js
// In a separate After Calendar Rendered action:

var tray = seedcodeCalendar.get('customButtonTray');

if (tray) {
    tray.register({
        uniqueId: 'screenshot',
        icon: 'fa-camera',
        label: 'Screenshot',
        color: '#333',
        action: function () {
            // Screenshot logic here
        },
    });
}
```

### Mode-based add/remove (entering and exiting a mode)

```js
// Enter scheduling mode — add wizard button
var tray = seedcodeCalendar.get('customButtonTray');
tray.register({
    uniqueId: 'schedulingWizard',
    icon: 'fa-magic',
    label: 'Schedule',
    color: '#28a745',
    action: function () { beginSchedulingWizard(); },
    order: 1,
});

// Exit scheduling mode — remove wizard button
tray.unregister('schedulingWizard');
```

### Replace bundled examples with your own buttons

Use `isExample: true` on the default buttons in `inputs.buttonList`, then call `tray.clearDefaults()` from another On Startup action to swap them out cleanly.

```js
// In a secondary On Startup action (runs after Part 1):
const tray = seedcodeCalendar.get('customButtonTray');
if (!tray) { return; }

tray.clearDefaults();   // removes all isExample:true buttons
tray.register({
    uniqueId: 'myButton',
    icon: 'fa-rocket',
    label: 'Launch',
    color: '#e91e63',
    action() { /* ... */ },
});
```

### Inspect and filter registered buttons

```js
const tray = seedcodeCalendar.get('customButtonTray');
const MY_IDS = ['myButton', 'myOtherButton'];

// Remove any button not in the known set:
tray.getRegistered().forEach(btn => {
    if (!MY_IDS.includes(btn.uniqueId)) {
        tray.unregister(btn.uniqueId);
    }
});
```

### Programmatically control the drawer

```js
const tray = seedcodeCalendar.get('customButtonTray');
tray.getDrawerOpenState();        // → true / false / null
tray.setDrawerOpenState(true);    // open the drawer without user click
tray.setDrawerOpenState(false);   // close the drawer
```

## Graceful Degradation

If Part 1 (On Startup) is not loaded, the thin delegates in Part 2 and Part 3 detect that `customButtonTray` is undefined and call `action.callbacks.confirm()` directly. The calendar loads normally without buttons and without errors.

## Dependencies

None.

## Design Patterns

- **Centralized architecture** — Single On Startup library + thin lifecycle delegates
- **Registry pattern** — `register()` / `unregister()` API with debounced DOM rebuild
- **DOM injection** — Floating button drawer in the calendar corner
- **Two-tier visibility** — `restrict` (access control) + `visibleWhen` (contextual)
- **Example button flag** — `isExample: true` marks bundled demos; `clearDefaults()` removes them in one call
- **Toggle buttons** — Two-state buttons with per-state visuals and callbacks, programmatic control via `getToggleState`/`setToggleState`
- **Drawer state API** — `getDrawerOpenState`/`setDrawerOpenState` for programmatic control after dynamic rebuilds
- **Container preference API** — `setContainerPreference`/`getEffectiveShowContainer` for runtime control of drawer vs. static mode; automatically forces static mode when only one button is registered/visible
- **Drawer state preservation** — Open/closed state survives dynamic rebuilds
- **CSS companion file** — Paired `.css` for all injected DOM elements
- **Account restriction** — `options.restrictedToAccounts`

## Notes

This extension is reused as infrastructure by `multi-update-popup-menu`, `take-calendar-screenshot`, and `update-multiple-events`.
