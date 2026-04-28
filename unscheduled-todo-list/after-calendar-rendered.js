// Unscheduled To Do Items v1.0 - Part 1 of 6
//
// Purpose:
// Adds support for Unscheduled To Do Items into the Unscheduled
// side bar. Items can be sorted through drag and drop and
// new items can be added from a quick access menu. 
//
// Action Type: After Calendar Rendered
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

    options.runTimeout = 8;

    // Defines the current account name running this action. Leave this defined
    // to the default. You may use the inputs.restrictedToAccounts to restrict action to 
    // certain individuals; leave empty to enable it for everyone. 

    inputs.account = seedcodeCalendar.get('config').accountName;

    // Note that if you restrict this action for some accounts, 
    // All To Do Items created will show for all users. 

    options.restrictedToAccounts = [];

    // If instead you wish to enable To Do creation only for some users, 
    // but still hide To Do items that are not applicable to others,
    // define who has access to create To Dos. Leave blank if you wish
    // to allow all users to create To Dos.

    inputs.accountsAllowedToCreateToDos = [
        // Leave Blank to allow all users to make To Dos, otherwise
        // specify specific users:
        // 'First Last 1',
        // 'First Last 2',
        // ...
    ];

    // Make regular unscheduled events sortable

    inputs.unscheduledSortableFlag = true;

    // Define whether newly-added unscheduled and To Do events appear at the top, or on
    // bottom of the unscheduled event drawer

    inputs.newEventsOnTop = false;

    // This app action requires the definition of at 3 custom fields:
    //
    //    sortSequence   - stores the sort order of an unscheduled event or To Do event
    //    todoItemFlag   - a checkbox field indicating whether an event is a To Do event
    //    todoItemStatus - a checkbox field indicating whether a To Do event is complete
    //
    // You must have at least one Calendar Source with Unscheduled events enabled.

    inputs.sequenceFieldName = 'sortSequence';

    inputs.toDoItemFlag = 'toDoItemFlag';

    inputs.toDoStatusFieldName = 'toDoStatus';

    // You can optionally enable audio confirmation of To Do changes.

    inputs.playSounds = true;

    // Show "To Do +" button and form for adding new To Do items?

    inputs.showAddToDoForm = true;

    // Should these items be referred to as a "To Do" List or a "Task" List?

    inputs.listName = 'To-Do';

    // Please define the default Calendar Source, and default Event duration and
    // Event status for your To Do events. When a To Do event is dragged and dropped
    // into the main Calendar, it will take on the Calendar, Event Duration, and Event
    // Status defined below:

    inputs.newToDoDefaults = {
        calendarName: 'SeedCode Shared',
        durationInHours: 1,
        isAllDayEvent: false,
        status: 'Planned'
    };

    // To Do items gain their color from the Status of the underlying Event record. When 
    // users create To Do items, they will be able to pick a status from the list of
    // status codes that you specify. If you only supply a single status code, the list 
    // of options will not be offered and the default status for new To Do Default (specified 
    // above) will be used instead.

    inputs.availableToDoStatuses = ['Hot', 'Not Started', 'Planned', 'Deferred'];

    // ------ You likely won't need to make configuraiton changes below this line ------

    // Define the total amount of time to allow for Sorting long To Do lists.

    inputs.sortFunctionTimeout = 20000;

    // Define what constitutes a Sortable Unscheduled Event. By default all Unscheduled events 
    // that have the Sequence Field Name defined will be considered a Sortable Event. 

    inputs.isSortableEvent = function (event) {
        let sequenceFieldName = dbk.getCustomFieldIdByName(inputs.sequenceFieldName, event.schedule);
        return event.unscheduled && event.schedule.editable &&
            (
                inputs.isToDoEvent(event) ||
                (
                    inputs.unscheduledSortableFlag &&
                    sequenceFieldName &&
                    event.hasOwnProperty(sequenceFieldName)
                )
            ) ? true : false;
    }

    // Define what constitutes a To Do Event. By default all Unscheduled events that have 
    // toDoItemFlag set will be considered a To Do Event. 

    inputs.isToDoEvent = function (event) {
        let toDoItemFlag = dbk.getCustomFieldIdByName(inputs.toDoItemFlag, event.schedule);
        return event.unscheduled && toDoItemFlag && event.hasOwnProperty(toDoItemFlag) && event[toDoItemFlag] == true ? true : false;
    }

    // Define what makes this To Do items applicable to the currently-logged in session
    // By default, we only want to display To Dos that are applicable to our account, and let
    // others manage their own To Do lists. You can, however, crease a To Do item for another
    // user by changing the Event's Resource field. 

    inputs.isToDoApplicable = function (event) {
        return event.resource.includes(inputs.account);
    }

    // By default, all users can create To Dos. This helper function
    // will restrict To Do Creation to only some users.

    inputs.accountAllowedToCreateToDos = function () {
        return !inputs.accountsAllowedToCreateToDos || inputs.accountsAllowedToCreateToDos.length < 1 || inputs.accountsAllowedToCreateToDos.includes(inputs.account) ? true : false;
    }

    //----------- End Configuration -------------------        
}
catch (error) {
    reportError(error);
}


//----------- The action itself: you may not need to edit this. -------------------


// Action code goes inside this function
function run() {

    // A Master To Do object will share all functions and state managemnet
    // variables between all 5 app actions

    let todo = {};

    setDefaults();

    function setDefaults() {

        // Set Master Todo Object defaults

        todo = {

            // Functions typically called from other libraries

            isToDoEvent: inputs.isToDoEvent,
            isToDoApplicable: inputs.isToDoApplicable,
            isSortableEvent: inputs.isSortableEvent,

            afterEventsRendered: afterEventsRendered,
            attachEventListeners: attachEventListeners,

            // Variable Getting/setting functions

            set: (item, value = undefined) => {
                todo.stateVariables[item] = value;
            },

            get: (item) => {
                return todo.stateVariables[item];
            },

            // Multi-time delay helper function starts multiple
            // setTimeout events given an object of timeouts and
            // and functions to call.

            delay: (items) => {

                Object.keys(items).forEach(function (i) {
                    setTimeout(items[i], i);
                });
            },

            // Sounds collection

            sounds: {
                moveComplete: undefined,
                checkedComplete: undefined,
                uncheckComplete: undefined,
            },

            // Internal State Variables

            stateVariables: {
                sequenceFieldName: inputs.sequenceFieldName,
                toDoStatus: inputs.toDoStatusFieldName,
                availableToDoStatuses: inputs.availableToDoStatuses,
                newToDoDefaults: inputs.newToDoDefaults,
                newEventsOnTop: inputs.newEventsOnTop,

                draggingTodoItem: false,
                mouseReleased: false,
                eventClickLock: false,
                enteredEvent: undefined,
                draggedEvent: undefined,
            }
        };

        seedcodeCalendar.init('_todoObject', todo);

        if (inputs.playSounds) {
            setTimeout(function () {
                todo.sounds.moveComplete = new Audio('https://dayback.com/wp-content/calendar_sounds/move.mp3');
                todo.sounds.moveComplete.volume = 0.1;
                todo.sounds.checkedComplete = new Audio('https://dayback.com/wp-content/calendar_sounds/checked.mp3');
                todo.sounds.checkedComplete.volume = 0.2;
                todo.sounds.uncheckComplete = new Audio('https://dayback.com/wp-content/calendar_sounds/unchecked.mp3');
                todo.sounds.uncheckComplete.volume = 0.1;
            }, 1000);
        }

        // Adds a MouseUp listener to detect when native drag drop event concludes  

        document.addEventListener("mouseup", mouseUpListener);

        setTimeout(function () {
            let calendar = document.getElementById('calendar');
            calendar?.addEventListener('mouseenter', clearedEventDragStates);
        }, 1000);

        function mouseUpListener() {
            if (todo.get('draggingTodoItem') == true) {
                todo.set('mouseReleased', true);

                let hiddenCells = document.querySelectorAll('.unscheduledHideOnDrag');
                hiddenCells?.forEach((c) => {
                    c.classList.remove('unscheduledHideOnDrag');
                });
            }
        }

        // Sidebar observers show and hide the Round circles for enough
        // time to allow repaint into Checkbox without flashing

        dbk.observe({
            name: 'unscheduledItemsContainerShowSwatch',
            watch: '.unscheduled .count-header',
            until: '.unscheduled .count-header span',
            then: showSwatches
        });

        dbk.observe({
            name: 'unscheduledItemsContainerHideSwatch',
            watch: '.unscheduled .count-header',
            until: '.unscheduled .count-header .loading-container',
            then: hideSwatches
        });

        function hideSwatches(o) {
            o.stop();
            let cont = document.querySelector('.unscheduled.unscheduled-container');
            cont.classList.add('dbk_notodo');
            cont.classList.remove('dbk_todo');
            setTimeout(() => { o.restart() }, 250);
        }

        function showSwatches(o) {
            o.stop();
            let cont = document.querySelector('.unscheduled.unscheduled-container');
            setTimeout(function () {
                cont.classList.remove('dbk_notodo');
                cont.classList.add('dbk_todo');
            }, 0);
            setTimeout(() => { o.restart() }, 250);
        }
    }

    // Helper function clears the Drag/Drop state if a Dragged To Do
    // item enteres the Calendar space for scheduling.

    function clearedEventDragStates() {
        todo.set('mouseReleased', true);
        todo.set('draggingTodoItem', false);
        todo.set('draggedEvent', null);
        todo.set('enteredevent', null);
    }

    // Helper function plays audio tracks, while shutting down
    // previously-playing loops and restating playback cursor
    // at zero seconds. This prevents users initiating two or
    // more idential playback events simultanously if a long
    // track is running.

    function playSound(sound) {

        if (!inputs.playSounds || !sound) {
            return;
        }

        sound?.pause();
        sound.currentTime = 0;
        sound?.play();
    }

    // Main Helper Functon called from After Events Rendered.
    // Function adds the "Add To-Do" scheduling form and adds
    // state change listeners for filtering events that trigger
    // a repopulation of the event list.

    function afterEventsRendered() {

        // Function builds the Add To Do form

        if (inputs.showAddToDoForm)
            buildAddTodoPanel();

        // After all elements are painted, attach event listeners.
        // Also attach listeners to the textarea filter to detect if the
        // unscheduled event list triggers a change. If a filter results 
        // in a change, we need to reattach all event listeners again 
        // after all objects are loaded. 

        setTimeout(function () {
            todo.attachEventListeners();
            let textarea = document.querySelector('.unscheduled textarea');
            let button = document.querySelector('.unscheduled-filter button');
            textarea.onkeyup = detectChange;
            textarea.onpropertychange = detectChange;
            button.onclick = detectChange;
            function detectChange() {
                setTimeout(todo.attachEventListeners, 50);
            }
        }, 50);

        // Finally, After Events Rendered does not fire on Custom Variable 
        // changes in the case of Unscheduled Events. Due to this, we must 
        // reattach listeners, or detach them if an event is no longer a 
        // todo, or is not applicable for the user. We do this by watching 
        // for all mutations to the unscheduled container, and react to any
        // nodes that are no longer an unscheduled To Do item. 

        let nodeCount = 0;

        setTimeout(function () {
            dbk.observe({
                name: 'unscheduledItemList',
                watch: '.unscheduled.unscheduled-container .list-selector',
                options: { attributes: true, childList: true, subtree: true },
                until: function () {
                    let nodes = document.querySelectorAll('.unscheduled.unscheduled-container .list-selector [role="button"]:not(.unscheduledToDoItem)');
                    if (nodes.length != nodeCount) {
                        nodeCount = nodes.length;
                        return true;
                    }
                    return false;
                },
                then: function (o) {
                    o.stop();
                    // Let all mutations finish processing, and trigger attachment only once
                    // Then restart the observer for subsequent mutations.
                    setTimeout(todo.attachEventListeners, 100);
                    setTimeout(function () { o.restart(); }, 200);
                }
            });
        }, 100);
    }

    // Function called from After Events Rendered to build Add To Do Panel in Unscheduled Side Bar

    function buildAddTodoPanel() {

        dbk.observe({
            name: 'unscheduledItemsContainer',
            watch: '.unscheduled .count-header',
            until: '.unscheduled .count-header span',
            then: (o) => {
                o?.destroy(); setTimeout(buildAddTodoPanelElements, 500);
            }
        });
    }

    // Form building function fires when mutation observer notices that the 
    // Loading Events spinner is replaced with an item count

    function buildAddTodoPanelElements(o) {

        o?.destroy();

        let nanoContent = document.querySelector('.unscheduled .nano-content');
        let itemsContainer = document.querySelector('.unscheduled .count-header');
        let addTodoButton = itemsContainer?.querySelector('.addTodoButton');

        if (addTodoButton !== null || !inputs.accountAllowedToCreateToDos()) {
            return;
        }

        // Add the container for the input textarea and button

        let addToDoContainer = document.createElement('DIV');
        addToDoContainer.classList = 'addTodoContainer';
        addToDoContainer.style.display = 'none';

        let input = document.createElement('TEXTAREA');
        let textarea = document.createElement('TEXTAREA');
        let button = document.createElement('BUTTON');

        input.classList = 'addTodoTitle';
        input.placeholder = 'Title';
        textarea.classList = 'addTodoDescription';
        textarea.placeholder = 'Optional Description';
        button.innerHTML = 'Add';
        button.onclick = addNewItem;

        addToDoContainer.appendChild(input);
        addToDoContainer.appendChild(textarea);

        // Build Status toggles

        let defaults = todo.get('newToDoDefaults');
        let statuses = seedcodeCalendar.get('statuses');
        let statusIcons = todo.get('availableToDoStatuses');
        let iconContainer = document.createElement('DIV');

        iconContainer.classList = 'iconContainer';

        if (statusIcons?.length > 1) {
            statusIcons.forEach((i) => {
                let s = statuses.filter((status) => status.name == i)?.[0];

                let icon = document.createElement('DIV');
                let span = document.createElement('SPAN');
                icon.classList = 'statusIcon';
                icon.dataset.status = s.name;
                span.style.backgroundColor = s.color;

                if (s.name == defaults.status) {
                    icon.classList.add('selectedStatus');
                }
                icon.appendChild(span);
                iconContainer.appendChild(icon);

                const tooltipOptions = {
                    delay: { show: 250, hide: 0 },
                    hide: true,
                    position: "top",
                    targetElement: icon,
                    className: 'blackTooltip'
                };

                // Add custome handlers as tooltip has to be
                // reconstructed given z-index changes post
                // first render

                icon.onmouseover = () => {
                    icon.tooltip.show();
                };

                icon.onmouseleave = () => {
                    icon.tooltip.hide();
                    icon.tooltip = createTooltip(s.name, tooltipOptions);
                };

                setTimeout(() => {
                    icon.tooltip = createTooltip(s.name, tooltipOptions);
                }, 200);

                icon.onclick = () => {

                    let selected = iconContainer.querySelector('.selectedStatus');
                    if (selected) {
                        selected.classList.remove('selectedStatus');
                    }

                    icon.classList.add('selectedStatus');
                };
            });
        }

        iconContainer.appendChild(button);
        addToDoContainer.appendChild(iconContainer);
        itemsContainer.after(addToDoContainer);

        // Add the slide toggle button to load the container

        let div = document.createElement('DIV');
        let i = document.createElement('I');
        let span = document.createElement('SPAN');
        span.innerText = inputs.listName;
        i.classList = 'fa fa-fw fa-plus';

        let iopen = document.createElement('I');
        iopen.classList = 'fa fa-fw fa-caret-down';
        iopen.style.display = 'none';
        iopen.style.position = 'relative';
        iopen.style.top = '1px';

        div.classList = 'addTodoButton';
        div.appendChild(span);
        div.appendChild(i);
        div.appendChild(iopen);

        // Add click handler to manage Add To Do container and manage scroll shadow
        div.onclick = function () {
            $(addToDoContainer).slideToggle(400);
            setTimeout(function () { input.focus() }, 500);

            if (addToDoContainer.classList.contains('panelOpen')) {
                iopen.style.display = 'none';
                i.style.display = 'inline-block';
                addToDoContainer.classList.remove('panelOpen');
                nanoContent.classList.remove('scrollShadow');
            } else {
                iopen.style.display = 'inline-block';
                i.style.display = 'none';
                addToDoContainer.classList.add('panelOpen');
            }

            if (addToDoContainer.classList.contains('panelOpen')) {
                nanoContent.onscroll = checkScroll;
                function checkScroll(event) {
                    if (nanoContent.scrollTop != 0) {
                        nanoContent.classList.add('scrollShadow');
                    } else {
                        nanoContent.classList.remove('scrollShadow');
                    }
                }
            } else {
                nanoContent.onscroll = () => { };
                nanoContent.classList.remove('scrollShadow');
            }
        }

        itemsContainer?.appendChild(div);
    }

    function createTooltip(content, options) {
        if (!options) {
            options = {};
        }

        var toolTipElement = options.targetElement
            ? options.targetElement
            : targetElement;
        var placement = options.placement ? options.placement : 'auto';
        var container = options.container ? options.container : 'body';
        var delay = options.delay >= 0 ? options.delay : 350;
        var hideOnClick = false;

        // Don't initiate if on mobile and hide on click as mobile will hide before it's shown
        if (environment.isMobileDevice && hideOnClick) {
            return;
        }

        var tooltipResult = utilities.tooltip(
            toolTipElement,
            content,
            options.className,
            placement,
            container,
            null,
            delay,
            hideOnClick,
            options
        );

        return tooltipResult;
    }

    // Helper function attaches or re-attaches Drag Drop, and Mouse event listeners
    // ass well as CSS classes to the Unscheduled events in the Unscheduled 
    // event list. Since various things can trigger a repaint, we must also add
    // listeners for state changes that take place within the side panel

    function attachEventListeners() {

        var events = seedcodeCalendar.get('element')?.fullCalendar('unscheduledClientEvents');

        events.forEach(event => {

            let cells = document.querySelectorAll('[data-id="' + event['_id'] + '"]');
            if (!cells) {
                return;
            }

            cells.forEach(cell => {

                // Add checkbox item to all cells. The unscheduledToDoItem class determines
                // the applicability of the checkbox, or the default round icon classes.

                let iconContainer = cell.querySelector('.color-swatch-container');
                let icon = iconContainer?.querySelector('i');
                if (icon) {
                    icon.parentNode.removeChild(icon);
                }

                let i = document.createElement('I');
                i.classList = "fa fa-fw fa-square-o";
                i.style.color = event.color;
                iconContainer?.appendChild(i);

                // For To Do items, add the cell click, and drag handlers

                if (todo.isSortableEvent(event) || (event.schedule.editable && !cell.classList.contains('sortableUnscheduledEvent'))) {

                    if (!cell.dataset?.todoitem || event.forceRecalculate) {

                        event.forceRecalculate = false;
                        cell.dataset.todoitem = true;
                        cell.draggable = true;
                        cell.classList.add('sortableUnscheduledEvent');
                        cell.ondragstart = function (ev) { dragStartHandler(ev, cell, event); };
                        cell.addEventListener("mouseenter", mouseEnterHandler);
                        if (todo.isToDoEvent(event)) {
                            iconContainer.onclick = clickLock;
                        }
                    }

                    if (todo.isToDoEvent(event) && !cell.classList.contains('unscheduledToDoItem')) {
                        cell.classList.add('unscheduledToDoItem');
                        cell.classList.remove('sortableUnscheduledEvent');
                        toggleToDoStatus(cell, event, true);
                        todo.set('eventClickLock', false);
                    }

                } else {
                    cell.dataset.todoitem = false;
                    cell.ondragstart = undefined;
                    cell.removeEventListener("mouseenter", mouseEnterHandler);
                    cell.classList.remove('unscheduledToDoItem');
                    cell.classList.remove('toDoItemComplete');
                }

                // Click handler toggles To Do checkbox state, and locks Popover from Opening.

                function clickLock(ev) {
                    ev?.stopPropagation();
                    todo.set('eventClickLock', true);
                    cell.style.pointerEvents = 'none';
                    toggleToDoStatus(cell, event, false);
                    setTimeout(function () {
                        todo.set('eventClickLock', false);
                        cell.style.pointerEvents = 'auto';
                    }, 250);
                    return true;
                }
            });

            function mouseEnterHandler() {

                if (todo.get('draggingTodoItem') == true && event.unscheduled) {
                    todo.set('enteredEvent', event);

                    if (todo.get('mouseReleased')) {
                        todo.set('mouseReleased', false);
                        todo.set('draggingTodoItem', false);
                        let textarea = document.querySelector('.unscheduled textarea');
                        if (textarea.value == '') {
                            moveEvents();
                        } else {
                            utilities.showModal("Can't Change " + inputs.listName + " Item Sort Order", "You cannot sort a filtered list. Please remove filters before sorting.", null, null, "OK", null);
                        }
                    }
                }
            }
        });

        // Helper function sets the checkbox state based on the To Do status
        // and attaches listeners that modify this state. If initialSet is
        // set to true, the function simply set the current checkbox state.
        // If set initialSet is ommitted, the function swaps the checkbox
        // state and updates the event.

        function toggleToDoStatus(cell, event, initialSet = false) {

            let toDoStatusField = dbk.getCustomFieldIdByName(inputs.toDoStatusFieldName, event.schedule);
            let toDoStatus = event[toDoStatusField] != true ? false : true;


            if (!initialSet) {
                toDoStatus = toDoStatus == true ? false : true;

                let changesObject = {};
                changesObject[toDoStatusField] = toDoStatus;

                dbk.updateEvent(
                    event,
                    changesObject,
                    null,
                    attachEventListeners, { isCustomAction: true, }
                );

                let alert = toDoStatus ? todo.sounds.checkedComplete : todo.sounds.uncheckComplete;
                playSound(alert);
            }

            if (toDoStatus) {
                cell.classList.add('toDoItemComplete');
            } else {
                cell.classList.remove('toDoItemComplete');
            }
        }

        // Helper function sets variables that track which events
        // are being dragged and dropped. Function also removes the
        // No events found modal and Drop Target Cover if the dragged
        // event is an Unscheduled event. This allows the Drag drop
        // to initiate a sorting function when the mouse is released.

        function dragStartHandler(ev, cell, event) {

            cell.classList = ev.currentTarget.classList;
            cell.classList.add('unscheduledHideOnDrag');

            todo.set('mouseReleased', false);
            todo.set('draggingTodoItem', true);
            todo.set('draggedEvent', event);
            todo.set('enteredevent', null);

            const noEventsModal = document.querySelector('.no-events-modal');
            if (noEventsModal) {
                noEventsModal.style.display = 'none';
            }

            dbk.observe({
                name: 'dragCover' + event['_id'],
                watch: '.alt-view-container',
                until: '.drag-target-cover',
                then: function (o) {
                    o.destroy();
                    let cover = document.querySelector('.drag-target-cover');
                    cover.parentNode.removeChild(cover);
                }
            });
        }
    }

    // Helper function actually performs the appropriate re-sorting of events
    // building a multiSelect object of Event changes to propagate the 
    // new sequence of the events after sorting of the drop/drag list is finished

    function moveEvents() {

        // Get Sorted Events

        var unscheduled = seedcodeCalendar.get('element').fullCalendar('unscheduledClientEvents');
        var events = unscheduled.filter((e) => (
            (todo.isToDoEvent(e) && todo.isToDoApplicable(e)) ||
            (!todo.isToDoEvent(e) && todo.isSortableEvent(e))
        ));

        events.sort((a, b) => {
            let fa = dbk.getCustomFieldIdByName(inputs.sequenceFieldName, a.schedule);
            let fb = dbk.getCustomFieldIdByName(inputs.sequenceFieldName, b.schedule);
            return a[fa] - b[fb];
        });

        let entered = todo.get('enteredEvent');
        let dragged = todo.get('draggedEvent');

        let index1 = events.findIndex(e => e.eventID === entered.eventID);
        let index2 = events.findIndex(e => e.eventID === dragged.eventID);

        // Get re-sorted array

        let sEvents = moveArrayIndex(events, index2, index1);
        if (sEvents.length > 0) {

            let sequence = 0;
            sEvents.forEach((e) => {
                sequence++;
                e.newUnscheduledSequence = sequence;
            });

            // Build multiUpdate object

            let multiUpdate = {};

            sEvents.forEach((e) => {
                let fieldId = dbk.getCustomFieldIdByName(inputs.sequenceFieldName, e.schedule);
                if (e[fieldId] != e.newUnscheduledSequence && e.newUnscheduledSequence != '') {
                    multiUpdate[e.eventID] = { event: e };
                }
            });

            if (Object.keys(multiUpdate).length > 0) {

                // Clear no-events popover

                const noEventsModal = document.querySelector('.no-events-modal');
                if (noEventsModal) {
                    noEventsModal.style.display = 'none';
                }

                updateEvents(multiUpdate, dragged.eventID);
            }
        }

        // Helper function to move an element within an array from the 'old_index' to the 'new_index'

        function moveArrayIndex(arr, old_index, new_index) {
            while (old_index < 0) {
                old_index += arr.length;
            }
            while (new_index < 0) {
                new_index += arr.length;
            }
            if (new_index >= arr.length) {
                var k = new_index - arr.length;
                while ((k--) + 1) {
                    arr.push(undefined);
                }
            }
            arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
            return arr;
        }
    }

    // Multi-update function to update the sequence number of events after new sort has been achieved

    function updateEvents(multiSelect, updatedEventId) {
        var updatedEventCount = 0;
        var eventCount = Object.keys(multiSelect).length;
        var config = seedcodeCalendar.get("config");

        var updatingModalDiv;
        var updatingTimeout;
        var isUndo = false;
        var updatingModalStyle = {
            height: "auto",
            width: "400px",
            "margin-top": "20%",
        };
        var updatingModalContentStyle = {
            background: "rgba(0,0,0,0.75)",
            color: "white",
        };
        var revertMessage =
            '<span class="message-icon-separator success">' +
            '<i class="fa fa-lg fa-check"></i>' +
            "</span>" +
            "<span translate>Events have been re-sorted</span>" +
            '<span class="message-separator"> | </span>' +
            "<span translate>Undo</span>" +
            '<span class="message-icon-separator" style="opacity: 0.8;"><i class="fa fa-lg fa-undo"></i></span>';

        showUpdatingModal();

        Object.keys(multiSelect).forEach(function (ce) {
            var changesObject = {};
            var event = multiSelect[ce].event;
            const fieldId = dbk.getCustomFieldIdByName(inputs.sequenceFieldName, event.schedule);

            changesObject[fieldId] = event.newUnscheduledSequence;

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
                verifyFinished, {
                isCustomAction: true,
            }
            );
        });

        function setUpdatingTimeout(message, revert) {
            clearTimeout(updatingTimeout);
            updatingTimeout = setTimeout(function () {
                dbk.showMessage(message, 0, 3000, "error");
                if (revert && updatedEventCount > 0) {
                    console.log("Sort Function Timeout Revert");
                    revertChanges(true);
                } else {
                    clearUpdatingModal();
                }
            }, inputs.sortFunctionTimeout);
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
            var matchingEvent = multiSelect[
                Object.keys(multiSelect).filter(function (mi) {
                    return multiSelect[mi].event.eventID === updatedEvent.eventID;
                })
            ];

            if (updatedEvent && matchingEvent) {
                updatedEventCount += 1;

                if (error) {
                    console.log("Update Error: ", error);
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
                                failedEvents[0].error + ". Changes will be reverted.",
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
                        multiSelect[key].changesObject = multiSelect[key].revertObject;
                        dbk.updateEvent(
                            multiSelect[key].event,
                            multiSelect[key].changesObject,
                            null,
                            verifyFinished,
                            {
                                isCustomAction: true,
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

        // Function for modal window

        function showUpdatingModal() {
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
                Object.assign(modalContentObject.style, updatingModalContentStyle);
                headerDiv.className = "pad-large text-center";
                headerObject.innerText = "Sorting Events...";
                headerDiv.appendChild(headerObject);
                modalContentObject.appendChild(headerDiv);
                modalMainDiv.appendChild(modalContentObject);
                updatingModalDiv.appendChild(modalMainDiv);
                updatingModalDiv.id = "eventArrayUpdatingModalDiv";
                document.body.appendChild(updatingModalDiv);
            }
            config.suppressEditEventMessages = true;

            let ulist = document.querySelector('.unscheduled-container .unscheduled-list');
            ulist.classList.add('unscheduledSaveFade');

        }

        // Function for clearing modal window

        function clearUpdatingModal() {

            // Remove the updating modal div
            updatingModalDiv = document.getElementById("eventArrayUpdatingModalDiv");
            if (updatingModalDiv) {
                document.body.removeChild(updatingModalDiv);
            }
            setTimeout(function () {
                config.suppressEditEventMessages = false;
            }, 500);

            // Reprocess the sorted list, and add a fade animation to highlight to new drag 
            // target position when the resequencing of events finishes. 

            let ulist = document.querySelector('.unscheduled-container .unscheduled-list');
            ulist.classList.remove('unscheduledSaveFade');
            todo.set('draggedEvent', null);
            reprocessEvents();
        }

        // Helper function applies the respective animations

        function reprocessEvents() {

            var events = seedcodeCalendar.get('element').fullCalendar('unscheduledClientEvents');

            seedcodeCalendar.get('element').fullCalendar('rerenderUnscheduledEvents');

            var events = seedcodeCalendar.get('element').fullCalendar('unscheduledClientEvents');
            let draggedEvent = events.filter(event => event.eventID == updatedEventId);

            if (draggedEvent.length) {
                let div = document.querySelector('[data-id="' + draggedEvent[0]._id + '"]');
                div.classList.add('unscheduledDropFade');
                todo.sounds.moveComplete?.play();
                setTimeout(function () {
                    div.classList.remove('unscheduledDropFade');
                }, 2000);
            }
        }
    }

    // Function adds a new To Do Item based on the Add To Do Item form. 

    function addNewItem(opt) {

        let container = document.querySelector('.unscheduled .addTodoContainer');
        let title = document.querySelector('.unscheduled .addTodoTitle');
        let description = document.querySelector('.unscheduled .addTodoDescription');

        if (title.value == '') {
            return utilities.showModal(inputs.listName + " Item Error", "Please specify a " + inputs.listName + " title", null, null, "OK", null);
        }

        container.classList.add('itemAdded');

        todo.delay({
            300: function () {
                title.value = '';
                description.value = '';
                title.focus();
            },
            1200: function () {
                container.classList.remove('itemAdded');
            }
        });

        // Get Event defaults

        let defaults = todo.get('newToDoDefaults');

        // Get all schedules and find default schedule

        let schedules = seedcodeCalendar.get('schedules');
        let schedule;

        schedules.forEach((s) => {
            if (s.name == defaults.calendarName) {
                schedule = s;
            }
        });

        // Alert if error

        if (!schedule) {
            return utilities.showModal(inputs.listName + " List Error", "Please set default a Calendar for " + inputs.listName + " items", null, null, "OK", null);
        }

        // Get max sequence value

        let nextSequence = 0;

        var events = seedcodeCalendar.get('element').fullCalendar('unscheduledClientEvents');
        events.forEach(event => {
            if (event.unscheduled && todo.isToDoEvent(event) && todo.isToDoApplicable(event)) {
                let sequenceFieldName = dbk.getCustomFieldIdByName(inputs.sequenceFieldName, event.schedule);
                if (parseInt(event[sequenceFieldName]) > nextSequence) {
                    nextSequence = event[sequenceFieldName];
                }
            }
        });

        nextSequence++;

        // Define a new To Do Event based on defaults

        let selectedStatus = document.querySelector('.unscheduled .addTodoContainer .statusIcon.selectedStatus');
        let statusCode = selectedStatus?.dataset.status || defaults.status;

        let startDate = moment().clone().add(24, 'hours');

        let newEvent = {
            title: title.value,
            description: description.value,
            start: startDate,
            end: startDate.clone().add(defaults.durationInHours, 'hours'),
            allDay: defaults.isAllDayEvent,
            resource: [inputs.account],
            isUnscheduled: true,
            unscheduled: true,
            status: [statusCode],
        };

        Object.keys(schedule.customFields).forEach(
            function (customField) {
                newEvent[customField] = undefined;
            }
        );

        // Assign the new sequence number

        let sequenceFieldName = dbk.getCustomFieldIdByName(inputs.sequenceFieldName, schedule);
        newEvent[sequenceFieldName] = nextSequence;

        // Assign To Do Flag

        let toDoItemFlag = dbk.getCustomFieldIdByName(inputs.toDoItemFlag, schedule);
        newEvent[toDoItemFlag] = true;

        // Create the New Event

        todo.set('eventClickLock', true);

        dbk.createEvent({
            event: newEvent,
            calendarID: schedule.id,
            calendarName: schedule.name,
            isUndo: false,
            renderEvent: true,
            isUnscheduled: true,
            callback: function (result, e) {
                if (result.error) {
                    utilities.showModal("Error Creating " + inputs.listName, result.error, null, null, "OK", null);
                } else {
                    $rootScope.$broadcast('closePopovers');
                    setTimeout(function () {
                        todo.set('eventClickLock', false);
                    }, 250);

                    seedcodeCalendar.get('element').fullCalendar('rerenderUnscheduledEvents');
                    todo.attachEventListeners();

                    // Get newly added ID:

                    setTimeout(function () {

                        let cellId = result.event._id;
                        let cell = document.querySelector('[data-id="' + cellId + '"]');

                        // Scroll to new location of item    

                        var eventList = document.querySelector('.unscheduled-list .nano-content');
                        $(eventList).animate({
                            scrollTop: cell ? cell.offsetTop : eventList.scrollHeight
                        }, 500);

                        // Play Complete Sound

                        playSound(todo.sounds.moveComplete);

                        // Handle Swipe Animation

                        cell?.classList.add('unscheduledDropFade');
                        setTimeout(function () {
                            cell?.classList.remove('unscheduledDropFade');
                        }, 2000);

                    }, 500);
                }
            },
        });
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