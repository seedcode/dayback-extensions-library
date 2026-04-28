// Custom Popover Panel v1.0 - Part 1
//
// Purpose:
// This app action allows you to build structured popover side
// panels based on a custom set of row definitions.
//
// Action Type: On Event Click
// Prevent Default Action: No
//
// More info on custom actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// Declare globals

var options = {};
var inputs = {};

try {
    //----------- Configuration -------------------

    // Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
    // Leave this set to 0 to avoid unexpected behavior

    options.runTimeout = 0;

    /***************************************************************
         
            Creating Panel Layouts:
            -----------------------

            You may have 1) a single custom panel layout that displays for 
            all events or 2) you may specify multiple panel layouts and define 
            restriction rules that will show a given layout only under certain
            circumstances.
                       
            The app action will scan your panel definitions from top to bottom
            and will display the first applicable panel, ignoring the rest.

            To define a single panel you can simply define a default panel 
            with no restriction function. Panels can either be fully custom 
            HTML, or can be defined as a list of rows and columns.

            Example 1: 

                // Unstructured content. You define your own HTML.

                inputs.panels.default = {
                    content: 'Your custom text or HTML that you build yourself
                };

            Example 2: 

                // Structured content. You must follow the configuration
                // options defined below.

                inputs.panels.default = {
                    rows: [
                        { ... },     
                        { ... },    
                        { ... },    
                    ] 
                };
            
            Panel Names:
            ------------

            Panel names can be arbitrary and have no special meaning. We recommend 
            defining a 'default' panel and then naming your panels in a way that 
            is meaningful to you:

                input.panels.default = { ... };

                input.panels.accountInfo = { ... };

                input.panels.projectManagement = { ... };

            Required Fields: 
            ----------------

            Each panel must contain at minimum a content parameter or a rows 
            object:

            content:        A free-form value containing plain text/html
                            Text will be displayed in DayBack's default style.
                            If you'd like formatted rows, specify a rows 
                            parameters instead.

                            - or - 

            rows:           An array of row definitions (see row types below).

            Option Fields:
            --------------

            className:      Optional - You can have multiple panel styles. 
                            If you do not specify a style, this app action 
                            will use the style customPopoverPanelDrawer.

            restriction:    Optional - javascript function that returns a
                            true if the event is in a given status.
                        
                            By default, a panel will display for all
                            events and users in a given source, but you
                            can define a set of custom rules that restrict
                            the panel to a specific set of criteria. Rules
                            can be specified as an object containing a list
                            of criteria, or as a function that must return
                            true if all conditions match:

                            Example 1:

                                // Restricts tooltip to Pending events
                                // in Technology calendar with custom
                                // field Project Type set to "Bug Fix"

                                restriction: { 
                                    status: 'Pending',
                                    schedule: 'Technology',
                                    projectType: 'Bug Fix'
                                }                    
                                
                            Example 2:

                                // Example uses a function to restrict to
                                // two statuses: Pending, or In Progress

                                restriction: function() { 
                                    return restrictToStatus('Pending') || restrictToStatus('In Progress'); 
                                }

            Row Types and Parameters:
            -------------------------

            header:         Displays a panel title header.
                            
                text:       Text of the panel.

                class:      Optional class to apply a custom style.

            labelValue:     Displays two columns with right-aligned labels
                            and left aligned values. Accepts an optional 3rd
                            parameter to define a custom style. The built in 
                            custom style 'textRight' can be used to align values 
                            to the right. This is useful when displaying numbers 
                            or currency.
                
                label:      The text of the label.

                value:      The text of the value formatted as you would 
                            like it. For numbers and currency, you can 
                            use the built in formatCurrency() function 
                            takes an optional currency sign and a number:

                            formatCurrency('$', '1234.00')     // Returns $1,234.00

                            formatCurrency('', '1234.00')      // Returns 1,234.00

                class:      Optional class to apply a custom style to the value
                            columns

                labelSize:  Specify a number 1-12 for column size. By default
                            both label and value are 6 columns each

                valueSize:  Specify a number 1-12 for column size. By default
                            both label and value are 6 columns each


            textRow:        Displays a full-width row:

                text:       The text can be anything, including custom HTML that
                            displays objects like maps and charts.

                class:      Optional class to apply a custom style.

            progressBar:    Displays a progress bar indicating
                            Accepts three parameters:
                                
                title:      Text title of the data being reported.

                scale:      Maximum value that defines when the
                            item is 100% complete.
                
                value:      Current progress on a scale of 0 to 'scale'

            separator:      Shows a horizontal line between.
                            rows.

                class:      optional class to apply a custom style.

        Referencing Custom Fields:
        --------------------------

        It's common to display custom fields that you have mapped
        in your datasource. To deference a custom field by name rather
        than a numerical ID, you can call the getCustomFieldValue()
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
        --------------------

        You can add our custom utility class to any class list:
            
            textRight        
                Will align the cell contents to the right.

        Conditional Rows:
        -----------------

        You can show / hide specific rows within a single panel by adding a
        restriction check to any row. A row will show if you have not specified 
        a restriction check. If you specify a restriction, your function must 
        return true if the row is to be displayed, and false if it is to be 
        hidden.

        Below is an example of how to use restricton functions. In this example
        we will display the project start time if the project Status has been
        marked as started. We will display an Invoice Number if the project is
        in Invoicing or Complete status, and we will display a Paid Date
        if the project was marked Complete:

            inputs.panels.projectInfo = {
                rows: [
                    {
                        type: "header",
                        text: "Project Info"
                    },
                    {
                        type: "labelValue",
                        label: "Started Time",
                        value: getCustomFieldValue('customFieldEventStartTime'),
                        restriction: {
                            status: 'Started'
                        }
                    },
                    {
                        type: "labelValue",
                        label: "Invoice Number:",
                        value: getCustomFieldValue('customFieldEventStartTime'),
                        restriction: function() { 
                            return restrictToStatus('Invoicing') || restrictToStatus('Complete'); 
                        }
                    },
                    {
                        type: "labelValue",
                        label: "Paid Date",
                        value: getCustomFieldValue('customFieldBillingStatus'),
                        restriction: function() { 
                            return restrictToStatus('Complete'); 
                        }
                    }
                ]
            };

        Advanced Row Types:
        -------------------

        We provide sample code for making a Pie Chart using Google Docs
        as well as adding clickable buttons. To call a custom function and 
        display the result, use a standard textRow definition and set the 
        text to the return value of the function:

            textRow: {
                text:   makePieChart(),
                class:  'myPieChartClass'
            }

            textRow: {
                text:   makeCustomButtons()
            }

        Changing Custom Fields:
        -----------------------

        We have also provided an example of how to create a Select Box
        from a Custom Field. The function will automatically populate your
        Select box with options from your custom picklist field mapping.
        
        You can then specify a function that should run when the checkbox
        is chagned. The function can update the editEvent object, and also
        run any extra code that should fire when the select box is changed.
        
            {
                type: "labelValue",
                label: "Phase",
                value: makeSelectBoxFromCustomField({
                    customFieldName: 'projectPhase',
                    onChange: function (value) {
                        
                        // Update the event's custom field value
                        // after the select box has changed. This is
                        // a great place to add any permission checks,
                        // or also trigger other changes when values
                        // change from one to another

                        setCustomFieldValue("projectPhase", value);
                    }
                }),

                // Make the label column 'Phase' 4 units wide
                // And the select box 8 units wide

                labelSize: 4,
                valueSize: 8
            },           

        Google Charts:
        --------------

        If you are planning on using the Google Charts API to create
        custom data visualizations in your panels, you must first
        pre-load the Google Charts API javascript library by adding the
        following code to your Before Calendar Rendered app action:

            var script = document.createElement('script');  
            script.setAttribute('src','https://www.gstatic.com/charts/loader.js');
            document.head.appendChild(script);

        Post Render Functions:
        ----------------------

        If you need to run custom code after a panel has been rendered,
        such as our example of showing a Google Chart, you can register
        a custom funciton that will run after the panel content has been
        rendered. There is no return value for the post render function

            postRenderFunction: function() { .. }
            
        Happy panels!

    ***************************************************************/

    // Wrap your panel definitions inside the definePanels() function
    // Panels must be defined in a function that is ran each time a panel is
    // redrawn. This ensures that all field value data is updated if an
    // an event is modified outside of the panel and then accessed inside of
    // a panel again.

    inputs.definePanels = function () {
        // Define a panels object

        inputs.panels = {};

        // Define panel for Projects

        inputs.panels.project = {
            className: "customPopoverPanelDrawer",
            autoOpen: true,
            restriction: function () {
                // Check that Custom field Panel Type is set to "Project"
                const panelType = getCustomFieldValue("panelType");
                return (
                    editEvent.schedule.name == "Clinic Schedule" ||
                    (Array.isArray(panelType) &&
                        panelType.includes("Project")
                        ? true
                        : false)
                );
            },
            rows: [
                {
                    type: "header",
                    text: "Project Profile"
                },
                {
                    type: "textRow",
                    text:
                        '<B>Next Step:</B> <span id="nextStepValue">' +
                        getCustomFieldValue("nextStep") +
                        "</span>"
                },
                {
                    type: "separator"
                },
                {
                    type: "labelValue",
                    label: "Recurring Rev",
                    value: formatCurrency("$", getCustomFieldValue("recurringRev")) + " / year",
                    class: "textRight"
                },
                {
                    type: "labelValue",
                    label: "Project Budget",
                    value: formatCurrency("$", getCustomFieldValue("projectBudget")),
                    class: "textRight"
                },
                {
                    type: "labelValue",
                    label: "Realized",
                    value: formatCurrency("$", getCustomFieldValue("realizedRev")),
                    class: "textRight"
                },
                {
                    type: "labelValue",
                    label: "Acct Manager",
                    value: '<img src="https://ca.slack-edge.com/T03STQ9FY-U022AK47TK6-281a3babb685-512" width="100%">'
                },
                {
                    type: "header",
                    text: "Project Status"
                },
                {
                    type: "labelValue",
                    label: "Timeline",
                    value: makeSelectBoxFromCustomField({
                        customFieldName: "projectTimeline",
                        onChange: function (value) {
                            setCustomFieldValue("projectTimeline", value);
                        }
                    }),
                    labelSize: 4,
                    valueSize: 8
                },
                {
                    type: "labelValue",
                    label: "Phase",
                    value: makeSelectBoxFromCustomField({
                        customFieldName: "projectPhase",
                        onChange: function (value) {
                            setCustomFieldValue("projectPhase", value);
                        }
                    }),
                    labelSize: 4,
                    valueSize: 8
                },
                {
                    type: "separator"
                },
                {
                    type: "progressBar",
                    name: "projectTimeline",
                    title: "Project Progress",
                    scale: getCustomFieldValue("Estimate"),
                    value: getCustomFieldValue("Elapsed")
                },
                {
                    type: "progressBar",
                    name: "projectBudget",
                    title: "Budget",
                    scale: getCustomFieldValue("projectBudget"),
                    value: getCustomFieldValue("realizedRev")
                }
            ],
            postRenderFunction: function () {
                // Reset progress bar color based on current Project Timeline value
                var progress = document.querySelector(".progress__bar.projectTimeline");

                if (progress && getCustomFieldValue("projectTimeline") == "Delayed") {
                    progress.classList.add("delayed");
                } else {
                    progress.classList.remove("delayed");
                }
            }
        };

        function makeSelectBoxFromCustomField(config) {
            // Add a hook to populate
            inputs.postRenderHooks.push(function () {
                var selectBox = document.getElementById(config.customFieldName);

                if (!selectBox) {
                    return;
                }

                var customFieldId = dbk.getCustomFieldIdByName(
                    config.customFieldName,
                    editEvent.schedule
                );
                var customFieldValue = editEvent[customFieldId];

                if (typeof config.onChange === "function") {
                    selectBox.onchange = function () {
                        config.onChange(selectBox.value);
                    };
                }

                // Get custom field picklist definition and generation select box options
                // select the currently selected option
                if (customFieldId) {
                    var list = editEvent["customFields"][customFieldId].list;
                    if (list) {
                        list = list.split(",");
                        for (var i = 0; i < list.length; ++i) {
                            var selected =
                                customFieldValue == list[i] ? true : false;
                            selectBox[selectBox.length] = new Option(
                                list[i],
                                list[i],
                                false,
                                selected
                            );
                        }
                    }
                }
            });

            return (
                '<div class="select-wrapper"><select id="' +
                config.customFieldName +
                '"></select></div>'
            );
        }

        // Define panel for Check-ins

        inputs.panels.accountProfile = {
            className: "customPopoverPanelDrawer",
            autoOpen: false,
            restriction: {
                panelType: "Check-in"
            },
            rows: [
                {
                    type: "header",
                    text: "Account Profile"
                },
                {
                    type: "labelValue",
                    label: "Licenses",
                    value: formatCurrency("", getCustomFieldValue("licenseCount")),
                    class: "textRight"
                },
                {
                    type: "labelValue",
                    label: "Annual Rev.",
                    value: formatCurrency("$", getCustomFieldValue("annualRevenue"), 2),
                    class: "textRight"
                },
                {
                    type: "labelValue",
                    label: "Budget",
                    value: formatCurrency("$", getCustomFieldValue("annualBudget"), 2),
                    class: "textRight"
                },
                {
                    type: "labelValue",
                    label: "Estimated",
                    value: formatCurrency("", getCustomFieldValue("estimatedHours"), 2) + " hrs",
                    class: "textRight",
                    restriction: { status: "In Progress" }
                },
                {
                    type: "labelValue",
                    label: "Scheduled",
                    value: formatCurrency("", getCustomFieldValue("scheduledHours"), 2) + " hrs",
                    class: "textRight"
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
                    text: makeCustomButtons()
                },
                {
                    type: "header",
                    text: '<img src="https://seeklogo.com/images/J/jira-logo-C71F8C0324-seeklogo.com.png" style="margin-top: -5px; height: 15px; width: 15px; text-align:middle; vertical-align:middle"> JIRA: Priority Cases '
                },
                {
                    type: "textRow",
                    text: '<nobr><img src="https://seedcode.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10303?size=medium"> Resolve report issue</nobr>',
                    class: "cursorOn"
                },
                {
                    type: "textRow",
                    text: '<nobr><img src="https://seedcode.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10311?size=medium"> Upgrade booking system</nobr>'
                },
                {
                    type: "textRow",
                    text: '<nobr><img src="https://seedcode.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10318?size=medium"> Marketing platform design</nobr>'
                },
                {
                    type: "textRow",
                    text: '<nobr><img src="https://seedcode.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10318?size=medium"> Call center efficiency</nobr>'
                },
                {
                    type: "textRow",
                    text: '<nobr><img src="https://seedcode.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10311?size=medium"> Warehouse barcode systems</nobr>'
                },
                {
                    type: "textRow",
                    text: '<nobr><img src="https://seedcode.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10311?size=medium"> PDF web publishing</nobr>'
                },
                {
                    type: "textRow",
                    text: '<nobr><img src="https://seedcode.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10311?size=medium"> API 2.0 upgrades</nobr>'
                }
            ],
            postRenderFunction: function () {
                google.charts.load("current", { packages: ["corechart"] });
                google.charts.setOnLoadCallback(drawPieChart);

                function drawPieChart() {
                    var data = google.visualization.arrayToDataTable([
                        ["Task", "Hours per Day"],
                        ["Operations", 60],
                        ["Marketing", 30],
                        ["R & D", 20]
                    ]);
                    var options = {
                        pieHole: 0.3,
                        pieSliceTextStyle: { color: "white" },
                        chartArea: {
                            left: 0,
                            top: 0,
                            width: "100%",
                            height: "100%"
                        },
                        legend: {
                            position: "right",
                            alignment: "center",
                            textStyle: { color: "white", fontSize: 8 }
                        },
                        backgroundColor: "transparent",
                        width: "100%",
                        height: "125px",
                        color: "white"
                    };
                    var chart = new google.visualization.PieChart(
                        document.getElementById("chart")
                    );
                    setTimeout(function () {
                        chart.draw(data, options);
                    }, 100);
                }
            }
        };

        // Define panel for Project Planning

        inputs.panels.planning = {
            className: "customPopoverPanelDrawer",
            autoOpen: true,
            restriction: {
                panelType: "Planning"
            },
            rows: [
                {
                    type: "header",
                    text: "Project Planning"
                },
                {
                    type: "textRow",
                    text: "<B>Next:</B> " + getCustomFieldValue("nextStep")
                },
                {
                    type: "separator"
                },
                {
                    type: "labelValue",
                    label: "Annual Rev.",
                    value: formatCurrency("$", getCustomFieldValue("annualRev"), 2),
                    class: "textRight"
                },
                {
                    type: "labelValue",
                    label: "Budget",
                    value: formatCurrency("$", getCustomFieldValue("annualBudget"), 2),
                    class: "textRight"
                },
                {
                    type: "labelValue",
                    label: "Estimated",
                    value: formatCurrency("", getCustomFieldValue("estimatedHours"), 2) + " hrs",
                    class: "textRight",
                    restriction: { status: "In Progress" }
                },
                {
                    type: "labelValue",
                    label: "Scheduled",
                    value: formatCurrency("", getCustomFieldValue("scheduledHours"), 2) + " hrs",
                    class: "textRight"
                },
                {
                    type: "header",
                    text: "Budget Allocation"
                },
                {
                    type: "textRow",
                    text: makePieChartBudget()
                },
                {
                    type: "textRow",
                    text:
                        '<div class="row toolTipContentRow ' +
                        '">' +
                        '<div class="col-xs-12">' +
                        '<button class="btn btn-sm btn-secondary dbk_button_primary" style="text-align: left; width: 100%; padding: 8px; padding-top: 5px; padding-left: 10px !important; padding-bottom: 5px;" ><i class="fa fa-file-pdf-o"></i>&nbsp;&nbsp;2023 Budget Proposal</button> ' +
                        "</div>" +
                        "</div>"
                },
                {
                    type: "textRow",
                    text:
                        '<div class="row toolTipContentRow ' +
                        '">' +
                        '<div class="col-xs-12">' +
                        '<button class="btn btn-sm btn-secondary dbk_button_primary" style="text-align: left; width: 100%; padding: 8px; padding-top: 5px; padding-left: 10px !important; padding-bottom: 5px;" ><i class="fa fa-file-o"></i>&nbsp;&nbsp;YTD Project Report</button> ' +
                        "</div>" +
                        "</div>"
                },
                {
                    type: "textRow",
                    text:
                        '<div class="row toolTipContentRow ' +
                        '">' +
                        '<div class="col-xs-12">' +
                        '<button class="btn btn-sm btn-secondary dbk_button_primary" style="text-align: left; width: 100%; padding: 8px; padding-top: 5px; padding-left: 10px !important; padding-bottom: 5px;" ><i class="fa fa-user"></i>&nbsp;&nbsp;YTD Resource Allocation</button> ' +
                        "</div>" +
                        "</div>"
                }
            ],
            postRenderFunction: function () {
                google.charts.load("current", { packages: ["corechart"] });
                google.charts.setOnLoadCallback(function () {
                    drawPieChart();
                });

                function drawPieChart() {
                    var data = google.visualization.arrayToDataTable([
                        [
                            "Task",
                            "Hours per Month",
                            { role: "style" },
                            { role: "annotation" }
                        ],
                        ["Operations", 50, "lightgreen", "Operations"],
                        ["Technology", 20, "blue", "Technology"],
                        ["Marketing", 15, "purple", "Marketing"],
                        ["R & D", 10, "lightgreen", "R & D"],
                        ["Finance", 5, "pink", "Finance"]
                    ]);
                    var options = {
                        pieHole: 0.3,
                        pieSliceTextStyle: { color: "white" },
                        chartArea: {
                            left: 0,
                            top: 0,
                            width: "100%",
                            height: "95%"
                        },
                        legend: {
                            position: "right",
                            alignment: "center",
                            textStyle: { color: "white", fontSize: 8 }
                        },
                        slices: {
                            0: { color: "blue" },
                            1: { color: "green" },
                            2: { color: "lightgreen" },
                            3: { color: "purple" },
                            4: { color: "lightblue" }
                        },
                        bar: { groupWidth: "80%" },
                        backgroundColor: "transparent",
                        width: "100%",
                        height: "125px",
                        color: "white",
                        hAxis: {
                            textPosition: "none",
                            gridlines: { count: 0 }
                        },
                        vAxis: {
                            textPosition: "none",
                            gridlines: { count: 0 }
                        },
                        baselineColor: "transparent"
                    };
                    var chart = new google.visualization.PieChart(
                        document.getElementById("chart2")
                    );
                    setTimeout(function () {
                        chart.draw(data, options);
                    }, 100);
                }
            }
        };
    }; // End define panels

    //----------- Helper functions for retrieving and formatting fields ------------

    // Format a value in as a currency: $123.00

    function formatCurrency(currency, number, decimalPlaces = 0) {
        number =
            decimalPlaces > 0
                ? parseFloat(number).toFixed(decimalPlaces)
                : number;

        number = number === undefined || isNaN(number) ? 0 : number;

        return (
            currency +
            number.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
        );
    }

    // Allows you retrieve a custom field by name instead of
    // Store in Field ID

    function getCustomFieldValue(fieldName) {
        return editEvent[
            dbk.getCustomFieldIdByName(fieldName, editEvent.schedule)
        ];
    }

    function setCustomFieldValue(fieldName, fieldValue) {
        editEvent[dbk.getCustomFieldIdByName(fieldName, editEvent.schedule)] =
            fieldValue;
    }

    //----------- Custom panel restriction checking functions ------------

    // All panels will have access to the event object
    // Default will show panel for all events in a given source

    function showPanelForAllEvents() {
        return true;
    }

    // Returns true if the event contains a given status

    function restrictToStatus(status) {
        return editEvent["status"].includes(status) ? true : false;
    }

    //----------- Custom Row Value Functions, for thinks like maps and charts ------------

    // Custom Row Value Functions

    function makeCustomButtons() {
        return '<div class="white-space: nowrap; text-align: middle;"><center>\
        <button class="btn btn-xs btn-secondary dbk_button_primary">Track Time</button> \
        <button class="btn btn-xs btn-primary dbk_button_primary" onClick="window.open(\'https://seedcode.atlassian.net/jira/software/c/projects/MT/boards/32\');">Open Cases</button> \
        </center></div>';
    }

    function makePieChart() {
        // If you are planning on using the Google Charts API to create
        // custom data visualizations in your panels, you must first
        // pre-load the Google Charts API javascript library by adding the
        // following code to your Before Calendar Rendered app action:
        //     var script = document.createElement('script');
        //     script.setAttribute('src','https://www.gstatic.com/charts/loader.js');
        //     document.head.appendChild(script);

        return '<div id="chart" style="width: 100%; height: 125px; padding: 0px; padding-left: 5px; margin: 0px; margin-top: -10px;"></div>';
    }

    function makePieChartBudget() {
        // If you are planning on using the Google Charts API to create
        // custom data visualizations in your panels, you must first
        // pre-load the Google Charts API javascript library by adding the
        // following code to your Before Calendar Rendered app action:
        //     var script = document.createElement('script');
        //     script.setAttribute('src','https://www.gstatic.com/charts/loader.js');
        //     document.head.appendChild(script);

        return '<div id="chart2" style="width: 100%; height: 125px; padding: 0px; padding-left: 5px; margin: 0px; margin-top: 0px; margin-bottom: 5px;"></div>';
    }

    //----------- End Configuration -------------------
} catch (error) {
    reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
    // Define empty array of post render hooks, and generate our panel definitions

    inputs.postRenderHooks = [];
    inputs.definePanels();

    // Verify we have at least 1 panel defined
    if (!inputs.panels || Object.keys(inputs.panels).length < -1) {
        return alert('Please define at least one panel');
    }

    // Register function for calls from On Field Change
    seedcodeCalendar.init('dbkCheckPanelApplicability', popoverButtonHandling);

    // Get applicable panel, or return if none apply
    var applicablePanel = getApplicablePanel();

    if (applicablePanel === undefined) {
        return;
    }

    // If we have an applicable panel, register button to open
    // utility drawer

    var popover;
    var buttonBar;
    var buttonBarEditable;
    var buttonBarReadOnly;
    var gearIconContainer;
    var gearIconButton;

    var maxRetries = 50;
    var retries = 0;

    queueGetIconOverride();

    //----- Utility Drawer Functions ------

    // Loops through defined panels and find applicable panels.
    // Accepts either a javascript functions for restriction matching, or
    // an object of restriction rules.

    function getApplicablePanel() {
        for (const [name, obj] of Object.entries(inputs.panels)) {
            if (obj.hasOwnProperty('restriction')) {
                if (
                    typeof obj.restriction === 'function' &&
                    obj.restriction()
                ) {
                    return obj;
                } else if (typeof obj.restriction == 'object') {
                    const conditionCount = Object.keys(obj.restriction).length;

                    let matches = 0;

                    for (const [key, value] of Object.entries(
                        obj.restriction
                    )) {
                        let custFieldId = dbk.getCustomFieldIdByName(
                            key,
                            editEvent.schedule
                        );

                        if (
                            key == 'schedule' &&
                            editEvent.schedule.name == value
                        ) {
                            matches++;
                        } else if (editEvent[key] == value) {
                            matches++;
                        } else if (
                            editEvent.hasOwnProperty(key) &&
                            typeof editEvent[key] == 'array' &&
                            editEvent[key].includes(value)
                        ) {
                            matches++;
                        } else if (
                            !editEvent.hasOwnProperty(key) &&
                            custFieldId !== undefined &&
                            editEvent.hasOwnProperty(custFieldId) &&
                            (editEvent[custFieldId] == value ||
                                (typeof editEvent[custFieldId] == 'array' &&
                                    editEvent[custFieldId].includes(value)))
                        ) {
                            matches++;
                        }
                    }

                    if (matches == conditionCount) {
                        return obj;
                    }
                }
            } else {
                return obj;
            }
        }
    }

    //----- Utility Drawer Functions ------

    function queueGetIconOverride() {
        var popover = document.querySelector(
            '.dbk_editEvent:has(.btn-success)'
        );

        if (popover) {
            popoverButtonHandling();

            applicablePanel = getApplicablePanel();

            if (
                applicablePanel &&
                applicablePanel.hasOwnProperty('autoOpen') &&
                applicablePanel.autoOpen == true
            ) {
                openPanelClick();
            }
        } else {
            retries++;
            if (retries <= maxRetries) {
                setTimeout(queueGetIconOverride, 50);
            }
        }
    }

    // Manages creation/destruction of custom drawer buttons
    // Buttons must be destroyed if button applicability changes
    // after the change of any field variable

    function popoverButtonHandling() {
        var popover = document.querySelector(
            '.dbk_editEvent:has(.btn-success)'
        );

        if (!popover) {
            return;
        }

        applicablePanel = getApplicablePanel();

        gearIconContainer = popover.querySelector(
            '[ng-if="edit.customActions || calendar.config.admin"]'
        );
        gearIconButton = popover.querySelector(
            '[ng-click="togglePanel(\'action\')"'
        );
        buttonBarEditable = popover.querySelector('[ng-if="edit.editable"]');
        buttonBarReadOnly = popover.querySelector('[ng-if="!edit.editable"]');

        buttonBar = buttonBarEditable ? buttonBarEditable : buttonBarReadOnly;

        if (
            applicablePanel &&
            !popover.classList.contains('customPopoverPanel')
        ) {
            popover.classList.add('customPopoverPanel');

            // Create New Gear Button and Icon and hide original

            var newGearIconElem = document.createElement('i');
            var newGearIconBtn = document.createElement('button');

            newGearIconElem.classList = 'fa fa-cog fa-lg';
            newGearIconBtn.classList =
                'btn btn-link dbk_button_link dbk_icon_cog';
            newGearIconBtn.onclick = overrideGearIconHandling;
            newGearIconBtn.id = 'customPoverPanel_overrideGearIcon';
            newGearIconBtn.appendChild(newGearIconElem);

            if (gearIconContainer) {
                if (gearIconButton) {
                    gearIconButton.style.display = 'none';
                }

                gearIconContainer.appendChild(newGearIconBtn);
                gearIconContainer.style.left = '0px';
                gearIconContainer.style.removeProperty('right');
            }

            // Add drawer handing buttons to button container

            if (buttonBar) {
                buttonBar.classList.add('customPopoverPanelButtonBar');

                var btn = document.createElement('button');
                var btnIcon = document.createElement('i');

                btnIcon.classList = 'fa fa-chevron-right';
                btn.classList =
                    'btn btn-xs btn-primary dbk_button_success customPopoverPanelButton';
                btn.id = 'customPoverPanel_openDrawerButton';
                btn.onclick = openPanelClick;
                btn.appendChild(btnIcon);

                buttonBar.appendChild(btn);
                buttonBar.style.textAlign = 'right';
                buttonBar.style.float = 'right';
            }
        } else if (
            !applicablePanel &&
            popover.classList.contains('customPopoverPanel')
        ) {
            popover.classList.remove('customPopoverPanel');

            // Remove all buttons and restore alignment of buttons in button container

            if (gearIconContainer) {
                gearIconContainer.style.removeProperty('left');
                gearIconContainer.style.right = '0px';
            }

            var overrideIcon = document.getElementById(
                'customPoverPanel_overrideGearIcon'
            );
            if (overrideIcon) {
                overrideIcon.parentElement.removeChild(overrideIcon);
            }

            gearIconButton.style.display = 'block';

            var btnElementId = document.getElementById(
                'customPoverPanel_openDrawerButton'
            );
            if (btnElementId) {
                btnElementId.parentElement.removeChild(btnElementId);
            }

            if (buttonBar) {
                buttonBar.classList.remove('customPopoverPanelButtonBar');
                buttonBar.style.textAlign = 'center';
                buttonBar.style.removeProperty('float');
            }
        }
    }

    //----- Panel Opener Function -----

    // Function overrides the existing gear icon function and applies appropriate
    // drawer depending on which drawer is open

    function overrideGearIconHandling() {
        // Check if the utility drawer is open

        var utilityDrawer = document.querySelector(
            environment.isPhone ? '.utility-panel' : '.utility-drawer'
        );

        if (utilityDrawer) {
            // If we are clicking gear icon, and we are not already on the
            // gear icon action drawer, click the true hidden gear icon

            var drawerType = utilityDrawer.querySelector(
                '[ng-switch-when="action"]'
            );
            if (!drawerType) {
                return gearIconButton.click();
            }

            var subElements = drawerType.querySelector('event-actions');
            var containerDiv = drawerType.querySelector(
                '.customUtilityDrawerContainer'
            );

            subElements.style.display = 'block';

            // Remove our custom build drawer if one exists

            if (containerDiv) {
                containerDiv.parentElement.removeChild(containerDiv);
            } else {
                return gearIconButton.click();
            }
        } else {
            gearIconButton.click();
        }
    }

    // This function is registered to our custom utiloty drawer button
    // It clicks the true hidden gear icon and then redrawers the gear icon's
    // drawer with our own custom container

    function openPanelClick() {
        var popover = document.querySelector('.dbk_editEvent');
        var gearIcon = popover.querySelector(
            '[ng-click="togglePanel(\'action\')"'
        );

        // Check if drawer is active

        var drawerMaxRetries = 25;
        var drawerRetries = 0;

        queueUtilityDrawer();

        function queueUtilityDrawer() {
            var utilityDrawer = document.querySelector(
                environment.isPhone ? '.utility-panel' : '.utility-drawer'
            );
            var drawerType;

            if (!utilityDrawer) {
                gearIcon.click();
                drawerRetries++;
                if (drawerRetries <= drawerMaxRetries) {
                    setTimeout(queueUtilityDrawer, 200);
                }
            }

            if (utilityDrawer) {
                drawerType = utilityDrawer.querySelector(
                    '[ng-switch-when="action"]'
                );

                if (!drawerType) {
                    gearIcon.click();
                    drawerRetries++;
                    if (drawerRetries <= drawerMaxRetries) {
                        setTimeout(queueUtilityDrawer, 50);
                    }
                } else {
                    var containerDiv = drawerType.querySelector(
                        '.customUtilityDrawerContainer'
                    );

                    if (containerDiv) {
                        return gearIcon.click();
                    }

                    // Create Utility drawer container
                    containerDiv = document.createElement('div');
                    containerDiv.classList =
                        'customUtilityDrawerContainer customPopoverPanel';
                    drawerType.appendChild(containerDiv);

                    // Build our custom container based on current panel
                    buildCustomContainer(containerDiv);

                    // Hide Gear icon event actions
                    var subElements = drawerType.querySelector('event-actions');
                    subElements.style.display = 'none';
                }
            }
        }
    }

    //----- Panel Building Function ----

    function buildCustomContainer(container) {
        // Define empty array of post render hooks, and generate our panel definitions

        inputs.postRenderHooks = [];
        inputs.definePanels();

        // Get first applicable panel
        applicablePanel = getApplicablePanel();

        var utilityButton = document.querySelector('.customPopoverPanelButton');

        var panel = applicablePanel;

        if (!panel) {
            utilityButton.style.display = 'none';
        } else {
            utilityButton.style.display = 'inline-block';
        }

        // Set default

        var className = panel.hasOwnProperty('className')
            ? panel.className
            : 'customPopoverPanelDrawer';

        // Define list of helper function for suppported row types

        var helpers = {
            header: helper_panelrow_header,
            textRow: helper_panelrow_textRow,
            contentRow: helper_panelrow_contentRow,
            labelValue: helper_panelrow_labelValue,
            progressBar: helper_panelrow_progressBar,
            separator: helper_panelrow_separator,
        };

        // Start building content

        var content = '<div class="' + className + '">';

        if (panel.hasOwnProperty('rows')) {
            for (let r = 0; r < panel.rows.length; r++) {
                let row = panel.rows[r];
                if (helpers.hasOwnProperty(row.type)) {
                    // Check for restrictions

                    if (row.hasOwnProperty('restriction')) {
                        if (
                            typeof row.restriction === 'function' &&
                            row.restriction()
                        ) {
                            content = content + helpers[row.type](row);
                        } else if (typeof row.restriction == 'object') {
                            const conditionCount = Object.keys(
                                row.restriction
                            ).length;

                            let matches = 0;

                            for (const [key, value] of Object.entries(
                                row.restriction
                            )) {
                                if (
                                    key == 'schedule' &&
                                    editEvent.schedule.name == value
                                ) {
                                    matches++;
                                } else if (editEvent[key] == value) {
                                    matches++;
                                } else if (
                                    editEvent.hasOwnProperty(key) &&
                                    typeof editEvent.key == 'array' &&
                                    editEvent[key].includes(value)
                                ) {
                                    matches++;
                                } else if (
                                    !editEvent.hasOwnProperty(key) &&
                                    dbk.getCustomFieldIdByName(
                                        key,
                                        editEvent.schedule
                                    ) !== undefined &&
                                    editEvent.hasOwnProperty(
                                        dbk.getCustomFieldIdByName(
                                            key,
                                            editEvent.schedule
                                        )
                                    ) &&
                                    (editEvent[
                                        dbk.getCustomFieldIdByName(
                                            key,
                                            editEvent.schedule
                                        )
                                    ] == value ||
                                        editEvent[
                                            dbk.getCustomFieldIdByName(
                                                key,
                                                editEvent.schedule
                                            )
                                        ].includes(value))
                                ) {
                                    matches++;
                                }
                            }

                            if (matches == conditionCount) {
                                content = content + helpers[row.type](row);
                            }
                        }
                    } else {
                        content = content + helpers[row.type](row);
                    }
                } else {
                    return reportError('Unsuppored row type ' + row.type);
                }
            }
        } else if (panel.hasOwnProperty('content')) {
            content =
                content + helper_panelrow_contentRow({ text: panel.content });
        }

        // Add closing tag for content

        content = content + '</div>';

        var editContainer = document.querySelector('.dbk_editEvent');
        var utilityPanel = document.querySelector('.utility-panel');

        container.innerHTML = content;

        if (editContainer && editContainer.scrollHeight > 0) {
            container.style.height = editContainer.scrollHeight;

            if (container.scrollHeight > editContainer.scrollHeight) {
                container.classList.add('scrollable');
            } else {
                container.classList.remove('scrollable');
            }

            // Add scrollable content floating div and management function

            if (container.scrollHeight > editContainer.scrollHeight) {
                var postScrollDiv = document.createElement('DIV');
                var postScrollSpan = document.createElement('SPAN');
                var postScrollI = document.createElement('I');

                postScrollI.classList = 'fa fa-caret-down';
                postScrollSpan.appendChild(postScrollI);
                postScrollDiv.append(postScrollSpan);

                container.innerHTML =
                    container.innerHTML +
                    '<div class="postScrollPadding"></div>';
                postScrollDiv.classList = 'postScrollDiv';

                container.appendChild(postScrollDiv);

                $(postScrollDiv).css('width', container.clientWidth);

                container.addEventListener('scroll', () => {
                    if (
                        container.offsetHeight + container.scrollTop >=
                        container.scrollHeight - 10
                    ) {
                        postScrollI.classList = 'fa fa-caret-up';
                    } else {
                        postScrollI.classList = 'fa fa-caret-down';
                    }
                });
            }
        }

        // Run any post render function that must run after a panel has loaded

        if (
            panel.hasOwnProperty('postRenderFunction') &&
            typeof panel.postRenderFunction == 'function'
        ) {
            panel.postRenderFunction();
        }

        // Run any post render hooks that have been defined at a row level

        if (inputs.postRenderHooks.length > 0) {
            for (var hook = 0; hook < inputs.postRenderHooks.length; hook++) {
                if (typeof inputs.postRenderHooks[hook] === 'function') {
                    inputs.postRenderHooks[hook]();
                }
            }
        }

        // Panel has been build, return to caller

        return;

        // ----- Panel Row Type helper functions ------

        function helper_panelrow_header(params) {
            setDefaultsToBlank(params, ['class', 'text']);
            return (
                '<div class="panelHeader ' +
                params['class'] +
                '">' +
                '<div class="">' +
                params['text'] +
                '</div>' +
                '</div>'
            );
        }

        function helper_panelrow_textRow(params) {
            setDefaultsToBlank(params, ['class', 'text']);
            return (
                '<div class="row panelTextRow ' +
                params['class'] +
                '">' +
                '<div class="col-xs-12">' +
                params['text'] +
                '</div>' +
                '</div>'
            );
        }

        function helper_panelrow_contentRow(params) {
            setDefaultsToBlank(params, ['class', 'text']);
            return (
                '<div class="row panelContentRow ' +
                params['class'] +
                '">' +
                '<div class="col-xs-12">' +
                params['text'] +
                '</div>' +
                '</div>'
            );
        }

        function helper_panelrow_labelValue(params) {
            setDefaultsToBlank(params, [
                'class',
                'label',
                'value',
                'labelSize',
                'valueSize',
            ]);

            params['labelSize'] =
                params['labelSize'] > 0 ? params['labelSize'] : 6;
            params['valueSize'] =
                params['valueSize'] > 0 ? params['valueSize'] : 6;

            return (
                '<div class="row panelRow">' +
                '<div class="col-xs-' +
                params['labelSize'] +
                ' panelLabel">' +
                params['label'] +
                ':' +
                '</div>' +
                '<div class="col-xs-' +
                params['valueSize'] +
                ' panelValue ' +
                params['class'] +
                '">' +
                params['value'] +
                '</div>' +
                '</div>'
            );
        }

        function helper_panelrow_progressBar(params) {
            setDefaultsToBlank(params, ['class', 'value', 'scale', 'name']);
            let percent = Math.floor(
                (params['value'] / Math.max(params['value'], params['scale'])) *
                100
            );
            return (
                '<div class="row panelProgress">' +
                '<div class="col-xs-12"><div class="progressText">' +
                params['title'] +
                ':</div><div class="progress"> ' +
                '<div class="progress__bar ' +
                params['name'] +
                '" style="width: ' +
                percent +
                '% !important;"></div>' +
                '</div>' +
                '</div>' +
                '</div>'
            );
        }

        function helper_panelrow_separator(params) {
            setDefaultsToBlank(params, ['class']);
            return (
                '<div class="row panelTextRow ' +
                params['class'] +
                '">' +
                '<div class="panelSeparator"></div>' +
                '</div>'
            );
        }

        // Helper functions for defaulting undefined fields to blank values

        function setDefaultsToBlank(items, list) {
            for (const i of list) {
                items[i] = !items[i] ? '' : items[i];
            }
        }
    }
}

// End Custom Popover Panel code

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
