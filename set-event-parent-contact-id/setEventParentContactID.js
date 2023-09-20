// Set Event Parent Contact ID v1.1

// Purpose:
// Sets specific Contact ID and Contact Name for all events on event creation

// Action Type: On Event Create
// Prevent Default Action: Yes
// For events that are: Editable

// More info for On Event Create actions and objects here:
// https://docs.dayback.com/article/20-event-actions
// More info on Salesforce Event Visibility configuration here:
// https://docs.dayback.com/article/253-event-visibility-in-salesforce

// Declare globals

var options = {}; var inputs = {};

try {

    //----------- Configuration -------------------

        // Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)

        options.runTimeout = 0; 

        // Define which parent contactID and contactName should be assigned to all events
        // Follow contact configuration recommendations to ensure event visibility for all users

        inputs.contactID   = '0035eabcdefgh134567';
        inputs.contactName = 'Shared Event';
        
    //----------- End Configuration -------------------

}
catch(error) {
    reportError(error);
}



//----------- The action itself: you may not need to edit this. -------------------


// Action code goes inside this function
function run() {

    if ((!inputs.contactID   || typeof inputs.contactID   !== 'string' || inputs.contactID.length < 10) ||
        (!inputs.contactName || typeof inputs.contactName !== 'string')) {
        cancelCallback();
        utilities.showModal('Set Event Parent Contact ID', 'Configuration Error: Please define Contact ID and Contact Name', null, null, 'OK', null, null, null, true, null, true);
    }
    else {
        event.contactID   = [inputs.contactID];
        event.contactName = [inputs.contactName];
        confirmCallback();
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
    var errorMessage = '<p>There was a problem running the action "<span style="white-space: nowrap">' + action.name + '</span>"</p><p>Error: ' + error.message + '.</p><p>This may result in unexpected behavior of the calendar.</p>'
    if (action.preventDefault && timeout) {
        confirmCallback();
    }
    else {
        cancelCallback();  
    }
    
    setTimeout(function() {
        utilities.showModal(errorTitle, errorMessage, null, null, 'OK', null, null, null, true, null, true);
    }, 1000);
}  