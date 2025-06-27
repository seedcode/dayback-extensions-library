// Before Event Rendered 
//
// Adds Chatter Activity Class to Events that have Chatter Activity

if (event[dbk.getCustomFieldIdByName('Has_Chatter_Activity__c', event.schedule)]) {
    event.className = 'hasChatter';
}