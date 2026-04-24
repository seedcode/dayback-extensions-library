// Name: Add Chatter Activity CSS Class
// Type: Event Action
// Trigger: Before Event Rendered 
//
// Purpose:
// This code adds a CSS class to events that have a chatter activity associated with them.
// This allows you to style these events differently in the calendar, such as adding an icon or changing the background color.
//
// More info on custom actions here:
// https://docs.dayback.com/article/20-event-actions

if (event[dbk.getCustomFieldIdByName('Has_Chatter_Activity__c', event.schedule)]) {
    event.className = 'hasChatter';
}