// Interactive Analytics Totals: Click to Highlight Resource v1.0

// Purpose:
//
// This code enables clickable analytics totals. When a user 
// clicks on a total, the corresponding resource in the analytics graph 
// is highlighted, and all other resources are dimmed for focused 
// viewing.
//
// Additionally, this action dynamically adjusts the threshold line to 
// match the clicked resource’s threshold settings. Threshold settings 
// for each resource are defined in their respective tags and should 
// follow this format: a number followed by the word 'hours' 
// (e.g., "10 hours", "20 hours").
//
// Action Type: After Calendar Rendered
// Prevent Default Action: No

// More info on custom App Actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// Declare global imports
// @ts-ignore
const globals = { action, dbk, seedcodeCalendar, utilities };

const options = {};
const inputs = {};

try {
    //----------- Configuration -------------------

    // Options specified for this action

    /**
     * Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
     * @type {number}
     */
    options.runTimeout = 8;

    /**
     * Array of account emails for whom this action will run. Leave blank to allow the action to run for everyone.
     * Example: ['person@domain.com', 'someone@domain.com']
     * @type {Array<string>}
     */
    options.restrictedToAccounts = [];

    // Any input data for the action should be specified here

    /**
     * The currently signed in account email
     * @type {string}
     */
    inputs.account = globals.seedcodeCalendar.get('config').account;

    //----------- End Configuration -------------------
} catch (error) {
    reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {

    // Grab our resource list

    const resources = seedcodeCalendar.get('resources');

    // Define a tracking object that maintains the current and previously-selected 
    // resource and breakout item 

    const state = {};

    state.analyticsPrevious = 0;
    state.analyticsItem = 0;
    state.analyticsResource = '';

    addBreakoutWatcher();

    // Watch the calendar for the appearance of breakout totals that have not
    // been assigned a click handler

    function addBreakoutWatcher() {
        dbk.observe({
            name: 'breakoutWatcher',
            watch: '#calendar',
            until: '.breakout-footer-total:not(.clickAttached)',
            then: (o) => {
                o.destroy();
                setTimeout(attachBreakoutClickHandlers, 100);
            }
        });
    }

    // Function attaches click handles to anyh items that have not had handlers
    // attached

    function attachBreakoutClickHandlers() {

        let totals = document.querySelectorAll('.breakout-footer-total:not(.clickAttached)');
        let item = 0;

        totals.forEach((e) => {
            e.classList.add('clickAttached');
            e.dataset.breakoutItem = ++item;
            e.onclick = () => { handleBreakoutClick(e); }
        });

        // Toggling of threshold values forces a repaint, which removes
        // the clicked state. If a future repaint took palce after a
        // value was selected, highlight the selected value.

        if (state.analyticsResource != '' && state.analyticsItem > 0) {
            highlightResource();
        }

        // Start a new breakout watcher instance, since the breakout totals can 
        // repaint with window resizes, filter, or date changes.

        addBreakoutWatcher();
    }

    // Click handling function processes a click on a specific breakout total

    function handleBreakoutClick(e) {

        // Extract the Resource Name from Breakout Total Tooltip information

        const tooltip = e.getAttribute('tool-tip');
        const rmatch = tooltip.match(/^<div[^>]*><div>(.*?)<\/div>/);
        const resource = rmatch ? rmatch[1] : 'none';

        // Extract resource record and obtain threshold hours value

        let threshold = 0;

        if (resources && resource !== 'none') {
            let rec = resources.filter((r) => r.name === resource || r.nameSave === resource);
            if (rec.length && rec[0].tags && rec[0].tags.length > 0) {
                for (let t of rec[0].tags) {
                    const tmatch = t.name.match(/^(\d+) hour/);
                    if (tmatch) {
                        threshold = tmatch[1];
                        break;
                    }
                }
            }
        }

        // Update threshold based on user's tags, or hide threshold if no tag found

        if (threshold > 0) {
            seedcodeCalendar.get('config').measureThreshold = threshold;
            seedcodeCalendar.get('config').showMeasureThreshold = true;
        } else {
            seedcodeCalendar.get('config').showMeasureThreshold = false;
        }

        // Set clicked resource

        state.analyticsPrevious = state.analyticsItem;
        state.analyticsItem = e.dataset.breakoutItem;
        state.analyticsResource = resource;

        // Broadcast settings change. This forces a repaint

        $timeout(() => {
            $rootScope.$broadcast('eventsRendered');
        }, 0);
    }

    // Helper function highlights the clicked resource breakdown total
    // and applies styles to dimmed and highlighted resources

    function highlightResource() {

        const breakoutItem = state.analyticsItem;
        const resource = state.analyticsResource;

        // Get the calendar container, the currently-highlighted item, and clicked item.

        const container = document.getElementById('calendar');
        const activeHighlight = document.querySelector('.breakout-footer-total.activeHighlight');
        const clickedItem = document.querySelector(`.breakout-footer-total[data-breakout-item="${state.analyticsItem}"]`);

        // If the current item is the item that was clicked, toggle off all highlighting

        if (breakoutItem === state.analyticsPrevious) {
            container.classList.remove('analyticsHighlighting');
            switchOffHighlighting();
            return;
        } else {
            container.classList.add('analyticsHighlighting');
        }

        // Switch currently-selected breakout items

        if (activeHighlight) {
            activeHighlight.classList.remove('activeHighlight');
        }

        // Highlight current item

        if (clickedItem) {
            clickedItem.classList.add('activeHighlight');
        }

        // Create a resource class name that matches expected paths

        const resourceClass = utilities.stringToClass(resource, 'ct-resource');

        // Get all Relevant Chart Objects 

        const notResourceArea = document.querySelectorAll(`.chart-container .ct-area:not(.${resourceClass}`);
        const notResourcePoint = document.querySelectorAll(`.chart-container .ct-point:not(.${resourceClass}`);
        const notResourceLine = document.querySelectorAll(`.chart-container .ct-line:not(.${resourceClass}`);

        const resourceArea = document.querySelectorAll(`.chart-container .ct-area.${resourceClass}`);
        const resourcePoint = document.querySelectorAll(`.chart-container .ct-point.${resourceClass}`);
        const resourceLine = document.querySelectorAll(`.chart-container .ct-line.${resourceClass}`);

        const offList = [...notResourceArea, ...notResourcePoint, ...notResourceLine];
        const onList = [...resourceArea, ...resourcePoint, ...resourceLine];

        // Dim other resources 

        for (let off of offList) {
            if (off && off.classList) {
                off.classList.add('ct-dim');
            }
        }

        // Highlight Our resource

        for (let on of onList) {
            if (on && on.classList) {
                on.classList.add('ct-highlight');
            }
        }
    }

    // Helper function switches off all highlighting if no longer applicable

    function switchOffHighlighting() {

        const offList = document.querySelectorAll('.ct-dim');
        const onList = document.querySelectorAll('.ct-highlight');

        for (let off of offList) {
            off.classList?.remove('ct-dim');
        }

        for (let on of onList) {
            on.classList?.remove('ct-highlight');
        }

        state.analyticsPrevious = 0;
        state.analyticsItem = 0;
        state.analyticsResource = '';
    }
}

//----------- Run function wrapper and helpers - you shouldn’t need to edit below this line. -------------------

// Shared type definitions
/**
 * @typedef {Object} ActionError
 * @property {string} name
 * @property {string} message
 */

// Variables used for helper functions below
let timeout;

// Execute the run function as defined above
try {
    if (
        !options.restrictedToAccounts ||
        !options.restrictedToAccounts.length ||
        (options.restrictedToAccounts &&
            options.restrictedToAccounts.indexOf(inputs.account) > -1)
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

/**
 * Run confirm callback when preventDefault is true. Used for async actions
 * @type {() => void}
 */
function confirmCallback() {
    cancelTimeoutCheck();
    if (globals.action.callbacks.confirm) {
        globals.action.callbacks.confirm();
    }
}

/**
 * Run cancel callback when preventDefault is true. Used for async actions
 * @type {() => void}
 */
function cancelCallback() {
    cancelTimeoutCheck();
    if (globals.action.callbacks.cancel) {
        globals.action.callbacks.cancel();
    }
}

/**
 * Check if the action has run within the specified time limit when preventDefault is enabled
 * @type {() => void}
 */
function timeoutCheck() {
    timeout = setTimeout(
        function () {
            const error = {
                name: 'Timeout',
                message:
                    'The action was unable to execute within the allotted time and has been stopped',
            };
            reportError(error);
        },
        options && options.runTimeout ? options.runTimeout * 1000 : 0
    );
}

/** @type {() => void} */
function cancelTimeoutCheck() {
    if (timeout) {
        clearTimeout(timeout);
    }
}

/**
 * Report any errors that occur when running this action
 * Follows standard javascript error reporter format of an object with name and message properties
 * @type {(error: ActionError) => void}
 */
function reportError(error) {
    const errorTitle = 'Error Running Custom Action';
    const errorMessage = `<p>There was a problem running the action "<span style="white-space: nowrap">${globals.action.name}</span>"</p><p>Error: ${error.message}.</p><p>This may result in unexpected behavior of the calendar.</p>`;
    if (
        globals.action.preventDefault &&
        globals.action.category !== 'event' &&
        timeout
    ) {
        confirmCallback();
    } else {
        cancelCallback();
    }

    setTimeout(function () {
        globals.utilities.showModal(
            errorTitle,
            errorMessage,
            null,
            null,
            'OK',
            null,
            null,
            null,
            true,
            null,
            true
        );
    }, 1000);
}
