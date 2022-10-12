// Move Event to Clipboard v1.0 - Part 1
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
// Action Type: Button Action
// Prevent Default Action: Yes
// CSS Class: moveButton
//
// More info on button actions here:
// https://docs.dayback.com/article/5-custom-actions

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

    // Get current event and editEvent objects

    var moveEvent = {
        event: event,
        editEvent: editEvent
    };

    // Store event in persistent cliboard
    seedcodeCalendar.init('eventInClipboard', moveEvent);

    // Gray out event pill by applying eventInClipboard CSS style
    var e = document.querySelector('[data-id="' + event['_id'] + '"]');
    e.classList.add('eventInClipboard');

    // Enable the Add Event cursore for moving the event
    seedcodeCalendar.get('addCursor')();

    // Set persistent toast message that lasts a whole day. if cancel button is clicked, will 
    utilities.showMessage(
        "Event is ready to be moved to a new date <div style='display: inline-block;padding: 4px; background-color: #555; padding-bottom: 5px; border: 1px solid #DDD; color: white;border-radius: 5px;margin: 4px;line-height: 1rem; padding-right: 10px;'><i class='fa fa-fw fa-times'></i> Cancel </div>",
        100, 
        86400000,
        "message",
        seedcodeCalendar.get('clearClipboard')
    );
        
    // Close popovers 
    $rootScope.$broadcast('closePopovers'); 
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
