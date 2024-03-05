// Pie Chart Analytics v1.0
//
// Purpose:
// App action adds a new Pie Chart button to the 
// Totals summary row when Analytics is opened.
// This action requires no special configuration,
// but does require the installation of the 
// accompanying CSS changes. 
//
// Action Type: After Events Rendered
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

    // Defines the current account name running this action. Leave this defined
    // to the default. You may use the inputs.restrictedToAccounts to restrict action to 
    // certain individuals; leave empty to enable it for everyone. 

    inputs.account = seedcodeCalendar.get('config').account;

    options.restrictedToAccounts = [];

    //----------- End Configuration -------------------        
}
catch (error) {
    reportError(error);
}


//----------- The action itself: you may not need to edit this. -------------------


// Action code goes inside this function
function run() {

    let seriesData = [];
    let labelData = [];
    let colorData = [];

    // Wait for all elements to render before adding Pie Chart button listener
    setTimeout(showHidePieChartButton(), 1000);

    return confirmCallback();

    // Modify this function to add your own Show/Hide criteria
    function showHidePieChartButton() {

        let measureButtonShow = document.querySelector(
            ".measure-button-container .measure-button"
        );
        let measureButtonClose = document.querySelector(
            ".measure-button-container .measure-cancel"
        );

        if (measureButtonShow && measureButtonClose) {

            // Add listener to the Measure button. When clicked it waits for
            // analytics data to be available.

            if (!measureButtonShow.classList.contains('pieChartLoader')) {
                measureButtonShow.classList.add('pieChartLoader');
                measureButtonShow?.addEventListener("click", function () {
                    startObserving();
                });
            }

            if (!document.querySelector('.hasPieChartButton')) {
                startObserving();
            }
        }

        // Helper function starts an observer

        function startObserving() {
            dbk.observe({
                name: "analyticsPieChartObserver",
                watch: document.getElementById("calendar"),
                until: ".calendar-info .breakout-totals",
                checkStopConditionOnStart: true,
                whenFoundStopProcessing: true,
                whenFoundStopObserving: true,
                then: checkIfAnalyzed
            });
        }

        // Helper funciton to see if data is loaded​
        function checkIfAnalyzed(o) {
            o.restart();

            let breakoutTotalsContainer = document.querySelector(".breakout-totals");
            let footerTotal = document.querySelector(".footer-total");
            let scrollArrows = document.querySelector(".breakout-scroll.breakout-scroll-right");

            if (breakoutTotalsContainer && !breakoutTotalsContainer.classList.contains('hasPieChartButton') && footerTotal) {
                breakoutTotalsContainer.classList.add('hasPieChartButton');
                let buttonContainer = document.createElement('DIV');
                buttonContainer.onclick = displayPieChart;
                buttonContainer.classList = 'breakout-footer-total-container pieChartButton active';
                buttonContainer.innerHTML = '<div class="value-container"><i CLASS="fa fa-pie-chart"></i></div>';

                if (scrollArrows && scrollArrows.classList.contains('ng-hide')) {
                    breakoutTotalsContainer.append(buttonContainer);
                } else {
                    breakoutTotalsContainer.prepend(buttonContainer);
                }
            }
        }
    }

    // Function for loading Pie Chart modal window
    function displayPieChart() {

        const analytics = seedcodeCalendar.get("analytics");

        let template = `<style id="modalStyle">
                #popoverCloseButton { 
                    float: right; 
                    cursor: pointer; 
                    color: black; 
                    font-size: 1.5rem; 
                }

                @media screen and (min-width: 1024px) {
                    .modal-content { height: 400px !important; }
                    #pieChart { width: 100%; height: 350px !important; }
                    .ct-chart-pie { width: 100%; height: 350px !important; }
                    .ct-slice-pie { height: 350px !important; }
                 }
                
                 .ct-label { 
                    font-weight: bold; 
                    font-size: 12px; 
                    fill: white;
                }
                
                .modal-dialog {
                    width: auto !important;
                    height: auto !important;
                    max-width: 60%;
                    max-height: 60%;
                    border-radius: 5px;
                }
                
                .modal-content {
                    width: 100%;
                    height: 100% !important;
                    background-color: rgb(60,60,60);   
                }

                #pieChartFrame {
                    display: flex;
                    padding: 30px;
                    border-radius: 5px;
                    justify-content: center;
                }
                
                #pieChart {
                    width: 45%;
                }
                
                #pieChartLegend {
                    display: flex; 
                    flex-direction: column;
                    justify-content: space-around;
                    align-items: center;
                    width: 45%;
                    color: white;
                }

                #popoverCloseButton { 
                    cursor: pointer; color: black; font-size: 1.5rem; 
                    color: white;
                    margin-top: 10px;
                    margin-right: 15px;
                }

                #pieChartTitleDiv {
                    width: 100%;
                    color: white;
                    display: flex;
                }

                #pieChartTitleDiv .chartTitle {
                    display: inline-block;
                    width: 100%; 
                    text-align: center;
                    padding-top: 15px; 
                    font-size: 2.8rem;
                }
                
                #pieChartTitleDiv .closeButton {
                    position: absolute; 
                    right: 0px;
                }

                #legendData::-webkit-scrollbar {
                  display: none;
                }

                #legendData {
                  overflow-y: auto;
                  height: 80%;
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }

                #scrollIcon {
                  font-size: large;
                  color: gray; 
                  display: none; 
                }

                #pieChartFrame table {
                  table-layout: fixed; 
                  border-collapse: separate;
                  border-spacing: 4rem 1rem;
                }

                #pieChartFrame table td {
                  word-wrap: break-word;
                }

                #pieChartLoading {
                    height: 350px; 
                    padding: 30px;
                    display: block;
                    margin: auto;
                    color: white; width: 100%;
                    align-content: middle;
                    text-align: center;
                }

                #pieChartLoading .spinContainer {
                    position: absolute;
                    top: 45%;
                    left: 50%;
                    transform: translate(-50%, -45%);
                    font-size: 2rem;
                }
            </style>
            <div id="pieChartTitleDiv">
                <div class="chartTitle" id="title"></div>
                <div class="closeButton">
                    <a id="popoverCloseButton" ng-click="popover.config.show = false;"><span class="fa fa-times"></span></a>
                </div>
            </div>
            <div id="pieChartLoading">
                <div class="spinContainer">
                <div class="spinner spinner-light">
                        <div class="bounce1"></div>
                        <div class="bounce2"></div>
                        <div class="bounce3"></div>
                </div>
                <BR>
                Loading Piechart
                </div>
            </div>
            <div id="pieChartFrame" style="display: none;">
                <div id="pieChart">
                </div>
                <div id="pieChartLegend">
                  <div id="legendData"></div>
                  <div class="fa fa-solid fa-caret-down" id="scrollIcon"></div>
                </div>
            </div>`;

        // Configure the Pie Chart Popover

        const config = {
            container: document.querySelector("#calendar-container")
                ? "#calendar-container"
                : "#app-container",
            type: "modal",
            destroy: true,
            onShown: function () {
                setTimeout(function () {
                    let loader = document.getElementById('pieChartLoading');
                    loader.style.display = 'none';
                    let pieChartFrame = document.getElementById('pieChartFrame');
                    pieChartFrame.style.display = 'flex';
                    makePieChart();
                }, 1000);
            },
            show: true,
        };

        // Display Popover

        if (analytics && analytics.breakoutItems && analytics.breakoutItems.length > 1 && analytics.breakoutSummary?.totalCount > 0) {
            utilities.popover(config, template);
        } else {
            utilities.showMessage("You need more than 1 breakout item to show pie chart.", 0, 5000, 'error', null);
        }

        // Helper function gets the modal style sheet so that color definitions can be dynamically added

        function getModalStyleSheet() {
            let modalStyleSheet;
            for (let i = 0; i < document.styleSheets.length; i++) {
                if (document.styleSheets[i].ownerNode.id == "modalStyle") {
                    modalStyleSheet = document.styleSheets[i];
                    break;
                }
            }

            return modalStyleSheet;
        }

        function buildDataForChartist() {

            let breakoutItems = analytics.breakoutItems;
            let classNumber = 0;

            // Reset data arrays 

            seriesData = [];
            labelData = [];
            colorData = [];

            breakoutItems.forEach((data) => {
                let obj = {
                    value: data.totalCount,
                    name: data.shortName,
                    className: "dataSeries" + (classNumber += 1),
                    meta: data.color,
                };

                if (data.totalCount > 0) {

                    //build seriesData
                    seriesData.push(obj);

                    //build labelData
                    labelData.push(data.name);

                    //build colorData
                    colorData.push(data.color);
                }

                // update style sheet with classname and associated color of each breakout item
                // need the timeout on the onShown-config variable because the style sheet isn't available immediatly when the function is fired

                let styleSheet = getModalStyleSheet();
                styleSheet.insertRule(
                    ".dataSeries" + classNumber + " { fill: " + data.color + " }", 0);
            });
        }

        function buildLegend() {

            // get breakout label 
            let breakoutLabel = analytics.breakoutSummary.breakoutLabel;

            // build the legend table
            let legendTable = '';

            // generate legend data
            for (let i = 0; i < labelData.length; i++) {
                legendTable += `<tr>
                    <td class="fa fa-solid fa-circle" style="color:${colorData[i]}"></td>
                    <td>${labelData[i]}</td>
                </tr>`
            }

            // display legend data 
            document.getElementById('legendData').innerHTML = `<table>${legendTable}</table>`;

            // display title with breakout label 
            if (breakoutLabel) {
                document.getElementById('title').innerHTML = `<h3>Analytics Broken Out By ${breakoutLabel}</h3>`;
            }
            else {
                document.getElementById('title').innerHTML = `<h3>Pie Chart Analytics</h3>`;
            }

            // if the user opens the window in an overflowed or nonoverflowed state 
            checkForOverflow();

            // if the user resizes the window to an overflowed or nonoverflowed state 
            addEventListener("resize", checkForOverflow);
        }

        function checkForOverflow() {
            let overflowContainer = document.getElementById('legendData');
            let scrollIcon = document.getElementById('scrollIcon');

            // helper function that returns true if the container is overflowing
            // we are only concerned about the height of the container and not the width of the container
            function isOverflowing(element) {
                return element.scrollHeight > element.clientHeight;
            }

            if (isOverflowing(overflowContainer)) {
                scrollIcon.style.display = 'block';
            }
            else {
                scrollIcon.style.display = 'none';
            }
        }

        // Function that builds the pie chart 
        function makePieChart() {

            buildDataForChartist();

            var sum = function (a, b) { return a + b.value };

            var data = {
                series: seriesData,
            };

            var options = {
                labelOffset: 40,
                chartPadding: 5,
                labelInterpolationFnc: function (value) {
                    return Math.round(value / data.series.reduce(sum, 0) * 100) + '%';
                },
            };

            new Chartist.Pie("#pieChart", data, options);

            buildLegend();
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
catch (error) {
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
    timeout = setTimeout(function () {
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

    setTimeout(function () {
        utilities.showModal(errorTitle, errorMessage, null, null, 'OK', null, null, null, true, null, true);
    }, 1000);
}