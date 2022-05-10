// Select All Events v1.0
//
// Purpose:
// This function adds a listener that will multi-select all visible events
// https://dayback.com/reschedule-multiple-events-at-once/
//
// Action Type: Before Calendar Rendered
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
        
        // Define which key combination should trigger selecting all events
        //
        // Available modifier keys include:
        //
        //  altGraphKey
        //  altKey
        //  ctrlKey
        //  metaKey
        //  shifKey

        options.modifierKey = 'shiftKey';

        // Which additional key should be used to trigger select-all action:
        // (use lower case)

        options.key = 'a';

    //----------- End Configuration -------------------

}
catch(error) {
    reportError(error);
}


//----------- The action itself: you may not need to edit this. -------------------


// Action code goes inside this function
function run() {
    
    // Remove prior keydown selectAll event listener and set new one
    removeEventListener('keydown', selectAll);
    addEventListener('keydown', selectAll);

    function selectAll(e) {  
        
        // modifier and key are pressed
        if (e[options.modifierKey] && e.key.toLowerCase() === options.key) {

            // Skip input elements and input textareas if in focus
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
                return;   
            }

            // Determine if the event is not filtered out of view and reset multi-select state
            var config       = seedcodeCalendar.get('config');
            var eventShown   = config.eventShown;
            var clientEvents = seedcodeCalendar.get('element').fullCalendar('clientEvents');
            var anyEvent     = clientEvents[0];

            var fcId;
            var thisElement;

            if (anyEvent){
                fcId = anyEvent._id;
                thisElement = document.body.querySelector('[data-id="' + fcId + '"]');
                dbk.toggleMultiSelect(anyEvent,false,thisElement,seedcodeCalendar.get('view'));
            }

            // Loop through client events and select visible
            for (var c = 0; c < clientEvents.length; c++){
                // Get event's element in the DOM
                fcId = clientEvents[c]._id;
                thisElement = false;
                thisElement = document.body.querySelector('[data-id="' + fcId + '"]');

                // If we have an element and it's not filtered, select using helper function
                if (thisElement && eventShown(clientEvents[c])){
                    dbk.toggleMultiSelect(clientEvents[c],true,thisElement,seedcodeCalendar.get('view'));
                }
            }
        }
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
