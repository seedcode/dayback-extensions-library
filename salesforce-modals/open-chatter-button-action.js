fbk.publish('dbk.openModal', {
    url: '/apex/EventChatter?id=' + event.eventID,
    title: 'Event Chatter Activity',
    headerBackground: '#00A1E0',
    callbackName: 'chatterActivity',
    callbackReference: event.eventID
});