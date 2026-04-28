// Sidebar resource selector v1.00

// Purpose:
// Adds a resource selector to the Resource Filters section of the sidebar
// Action Type: After Calendar Rendered
// Prevent Default Action: No

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

  //Maximum attempts to try creating the button
  options.maxRetries = 20;

  //Show a button on the calendar for calculating all resource distances
  options.showCalendarButton = true;

  //custom addition settings. Modify here to customize the look of the selector
  inputs.selectClass = "resource-columns-sidebar-select";
  inputs.selectStyle = {
    color: "rgba(255, 255, 255, 0.87)",
    backgroundColor: "rgb(40, 40, 40)",
    border: "1px solid rgb(115, 115, 115)",
    borderRadius: "5px",
    minHeight: "24px",
    lineHeight: "24px",
    fontSize: "13px",
  };
  inputs.optionStyle = {
    color: "rgb(75, 75, 75)",
  };
  inputs.inputGroupWidth = "50px";
  inputs.containerClass = "resource-columns-sidebar";
  inputs.containerStyle = {
    right: "15px",
    paddingTop: utilities.getDBKPlatform() === 'dbkfmjs' ? "3px" : "10px",
    position: "absolute",
    display: "inline-block",
  };
  inputs.filterBoxAdjust = {
    marginTop: "40px",
  };

  //----------- End Configuration -------------------
} catch (error) {
  reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
  var retries = 0;

  //Add a click action to the resource button
  activateButtons();

  function activateButtons() {
    var filtersButton = document.querySelector(".btn.filters");
    var mainResourceColumnSelect = document.querySelector('[ng-change="applyResourceCount()"]');
    var resourceHeader = document.querySelector(
      ".filters-resource .header-block-content"
    );

    if (filtersButton) {
      filtersButton.onclick = function(){
        setTimeout(addResourceColumnsSelector, 50);
      }
      mainResourceColumnSelect.onchange = function(e){
        var select = document.querySelector("#" + inputs.selectClass);
        if (select){
            select.value = e.target.value;
        }
      }

      if (resourceHeader) {
        addResourceColumnsSelector();
      } else {
        retries++;
        if (retries <= options.maxRetries) {
          setTimeout(activateButtons, 10);
        }
      }
    } else {
      retries++;
      if (retries <= options.maxRetries) {
        setTimeout(activateButtons, 200);
      }
    }
  }

  function addResourceColumnsSelector() {
    var option;
    var select = document.querySelector("#" + inputs.selectClass);
    var label;
    var container;
    var resourceHeader = document.querySelector(
      ".filters-resource .header-block-content"
    );
    var config = seedcodeCalendar.get("config");
    var resourceCount = Object.keys(
      seedcodeCalendar.get("resources").filter((value) => {
        return !value.isFolder;
      })
    ).length;

    //Only add the selector if we're on the resource tab and haven't already added it to the DOM
    if (resourceHeader && !select) {
      container = document.createElement("div");

      //Create the select element and build options from the resource count
      select = document.createElement("select");
      for (let i = 1; i < resourceCount + 1; i++) {
        option = document.createElement("option");
        option.value = i;
        option.innerText = i;
        Object.assign(option.style, inputs.optionStyle);
        select.appendChild(option);
      }

      //When the select is modified, update the resource count in DayBack
      select.onchange = function (e) {
        location.hash +=
          (location.hash.includes("?") ? "&" : "?") +
          "resourceColumns=" +
          e.target.value;
      };

      //Add the select to a wrapper and input container
      select.name = inputs.selectClass;
      select.id = inputs.selectClass;
      select.value = config.resourceColumns;
      container.classList.add("select-wrapper");
      Object.assign(container.style, inputs.selectStyle);
      container.appendChild(select);
      select = container;
      container = document.createElement("div");
      container.classList.add("input-group");
      container.style.width = inputs.inputGroupWidth;
      container.appendChild(select);
      select = container;

      //label = document.createElement('label');
      //label.setAttribute('for', 'resource-columns-sidebar-select');
      //label.innerText = 'Resources';

      //For styling, add to a final outer container
      container = document.createElement("div");
      container.id = inputs.containerClass;
      container.classList.add("settings-item");
      Object.assign(container.style, inputs.containerStyle);

      //container.appendChild(label);
      container.appendChild(select);

      //Append the select to the sidebar.
      //The delay is necessary to make sure it doesn't outpace Angular building the sidebar template
      setTimeout(() => {
        resourceHeader.appendChild(container);
        Object.assign(
          document.querySelector(".filters-resource .search-wrapper").style,
          inputs.filterBoxAdjust
        );
      }, 10);
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
          "The action was unable to execute within the allotted time and has been stopped",
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
