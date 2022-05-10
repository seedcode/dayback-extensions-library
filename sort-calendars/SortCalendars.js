// Sort Calendars v1.0

// Purpose:
// Defines the order in which calendars should be listed

// Action Type: On Calendars Fetched
// Prevent Default Action: Yes

// More info on On Calendars Fetched actions and objects here:
// https://docs.dayback.com/article/140-custom-app-actions

// Declare globals

var options = {}; var inputs = {};

try {

    //----------- Configuration -------------------

        // Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)

        options.runTimeout = 0; 

        // Specify the order in which the calendars should be listed.
        //
        // Any calendar the user does not have access to will be
        // automatically skipped from their individual list
        //
        // If the list of available calendars is longer than the list of 
        // calendars you define in your sorted list, your calendar order
        // will take priority, and remaining calendars will be added to 
        // of the list.
        //
        // Specifying a partical list may be useful if you only need a 
        // certain calendar, or set of calendars to appear on the top
        // of every user's calendar list.
        //
        // Example:
        //
        // input.calendarOrder = [ 'Corporate', 'Sales', 'Marketing', 'Technology']
        
        inputs.calendarOrder = [ ];
        
    //----------- End Configuration -------------------

}
catch(error) {
    reportError(error);
}



//----------- The action itself: you may not need to edit this. -------------------


// Action code goes inside this function
function run() {
    
    var schedules = seedcodeCalendar.get('schedules');

    // Check that we have defined a list of calendars
    if (!inputs.calendarOrder || inputs.calendarOrder.length < 1) {
        return reportConfigError("Please specify an ordered list of calendars", confirmCallback);
    }

    // Add calendars not listed in sort list to the end
    for (var i = 0; i < schedules.length; i++) {
        if (inputs.calendarOrder.indexOf(schedules[i].name) < 0) {		
            inputs.calendarOrder.push(schedules[i].name);
        }
    }

    // Sort calendars
    schedules.sort(function(a,b) {
        return inputs.calendarOrder.indexOf(a.name) - inputs.calendarOrder.indexOf(b.name);	
    });

    // Confirm next callback
    return confirmCallback();

    // Report Config Error function
    function reportConfigError(error, confirmCallback) {
        utilities.showModal(
            'Error Running Custom Action', 
            '<p>There was a problem running the action "<span style="white-space: nowrap">' + action.name + '</span>"</p><p>Error: ' + error + '.</p><p>This may result in unexpected behavior of the calendar.</p>',
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