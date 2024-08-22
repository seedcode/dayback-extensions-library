// Enhanced Keyboard Shortcuts v1.0

// Purpose:
// Adds various keyboard shortcuts. Requires
// a CSS addition for a Help Menu triggered
// with Shift-?
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

    // Shortcut Definitions:
    // ---------------------
    //
    // You may add, remove, or modify any of these keyboard shortcuts
    // to optimize it for your platform and particular workflow.
    //
    // Shortcuts can be a single key code (i.e., KeyF), or it can be
    // a key code with a modifier key held down, such as the ShiftKey,
    // or the Ctrl key.
    //
    // Available, optional modifier keys:
    //
    //  altGraphKey
    //  altKey
    //  ctrlKey
    //  metaKey
    //  shiftKey
    //
    // Key codes should be specified according to their code name
    // see the table of code names here:
    // https://www.toptal.com/developers/keycode/table
    //
    // Here are the parameters for specifying your keyboard
    // shortcuts:
    //
    // name:
    //          Contains a brief name of the shortcut which
    //          will be displayed in the help menu.
    //
    // description:
    //          Contains a longer description of what the
    //          shortcut does and will be displayed in the
    //          help menu
    //
    // keyCombo:
    //          This is the human-readable key combination
    //          dispalyed to the user in the help menu
    //
    // shortcutKey:
    //          A required field which specified the specific
    //          key code. If you want to make a shortcut that
    //          fires when the G key is pressed, you must
    //          specify this value as 'KeyG', and not 'G', 
    //          according to the code name convention
    //
    // modifierKey:
    //          An optional parameter which states whether
    //          a modifier key also needs to be held down
    //          for this short cut to fire.
    //
    //  run:
    //          Specifies the function that will run when 
    //          the shortcut is triggered. The function 
    //          receives a single parameter containing the
    //          keyboard event. This will allow you to stop
    //          event propagation of normal events that
    //          would be triggered when the shortcut is 
    //          pressed. Stopping event propagation is not
    //          always necessary, depending on your 
    //          desired shortcut.
    //
    // Important Conditions:
    // ---------------------
    //
    // Note that keyboard shortcuts will not fire if user is 
    // currently interacting with an Input Box, Text area,
    // Select Box, Checkbox, or Radio Button. Additionally,
    // shortcuts will be ignored if an Event Popover, or a
    // modal window is open. You may wish to made this more 
    // restrictive depending on your specific needs.
    //
    // Even though the Shift-Z Undo Change keybaord shortcut is
    // natively available in DayBack, we have added it to the
    // documentation popup that shows when the user presses
    // Shift-?.

    /**
     * Specify an array of keyboard shortcuts.
     * @type {array}
     */

    inputs.shortcuts = [

        {
            name: "Previous Date",
            description: "Navigates the calendar backwards in time",
            keyCombo: 'Left Arrow',
            shortcutKey: 'ArrowLeft',
            run: function (e) {
                e.preventDefault();
                e.stopPropagation();
                let arrow = document.querySelector('.calendar-nav .fa-arrow-left');
                const shiftClickEvent = new MouseEvent('click', { shiftKey: e.shiftKey ? true : false });
                arrow.dispatchEvent(shiftClickEvent);
            }
        },

        {
            name: "Next Date",
            description: "Navigates the calendar forwards in time",
            keyCombo: 'Right Arrow',
            shortcutKey: 'ArrowRight',
            run: function (e) {
                e.preventDefault();
                e.stopPropagation();
                let arrow = document.querySelector('.calendar-nav .fa-arrow-right');
                const shiftClickEvent = new MouseEvent('click', { shiftKey: e.shiftKey ? true : false });
                arrow.dispatchEvent(shiftClickEvent);
            }
        },

        {
            name: "Go To Today",
            description: "Navigates the calendar to today's date",
            keyCombo: 'T',
            shortcutKey: 'KeyT',
            run: function (e) {
                document.querySelector('.calendar-nav span.button.middle')?.click();
            }
        },

        {
            name: "Refresh Calendar",
            description: "Refreshes the calendar with the latest events",
            keyCombo: 'R',
            shortcutKey: 'KeyR',
            run: function (e) {
                document.querySelector('[ng-click="refreshEvents()"]')?.click();
            }
        },

        {
            name: "Toggle Sidebar",
            description: "Opens and closes the left hand sidebar",
            keyCombo: 'S',
            shortcutKey: 'KeyS',
            run: function (e) {
                // Stop propagation of Tabs, as Tabs will normally advance the cursor
                // to the next on-screen element. If a user is interacting with an input
                // or textarea, popover, or modal, this Tabs will already be ignored

                e.preventDefault();
                e.stopPropagation();
                document.querySelector('.sidebar-toggle.clickable:not(.ng-hide)')?.click();
            }
        },

        {
            name: "Open Filters Menu",
            description: "Opens the status and resource filters",
            keyCombo: 'F',
            shortcutKey: 'KeyF',
            run: function (e) {

                // Simulate a Click on the Sidebar if it isn't open
                // Wait till it renders and then simulate a click on
                // the Filters button if Filters are not already showing

                let sidebar = document.getElementById('sidebar');
                let sideBarToggle = document.querySelector('.sidebar-toggle.clickable:not(.ng-hide)');

                if (sidebar.classList.contains('ng-hide')) {
                    sideBarToggle?.click();
                    setTimeout(openFilters, 250);
                } else {
                    openFilters();
                }

                function openFilters() {
                    let filtersButton = sidebar.querySelector('button.filters');
                    let filtersContainer = sidebar.querySelector('.sidebar-filters');
                    if (!filtersContainer) {
                        filtersButton?.click();
                    }
                }
            }
        },

        {
            name: "Show Bookmarks List",
            description: "Opens the Bookmarks list",
            keyCombo: 'B',
            shortcutKey: 'KeyB',
            run: function (e) {
                // Simulate a Click on the Manage Shares dropdown meny
                document.querySelector('[ng-click="manageShares($event)"]')?.click();
            }
        },

        {
            name: "Toggles Unscheduled Sidebar",
            description: "Opens and closes the Unscheduled Sidebar",
            keyCombo: 'U',
            shortcutKey: 'KeyU',
            run: function (e) {
                // Simulate a click on the Unscheduled Events Drag Handle
                document.querySelector('alt-view .alt-view-container .drag-handle.clickable')?.click();
            }
        },

        {
            name: "Show Keyboard Shortuts",
            description: "Shows list of available shortcuts",
            keyCombo: '?',
            modifierKey: 'shiftKey',
            shortcutKey: 'Slash',
            run: function (e) {

                // Display help modal which contains a list of
                // available shortcuts.

                let modal = `
                <div style="displa: block; width: 600px;"></div>
                <div class="keyHelpCointainer">
                `;

                for (let s = 0; s < inputs.shortcuts.length; s++) {
                    let k = inputs.shortcuts[s];
                    modal += `
                        <div class="name">${k.name}</div>
                        <div class="shortcut">${k.keyCombo}</div>
                        <div class="description">&bull; ${k.description}</div>
                    `;
                }

                // Add shift-z because people don't know about it

                modal += `
                        <div class="name">Undo Last Edit</div>
                        <div class="shortcut">Shift + Z</div>
                        <div class="description">&bull; Undo the last change you made to an event</div>
                `;

                // Close container and display modal

                modal += `
                <div class="moreshortcuts">
                See <A HREF="https://docs.dayback.com/article/45-shortcuts" TARGET="_blank">more shortcuts &amp; mouse gestures</A>
                </div>
                </div>
                `;

                utilities.showModal('Supported Keyboard Shortcuts', modal, "Close", null, null, null);
            }
        },
    ];


    /**
     * Specify the keyboard modifier key itself (in lowercase). 
     * @type {string}
     */

    //----------- End Configuration -------------------
} catch (error) {
    reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {

    // Add Keybaord Shortcut support, if configured

    let shortcutsLoaded = globals.seedcodeCalendar.get('dbkKeySortcutsLoaded');

    if (shortcutsLoaded) {
        return;
    } else {
        globals.seedcodeCalendar.init('dbkKeySortcutsLoaded', true);
        let appContainer = document.getElementById('app-container');
        if (!appContainer.dataset.hasAttachedKeyboardListener) {
            addEventListener('keydown', keyListener);
            appContainer.dataset.hasAttachedKeyboardListener = true;
        }
    }

    function keyListener(e) {

        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT' || document.activeElement.tagName === 'RADIO' || document.activeElement.tagName === 'CHECKBOX') {
            return;
        }

        let isModalOpen = document.querySelector('.modal-dialog');
        let isPopoverOpen = document.querySelector('.edit-container');
        let isNoEvents = document.querySelector('.no-events-modal');
        let isBookmarkList = document.getElementById('shares-manage');

        if ((isModalOpen || isPopoverOpen || isBookmarkList) && !isNoEvents) {
            return;
        }

        for (let s = 0; s < inputs.shortcuts.length; s++) {

            let k = inputs.shortcuts[s];

            if ((k.modifierKey && e[k.modifierKey] && k.shortcutKey && e.code === k.shortcutKey) ||
                (!k.modifierKey && k.shortcutKey && e.code === k.shortcutKey)) {
                k?.run(e);
            }
        }
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
