// Unscheduled To Do Items v1.0 - Part 6 of 6
//
// Purpose:
// Assigns the next sequence number for a newly-created 
// ToDo or Unscheduled Sortable event 
//
// Action Type: On Event Create
// Prevent Default Action: Yes
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

    const todo = seedcodeCalendar.get('_todoObject');

    if (event.unscheduled && todo) {

        todo.set('eventClickLock', true);
        setTimeout(function () {
            todo.set('eventClickLock', false);
        }, 250);

        var events = seedcodeCalendar.get('element').fullCalendar('unscheduledClientEvents');

        // Get the maximum sequence number of all unscheduled events

        const newEventsOnTop = todo.get('newEventsOnTop');
        const fieldName = todo.get('sequenceFieldName');
        const fieldId = dbk.getCustomFieldIdByName(fieldName, event.schedule);

        let maxSequence = 0;

        events.forEach((e) => {
            const seqField = dbk.getCustomFieldIdByName(fieldName, e.schedule);
            if (parseInt(e[seqField]) > maxSequence) {
                maxSequence = parseInt(e[seqField]);
            }
        });

        // Assign a new Sequence number to the new event
        event[fieldId] = ++maxSequence;
    }

    action.callbacks.confirm();
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