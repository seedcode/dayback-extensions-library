function makeActive() {
    // Define field we will set to true. This is the Salesforce field API name.
    // Customs fields will end with __c
    var fieldToSet = 'IsActive__c';

    // Define object we will be editing. This is the Salesforce object API name.
    // Customs fields will end with __c
    var objectName = 'Campaign';


    // ID of this campaign
    var id = '[[Id]]';

    // Schedule ID
    var scheduleId = event.schedule.id;

    // Request object
    var request = {};
    request[fieldToSet] = true;

    // Result callback
    function callback(result) {
        var message = '<span class="message-icon-separator success">' +
            '<i class="fa fa-lg fa-check"></i>' +
            '</span>' +
            '<span translate style="text-transform:capitalize;">' + objectName + ' Updated Successfully' +
            '</span>';
        if (result && result[0] && result[0].errorCode) {
            message = 'ERROR: ' + result[0].message;
        }
        dbk.showMessage(message, 0, 5000);
    }
    // Make AJAX call to Salesforce for this edit
    fbk.updateRecord(objectName, id, callback, request, scheduleId);
}
makeActive();

