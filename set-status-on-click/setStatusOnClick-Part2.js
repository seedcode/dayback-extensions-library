// Set Status on Click - Part 2 v1.0
//
// Purpose:
// Allows point and click Status changes when a key is
// held down. Different sounds can be configured to play
// for different status changes scenarios. Function can
// be configured to check for errors and play an error
// sound if a permission check fails
//
// Action Type: Before Calendar Rendered
// Prevent Default Action: No
//
// More info on custom actions here:
// https://docs.dayback.com/article/20-event-actions

// Declare globals

var options = {};
var inputs = {};

try {
    //----------- Configuration -------------------

    // Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
    // Leave this set to 0 to avoid unexpected behavior

    options.runTimeout = 0;

    //----------- End Configuration -------------------
} catch (error) {
    reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function

function run() {
    // Add Tone.js Library for playing sounds
    var script = document.createElement("script");
    script.src = "https://unpkg.com/tone";
    document.getElementsByTagName("head")[0].appendChild(script);

    var trackerRunning = seedcodeCalendar.init("trackerRunning", false, true);

    addEventListener("focus", _addKeyListeners);
    addEventListener("blur", _removeKeyListeners);

    _addKeyListeners();

    // Define Event Handlers
    function _addKeyListeners(e) {
        if (trackerRunning) return;
        seedcodeCalendar.init("keyDown", {});
        trackerRunning = true;
        document.addEventListener("keyup", _keyup);
        document.addEventListener("keydown", _keydown);
    }

    function _removeKeyListeners(e) {
        document.removeEventListener("keyup", _keyup);
        document.removeEventListener("keydown", _keydown);
        seedcodeCalendar.init("keyDown", {});
        trackerRunning = false;
    }

    function _keyup(e) {
        let keyDown = seedcodeCalendar.get("keyDown");
        delete keyDown[e.code];
    }

    function _keydown(e) {
        let keyDown = seedcodeCalendar.get("keyDown");
        keyDown[e.code] = e.key;
    }
}

// End Custom Popover Panel code

//----------- Run function wrapper and helpers - you shouldn’t need to edit below this line. -------------------

// Variables used for helper functions below
var timeout;

// Execute the run function as defined above
try {
    if (
        !options.restrictedToAccounts ||
        !options.restrictedToAccounts.length ||
        (options.restrictedToAccounts &&
            options.restrictedToAccounts.indexOf(inputs.account) > -1)
    ) {
        if (action.preventDefault && options.runTimeout) {
            timeoutCheck();
        }
        run();
    } else if (action.preventDefault) {
        confirmCallback();
    }
} catch (error) {
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
    timeout = setTimeout(
        function () {
            var error = {
                name: "Timeout",
                message:
                    "The action was unable to execute within the allotted time and has been stopped"
            };
            reportError(error, true);
        },
        options && options.runTimeout ? options.runTimeout * 1000 : 0
    );
}

function cancelTimeoutCheck() {
    if (timeout) {
        clearTimeout(timeout);
    }
}

// Function to report any errors that occur when running this action
// Follows standard javascript error reporter format of an object with name and message properties
function reportError(error) {
    var errorTitle = "Error Running Custom Action";
    var errorMessage =
        '<p>There was a problem running the action "<span style="white-space: nowrap">' +
        action.name +
        '</span>"</p><p>Error: ' +
        error.message +
        ".</p><p>This may result in unexpected behavior of the calendar.</p>";
    if (action.preventDefault && timeout) {
        confirmCallback();
    } else {
        cancelCallback();
    }

    setTimeout(function () {
        utilities.showModal(
            errorTitle,
            errorMessage,
            null,
            null,
            "OK",
            null,
            null,
            null,
            true,
            null,
            true
        );
    }, 1000);
}
