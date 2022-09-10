// Set Focus Date On View Change v1.1

// Purpose:
// Changes DayBack's focus date to the day of the
// week, month or quarter you specify after a specified 
// view is changed. Using the Previous / Next buttons will
// set the view according to the width of your date range
// and your configured settings

// Action Type: After Events Rendered
// Prevent Default Action: Yes

// More info on After Events Rendered Custom App Actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// Declare globals

var options = {}; var inputs = {};

try {

    //----------- Configuration -------------------

        // Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)

        options.runTimeout = 0; 

        // Format the configuration as follows:
        // ------------------------------------
        //
        //    inputs.views = {
        //        viewName: {
        //            timeInterval: 'day',  // Define as: 'day', 'month', or 'quarter'
        //            startOnDayOfWeek: 1   // 1 = Monday
        //            ... 
        //        },
        //        viewName: {
        //            ...
        //        }    
        //    }
        //
        // Configuration options for each view:
        // ------------------------------------
        //
        // viewName: {  ... list of views ... }             //  (required)
        //
        //      Configurations can apply to the following View Names:
        //
        //      basicResourceDays   -- Resource "Daily" View with Snap To Month Disabled
        //      agendaResourceVert  -- Resource "Schedule" View with times down the left side
        //      basicResourceVert   -- Resource "List" View with days across the top
        //      basicResourceHor    -- Resource "Pivot List" View with times across the top
        //      basicHorizon        -- Horizon View (Gantt Chart) - all types
        //
        // timeInterval:        'day', 'month', 'quarter'   // required
        //
        //      Specifies if the focus date should be in relation to the view's
        //      current day, month, or quarter.
        //
        // startOnDayOfWeek:    0-6                         // optional
        //      
        //      Defines which day of the Current Week a view should start on.
        //      Set to 0 for Sunday, 1 for Monday.
        //      
        // startOnDayOfMonth:   1-31                        // optional
        //
        //      A Month focus date will start on the 1st of the month. You may
        //      specifying a number from 1-31 to start on a different day.
        //
        // startOnDayOfQuarter: 1-93                        // optional
        //
        //      A Quarter focus date will start on the 1st day of the quarter.
        //      You may specify a number from 1-93 to start on a different day.
        //
        // Combinations:
        // -------------
        //
        //      You can combine startOnDayOfWeek with startOnDayOfMonth or 
        //      startOnDayOfQuarter. For example, to start the calendar on the 1st 
        //      Monday on the week after the 15th of the month set this as follows:
        //
        //      startOnDayOfMonth: 15,
        //      startOnDayOfWeek: 1

        inputs.views = {
            basicResourceDays: {
                timeInterval: 'day',
                startOnDayOfWeek: 1
            },
            agendaResourceVert: {
                timeInterval: 'day',
                startOnDayOfWeek: 1
            },
            basicResourceVert: {
                timeInterval: 'day',
                startOnDayOfWeek: 1
            },
            basicResourceHor: {
                timeInterval: 'month',
                startOnDayOfMonth: 1
            },
            basicHorizon: {
                timeInterval: 'quarter',
                startOnDayOfQuarter: 1,
            }        
        };  

    //----------- End Configuration -------------------

}
catch(error) {
    reportError(error);
}


//----------- The action itself: you may not need to edit this. -------------------


// Action code goes inside this function

function run() {

    // Ensure we only run fromViewStateChange event
    if (!(!params.data.fromRefresh && !params.data.fromFilterChange && !params.data.fromScheduleChange && params.data.fromViewStateChange)) {
        return confirmCallback();
    }

    // Get current view
    var view = seedcodeCalendar.get('view');

    // Validate configuration 
    validateConfiguration(continueAction);
    
    function continueAction() {
        
        if (inputs.views.hasOwnProperty(view.name)) {

            var viewConfig          = inputs.views[view.name];
            var startDate           = view.start;
            var startDateFormatted  = moment(startDate).format('YYYY-MM-DD');
        
            if (viewConfig.timeInterval == 'day' && viewConfig.startOnDayOfWeek >= 0 && viewConfig.startOnDayOfWeek <= 6) {
                // Ignore Basic Resource Days view in Snap to Month mode
                if (view.name == 'basicResourceDays' && view.calendar.options.snapToMonth == true) {
                    return confirmCallback(); 
                }
                
                var dateAdjusted = adjustDateToDayOfWeek(startDateFormatted, viewConfig.startOnDayOfWeek);
                        
                // Ignore if current date is target date
                if (startDateFormatted != dateAdjusted) {
                    goToDate(dateAdjusted, startDateFormatted);
                }
              
            } 
            else if (viewConfig.timeInterval == 'month') {
                var dateAdjusted = moment(startDate).startOf('month').format('YYYY-MM-DD');
                var dayDiff      = moment(startDate).diff(moment(dateAdjusted), 'days');

                // If our skip day size is >= 30 days, add a month
                if (dayDiff >= 30) {
                    dateAdjusted = moment(dateAdjusted).add(1, 'months').format('YYYY-MM-DD');
                }
                
                // Start on different Day of the Month if specified
                // Adjust to specific Day of Week, otherwise keep 1st of the month
                // Ignore if current date is target date

                if (viewConfig.hasOwnProperty('startOnDayOfMonth')) {
                    dateAdjusted = moment(dateAdjusted).add(viewConfig.startOnDayOfMonth - 1, 'days').format('YYYY-MM-DD');
                
                    if (viewConfig.hasOwnProperty('startOnDayOfWeek')) {
                        var dayAdjusted = adjustDateToDayOfWeek(dateAdjusted, viewConfig.startOnDayOfWeek, false);                        
                        // If day of current week starts before Day of Month, adjust into next week
                        dateAdjusted = moment(dayAdjusted).date() < moment(dateAdjusted).date() ? adjustDateToDayOfWeek(moment(dateAdjusted).add(7, 'days'), viewConfig.startOnDayOfWeek, false) : dayAdjusted;
                    }
                } 
                else if (viewConfig.hasOwnProperty('startOnDayOfWeek')) {
                    dateAdjusted = adjustDateToDayOfWeek(dateAdjusted, viewConfig.startOnDayOfWeek, false);
                }
    
                if (startDateFormatted != dateAdjusted) {
                    goToDate(dateAdjusted, startDateFormatted);
                }
            }
            else if (viewConfig.timeInterval == 'quarter') {
                var dateAdjusted = moment(startDate).clone().startOf('quarter').format('YYYY-MM-DD');
                var dayDiff      = moment(startDate).diff(moment(dateAdjusted), 'days');
                var viewDays     = moment(view.end).diff(moment(view.start), 'days');

                // If we are skipping full view length, we need to adjust the quarter forward. This prevents a reset to current quarter 
                // Becuase >90 day views start on weeks of quarter, we need to add a quarter only if we are skipping more than 1 month

                if (dayDiff == viewDays && viewDays <= 90) {
                    dateAdjusted = moment(startDate).clone().startOf('quarter').add(1, 'quarter').format('YYYY-MM-DD');
                } 
                else if (viewDays > 90 && dayDiff > 31) {
                    dateAdjusted = moment(startDate).clone().startOf('quarter').add(1, 'quarter').format('YYYY-MM-DD');
                }

                // Start on different Day of the Quarter or Month if specified
                // Adjust to specific Day of Week, otherwise keep 1st of the month
                // Ignore if current date is target date

                if (viewConfig.hasOwnProperty('startOnDayOfQuarter')) {
                    if (viewDays > 90) {
                        dateAdjusted = moment(dateAdjusted).startOf('week').format('YYYY-MM-DD');
                    } 
                    else {
                        dateAdjusted = moment(dateAdjusted).add(viewConfig.startOnDayOfQuarter - 1, 'days').format('YYYY-MM-DD');    
                    }
                }
                
                if (viewConfig.hasOwnProperty('startOnDayOfMonth')) {
                    dateAdjusted = moment(dateAdjusted).add(viewConfig.startOnDayOfMonth - 1, 'days').format('YYYY-MM-DD');
                }

                if (viewConfig.hasOwnProperty('startOnDayOfWeek')) {
                    if (viewConfig.hasOwnProperty('startOnDayOfQuarter') || viewConfig.hasOwnProperty('startOnDayOfMonth')) {
                        var dayAdjusted = adjustDateToDayOfWeek(dateAdjusted, viewConfig.startOnDayOfWeek, false);                        
                        // If day of current week starts before Day of Quarter or Day of Month, adjust into next week
                        dateAdjusted = moment(dayAdjusted).date() < moment(dateAdjusted).date() ? adjustDateToDayOfWeek(moment(dateAdjusted).add(7, 'days'), viewConfig.startOnDayOfWeek, false) : dayAdjusted;
                    } 
                    else {
                        dateAdjusted = adjustDateToDayOfWeek(dateAdjusted, viewConfig.startOnDayOfWeek, false);
                    }
                }
    
                if (startDateFormatted != dateAdjusted) {
                    goToDate(dateAdjusted, startDateFormatted);            
                }
            }
        }
    }

    //----------- Action-specific functions -------------------
    
    // Configuration validation helper function

    function validateConfiguration(callback) {
        // Define valid list of views for this action
        var permittedViews     = [ 'basicResourceDays', 'agendaResourceVert', 'basicResourceVert', 'basicResourceHor', 'basicHorizon' ];
        var permittedParams    = [ 'timeInterval', 'startOnDayOfWeek', 'startOnDayOfMonth', 'startOnDayOfQuarter' ];
        var permittedIntervals = [ 'day','month','quarter' ];

        // Make sure we have defined a list of resources
        if (!inputs.views || typeof inputs.views !== 'object' || Object.keys(inputs.views).length < 1) {
            return reportConfigError('Please configure a list of views', confirmCallback);
        }

        for (const [viewName, viewObj] of Object.entries(inputs.views)) {
            if (!permittedViews.includes(viewName)) {
                return reportConfigError("The view '" + viewName + "' is not a valid view for this action" , confirmCallback);
            }
        }

        // Verify time intervals for each view are valid
        for (const [viewName, viewObj] of Object.entries(inputs.views)) {
            for (const [paramName, paramVal] of Object.entries(inputs.views[viewName])) {
                if (!permittedParams.includes(paramName)) {
                    return reportConfigError("The view parameter '" + paramName + "' is not a valid parameter" , confirmCallback);
                }
            }

            if (!permittedIntervals.includes(viewObj.timeInterval)) {
                return reportConfigError("Please specify a valid time interval and day of week for " + viewName + " view", confirmCallback);
            }

            if (viewObj.hasOwnProperty('startOnDayOfQuarter') && (viewObj.startOnDayOfQuarter < 1 || viewObj.startOnDayOfQuarter > 93)) {
                return reportConfigError("Please specify a valid startOnDayOfQuarter for " + viewName + " view", confirmCallback);
            }

            if (viewObj.hasOwnProperty('startOnDayOfMonth') && (viewObj.startOnDayOfMonth < 1 || viewObj.startOnDayOfMonth > 31)) {
                return reportConfigError("Please specify a valid startOnDayOfMonth for " + viewName + " view", confirmCallback);
            }

            if (viewObj.hasOwnProperty('startOnDayOfWeek') && (viewObj.startOnDayOfWeek < 0 || viewObj.startOnDayOfWeek > 6)) {
                return reportConfigError("Please specify a valid startOnDayOfWeek for " + viewName + " view", confirmCallback);
            }
        }
        
        // config is valid
        return callback();
    }

    // Report Config Error function
    
    function reportConfigError(error, confirmCallback) {
        utilities.showModal(
            'Error Running Custom Action', 
            '<p>There was a problem running the action "<span style="white-space: nowrap">' + action.name + '</span>"</p><p>Error: ' + error + '.</p><p>This may result in unexpected behavior of the calendar.</p>',
            null, null, 'OK', confirmCallback, null, null, true, null, true
        );
    }  

    // Managed view change
    
    function goToDate(viewDate, calledFrom) {
        cancelCallback();
        if (location.hash == '#/') {
            location.hash += '?date=' + viewDate;
        } 
        else {
            location.hash += '&date=' + viewDate;
        }
    }

    // Takes date and adjusts to day of week number 1 - 7)
    
    function adjustDateToDayOfWeek(startDate, dayOfWeek, allowNegativeAdjustments = true) {
        var day = moment(startDate);
        var dayDiff = dayOfWeek - day.day();
        
        // For certian views, project negative time shifts forward, if shift matches Resource days 
        // (i.e., user clicked forward button)

        if (( view.name == 'basicResourceHor'   ||
              view.name == 'agendaResourceVert' ||
              view.name == 'basicResourceVert'  ||
             (view.name == 'basicResourceDays' && view.calendar.options.snapToMonth == false)
            ) && view.calendar.options.resourceDays <= Math.abs(dayDiff)) {
                dayDiff = 7 - moment(startDate).day() + 1; 
        } 
        else if (allowNegativeAdjustments == false && dayDiff < 0 && day.date() === 1)  {
            // Prevent negative time adjustments, and project target date into next week if today's date is first of the month
            dayDiff += 7;
        }

        return day.add(dayDiff,'days').format('YYYY-MM-DD');        
    }
    
    //----------- End Action-specific functions -------------------
    
    confirmCallback();
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