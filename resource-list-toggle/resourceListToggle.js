// Resource list filter

// Purpose:
// Filters the list of available resources based on resource tags
// Action Type: On Event Click
// Prevent Default Action: No

// More info on custom App Actions here:
// https://docs.dayback.com/article/20-event-actions

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

  // Maximum attempts to try creating the button
  options.maxRetries = 20;

  // The currently signed in account email
  inputs.account = seedcodeCalendar.get("config").account;

  // Classes and styling for the show/hide button (You probably won't need to edit these)
  inputs.selectClass = "resource-columns-sidebar-select";
  inputs.resourceButtonSelector = '.edit [name="resource"]';
  inputs.nanoContentSelector = "resource-selector .select-list .nano-content";
  inputs.buttonColor = "rgb(66, 139, 202)";
  inputs.resourceListItemSelector = "resource-selector ul .list-selector";
  inputs.resources = seedcodeCalendar.get("resources");

  // The tags you chose to add to specify whether a resource or folder should be included in the list
  inputs.includeTagPrefix = "includeCalendars";
  inputs.excludeTagPrefix = "excludeCalendars";

  //----------- End Configuration -------------------
} catch (error) {
  reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
  var retries = 0;
  var includedResources;
  var excludedResources;
  var selectedResources;

  // Add our click action to the resources button
  addResourceClickAction();

  // Builds a list of resources to include and exclude from the list
  function buildResourceList(resources) {
    var includedFolders = [];
    var excludedFolders = [];
    includedResources = [];
    excludedResources = [];
    selectedResources = [];

    // First check for included or excluded folders
    resources
      .filter(function (resource) {
        return resource.isFolder;
      })
      .forEach(function (resource) {
        if (resource.tags && resource.tags.length > 0) {
          resource.tags.forEach(function (tag) {
            if (
              tag.name.startsWith(inputs.includeTagPrefix) &&
              tag.name
                .substring(tag.name.indexOf(":") + 1)
                .split(";")
                .map((s) => s.trim())
                .includes(editEvent.schedule.name)
            ) {
              // Folder is included
              includedFolders.push(resource.name);
            } else if (
              tag.name.startsWith(inputs.excludeTagPrefix) &&
              tag.name
                .substring(tag.name.indexOf(":") + 1)
                .split(";")
                .map((s) => s.trim())
                .includes(editEvent.schedule.name)
            ) {
              // Folder is excluded
              excludedFolders.push(resource.name);
            }
          });
        }
      });

    // Then check for included or excluded resources
    resources
      .filter(function (resource) {
        return !resource.isFolder;
      })
      .forEach(function (resource) {
        // Check for resources in included folders
        if (includedFolders.includes(resource.folderName)) {
          includedResources.push(resource.name);
        } else if (excludedFolders.includes(resource.folderName)) {
          // Check for resources in excluded folders
          excludedResources.push(resource.name);
        }

        // Now Check for resources with included or excluded tags
        // Tags in resources override tags in folders
        if (resource.tags && resource.tags.length > 0) {
          resource.tags.forEach(function (tag) {
            if (
              tag.name.startsWith(inputs.includeTagPrefix) &&
              tag.name
                .substring(tag.name.indexOf(":") + 1)
                .split(";")
                .map((s) => s.trim())
                .includes(editEvent.schedule.name) &&
              !includedResources.includes(resource.name)
            ) {
              // Resource is included
              includedResources.push(resource.name);
            } else if (
              tag.name.startsWith(inputs.excludeTagPrefix) &&
              tag.name
                .substring(tag.name.indexOf(":") + 1)
                .split(";")
                .map((s) => s.trim())
                .includes(editEvent.schedule.name) &&
              !excludedResources.includes(resource.name)
            ) {
              // Resource is excluded
              excludedResources.push(resource.name);
            }
          });
        }

        // If resource is already assigned to the event, add it to the included list
        if (editEvent.resource && editEvent.resource.includes(resource.name)) {
          selectedResources.push(resource.name);
          if (excludedResources.includes(resource.name)) {
            excludedResources.splice(
              excludedResources.indexOf(resource.name),
              1
            );
          }
        }
      });
  }

  // Adds an invisible button over the resource button so that we can modify the list when it's clicked
  function addResourceClickAction() {
    var resourceButton = document.querySelector(inputs.resourceButtonSelector);
    if (resourceButton) {
      retries = 0;
      var ghostButton = document.createElement("div");
      ghostButton.id = "ghostButton";
      Object.apply(ghostButton.style, resourceButton.style);
      ghostButton.style.backgroundColor = "transparent";
      ghostButton.style.border = "none";
      ghostButton.style.zIndex = "1000";
      ghostButton.style.position = "absolute";
      ghostButton.style.width = resourceButton.offsetWidth + "px";
      ghostButton.style.height = resourceButton.offsetHeight + "px";
      ghostButton.style.marginLeft =
        getComputedStyle(resourceButton).marginLeft;
      ghostButton.style.cursor = "pointer";
      ghostButton.onclick = function () {
        buildResourceList(inputs.resources);
        if (includedResources.length > 0 || excludedResources.length > 0) {
          addFilterButton();
        }
        resourceButton.click();
      };
      resourceButton.parentNode.insertBefore(ghostButton, resourceButton);
      seedcodeCalendar.init("ghostButton", ghostButton);
    } else {
      retries++;
      if (retries <= options.maxRetries) {
        setTimeout(addResourceClickAction, 200);
      }
    }
  }

  // Adds a button to the resource list that will show/hide the excluded resources
  function addFilterButton() {
    var nanoContent = document.querySelector(inputs.nanoContentSelector);
    var rebuildRequired = false;

    if (nanoContent) {
      var clearSelectionDiv = nanoContent.children[1];
      var container = document.createElement("div");
      container.classList.add("text-center");
      var button = document.createElement("button");
      button.classList = clearSelectionDiv.children[0].classList;
      button.classList.remove("invisible");
      button.style.color = inputs.buttonColor;
      container.appendChild(button);
      clearSelectionDiv.parentNode.insertBefore(container, clearSelectionDiv);

      // Hides the excluded resources from the list
      var hideFunction = function () {
        if (rebuildRequired) {
          buildResourceList(inputs.resources);
        }
        rebuildRequired = true;
        document
          .querySelectorAll(inputs.resourceListItemSelector)
          .forEach(function (listItem) {
            var resource = listItem.firstElementChild.innerText;
            if (
              (includedResources.length > 0 &&
                !includedResources.includes(resource) &&
                !selectedResources.includes(resource)) ||
              (!includedResources.includes(resource) &&
                excludedResources.includes(resource))
            ) {
              listItem.style.display = "none";
            }
          });
        button.innerText = "Show All";
        button.onclick = showFunction;
      };

      // Shows all resources in the list
      var showFunction = function () {
        document
          .querySelectorAll(inputs.resourceListItemSelector)
          .forEach(function (listItem) {
            listItem.style.removeProperty("display");
          });
        button.innerText = "Show Only Applicable";
        button.onclick = hideFunction;
      };
      hideFunction();
    } else {
      retries++;
      if (retries <= options.maxRetries) {
        setTimeout(addFilterButton, 200);
      }
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
