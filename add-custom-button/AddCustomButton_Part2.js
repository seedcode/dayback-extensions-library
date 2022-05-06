// Add Custom Button - Part 2 v1.0
//
// Purpose:
// This is a Part 2 of the Add Custom Button custom app action.
// It moves the Custom Button bar down when we do not
// have Analytics button displayed (such as in Month context)
// It can also be used to remove specific buttons from the 
// button bar if they are not relevant to the current view
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
        
        // Define the CSS class group name used for styling the button and button drawer.
        // You may duplicate this app action multiple times if you wish to create multiple
        // groups of buttons. If you want the button group to be styles differently
        // you will need to use a different set of CSS class names by copying all the
        // custom_btn CSS classes, and giving them a new CSS class group name. If you only
        // intend to create one group of buttons, you may leave this option set to custom_btn
        // by default:

        options.cssGroupName = 'custom_btn';

        // Define this to true if you would like to define your own function
        // which shows/hides buttons in a specific view. Leave to false if you do not
        // plan on using this function. 

        inputs.showHideCustomButtons = true;

        // To add your own logic to show/hide specific buttons, edit the
        // showHideCustomButtons() function below.

   //----------- End Configuration -------------------        
}
catch(error) {
    reportError(error);
}


//----------- The action itself: you may not need to edit this. -------------------


// Action code goes inside this function
function run() {

    // Get current view and custom button container
    var calendarView    = seedcodeCalendar.get('view');        
    var buttonContainer = document.getElementById(options.cssGroupName + '_containerId');

    if (buttonContainer) {
    
        // Show/hide buttons based on custom criteria if checkCustomButtons function is turned on
        if (inputs.showHideCustomButtons) {
            showHideCustomButtons();
        }

        // Move the custom button container down when Analytics button is hidden from view
        toggleButtonsWithAnalytics();    
    }

    // Once all is loaded, confirm callback and run other functions configured for this handler
    return confirmCallback();

    // Modify this function to add your own Show/Hide criteria
    function showHideCustomButtons() {
        
        // Get the button we wish to toggle
        var button = document.getElementById('customButton_sales');    

        if (button) { 
            // Hide Button if we are not on a resource-specific view
            if (!isResourceView()) {
                button.style.display = 'none';
            } else {
                button.style.display = 'flex';
            }       
        }
    }

    // Helper functions defined below

    function isResourceView() {
        return calendarView && (calendarView.name.includes('Resource') || (calendarView.name.includes('Horizon') && seedcodeCalendar.get('config').horizonBreakoutField === 'resource'));
    }

    function toggleButtonsWithAnalytics() {
        var toggleClass = buttonContainer.classList.contains(options.cssGroupName + '_container_static') ? options.cssGroupName + '_container_no_analytics_static' : options.cssGroupName + '_container_no_analytics';

        if (calendarView.name == 'month') {
            buttonContainer.classList.add(toggleClass);
        } else {
            buttonContainer.classList.remove(toggleClass);
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