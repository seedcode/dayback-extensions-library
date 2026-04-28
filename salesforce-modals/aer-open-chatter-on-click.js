// After Events Rendered
//
// Add a click handler to the pills that will open the chatter activity modal

seedcodeCalendar
    ?.get('element')
    ?.fullCalendar('clientEvents')
    ?.filter((event) => {
        return event.schedule.name === 'Technician Assignments' &&
            event[dbk.getCustomFieldIdByName('Has_Chatter_Activity__c', event.schedule)]
    })
    ?.forEach((event) => {

        // Loop through each event's pills and add a click handler
        document.querySelectorAll(
            '[data-id="' + event._id + '"] .chatterIcon:not(.hasClickHandler)'
        )
            ?.forEach((pill) => {
                // Add a click handler to the pill
                // that will open the chatter activity modal
                // and prevent the event click from propagating
                // to the fullCalendar event click handler

                pill.onclick = () => {

                    seedcodeCalendar.init('preventEventClick', true);

                    setTimeout(() => {
                        seedcodeCalendar.init('preventEventClick', false)
                    }, 500);

                    fbk.publish('dbk.openModal', {
                        url: '/apex/EventChatter?id=' + event.eventID,
                        title: 'Event Chatter Activity',
                        headerBackground: '#00A1E0',
                        callbackName: 'chatterActivity',
                        callbackReference: event.eventID
                    });
                };

                pill.classList.add('hasClickHandler');
            });
    });