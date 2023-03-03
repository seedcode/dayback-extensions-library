// Event Percent Complete v1.0
// 
// Purpose:
// Set Event Color in Horizon View to reflect a percentage
// of task completion based on a custom calculation
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

        // Percentage Calculation: 
        // -----------------------
        //
        // This action will color each event's resizable box based on the
        // existing color, but apply an opacity of 10% to the percentage of
        // the event that is incomplete. Please note that this app action only
        // applies to events in any of the Horizon views. 
        //
        // You may specify more than one calculation in this app action.
        // Each calculation should be added to the eventProgressCalculations 
        // array and must contain the following:
        //
        //      eventFilter:       A function that accepts an array of
        //                         event objects, and return a list of
        //                         events that match certain criteria.
        //                         
        //      percentComplete:   A function that accepts a single event
        //                         and uses custom fields in the event to
        //                         calculate a number from 0 to 100+.
        //                         This number will be used to display
        //                         a horizontal indication of the total
        //                         percent of completion.
        //                         
        //      overageColor:      A color name, #hex code, or rgb() color
        //                         to apply to the event's resizable box
        //                         if the percentage of completion is over
        //                         100%. This field is optional, so if an
        //                         event is over 100% and you do not
        //                         specify an overage Color, the default
        //                         fill color will apply.
        //
        //  overageContentClass:   An optional class to apply to the gray
        //                         border around the text description of 
        //                         the event if the event's calculation is
        //                         over 100%. If you do not specify this
        //                         parameter, the default border color will
        //                         apply.
 
        inputs.eventProgressCalculations = [
            {
                'eventFilter': function(events) {

                    // Function accepts an array of events and returns an filtered array of
                    // events if the result of a calculation is true. In this example
                    // the filter will apply to all events belonging to Project Management
                    // calendar. You may also check for status, or the existence of
                    // certain values in a custom field.

                    return events.filter(event => {
                            return event.schedule.name == 'Project Management';
                    });
                },
                'percentComplete': function(event) {
                    
                    // Function accepts a single event and returns an integer from
                    // 0 to 100 or more indicating a percentage of completion based
                    // on a custom calculation. In this example we retrieve two
                    // custom fields named "Elapsed" and "Estimate" and determine
                    // how many hours have been booked on a project versus the 
                    // estimated number of hours. 

                    let Elapsed  = event[dbk.getCustomFieldIdByName('Elapsed',  event.schedule)];
                    let Estimate = event[dbk.getCustomFieldIdByName('Estimate', event.schedule)];

                    // Ensure to check that the denominator is not zero so as to
                    // avoid a divide by zero error. Round result to a whole integer                    

                    return Elapsed <= 0 ? 0 : Math.round((Elapsed / Estimate) * 100);
                },
                
                // Optionally color the event red if we are over 100% 
                'overageColor': 'red',  

                // Optionally apply a style to the event container if we are over 100%
                'overageContentClass': 'event_percent_overage_nub_content'
            },          
        ];

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

    // Loop through all percentage calculation filters and apply style based on
    // return value of percent complete calculation. Percentages over 100
    // will have an overage color and style applied.

    inputs.eventProgressCalculations.forEach(filter => {

        var eventList = filter.eventFilter(events);
        if (eventList.length > -1) {
            for (let i = 0; i < eventList.length; i++) {
                let cell = document.querySelector('.fc-event[data-id="' + eventList[i]['_id'] + '"]');
                if (cell) {
                    // Calculate percent complete
                    let percentComplete = filter.percentComplete(eventList[i]);

                    // Extract current RGB color
                    let rgb = cell.style.backgroundColor.match(/[.?\d]+/g);

                    if (percentComplete > 100) { 

                        // Assign overage color if one was specified
                        if (filter.overageColor) {
                            cell.style.backgroundColor = filter.overageColor;
                        }

                        // Assign a nub content border style if one was specified
                        if (filter.overageContentClass) {
                            const nub = document.querySelector('[data-id="' + eventList[i]['_id'] + '"]>div.nub-content');
                            if (nub) {
                                nub.classList.add(filter.overageContentClass);
                            }
                        }

                    } else if (rgb) {
                        cell.style.background = 'linear-gradient(90deg,rgba(' + rgb[0] +',' + rgb[1] + ',' + rgb[2] + ',1) ' + percentComplete + '%, rgba(' + rgb[0] +',' + rgb[1] + ',' + rgb[2] + ',0.1) ' + percentComplete + '%)';
                    }
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
