// local javascript DayBack VF Page.

// You can copy this page and add your own subscription
// events that can be published from DayBack

var DayBack = (function () {
    "use strict";

    var config;
    // Get the initial window height so this works correctly on mobiile.
    var initialWindowHeight = window.innerHeight;

    // Public methods
    return {
        init: init,
        subscribe: subscribe,
        resize: resize,
        publishURL: publishURL,
        openModal: openModal,
        closeModal: closeModal
    };

    // publish our URL parameters to DayBack
    function publishURL() {
        Sfdc.canvas.controller.publish({
            name: 'dbk.url',
            payload: {
                "url": location.search + '&projectID=null&projectName=null&filterProjects=null',
                "location": window.location.pathname,
            }
        });
    }

    // Subscriptions can be called as custom actions
    // from within the dayback canvas app
    // please don't change the stock events:
    // dbk.navigate
    // dbk.resize
    // dbk.retrieveURL
    // but rather add your own events as needed
    // Use the fbk.publish(<eventname>,<payload>) to call these events
    function subscribe() {
        Sfdc.canvas.controller.subscribe(
            [
                // Standard Dayback Navigation event.
                //  '/' + salesforce record id will navigate to that record.
                // payload 'new' property for new window or not.
                {
                    "name": "dbk.navigate",
                    "onData": function (e) {
                        var newTab = e.new;
                        var url = e.url;
                        var id = e.id;
                        var view = e.view;
                        if ((isLightningDesktop() || isMobileOne()) && id) {
                            if (view) {
                                sforce.one.navigateToSObject(id, view);
                            } else {
                                sforce.one.navigateToSObject(id);
                            }
                        } else if (newTab && url) {
                            window.open(url);
                        } else if (url) {
                            window.location.assign(url);
                        }
                    }
                },
                // this allows us to publish a resize event from within dayback
                {
                    "name": "dbk.resize",
                    "onData": function (e) {
                        resize(e);
                    }
                },
                // we call this from dayback after the subscription is activated.
                {
                    "name": "dbk.retriveURL",
                    "onData": function (e) {
                        publishURL();
                    }
                },
                // additional SF1 methods
                {
                    "name": "dbk.navigateToRelatedList",
                    "onData": function (e) {
                        sforce.one.navigateToRelatedList(e.relatedListId, e.parentRecordId);
                    }
                },
                {
                    "name": "dbk.navigateToList",
                    "onData": function (e) {
                        sforce.one.navigateToList(e.listViewId, e.listViewName, e.scope);
                    }
                },
                {
                    "name": "dbk.navigateToList",
                    "onData": function (e) {
                        sforce.one.navigateToList(e.listViewId, e.listViewName, e.scope);
                    }
                },
                {
                    "name": "dbk.createRecord",
                    "onData": function (e) {
                        sforce.one.createRecord(e.entityName, e.recordTypeId, e.defaultFieldValues);
                    }
                },
                {
                    "name": "dbk.editRecord",
                    "onData": function (e) {
                        sforce.one.editRecord(e.recordId);
                    }
                },
                {
                    "name": "dbk.openModal",
                    "onData": function (e) {
                        openModal(e);
                    }
                }

                //#############################################################
                //#############################################################
                //#############################################################
                //add your event subscription events here separated by commas
                //Use a unique name with the dbk prefix
                //follow the syntax from the above events

                //#############################################################
            ] //end array of subscriptions
        );
    }

    // You shouldn't need to edit below this line

    function init(initialConfig) {
        // Assign config to global var
        config = initialConfig;

        // Resize our view so the iframes are sized correctly
        resize();

        // Add resize event listener
        window.addEventListener("resize", function () {
            resize();
        });
    }

    // function for resizing canvas in vf page.
    // Called after load and resize from vf page.

    function resize(e) {
        var height, target;

        // If we are on mobile web we don't want to run
        // resize as there is a salesforce bug currently

        if (isMobileOne()) {
            // Mobile app
            height = getMobileHeight();
        }
        else if (isLightningDesktop()) {
            // Lightning Desktop
            height = window.innerHeight;
        }
        else if (isMobileWeb()) {
            // Mobile web site
            height = getMobileHeight();
        }
        else {
            // Desktop
            height = getHeight();
        }

        target = {
            "canvas": "dbk"
        };

        Sfdc.canvas.controller.resize({
            "height": height + "px"
        }, target);

        // Returns the height we would like to set the iframe height to
        function getHeight() {
            var headerElement, footerElement, bodyElement, bodyOffset, height;
            try {
                headerElement = document.querySelector(".bPageHeader");
                footerElement = document.querySelector(".bPageFooter");
                bodyElement = document.querySelector(".bodyDiv");
                bodyOffset = bodyElement.offsetHeight - bodyElement.clientHeight;

                height = window.innerHeight - headerElement.offsetHeight - footerElement.offsetHeight - bodyOffset;
            } catch (error) {
                height = window.innerHeight - 132;
            }
            return height;
        }

        // Returns the height we would like to set the iframe height to on mobile devices
        function getMobileHeight() {
            var height = initialWindowHeight;
            return height;
        }
    }

    // Functions to determine what platform we are running on
    function isClassicDesktop() {
        var theme = config.theme;
        return theme === 'Theme1' || theme === 'Theme2' || theme === 'Theme3';
    }

    function isLightningDesktop() {
        var theme = config.theme;
        return theme === 'Theme4d' || theme === 'Theme4u';
    }

    function isMobileOne() {
        var theme = config.theme;
        return theme === 'Theme4t';
    }

    // Check if we are on the mobile lightning sites
    function isMobileWeb() {
        var url = window.location.href;
        var matchString = "Host=web";
        return url.indexOf(matchString) > -1;
    }

    // ------------------------------
    // VisualForce Page Modal Support
    // ------------------------------

    // Helper function returns an element by ID
    function _ge(id) {
        return document.getElementById(id);
    }

    // Helper function to get elements by class name
    function openModal(modal) {

        // Define default values for modal properties
        const url = modal.url || '';
        const width = modal.width || '800px';
        const height = modal.height || '500px';
        const title = modal.title || '';
        const headerBackground = modal.headerBackground || '#f4f6f9';
        const callbackName = modal.callbackName || 'defaultCallback';
        const callbackReference = modal.callbackReference || '';

        // Get the modal elements
        const internalModal = _ge('internalModal');
        const modalFrameWrapper = _ge('modalFrameWrapper');
        const modalTitleContainer = _ge('modalTitleContainer');
        const modalCloseSvg = _ge('modalCloseSvg');
        const modalTitle = _ge('modalTitle');

        // Reset the modal content
        modalFrameWrapper.innerHTML = '';
        modalTitle.textContent = title;
        modalTitleContainer.style.backgroundColor = headerBackground;

        // Set the modal title container styles if a custom background color is provided
        if (modal.headerBackground) {
            const contrastingColor = getContrastingTextColor(modalTitleContainer);
            modalTitleContainer.style.color = contrastingColor;
            modalCloseSvg.style.fill = contrastingColor;
        }

        // Create the iframe and load the internal URL    
        const iframe = document.createElement('iframe');
        iframe.style.width = width;
        iframe.style.height = height;
        iframe.style.border = 'none';
        iframe.src = url;

        // Add the frame to the modal frame wrapper and display the modal
        modalFrameWrapper.appendChild(iframe);
        internalModal.dataset.callbackName = callbackName;
        internalModal.dataset.callbackReference = callbackReference;
        internalModal.style.display = 'flex';
    }

    // Function to close the modal
    function closeModal() {
        const internalModal = _ge('internalModal');
        internalModal.style.display = 'none';

        // Send a message to DayBack that the modal has been closed
        // passing the callback name and reference
        Sfdc.canvas.controller.publish({
            name: 'dbk.modalClosed',
            payload: {
                message: 'Modal has been closed.',
                callbackName: internalModal.dataset.callbackName || 'defaultCallback',
                callbackReference: internalModal.dataset.callbackReference || ''
            }
        });
    }

    // Function to get a contrasting text color based on the background color
    function getContrastingTextColor(element, threshold = 0.45) {
        const bgColor = window.getComputedStyle(element).backgroundColor;

        const rgb = bgColor.match(/\d+/g);
        if (!rgb) return 'white'; // fallback

        const [r, g, b] = rgb.slice(0, 3).map(Number).map(c => {
            c /= 255;
            return c <= 0.03928
                ? c / 12.92
                : Math.pow((c + 0.055) / 1.055, 2.4);
        });

        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

        return luminance > threshold ? 'black' : 'white';
    }

}());
