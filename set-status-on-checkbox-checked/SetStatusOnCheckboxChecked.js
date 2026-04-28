// Set Status On Checkbox Checked v1.0

// Purpose:
// Sets the event status based on a checkbox being checked.
// Can be used with existing event fields, or custom fields.

// Action Type: On Field Change
// Open In New Window: No
// Prevent Default Action: Yes
// For Events That Are: Editable

// More info about On Field Change actions and objects:
// https://docs.dayback.com/article/20-event-actions
// More info on settable fields in the Event object:
// https://docs.dayback.com/article/124-action-objects-methods#editEvent
// More info on creating Custom Fields:
// https://docs.dayback.com/article/109-additional-fields

// Declare globals

var options = {}; var inputs = {};

try {

    //----------- Configuration -------------------

        // Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)

        options.runTimeout = 0; 

        // Specify the Field Name you wish to edit. When using this action to trigger
        // events on Custom Field changes, define eventFieldName as the Store In Field Name 
        // of the field you wish to modify, rather than using numerical field ID.
        //
        // Next specify the Event status if checkbox is checked, and the status
        // if the checkbox is unchecked

        inputs.eventFieldName       = 'meetingAttended';
        inputs.setStatusIfChecked   = 'Complete';
        inputs.setStatusIfUnchecked = 'Pending';

    //----------- End Configuration -------------------

}
catch(error) {
    reportError(error);
}


//----------- The action itself: you may not need to edit this. -------------------


// Action code goes inside this function
function run() {
  
    // Track if our field change event has successful changes
    var modifiedField  = params.data.field;
    var eventFieldName = inputs.eventFieldName;

    // Verify this is an editable fields
    if (!editEvent.hasOwnProperty(eventFieldName) && getFieldIdByName(inputs.eventFieldName) !== undefined) {
      eventFieldName = getFieldIdByName(inputs.eventFieldName);
    } 
    else if (!editEvent.hasOwnProperty(eventFieldName)) {
        return reportConfigError('The field ' + inputs.eventFieldName + ' is not editable for ' + schedule.name + ' calendar');
    }

    // Check that the action was triggered on our field
    if (modifiedField == eventFieldName) {
        
        // Check if field when from unchecked to check
        if (editEvent[eventFieldName] === true && editEvent[eventFieldName] !== event[eventFieldName]) {
            editEvent.status = [ inputs.setStatusIfChecked ];
        } 
        else if (editEvent[eventFieldName] !== true && editEvent[eventFieldName] !== event[eventFieldName]) {
            editEvent.status = [ inputs.setStatusIfUnchecked ];
        }
    }

    return confirmCallback(); 

    // Helper function to get Custom Field ID by Store In Field Name
    function getFieldIdByName(name) {
        for (const customFieldId in schedule.customFields) {
            if (schedule.customFields[customFieldId].field == name) {
                return customFieldId;
            }
        }
    }

    // Report Config Error function
    function reportConfigError(error, confirmCallback) {
        utilities.showModal(
            'Error Running Custom Action', 
            '<p>There was a problem running the "<span style="white-space: nowrap">On Field Change</span> action"</p><p>Error: ' + error + '.</p><p>This may result in unexpected behavior of the calendar.</p>',
            null, null, 'OK', confirmCallback, null, null, true, null, true
        );
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
catch(error) {
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
    timeout = setTimeout(function() {
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
    if (action.preventDefault && action.category !== event && timeout) {
        confirmCallback();
    }
    else {
        cancelCallback();  
    }
    
    setTimeout(function() {
        utilities.showModal(errorTitle, errorMessage, null, null, 'OK', null, null, null, true, null, true);
    }, 1000);
}  