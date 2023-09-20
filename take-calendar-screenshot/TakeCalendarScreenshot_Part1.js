// Take Calendar Screenshot - Part 1 v2.0
//
// Purpose:
// Adds a button which allows you to take a screen shot of the
// calendar and save it as a PNG. Screenshot can be configured for
// multiple sizes. This is Part 1 of a 2-part Custom App Action
// button can be displayed for all, or just specific users. Button
// will be available on all views. If you only want it visible on
// certian views, modify Part 2 of this Custom App Action, otherwise
// install Part 2 of the action, unmodified. 
// 
// Action Type: Before Calendar Rendered
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

        // -----------------------------------------------------------------------------
        // 'TAKE SCREENSHOT' BUTTON CONFIGURATION
        // -----------------------------------------------------------------------------

        // Define the CSS class group name used for styling the button and button drawer.
        // You may duplicate this app action multiple times if you wish to create multiple
        // groups of buttons. If you want the button group to be styles differently
        // you will need to use a different set of CSS class names by copying all the
        // custom_btn CSS classes, and giving them a new CSS class group name. If you only
        // intend to create one group of buttons, you may leave this option set to custom_btn
        // by default:

        options.cssGroupName = 'custom_btn';

        // Defines whether you wish to have a parent button that acts like a container
        // drawer for multiple sub-buttons. By default this is set to false, as it works
        // best if oyu are defining more than 1 button at a time, or don't want to 
        // clutter your screen with mutiple buttons.
        //
        // If you don't mind having multiple buttons that always appear on the bottom
        // right of the screen, or you just have a single button and don't need a button
        // group container, leave this set to false.

        inputs.showContainer = false;

        // If showing button container drawer, specify if the button should be 
        // closed, or open when DayBack loads. The default is to hide the container
        
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
        //                  when clicked - in thise case, the takeScreenshot function.
        //
        //      label:      Define a label name that should appear next to your button.
        //                  This is optional, and does not need to be defined if 
        //                  you don't need a label next to your button.
        //
        //      color:      Specify a button's color (e.g., #FFFFF or white, or 
        //                  rgb(256,256,256)). The color is optional. If you omit
        //                  color the default color will be used.
        //      
        //      restrict:   By default a button will be shown to all accounts. To
        //                  only show the button for certain users, please specify
        //                  the list of account names as a comma-separated list:
        //
        //                  restrict: [ 'John Smith','Jane Doe' ]
        //                                  - or - 
        //                  restrict: [ 'showButtonForAllAccounts' ]
        //
        //      uniqueId:   Specify a unique ID of the button. This ID can be used
        //                  Custom App Actions to show/hide a button on specific 
        //                  pages. To specify which buttons show on which view pages
        //                  please also install the Hide Custom Button On View Change
        //                  custom app action.

        // How to specify button icons:
        // ----------------------------
        //
        // Find your Icon's Unicode definition:
        //
        // 1. Locate icon on cheat sheet: https://fontawesome.com/v4.7/icons/
        // 2. Specify the icon using 'fa-' followed by the english name. 
        //    For example: check mark should be specified as fa-check

        // Specify buttons from bottom up

        inputs.buttonList = [{
               'label': 'Take Screenshot',                    
                'icon': 'fa-camera',
               'color': '#72009c',
              'action': customButtonAction_takeScreenshot,
            'restrict': [ 'showButtonForAllAccounts' ]
        }];

        // -----------------------------------------------------------------------------
        // SCREENSHOT FUNCTION CONFIGURATION
        // -----------------------------------------------------------------------------

        // If using FileMaker, specify the name of the filemaker script to run to save image to container

        inputs.fileMakerSaveImageScript = 'Save Screenshot - DayBack';

        // Select default screenshot width and height in pixels

        inputs.screenshotSizeDefault = {
            width: 1900,
            height: 1200
        };
        
        // Screenshot will be taken automatically after a 3 second delay.
        // This is to allow the calendar to adjust the events.
        // If you are using very large screen shot sizes
        // and you ahve a lot of events, you may need to increase
        // this timeout for your organization
        
        options.screenshotTimeDelayInSeconds = 3;
        
        // Ask User for Custom Sizes
        // -------------------------
        //
        // If you do not wish to allow the user to select a screenshot 
        // size, please omit this setting, or define it to null
        //
        //    inputs.screenshotSizeOptions = null;
        //
        // Otherwise, define multiple custom sizes as follows:

        inputs.screenshotSizeOptions = {
            Standard:  { width: 1900, height: 1200 },
            Landscape: { width: 3000, height: 1000 },
            Portrait:  { width: 1200, height: 3000 }
        };

        // If you would like the user to be prompted to provide
        // a custom size in Pixels, please turn this setting to 
        // true.

        inputs.screenshotAllowCustomSize = true;       

        // Optionally, you may wish to hide certain display elements 
        // in screen shots. This default list will hide the screen shot 
        // button and top navigation portion of the page
    
        inputs.hideElementsInScreenshot = [ 'modal', 'modal-backdrop', 'calendar-button-container', 'navigation', 'btn-toolbar', 'view-nav', 'calendar-nav',  ];

        //----------- Define Take Calendar Screenshot button action here -----------

        function customButtonAction_takeScreenshot() {
                                
            var calendarContainer = document.getElementById('calendar-container');
            var calendarScroll = document.querySelector('.calendar-scroll');
            var autoHeight = true;

            // Define Screen Shot Selector Pop-over
            var config = {
                container: document.querySelector('#calendar-container') ? '#calendar-container' : '#app-container',
                type: 'modal', 
                destroy: true,
                show: true,
                width: 650,
                makeImageFunction: makeImage,
                setAutoHeightFunction: function(input) {
                    autoHeight = input;
                },
                autoHeight: autoHeight,
            };

            // Defile progress Counter 
            function progressCountdown(timeleft, maxTime, bar, text) {
              return new Promise((resolve, reject) => {
                var countdownTimer = setInterval(() => {
                  timeleft++;
            
                  document.getElementById(bar).value = timeleft;
                  document.getElementById(text).textContent = maxTime - timeleft;
            
                  if (timeleft >= maxTime) {
                    clearInterval(countdownTimer);
                    resolve(true);
                  }
                }, 1000);
              });
            }

            // Define makeImage function that will be triggered form the popover
            function makeImage(width, height, makeCustomSize = false) {

                // Set height of screenshot automatically
                if (autoHeight) {
                    height = calendarScroll.scrollHeight + calendarScroll.getBoundingClientRect().top;
                }
              
                // Very screen shot and determine valid size ranges for canvas
                if (makeCustomSize == true) {
                   var wObj = document.getElementById('_screenShot_width');
                   var hObj = document.getElementById('_screenShot_height');
                   if (!wObj || !hObj || wObj.value < 100 || hObj.value < 100) {
                        return alert("Could not get Height and Width variables");
                   } else {
                        width = wObj.value; height = hObj.value;
                   }
                } 

                if (!width || !height || width < 100 || height < 100 || width > 10000 || height > 10000) {
                    return alert("Please specify a valid Height and Width in pixels");
                }

                // Hide options and display Please Wait loading screen
                if (document.getElementById('_screenshot_options')) {
                    document.getElementById('_screenshot_options').style.display = 'none';
                } 
                if (document.getElementById('_screenshot_pleaseWait')) {
                    document.getElementById('_screenshot_pleaseWait').style.display = 'block';             
                }

                // Check sidebar visibily
                var sidebarIsVisible = false;
                var sidebar = document.getElementsByClassName("sidebar-toggle");

                if (sidebar && sidebar.length > 0) {   
                    var style = getComputedStyle(sidebar[0]);
                    sidebarIsVisible = style.display === 'none' ? false : true;
                }

                if (sidebarIsVisible) {
                    location.hash = '#/?sidebarShow=false';
                }

                //Adjust current calendar size
                document.body.style.width = width + 'px';
                document.body.style.height = height + 'px';
                calendarContainer.style.width = width + 'px';
                calendarContainer.style.height = height + 'px';
                dbk.resetResources();

                //Center the modal                
                document.querySelector('.modal-dialog').style.marginLeft = ((innerWidth - 650) / 2) + 'px'

                //Hide the calendar scroll bar
                if (calendarScroll){
                    calendarScroll.style.overflow = 'hidden';
                }


                // Start progress countdown and run screenshot function when countdown ends
                progressCountdown(0, options.screenshotTimeDelayInSeconds, '_pageBeginCountdown', '_pageBeginCountdownText').then(value => {

                    // Take canvas screenshot
                    html2canvas(calendarContainer, {width: width, height: height, ignoreElements: ignoreElementsFunction}).then(function(canvas) {
                        const image = canvas.toDataURL('image/png');

                        // Download the image or send to FileMaker script
                        if (utilities.getDBKPlatform() === 'dbkfmjs'){
                            dbk.performFileMakerScript(inputs.fileMakerSaveImageScript, image.split(',')[1]);
                        } else {
                            const stream = image.replace('image/png', 'image/octet-stream')
                            const a = document.createElement('a');
                            a.setAttribute('download', 'dayback.png');
                            a.setAttribute('href', stream);
                            a.click();
                        }
                        canvas.remove();
                        
                        // Close popover
                        document.getElementById('_popoverCloseButton').click();

                        // Reset sidebar visibility if we switched it off in the canvas
                        if (sidebarIsVisible) {
                            location.hash = '#/?sidebarShow=true';
                        }

                        // Reset document width and height
                        document.body.style.width = null;
                        document.body.style.height = null;
                        calendarContainer.style.width = null;
                        calendarContainer.style.height = null;
                        dbk.resetResources();

                        // Reset the calendar scroll bar
                        if (calendarScroll){
                            calendarScroll.style.overflow = null;
                        }
                    });
                    

                    function ignoreElementsFunction(element){
                        for (var i = 0; i < inputs.hideElementsInScreenshot.length; i++) {
                            if (element.classList.contains(inputs.hideElementsInScreenshot[i])) {
                                return true;
                            }
                        }
                    }
                });
            }
            
            var template = '<div style="background: rgba(0,0,0,0.75); color: white;">' + '<div class="pad-large text-center"><a id="_popoverCloseButton" ng-click="popover.config.show = false;" style="float: right; cursor: pointer; color: white; font-size: 1.5rem;"><span class="fa fa-times"></span></a>';
            var progressBar = '<h4><div class="fa fa-spinner fa-spin" style="color: #5cb85c;"></div>&nbsp;&nbsp;Please Wait ...</h4><BR>' +
            '<progress value="0" max="' + options.screenshotTimeDelayInSeconds + '" id="_pageBeginCountdown"></progress> ' +
            '<p> Taking screenshot in <span id="_pageBeginCountdownText">' + options.screenshotTimeDelayInSeconds + ' </span> seconds</p> ';

            // If we have no size options defined, screenshots are automatic
            if (inputs.screenshotSizeDefault.width  > 0 && 
                inputs.screenshotSizeDefault.height > 0 &&
                (!inputs.hasOwnProperty('screenshotSizeOptions')     || inputs.screenshotSizeOptions === undefined || Object.keys(inputs.screenshotSizeOptions).length < 1) &&
                (!inputs.hasOwnProperty('screenshotAllowCustomSize') || inputs.screenshotAllowCustomSize === false)
            ) {
                template = template + '<div id="_screenshot_pleaseWait" style="display: block;">' + progressBar + '</div>';
                template = template + '<div id="_screenshot_options"></div>';

                config.onShown = function() { 
                    makeImage(inputs.screenshotSizeDefault.width, inputs.screenshotSizeDefault.height); 
                }; 

            } else if ((inputs.hasOwnProperty('screenshotSizeOptions') && Object.keys(inputs.screenshotSizeOptions).length > 1) || inputs.screenshotAllowCustomSize) {
                template = template + '<div id="_screenshot_pleaseWait" style="display: none;">' + progressBar + '</div>';
                template = template + '<div id="_screenshot_options"><h4><div class="fa fa-camera" style="color: #5cb85c;"></div>&nbsp;&nbsp;Please Select Screenshot Size:</h4><BR>';                

                if (inputs.hasOwnProperty('screenshotSizeOptions') && Object.entries(inputs.screenshotSizeOptions).length > 1) {
                    for (const [sizeName, sizeObj] of Object.entries(inputs.screenshotSizeOptions)) {
                        template = template + '<button translate ng-click="popover.config.makeImageFunction(\'' + sizeObj.width + '\', \'' + sizeObj.height + '\');" class="btn btn-xs btn-primary" style="margin: 5px;">' + sizeName + '</button> ';
                    }                
                    if (inputs.screenshotAllowCustomSize) {
                        template = template + '<BR><BR>';
                    }
                }

                if (inputs.screenshotAllowCustomSize) {
                    template = template + 
                    ' <input id="_screenShot_width"  type="number" style="color: black; width: 55px;" SIZE=5 value="' + inputs.screenshotSizeDefault.width + '"> x ' +
                    ' <input id="_screenShot_height" type="number" style="color: black; width: 55px;" SIZE=5 value="' + inputs.screenshotSizeDefault.height + '"> ' +
                    ' <button translate ng-click="popover.config.makeImageFunction(document.getElementById(\'_screenShot_width\').value, document.getElementById(\'_screenShot_height\').value, true);"' +
                    ' class="btn btn-xs btn-success" style="margin: 5px;">Make Custom Size</button><BR><BR>';
                }

                template = template + '<input type="checkbox" ng-checked="true" id="_screenShot_autoHeight" ng-model="popover.config.autoHeight" ng-change="popover.config.setAutoHeightFunction(popover.config.autoHeight);" style="margin: 5px;">&nbsp;&nbsp;Automatically Adjust Height<BR><BR>';
                template = template + '</div>';

            } else {
                template = template + "Screenshot App Action has been misconfigured. Please reference App Action documentation.<BR>" + 
                ' <button translate ng-click="popover.config.show = false;" class="class="btn btn-xs btn-success dbk_button_success">Close</button> ';
            }

            template = template + '</div></div>';

            // Call utility function to evoke modal
            utilities.popover(config, template);
        }

    //----------- End Configuration -------------------        
}
catch(error) {
    reportError(error);
}


//----------- The action itself: you may not need to edit this. -------------------


// Action code goes inside this function
function run() {

    // Load HTML2Canvas library
    var html2Canvas = document.createElement('script');  
    html2Canvas.setAttribute('src','https://cdn.jsdelivr.net/npm/html2canvas@1.3.2/dist/html2canvas.min.js');
    document.head.appendChild(html2Canvas);

    // Define variables that wait for parent CSS page element to be loaded
    var maxRetries = 20;
    var retries    = 0;

    // Create the button drawer while checking CSS parent element load status
    createButtonDrawer();

    // Handle creation of button
    function createButtonDrawer() {

        var cssGroupName = options.cssGroupName;
        var drawerBtnContainer;
        var drawerBtn;
        var drawerBtnI;
        var drawerBtnUlList;
        
        var rootBtnContainer = document.querySelector('.calendar-button-container');

        if (rootBtnContainer) {                        

            // Add Drawer Container
            drawerBtnContainer               = document.createElement('div');
            drawerBtnContainer.id            = options.cssGroupName + "_containerId";
            drawerBtnContainer.classList     = inputs.showContainer ? cssGroupName + '_container' : cssGroupName + '_container_static';
            drawerBtnContainer.style.cursor  = 'pointer';

            // Add Drawer Button
            drawerBtn                        = document.createElement('div');
            drawerBtn.id                     = cssGroupName + 'Icon';
            drawerBtn.dataset.rotatedFlag    = 0;
            drawerBtn.classList              = cssGroupName + ' ' + cssGroupName + '_icon_holder';
            drawerBtn.onclick                = drawerButtonClick;

            // Add Drawer Button Icon
            drawerBtnI                       = document.createElement('i');
            drawerBtnI.id                    = cssGroupName + 'IconClass';
            drawerBtnI.classList             = 'fa';

            // Add a Button Container Drawer if we have a multi-button group
            // Otherwise allow users to display a static list of buttons, or 
            // single button if they don't need more than one.

            if (inputs.showContainer) {

                // Add Button Icon to Container
                drawerBtn.append(drawerBtnI);
                drawerBtnContainer.append(drawerBtn);

                // Add Sub List to Container
                drawerBtnUlList              = document.createElement('ul');
                drawerBtnUlList.id           = cssGroupName + 'IconOptionList';
                drawerBtnUlList.classList    = cssGroupName + '_options ' + cssGroupName + '_option_hidden'; 

            } else {

                // Add Sub List to Container
                drawerBtnUlList              = document.createElement('ul');
                drawerBtnUlList.id           = cssGroupName + 'IconOptionList';
                drawerBtnUlList.classList    = cssGroupName + '_options_static'; 
            }

            // Build buttons from bottom to top
            for (var i = inputs.buttonList.length -1; i >= 0; i--) {                        

                // Grab button object
                var bObj = inputs.buttonList[i];

                // Check permissions
                if (bObj.hasOwnProperty('restrict') && Array.isArray(bObj.restrict) && isButtonAllowed(bObj.restrict) == false) {
                    continue;
                }

                // Make list element containing sub-buttons
                var btnLi                   = document.createElement('il');
                var btnLi_span              = document.createElement('span'); 
                var btnLi_contDiv           = document.createElement('div');
                var btnLi_div               = document.createElement('div');
                var btnLi_i                 = document.createElement('i');
                var labelId                 = cssGroupName + '_IconLabel_' + i;
                var labelText;

                btnLi_div.id                = cssGroupName + '_IconDiv_' + i;
                btnLi.classList             = inputs.showContainer ? cssGroupName + '_options_li' : cssGroupName + '_options_li_static';

                if (bObj.hasOwnProperty('uniqueId') && bObj.id !== null) {
                    btnLi.id = bObj.uniqueId;
                }

                if (bObj.hasOwnProperty('color') && bObj.label !== null) {
                    btnLi_div.style.background = bObj.color;
                }

                if (bObj.hasOwnProperty('label') && bObj.label !== null) {
                    btnLi_span.id = labelId;
                    labelText     = bObj.label; 

                    if (inputs.showContainer) {
                        btnLi_span.innerText        = labelText;
                        btnLi_span.classList        = cssGroupName + '_label ';
                        btnLi_contDiv.classList     = cssGroupName + '_sub_icon_container';
                        btnLi_div.classList         = cssGroupName + '_sub_icon_holder';
                        btnLi_i.classList           = 'fa ' + bObj.icon;
                    } else {                        
                        btnLi_span.classList        = cssGroupName + '_label_locked ';
                        btnLi_contDiv.classList     = cssGroupName + '_sub_icon_container_static';
                        btnLi_div.classList         = cssGroupName + '_sub_icon_holder_static';
                        btnLi_i.classList           = 'fa ' + bObj.icon;

                        btnLi_div.addEventListener('mouseover', (function(l_id, l_text) { return function(e) { toggleLabel(e, l_id, l_text); }; }) (labelId, labelText), false);
                        btnLi_div.addEventListener('mouseout',  (function(l_id, l_text) { return function(e) { toggleLabel(e, l_id, l_text); }; }) (labelId, ''), false);
                    }
                }

                // Add Button click listener
                btnLi_div.addEventListener("click", bObj.action, false);                

                // Add Button to button
                btnLi_div.append(btnLi_i);

                if (bObj.hasOwnProperty('label') && bObj.label !== null) {
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
            if (inputs.showContainer == true && inputs.showContainerAsOpen == true) {
                drawerButtonClick();
            }

        } else if(++retries <= maxRetries){
            setTimeout(createButtonDrawer, 200);
        }
    }

    // Function for checking if button is allowed for a given user

    function isButtonAllowed(accountList = [ 'showButtonForAllAccounts' ]) {
        // Get current user and restrict specific button to certain individuals            
        var accountName = seedcodeCalendar.get('config').accountName;

        // Validate access for specific named buttons
        if (accountList && Array.isArray(accountList) && (accountList.includes(accountName) || accountList.includes('showButtonForAllAccounts'))) {                
            // Show Button
            return true;
        }
        
        // Hide button
        return false;
    }

    // Mouseover Label Making 
    function toggleLabel (e, labelId, labelText) {   
        var lObj = document.getElementById(labelId);

        if (lObj === null) {
            return;
        }

        lObj.innerText = labelText;
        lObj.classList.toggle(options.cssGroupName + '_label_div_hover'); 
    }

    function toggleLabelDynamic (e, labelId, labelText, wbIcon) {   
        if (wbIcon.dataset.rotatedFlag != 1) {
            return;
        }
        var lObj = document.getElementById(labelId);

        if (lObj === null) {
            return;
        }

        lObj.innerText = labelText;
        lObj.classList.toggle(options.cssGroupName + '_label_locked'); 
    }

    // Handle drawer click to add lock icon
    function drawerButtonClick() {
        var cssGroupName        = options.cssGroupName;
        var wbIcon              = document.getElementById(cssGroupName + 'Icon');
        var wbIconOptionList    = document.getElementById(cssGroupName + 'IconOptionList');

        // Change icon to lock and rotate
        if (!wbIcon.dataset.rotatedFlag || wbIcon.dataset.rotatedFlag == 0) {
            wbIcon.dataset.rotatedFlag = 1;
            wbIconOptionList.classList.remove(cssGroupName + '_option_hidden');
            wbIcon.classList = cssGroupName + '_locked ' + cssGroupName + '_icon_holder_lock';
        } else {
            wbIcon.dataset.rotatedFlag = 0;
            wbIconOptionList.classList.add(cssGroupName + '_option_hidden');
            wbIcon.classList = cssGroupName + ' ' + cssGroupName + '_icon_holder';
        }

        // Remove labels
        for (var i = inputs.buttonList.length -1; i >= 0; i--) {           
            var labelId     = cssGroupName + '_IconLabel_' + i;
            var bObj        = inputs.buttonList[i];
            var lObj        = document.getElementById(labelId);
            var dObj        = document.getElementById(cssGroupName + '_IconDiv_' + i);

            if (lObj === null) {
                continue;
            }

            var labelText   = bObj.hasOwnProperty('label') && bObj.label !== null ? bObj.label : null;
            lObj.innerText  = labelText !== null && lObj.innerText == '' ? labelText : null;

            // Add mouseover handing functions to remove label text 
            var mOverHandler = (function(l_id, l_text, l_rot) { return function(e) { toggleLabelDynamic(e, l_id, l_text, l_rot); }; }) (labelId, labelText, wbIcon);
            var mOutHandler  = (function(l_id, l_text, l_rot) { return function(e) { toggleLabelDynamic(e, l_id, l_text, l_rot); }; }) (labelId, '', wbIcon);

            dObj.addEventListener('mouseover', mOverHandler, false);
            dObj.addEventListener('mouseout',  mOutHandler, false);
            lObj.classList.toggle(cssGroupName + '_label_locked');
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
