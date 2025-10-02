// Event Validation and Highlighting v1.00
//
// Purpose:
// This module provides a comprehensive framework for validating and highlighting event 
// fields in DayBack, supporting both standard and custom fields.Validation rules are defined
// per field and can include required logic, error / warning tests, and dynamic field visibility.
// 
// Action Type: Before Calendar Rendered
// Prevent Default Action: No
//
// More info on custom actions here:
// https://docs.dayback.com/article/20-event-actions

// Declare globals

(() => {

    // Declare globals - do not change
    let options = {};
    let inputs = {};

    try {
        //----------- Configuration -------------------

        // Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
        // Leave this set to 0 to avoid unexpected behavior

        options.runTimeout = 0;

        // Allow Save on Errors and Warnings
        //
        //      If errors are detected when saving an event, this setting determines whether 
        //      the user can still save the event, or whether they must go back and fix 
        //      the errors and/or warnings.
        //
        //      If false, the user will not be able to save if there are errors or warnings.
        //      If true, the user can still choose to save even if there are warnings.

        inputs.allowSaveOnError = true;

        inputs.allowSaveOnWarning = true;

        // Prompt with Save Confirmation Message on Warning:
        //
        //      If warnings are detected when saving an event, this setting determines whether
        //      the user will be prompted with a second confirmation message before saving the event.
        //
        //      If false, the user can save without being prompted for additional confirmation.
        //      If true, the user will be asked to confirm saving if there are warnings.

        inputs.askForSecondConfirmation = false;

        // Run event validation rules even if an event was not modified.
        //
        //      The Before Event Save trigger always runs and validates an event
        //      even if an event is not modified. Sometimes this is not desirable,
        //      especially in cases where a user just wants to view the details of
        //      an event without being forced to fix errors.
        //
        //      This setting allows you to control whether unchanged events are validated
        //      when they are opened and closed.
        //
        //      If true, all event fields are validated every time the event is closed, even
        //      if the event was not changed.
        //      If false, unchanged events can be opened and closed without triggering validation.

        inputs.validateUnchangedEvents = false;

        // Query Cache for Salesforce Queries
        // ----------------------------------
        //
        // If your validation tests need to make API calls (such as to Salesforce),
        // you can use a query cache to reduce the number of repeated requests.
        //
        // The queryCache object stores results from previous queries, and queryCacheExpiry
        // sets how long each cached result remains valid (in milliseconds).
        //
        // To use the cache, call getCachedQuery(key) with a unique key for your query.
        // If a valid cached result exists, it will be returned. Otherwise, run your query,
        // save the result to the cache, and use that result.
        //
        // Example usage:
        //
        //      let [isCached, result] = getCachedQuery('myUniqueKey');
        //
        //      if (!isCached) {
        //          result = await sf.query('SELECT Id, Name FROM Account LIMIT 1');
        //          saveCachedQuery('myUniqueKey', result);
        //      }
        //      
        //      return result;
        //      

        inputs.queryCache = {};
        inputs.queryCacheExpiry = 3 * 60 * 1000; // 3 minutes

        // Global and Calendar-Specific Defaults
        // -------------------------------------
        //
        // This library provides two ways to define configuration rules. One is for global defaults,
        // which apply to all calendars and calendar sources. The other is for calendar-specific
        // defaults, which apply only to specific calendars. You can use either or both to define
        // your preferred validation rules.
        //
        //      1. Global Defaults - rules that apply to all calendars and calendar sources.
        //
        //          inputs.globalDefaults = { ... } ; // for all calendars
        //
        //      2. Calendar-Specific Defaults - rules that apply only to specific calendars.
        //
        //          inputs.calendarDefaults = [
        //              { ... }, // for "My Calendar 1"
        //              { ... }  // for "My Calendar 2"
        //          ];
        //
        // While `globalDefaults` is a single object, `calendarDefaults` is an array
        // of objects, each containing an identical structure as the `globalDefaults`, but with
        // an additional `calendars` property to specify the calendar(s) to which the rules apply.
        //
        // Each sub-object contains the following properties. All are optional:
        //
        //      requiredFields: (array)         An array of field labels that should be marked
        //                                      as required.
        //
        //      hiddenFields: (array)           An array of field labels that should be hidden.
        //
        //      calendars: (string or array)    Used in the calendarDefaults object to specify
        //                                      the calendars to which the rules apply.
        //
        //      validationRules: { ... }        An object defining validation rules for
        //                                      specific fields.
        //
        // The most simple way to use this library is to define a set of required or
        // hidden fields up front. If you define `requiredFields`, the Edit Event popover
        // will show a red asterisk next to the field label in the popover. It will
        // automatically add basic validation rules to ensure that the fields are filled in
        // before a user is allowed to save the event.
        //
        // For simple use cases, it is easiest to define your static configuration
        // as follows:
        //
        //      inputs.globalDefaults = {
        //          requiredFields: ['Title', 'Resource', 'Status', 'Start', 'End'],
        //          hiddenFields: ['Location'],
        //      }
        //
        //      inputs.calendarDefaults = [
        //          {
        //              calendars: ['My Calendar 1', 'My Calendar 2'],
        //              requiredFields: ['Resource', 'Status', 'Start', 'End'],
        //              hiddenFields: ['Project', 'Location'],
        //          },
        //          { ... }
        //      ];
        //
        // If you *don't* expect these values to change based on the changing nature of an event,
        // then this is all you need to do.
        //
        // However, if you want to show that a field is required or hidden based on the
        // choices made by the user as they edit the event, you will need to define custom rules.
        // These allow you to make fields conditionally required or hidden based on a result
        // of a calculation.
        //
        // You do this by defining rules for specific fields in the `validationRules` object.
        //
        // Defining Dynamic Validation Rules for Individual Fields:
        // ------------------------------------------------------
        //
        // Whether you use global or calendar-specific validation rules, you can add
        // a `validationRules` sub-object to either or both objects. This object contains
        // one property for each field you want to validate.
        //
        // This example shows how you can define rules for standard fields (Title,
        // Description, Start, End, Location, Calendar, Resource, Status) as well as
        // custom fields, using their label name:
        //
        //     inputs.globalDefaults = {
        //          requiredFields: ['Title', 'Resource', 'Status', 'Start', 'End'],
        //          hiddenFields: ['Location'],
        //          validationRules: {
        //              Resource: { ... },
        //              Status: { ... },
        //              "Custom Field Label": { ... }
        //          }
        //      }
        //
        // Global Rules versus Calendar-specific Rules:
        // -------------------------------------------
        //
        // The `globalDefaults` object can be used to define validation rules that
        // will apply to all calendars. However, you can add to or override the global
        // rules by defining calendar-specific rules by specifying the calendar(s) to
        // which the rules apply within the `calendarDefaults` object.
        //
        //      inputs.calendarDefaults = [
        //          {
        //              calendars: (string or array) - Calendar name(s) the rules apply to
        //              validationRules: {
        //                  Title: { ... },
        //                  Description: { ... },
        //                  Resource: { ... },
        //                  Status: { ... },
        //                  "Custom Field Label": { ... }
        //              }
        //          },
        //          { ... }
        //      ];
        //
        // The `requiredFields` and `hiddenFields` lists in `calendarDefaults` replace those
        // defined in `globalDefaults`. If you require ['Title', 'Status'] in the `globalDefaults`,
        // but ['Resource', 'Status'] in the `calendarDefaults`, only Resource and Status will
        // be validated in the context of that calendar.
        //
        // However, `validationRules` are additive lists. This allows you to define a base set of
        // validation rules in `globalDefaults`, and then add to or override those rules
        // in `calendarDefaults`.
        //
        // At runtime, this library will merge the `globalDefaults` and the relevant
        // `calendarDefaults` to create a final set of validation rules for all events.
        //
        // Replacing Validation Rules at Runtime
        // ------------------------------------
        //
        // While in most cases, you only need to define your rules when this library first loads
        // You can also manually override the global and calendar-specific rules from those
        // retrieved from the database by calling the following methods:
        //
        //      sc.get('validationHandler').setGlobalDefaults(globalDefaults);
        //
        //      sc.get('validationHandler').setCalendarDefaults(calendarDefaults);
        //
        // This allows you to retrieve configuration from an external source, such as a
        // Salesforce custom setting or custom object, and then pass that configuration
        // to this library to set the validation rules dynamically.
        //
        // Defining the Validation Rules Object
        // ------------------------------------
        //
        // Each field in your `validationRules` represents an object that contains one or more
        // of the following properties. All properties are optional.
        //
        //      "Field Label": {
        //          markRequired: (boolean or function),
        //          validateOn: (array),
        //          errorTests: (array),
        //          warningTests: (array)
        //      }
        //
        // A minimal configuration to make the Title field required, but without any
        // specific error tests would look like this:
        //
        //      inputs.globalDefaults = {
        //          validationRules: {
        //              Title: {
        //                  markRequired: true
        //              }
        //          }
        //      }
        //
        // Properties of a Validation Rule for a Field:
        // --------------------------------------------
        //
        // The documentation below explains each property in detail. Some of these properties
        // are boolean values, while others are function tests, or arrays of function tests.
        // These functions run in the context of the editEvent object, allowing you to
        // access event fields, helper methods, and runtime context in order to make a decision
        // whether an event is required, hidden, or has an error or warning.
        //
        // This gives you a great deal of flexibility in defining your validation rules and
        // change the user experience in the Edit Event popover dynamically based on the
        // choices made by the user as they edit the event.
        //
        //      markRequired: (boolean or function)
        //
        //          If set to true, the field is marked with a red asterisk in the Edit Event
        //          popover, indicating it is a required field.
        //
        //          If false or not specified, the field is displayed normally.
        //
        //          If the value is defined as a function, it assumes the context of the
        //          editEvent object. You can use `this` to refer to the editEvent object
        //          and calculate if the field should be marked as required.
        //
        //          The function should return true to mark the field as required.
        //
        //          Example:
        //
        //          validationRules: {
        //              Location: {
        //                  markRequired: (event) => event.status[0] == 'Booked'
        //              },
        //              Status: {
        //                  markRequired: true
        //              },
        //              ...
        //          }
        //
        //          In this example, the Location field is marked as required only if
        //          the event status is 'Booked', while the Status field is always marked
        //          as required.
        //
        //          Please be aware that if you make a field show up as required, you should
        //          also add any related validation tests and related error messages to
        //          ensure the user is given the appropriate feedback if they do not fill in
        //          a required field.
        //
        //      hideField: (boolean or function)
        //
        //          If set to true, the field is hidden in the Edit Event popover.
        //
        //          If false or not specified, the field is displayed normally.
        //
        //          If the value is defined as a function, it assumes the context of the
        //          editEvent object. You can use `this` to refer to the editEvent object
        //          and calculate if the field should be hidden.
        //
        //          Example:
        //
        //          // Make Hours Estimate required and visible only if Event Type is Task
        //
        //          validationRules: {
        //              "Hours Estimate": {
        //                  markRequired: (event) => event.getField('Event Type') === 'Task',
        //                  hideField: (event) => event.getField('Event Type') !== 'Task'
        //              }
        //          }
        //
        //
        //      showField: (boolean or function)
        //
        //          This is the inverse of the prior hideField property. If set to true,
        //          the field is shown in the Edit Event popover. Typically, you would
        //          only use one of hideField or showField for a given field.
        //
        //          If false, the field is hidden.
        //
        //          If the value is defined as a function, it assumes the context of the
        //          editEvent object. You can use `this` to refer to the editEvent object
        //          and calculate if the field should be shown.
        //
        //          The function should return true to show the field.
        //
        //          Example:
        //
        //          // Make Hours Estimate required and visible only if Event Type is Task
        //
        //          validationRules: {
        //              "Hours Estimate": {
        //                  markRequired: (event) => event.getField('Event Type') === 'Task',
        //                  showField: (event) => event.getField('Event Type') === 'Task'
        //              }
        //          }
        //
        //      validateOn: (array) - An array of triggers determining when the field is validated.
        //
        //          Possible values are 'eventRender', 'eventClick', 'fieldChange', 'eventSave'.
        //          If not specified, the field is validated on all triggers.
        //
        //          Example: This example validates the field on all triggers.
        //
        //              Title: {
        //                  markRequired: true,
        //                  errorTests: [ ... ]
        //              }
        //
        //              Which is equivalent to:
        //
        //              Title: {
        //                  validateOn: ['eventRender', 'eventClick', 'fieldChange', 'eventSave']
        //                  markRequired: true,
        //                  errorTests: [ ... ]
        //              }
        //
        //          Example: This example validates the field only when the event is opened
        //
        //              Status: {
        //                  validateOn: ['eventClick'],
        //                  markRequired: true
        //              }
        //
        //          Explanation of Triggers:
        //
        //              eventRender - Useful for applying error/warning icons and highlights
        //                  to event pills that appear when the calendar is loaded. It allows you
        //                  to highlight events that have errors or warnings. The user can then
        //                  click on the event pill to see the details.
        //
        //              eventClick - Immediately validates an event when an event is opened
        //                  and highlights fields with errors or warnings. The user can then
        //                  see and hover over the fields with issues to get more information.
        //
        //              fieldChange - Validates a field when it is changed in the popover.
        //                  This allows you to provide immediate feedback to the user
        //                  after they have changed a field. Please note that this trigger will
        //                  always run as action.callbacks.confirm(). If an error is found,
        //                  and you want to revert the field to its previous value, you can do so
        //                  by setting the value on the editEvent to the original value.
        //
        //              eventSave - Validates an event when the user clicks the Save button, or
        //                  closes the popover. This is the most common trigger to validate an
        //                  event, as it allows you to check all fields before saving.
        //
        //      errorTests: (array) - An array of objects that must contain the following
        //                            properties:
        //
        //                  test: (function)
        //                        A function that returns true if there is an error.
        //
        //                  message: (string)
        //                        The error message to display if the test returns true.
        //
        //                  skipOnError: (boolean) - Optional.
        //                        If true, this test will be skipped if there are already
        //                        errors for this field. This allows certain tests to be
        //                        conditional on others not failing.
        //
        //                  Example:
        //
        //                  Title: {
        //                      validateOn: ['eventRender', 'eventClick', 'fieldChange', 'eventSave'],
        //                      markRequired: true,
        //                      errorTests: [
        //                          {
        //                              test: (event) => !event.title || event.title.trim() === '',
        //                              message: 'Title is missing'
        //                          },
        //                          {
        //                              test: (event) => event.title.length < 3,
        //                              message: 'Title is too short',
        //                              skipOnError: true
        //                          }
        //                      ]
        //                  }
        //
        //                  You can define as many test objects as you need in the array.
        //                  If any test returns true, the field is considered to have an error,
        //                  and the corresponding message(s) are displayed to the user.
        //
        //                  If multiple tests return true, all corresponding messages are displayed.
        //                  If skipOnError is set to true on a test, that test will only run if
        //                  no previous tests have returned true for that field.
        //
        //      warningTests: (array) - An array of test objects to determine if there is a warning.
        //                  Each test object should a similar structure to errorTests:
        //
        //                  test: (function)
        //                        A function that returns true if there is a warning.
        //
        //                  message: (string)
        //                        The warning message to display if the test returns true.
        //
        //                  skipOnError: (boolean) - Optional.
        //                        If true, this test will be skipped if there are already
        //                        warnings for this field. This allows certain tests to be
        //                        conditional on others not failing.
        //
        // Function Tests:
        // ---------------
        //
        // Function tests will run with `this` set to a Proxy of the `editEvent` object,
        // allowing you to access event fields, helper methods, and runtime context in order
        // to make a decision whether an event is required, hidden, or has an error or warning.
        //
        // Example usage:
        //
        //     test: (event) => !event.title
        //
        //     test: (event) => !event.getField('Procedure')
        //
        //     test: (event) => event.trigger === 'eventSave' && event.fieldChanged('Status')
        //
        // You can define as a test using two types of functions:
        //
        //      1. Arrow functions: (event) => {}
        //      2. Standard functions: function() {}
        //
        // However, please note that arrow functions do not have their own `this` context,
        // so if you use an arrow function, you must define an argument to access the event
        // object. Here are valid ways of defining a test to check if a custom field called
        // "My Custom Field" is missing:
        //
        //      test: (event) => !event.getField('My Custom Field')
        //
        //      test: function() { return !this.getField('My Custom Field'); }
        //
        //      test: function(e) { return !e.getField('My Custom Field'); }
        //
        // Available Properties and Helper Methods:
        // ----------------------------------------------
        //
        // Whether using `this` or an argument, the following are available:
        //
        //      trigger       - (string) The trigger that caused validation ('eventRender', 'eventClick', 'fieldChange', 'eventSave')
        //      event         - (object) The original event object
        //      editEvent     - (object) The current editEvent object
        //      changes       - (object) Fields changed in the current edit session (for 'fieldChange' and 'eventSave')
        //      errors        - (object) Errors found so far for any field
        //      warnings      - (object) Warnings found so far for any field
        //      getField(field)      - Returns the value of a custom field by label or "store in field" name
        //      setField(field, value) - Sets the value of a custom field
        //      fieldChanged(field)   - Checks whether a field (by label) was changed; if omitted, checks the current field
        //
        // Helper Methods for Validation Actions:
        //
        //      If you prefer to set errors and warnings directly on other fields within a test,
        //      you can use the following helper methods to override errors and warnings:
        //
        //      markRequired(field || fields[], isRequired) - Marks a field as required (true/false)
        //      pushError(field || fields[], message) - Adds an error message to the event
        //      pushWarning(field || fields[], message) - Adds a warning message to the event
        //      markRequired(field || fields[], isRequired) - Marks a field as required (true/false)
        //      showField(field || fields[]) - Shows a field
        //      hideField(field || fields[]) - Hides a field
        //
        // Example:
        //      test: (event) => event.trigger === 'eventSave' && event.fieldChanged(),
        //
        // Writing Tests against Standard Fields and Custom Fields:
        // --------------------------------------------------------
        //
        // The following standard fields are available for validation directly on the event object:
        //
        //      Title, Description, Start, End, Location, Calendar, Resource, Status
        //
        // You can get these fields directly from the event object as follows:
        //
        //      event.title
        //      event.description
        //      event.start (moment object)
        //      event.end (moment object)
        //      event.location
        //      event.schedule.name
        //      event.resource // Array
        //      event.status // Array
        //
        // Custom Fields:
        //
        //      Since Custom Fields are user-defined, and are stored in the editEvent object
        //      using their numerical ID rather than their `Label Name` or their
        //      `Store In Field` name you must access an event's custom field values using
        //      a helper function:
        //
        //          event.getField("Field Label" || "Store In Field Name").
        //
        //      This function is aware of the context in which it is running, allowing you
        //      to retrieve values by either their custom field label or their "store in field"
        //      name. For example:
        //
        //          const truckNumber = event.getField("Truck Number"); // by label
        //
        //          const truckNumber = event.getField("Truck_Number__c"); // by "store in field" name
        //
        //      You can also set the value of a custom field in a similar way using:
        //
        //          event.setField("Truck Number", "TRK-100"); // by label
        //
        //          event.setField("Truck_Number__c", "TRK-100"); // by "store in field" name
        //
        // Changes Object:
        //
        //      The changes object contains the fields that were changed in the current event.
        //      For ease of use, the object is keyed by the field label rather than custom field
        //      numerical IDs. However, for standard fields, the field label is the same as the
        //      standard DayBack field name. For example:
        //
        //      {
        //            title: "New Title",                   // Standard field
        //            description: "New Description",       // Standard field
        //            start: moment(),                      // Standard field
        //            end: moment(),                        // Standard field
        //            location: "New Location",             // Standard field
        //            "Truck Number": "TRK-100",            // Custom field Label
        //            "Contract Signed": true               // Custom field Label
        //      }
        //
        // Simple Test Examples:
        // ---------------------
        //
        // This following example makes the Title field required and adds two error tests -
        // one to check if the title is missing, and another to check if the title
        // is too short.
        //
        // Skip On Error is set on the second test so that it only runs
        // if the first test did not find an error.
        //
        //      validationRules: {
        //          Title: {
        //              validateOn: ['eventRender', 'eventClick', 'fieldChange', 'eventSave'],
        //              markRequired: true,
        //              errorTests: [
        //                  {
        //                      test: (event) => !event.title || event.title.trim() === '',
        //                      message: 'Title is missing'
        //                  },
        //                  {
        //                      test: (event) => event.title && event.title.length < 3,
        //                      message: 'Title is too short',
        //                      skipOnError: true
        //                  }
        //              ]
        //          },
        //          ...
        //      };
        //
        // More Advanced Examples:
        // -----------------------
        //
        // You can make some sophisticated tests when combined with triggers. For example,
        // you could check the title immediately when the Event popover is opened, and run
        // a separate test to validate it for length right before it is saved:
        //
        //      Title: {
        //          validateOn: ['eventClick', 'fieldChange', 'eventSave'],
        //          markRequired: true,
        //          errorTests: [
        //              {
        //                  test: (event) => event.trigger !== 'eventSave' && (!event.titleEdit || event.titleEdit.trim() === ''),
        //                  message: 'Title is missing'
        //              },
        //              {
        //                  test: (event) => event.trigger === 'eventSave' && event.titleEdit.length < 3,
        //                  message: 'Title is too short'
        //              }
        //          ]
        //      },
        //
        // In the example below we use an fieldChange trigger to validate the status field.
        // If user tries to set status to "Confirmed" but "Contract Signed" field is not true,
        // this test will revert the status to previous value and show an error.
        //
        //      Status: {
        //          validateOn: ['fieldChange'],
        //          errorTests: [
        //              {
        //                  test: (event) => {
        //                      const contractSigned = event.getField('Contract Signed');
        //                      if (event.status[0] === 'Confirmed' && contractSigned !== true) {

        //                          // Revert status to previous value
        //                          // `event` already points to `editEvent`
        //                          // but it can help to use the following for clarity:
        //
        //                          event.editEvent.status[0] = event.event.status[0];
        //                          return true;
        //                      }
        //                      return false;
        //                  },
        //                  message: 'Cannot set status to Confirmed unless Contract Signed is true.'
        //              }
        //          ]
        //      },
        //
        // Alternatively, you can still show an error, while allowing the field to be temporarily
        // changed to "Confirmed" even if "Contract Signed" is not true, but then validate it again
        // before saving to prevent the save.
        //
        //      Status: {
        //          validateOn: ['fieldChange', 'eventSave'],
        //          warningTests: [
        //              {
        //                  // Show a warning on fieldChange if trying to set status to
        //                  // Confirmed but Contract Signed is not true
        //                  test: (event) => {
        //                      const contractSigned = event.getField('Contract Signed');
        //                      return event.trigger === 'fieldChange' && event.status[0] === 'Confirmed' && contractSigned !== true;
        //                  },
        //                  message: 'If you set status to Confirmed, please ensure Contract Signed is true.'
        //              }
        //          ],
        //          errorTests: [
        //              {
        //                  // Only enforce as an error on eventSave
        //                  test: (event) => {
        //                      const contractSigned = event.getField('Contract Signed');
        //                      return event.trigger === 'eventSave' && event.status[0] === 'Confirmed' && contractSigned !== true;
        //                  },
        //                  message: 'Cannot set status to Confirmed unless Contract Signed is true.'
        //              }
        //          ]
        //      },
        //
        // This can be combined with markRequired to make Contract Signed required if
        // the status is set to Confirmed. We can also set the status to Pending if the
        // contract was signed, but the user unchecks the Contract Signed field.
        //
        //      Contract Signed: {
        //          validateOn: ['fieldChange', 'eventSave'],
        //          markRequired: (event) => event.status[0] === 'Confirmed',
        //          warningTests: [
        //              {
        //                  test: (event) => {
        //                      const contractSigned = event.getField('Contract Signed');
        //                      // If user unchecked Contract Signed, and status is Confirmed,
        //                      // set status to Pending.
        //                      if (event.status[0] === 'Confirmed' && contractSigned !== true) {
        //                          event.status[0] = 'Pending';
        //                          dbk.refreshEditPopover(event);
        //                      }
        //                      return event.status[0] === 'Confirmed' && contractSigned !== true;
        //                  },
        //                  message: 'Contract must be signed if status is Confirmed. Status set to Pending.'
        //              }
        //          ]
        //      },
        //
        // Auto-correcting or Changing Fields On Edit:
        // -------------------------------------------
        //
        // Tests can also be used as a way to auto-set or auto-correct values either in the
        // background or in response to user actions. For example, you could automatically set the
        // end time of an event based on the selected value of a custom "Treatment Type" field.
        // In this example, when the user changes the Treatment Type field, the end time is
        // automatically adjusted to match the duration of the selected treatment.
        //
        // To make changes to the event object, you can simply mutate the event parameter
        // within your test function. After you mutate the event, you should call
        // dbk.refreshEditPopover(event) to ensure the changes are reflected in the UI.
        //
        // Here is how you could set that up:
        //
        //      "Treatment Type": {
        //          validateOn: ['fieldChange', 'eventSave'],
        //          markRequired: true,
        //          errorTests: [
        //              {
        //                  test: (event) => {
        //                      const tx = event.getField('Treatment Type');
        //                      // Only run if user changed this field.
        //                      if (!(event.changes && event.changes['Treatment Type'])) return false;
        //                      if (event.start) {
        //                          let mins;
        //                          switch (tx) {
        //                              case 'Microneedling': mins = 60; break;
        //                              case 'Chemical Peel': mins = 45; break;
        //                              case 'Botox': mins = 30; break;
        //                              case 'Laser Hair Removal': mins = 90; break;
        //                              case 'IV Drip': mins = 75; break;
        //                              default: mins = 60;
        //                          }
        //                          // Mutate end to be start + chosen duration
        //                          event.end = event.start.clone().add(mins, 'minutes');
        //
        //                          // Update the Event Popover to reflect the new end time
        //                          dbk.refreshEditPopover(event);
        //                      }
        //                      return false;
        //                  },
        //                  message: '' // Not shown, since test() always returns false
        //              }
        //          ]
        //      },
        //
        // Running Asynchronous Tests:
        // -------------------------------------------
        //
        // You can run Salesforce record checks or other asynchronous validation logic
        // by defining your test functions as async (returning a Promise).
        //
        // Both synchronous and asynchronous tests are supported. If a test function returns a Promise,
        // the validation system will handle it appropriately.
        //
        // Asynchronous tests are run sequentially, so each test will wait for the previous one to finish.
        // This ensures that skipOnError works as expected, since later tests may depend on earlier results.
        // If you have multiple independent async checks, you can run them in parallel inside a single test
        // using Promise.all for better performance.
        //
        // Example of an asynchronous test:
        //
        //      {
        //          test: async (event) => {
        //              const result = await someAsyncFunction(event);
        //              return result; // true if error, false otherwise
        //          }
        //      }
        //
        // Behavior notes:
        //
        //      For the "Before Event Save" trigger, validation will wait for all async tests to finish before
        //      allowing save.
        //
        //      For other triggers (eventRender, eventClick, fieldChange), validation does not wait for async
        //      tests. Errors or warnings from async tests will appear after each Promise resolves, so there
        //      may be a short delay.
        //
        // Comprehensive Example:
        // --------------------------------------------------------------
        //
        // The following is a detailed example configuration for Medical Spa services
        //
        //      validationRules: {
        //          // ────────────────────────────────────────────────────────────
        //          // STANDARD FIELDS
        //          // ────────────────────────────────────────────────────────────
        //
        //          Title: {
        //              markRequired: true, // Always show Title as required
        //              validateOn: ['eventClick', 'fieldChange', 'eventSave'], // Validate interactively + on save.
        //              errorTests: [
        //                  {
        //                      // Fail if title is empty or only spaces.
        //                      test: (event) => !event.title || event.title.trim() === '',
        //                      message: 'Title is required.'
        //                  },
        //                  {
        //                      // Fail if user typed a very short title.
        //                      test: (event) => event.title && event.title.trim().length < 3,
        //                      message: 'Title is too short (min 3 characters).'
        //                  }
        //              ],
        //              warningTests: [
        //                  {
        //                      // Warn if ALL CAPS (often accidental CapsLock).
        //                      test: (event) => !!event.title && event.title === event.title.toUpperCase() && /[A-Z]/.test(event.title),
        //                      message: 'Title appears to be ALL CAPS—confirm formatting.'
        //                  }
        //              ]
        //          },
        //
        //          Description: {
        //              // Only required if a particular Treatment Type is chosen (see custom field below).
        //              markRequired: (event) => {
        //                  const tx = event.getField('Treatment Type');
        //                  return tx === 'Microneedling' || tx === 'Chemical Peel';
        //              },
        //              validateOn: ['eventClick', 'eventSave'],
        //              errorTests: [
        //                  {
        //                      // If required (from markRequired logic), ensure description exists.
        //                      test: (event) => {
        //                          const tx = event.getField('Treatment Type');
        //                          const required = tx === 'Microneedling' || tx === 'Chemical Peel';
        //                          return required && (!event.description || event.description.trim() === '');
        //                      },
        //                      message: 'Description is required for Microneedling or Chemical Peel.'
        //                  }
        //              ]
        //          },
        //
        //          Start: {
        //              validateOn: ['eventSave'], // Only validate Start time on Event Save
        //              errorTests: [
        //                  {
        //                      // Fail if start is in the past when saving (but allow viewing/clicking).
        //                      test: (event) => event.trigger === 'eventSave' && event.start && event.start.isBefore(moment()),
        //                      message: 'Start time cannot be in the past.'
        //                  }
        //              ]
        //          },
        //
        //          End: {
        //              validateOn: ['eventSave'],
        //              errorTests: [
        //                  {
        //                      // Fail if End <= Start.
        //                      test: (event) => !event.end.isAfter(event.start),
        //                      message: 'End time must be after Start time.'
        //                  }
        //              ],
        //              warningTests: [
        //                  {
        //                      // Warn if the appointment runs longer than 3 hours.
        //                      test: (event) => event.end.diff(event.start, 'minutes') > 180,
        //                      message: 'Duration exceeds 3 hours—confirm this is intended.'
        //                  }
        //              ]
        //          },
        //
        //          Location: {
        //              // Required only for 'Mobile Services' calendar bookings (example of context-aware required flag).
        //              markRequired: function () { return this?.schedule?.name === 'Mobile Services'; },
        //              validateOn: ['eventClick', 'eventSave'],
        //              errorTests: [
        //                  {
        //                      // If on the 'Mobile Services' calendar, we must have a customer address.
        //                      test: (event) => {
        //                          const isMobile = event.schedule && event.schedule.name === 'Mobile Services';
        //                          return isMobile && (!event.location || event.location.trim() === '');
        //                      },
        //                      message: 'Customer address is required for Mobile Services.'
        //                  }
        //              ]
        //          },
        //
        //          // ────────────────────────────────────────────────────────────
        //          // CUSTOM FIELDS (Medical Spa)
        //          // ────────────────────────────────────────────────────────────
        //
        //          'Treatment Type': {
        //              validateOn: ['fieldChange', 'eventSave'],
        //              markRequired: true,
        //              errorTests: [
        //                  {
        //                      // Auto-set event duration when Treatment Type changes.
        //                      test: (event) => {
        //                          const tx = event.getField('Treatment Type');
        //                          // Only run if user changed this field.
        //                          if (!(event.changes && event.changes['Treatment Type'])) return false;
        //                          if (event.start) {
        //                              let mins;
        //                              switch (tx) {
        //                                  case 'Microneedling': mins = 60; break;
        //                                  case 'Chemical Peel': mins = 45; break;
        //                                  case 'Botox': mins = 30; break;
        //                                  case 'Laser Hair Removal': mins = 90; break;
        //                                  case 'IV Drip': mins = 75; break;
        //                                  default: mins = 60;
        //                              }
        //                              // Mutate end to be start + chosen duration
        //                              event.end = event.start.clone().add(mins, 'minutes');
        //                          }
        //                          // Update the Event Popover to reflect the new end time
        //                          dbk.refreshEditPopover(event.editEvent);
        //                          // Return false so this isn’t treated as a validation error.
        //                          return false;
        //                      },
        //                      message: '' // Not shown, since test() always returns false
        //                  }
        //              ],
        //              warningTests: [
        //                  {
        //                      // Warn if “IV Drip” is scheduled < 60 mins (many clinics prefer ~60).
        //                      test: (event) => {
        //                          const tx = event.getField('Treatment Type');
        //                          if (tx !== 'IV Drip' || !event.start || !event.end) return false;
        //                          return event.end.diff(event.start, 'minutes') < 60;
        //                      },
        //                      message: 'IV Drip usually takes ~60 minutes—confirm timing.'
        //                  }
        //              ]
        //          },
        //
        //          'Practitioner License #': {
        //              // Free-text alphanumeric (e.g., WA-123456), required on save when Status is Booked.
        //              markRequired: (event) => event.status[0] === 'Booked',
        //              validateOn: ['eventSave'],
        //              errorTests: [
        //                  {
        //                      // If Booked, must have a license number present.
        //                      test: (event) => {
        //                          const isBooked = event.status[0] === 'Booked';
        //                          const val = event.getField('Practitioner License #');
        //                          return isBooked && (!val || String(val).trim() === '');
        //                      },
        //                      message: 'Practitioner License # is required for Booked appointments.'
        //                  },
        //                  {
        //                      // Optional format sanity check (very loose: 2–3 letters, dash, 4–8 digits).
        //                      test: (event) => {
        //                          const val = String(event.getField('Practitioner License #') || '');
        //                          return val && !/^[A-Za-z]{1,3}-?\d{4,8}$/.test(val);
        //                      },
        //                      message: 'Practitioner License # format looks unusual. Double-check entry.'
        //                  }
        //              ]
        //          },
        //
        //          'Consent on File': {
        //              // Boolean: true/false. Required for invasive treatments.
        //              markRequired: (event) => {
        //                  const tx = event.getField('Treatment Type');
        //                  return ['Microneedling', 'Chemical Peel', 'Laser Hair Removal', 'Botox'].includes(tx);
        //              },
        //              validateOn: ['eventClick', 'eventSave'],
        //              errorTests: [
        //                  {
        //                      // If required for the treatment type, ensure consent is true.
        //                      test: (event) => {
        //                          const tx = event.getField('Treatment Type');
        //                          const required = ['Microneedling', 'Chemical Peel', 'Laser Hair Removal', 'Botox'].includes(tx);
        //                          const consent = !!event.getField('Consent on File');
        //                          return required && !consent;
        //                      },
        //                      message: 'Client consent is required for the selected treatment.'
        //                  }
        //              ],
        //              warningTests: [
        //                  {
        //                      // Warn if consent was updated in this session but Status is still Pending (remind to finalize).
        //                      test: (event) => {
        //                          const changed = event.changes?.hasOwnProperty('Consent on File');
        //                          const isPending = event.status[0] === 'Pending';
        //                          return changed && isPending;
        //                      },
        //                      message: 'Consent updated—remember to confirm booking status.'
        //                  }
        //              ]
        //          },
        //
        //          'Pre-Treatment Fasting Hours': {
        //              // Integer number of hours the client fasted (some IV/peel protocols require NPO or light fasting).
        //              validateOn: ['fieldChange', 'eventSave'],
        //              errorTests: [
        //                  {
        //                      // Must be a non-negative number if provided.
        //                      test: (event) => {
        //                          const val = event.getField('Pre-Treatment Fasting Hours');
        //                          return val == null || isNaN(Number(val)) || Number(val) <= 0;
        //                      },
        //                      message: 'Pre-Treatment Fasting Hours must be a non-negative number.'
        //                  },
        //                  {
        //                      // For “IV Drip (NAD+)” example protocol, require ≥ 4 hours fasting.
        //                      test: (event) => {
        //                          const tx = event.getField('Treatment Type');
        //                          const val = Number(event.getField('Pre-Treatment Fasting Hours') || 0);
        //                          return tx === 'IV Drip (NAD+)' && val < 4;
        //                      },
        //                      message: 'NAD+ drips require at least 4 hours of fasting.'
        //                  }
        //              ],
        //              warningTests: [
        //                  {
        //                      // Warn if very long fast (≥18h) to prompt a wellness check.
        //                      test: (event) => {
        //                          const val = Number(event.getField('Pre-Treatment Fasting Hours') || 0);
        //                          return val >= 18;
        //                      },
        //                      message: 'Extended fasting noted—confirm client comfort and hydration.'
        //                  }
        //              ]
        //          }
        //      };

        // Event Validation Rules
        // -----------------------------

        inputs.globalDefaults = {
            requiredFields: ['Start', 'End', 'Status', 'Patient', 'Visit Type'],
            hiddenFields: ['Title'],
            validationRules: {
                Start: {
                    validateOn: ['eventSave', 'fieldChange'],
                    //markRequired: true,
                    errorTests: [
                        {
                            // Prevent saving if start is in the past
                            test: (e) => e.fieldChanged('start') && e.start.isBefore(moment()),
                            message: '<B>Start</B> time cannot be in the past.',
                            emoji: '⏰'
                        }
                    ]
                },

                End: {
                    validateOn: ['eventSave'],
                    //markRequired: true,
                    errorTests: [
                        {
                            // Prevent saving if start is in the past
                            test: (e) => e.fieldChanged('start') && e.start.isBefore(moment()),
                            message: '<B>Start</B> time cannot be in the past.',
                            emoji: '⏰'
                        }
                    ]
                },

                Status: {
                    // Example dependency: cannot mark Confirmed unless safety checks done
                    validateOn: ['eventClick', 'fieldChange', 'eventSave'],
                    errorTests: [
                        {
                            test: (e) => {
                                // This is a generic test that applies to eventClick
                                // in order to pre-populate default values for the event
                                if (e.trigger === 'eventClick') {

                                    let shouldRefresh = false;

                                    if (e.status[0] === 'Unassigned') {
                                        e.status[0] = 'Pending';
                                        shouldRefresh = true;
                                    }

                                    if (!e.location) {
                                        e.location = 'Seattle, WA';
                                        shouldRefresh = true;
                                    }

                                    if (shouldRefresh) {
                                        dbk.refreshEditPopover(e.editEvent);
                                    }
                                }

                                return false;
                            },
                        },
                        {
                            test: (e) => {
                                // Test only applies to On Save
                                if (e.trigger !== 'eventSave') return false;

                                const tryingToConfirm = e.status && e.status[0] === 'Confirmed';
                                if (!tryingToConfirm) return false;

                                const consentNeededFor = ['Treatment', 'Post-Op'];
                                const notes = (e.getField('Contraindications Notes') || '').trim();
                                const vt = e.getField('Visit Type')?.[0];
                                const contraindicationsOK = !!e.getField('Contraindications Checked');

                                return consentNeededFor.includes(vt) && !contraindicationsOK && notes.length > 0;
                            },
                            message: 'Before <B>Confirming</B> the appointment, please <B>Review Contraindications</B>.',
                            emoji: '❌'
                        }
                    ],
                },

                'Patient': {
                    // Require a patient for all but generic holds
                    validateOn: ['eventSave'],
                    markRequired: true,
                    errorTests: [
                        {
                            test: (e) => !e.contactName.length,
                            message: 'Please select a <B>Patient</B> for this appointment.',
                            emoji: '👤'
                        }
                    ]
                },

                'Guardian Signature Obtained': {
                    // Require for minors
                    validateOn: ['eventRender', 'eventClick', 'fieldChange', 'eventSave'],
                    showField: (e) => ['Treatment', 'Post-Op', 'Follow-Up', 'Package Session'].includes(e.getField('Visit Type')?.[0]) && e.getField('Is Under 18'),
                    markRequired: (e) => e.getField('Is Under 18') && ['Treatment', 'Post-Op', 'Follow-Up', 'Package Session'].includes(e.getField('Visit Type')?.[0]),
                    errorTests: [
                        {
                            test: (e) => e.getField('Is Under 18') && !e.getField('Guardian Signature Obtained') && ['Treatment', 'Post-Op', 'Follow-Up', 'Package Session'].includes(e.getField('Visit Type')?.[0]),
                            message: 'A <B>Guardian Signature</B> is required for patients under 18.',
                            emoji: '🖊️'
                        }
                    ]
                },

                'Visit Type': {
                    markRequired: true
                },

                'Procedure': {
                    validateOn: ['eventClick', 'fieldChange', 'eventSave'],
                    markRequired: true,
                    hideField: (e) => !['Treatment', 'Post-Op'].includes(e.getField('Visit Type')?.[0]),
                    errorTests: [
                        {
                            // Require Procedure for Treatment & Post-Op
                            test: (e) => ['Treatment', 'Post-Op'].includes(e.getField('Visit Type')?.[0]) && !e.getField('Procedure')?.[0] && e.trigger === 'eventSave',
                            message: 'A <B>Procedure Name</B> is required for Treatment or Post-Op visits.',
                            emoji: '⚠️'
                        },
                        {
                            // Get Procedure information from Salesforce On Field change
                            test: async (e) => {
                                // Only run if user changed this field.
                                const procedure = e.getField('Procedure')?.[0];

                                if (!procedure) {

                                    if (e.fieldChanged()) {
                                        e.setField('Contraindications Notes', '');
                                        e.setField('Contraindications Checked', false);
                                        dbk.refreshEditPopover(e.editEvent);
                                    }

                                    return false;
                                }

                                const sf = SalesforceClient({ errorMode: "return" });

                                const [resp, rows] = await sf.query(`
                            SELECT Id, Name, Duration__c, Contraindications__c 
                            FROM Procedure__c WHERE Name = ${sf.quote(procedure)} 
                            LIMIT 1
                            `);

                                if (!resp.ok || rows.length === 0) {
                                    sf.showError(resp);
                                } else {

                                    const proc = rows[0];
                                    const duration = Number(proc.Duration__c) || 60;
                                    const notes = proc.Contraindications__c || '';

                                    // Set Duration by updating End time
                                    if (e.start) {
                                        e.end = e.start.clone().add(duration, 'minutes');
                                    }

                                    // Set Contraindications_Notes__c field
                                    e.setField('Contraindications Notes', notes);
                                    dbk.refreshEditPopover(e.editEvent);
                                }

                                return false;
                            }
                        }
                    ]
                },

                'Chief Complaint': {
                    // Require for Consults
                    validateOn: ['eventClick', 'eventSave'],
                    hideField: (e) => e.getField('Visit Type')?.[0] !== 'Consult',
                    markRequired: (e) => e.getField('Visit Type')?.[0] === 'Consult',
                    errorTests: [
                        {
                            test: (e) => e.getField('Visit Type')?.[0] === 'Consult' && !(e.getField('Chief Complaint') || '').trim(),
                            message: 'Please fill in a <B>Chief Complaint</B> for Consults.',
                            emoji: '📋'
                        }
                    ]
                },

                'Anatomic Area': {
                    validateOn: ['eventRender', 'eventClick', 'eventSave'],
                    hideField: (e) => !['Treatment', 'Post-Op'].includes(e.getField('Visit Type')?.[0]),
                    markRequired: (e) => /(laser|inject|tox|filler|peel|sculpt)/i.test(e.getField('Procedure')?.[0]),
                    errorTests: [
                        {
                            test: (e) => {
                                // Only run on test on eventSave

                                const visit = ['Treatment', 'Post-Op'].includes(e.getField('Visit Type')?.[0]);
                                const req = /(laser|inject|tox|filler|peel|sculpt)/i.test(e.getField('Procedure')?.[0]);
                                const area = e.getField('Anatomic Area')?.trim() || '';
                                const empty = !area || (Array.isArray(area) && area.length === 0);
                                return visit && req && empty;
                            },
                            message: 'Please provide the <B>Anatomic Area</B> for the selected procedure.',
                            emoji: '🧍'
                        }
                    ]
                },

                'Practitioner': {
                    validateOn: ['eventClick', 'fieldChange', 'eventSave'],
                    markRequired: true,
                    errorTests: [
                        {
                            critical: true,
                            test: (e) => {
                                return e.trigger === 'eventSave' && (e.resource.length === 0 ||
                                    e.resource[0] === 'Unassigned');
                            },
                            message: 'Please select a <B>Practitioner</B> for this appointment.',
                            emoji: '👩‍⚕️'
                        },
                        {
                            test: (e) => {

                                if (e.resource[0] == 'none' || !e.resource[0] || e.resource[0] == 'Unassigned') return false;

                                const resource = e.resource[0];
                                const visit = ['Treatment', 'Post-Op'].includes(e.getField('Visit Type')?.[0]);
                                const proc = e.getField('Procedure')?.[0];

                                if (!visit || !proc) return false;

                                // Check cached result first
                                const [cached, result] = getCachedQuery(`${resource}-${proc}`);

                                // Cached result found, return it
                                if (cached) return result;

                                // Not cached, so we need to run the full query test
                                return validateResourceCertification(this, resource, proc);
                            },
                            message: 'The Practitioner\'s <B>License Type or Credential</B> doesn\'t match the selected Procedure.',
                            emoji: '🪪'
                        },
                        {
                            skipOnError: true, // Skip this test if prior test already failed
                            test: (e) => {
                                if (e.resource[0] == 'none' || !e.resource[0] || e.resource[0] == 'Unassigned') return false;

                                const resource = e.resource[0];
                                const visit = ['Treatment', 'Post-Op'].includes(e.getField('Visit Type')?.[0]);
                                const proc = e.getField('Procedure')?.[0];

                                if (!visit || !proc) return false;

                                return validateResourceCertification(e, resource, proc);
                            },
                            message: 'The Practitioner\'s <B>License Type or Credential</B> doesn\'t match the selected Procedure.',
                            emoji: '🪪'
                        },
                    ]
                },

                'Contraindications Notes': {
                    validateOn: ['eventClick', 'eventSave'],
                    hideField: (e) => !['Treatment', 'Post-Op'].includes(e.getField('Visit Type')?.[0]),
                    markRequired: true,
                    warningTests: [
                        {
                            test: (e) => {
                                const notes = (e.getField('Contraindications Notes') || '').trim();
                                return !!notes && notes.length < 8;
                            },
                            message: 'The <B>Contraindication notes</B> look very brief — please add detail if clinically relevant.',
                            emoji: '📝'
                        }
                    ]
                },

                'Contraindications Checked': {
                    validateOn: ['fieldChange', 'eventSave'],
                    markRequired: (e) => { return ['Treatment', 'Post-Op'].includes(e.getField('Visit Type')?.[0]); },
                    hideField: (e) => { return !['Treatment', 'Post-Op'].includes(e.getField('Visit Type')?.[0]) || !e.getField('Procedure')?.[0]; },
                    warningTests: [
                        {
                            // If notes exist but box not checked, prompt to review
                            test: (e) => {
                                if (!e.fieldChanged('Contraindications Notes')) return false;

                                const notes = e.getField('Contraindications Notes')?.trim();
                                const checked = !!e.getField('Contraindications Checked');
                                return !!notes && !checked;
                            },
                            message: 'You added <B>contraindication Notes</B> — mark as checked after review.',
                            emoji: '⚠️'
                        }
                    ],
                    errorTests: [
                        {
                            // Enforce when moving to Confirmed
                            test: (e) => {
                                const isConfirming = e.status && e.status[0] === 'Confirmed';
                                const required = ['Treatment', 'Post-Op'].includes(e.getField('Visit Type')?.[0]);
                                const proc = e.getField('Procedure')?.[0];
                                return isConfirming && proc && required && !e.getField('Contraindications Checked');
                            },
                            message: 'Please ensure <B>Contraindications</B> are checked before confirming the appointment.',
                            emoji: '⚠️'
                        }
                    ]
                },

                'Allergy Notes': {
                    validateOn: ['eventRender', 'eventClick', 'eventSave'],
                    markRequired: (e) => { return ['Treatment', 'Post-Op', 'Follow-Up', 'Package Session'].includes(e.getField('Visit Type')?.[0]); },
                    hideField: (e) => { return !['Treatment', 'Post-Op', 'Follow-Up', 'Package Session'].includes(e.getField('Visit Type')?.[0]); },
                    warningTests: [
                        {
                            // Simple keyword check related to common agents
                            test: (e) => {
                                const a = e.getField('Allergy Notes') || '';
                                const svc = e.getField('Procedure')?.[0] || '';
                                if (!a || !svc) return false;
                                const lidocaineRelated = /botox|microneedling/i.test(svc);
                                return lidocaineRelated && /(lido|lidocaine|caine|novocaine)/i.test(a);
                            },
                            message: 'The patient has an <B>allergy</B> that may conflict with local anesthetics - verify protocol.',
                            emoji: '⚠️'
                        },
                        {
                            test: (e) => {
                                const a = e.getField('Allergy Notes') || '';
                                const proc = e.getField('Procedure')?.[0] || '';
                                if (!a && proc) return true
                            },
                            message: 'Please ask the patient about any <B>allergies</B>.',
                            emoji: '❓'
                        }
                    ]
                },

                'Progress Report Complete': {
                    validateOn: ['eventRender', 'eventClick', 'fieldChange', 'eventSave'],
                    markRequired: (e) => { return e.getField('Progress Report Required') && ['Follow-Up', 'Post-Op'].includes(e.getField('Visit Type')?.[0]); },
                    hideField: (e) => { return !e.getField('Progress Report Required') || !['Follow-Up', 'Post-Op'].includes(e.getField('Visit Type')?.[0]); },
                    warningTests: [
                        {
                            test: (e) => {
                                const hasReport = e.getField('Progress Report Required');
                                const complete = e.getField('Progress Report Complete');
                                const tx = ['Follow-Up', 'Post-Op'].includes(e.getField('Visit Type')?.[0]);
                                return tx && hasReport && !complete && !(e.trigger === 'eventSave' && e.status[0] === 'Complete');
                            },
                            message: 'Please confirm that the <B>Progress Report</B> is complete.',
                            emoji: '✅'
                        }
                    ],
                    errorTests: [
                        {
                            critical: true,
                            test: (e) => {
                                const hasReport = e.getField('Progress Report Required');
                                const complete = e.getField('Progress Report Complete');
                                const tx = ['Follow-Up', 'Post-Op'].includes(e.getField('Visit Type')?.[0]);
                                return tx && hasReport && !complete && e.trigger === 'eventSave' && e.status[0] === 'Complete';
                            },
                            message: 'Please confirm that the <B>Progress Report</B> is complete.',
                            emoji: '✅'
                        }
                    ]
                },
            }
        };

        // Your SOQL Query Helper functions
        // --------------------------------
        //
        // Use this section to define any helper functions you need to run
        // queries against Salesforce to validate event data.
        //
        // The example below checks that the selected Resource (Practitioner)
        // has the required Certification or License Tier to perform the
        // selected Procedure. It uses a simple caching mechanism to avoid
        // repeated queries for the same Resource-Procedure pair during
        // validation.

        async function validateResourceCertification(opt, resource, procedure) {

            // Load Salesforce client library
            const sf = SalesforceClient({ errorMode: "return" });

            // Get Practitioner info
            const [resp1, rows1] = await sf.query(`
                        SELECT Id, Certifications__c, License_Tiers__c 
                        FROM Practitioner__c WHERE Name = ${sf.quote(resource)} 
                        LIMIT 1
                    `);

            if (!resp1.ok || rows1.length === 0) {
                if (!resp1.ok) sf.showError(resp1);
                return true;
            }

            // Get Procedure info
            const [resp2, rows2] = await sf.query(`
                        SELECT Id, Required_Certifications__c, Required_License_Tiers__c 
                        FROM Procedure__c WHERE Name = ${sf.quote(procedure)} 
                        LIMIT 1
                    `);

            if (!resp2.ok || rows2.length === 0) {
                if (!resp2.ok) sf.showError(resp2);
                return true;
            }

            // Find the intersection of Practitioner and Procedure certs/tiers
            // If no intersection, return true to indicate an error
            // If intersection exists, return false (no error)

            const prac = rows1[0];
            const proc = rows2[0];

            // Helper to split and trim, but return [] for blank/empty/null
            function splitList(str) {
                if (!str || !str.trim()) return [];
                return str.split(';').map(s => s.trim()).filter(Boolean);
            }

            const pracCerts = splitList(prac.Certifications__c);
            const pracTiers = splitList(prac.License_Tiers__c);

            const reqCerts = splitList(proc.Required_Certifications__c);
            const reqTiers = splitList(proc.Required_License_Tiers__c);

            const certsOK = reqCerts.length === 0 || reqCerts.some(c => pracCerts.includes(c));
            const tiersOK = reqTiers.length === 0 || reqTiers.some(t => pracTiers.includes(t));

            const result = !(certsOK && tiersOK);

            // Cache the result for this resource-procedure pair for the session

            saveCachedQuery(`${resource}-${procedure}`, result);

            return result;
        }

        //----------- End Configuration: You do not need to edit below this line -------------------

        // Simple in-memory cache for query results to avoid repeated queries during validation
        // Use a unique key for each query you want to cache
        // Cached entries expire after inputs.queryCacheExpiry milliseconds

        function getCachedQuery(key) {

            const hasEntry = inputs.queryCache.hasOwnProperty(key);
            if (hasEntry) {
                const entry = inputs.queryCache[key];
                const isValid = (new Date().getTime() - entry.timestamp) < inputs.queryCacheExpiry;
                if (isValid) {
                    return [true, entry.data];
                } else {
                    delete inputs.queryCache[key];
                }
            }
            return [false, null];
        }

        function saveCachedQuery(key, data) {
            inputs.queryCache[key] = {
                timestamp: new Date().getTime(),
                data: data
            };
        }

    } catch (error) {
        reportError(error);
    }

    //----------- The action itself: you may not need to edit this. -------------------

    // Action code goes inside this function
    function run() {

        // Expose libraries and utility functions globally for use in other actions
        globalThis.seedcodeCalendar = globalThis.sc = seedcodeCalendar;
        globalThis.utilities = globalThis.u = utilities;
        globalThis.q = function (qs) { return document.querySelector(qs) };
        globalThis.qa = function (qsa) { return document.querySelectorAll(qsa) };

        // Reopen Popover

        let revertPopoverChanges = false;
        let blockOnEventClick = false;

        // Initialize error handling system
        let allEventErrors = {};
        let allEventWarnings = {};
        let allEventRequired = {};
        let allEventHidden = { hiddenFields: {} };

        // Error handler object for use by other app actions
        let validationHandler = {
            onEventClick: onEventClick,
            onFieldChange: onFieldChange,
            beforeEventRendered: beforeEventRendered,
            beforeEventSave: beforeEventSave,
            onEventSave: onEventSave,

            // Store of current errors/warnings/required fields by eventID

            allEventErrors: allEventErrors,
            allEventWarnings: allEventWarnings,
            allEventRequired: allEventRequired,
            allEventHidden: allEventHidden,

            // Function to allow other actions to trigger recalculation of errors

            globalDefaults: inputs.globalDefaults,
            calendarDefaults: inputs.calendarDefaults,

            setGlobalDefaults: (newDefaults) => {
                inputs.globalDefaults = newDefaults;
                compileValidationRules();
            },

            setCalendarDefaults: (newDefaults) => {
                inputs.calendarDefaults = newDefaults;
                compileValidationRules();
            }
        };

        // Compile Validation Rules

        compileValidationRules();

        // Register the handler globally so other actions can access it

        sc.init('validationHandler', validationHandler);

        // -----------------------------------------------------------
        // Event Handlers
        // -----------------------------------------------------------

        // Handle event click
        function onEventClick(event, editEvent, action) {

            // Define popover object to isolate query selectors to it

            let popover;

            // Cancel the default action to prevent the popover from opening 
            // if another popover is still open

            if (blockOnEventClick) {
                return action?.callbacks?.cancel();
            }

            action?.callbacks?.confirm();

            calculateEventErrors(event, editEvent, 'eventClick', {});

            // Get current errors/warnings/required for the event

            let eventErrors = allEventErrors[event.eventID]?.errorFields || {};
            let eventWarnings = allEventWarnings[event.eventID]?.warningFields || {};
            let eventRequired = allEventRequired[event.eventID]?.requiredFields || {};
            let eventHidden = allEventHidden[event.eventID]?.hiddenFields || {};

            // Observe the event popover and add errors to the fields
            let eventObserver = dbk.observe({
                name: `event_${event.eventID}`,
                watch: document.body,
                until: '.ng-popover:not([data-popover-event-id]) .dbk_button_success',
                then: addPopoverElements
            });

            // Get custom field labels and names
            let customFields = {};

            Object.values(event?.schedule?.customFields).map((field) => {
                customFields[field.name] = { id: field.id, field: field.field };
            });

            // Calculate if Event has an error
            function addPopoverElements(o) {
                o.destroy();

                // Assign Popover the Event ID

                popover = q('.ng-popover:not([data-popover-event-id])')
                if (popover) {
                    popover.dataset.popoverEventId = event.eventID;
                }

                // Get Popover Label Fields

                const labels = Array.from(popover.querySelectorAll('.panel-selector span[translate]'));
                const fieldList = [];

                labels.forEach((item) => {
                    let label = item.textContent;
                    if (label.length) {
                        fieldList.push({ label, element: item });
                    }
                });

                fieldList.push({ label: 'Title', element: q('textarea#title') });
                fieldList.push({ label: 'Description', element: q('div[field="description"]') });

                // Add errors to labels that have errors

                for (const { label, element } of fieldList) {
                    if (!customFields.hasOwnProperty(label)) {
                        if (eventErrors[label]) {
                            addFieldError('error', fieldList, label, eventErrors[label]);
                        } else if (eventWarnings[label]) {
                            addFieldError('warning', fieldList, label, eventWarnings[label]);
                        } else {
                            addFieldError('', fieldList, label, '');
                        }
                    }
                }

                // Calculate Changes Object at the outset of event creation popover. This
                // object will be checked for changes to fire fieldChange events

                let changesObject = dbk.eventChanged(editEvent, event.beforeDrop || event);

                const popoverClickMainHandler = (e) => {

                    // Recalculate errors if user clicked on a field

                    if (q('.modal-dialog') || blockOnEventClick) return;

                    // Recalculate changes object
                    let changesObjectNew = dbk.eventChanged(editEvent, event.beforeDrop || event);

                    // Compare changesObject and changesObjectNew by stringifying
                    let keysChanged = false;
                    try {
                        const oldStr = JSON.stringify(changesObject);
                        const newStr = JSON.stringify(changesObjectNew);
                        keysChanged = oldStr !== newStr;
                    } catch (e) {
                        paintVisualElements(event);
                    }

                    if (keysChanged) {
                        calculateEventErrors(event, editEvent, 'fieldChange', changesObjectNew);

                        // Get current errors/warnings/required for the event
                        eventErrors = allEventErrors[event.eventID]?.errorFields || {};
                        eventWarnings = allEventWarnings[event.eventID]?.warningFields || {};
                        eventRequired = allEventRequired[event.eventID]?.requiredFields || {};
                        eventHidden = allEventHidden[event.eventID]?.hiddenFields || {};

                        // Update changesObject reference
                        changesObject = changesObjectNew;
                    } else {
                        paintVisualElements(event);
                    }
                };

                // Add event listener for popover click
                popover.querySelector('.dbk_editEvent')
                    ?.addEventListener('click', debounce(popoverClickMainHandler, 200));

                let customFieldsObserver = dbk.observe({
                    name: `event_cusfields_${event._id}`,
                    watch: popover,
                    until: `.ng-popover[data-popover-event-id="${event.eventID}"] .panel-switch:not(.fieldsProcessed)`,
                    then: checkCustomFields
                });

                let utilityDrawerObserver = dbk.observe({
                    name: `event_utildrawer_${event._id}`,
                    watch: popover,
                    until: `.utility-panel:not([data-listener-added])`,
                    then: (o) => {
                        o.stop();
                        popover.querySelectorAll('.utility-panel')?.forEach((drawer) => {
                            if (drawer.dataset.listenerAdded) return;
                            drawer.dataset.listenerAdded = 'true';
                            drawer.addEventListener('click', debounce(popoverClickMainHandler, 200));
                        });
                    }
                });

                dbk.observe({
                    name: `event_destroy_${event.eventID}`,
                    watch: q('.calendar-scroll'),
                    until: () => {
                        return !document.querySelector(`.ng-popover[data-popover-event-id="${event.eventID}"]`);
                    },
                    then: (o) => {
                        customFieldsObserver.destroy();
                        utilityDrawerObserver.destroy();
                        eventObserver.destroy();
                        o.destroy();
                    }
                });
            }

            function checkCustomFields(o) {
                o.stop();

                // Repaint visual elements

                paintVisualElements(event);

                // Get current errors/warnings/required for the event

                eventErrors = allEventErrors[event.eventID]?.errorFields || {};
                eventWarnings = allEventWarnings[event.eventID]?.warningFields || {};
                eventRequired = allEventRequired[event.eventID]?.requiredFields || {};
                eventHidden = allEventHidden[event.eventID]?.hiddenFields || {};

                // Name the custom fields

                let labels = popover.querySelectorAll('.ng-popover[data-popover-event-id] .panel-switch li');

                labels?.forEach((item) => {
                    let labelNode = item.querySelector('label');
                    let label = labelNode?.textContent?.trim();
                    if (label && customFields[label]) {
                        item.dataset.fieldId = customFields[label].id;
                        item.dataset.fieldName = customFields[label].field;
                        item.dataset.fieldLabel = label;
                    }
                });

                const changesObject = dbk.eventChanged(editEvent, event.beforeDrop || event);

                popover.querySelectorAll('.ng-popover[data-popover-event-id] .panel-switch:not(.fieldsProcessed)')?.forEach((panelSwitch) => {

                    labels?.forEach((item) => {
                        let label = item?.dataset?.fieldLabel;
                        let fieldId = item.dataset.fieldId;

                        if (eventErrors.hasOwnProperty(label)) {
                            item?.classList?.remove('hasChanged');
                            item?.classList?.add('hasError');
                        } else if (eventWarnings.hasOwnProperty(label)) {
                            item?.classList?.remove('hasChanged');
                            item?.classList?.add('hasWarning');
                        } else {
                            if (fieldId && changesObject.hasOwnProperty(fieldId)) {
                                item.classList.add('hasChanged');
                            }
                        }

                        if (eventRequired.hasOwnProperty(label)) {
                            item?.classList?.add('requiredField');
                        }

                        if (eventHidden.hasOwnProperty(label)) {
                            item?.classList?.add('hiddenField');
                        }

                        addTooltip(item, item, label);

                    });

                    panelSwitch.classList.add('fieldsProcessed');
                });

                setTimeout(() => { o.restart(); }, 1000);
            }

            function addTooltip(panelSelector, node, label) {

                let tooltip;

                const tooltipOptions = {
                    delay: { show: 200, hide: 0 },
                    hide: true,
                    position: "bottom",
                    targetElement: node,
                    className: "hasErrorTooltip"
                };

                node.onmouseenter = debounce(showTooltip, 200);
                node.onmouseleave = debounce(hideTooltip, 200);

                node.addEventListener('dbkOnErrorAdd', () => debounce(showTooltip, 200)());
                node.addEventListener('dbkOnErrorRemove', () => debounce(hideTooltip, 200)());

                function showTooltip() {
                    if (panelSelector?.classList?.contains('hasError') || panelSelector?.classList?.contains('hasWarning')) {
                        tooltip = dbk.tooltip(getTooltipText(), tooltipOptions);
                        tooltip?.show();
                    }
                }

                function hideTooltip() {
                    tooltip?.hide();
                }

                function getTooltipText() {
                    const errors = allEventErrors[event.eventID]?.errorFields[label];
                    const warnings = allEventWarnings[event.eventID]?.warningFields[label];
                    return errors
                        ? (Array.isArray(errors) ? errors.join('<br><br>') : errors)
                        : warnings
                            ? (Array.isArray(warnings) ? warnings.join('<br><br>') : warnings)
                            : ' - ';
                }
            }

            function addFieldError(type, fieldList, fieldName, message) {

                let items = fieldList.filter(item => item.label === fieldName);

                for (const { label, element } of items) {

                    let panelSelector;

                    if (label.toLowerCase() == 'title' || label.toLowerCase() == 'description') {
                        panelSelector = element;
                    } else {
                        panelSelector = element?.parentNode?.parentNode;
                    }

                    if (!panelSelector) {
                        return;
                    }

                    if (type != '') {
                        panelSelector?.classList?.remove('hasChanged');
                        panelSelector?.classList?.add(type === 'error' ? 'hasError' : 'hasWarning');
                    }

                    panelSelector.dataset.fieldId = label;
                    panelSelector.dataset.fieldName = label;
                    panelSelector.dataset.fieldLabel = label;

                    if (eventRequired.hasOwnProperty(label)) {
                        panelSelector?.classList?.add('requiredField');
                    }

                    if (eventHidden.hasOwnProperty(label)) {
                        panelSelector?.classList?.add('hiddenField');
                    }

                    // Add tooltip
                    addTooltip(panelSelector, panelSelector, label);
                }
            }
        }

        // Before Event Rendered

        function beforeEventRendered(event, action) {

            let errorIconContainer = '<span class="errorIconContainer"><i class="fa fa-exclamation-circle"></i></span><span class="noShow">has error </span><div class="shimmer"></div>';
            let warningIconContainer = '<span class="warningIconContainer"><i class="fa fa-info-circle"></i></span><span class="noShow">has warning </span><div class="shimmer"></div>';

            let className = Array.isArray(event.className) ? event.className : [];

            event.className = !Array.isArray(event.className) && event.className.length > 0 ? [className] : className;

            if (!/errorIconContainer/.test(event.title)) {
                event.title = errorIconContainer + warningIconContainer + event.title;
            }

            calculateEventErrors(event, event, 'eventRender', {});

            if (allEventErrors[event.eventID] && !/hasError/.test(event.className)) {
                event.className.push('hasError');
            }

            if (allEventWarnings[event.eventID] && !/hasWarning/.test(event.className)) {
                if (!event.className.some(e => e === 'hasError')) {
                    event.className.push('hasWarning');
                }
            }

            return action?.callbacks?.confirm();
        }

        // On Field Changed

        function onFieldChange(event, editEvent, params, action) {
            // Handle field change event

            let fieldId = params.data.field;
            let value = params.data.value;
            let label = params.data.label;

            let before = editEvent[fieldId];
            editEvent[fieldId] = value;

            // Get the field element in the popover
            let element = q(`[data-field-id="${fieldId}"]`);
            if (!element) return action?.callbacks?.confirm();

            // Get any changes
            const changesObject = dbk.eventChanged(editEvent, event.beforeDrop || event);

            // Recalculate errors
            calculateEventErrors(event, editEvent, 'fieldChange', changesObject);

            let errorFields = allEventErrors[event.eventID]?.errorFields || {};
            let warningFields = allEventWarnings[event.eventID]?.warningFields || {};

            if (errorFields.hasOwnProperty(label)) {
                element.classList.remove('hasChanged');
                element.classList.add('hasError');
                setTimeout(() => {
                    element.dispatchEvent(new Event("dbkOnErrorAdd", { bubbles: true }));
                }, 200);
            } else {
                element.classList.remove('hasError');
                element.dispatchEvent(new Event("dbkOnErrorRemove", { bubbles: true }));
            }

            if (warningFields.hasOwnProperty(label)) {
                element.classList.remove('hasChanged');
                element.classList.add('hasWarning');
                setTimeout(() => {
                    element.dispatchEvent(new Event("dbkOnErrorAdd", { bubbles: true }));
                }, 200);

            } else {
                element.classList.remove('hasWarning');
                element.dispatchEvent(new Event("dbkOnErrorRemove", { bubbles: true }));
            }

            // Treat '' as equivalent to undefined for change detection
            const originalValue = (event[fieldId] === '' || event[fieldId] === undefined) ? undefined : event[fieldId];
            const newValue = (editEvent[fieldId] === '' || editEvent[fieldId] === undefined) ? undefined : editEvent[fieldId];

            if (!element.classList?.contains('hasError') &&
                !element.classList?.contains('hasWarning') &&
                originalValue !== newValue) {
                element.classList.add('hasChanged');
            } else {
                element.classList.remove('hasChanged');
            }

            editEvent[fieldId] = before;

            return action?.callbacks?.confirm();
        }

        // On Event Save

        function onEventSave(event, editEvent, changesObject, action) {

            if (revertPopoverChanges) {
                revertPopoverChanges = false;
                changesObject = {};
                action?.callbacks?.cancel();
            } else {
                action?.callbacks?.confirm();
            }
        }

        // Before Event Save

        async function beforeEventSave(event, editEvent, action) {

            blockOnEventClick = true;

            // Handle field change event
            const changesObject = dbk.eventChanged(editEvent, event.beforeDrop || event);

            // If validateUnchangedEvents is false and there are no changes, skip validation
            if (!inputs.validateUnchangedEvents && Object.keys(changesObject).length === 0) {
                blockOnEventClick = false;
                return action?.callbacks?.confirm();
            }

            const criticalErrors = await calculateEventErrors(event, editEvent, 'eventSave', changesObject);

            let errorFields = allEventErrors[event.eventID]?.errorFields || {};
            let warningFields = allEventWarnings[event.eventID]?.warningFields || {};

            // If no errors or warnings, just confirm
            if (Object.keys(errorFields).length === 0 && Object.keys(warningFields).length === 0) {
                blockOnEventClick = false;
                return action?.callbacks?.confirm();
            }

            // Build combined modal HTML
            let modalHtml = `
                    <style>

                        .modal-dialog {
                            width: auto !important;
                            height: auto !important;
                            max-width: 40%;
                            max-height: 60%;
                            border-radius: 5px;
                        }

                        @media screen and (max-width: 1024px) {
                            .modal-dialog {
                                max-width: 60%;
                                max-height: 80%;
                            }
                        }

                        .modal-content {
                            width: 100%;
                            height: 100% !important;
                            background-color: rgb(60,60,60);
                            padding: 20px;
                        }

                        .modalHeader {
                            font-size: 2rem;
                            font-weight: bold;
                            margin-bottom: 30px;
                            color: pink;
                            border-bottom: 1px solid rgb(100,100,100);
                            padding-bottom: 10px;
                        }

                        .modalBody { 
                            color: white; 
                            padding: 0px 20px;
                        }

                        .modalButtons {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-top: 30px;
                            border-top: 1px solid rgb(100,100,100);
                            padding-top: 10px;
                        }
                        .modalButtons .left-buttons {
                            display: flex;
                            gap: 5px;
                        }
                        .modalButtons .right-buttons {
                            display: flex;
                            gap: 5px;
                        }
                        .errorList li span {
                            font-weight: bold;
                            color: pink;                
                        }            
                        .warningList li span {
                            font-weight: bold;
                            color: orange;
                        }

                        .modalButtons .btn-default {
                            background-color: transparent;
                            border-color: white;
                            color: white;
                        }

                        .modalButtons .btn-primary {
                            background-color: red;
                            border-color: red;
                        }

                        .modalButtons .btn-primary:active {
                            background-color: darkred;
                            border-color: black;
                        }

                        .modal-dialog li {
                            list-style-type: none; 
                        }

                        .modal-dialog li ul li {
                            list-style-type: disc;
                        }

                        .modal-dialog .emoji {
                            display: inline-block;
                            width: 1em;
                            margin-right: 0.5em;
                        }
                    </style>
                    <div class="modalHeader">
                        Validation Issues Detected
                    </div>
                    <div class="modalBody">
                    `;
            // Precompute emoji maps for errors and warnings
            const errorEmojis = {};
            const warningEmojis = {};
            for (const [label, rule] of Object.entries(inputs.validationRules)) {
                if (rule && Array.isArray(rule.errorTests)) {
                    for (const test of rule.errorTests) {
                        if (test.message && test.emoji) {
                            if (!errorEmojis[label]) errorEmojis[label] = {};
                            errorEmojis[label][test.message] = `<span class="emoji">${test.emoji}</span>`;
                        }
                    }
                }
                if (rule && Array.isArray(rule.warningTests)) {
                    for (const test of rule.warningTests) {
                        if (test.message && test.emoji) {
                            if (!warningEmojis[label]) warningEmojis[label] = {};
                            warningEmojis[label][test.message] = `<span class="emoji">${test.emoji}</span>`;
                        }
                    }
                }
            }

            if (Object.keys(errorFields).length > 0) {
                modalHtml += `<p>Please address the following errors:</p><ul class="errorList">`;
                for (const [label, messages] of Object.entries(errorFields)) {
                    if (Array.isArray(messages)) {
                        messages.forEach(msg => {
                            const emoji = errorEmojis[label]?.[msg] ? errorEmojis[label][msg] + ' ' : '🚫 ';
                            modalHtml += `<li><span>${emoji}${label}</span><ul><li>${msg}</li></ul></li>`;
                        });
                    } else {
                        const emoji = errorEmojis[label]?.[messages] ? errorEmojis[label][messages] + ' ' : '⚠️ ';
                        modalHtml += `<li><span>${emoji}${label}</span><ul><li>${messages}</li></ul></li>`;
                    }
                }
                modalHtml += '</ul>';
            }
            if (Object.keys(warningFields).length > 0) {
                modalHtml += `<p>Please review the following warnings:</p><ul class="warningList">`;
                for (const [label, messages] of Object.entries(warningFields)) {
                    if (Array.isArray(messages)) {
                        messages.forEach(msg => {
                            const emoji = warningEmojis[label]?.[msg] ? warningEmojis[label][msg] + ' ' : '';
                            modalHtml += `<li><span>${emoji}${label}</span><ul><li>${msg}</li></ul></li>`;
                        });
                    } else {
                        const emoji = warningEmojis[label]?.[messages] ? warningEmojis[label][messages] + ' ' : '';
                        modalHtml += `<li><span>${emoji}${label}</span><ul><li>${messages}</li></ul></li>`;
                    }
                }
                modalHtml += '</ul>';
            }

            modalHtml += `</div>`;

            // Define modal config
            var config = {
                container: q('#calendar-container') ? '#calendar-container' : '#app-container',
                type: 'modal',
                destroy: true,
                show: true,
                class: 'validationModal',
                cancelButton: function () {
                    blockOnEventClick = false;
                    return action.callbacks.cancel();
                },
                confirmButton: function () {
                    if ((Object.keys(errorFields).length > 0 && inputs.askForSecondConfirmation) ||
                        (Object.keys(warningFields).length > 0 && inputs.askForSecondConfirmation)) {

                        utilities.showModal(
                            "Confirm Changes",
                            "Are you sure you want to override and save changes anyway?",
                            "No, Fix issues",
                            () => {
                                blockOnEventClick = false;
                                action?.callbacks?.cancel();
                            },
                            "Override and Save",
                            () => {
                                blockOnEventClick = false;
                                action?.callbacks?.confirm();
                            }
                        );
                    } else {
                        blockOnEventClick = false;
                        action?.callbacks?.confirm();
                    }
                },
                revertButton: function () {
                    blockOnEventClick = false;
                    revertPopoverChanges = true;
                    return action.callbacks.confirm();
                },
                autoHeight: true,
            };
            // Modal buttons

            modalHtml += `
                    <style>

                    </style>
                    <div class="modalButtons">
                        <div class="left-buttons">
                            <button ng-click="popover.config.revertButton(); popover.config.show = false;" class="btn btn-xs btn-default" style="margin: 5px;"><span class="fa fa-fw fa-undo"></span> Undo Changes</button>
                        </div>
                        <div class="right-buttons">
                            <button ng-click="popover.config.cancelButton(); popover.config.show = false;" class="btn btn-xs btn-success" style="margin: 5px;"><span class="fa fa-fw fa-check"></span> Review Issues</button>
                    `;

            // Block critical errors from being overridden
            // Allow save if only warnings, or if allowSaveOnError/allowSaveOnWarning is true

            if (!criticalErrors &&
                (Object.keys(errorFields).length > 0 || Object.keys(warningFields).length > 0) &&
                (inputs.allowSaveOnError && Object.keys(errorFields).length > 0) ||
                (inputs.allowSaveOnWarning && Object.keys(warningFields).length > 0 && Object.keys(errorFields).length === 0)) {
                modalHtml += `
                        <button ng-click="popover.config.confirmButton(); popover.config.show = false;" class="btn btn-xs btn-primary" style="margin: 5px;"><span class="fa fa-fw fa-save"></span> Save Anyway</button>
                        `;
            }

            modalHtml += `
                        </div>
                    </div>
                    `;

            blockOnEventClick = true;

            utilities.popover(config, modalHtml);
        }

        // -----------------------------------------------------------
        // Error Calculation Logic
        // -----------------------------------------------------------

        // Calculate Event Error

        async function calculateEventErrors(event, editEvent, trigger, changesObject = {}) {

            // Clear previous errors/warnings

            if (Object.hasOwn(allEventErrors, event.eventID)) {
                delete allEventErrors[event.eventID];
            }
            if (Object.hasOwn(allEventWarnings, event.eventID)) {
                delete allEventWarnings[event.eventID];
            }
            if (Object.hasOwn(allEventRequired, event.eventID)) {
                delete allEventRequired[event.eventID];
            }
            if (Object.hasOwn(allEventHidden, event.eventID)) {
                delete allEventHidden[event.eventID];
            }

            // Create a field resolution map for custom fields
            // This will be used by the getCustomFieldValue and setCustomFieldValue functions
            // to map between field labels, field names, and field ids

            let fieldResolutionMap = {};

            Object.values(event.schedule.customFields)?.forEach(f => {
                fieldResolutionMap[f.name] = f.id;
                fieldResolutionMap[f.field] = f.id;
            });

            if (trigger != 'eventRender') {
                document.querySelectorAll(`[data-field-label][content-id]`)?.forEach(el => {
                    const contentId = el.getAttribute('content-id');
                    const fieldName = contentId?.split('.')?.pop();
                    if (!fieldName) return;
                    fieldResolutionMap[el.dataset.fieldLabel] = fieldName;
                });
            }

            // Map changesObject keys (which may be field ids) to their label names for use in validation
            let changes = {};
            if (editEvent && editEvent.schedule && editEvent.schedule.customFields) {
                const customFields = Object.values(editEvent.schedule.customFields);
                for (const key of Object.keys(changesObject)) {
                    // Try to find a custom field label for this key
                    const field = customFields.find(f => f.id === key);
                    if (field) {
                        changes[field.name] = changesObject[key];
                    } else {
                        // If not a custom field, just use the key as-is (for standard fields)
                        changes[key] = changesObject[key];
                    }
                }
            }

            let errorFields = {};
            let warningFields = {};
            let requiredFields = {};
            let hiddenFields = {};
            let criticalErrors = false;

            // Proxy for editEvent to allow test functions to use 'this'

            function createEditEventProxy(editEvent, context, field) {
                return new Proxy(editEvent, {
                    get(target, prop) {
                        if (prop in context) {
                            // If fieldChanged is called without a label, use field from context
                            if (prop === 'fieldChanged') {
                                return (label) => context.fieldChanged(label !== undefined ? label : field);
                            }
                            return context[prop];
                        }
                        return target[prop];
                    }
                });
            }

            // Define context for validation functions

            const context = {
                event: event,
                editEvent: editEvent,
                trigger: trigger,
                changes: changes,
                errors: errorFields,
                warnings: warningFields,
                getField: (name) => getCustomFieldValue(name),
                setField: (name, value) => setCustomFieldValue(name, value),
                fieldChanged: (label) => changes.hasOwnProperty(label),
                pushError: pushError,
                pushWarning: pushWarning,
                markRequired: markRequired,
                showField: showField,
                hideField: (field) => hideField(field)
            };

            for (const [field, rules] of Object.entries(inputs.validationRules)) {

                let messages = { errors: [], warnings: [] };

                const proxyEditEvent = createEditEventProxy(editEvent, context, field);

                // Required field

                if (rules.hasOwnProperty('markRequired')) {
                    let isRequired = false;
                    if (typeof rules.markRequired === 'function') {
                        try {
                            isRequired = rules.markRequired.call(proxyEditEvent, proxyEditEvent);
                        } catch (e) {
                            isRequired = false;
                        }
                    } else if (typeof rules.markRequired === 'boolean') {
                        isRequired = rules.markRequired;
                    }
                    if (isRequired) {
                        requiredFields[field] = true;
                    }
                }

                // Hidden/Shown field logic
                let isHidden = false;
                if (rules.hasOwnProperty('showField')) {
                    let shouldShow = false;
                    if (typeof rules.showField === 'function') {
                        try {
                            shouldShow = rules.showField.call(proxyEditEvent, proxyEditEvent);
                        } catch (e) {
                            shouldShow = false;
                        }
                    } else if (typeof rules.showField === 'boolean') {
                        shouldShow = rules.showField;
                    }
                    isHidden = !shouldShow;
                } else if (rules.hasOwnProperty('hideField')) {
                    if (typeof rules.hideField === 'function') {
                        try {
                            isHidden = rules.hideField.call(proxyEditEvent, proxyEditEvent);
                        } catch (e) {
                            isHidden = false;
                        }
                    } else if (typeof rules.hideField === 'boolean') {
                        isHidden = rules.hideField;
                    }
                }
                if (isHidden) {
                    hiddenFields[field] = true;
                }

                // Error tests

                if (Array.isArray(rules.errorTests) && (rules.validateOn === undefined || rules.validateOn.includes(trigger))) {
                    for (let t = 0; t < rules.errorTests.length; t++) {
                        try {
                            const _test = rules.errorTests[t];
                            if (!(_test?.skipOnError && messages.errors.length > 0) && typeof _test['test'] === 'function') {
                                let result = _test['test'].call(proxyEditEvent, proxyEditEvent);
                                if (result instanceof Promise && trigger === 'eventSave') {
                                    result = await result;
                                } else if (result instanceof Promise && trigger !== 'eventSave') {
                                    result.then(resolved => {
                                        throwResult(event, field, resolved, _test['message']);
                                    }).catch(e => {
                                        console.error(`Error in async error validation test for ${field}:`, e);
                                    });
                                    continue;
                                }
                                if (result == -1 || (result === true && _test['critical'] === true)) {
                                    criticalErrors = true;
                                    if (_test['message']) {
                                        messages.errors.push(_test['message']);
                                    }
                                } else if (result === true) {
                                    if (_test['message']) {
                                        messages.errors.push(_test['message']);
                                    }
                                }
                            }
                        } catch (e) {
                            console.error(`Error in error validation test for ${field}:`, e);
                        }
                    }
                    if (messages.errors.length > 0) {
                        errorFields[field] = messages.errors;
                    }
                }

                // Warning tests

                if (Array.isArray(rules.warningTests) && (rules.validateOn === undefined || rules.validateOn.includes(trigger))) {
                    for (let t = 0; t < rules.warningTests.length; t++) {
                        const _test = rules.warningTests[t];
                        try {
                            if (!(_test?.skipOnError && messages.warnings.length > 0) && typeof _test['test'] === 'function') {
                                let result = _test['test'].call(proxyEditEvent, proxyEditEvent);
                                if (result instanceof Promise && trigger === 'eventSave') {
                                    result = await result;
                                } else if (result instanceof Promise && trigger !== 'eventSave') {
                                    result.then(resolved => {
                                        throwResult(event, field, resolved, _test['message']);
                                    }).catch(e => {
                                        console.error(`Error in async warning validation test for ${field}:`, e);
                                    });
                                    continue;
                                }
                                if (result == -1 || (result === true && _test['critical'] === true)) {
                                    criticalErrors = true;
                                    if (_test['message']) {
                                        messages.warnings.push(_test['message']);
                                    }
                                } else if (result === true) {
                                    if (_test['message']) {
                                        messages.warnings.push(_test['message']);
                                    }
                                }
                            }
                        } catch (e) {
                            console.error(`Error in warning validation test for ${field}:`, e);
                        }
                    }
                    if (messages.warnings.length > 0) {
                        warningFields[field] = messages.warnings;
                    }
                }
            }

            if (Object.keys(errorFields).length > 0) {
                allEventErrors[event.eventID] = { errorFields };
            }
            if (Object.keys(warningFields).length > 0) {
                allEventWarnings[event.eventID] = { warningFields };
            }
            if (Object.keys(requiredFields).length > 0) {
                allEventRequired[event.eventID] = { requiredFields };
            }
            if (Object.keys(hiddenFields).length > 0) {
                allEventHidden[event.eventID] = { hiddenFields };
            }

            paintVisualElements(event);

            return criticalErrors;

            // -----------------------------------------------------------
            // Helper functions for validation tests

            function throwResult(event, label, result, message) {
                if (allEventErrors[event.eventID] === undefined) {
                    allEventErrors[event.eventID] = { errorFields: {} };
                }
                if (result) {
                    allEventErrors[event.eventID].errorFields[label] = message;
                } else {
                    if (allEventRequired[event.eventID]?.requiredFields?.hasOwnProperty(label)) {
                        delete allEventErrors[event.eventID].errorFields[label];
                    }
                }
                paintVisualElements(event);
                return result;
            }

            function getCustomFieldValue(name) {
                if (fieldResolutionMap.hasOwnProperty(name)) {
                    return event[fieldResolutionMap[name]];
                } else if (event.hasOwnProperty(name.toLowerCase())) {
                    return event[name.toLowerCase()];
                }
                return undefined;
            }

            function setCustomFieldValue(name, value) {

                let id;
                if (fieldResolutionMap.hasOwnProperty(name)) {
                    id = fieldResolutionMap[name];
                } else if (editEvent.hasOwnProperty(name.toLowerCase())) {
                    id = name.toLowerCase();
                }

                if (id) {
                    editEvent[id] = value;
                    dbk.refreshEditPopover(editEvent);

                    qa(`[data-field-label="${name}"]`)?.forEach(el => {
                        if (event[id] !== editEvent[id]) {
                            el.classList.add('hasChanged');
                        } else {
                            el.classList.remove('hasChanged');
                        }
                    });
                }
            }

            function markRequired(label, isRequired) {
                if (isRequired) {
                    [].concat(label).forEach(l => {
                        requiredFields[l] = true;
                    });

                    showField(label);
                } else {
                    [].concat(label).forEach(l => {
                        if (requiredFields.hasOwnProperty(l)) {
                            delete requiredFields[l];
                        }
                    });
                }
            }

            function hideField(label) {
                [].concat(label).forEach(l => {
                    hiddenFields[l] = true;
                });
            }

            function showField(label) {
                [].concat(label).forEach(l => {
                    if (hiddenFields.hasOwnProperty(l)) {
                        delete hiddenFields[l];
                    }
                });
            }

            function pushError(label, message) {
                if (errorFields[label] === undefined) {
                    errorFields[label] = [];
                }
                if (!errorFields[label].includes(message)) {
                    errorFields[label].push(message);
                }
            }

            function pushWarning(label, message) {
                if (warningFields[label] === undefined) {
                    warningFields[label] = [];
                }
                if (!warningFields[label].includes(message)) {
                    warningFields[label].push(message);
                }
            }
        }

        // -----------------------------------------------------------
        // Helper Functions
        // -----------------------------------------------------------

        // Paint Visual Elements

        function paintVisualElements(event) {

            const errorFields = allEventErrors[event.eventID]?.errorFields || {};
            const warningFields = allEventWarnings[event.eventID]?.warningFields || {};
            const requiredFields = allEventRequired[event.eventID]?.requiredFields || {};
            const hiddenFields = allEventHidden[event.eventID]?.hiddenFields || {};

            // Remove error classes from elements that are no longer in error

            qa('[data-field-label].hasError')?.forEach(element => {
                if (!errorFields.hasOwnProperty(element.dataset?.fieldLabel)) {
                    element.classList.remove('hasError');
                }
            });
            qa('[data-field-label].hasWarning')?.forEach(element => {
                if (!warningFields.hasOwnProperty(element.dataset.fieldLabel)) {
                    element.classList.remove('hasWarning');
                }
            });
            qa('[data-field-label].requiredField')?.forEach(element => {
                if (!requiredFields.hasOwnProperty(element.dataset.fieldLabel)) {
                    element.classList.remove('requiredField');
                }
            });
            qa('[data-field-label].hiddenField')?.forEach(element => {
                if (!hiddenFields.hasOwnProperty(element.dataset.fieldLabel)) {
                    element.classList.remove('hiddenField');
                }
            });

            // Add error classes to elements that are in error

            for (const field of Object.keys(errorFields)) {
                qa(`[data-field-label="${field}"]`)?.forEach(element => {
                    element.classList.remove('hasChanged');
                    element.classList.add('hasError');
                });
            }
            for (const field of Object.keys(warningFields)) {
                qa(`[data-field-label="${field}"]`)?.forEach(element => {
                    element.classList.remove('hasChanged');
                    element.classList.add('hasWarning');
                });
            }
            for (const field of Object.keys(requiredFields)) {
                qa(`[data-field-label="${field}"]`)?.forEach(element => {
                    element.classList.add('requiredField');
                });
            }
            for (const field of Object.keys(hiddenFields)) {
                qa(`[data-field-label="${field}"]`)?.forEach(element => {
                    element.classList.add('hiddenField');
                });
            }

            // Get custom field labels and names
            let customFields = {};

            Object.values(event?.schedule?.customFields).map((field) => {
                customFields[field.name] = { id: field.id, field: field.field };
            });

            // Mark the Custom Fields panel label if any custom fields have errors/warnings

            const customFieldHasError = Object.keys(errorFields).some(label => customFields.hasOwnProperty(label));
            const customFieldHasWarning = Object.keys(warningFields).some(label => customFields.hasOwnProperty(label));
            const customFieldsSelector = document.querySelector('.dbk_editEvent div[name="customFields"]');

            if (customFieldsSelector) {
                if (customFieldHasError) {
                    customFieldsSelector.classList.add('hasError');
                } else {
                    customFieldsSelector.classList.remove('hasError');
                }

                if (customFieldHasWarning) {
                    customFieldsSelector.classList.add('hasWarning');
                } else {
                    customFieldsSelector.classList.remove('hasWarning');
                }
            }

            // Remove error/warning classes if none remain

            if (!Object.keys(errorFields).length || !Object.keys(warningFields).length) {
                if (!Object.keys(errorFields).length) {
                    qa(`[data-id="${event._id}"].hasError`)?.forEach(el => el.classList.remove('hasError'));
                }
                if (!Object.keys(warningFields).length) {
                    qa(`[data-id="${event._id}"].hasWarning`)?.forEach(el => el.classList.remove('hasWarning'));
                }
            }

            // Add error/warning class to event in calendar if any errors/warnings exist

            if (Object.keys(errorFields).length > 0) {
                qa(`[data-id="${event._id}"]`)?.forEach(el => el.classList.add('hasError'));
            }

            if (Object.keys(warningFields).length > 0 && Object.keys(errorFields).length === 0) {
                qa(`[data-id="${event._id}"]`)?.forEach(el => el.classList.add('hasWarning'));
            }
        }

        // Compile Validation Rules

        function compileValidationRules() {

            // Compile the validation rules for each field

            const merged = {};

            let _gd_validationRules = inputs.globalDefaults?.validationRules || {};
            let _gd_requiredFields = inputs.globalDefaults?.requiredFields || [];
            let _gd_hiddenFields = inputs.globalDefaults?.hiddenFields || [];

            // Map requiredFields and hiddenFields into validationRules object
            _gd_requiredFields.forEach((field) => {

                merged[field] = {
                    markRequired: true,
                    validateOn: ['eventSave'],
                    errorTests: [{
                        test: (e) => {
                            const value = e.getField(field);
                            // Check if the field is empty
                            if (value instanceof moment) return false;
                            if (Array.isArray(value) && (value.length === 0 || value[0] === 'none' || value[0] === 'Unassigned')) return true;
                            if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return true;
                            return false;
                        },
                        message: `Please complete the <B>${field}</B> field.`,
                        emoji: '🚫'
                    }]
                };
            });

            _gd_hiddenFields.forEach((field) => {
                if (!merged[field]) merged[field] = {};
                merged[field]['hideField'] = true;
            });

            // Now merge in any specific validation rules from globalDefaults.validationRules
            // These will add to or override the defaults set above

            if (_gd_validationRules && Object.keys(_gd_validationRules).length) {

                Object.keys(_gd_validationRules).forEach((field) => {

                    // Get existing rule or create new
                    if (!merged[field]) merged[field] = {};

                    // Get rule we are merging in from
                    let rule = _gd_validationRules[field];

                    let validateOn = rule['validateOn'] ? rule['validateOn'] : [];

                    // Merge validateOn arrays, ensuring uniqueness
                    if (Array.isArray(merged[field]['validateOn'])) {
                        merged[field]['validateOn'] = [...new Set([...validateOn, ...merged[field]['validateOn']])];
                    } else {
                        merged[field]['validateOn'] = validateOn;
                    }

                    // Merge in other properties, with rule taking precedence
                    if (rule['markRequired'] !== undefined) {
                        merged[field]['markRequired'] = rule['markRequired'];
                    }

                    if (rule.hasOwnProperty('hideField')) {
                        merged[field]['hideField'] = rule['hideField'];
                    }

                    if (rule.hasOwnProperty('showField')) {
                        merged[field]['showField'] = rule['showField'];
                    }

                    if (merged[field].hasOwnProperty('errorTests') && rule.hasOwnProperty('errorTests')) {
                        merged[field]['errorTests'] = [...merged[field]['errorTests'], ...rule['errorTests']];
                    } else if (!merged[field].hasOwnProperty('errorTests') && rule.hasOwnProperty('errorTests')) {
                        merged[field]['errorTests'] = [...rule['errorTests']];
                    }

                    if (merged[field].hasOwnProperty('warningTests') && rule.hasOwnProperty('warningTests')) {
                        merged[field]['warningTests'] = [...merged[field]['warningTests'], ...rule['warningTests']];
                    } else if (!merged[field].hasOwnProperty('warningTests') && rule.hasOwnProperty('warningTests')) {
                        merged[field]['warningTests'] = [...rule['warningTests']];
                    }
                });
            }

            inputs.validationRules = merged;
        }

        // Helper function to limit number of simultaneous call requests
        // Useful to prevent multiple rapid calls to the same function
        // when triggered by events like onresize, onscroll, onmousemove, etc.

        const debounce = (callback, wait) => {
            let timeoutId = null;
            return (...args) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    callback(...args);
                }, wait);
            };
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

})();