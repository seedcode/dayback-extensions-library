// Event Border Colors v1.0
// 
// Purpose:
// Set Event Border Color based on Custom Field Value.
//
// Action Type: After Events Rendered
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

        // Define the Calendar Sources that should be
        // scanned for specific Custom Field values

        inputs.reminderCalendar = [ 'SeedCode Shared' ];

        // Define the Custom Field name that contains information 
        // that can be used to style an Event

        inputs.customFieldName = 'reminderType';
            
        // If we find events where this Custom Field is defined, 
        // apply a CSS class to the Event based on the value
        // stored in the Custom Field. If a field is empty, or
        // does not contain a value defined in this list, the
        // event will simply assume DayBack's default Event style

        inputs.eventStyleByFieldValue = {
            
            // Field Value:   // CSS Class Name:

            'Check-in':       'reminderType_checkin_class',
            'Estimate':       'reminderType_estimate_class',
            'Troubleshoot':   'reminderType_troubleshoot_class',
            'Other':          'reminderType_other_class'
        };

   //----------- End Configuration -------------------        
}
catch(error) {
    reportError(error);
}


//----------- The action itself: you may not need to edit this. -------------------


// Action code goes inside this function
function run() {

    // Get a list of calendars, and all calendar events
    var schedules = seedcodeCalendar.get('schedules');
    var events    = seedcodeCalendar.get('element').fullCalendar('clientEvents');

    // Loop through all schedules
    schedules.forEach(schedule => {

        // Check if the schedule is included in our configured list of schedules 
        if (inputs.reminderCalendar.includes(schedule.name)) {

            // Get the numerical Custom Field ID for our Custom Field 
            var customFieldId = dbk.getCustomFieldIdByName(inputs.customFieldName, schedule);

            // Find all events that contain a filled-in Custom Field value
            var reminders = events.filter(event => {
                return event.hasOwnProperty(customFieldId) && 
                        event[customFieldId] !== undefined && 
                        event[customFieldId] !== "";
            });
            
            // Loop through all matching reminder events and apply a custom CSS 
            // class based on the value of the Custom Field
            reminders.forEach(event => {
                // Get the on-screen element of the event 
                let cell = document.querySelector('[data-id="' + event['_id'] + '"]');

                // Get the class we should apply and add it to the event's CSS class list
                let cssClassName = inputs.eventStyleByFieldValue[event[customFieldId]];
                if (cell && cssClassName && !cell.classList.contains(cssClassName)) {
                    cell.classList.add(cssClassName);
                }
            });
        }
    });     
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

