// Post Event to Slack v1.1

// Purpose:
// This button action will copy the details of an event and post
// them to a Slack Channel. You will need to modify the configuraiton
//
// Action Type: Buitton Action
// Open In New Window: Yes

// More info on custom App Actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// Declare globals
var options = {};
var inputs = {};

try {
    //----------- Configuration -------------------

    // Options specified for this action

    // Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)

    options.runTimeout = 8;

    // Array of account emails for whom this action will run. Leave blank to allow the action to run for everyone.
    // Example: ['person@domain.com', 'someone@domain.com']

    options.restrictedToAccounts = [];

    // Configure your API key

    inputs.apiUrl = 'YourSlackWebHookURL';

    //----------- End Configuration -------------------
} catch (error) {
    reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {

    var dateFormat;
    var allDay = "[[allDay]]";

    // Moment.js date and time formats - http://momentjs.com
    
    if (allDay === "true") {
        // Moment localized date format
        // Could be "MM/DD/YYY" for example "l" will auto detect date format
        dateFormat = "l";
    } else {
        // Moment localized date and time format
        // Could be "MM/DD/YYY h:m" for example "LLLL" will auto detect date format
        dateFormat = "LLLL"; 
    }

    // Create slack request

    var sendData = {
        "text": "This is a message from DayBack regarding: [[Summary]] on " + moment("[[DBk_TimestampStartCalcNum]]").format(dateFormat),
        "username": "DayBack",
        "icon_url": "http://bit.ly/dayback-slack-icon",
        // "icon_emoji": ":ghost:",        // Use an emoji instead of icon
        // "channel": "#other-channel",    // A public channel override
        // "channel": "@username",         // A Direct Message override
    };

    // Post the request
    // Your WebHook URL

    $.ajax(inputs.apiUrl, {
        type : "POST",
        data : JSON.stringify(sendData),
        success: function(data){
            dbk.showMessage("Message Sent: " + data);
        },
        failure: function(errMsg) {
            dbk.showMessage(errMsg);
        }
    }); 
}

//----------- Run function wrapper and helpers - you shouldn’t need to edit below this line. -------------------

// Variables used for helper functions below
var timeout;

// Execute the run function as defined above
try {
    if (
        !options.restrictedToAccounts ||
        !options.restrictedToAccounts.length ||
        (options.restrictedToAccounts &&
            options.restrictedToAccounts.indexOf(inputs.account) > -1)
    ) {
        if (action.preventDefault && options.runTimeout) {
            timeoutCheck();
        }
        run();
    } else if (action.preventDefault) {
        confirmCallback();
    }
} catch (error) {
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
    timeout = setTimeout(
        function () {
            var error = {
                name: "Timeout",
                message:
                    "The action was unable to execute within the allotted time and has been stopped"
            };
            reportError(error, true);
        },
        options && options.runTimeout ? options.runTimeout * 1000 : 0
    );
}

function cancelTimeoutCheck() {
    if (timeout) {
        clearTimeout(timeout);
    }
}

// Function to report any errors that occur when running this action
// Follows standard javascript error reporter format of an object with name and message properties
function reportError(error) {
    var errorTitle = "Error Running Custom Action";
    var errorMessage =
        '<p>There was a problem running the action "<span style="white-space: nowrap">' +
        action.name +
        '</span>"</p><p>Error: ' +
        error.message +
        ".</p><p>This may result in unexpected behavior of the calendar.</p>";
    if (action.preventDefault && timeout) {
        confirmCallback();
    } else {
        cancelCallback();
    }

    setTimeout(function () {
        utilities.showModal(
            errorTitle,
            errorMessage,
            null,
            null,
            "OK",
            null,
            null,
            null,
            true,
            null,
            true
        );
    }, 1000);
}
