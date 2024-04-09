// Add Search to Bookmark List v1.0

// Purpose:
// Adds the ability to search bookmarks
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

    // Define which key combination should trigger the loading of the
    // shares menu. If you do not wish to add a keyboard shortcut
    // simply omit the next two configuration variables;
    //
    // Available modifier keys include:
    //
    //  altGraphKey
    //  altKey
    //  ctrlKey
    //  metaKey
    //  shiftKey
    //
    // Which additional key should be used to trigger select-all action:
    // (use lower case). 
    // 
    // In this example, We default this to Shift+b

    /**
     * Specify the keyboard modifier key to use for Keyboard shortcuts
     * @type {string}
     */
    inputs.modifierKey = 'shiftKey';

    /**
     * Specify the keyboard modifier key itself (in lowercase). 
     * @type {string}
     */
    inputs.shortCutKey = 'b';

    //----------- End Configuration -------------------
} catch (error) {
    reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {

    // Instantitate Pending Observer that waits for the 
    // appearance of the Manage Shares popover

    let o = dbk.observe({
        name: 'watchForSharesManage',
        watch: document.body,
        until: '#shares-manage',
        then: addSearchToBookmarks,
        autoStart: false
    });

    // Wait for all On-screen elements to load, and then 
    // attach a click listener to the Manage Shares button

    let manageShares;

    setTimeout(() => {
        manageShares = document.querySelector('[ng-click="manageShares($event)"]');
        manageShares.addEventListener('click', startObserver);
    }, 500);

    // Manage Shares button starts or restarts mutation observer
    // on an as-needed basis.

    function startObserver() {
        o.restart();
    }

    // Add Keybaord Shortcut support, if configured

    if (inputs.modifierKey && inputs.shortCutKey) {
        addEventListener('keydown', keyListener);
    }

    function keyListener(e) {

        // modifier and key are pressed
        if (e[inputs.modifierKey] && e.key.toLowerCase() === inputs.shortCutKey) {

            // Skip input elements and input textareas if in focus
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
                return;
            }

            manageShares.click();
        }
    }

    function addSearchToBookmarks(observer) {
        setTimeout(() => {
            const modal = observer?.foundNode;
            if (modal) {
                observer.stop();
                const header = modal.querySelector(
                    '.header-block.dbk_contentDivider'
                );
                let filterInput = header.querySelector('#filterInput');
                if (!filterInput) {
                    filterInput = document.createElement('input');
                    filterInput.id = 'filterInput';
                    filterInput.setAttribute('type', 'text');
                    filterInput.classList = 'pull-right';
                    filterInput.style.color = 'black';
                    filterInput.style.marginTop = '13px';
                    filterInput.style.marginRight = '13px';
                    filterInput.style.height = '1em';
                    filterInput.placeholder = 'Search';
                    header.appendChild(filterInput);

                    setTimeout(() => { filterInput.focus(); }, 200);

                    filterInput.onkeyup = function (ev) {
                        var bookmarkElements = document.querySelectorAll(
                            '[ng-repeat="item in share.list"]'
                        );
                        bookmarkElements.forEach(function (bookmark) {
                            var title = bookmark.querySelector(
                                '.modal-select-list-title'
                            ).innerText;
                            if (
                                title
                                    .toLowerCase()
                                    .includes(ev.target.value.toLowerCase())
                            ) {
                                bookmark.style.display = 'list-item';
                            } else {
                                bookmark.style.display = 'none';
                            }
                        });
                    };
                }
            }
        }, 100);
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