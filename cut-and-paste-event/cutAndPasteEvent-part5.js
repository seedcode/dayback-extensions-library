// Cut and Paste Event v1.0 - Part 5
//
// Purpose:
// Adds an Event Button function which temporarily
// moves the event to the clipboard. The clipboard
// persists between view changes. Event can be
// moved to its destination time and resource
// allocation and respect move context.
//
// https://dayback.com/listing/custom-action-menu/
//
// Action Type: After Events Rendered
// Prevent Default Action: No
//
// More info on app actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// Declare globals

var options = {};
var inputs = {};

try {
    // ----------- General Configuration -------------------

    // Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
    // Leave this set to 0 to avoid unexpected behavior

    options.runTimeout = 0;
} catch (error) {
    reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
    // Grab current events in clipboard and apply the eventInClipboard CSS
    // style to the event with that eventID

    let eventInClipboard = seedcodeCalendar.get("eventInClipboard");
    if (!eventInClipboard || !eventInClipboard.hasOwnProperty("event")) {
        return;
    }

    let eventID = eventInClipboard.event.eventID;
    var clientEvents = seedcodeCalendar
        .get("element")
        .fullCalendar("clientEvents");
    var events = clientEvents.filter((event) => {
        return event.eventID == eventID;
    });

    if (events.length > 0) {
        let domID = events[0]._id;
        var e = document.querySelector('[data-id="' + domID + '"]');
        if (e && e !== undefined && !e.classList.contains("eventInClipboard")) {
            e.classList.add("eventInClipboard");
        }
    }
}

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
