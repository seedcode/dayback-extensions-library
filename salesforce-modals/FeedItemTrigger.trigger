trigger FeedItemTrigger on FeedItem (after insert) {
    Set<Id> techAssignmentIds = new Set<Id>();

    // Step 1: Collect all Technician_Assignment__c ParentIds from new FeedItems
    for (FeedItem fi : Trigger.new) {

        // replace 'a09' with your object's prefix if different
        if (fi.ParentId != null && String.valueOf(fi.ParentId).startsWith('a09')) { 
            techAssignmentIds.add(fi.ParentId);
        }
    }

    if (!techAssignmentIds.isEmpty()) {
        List<Technician_Assignment__c> updates = new List<Technician_Assignment__c>();

        for (Technician_Assignment__c ta : [
            SELECT Id, Has_Chatter_Activity__c
            FROM Technician_Assignment__c
            WHERE Id IN :techAssignmentIds AND Has_Chatter_Activity__c = false
        ]) {
            ta.Has_Chatter_Activity__c = true;
            updates.add(ta);
        }

        if (!updates.isEmpty()) {
            update updates;
        }
    }
}
