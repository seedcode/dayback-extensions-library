// Unscheduled To Do Items v1.0 - Part 4 of 6
//
// Purpose:
// The Saving of a To Do item, a Change in the To Do Item status, 
// or a change in the Sequence parameter, or Checkbox state all
// result in a change of visual state that is currently not
// handled through After Events Rendered or Before Event Rendered
// calls. Therefore, we have to manage repainting manually, and
// also trigger the attachment or detachment of Event Listeners
// and CSS classes depending on the resulting state of the To Do
// event.
//
// Action Type: On Event Save
// Prevent Default Action: No
// 
// More info on custom actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// Declare globals

var options = {}; var inputs = {};

try {
    //----------- Configuration -------------------

    // Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
    // Leave this set to 0 to avoid unexpected behavior

    options.runTimeout = 0;

    //----------- End Configuration -------------------        
}
catch (error) {
    reportError(error);
}


//----------- The action itself: you may not need to edit this. -------------------


// Action code goes inside this function

function run() {

    // To Do Items v1.0 - On Event Save 
    // Prevent Default - No

    const todo = seedcodeCalendar.get('_todoObject');

    var events = seedcodeCalendar.get('element').fullCalendar('unscheduledClientEvents') || [];

    if (todo && event.unscheduled) {

        // If the Saved event is a To Do and is Applicable
        // we may need to repaint the Icon color if the Status
        // was changed. Alternatively, if the Unscheduled
        // property iself was changed, and a previously scheduled
        // To Do item returns to the Unscheduled drawer, we must
        // treat it like a regular drop event, rather than a sorting
        // event/

        if (todo?.isToDoEvent(event) && todo?.isToDoApplicable(event)) {
            if (changesObject.hasOwnProperty('status')) {
                events.forEach((e) => {
                    if (e._id == event._id) {
                        let cell = document.querySelector('[data-id="' + e._id + '"]');
                        let icon = cell?.querySelector('.color-swatch-container i');
                        if (icon) {
                            icon.style.color = event.color;
                        }
                    }
                });
            } else if (changesObject.hasOwnProperty('unscheduled') && todo.isToDoEvent(event)) {
                todo.set('mouseReleased', false);
                todo.set('draggingTodoItem', false);
            }
        }

        // Loop through all unscheduled events, and handle CSS Class swapping based on whether 
        // item is a To Do if they are no longer a To Do, strip prior Todo Classes

        setTimeout(todo.attachEventListeners, 250);
    }
}

//----------- Run function wrapper and helpers - you shouldn’t need to edit below this line. -------------------

// Variables used for helper functions below
var timeout;

// Execute the run function as defined above
try {

    if (!options.restrictedToAccounts ||
        !options.restrictedToAccounts.length ||
        (options.restrictedToAccounts && options.restrictedToAccounts.indexOf(inputs.account) > -1)
    ) {
        if (action.preventDefault && options.runTimeout) {
            timeoutCheck();
        }
        run();
    }
    else if (action.preventDefault) {
        confirmCallback();
    }
}
catch (error) {
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
    timeout = setTimeout(function () {
        var error = {
            name: 'Timeout',
            message: 'The action was unable to execute within the allotted time and has been stopped'
        };
        reportError(error, true);
    }, (options && options.runTimeout ? options.runTimeout * 1000 : 0));
}

function cancelTimeoutCheck() {
    if (timeout) {
        clearTimeout(timeout);
    }
}

// Function to report any errors that occur when running this action
// Follows standard javascript error reporter format of an object with name and message properties
function reportError(error) {
    var errorTitle = 'Error Running Custom Action';
    var errorMessage = '<p>There was a problem running the action "<span style="white-space: nowrap">' + action.name + '</span>"</p><p>Error: ' + error.message + '.</p><p>This may result in unexpected behavior of the calendar.</p>';
    if (action.preventDefault && timeout) {
        confirmCallback();
    }
    else {
        cancelCallback();
    }

    setTimeout(function () {
        utilities.showModal(errorTitle, errorMessage, null, null, 'OK', null, null, null, true, null, true);
    }, 1000);
}