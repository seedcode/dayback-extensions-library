// Multi Update Button Menu - Part 1 v1.1
//
// Purpose:
// Adds a single button, multiple buttons, or container
// of buttons to DayBack bottom right. This is Part 1 of
// a 2-part Custom App Action. Action reuse code from
// Add Custom Button app action.
// https://dayback.com/listing/custom-action-menu/
//
// Action Type: Before Calendar Rendered
// Prevent Default Action: Yes
//
// More info on custom actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// Declare globals

var options = {};
var inputs = {};

try {
    // ----------- General Configuration -------------------

    // Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
    // Leave this set to 0 to avoid unexpected behavior

    options.runTimeout = 0;

    // ---------- Multi-Update Configuration -----------

    // Configure multi update popover panel

    inputs.multiUpdatePanel = {
        // How many Resources or Statuses should be shown in the
        // popover? If you want a taller popover, increase the number of
        // items in the list.

        maxItemsInList: 5,

        // Define whether you would like to allow more than one status
        // for an event at the same time.

        statusMultiSelect: false,

        // Define whether a user should be able to add or remove the
        // 'none' resource from an Event's resource list.

        allowAddRemoveNoneResource: true
    };

    // ---------- Button Container Configuration -----------

    // If you only intend to create one group of buttons, you may leave this option
    // set to 'custom_btn' by default. If you want multiple collapsible button groups,
    // define the CSS class group name used for styling this particular button group.
    //
    // If creating multple button groups, you may duplicate this app action multiple
    // times with a whole new list of button definitions and unique cssGroupName.
    // the CSS will need to be modified to align multiple groups on the screen.

    options.cssGroupName = "custom_btn";

    // Defines the current account name running this action. Leave this defined
    // to the default. You may use the inputs.accountName to restrict buttons to
    // certain individuals.

    inputs.accountName = seedcodeCalendar.get("config").accountName;

    // Defines whether you wish to have a parent button that acts like a container
    // drawer for multiple grouped buttons. By default this is set to false.
    // Containers work best if you are defining more than 1 button and don't want to
    // clutter your screen.
    //
    // If you don't mind having multiple buttons that always appear on the screen,
    // or you just have a single button leave this set to false.

    inputs.showContainer = true;

    // If showing button container drawer, specify if the button should be
    // closed, or open when DayBack loads. The default is to show the container
    // as closed so the buttons appear when you hover over the container.

    inputs.showContainerAsOpen = false;

    // Define Your Buttons:
    // --------------------
    //
    // Define an array of buttons. Available parameters are as follows:
    // An asterisk denoted a required parameter:
    //
    //      * icon:     Specify the icon you want shown for a given button.
    //                  Instructions provided below.
    //
    //      * action:   Defines the JavaScript function the button should run
    //                  when clicked. You will need to define each function
    //                  in the specific section below.
    //
    //      label:      Define a label name that should appear next to your button.
    //                  This is optional, and does not need to be defined if
    //                  you don't need a label next to your button.
    //
    //      color:      Specify a button's color (e.g., #FFFFF or white, or
    //                  rgb(256,256,256)). The color is optional. If you omit
    //                  color the default color will be used.
    //
    //      restrict:   By default a button will be shown to all users. If you
    //                  want to restrict who sees this button, you can specify a
    //                  JavaScript function that returns true if a button is
    //                  allowed, and false if it should be hidden.
    //
    //      uniqueId:   Specify a unique ID of the button. This ID can be used
    //                  Custom App Actions to show/hide a button on specific
    //                  pages. To specify which buttons show on which view pages
    //                  please also install the Hide Custom Button On View Change
    //                  custom app action.

    // Example JavaScript Action:
    // --------------------------
    //
    // By default, we provide an example customButtonAction_goToBookmark() function
    // which will accept a Bookmark ID as a parameter. DayBack will open the Bookmark
    // when the button is clicked. You can use this as an outline for how to hook
    // functions.
    //
    // How to specify button icons:
    // ----------------------------
    //
    // Find your Icon's Unicode definition:
    //
    // 1. Locate icon on cheat sheet: https://fontawesome.com/v4.7/icons/
    // 2. Specify the icon using 'fa-' followed by the english name.
    //    For example: check mark should be specified as fa-check

    // Specify buttons from bottom up

    inputs.buttonList = [
        {
            label: "Update Status",
            icon: "fa-flag",
            color: "#2dabab",
            action: function () {
                multiUpdatePopup("statuses");
            }
        },
        {
            label: "Update Resources",
            icon: "fa-users",
            color: "#2B5DCD",
            action: function () {
                multiUpdatePopup("resources");
            }
        },
        {
            label: "Delete Events",
            icon: "fa-trash",
            color: "#444",
            action: confirmEventDelete
        }
    ];

    //----------- Define Custom Button functions here -----------

    // Generic Event changes confirmation function that takes an object
    // of values that should be applied to the editEvent object for all
    // selected events

    function confirmEventDelete(eventChanges) {
        var multiSelect = seedcodeCalendar.get("multiSelect");
        var itemCount =
            multiSelect !== undefined ? Object.keys(multiSelect).length : 0;

        if (itemCount > 0) {
            utilities.showModal(
                "Confirm Changes",
                "Please confirm you want to delete " + itemCount + " events",
                "Cancel",
                function () {},
                "Confirm Delete",
                function () {
                    deleteEvents(multiSelect);
                }
            );
        } else {
            helpers.showMessage("Please select one or more events", 0, 3000);
        }
    }

    // Generic Event changes confirmation function that takes an object
    // of values that should be applied to the editEvent object for all
    // selected events

    function multiUpdatePopup(context = "resources") {
        var multiSelect = seedcodeCalendar.get("multiSelect");
        var itemCount =
            typeof multiSelect === "object" && multiSelect !== null
                ? Object.keys(multiSelect).length
                : 0;

        if (itemCount > 0) {
            // define popver html as string, inserting title, message and buttons
            var template = `
            <div class="multiUpdatePopup">
                <div class="tabButtonContainer">
                    <div class="btn-group">`;

            if (context == "statuses") {
                template += `<button ng-click="popover.config.changePopoverTab('setStatus')" id="popover_setStatus" data-tab-name="setStatus" class="btn btn-default dbk_tabButton  active" style=""><i class="fa fa-fw fa-list-ul"></i> Set Status</button>`;
            } else {
                template += `
                    <button ng-click="popover.config.changePopoverTab('setResources')" id="popover_setResources" data-tab-name="setResources" class="btn btn-default   dbk_tabButton  dbk_selected" style=""><i class="fa fa-fw fa-user"></i> Set Resources</button>
                    <button ng-click="popover.config.changePopoverTab('addResources')" id="popover_addResources" data-tab-name="addResources" class="btn btn-default  dbk_tabButton"><i class="fa fa-fw fa-plus"></i> Add Resource</button>
                    <button ng-click="popover.config.changePopoverTab('removeResources')" id="popover_removeResources" data-tab-name="removeResources" class="btn btn-default dbk_tabButton"><i class="fa fa-fw fa-times"></i> Remove Resource</button>
                    `;
            }

            template += `
                        <a id="_popoverCloseButton" class="popoverCloseButton" ng-click="popover.config.show = false;"><span class="fa fa-times"></span></a>
                    </div>
                </div>
                <div class="summaryRow"></div>
                <div class="pad-large">
                    <div class="tabList">
                        <div id="tab_setStatus">
                        </div>
                        <div id="tab_setResources">
                        </div>
                        <div id="tab_addResources">
                        </div>
                        <div id="tab_removeResources">
                        </div>
                    </div>
                    <div class="buttonListDivider"/>
                    <div class="buttonList">
                        <div class="pad-large text-center">
                            <button id="clearMultiUpdateRequest" style="display: none; margin-right: 5px;" translate="" ng-click="popover.config.clearSelected();" class="btn btn-xs btn-secondary">Clear</button>
                            <button translate="" style="margin-right: 5px;" ng-click="popover.config.show = false;" class="btn btn-xs btn-secondary">Cancel</button> 
                            <button disabled id="confirmMultiUpdateChanges" translate="" ng-click="popover.config.confirmMultiUpdateChanges();" class="btn btn-xs  btn-success dbk_button_success">Confirm</button>
                        </div>                    
                    </div>
                </div>
            </div>
            `;

            // Configure the popover
            var config = {
                container: document.querySelector("#calendar-container")
                    ? "#calendar-container"
                    : "#app-container",
                type: "modal", // modal or popover
                destroy: true,
                width: 620,
                onShown: function () {
                    populatePopoverContent(
                        context == "statuses" ? "setStatus" : "setResources"
                    );
                },
                onHide: "",
                onHidden: "",
                show: true,
                // Register functions
                changePopoverTab: changePopoverTab,
                confirmMultiUpdateChanges: confirmMultiUpdateChanges,
                clearSelected: clearSelected,
                closePopover: function () {
                    let closeButton = document.getElementById(
                        "_popoverCloseButton"
                    );
                    closeButton.click();
                }
            };

            // Get current expended resource folders

            var resources = seedcodeCalendar.get("resources");
            var resourceFolders = {};

            resources.forEach((resource) => {
                if (resource.isFolder == true) {
                    resourceFolders[resource.folderSortID] =
                        resource.status.folderExpanded == true ? 1 : 0;
                }
            });

            // Call utility function to evoke modal
            utilities.popover(config, template);

            // Handle tab changes
            function changePopoverTab(activeTab) {
                var tablist;

                if (context == "statuses") {
                    tablist = ["setStatus"];
                } else {
                    tablist = [
                        "setResources",
                        "addResources",
                        "removeResources"
                    ];
                }
                tablist.forEach((tab) => {
                    let element = document.getElementById("popover_" + tab);
                    let tabelem = document.getElementById("tab_" + tab);

                    if (tab == activeTab) {
                        element.dataset.activeTab = 1;

                        if (!element.classList.contains("btn-primary")) {
                            element.classList.add("btn-primary");
                            element.classList.add("active");
                        }

                        if (tabelem) tabelem.style.display = "block";
                    } else {
                        element.dataset.activeTab = 0;

                        if (element) {
                            element.classList.remove("btn-primary");
                            element.classList.remove("active");
                        }

                        if (tabelem) tabelem.style.display = "none";
                    }
                });
            }

            // Handle confirmation of changes

            function confirmMultiUpdateChanges() {
                let setStatus = document.querySelectorAll(
                    "#tab_setStatus .item[data-item-selected='1']"
                );
                let setResources = document.querySelectorAll(
                    "#tab_setResources .item[data-item-selected='1']"
                );
                let addResources = document.querySelectorAll(
                    "#tab_addResources .item[data-item-selected='1']"
                );
                let removeResources = document.querySelectorAll(
                    "#tab_removeResources .item[data-item-selected='1']"
                );

                let changesCount = 0;
                let eventChanges = {};

                if (setStatus.length > 0) {
                    eventChanges.status = Array.from(setStatus).map(function (
                        i
                    ) {
                        return i.dataset.statusName;
                    });
                    changesCount++;
                }

                if (setResources.length > 0) {
                    eventChanges.resource = Array.from(setResources).map(
                        function (i) {
                            return i.dataset.resourceName;
                        }
                    );
                    changesCount++;
                }

                if (addResources.length > 0) {
                    eventChanges.addResources = Array.from(addResources).map(
                        function (i) {
                            return i.dataset.resourceName;
                        }
                    );
                    changesCount++;
                }

                if (removeResources.length > 0) {
                    eventChanges.removeResources = Array.from(
                        removeResources
                    ).map(function (i) {
                        return i.dataset.resourceName;
                    });
                    changesCount++;
                }

                if (changesCount == 0) {
                    utilities.showModal(
                        "Error",
                        "Please select at least one change",
                        "OK"
                    );
                } else {
                    return confirmEventChanges(eventChanges);
                }
            }

            // Define Resource Toggle function
            function toggleResource(item) {
                var tabItems = document.getElementById(
                    "tab_" + item.dataset.resourceTab
                );

                if (item.dataset.itemSelected == "1") {
                    item.dataset.itemSelected = 0;
                    item.classList.remove("itemSelected");

                    if (
                        item.dataset.isNone == "1" ||
                        item.dataset.folderSortID == "undefined"
                    ) {
                        item.classList.add("folderBackgroundColor");
                    } else {
                        item.classList.add("resourceBackgroundColor");
                    }
                } else {
                    item.dataset.itemSelected = 1;
                    item.classList.add("itemSelected");

                    if (
                        item.dataset.isNone == "1" ||
                        item.dataset.folderSortID == "undefined"
                    ) {
                        item.classList.remove("folderBackgroundColor");
                    } else {
                        item.classList.remove("resourceBackgroundColor");
                    }
                }

                // Unset all resources if None folder clicked

                if (
                    item.dataset.isNone == "1" &&
                    item.dataset.itemSelected == "1"
                ) {
                    let list = tabItems.querySelectorAll(
                        ".item[data-is-none='0'][data-is-folder='0'][data-item-selected='1']"
                    );

                    list.forEach((selectedItem) => {
                        toggleResource(selectedItem);
                    });
                } else if (
                    item.dataset.isNone == "0" &&
                    item.dataset.itemSelected == "1"
                ) {
                    let noneItem = tabItems.querySelector(
                        ".item[data-is-none='1'][data-item-selected='1']"
                    );
                    if (noneItem) toggleResource(noneItem);
                }

                // Confirm if changes can be applied:

                let selectedItems = tabItems.querySelectorAll(
                    ".item[data-item-selected='1']"
                );
                let folderItemList = tabItems.querySelectorAll(
                    ".item[data-folder-sort-i-d='" +
                        item.dataset.folderSortID +
                        "'][data-is-folder='0'][data-item-selected='1']"
                );

                let tabIcon = document.querySelector(
                    '[data-tab-name="' + item.dataset.resourceTab + '"]>I'
                );
                let parentFolder = tabItems.querySelector(
                    ".item[data-folder-sort-i-d='" +
                        item.dataset.folderSortID +
                        "'][data-is-folder='1']"
                );

                if (selectedItems.length > 0) {
                    tabIcon.classList.add("setResourceActive");
                } else {
                    tabIcon.classList.remove("setResourceActive");
                }

                summarizeChanges();
            }

            function clearSelected() {

                var tablist = [
                    "setStatus",
                    "setResources",
                    "addResources",
                    "removeResources"
                ];

                tablist.forEach((tab) => {

                    var tabItems = document.getElementById("tab_" + tab);
                    if (tabItems && tab == 'setStatus') {
                        var selectedItems = tabItems.querySelectorAll(".item[data-item-selected='1']")
                        selectedItems.forEach((item) => { toggleStatus(item); });
                    } else if (tabItems) {
                        var selectedItems = tabItems.querySelectorAll(".item[data-item-selected='1']")
                        selectedItems.forEach((item) => { toggleResource(item); });
                    }
                });

                var btn = document.getElementById('clearMultiUpdateRequest');
                if (btn) {
                    btn.style.display = 'none';
                }
                
                var openFolders = document.querySelectorAll(".item.folderBackgroundColor.open");

                if (openFolders && openFolders.length > 0) {
                    openFolders.forEach((folder) => {
                        folder.classList.remove('open');
                    });
                }
            }

            function summarizeChanges() {
                let summaryRow = document.querySelector(
                    ".multiUpdatePopup .summaryRow"
                );
                summaryRow.textContent = "";

                let popover_setResources = document.getElementById(
                    "popover_setResources"
                );
                let popover_addResources = document.getElementById(
                    "popover_addResources"
                );
                let popover_removeResources = document.getElementById(
                    "popover_removeResources"
                );

                let allSelectedItems = document.querySelectorAll(
                    ".item[data-item-selected='1']"
                );

                let setStatus = document.querySelectorAll(
                    "#tab_setStatus .item[data-item-selected='1']"
                );
                let setResources = document.querySelectorAll(
                    "#tab_setResources .item[data-item-selected='1']"
                );
                let addResources = document.querySelectorAll(
                    "#tab_addResources .item[data-item-selected='1']"
                );
                let removeResources = document.querySelectorAll(
                    "#tab_removeResources .item[data-item-selected='1']"
                );
                let html = "";

                if (context == "resources") {
                    if (setResources.length > 0) {
                        popover_addResources.disabled = true;
                        popover_removeResources.disabled = true;
                    } else {
                        popover_addResources.disabled = false;
                        popover_removeResources.disabled = false;
                    }

                    if (addResources.length > 0 || removeResources.length > 0) {
                        popover_setResources.disabled = true;
                    } else {
                        popover_setResources.disabled = false;
                    }
                }

                if (setStatus.length > 0) {
                    html =
                        html +
                        '<i class="fa fa-calendar-check-o iconSetStatusColor"></i> Set Status to ';
                    html += Array.from(setStatus)
                        .map(function (i) {
                            return i.dataset.statusName;
                        })
                        .join(", ");
                }

                if (setResources.length > 0) {
                    html +=
                        ' <i class="fa fa-users iconSetResourcesColor"></i> Set Resource to ';
                    html += Array.from(setResources)
                        .map(function (i) {
                            return i.dataset.resourceName;
                        })
                        .join(", ");
                }

                if (addResources.length > 0) {
                    html =
                        html +
                        ' <i class="fa fa-user-plus iconAddResourcesColor"></i> Add ';
                    html += Array.from(addResources)
                        .map(function (i) {
                            return i.dataset.resourceName;
                        })
                        .join(", ");
                }

                if (removeResources.length > 0) {
                    html =
                        html +
                        ' <i class="fa fa-user-times iconRemoveResourcesColor" style="color: red;"></i> Remove ';
                    html += Array.from(removeResources)
                        .map(function (i) {
                            return i.dataset.resourceName;
                        })
                        .join(", ");
                }

                let confirmButton = document.getElementById(
                    "confirmMultiUpdateChanges"
                );

                confirmButton.disabled =
                    allSelectedItems.length > 0 ? false : true;

                summaryRow.innerHTML = html;

                if (html.length > 0) {
                    $(summaryRow).slideDown(400);

                    var btn = document.getElementById('clearMultiUpdateRequest');
                    if (btn) {
                        btn.style.display = 'inline';
                    }
                } else {
                    $(summaryRow).slideUp(400);
                }
            }

            // Define Status Toggle function
            function toggleStatus(item) {
                if (
                    !inputs.multiUpdatePanel.statusMultiSelect &&
                    item.dataset.itemSelected != true
                ) {
                    let list = document.querySelectorAll(
                        '[data-item-selected="1"]'
                    );
                    list.forEach((item) => {
                        item.dataset.itemSelected = 0;
                        item.classList.remove("itemSelected");
                    });
                }

                if (item.dataset.itemSelected == true) {
                    item.dataset.itemSelected = 0;
                    item.classList.remove("itemSelected");
                } else {
                    item.dataset.itemSelected = 1;
                    item.classList.add("itemSelected");
                }

                // Confirm if changes can be applied:

                let list = document.querySelectorAll(
                    '[data-item-selected="1"]'
                );

                let setStatusIcon = document.querySelector(
                    '[data-tab-name="setStatus"]>I'
                );

                if (setStatusIcon) {
                    if (list.length > 0) {
                        setStatusIcon.classList.add("setStatusActive");
                    } else {
                        setStatusIcon.classList.remove("setStatusActive");
                    }
                }

                summarizeChanges();
            }

            function populatePopoverContent(preloadTab = "setStatus") {
                var maxRetries = 50;
                var retries = 0;

                checkContainerLoaded();

                function checkContainerLoaded() {
                    var popup = document.querySelector(".multiUpdatePopup");
                    if (popup) {
                        changePopoverTab(preloadTab);

                        // Get statuses & resources
                        var statuses = seedcodeCalendar.get("statuses");

                        // Create Statuses
                        if (context == "statuses") {
                            // Create empty status tab statuses
                            var tab = document.getElementById("tab_setStatus");

                            let scrollableDiv = document.createElement("DIV");
                            scrollableDiv.classList = "scrollableDiv";

                            // Add statuses to scrollable div
                            statuses.forEach((status) => {
                                let item = document.createElement("DIV");
                                let statusColor = document.createElement("DIV");
                                let statusName = document.createElement("P");

                                item.dataset.statusName = status.nameSafe;
                                item.dataset.itemSelected = false;
                                item.classList = "item";
                                item.onclick = function () {
                                    toggleStatus(item);
                                };

                                statusColor.classList = "statusColor";
                                statusName.classList = "statusName";

                                statusColor.style.backgroundColor =
                                    status.color;
                                statusName.textContent = status.nameSafe;

                                item.appendChild(statusColor);
                                item.appendChild(statusName);

                                scrollableDiv.appendChild(item);
                            });

                            tab.appendChild(scrollableDiv);

                            // Adjust height of scrollable area to maximum item count
                            let selectListItem =
                                document.querySelector(".statusName");
                            let itemHeight =
                                selectListItem.clientHeight > 0
                                    ? selectListItem.clientHeight
                                    : 40;
                            let maxHeight =
                                itemHeight *
                                Math.min(
                                    statuses.length,
                                    inputs.multiUpdatePanel.maxItemsInList
                                );

                            if (selectListItem) {
                                scrollableDiv.style.maxHeight =
                                    maxHeight + "px";
                                scrollableDiv.style.minHeight =
                                    maxHeight + "px";
                            }
                        } else {
                            var resourceTabs = [
                                "setResources",
                                "addResources",
                                "removeResources"
                            ];

                            resourceTabs.forEach((tabName) => {
                                // Create empty status tab statuses
                                var tab = document.getElementById(
                                    "tab_" + tabName
                                );

                                let scrollableDiv =
                                    document.createElement("DIV");
                                scrollableDiv.classList = "scrollableDiv";

                                // Add statuses to scrollable div
                                resources.forEach((resource) => {
                                    let item = document.createElement("DIV");
                                    let resourceColor =
                                        document.createElement("DIV");
                                    let resourceName =
                                        document.createElement("P");

                                    item.classList = "item";
                                    item.dataset.resourceTab = tabName;
                                    item.dataset.itemSelected = 0;
                                    item.dataset.resourceId = resource.id;
                                    item.dataset.resourceName =
                                        resource.nameSafe;
                                    item.dataset.isNone =
                                        resource.nameSafe == "none" ? 1 : 0;
                                    item.dataset.folderName =
                                        resource.folderName;
                                    item.dataset.folderSortID =
                                        resource.folderSortID;
                                    item.dataset.isFolder =
                                        resource.isFolder == true ? 1 : 0;
                                    item.dataset.isFolderOpen =
                                        resource.isFolder == true &&
                                        resource.status.folderExpanded == true
                                            ? 1
                                            : 0;

                                    // Remove None resource from Add/Remove sub menus

                                    if (
                                        inputs.multiUpdatePanel
                                            .allowAddRemoveNoneResource ==
                                            false &&
                                        tabName != "setResources" &&
                                        item.dataset.isNone == 1
                                    ) {
                                        return;
                                    }

                                    resourceName.classList = "resourceName";
                                    resourceName.textContent = resource.display
                                        ? resource.display
                                        : resource.nameSafe;

                                    if (
                                        item.dataset.isNone == "0" &&
                                        item.dataset.isFolder == "0" &&
                                        resourceFolders[
                                            item.dataset.folderSortID
                                        ] == "0"
                                    ) {
                                        item.style.display = "none";
                                    } else {
                                        item.style.display = "block";
                                    }

                                    if (item.dataset.isFolder == "1") {
                                        item.classList.add(
                                            "folderBackgroundColor"
                                        );

                                        resourceColor.classList =
                                            "resourceFolderArrow";
                                        let icon = document.createElement("I");

                                        if (item.dataset.isFolderOpen == "1") {
                                            icon.classList = "fa fa-caret-down";
                                        } else {
                                            icon.classList =
                                                "fa fa-caret-right";
                                        }

                                        item.onclick = function () {
                                            let folderItems =
                                                scrollableDiv.querySelectorAll(
                                                    ".item[data-folder-sort-i-d='" +
                                                        item.dataset
                                                            .folderSortID +
                                                        "']"
                                                );

                                            let selectedItems = 0;

                                            if (
                                                icon.classList.contains(
                                                    "fa-caret-right"
                                                )
                                            ) {
                                                icon.classList.remove(
                                                    "fa-caret-right"
                                                );
                                                icon.classList.add(
                                                    "fa-caret-down"
                                                );

                                                folderItems.forEach(
                                                    (folder) => {
                                                        if (
                                                            folder.dataset
                                                                .isFolder != "1"
                                                        ) {
                                                            folder.style.display =
                                                                "block";
                                                            if (
                                                                folder.dataset
                                                                    .itemSelected ==
                                                                "1"
                                                            ) {
                                                                selectedItems++;
                                                            }
                                                        }
                                                    }
                                                );
                                            } else {
                                                icon.classList.remove(
                                                    "fa-caret-down"
                                                );
                                                icon.classList.add(
                                                    "fa-caret-right"
                                                );

                                                folderItems.forEach(
                                                    (folder) => {
                                                        if (
                                                            folder.dataset
                                                                .isFolder != "1"
                                                        ) {
                                                            folder.style.display =
                                                                "none";
                                                            if (
                                                                folder.dataset
                                                                    .itemSelected ==
                                                                "1"
                                                            ) {
                                                                selectedItems++;
                                                            }
                                                        }
                                                    }
                                                );
                                            }

                                            if (
                                                selectedItems > 0 &&
                                                icon.classList.contains(
                                                    "fa-caret-right"
                                                )
                                            ) {
                                                item.classList.add("open");
                                            } else {
                                                item.classList.remove("open");
                                            }
                                        };

                                        resourceColor.appendChild(icon);
                                    } else if (
                                        item.dataset.isNone == "1" ||
                                        item.dataset.folderSortID == "undefined"
                                    ) {
                                        item.onclick = function () {
                                            toggleResource(item);
                                        };
                                        item.classList.add(
                                            "folderBackgroundColor"
                                        );
                                        resourceColor.classList =
                                            "resourceColor";
                                    } else {
                                        item.onclick = function () {
                                            toggleResource(item);
                                        };
                                        item.classList.add(
                                            "resourceBackgroundColor"
                                        );
                                        resourceColor.classList =
                                            "resourceColor";
                                        resourceName.classList.add("indented");
                                    }

                                    item.appendChild(resourceColor);
                                    item.appendChild(resourceName);

                                    scrollableDiv.appendChild(item);
                                });

                                tab.appendChild(scrollableDiv);

                                // Adjust height of scrollable area to maximum item count
                                let selectListItem =
                                    document.querySelector(".resourceName");
                                let itemHeight =
                                    selectListItem.clientHeight > 0
                                        ? selectListItem.clientHeight
                                        : 40;
                                let maxHeight =
                                    itemHeight *
                                    Math.min(
                                        statuses.length,
                                        inputs.multiUpdatePanel.maxItemsInList
                                    );

                                if (selectListItem) {
                                    scrollableDiv.style.maxHeight =
                                        maxHeight + "px";
                                    scrollableDiv.style.minHeight =
                                        maxHeight + "px";
                                }
                            });
                        }
                    } else if (++retries <= maxRetries) {
                        setTimeout(checkContainerLoaded, 20);
                    }
                }
            }
        } else {
            helpers.showMessage("Please select one or more events", 0, 3000);
        }
    }

    // Generic Event changes confirmation function that takes an object
    // of values that should be applied to the editEvent object for all
    // selected events

    function confirmEventChanges(eventChanges) {
        var multiSelect = seedcodeCalendar.get("multiSelect");
        var itemCount =
            multiSelect !== undefined ? Object.keys(multiSelect).length : 0;

        if (itemCount > 0) {
            utilities.showModal(
                "Confirm Changes",
                "Please confirm you want to update " + itemCount + " events",
                "Cancel",
                function () {},
                "Confirm",
                function () {
                    updateEvents(multiSelect, eventChanges);
                }
            );
        } else {
            helpers.showMessage("Please select one or more events", 0, 3000);
        }
    }

    // Example button access restriciton function that checks if a button should be shown or not

    function restrictButtonAccess(buttonName) {
        // Validate access for specific named buttons
        if (
            buttonName === "Sales Workflow" &&
            inputs.accountName !== "Michael Dabrowski"
        ) {
            // Hide Button
            return false;
        }

        // Show button
        return true;
    }

    //----------- End Configuration --------------------

    // Multi Select Update function takes a multiSelect object, and an object of changes
    // to be applied to an event. You can supply any editable event variables that should
    // https://docs.dayback.com/article/124-action-objects-methods#editEvent
    //
    // You should not need to edit below this line.

    function updateEvents(multiSelect, changes) {
        var updatedEventCount = 0;
        var eventCount = Object.keys(multiSelect).length;
        var config = seedcodeCalendar.get("config");

        var updatingModalDiv;
        var updatingTimeout;
        var isUndo = false;
        var updatingModalStyle = {
            height: "auto",
            width: "400px",
            "margin-top": "20%"
        };
        var updatingModalContentStyle = {
            background: "rgba(0,0,0,0.75)",
            color: "white"
        };
        var revertMessage =
            '<span class="message-icon-separator success">' +
            '<i class="fa fa-lg fa-check"></i>' +
            "</span>" +
            "<span translate>Selected Events Updated</span>" +
            '<span class="message-separator"> | </span>' +
            "<span translate>Undo</span>" +
            '<span class="message-icon-separator" style="opacity: 0.8;"><i class="fa fa-lg fa-undo"></i></span>';

        showUpdatingModal();

        Object.keys(multiSelect).forEach(function (ce) {
            var changesObject = {};

            // Predefine resources array if we are having an add or remove operation

            if (
                changes.hasOwnProperty("addResources") ||
                changes.hasOwnProperty("removeResources")
            ) {
                changesObject["resource"] = multiSelect[ce].event[
                    "resource"
                ].map((e) => e);
            }

            Object.keys(changes).forEach(function (property) {
                if (property === "start" || property === "end") {
                    if (moment.isDuration(changes[property])) {
                        changesObject[property] = multiSelect[ce].event[
                            property
                        ]
                            .clone()
                            .add(moment.duration(changes[property]));
                    } else {
                        changesObject[property] = moment(changes[property]);
                    }
                } else if (
                    property == "addResources" &&
                    Array.isArray(changes[property])
                ) {
                    if (
                        !Array.isArray(changesObject["resource"]) ||
                        (changesObject["resource"].length == 1 &&
                            changesObject["resource"][0] == "none")
                    ) {
                        changesObject["resource"] = [];
                    }

                    changes[property].forEach((rec) => {
                        if (!changesObject["resource"].includes(rec)) {
                            changesObject["resource"].push(rec);
                        }
                    });
                } else if (
                    property == "removeResources" &&
                    Array.isArray(changes[property])
                ) {
                    if (!Array.isArray(changesObject["resource"])) {
                        changesObject["resource"] = [];
                    }

                    changes[property].forEach((rec) => {
                        if (changesObject["resource"].includes(rec)) {
                            var index = changesObject["resource"].indexOf(rec);
                            if (index !== -1) {
                                changesObject["resource"].splice(index, 1);
                            }
                        }
                    });
                } else if (
                    property == "resource" &&
                    changes["resource"].length == 1 &&
                    changes["resource"][0] == "none"
                ) {
                    changesObject["resource"] = [];
                } else {
                    changesObject[property] = changes[property];
                }
            });
            multiSelect[ce].revertObject = {};
            Object.keys(changesObject).forEach(function (pk) {
                multiSelect[ce].revertObject[pk] = multiSelect[ce].event[pk];
            });

            setUpdatingTimeout(
                "Error occurred during save. Reverting changes.",
                true
            );

            dbk.updateEvent(
                multiSelect[ce].event,
                changesObject,
                recordFailedEdit,
                verifyFinished,
                {
                    isCustomAction: true
                }
            );
        });

        function setUpdatingTimeout(message, revert) {
            clearTimeout(updatingTimeout);
            updatingTimeout = setTimeout(function () {
                dbk.showMessage(message, 0, 3000, "error");
                if (revert && updatedEventCount > 0) {
                    revertChanges(true);
                } else {
                    clearUpdatingModal();
                }
            }, 8000);
        }

        function verifyFinished(
            updatedEvent,
            changesObject,
            revertObject,
            options,
            revertFunc,
            error
        ) {
            var failedEvents;
            var matchingEvent =
                multiSelect[
                    Object.keys(multiSelect).filter(function (mi) {
                        return (
                            multiSelect[mi].event.eventID ===
                            updatedEvent.eventID
                        );
                    })
                ];

            if (updatedEvent && matchingEvent) {
                updatedEventCount += 1;

                if (error) {
                    matchingEvent.error =
                        error.error && error.error.message
                            ? error.error.message
                            : error.message
                            ? error.message
                            : error.ERRORCODE
                            ? error.ERRORCODE + " - " + error.DESCRIPTION
                            : error.errorCode
                            ? error.errorCode
                            : "Unknown";
                } else {
                    matchingEvent.updated = true;
                    matchingEvent.sourceEvent = updatedEvent;
                }

                if (updatedEventCount >= eventCount) {
                    clearTimeout(updatingTimeout);
                    clearUpdatingModal();

                    if (isUndo) {
                        helpers.showMessage("Changes Reverted", 0, 3000);
                    } else {
                        failedEvents = Object.keys(multiSelect)
                            .filter(function (key) {
                                return multiSelect[key].error;
                            })
                            .map(function (key) {
                                return multiSelect[key];
                            });

                        if (failedEvents.length > 0) {
                            //One or more updates failed, revert all changes
                            utilities.showModal(
                                "Error during save",
                                failedEvents[0].error +
                                    ". Changes will be reverted.",
                                "continue",
                                revertChanges
                            );
                        } else {
                            //show a custom undo modal
                            helpers.showMessage(
                                revertMessage,
                                0,
                                5000,
                                null,
                                revertChanges
                            );
                        }
                    }
                    setTimeout(function () {
                        action.preventAction = false;
                        config.suppressEditEventMessages = false;
                    }, 50);
                    action.preventAction = false;
                }
            } else {
                clearUpdatingModal();
                if (isUndo) {
                    helpers.showMessage(
                        "Error during save - Unexpected result from editEvent function",
                        0,
                        5000,
                        "error"
                    );
                    setTimeout(function () {
                        action.preventAction = false;
                        config.suppressEditEventMessages = false;
                    }, 50);
                } else {
                    utilities.showModal(
                        "Error during save",
                        "Unexpected result from editEvent function. Changes will be reverted.",
                        "continue",
                        revertChanges
                    );
                }
            }
        }

        function recordFailedEdit(callback, targetEvent, error) {
            verifyFinished(targetEvent, null, null, null, null, error);
        }

        function revertChanges(showError) {
            isUndo = true;
            showUpdatingModal("Reverting Changes...");
            action.preventAction = true;

            if (showError) {
                setUpdatingTimeout(
                    "Error occurred while trying to undo changes - Timeout"
                );
            }
            updatedEventCount = 0;
            eventCount = Object.keys(multiSelect).filter(function (key) {
                return multiSelect[key].updated;
            }).length;

            if (eventCount > 0) {
                for (var key in multiSelect) {
                    if (multiSelect[key].updated) {
                        multiSelect[key].changesObject =
                            multiSelect[key].revertObject;
                        dbk.updateEvent(
                            multiSelect[key].event,
                            multiSelect[key].changesObject,
                            null,
                            verifyFinished,
                            {
                                isCustomAction: true
                            }
                        );
                    }
                }
            } else {
                clearUpdatingModal();
                setTimeout(function () {
                    action.preventAction = false;
                    config.suppressEditEventMessages = false;
                }, 50);
            }
        }

        //Function for modal window
        function showUpdatingModal(message) {
            if (!document.getElementById("eventArrayUpdatingModalDiv")) {
                var headerObject = document.createElement("h4");
                var headerDiv = document.createElement("div");
                var modalContentObject = document.createElement("div");
                var modalMainDiv = document.createElement("div");
                updatingModalDiv = document.createElement("div");
                updatingModalDiv.className = "modal fade in";
                updatingModalDiv.style.display = "block";
                modalMainDiv.className = "modal-dialog";
                Object.assign(modalMainDiv.style, updatingModalStyle);
                modalContentObject.className = "modal-content";
                Object.assign(
                    modalContentObject.style,
                    updatingModalContentStyle
                );
                headerDiv.className = "pad-large text-center";
                headerObject.innerText = "Updating Selected Events...";
                headerDiv.appendChild(headerObject);
                modalContentObject.appendChild(headerDiv);
                modalMainDiv.appendChild(modalContentObject);
                updatingModalDiv.appendChild(modalMainDiv);
                updatingModalDiv.id = "eventArrayUpdatingModalDiv";
                document.body.appendChild(updatingModalDiv);
            }
            config.suppressEditEventMessages = true;
        }

        // Function for clearing modal window
        function clearUpdatingModal() {
            // Remove the updating modal div
            updatingModalDiv = document.getElementById(
                "eventArrayUpdatingModalDiv"
            );
            if (updatingModalDiv) {
                document.body.removeChild(updatingModalDiv);
            }
            setTimeout(function () {
                config.suppressEditEventMessages = false;
            }, 500);
        }
    }

    // Delete Events

    function deleteEvents(multiSelect) {
        var deletedEventCount = 0;
        var errorCount = 0;
        var errorMessages = [];

        var eventCount = Object.keys(multiSelect).length;
        var config = seedcodeCalendar.get("config");

        var updatingModalDiv;
        var updatingTimeout;
        var isUndo = false;
        var updatingModalStyle = {
            height: "auto",
            width: "400px",
            "margin-top": "20%"
        };
        var updatingModalContentStyle = {
            background: "rgba(0,0,0,0.75)",
            color: "white"
        };
        var deleteConfirmedMessage =
            '<span class="message-icon-separator success">' +
            '<i class="fa fa-lg fa-times" style="color: red"></i>' +
            "</span>" +
            "<span translate>Selected Events Deleted</span>" +
            '<span class="message-separator"> | </span>' +
            "<span translate>Undo</span>" +
            '<span class="message-icon-separator" style="opacity: 0.8;"><i class="fa fa-lg fa-undo"></i></span>';

        showDeletingModal();

        Object.keys(multiSelect).forEach(function (ce) {
            setDeletingTimeout("Error occurred during delete.", true);
            dbk.deleteEvent({
                event: multiSelect[ce].event,
                callback: function (error) {
                    verifyDeleted(error, multiSelect, ce, event);
                }
            });
        });

        function setDeletingTimeout(message, revert) {
            clearTimeout(updatingTimeout);
            updatingTimeout = setTimeout(function () {
                dbk.showMessage(message, 0, 3000, "error");
                if (revert && deletedEventCount > 0) {
                    revertDeletes(true);
                } else {
                    clearDeletingModal();
                }
            }, 10000);
        }

        function verifyDeleted(error, multiSelect, ce, event) {
            if (error === undefined || !error.hasOwnProperty("error")) {
                deletedEventCount++;
                multiSelect[ce].deleted = true;
            } else if (error) {
                errorCount++;
                errorMessages.push(
                    error.error && error.error.message
                        ? error.error.message
                        : error.message
                        ? error.message
                        : error.ERRORCODE
                        ? error.ERRORCODE + " - " + error.DESCRIPTION
                        : error.errorCode
                        ? error.errorCode
                        : "Unknown"
                );
            }

            if (deletedEventCount + errorCount >= eventCount) {
                clearTimeout(updatingTimeout);
                clearDeletingModal();

                if (errorMessages.length > 0) {
                    // One or more updates failed. No reversion function at this time.
                    utilities.showModal(
                        "Error during save",
                        errorMessages[0].error + ".",
                        "continue",
                        null
                    );
                } else {
                    // Show delete confirmation

                    helpers.showMessage(
                        deleteConfirmedMessage,
                        0,
                        10000,
                        null,
                        revertDeletes
                    );
                }
            }
        }

        function revertDeletes(showError) {
            action.preventAction = true;
            config.suppressEditEventMessages = true;

            if (showError) {
                setUpdatingTimeout(
                    "Error occurred while trying to undo deletes - Timeout"
                );
            }

            deletedEventCount = 0;

            var deletedEvents = Object.keys(multiSelect)
                .filter(function (key) {
                    return multiSelect[key].deleted;
                })
                .map(function (key) {
                    return multiSelect[key].event;
                });

            if (deletedEvents.length > 0) {
                showUndeletingModal("Undeleting Events ...");
                undoDeleteEvent(deletedEvents);
            }
        }

        // Delete Event functions
        function undoDeleteEvent(events, isRedo = false) {
            action.preventAction = true;

            // Iterate over each unique scheule
            var calendarIDs = Array.from(
                new Set(events.map((event) => event.schedule.id))
            );

            undeleteByCalendar();

            // Undeletes must be done using a callback promise to shift to next
            // block of events, otherwise race condition from createEvent() function
            // unsets message suppression too early.

            function undeleteByCalendar() {
                if (calendarIDs.length < 1) {
                    clearUndeletingModal();

                    helpers.showMessage(
                        '<span class="message-icon-separator success"><i class="fa fa-lg fa-check success"></i></span> Reverted Delete',
                        0,
                        3000
                    );
                    
                    seedcodeCalendar.init("multiSelect", undefined);
                    return;
                }

                var calendarID = calendarIDs.shift();

                var calendarEvents = events.filter(function (event) {
                    return event.schedule.id == calendarID;
                });

                dbk.createEvent({
                    event: calendarEvents,
                    calendarID: calendarID,
                    calendarName: calendarEvents[0].schedule.name,
                    renderEvent: true,
                    isUndo: true,
                    callback: function () {
                        undeleteByCalendar();
                    }
                });
            }

            return true;
        }

        // Function for modal window
        function showDeletingModal() {
            if (!document.getElementById("eventArrayUpdatingModalDiv")) {
                var headerObject = document.createElement("h4");
                var headerDiv = document.createElement("div");
                var modalContentObject = document.createElement("div");
                var modalMainDiv = document.createElement("div");
                updatingModalDiv = document.createElement("div");
                updatingModalDiv.className = "modal fade in";
                updatingModalDiv.style.display = "block";
                modalMainDiv.className = "modal-dialog";
                Object.assign(modalMainDiv.style, updatingModalStyle);
                modalContentObject.className = "modal-content";
                Object.assign(
                    modalContentObject.style,
                    updatingModalContentStyle
                );
                headerDiv.className = "pad-large text-center";
                headerObject.innerText = "Deleting Selected Events...";
                headerDiv.appendChild(headerObject);
                modalContentObject.appendChild(headerDiv);
                modalMainDiv.appendChild(modalContentObject);
                updatingModalDiv.appendChild(modalMainDiv);
                updatingModalDiv.id = "eventArrayUpdatingModalDiv";
                document.body.appendChild(updatingModalDiv);
            }
            config.suppressEditEventMessages = true;
        }

        //Function for modal window
        function showUndeletingModal(message) {
            if (!document.getElementById("eventArrayUndeletingModalDiv")) {
                var headerObject = document.createElement("h4");
                var headerDiv = document.createElement("div");
                var modalContentObject = document.createElement("div");
                var modalMainDiv = document.createElement("div");
                updatingModalDiv = document.createElement("div");
                updatingModalDiv.className = "modal fade in";
                updatingModalDiv.style.display = "block";
                modalMainDiv.className = "modal-dialog";
                Object.assign(modalMainDiv.style, updatingModalStyle);
                modalContentObject.className = "modal-content";
                Object.assign(
                    modalContentObject.style,
                    updatingModalContentStyle
                );
                headerDiv.className = "pad-large text-center";
                headerObject.innerText = message;
                headerDiv.appendChild(headerObject);
                modalContentObject.appendChild(headerDiv);
                modalMainDiv.appendChild(modalContentObject);
                updatingModalDiv.appendChild(modalMainDiv);
                updatingModalDiv.id = "eventArrayUndeletingModalDiv";
                document.body.appendChild(updatingModalDiv);
            }
            config.suppressEditEventMessages = true;
        }

        // Function for clearing modal window
        function clearDeletingModal() {
            // Remove the updating modal div
            updatingModalDiv = document.getElementById(
                "eventArrayUpdatingModalDiv"
            );
            if (updatingModalDiv) {
                document.body.removeChild(updatingModalDiv);
            }
        }

        // Function for clearing modal window
        function clearUndeletingModal() {
            // Remove the updating modal div
            updatingModalDiv = document.getElementById(
                "eventArrayUndeletingModalDiv"
            );
            if (updatingModalDiv) {
                document.body.removeChild(updatingModalDiv);
            }
            config.suppressEditEventMessages = false;
        }
    }

    // End Multi Select Update Code
} catch (error) {
    reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
    // Define variables that wait for parent CSS page element to be loaded
    var maxRetries = 20;
    var retries = 0;

    // Create the button drawer while checking CSS parent element load status
    createButtonDrawer();

    // Once all is loaded, confirm callback and run other functions configured for this handler
    return confirmCallback();

    // Handle creation of button
    function createButtonDrawer() {
        var cssGroupName = options.cssGroupName;
        var drawerBtnContainer;
        var drawerBtn;
        var drawerBtnI;
        var drawerBtnUlList;

        var rootBtnContainer = document.querySelector(
            ".calendar-button-container"
        );

        if (rootBtnContainer) {
            // Add Drawer Container
            drawerBtnContainer = document.createElement("div");
            drawerBtnContainer.id = options.cssGroupName + "_containerId";
            drawerBtnContainer.classList = inputs.showContainer
                ? cssGroupName + "_container"
                : cssGroupName + "_container_static";
            drawerBtnContainer.style.cursor = "pointer";

            // Add Drawer Button
            drawerBtn = document.createElement("div");
            drawerBtn.id = cssGroupName + "Icon";
            drawerBtn.dataset.rotatedFlag = 0;
            drawerBtn.classList =
                cssGroupName + " " + cssGroupName + "_icon_holder";
            drawerBtn.onclick = drawerButtonClick;

            // Add Drawer Button Icon
            drawerBtnI = document.createElement("i");
            drawerBtnI.id = cssGroupName + "IconClass";
            drawerBtnI.classList = "fa";

            // Add a Button Container Drawer if we have a multi-button group
            // Otherwise allow users to display a static list of buttons, or
            // single button if they don't need more than one.

            if (inputs.showContainer) {
                // Add Button Icon to Container
                drawerBtn.append(drawerBtnI);
                drawerBtnContainer.append(drawerBtn);

                // Add Sub List to Container
                drawerBtnUlList = document.createElement("ul");
                drawerBtnUlList.id = cssGroupName + "IconOptionList";
                drawerBtnUlList.classList =
                    cssGroupName +
                    "_options " +
                    cssGroupName +
                    "_option_hidden";
            } else {
                // Add Sub List to Container
                drawerBtnUlList = document.createElement("ul");
                drawerBtnUlList.id = cssGroupName + "IconOptionList";
                drawerBtnUlList.classList = cssGroupName + "_options_static";
            }

            // Build buttons from bottom to top
            for (var i = inputs.buttonList.length - 1; i >= 0; i--) {
                // Grab button object
                var bObj = inputs.buttonList[i];

                // Check permissions
                if (
                    bObj.hasOwnProperty("restrict") &&
                    bObj.restrict() == false
                ) {
                    continue;
                }

                // Make list element containing sub-buttons
                var btnLi = document.createElement("il");
                var btnLi_span = document.createElement("span");
                var btnLi_contDiv = document.createElement("div");
                var btnLi_div = document.createElement("div");
                var btnLi_i = document.createElement("i");
                var labelId = cssGroupName + "_IconLabel_" + i;
                var labelText;

                btnLi_div.id = cssGroupName + "_IconDiv_" + i;
                btnLi.classList = inputs.showContainer
                    ? cssGroupName + "_options_li"
                    : cssGroupName + "_options_li_static";

                if (bObj.hasOwnProperty("uniqueId") && bObj.id !== null) {
                    btnLi.id = bObj.uniqueId;
                }

                if (bObj.hasOwnProperty("color") && bObj.label !== null) {
                    btnLi_div.style.background = bObj.color;
                }

                if (bObj.hasOwnProperty("label") && bObj.label !== null) {
                    btnLi_span.id = labelId;
                    labelText = bObj.label;

                    if (inputs.showContainer) {
                        btnLi_span.innerText = labelText;
                        btnLi_span.classList = cssGroupName + "_label ";
                        btnLi_contDiv.classList =
                            cssGroupName + "_sub_icon_container";
                        btnLi_div.classList = cssGroupName + "_sub_icon_holder";
                        btnLi_i.classList = "fa " + bObj.icon;
                    } else {
                        btnLi_span.classList = cssGroupName + "_label_locked ";
                        btnLi_contDiv.classList =
                            cssGroupName + "_sub_icon_container_static";
                        btnLi_div.classList =
                            cssGroupName + "_sub_icon_holder_static";
                        btnLi_i.classList = "fa " + bObj.icon;

                        btnLi_div.addEventListener(
                            "mouseover",
                            (function (l_id, l_text) {
                                return function (e) {
                                    toggleLabel(e, l_id, l_text);
                                };
                            })(labelId, labelText),
                            false
                        );
                        btnLi_div.addEventListener(
                            "mouseout",
                            (function (l_id, l_text) {
                                return function (e) {
                                    toggleLabel(e, l_id, l_text);
                                };
                            })(labelId, ""),
                            false
                        );
                    }
                } else {
                    btnLi_span.id = labelId;
                    labelText = bObj.label;

                    if (inputs.showContainer) {
                        btnLi_span.innerText = labelText;
                        btnLi_span.classList = cssGroupName + "_label ";
                        btnLi_contDiv.classList =
                            cssGroupName + "_sub_icon_container";
                        btnLi_div.classList = cssGroupName + "_sub_icon_holder";
                        btnLi_i.classList = "fa " + bObj.icon;
                    } else {
                        btnLi_span.classList = cssGroupName + "_label_locked ";
                        btnLi_contDiv.classList =
                            cssGroupName + "_sub_icon_container_static";
                        btnLi_div.classList =
                            cssGroupName + "_sub_icon_holder_static";
                        btnLi_i.classList = "fa " + bObj.icon;

                        btnLi_div.addEventListener(
                            "mouseover",
                            (function (l_id, l_text) {
                                return function (e) {
                                    toggleLabel(e, l_id, l_text);
                                };
                            })(labelId, labelText),
                            false
                        );
                        btnLi_div.addEventListener(
                            "mouseout",
                            (function (l_id, l_text) {
                                return function (e) {
                                    toggleLabel(e, l_id, l_text);
                                };
                            })(labelId, ""),
                            false
                        );
                    }
                }

                // Add Button click listener
                btnLi_div.addEventListener("click", bObj.action, false);

                // Add Button to button
                btnLi_div.append(btnLi_i);

                if (bObj.hasOwnProperty("label") && bObj.label !== null) {
                    btnLi.append(btnLi_span);
                }
                btnLi_contDiv.append(btnLi_div);
                btnLi.append(btnLi_contDiv);
                drawerBtnUlList.append(btnLi);
            }

            // Append button list to final container
            drawerBtnContainer.append(drawerBtnUlList);
            rootBtnContainer.append(drawerBtnContainer);

            // Open the button drawer if we are using the container
            // drawer and user specified it should be open by default
            if (
                inputs.showContainer == true &&
                inputs.showContainerAsOpen == true
            ) {
                drawerButtonClick();
            }
        } else if (++retries <= maxRetries) {
            setTimeout(createButtonDrawer, 200);
        }
    }

    // Mouseover Label Making
    function toggleLabel(e, labelId, labelText) {
        var lObj = document.getElementById(labelId);

        if (lObj === null) {
            return;
        }

        lObj.innerText = labelText;
        lObj.classList.toggle(options.cssGroupName + "_label_div_hover");
    }

    function toggleLabelDynamic(e, labelId, labelText, wbIcon) {
        if (wbIcon.dataset.rotatedFlag != 1) {
            return;
        }
        var lObj = document.getElementById(labelId);

        if (lObj === null) {
            return;
        }

        lObj.innerText = labelText;
        lObj.classList.toggle(options.cssGroupName + "_label_locked");
    }

    // Handle drawer click to add lock icon
    function drawerButtonClick() {
        var cssGroupName = options.cssGroupName;
        var wbIcon = document.getElementById(cssGroupName + "Icon");
        var wbIconOptionList = document.getElementById(
            cssGroupName + "IconOptionList"
        );

        // Change icon to lock and rotate
        if (!wbIcon.dataset.rotatedFlag || wbIcon.dataset.rotatedFlag == 0) {
            wbIcon.dataset.rotatedFlag = 1;
            wbIconOptionList.classList.remove(cssGroupName + "_option_hidden");
            wbIcon.classList =
                cssGroupName + "_locked " + cssGroupName + "_icon_holder_lock";
        } else {
            wbIcon.dataset.rotatedFlag = 0;
            wbIconOptionList.classList.add(cssGroupName + "_option_hidden");
            wbIcon.classList =
                cssGroupName + " " + cssGroupName + "_icon_holder";
        }

        // Remove labels
        for (var i = inputs.buttonList.length - 1; i >= 0; i--) {
            var labelId = cssGroupName + "_IconLabel_" + i;
            var bObj = inputs.buttonList[i];
            var lObj = document.getElementById(labelId);
            var dObj = document.getElementById(cssGroupName + "_IconDiv_" + i);

            if (lObj === null) {
                continue;
            }

            var labelText =
                bObj.hasOwnProperty("label") && bObj.label !== null
                    ? bObj.label
                    : null;
            lObj.innerText =
                labelText !== null && lObj.innerText == "" ? labelText : null;

            // Add mouseover handing functions to remove label text
            var mOverHandler = (function (l_id, l_text, l_rot) {
                return function (e) {
                    toggleLabelDynamic(e, l_id, l_text, l_rot);
                };
            })(labelId, labelText, wbIcon);
            var mOutHandler = (function (l_id, l_text, l_rot) {
                return function (e) {
                    toggleLabelDynamic(e, l_id, l_text, l_rot);
                };
            })(labelId, "", wbIcon);

            dObj.addEventListener("mouseover", mOverHandler, false);
            dObj.addEventListener("mouseout", mOutHandler, false);
            lObj.classList.toggle(cssGroupName + "_label_locked");
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
