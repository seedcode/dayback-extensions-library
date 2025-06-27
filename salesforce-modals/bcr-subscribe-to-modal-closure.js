// Subscribe Modal Closure Events  - v1.0
//
// This app action subscribes to the 'dbk.modalClosed' event
// that is sent from the Visualforce page when a modal dialog
// is closed. It can be used to perform actions based on the
// closure of the modal, such as refreshing the calendar,
// or triggering other DayBack workflows.

// Prevent Default: No
// Action Type: Before Calendar Rendered

Sfdc.canvas.client.subscribe(fbk.client(), {
    name: 'dbk.modalClosed',
    onData: (data) => {
        const callbackName = data?.callbackName;
        const callbackReference = data?.callbackReference;

        if (callbackName == 'chatterActivity') {
            // If the modal was closed for a chatter activity, we can perform actions here.
            console.log(`Closed chatter activity for ${callbackReference}`);
        }
        // You can add more conditions here for different modal types if needed.
    }
});
