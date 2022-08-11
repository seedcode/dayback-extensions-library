// Horizon View Event Styles v1.0
// 
// Purpose:
// Set an Event's resizable box background style 
// to a CSS gradient or pattern based on specific 
// custom field value or calculation.
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

        // Seconds to wait to allow this action to run before reporting an 
        // error (set to 0 to deactivate). Leave this set to 0 to avoid 
        // unexpected behavior

        options.runTimeout = 0; 

        // Patterns & Rules:
        // -----------------
        //
        // Define an object of CSS class names, and either a custom filter 
        // function, or an object of key value pairs of event properties
        // that must match. 
        //      
        // Key Value Pair Example:
        // -----------------------
        //
        //    'custom_css_classname': {
        //        'schedule': 'Technology Projects',
        //        'status': 'Done',
        //        'customFieldName': 'Field value'
        //    }
        //
        // Custom Filter Function Example:
        // -------------------------------
        //
        // Given an array of all events, the filter function returns 
        // an array of filtered events that match specific criteria
        //
        //    'custom_css_classname': function(events) {
        //        return events.filter(event => {
        //            // Return all events in Construction calendar with 
        //            // Custom field 'customEventStyle' containing 
        //            // 'stripes_large'
        //            return event.schedule.name == 'Construction' &&
        //                   getCustomFieldValue(event, 'customEventStyle') == 'stripes_large'
        //        });
        //    }
        //
        // Example Configurations & Rules:
        // -------------------------------
        //
        // Below are examples of rules appling styles based on various
        // combinations of filter criteria including calendar names, statuses, 
        // and custom fields. 
        //
        // We provide several class names that demonstrate how to apply
        // diagonal stripes, chevron, diamond, and circle patterns to events
        // in Horizon view. In most cases the styles will honor the existing
        // event color, allowing you to use patterns in combinations with 
        // event status color. 
        //
        // You may use a website such as this one to create
        // custom styles: https://stripesgenerator.com/

        inputs.applicableStyles = {

            // Various strips

            'event_stripes_small': {
                'schedule': 'Installations',
                'status': 'Done'
            },
            'event_stripes_fade': {
                'schedule': 'Inspections'
            },
            'event_stripes_large': {
                'schedule': 'Construction',
                'customEventStyle': 'stripes_large',
            },

            // Chevron patterns

            'event_chevron_single_blue': {
                'schedule': 'Installations',
                'customEventStyle': 'chevron_single',
            },
            'event_chevron_double_blue': {
                'schedule': 'Construction',
                'customEventStyle': 'chevron_double',
            },

            // Diamonds and Circles

            'event_diamonds_blue': {
                'schedule': 'Installations',
                'customEventStyle': 'diamonds_blue',
            },
            'event_circles_blue': function(events) {

                // Example filter function:
                // ------------------------
                //
                // Filter for events in the 'Installations' calendar 
                // with custom field 'customEventStyle' containing 
                // value 'circles_blue'
                
                return events.filter(event => {
                    return event.schedule.name == 'Installations' &&
                            getCustomFieldValue(event, 'customEventStyle') == 'circles_blue'
                });
            }
        };

    //----------- Helper functions -------------------        

    // Retrieves a custom field by name instead of Store in Field ID

    function getCustomFieldValue(event, fieldName) {
        return event[dbk.getCustomFieldIdByName(fieldName, event.schedule)];
    }

    //----------- End Configuration -------------------        

}
catch(error) {
    reportError(error);
}


//----------- The action itself: you may not need to edit this. -------------------


// Action code goes inside this function
function run() {

    // Get current view and ensure action only applies to Horizon view
    var calendarView  = seedcodeCalendar.get('view');  
    if (!calendarView.name.includes('Horizon')) {
        return action.callbacks.confirm();
    }

    // Get a list of calendars, and all calendar events
    var events = seedcodeCalendar.get('element').fullCalendar('clientEvents');

    // Loop through all applicable Event styles and apply class if events match filter criteria
    Object.entries(inputs.applicableStyles).forEach(entry => {
        const [className, eventFilter] = entry;
        var eventList = [];

        if (typeof eventFilter == 'object') {

            const conditionCount = Object.keys(eventFilter).length;

            eventList = events.filter(event => {
   
                let matches = 0;                
                    
                for (const [key, value] of Object.entries(eventFilter)) {
                    
                    if (key == 'schedule' && event.schedule.name == value) {
                        matches++;
                    } else if (event[key] == value) {
                        matches++;
                    } else if (event.hasOwnProperty(key) && typeof event.key == 'array' && event[key].includes(value)) {
                        matches++;
                    } else if (!event.hasOwnProperty(key) && dbk.getCustomFieldIdByName(key, event.schedule) !== undefined && event.hasOwnProperty(dbk.getCustomFieldIdByName(key, event.schedule)) &&  event[dbk.getCustomFieldIdByName(key, event.schedule)] == value) {
                        matches++;
                    }
                }
  
                return matches == conditionCount ? true : false;
            });
            
        } else if (typeof eventFilter == 'function') {
            eventList = eventFilter(events);
        }

        if (eventList.length > -1) {
            for (let i = 0; i < eventList.length; i++) {
                let cell = document.querySelector('.fc-event[data-id="' + eventList[i]['_id'] + '"]');
                if (cell && !cell.classList.contains(className)) {
                    cell.classList.add(className);
                }
            }
        }
    });

    return action.callbacks.confirm();
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
