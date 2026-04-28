// Create Tooltips v1.0
//
// Purpose:
// Creates formatted tooltips with advanced layouts.
// Multiple tooltips can be defined, with restriction rules
// that determine which tooltip should display under a
// which particular condition.
//
// Action Type: On Event Hover
// Prevent Default Action: No
//
// More info on custom actions here:
// https://docs.dayback.com/article/20-event-actions

// Declare globals

var options = {};
var inputs = {};

try {
    //----------- Configuration -------------------

    // Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
    // Leave this set to 0 to avoid unexpected behavior

    options.runTimeout = 0;

    /***************************************************************
     
        Define a list of applicable tooltip cards
        -----------------------------------------

        You may define multiple tooltip cards, and set a restriction 
        function that will show the card only for a given user
        or if certain information about the event is true.
        
        This is useful to show a tooltip only for certain statuses
        or when certain resources are scheduled.
        
        The function will scan the tooltips from top to bottom,
        and will only display the first applicable tooltip.
        
        Required Fields: 
        -------

        content:        A free-form value containing plain text/html
                        Text will be displayed in DayBack's default style.
                        If you'd like formatted rows, specify a rows 
                        parameters instead.

                        - or - 

        rows:           An array of row definitions (see row types below).

        Optional Fields:
        ----------------

        className:      Optional - You can have multiple tooltip styles. 
                        If you do not specify a style, this app action 
                        will use the style customToolTip.

        restriction:    Optional - javascript function that returns a
                        true if the event is in a given status.
                    
                        By default, a tooltip will display for all
                        events and users in a given source, but you
                        can call a custom function as in the example below
                        which shows the tooltip only if the event is in
                        Pending status. See restrictTooltipToStatus()
                        function for how to construct restriction checks

                        Examples:

                            restriction: function() { 
                                return restrictTooltipToStatus('Pending'); 
                            }

        tooltipOptions: Optional - an object containing configuration
                        parameters for the dbk.tooltip() function.

                        By default, the tooltip will show after 350 ms
                        has elapsed. To change this, you can specify a
                        custom delay for the tooltip function. See
                        the following link for more options:
                        https://docs.dayback.com/article/141-tooltips

                        // Delay tooltip display by 1 second
                        tooltipOptions: { delay: 1000; }

        Row Types and Parameters:
        -------------------------
    
        header:         Displays a tooltip header or title.
                        
            text:       Text of the tooltip.

            class:      optional class to apply a custom style.

        labelValue:     Displays two columns, with right-aligned labels
                        and left aligned values. Accepts an optional 3rd
                        parameter to define a custom style. The built in 
                        custom style 'textRight' can be used to align values 
                        to the right. This is useful when displaying numbers 
                        or currency.
            
            label:      The text of the label.

            value:      The text of the value, formatted as you would 
                        like it. For numbers and currency, you can 
                        use the built in formatCurrency() function 
                        takes an optional currency sign and a number:

                        formatCurrency('$', '1234.00')     // Returns $1,234.00

                        formatCurrency('', '1234.00')      // Returns 1,234.00

            class:      optional class to apply a custom style to the value
                        columns

            rowClass:   Optional class that determines if rows should display 
                        or bottom

            labelSize:  Specify a number 1-12 for column size. By default
                        both label and value are 6 columns each

            valueSize:  Specify a number 1-12 for column size. By default
                        both label and value are 6 columns each


        textRow:        Displays a full-width row:

            text:       The text can be anything, including custom HTML that
                        displays objects like maps and charts.

            class:      optional class to apply a custom style.

        progressBar:    Displays a progress bar indicator. 
                        Accepts three parameters:
                         
            title:      Text title of the data being reported.

            scale:      Maximum value that defines when the
                        item is 100% complete.
            
            value:      Current progress on a scale of 0 to 'scale'

        separator:      Shows a horizontal line between.
                        rows.

            class:      optional class to apply a custom style.

    ***************************************************************

    Referencing Custom Fields:
    
        It's common to display custom fields that you have mapped
        in your datasource. To deference a custom field by name
        rather than a numerical ID, you can call the getCustomFieldValue()
        function.

        Here's an example of showing a Label Value row for a custom field
        with Store in Field Name of "billingStatus":

            rows: {
                labelValue: { 
                    label: 'Billing Status',
                    value:  getCustomFieldValue('billingStatus')
                }
            }

        
    Special CSS Classes:

        You can add one or more of the following classes by separating them
        with a space to the class paramter for any row.

        textRight        
            Will align the cell contents to the right.

        showTooltipRowOnBottom 
            Will show the row only if the tooltip is displaying
            above the event popover.

        showTooltipRowOnTop
            Will show the row if the tooltip is displaying
            below the event popover.         

    Advanced Examples:

        We provide sample code for making a Pie Chart using Google Docs
        as well as adding clickable buttons. The buttons are combined
        with the showTooltipRowOnBottom and shoTooltipRowOnTop CSS
        classes which allow you to move the buttons closer to the mouse
        depending on where the tooltip is displayed. To call a custom
        function and display the result, use a standard textRow definition
        and set the text to the return value of the function:

        textRow: {
            text:   makePieChart(),
            class:  'myPieChartClass'
        }

        textRow: {
            text:   makeCustomButtons(),
            class:  'myPieChartClass'
        }

        If you are planning on using the Google Charts API to create
        custom data visualizations in your tooltips, you must first
        pre-load the Google Charts API javascript library by adding the
        following code to your Before Calendar Rendered app action:

            var script = document.createElement('script');  
            script.setAttribute('src','https://www.gstatic.com/charts/loader.js');
            document.head.appendChild(script);

        Happy tooltips!

    ***************************************************************/

    inputs.tooltips = {};

    //
    // EXAMPLES: We provide 4 examples. Please remove these 4 definitions
    //           when you are adding your own tooltips.

    // Define default tooltip. Show only if no reminder type selected

    inputs.tooltips.default = {
        restriction: function () {
            return getCustomFieldValue("reminderType") === undefined
                ? true
                : false;
        },
        content: "Status: " + event["status"]
    };

    // Define tooltip for Check-ins

    inputs.tooltips.checkin = {
        className: "customToolTip",
        restriction: function () {
            // Check that Custom field Reminder Type is set to "Check-in"
            const reminderType = getCustomFieldValue("reminderType");
            return Array.isArray(reminderType) &&
                reminderType.includes("Check-in")
                ? true
                : false;
        },
        tooltipOptions: { delay: 350 },
        rows: [
            {
                type: "header",
                text: "Account Profile"
            },
            {
                type: "textRow",
                text: makeCustomButtons(),
                class: "showTooltipRowOnBottom"
            },
            {
                type: "labelValue",
                label: "Licenses",
                value: formatCurrency("", "1260"),
                class: "textRight"
            },
            {
                type: "labelValue",
                label: "Annual Rev.",
                value: formatCurrency("$", "362260", 2),
                class: "textRight"
            },
            {
                type: "labelValue",
                label: "Current Budget",
                value: formatCurrency("$", "102260", 2),
                class: "textRight"
            },
            {
                type: "header",
                text: '<img src="https://seeklogo.com/images/J/jira-logo-C71F8C0324-seeklogo.com.png" style="margin-top: -5px; height: 15px; width: 15px; text-align:middle; vertical-align:middle"> JIRA: Priority Cases '
            },
            {
                type: "textRow",
                text: '&nbsp;&nbsp;<img src="https://seedcode.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10303?size=medium"> Resolve report issue'
            },
            {
                type: "textRow",
                text: '&nbsp;&nbsp;<img src="https://seedcode.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10311?size=medium"> Upgrade booking system'
            },
            {
                type: "header",
                text: "Allocation"
            },
            {
                type: "textRow",
                text: makePieChart()
            },
            {
                type: "textRow",
                text: makeCustomButtons(),
                class: "showTooltipRowOnTop"
            }
        ]
    };

    // Define tooltip for Check-ins

    inputs.tooltips.troubleshoot = {
        className: "customToolTip",
        restriction: function () {
            // Check that Custom field Reminder Type is set to "Troubleshoot"
            const reminderType = getCustomFieldValue("reminderType");
            return Array.isArray(reminderType) &&
                reminderType.includes("Troubleshoot")
                ? true
                : false;
        },
        tooltipOptions: { delay: 350 },
        rows: [
            {
                type: "header",
                text: "Job Profile"
            },
            {
                type: "textRow",
                text: "<B>Next Step:</B> Send project update"
            },
            {
                type: "separator"
            },
            {
                type: "labelValue",
                label: "Drone Preflight",
                value: "Passed",
                class: "textRight"
            },
            {
                type: "labelValue",
                label: "Job Type",
                value: "Damage Est.",
                class: "textRight"
            },
            {
                type: "labelValue",
                label: "Sq. Ft.",
                value: formatCurrency("", "1260"),
                class: "textRight"
            },
            {
                type: "labelValue",
                label: "Crane",
                value: "No",
                class: "textRight"
            },
            {
                type: "labelValue",
                label: "Scaffolds",
                value: "4",
                class: "textRight"
            },
            {
                type: "labelValue",
                label: "Drone Img",
                value: '<img src="https://.../test.jpg" width="100%">'
            },
            {
                type: "textRow",
                text: "Travel Estimate:"
            },
            {
                type: "textRow",
                text: '<iframe src="https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d43003.72501398774!2d-122.39341003869843!3d47.650758742401315!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e6!4m5!1s0x54903fd62b5e7f83%3A0x5c2caffa98e9cb76!2sPalisade%2C%20West%20Marina%20Place%2C%20Seattle%2C%20WA!3m2!1d47.6303784!2d-122.39158189999999!4m5!1s0x5490153369e60455%3A0xc88b970347732320!2sSeattle%20Remodelers%2C%205802%20Latona%20Ave%20NE%2C%20Seattle%2C%20WA%2098105!3m2!1d47.671028899999996!2d-122.3251993!5e0!3m2!1sen!2sus!4v1657063555295!5m2!1sen!2sus" width="100%" height="125" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>'
            }
        ]
    };

    // Define tooltip for Check-ins

    inputs.tooltips.estimate = {
        className: "customToolTip",
        restriction: function () {
            // Check that Custom field Reminder Type is set to "Estimate"
            const reminderType = getCustomFieldValue("reminderType");
            return Array.isArray(reminderType) &&
                reminderType.includes("Estimate")
                ? true
                : false;
        },
        tooltipOptions: { delay: 350 },
        rows: [
            {
                type: "header",
                text: "Sales Profile"
            },
            {
                type: "textRow",
                text: "<B>Next Step:</B> Email rollout plan"
            },
            {
                type: "separator"
            },
            {
                type: "labelValue",
                label: "Lead Status",
                value: "Won",
                class: "textRight"
            },
            {
                type: "labelValue",
                label: "Licenses #",
                value: "460",
                class: "textRight"
            },
            {
                type: "labelValue",
                label: "Recurring Rev",
                value: formatCurrency("$", "3680") + " / year",
                class: "textRight"
            },
            {
                type: "labelValue",
                label: "Project Budget",
                value: formatCurrency("$", "26400"),
                class: "textRight"
            },
            {
                type: "labelValue",
                label: "Realized",
                value: formatCurrency("$", "15325"),
                class: "textRight"
            },
            {
                type: "labelValue",
                label: "Acct Manager",
                value: '<img src="https://.../test.jpg" width="100%">'
            },
            {
                type: "header",
                text: "Project Status"
            },
            {
                type: "labelValue",
                label: "Current Status",
                value: "On Time",
                class: "textRight"
            },
            {
                type: "labelValue",
                label: "Phase",
                value: "Acceptance Testing",
                class: "textRight"
            },
            {
                type: "progressBar",
                title: "Project Progress",
                scale: 100,
                value: 80
            }
        ]
    };

    // Define tooltip for Zoom meetings. Display different content depending
    // on whether the tooltip is displayed above or below the event pill.

    inputs.tooltips.zoom = {
        className: "customToolTip",
        restriction: function () {
            // Check that Custom field Reminder Type is set to "Estimate"
            const reminderType = getCustomFieldValue("reminderType");
            return Array.isArray(reminderType) && reminderType.includes("Zoom")
                ? true
                : false;
        },
        tooltipOptions: { delay: 350 },
        rows: [
            // Show these rows if displaying above the Event

            {
                type: "header",
                text: "Zoom Meeting",
                class: "showTooltipRowOnBottom"
            },
            {
                type: "textRow",
                text: "Construction company interestest in analytics for crew allocation",
                class: "showTooltipRowOnBottom"
            },
            {
                type: "separator",
                class: "showTooltipRowOnBottom"
            },
            {
                type: "labelValue",
                label: "POC:",
                value: "Kevin O'Connor",
                class: "textRight",
                labelSize: 4,
                valueSize: 8,
                rowClass: "showTooltipRowOnBottom"
            },
            {
                type: "labelValue",
                label: "Phone",
                value: "(240) 440-0000",
                class: "textRight",
                labelSize: 4,
                valueSize: 8,
                rowClass: "showTooltipRowOnBottom"
            },
            {
                type: "textRow",
                text: '<center><button class="btn btn-sm btn-primary dbk_button_primary" style="width: 100%;"><span class="fa fa-circle-play"></span> Start Zoom</button>',
                class: "showTooltipRowOnBottom"
            },

            // Show these rows if displaying below the Event

            {
                type: "header",
                text: "Account Profile",
                class: "shiftUp showTooltipRowOnTop"
            },
            {
                type: "textRow",
                text: makeCustomButtons(),
                class: "showTooltipRowOnTop"
            },
            {
                type: "labelValue",
                label: "Licenses",
                value: formatCurrency("", "1260"),
                class: "textRight",
                rowClass: "showTooltipRowOnTop"
            },
            {
                type: "labelValue",
                label: "Annual Rev.",
                value: formatCurrency("$", "362260", 2),
                class: "textRight",
                rowClass: "showTooltipRowOnTop"
            },
            {
                type: "labelValue",
                label: "Current Budget",
                value: formatCurrency("$", "102260", 2),
                class: "textRight",
                rowClass: "showTooltipRowOnTop"
            }
        ]
    };

    //----------- Helper functions for retrieving and formatting fields ------------

    // Format a value in as a currency: $123.00

    function formatCurrency(currency, number, decimalPlaces = 0) {
        number =
            decimalPlaces > 0
                ? parseFloat(number).toFixed(decimalPlaces)
                : number;
        return (
            currency +
            number.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
        );
    }

    // Allows you retrieve a custom field by name instead of
    // Store in Field ID

    function getCustomFieldValue(fieldName) {
        return event[dbk.getCustomFieldIdByName(fieldName, event.schedule)];
    }

    //----------- Custom tooltip restriction checking functions ------------

    // All tooltips will have access to the event object
    // Default will show tooltip for all events in a given source

    function showTooltipForAllEvents() {
        return true;
    }

    // Show tooltip only if the event contains a
    // given status

    function restrictTooltipToStatus(status) {
        return event["status"].includes(status) ? true : false;
    }

    //----------- Custom Row Value Examples Functions for things like maps and charts ------------

    function makeCustomButtons() {
        // Example function of how to make buttons for opening external links
        return '<center> \
        <button class="btn btn-sm btn-primary dbk_button_primary" onClick="window.open(\'https://seedcode.atlassian.net/jira/software/c/projects/MT/boards/32\');">Open Cases</button> \
        <button class="btn btn-sm btn-secondary dbk_button_primary">Track Time</button> \
        </center>';
    }

    function makePieChart() {
        // If you are planning on using the Google Charts API to create
        // custom data visualizations in your tooltips, you must first
        // pre-load the Google Charts API javascript library by adding the
        // following code to your Before Calendar Rendered app action:
        //     var script = document.createElement('script');
        //     script.setAttribute('src','https://www.gstatic.com/charts/loader.js');
        //     document.head.appendChild(script);

        return '<script type="text/javascript"> \
        google.charts.load("current", {"packages":["corechart"]}); \
        google.charts.setOnLoadCallback(drawChart); \
        function drawChart() { \
            var data = google.visualization.arrayToDataTable([ \
            ["Task", "Hours per Day"], \
            ["Operations",  60], \
            ["Marketing",  30], \
            ["R & D",  20], \
            ]); \
            var options = { \
                pieHole: 0.3, \
                pieSliceTextStyle: { color: "white" }, \
                chartArea: {left:0,top:0,width:"100%",height:"100%"}, \
                legend: {position: "right", alignment: "center", textStyle: {color: "white", fontSize: 8} }, \
                backgroundColor: "transparent", width: "100%", height: "125px", color: "white" \
            }; \
            var chart = new google.visualization.PieChart(document.getElementById("chart")); \
            chart.draw(data, options); \
        } \
        </script> \
        <div id="chart" style="width: 100%; height: 125px; padding: 0px; padding-left: 5px; margin: 0px;"></div>';
    }

    //----------- End Configuration -------------------
} catch (error) {
    reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function

function run() {
    if (!inputs.tooltips || Object.keys(inputs.tooltips).length < -1) {
        return reportError("Please define at least one tooltip");
    }

    // Get first applicable tooltip
    var tooltip;

    for (const [name, obj] of Object.entries(inputs.tooltips)) {
        if (obj.hasOwnProperty("restriction")) {
            if (typeof obj.restriction === "function" && obj.restriction()) {
                tooltip = obj;
                break;
            }
        } else {
            tooltip = obj;
            break;
        }
    }

    // No applicable tooltip found, so confirm callback and return

    if (!tooltip) {
        return action.callbacks.confirm();
    }

    // Set default
    var className = tooltip.hasOwnProperty("className")
        ? tooltip.className
        : "customToolTip";
    var tooltipOptions = tooltip.hasOwnProperty("tooltipOptions")
        ? tooltip.tooltipOptions
        : { delay: 350 };

    tooltipOptions.className = className;

    // Define list of helper function for suppported row types

    var helpers = {
        header: helper_tooltiprow_header,
        textRow: helper_tooltiprow_textRow,
        contentRow: helper_tooltiprow_contentRow,
        labelValue: helper_tooltiprow_labelValue,
        progressBar: helper_tooltiprow_progressBar,
        separator: helper_tooltiprow_separator
    };

    // Start building content

    var content = '<div class="' + className + '">';

    if (tooltip.hasOwnProperty("rows")) {
        for (let r = 0; r < tooltip.rows.length; r++) {
            let row = tooltip.rows[r];
            if (helpers.hasOwnProperty(row.type)) {
                content = content + helpers[row.type](row);
            } else {
                return reportError("Unsuppored row type " + row.type);
            }
        }
    } else if (tooltip.hasOwnProperty("content")) {
        content =
            content + helper_tooltiprow_contentRow({ text: tooltip.content });
    }

    // Add closing tag for content

    content = content + "</div>";

    var openTooltip = dbk.tooltip(content, tooltipOptions);

    return action.callbacks.confirm();

    // -------- Helper Functions and Row Definitions --------

    // Tooltip Row Type functions

    function helper_tooltiprow_header(params) {
        setDefaultsToBlank(params, ["class", "text"]);
        return (
            '<div class="toolTipHeader ' +
            params["class"] +
            '">' +
            '<div class="">' +
            params["text"] +
            "</div>" +
            "</div>"
        );
    }

    function helper_tooltiprow_textRow(params) {
        setDefaultsToBlank(params, ["class", "text"]);
        return (
            '<div class="row toolTipTextRow ' +
            params["class"] +
            '">' +
            '<div class="col-xs-12">' +
            params["text"] +
            "</div>" +
            "</div>"
        );
    }

    function helper_tooltiprow_contentRow(params) {
        setDefaultsToBlank(params, ["class", "text"]);
        return (
            '<div class="row toolTipContentRow ' +
            params["class"] +
            '">' +
            '<div class="col-xs-12">' +
            params["text"] +
            "</div>" +
            "</div>"
        );
    }

    function helper_tooltiprow_labelValue(params) {
        setDefaultsToBlank(params, [
            "class",
            "label",
            "value",
            "labelSize",
            "valueSize",
            "rowClass"
        ]);
        params["labelSize"] = params["labelSize"] < 1 ? 6 : params["labelSize"];
        params["valueSize"] = params["valueSize"] < 1 ? 6 : params["valueSize"];

        return (
            '<div class="row toolTipRow ' +
            params["rowClass"] +
            '">' +
            '<div class="col-xs-' +
            params["labelSize"] +
            ' toolTipLabel">' +
            params["label"] +
            ":" +
            "</div>" +
            '<div class="col-xs-' +
            params["valueSize"] +
            " toolTipValue " +
            params["class"] +
            '">' +
            params["value"] +
            "</div>" +
            "</div>"
        );
    }

    function helper_tooltiprow_progressBar(params) {
        setDefaultsToBlank(params, ["class", "value", "scale"]);
        let percent = Math.floor(
            (params["value"] / Math.max(params["value"], params["scale"])) * 100
        );
        return (
            '<div class="row toolTipProgress">' +
            '<div class="col-xs-12"><div class="progressText">' +
            params["title"] +
            ':</div><div class="progress"> ' +
            '<div class="progress__bar" style="width: ' +
            percent +
            '% !important;"></div>' +
            "</div>" +
            "</div>" +
            "</div>"
        );
    }

    function helper_tooltiprow_separator(params) {
        setDefaultsToBlank(params, ["class"]);
        return (
            '<div class="row toolTipTextRow ' +
            params["class"] +
            '">' +
            '<div class="toolTipSeparator"></div>' +
            "</div>"
        );
    }

    // End Tooltip Row Definitions

    function setDefaultsToBlank(items, list) {
        for (const i of list) {
            items[i] = !items[i] ? "" : items[i];
        }
    }
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
    if (action.preventDefault && action.category !== event && timeout) {
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
