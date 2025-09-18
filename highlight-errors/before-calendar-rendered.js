// Event Validation and Highlighting v1.00
//
// Purpose:
// Validates events on edit and highlights fields with errors or warnings.
// Also highlights events with errors or warnings in the calendar view.
//
// Action Type: Before Calendar Rendered
// Prevent Default Action: No
//
// More info on custom actions here:
// https://docs.dayback.com/article/20-event-actions

// Declare globals

(() => {

    let options = {};
    let inputs = {};

    try {
        //----------- Configuration -------------------

        // Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
        // Leave this set to 0 to avoid unexpected behavior

        options.runTimeout = 0;

        // Error Modal titles and messages

        inputs.errorsModalTitle = "Validation Errors Found";
        inputs.errorsModalMessage = "Please review the following errors before saving:";
        inputs.errorsModalFixButton = "Fix Errors";
        inputs.errorsModalSaveAnywayButton = "Save Anyway";

        inputs.allowSaveOnError = true;
        inputs.askForSecondConfirmationOnError = true;

        // Warning Modal titles and messages

        inputs.warningsModalTitle = "Review Warnings Before Saving";
        inputs.warningsModalMessage = "Please review the following warnings before saving:";
        inputs.warningsModalFixButton = "Make Changes";
        inputs.warningsModalSaveAnywayButton = "Save Anyway";

        // Allow Save on Warning:
        //
        //      If warnings are detected when saving an event, this setting determines whether 
        //      the user can still save the event, or whether they must go back and fix 
        //      the warnings.
        //
        //      If false, the user will not be able to save if there are warnings.
        //      If true, the user can still choose to save even if there are warnings.

        inputs.allowSaveOnWarning = true;

        // Prompt with Save Confirmation Message on Warning:
        //
        //      If warnings are detected when saving an event, this setting determines whether
        //      the user will be prompted with a second confirmation message before saving the event.
        //
        //      If false, the user can save without being prompted for additional confirmation.
        //      If true, the user will be asked to confirm saving if there are warnings.

        inputs.askForSecondConfirmationOnWarning = false;

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

        inputs.validateUnchangedEvents = true;

        // Event Validation Rules
        // ------------------------------
        //
        // The validationRules object contains one property for each field you want to validate.
        // Each property is an object that defines the validation rules for that field.
        // You can define rules for standard fields (Title, Description, Start, End,
        // Location, Calendar, Resource, Status) as well as custom fields by their label name.
        //
        // Example:
        //
        //     inputs.validationRules = {
        //         Title: { ... },
        //         Description: { ... },
        //         Resource: { ... },
        //         Status: { ... },
        //         "Custom Field Label": { ... }
        //     }
        //
        // Each field in your validationRules represents an object that contains one or more
        // of the following properties. All properties are optional.
        //
        //      "Field Label": {
        //          markRequired: (boolean or function),
        //          validateOn: (array),
        //          errorTests: (array),
        //          warningTests: (array)
        //      }
        //
        // Properties:
        //
        //      markRequired: (boolean or function)
        //
        //          If set to true, the field is marked with a red asterisk in the Edit Event
        //          popover, indicating it is a required field.
        //
        //          If false or not specified, the field is displayed normally.
        //
        //          If the value is defined as a function, it takes the event as
        //          a parameter to allow you to calculate if the field should be marked
        //          as required. The function should return true to mark the field
        //          as required.
        //
        //          Example:
        //
        //          inputs.validationRules = {
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
        //                        A function that takes an event, and an optional options object,
        //                        (defined below) and returns true if there is an error.
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
        //                              test: (event, opt) => !event.title || event.title.trim() === '',
        //                              message: 'Title is missing'
        //                          },
        //                          {
        //                              test: (event, opt) => event.title.length < 3,
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
        //                        A function that takes an event, and an optional options object,
        //                        (defined below) and returns true if there is an warning.
        //
        //                  message: (string)
        //                        The warning message to display if the test returns true.
        //
        //                  skipOnError: (boolean) - Optional.
        //                        If true, this test will be skipped if there are already
        //                        warnings for this field. This allows certain tests to be
        //                        conditional on others not failing.
        //
        // Test Function Parameter:
        // ------------------------
        // 
        // Each test function takes two parameters: an event, and an options object.
        // Whether you choose to accept the options object or not is up to you.
        //
        //      event   - This is the event object for eventRender triggers, and an
        //                editEvent object for all other trigger types.
        //
        //      options - An object containing useful information about the context in which
        //                the validation is running, along with helper functions for
        //                working with custom field data. It contains:
        //
        //                trigger       - (string) The trigger that caused the validation to run.
        //                                i.e.: 'eventRender', 'eventClick', 'fieldChange', 'eventSave'.
        //
        //                event         - (object) The event object.
        //
        //                editEvent     - (object) The editEvent object.
        //
        //                changes       - (object) A Changes Object containing the fields that were
        //                                changed in the current edit session. Note that this
        //                                object is only available for 'fieldChange' and 'eventSave'
        //                                triggers.
        //
        //                errors        - (object) Any errors found so far for any field for the
        //                                current event.
        //
        //                warnings      - (object) Any warnings found so far for any field for the
        //                                current event.
        //
        //                getField      - (function(field)) A function that takes a field label, or a "store
        //                                in field" name as a parameter and returns the value of that
        //                                custom field for the current event
        //
        //                setField      - (function(field, value)) A function that takes a field label,
        //                                or a "store in field" name, and a value as parameters and
        //                                sets the value of that custom field for the current event.
        //
        //
        // Writing Tests against Standard Fields and Custom Fields
        // -------------------------------------------------------
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
        //      Since Custom Fields are user-defined, and are stored in the event object
        //      using their numerical id rather than their Label Name or their
        //      "Store In Field" name you must access an event's custom field values using
        //      a helper function:
        //
        //          opt.getField("Field Label" || "Store In Field Name").
        //
        //      This function is aware of the context in which it is running, allowing you
        //      to retrieve values by either their custom field label or their "store in field"
        //      name. For example:
        //
        //          const truckNumber = opt.getField("Truck Number"); // by label
        //
        //          const truckNumber = opt.getField("Truck_Number__c"); // by "store in field" name
        //
        //      You can also set the value of a custom field in a similar way using:
        //
        //          opt.setField("Truck Number", "TRK-100"); // by label
        //
        //          opt.setField("Truck_Number__c", "TRK-100"); // by "store in field" name
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
        //      inputs.validationRules = {
        //          Title: {
        //              validateOn: ['eventRender', 'eventClick', 'fieldChange', 'eventSave'],
        //              markRequired: true,
        //              errorTests: [
        //                  {
        //                      test: (event, opt) => !event.titleEdit || event.titleEdit.trim() === '',
        //                      message: 'Title is missing'
        //                  },
        //                  {
        //                      test: (event, opt) => event.titleEdit && event.titleEdit.length < 3,
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
        //                  test: (event, opt) => opt.trigger !== 'eventSave' && (!event.titleEdit || event.titleEdit.trim() === ''),
        //                  message: 'Title is missing'
        //              },
        //              {
        //                  test: (event, opt) => opt.trigger === 'eventSave' && event.titleEdit.length < 3,
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
        //                  test: (editEvent, opt) => {
        //                      const contractSigned = opt.getField('Contract Signed');
        //                      if (editEvent.status[0] === 'Confirmed' && contractSigned !== true) {
        //                          // Revert status to previous value
        //                          editEvent.status[0] = opt.event.status[0];
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
        //                  test: (event, opt) => {
        //                      const contractSigned = opt.getField('Contract Signed');
        //                      return opt.trigger === 'fieldChange' && event.status[0] === 'Confirmed' && contractSigned !== true;
        //                  },
        //                  message: 'If you set status to Confirmed, please ensure Contract Signed is true.'
        //              }
        //          ],
        //          errorTests: [
        //              {
        //                  // Only enforce as an error on eventSave
        //                  test: (editEvent, opt) => {
        //                      const contractSigned = opt.getField('Contract Signed');
        //                      return opt.trigger === 'eventSave' && editEvent.status[0] === 'Confirmed' && contractSigned !== true;
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
        //          markRequired: (editEvent, opt) => editEvent.status[0] === 'Confirmed',
        //          warningTests: [
        //              {
        //                  test: (editEvent, opt) => {
        //                      const contractSigned = opt.getField('Contract Signed');
        //                      // If user unchecked Contract Signed, and status is Confirmed,
        //                      // set status to Pending.
        //                      if (editEvent.status[0] === 'Confirmed' && contractSigned !== true) {
        //                          editEvent.status[0] = 'Pending';
        //                          dbk.refreshEditPopover(editEvent);
        //                      }
        //                      return editEvent.status[0] === 'Confirmed' && contractSigned !== true;
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
        //                  test: (event, opt) => {
        //                      const changes = opt.getField('changes');
        //                      const tx = opt.getField('Treatment Type');
        //                      // Only run if user changed this field.
        //                      if (!(changes && changes['Treatment Type'])) return false;
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
        //                          // Mutate event.end to be start + chosen duration
        //                          event.end = event.start.clone().add(mins, 'minutes');
        //
        //                          // Update the Event Popover to reflect the new end time
        //                          dbk.refreshEditPopover(event);
        //                      }
        //                      return false;
        //                  },
        //                  message: 'Invalid Treatment Type'
        //              }
        //          ]
        //      },
        //
        // Comprehensive Example: 
        // --------------------------------------------------------------
        //
        // The following is a detailed example configuration for Medical Spa services
        //
        //      inputs.validationRules = {
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
        //              markRequired: (event, opt) => {
        //                  const tx = opt.getField('Treatment Type');
        //                  return tx === 'Microneedling' || tx === 'Chemical Peel';
        //              },
        //              validateOn: ['eventClick', 'eventSave'],
        //              errorTests: [
        //                  {
        //                      // If required (from markRequired logic), ensure description exists.
        //                      test: (event, opt) => {
        //                          const tx = opt.getField('Treatment Type');
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
        //                      test: (event, opt) => opt.trigger === 'eventSave' && event.start && event.start.isBefore(moment()),
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
        //              markRequired: (event) => event?.schedule?.name === 'Mobile Services',
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
        //                      test: (event, opt) => {
        //
        //                          const tx = opt.getField('Treatment Type');
        //
        //                          // Only run if user changed this field.
        //                          if (!(opt.changes && opt.changes['Treatment Type'])) return false;
        //
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
        //                              // Mutate event.end to be start + chosen duration
        //                              event.end = event.start.clone().add(mins, 'minutes');
        //                          }
        //
        //                          // Update the Event Popover to reflect the new end time
        //                          dbk.refreshEditPopover(opt.editEvent);
        //
        //                          // Return false so this isn’t treated as a validation error.
        //                          return false;
        //                      },
        //                      message: '' // Not shown, since test() always returns false
        //                  }
        //              ],
        //              warningTests: [
        //                  {
        //                      // Warn if “IV Drip” is scheduled < 60 mins (many clinics prefer ~60).
        //                      test: (event, opt) => {
        //                          const tx = opt.getField('Treatment Type');
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
        //                      test: (event, opt) => {
        //                          const isBooked = event.status[0] === 'Booked';
        //                          const val = opt.getField('Practitioner License #');
        //                          return isBooked && (!val || String(val).trim() === '');
        //                      },
        //                      message: 'Practitioner License # is required for Booked appointments.'
        //                  },
        //                  {
        //                      // Optional format sanity check (very loose: 2–3 letters, dash, 4–8 digits).
        //                      test: (event, opt) => {
        //                          const val = String(opt.getField('Practitioner License #') || '');
        //                          return val && !/^[A-Za-z]{1,3}-?\d{4,8}$/.test(val);
        //                      },
        //                      message: 'Practitioner License # format looks unusual. Double-check entry.'
        //                  }
        //              ]
        //          },
        //      
        //          'Consent on File': {
        //              // Boolean: true/false. Required for invasive treatments.
        //              markRequired: (event, opt) => {
        //                  const tx = opt.getField('Treatment Type');
        //                  return ['Microneedling', 'Chemical Peel', 'Laser Hair Removal', 'Botox'].includes(tx);
        //              },
        //              validateOn: ['eventClick', 'eventSave'],
        //              errorTests: [
        //                  {
        //                      // If required for the treatment type, ensure consent is true.
        //                      test: (event, opt) => {
        //                          const tx = opt.getField('Treatment Type');
        //                          const required = ['Microneedling', 'Chemical Peel', 'Laser Hair Removal', 'Botox'].includes(tx);
        //                          const consent = !!opt.getField('Consent on File');
        //                          return required && !consent;
        //                      },
        //                      message: 'Client consent is required for the selected treatment.'
        //                  }
        //              ],
        //              warningTests: [
        //                  {
        //                      // Warn if consent was updated in this session but Status is still Pending (remind to finalize).
        //                      test: (event, opt) => {
        //                          const changed = opt.changes?.hasOwnProperty('Consent on File');
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
        //                      test: (event, opt) => {
        //                          const val = opt.getField('Pre-Treatment Fasting Hours');
        //                          return val == null || isNaN(Number(val)) || Number(val) <= 0;
        //                      },
        //                      message: 'Pre-Treatment Fasting Hours must be a non-negative number.'
        //                  },
        //                  {
        //                      // For “IV Drip (NAD+)” example protocol, require ≥ 4 hours fasting.
        //                      test: (event, opt) => {
        //                          const tx = opt.getField('Treatment Type');
        //                          const val = Number(opt.getField('Pre-Treatment Fasting Hours') || 0);
        //                          return tx === 'IV Drip (NAD+)' && val < 4;
        //                      },
        //                      message: 'NAD+ drips require at least 4 hours of fasting.'
        //                  }
        //              ],
        //              warningTests: [
        //                  {
        //                      // Warn if very long fast (≥18h) to prompt a wellness check.
        //                      test: (event, opt) => {
        //                          const val = Number(opt.getField('Pre-Treatment Fasting Hours') || 0);
        //                          return val >= 18;
        //                      },
        //                      message: 'Extended fasting noted—confirm client comfort and hydration.'
        //                  }
        //              ]
        //          }
        //      };


        inputs.validationRules = {
            Title: {
                validateOn: ['eventRender', 'eventClick', 'fieldChange', 'eventSave'],
                markRequired: true,
                errorTests: [
                    { test: (event, opt) => !event.titleEdit || event.titleEdit.trim() === '', message: 'Title is missing' },
                    {
                        test: (event, opt) => event.titleEdit && event.titleEdit.length < 3, message: 'Title is too short',
                        stopOnError: true
                    }
                ]
            },
            Description: {
                validateOn: ['eventRender', 'eventClick', 'fieldChange', 'eventSave'],
                markRequired: true,
                errorTests: [
                    { test: (event, opt) => !event.description || event.description.trim() === '', message: 'Description is missing' }
                ]
            },
            Start: {
                validateOn: ['fieldChange', 'eventSave'],
                errorTests: [
                    {
                        test: (event, opt) => {
                            return opt.changes.hasOwnProperty('start') && event.start.isBefore(moment());
                        }, message: 'Start time cannot be in the past'
                    }
                ]
            },
            End: {
                validateOn: ['fieldChange', 'eventSave'],
                errorTests: [
                    {
                        test: (event, opt) => {
                            return opt.changes.hasOwnProperty('end') && event.end.isBefore(moment());
                        }, message: 'End time time cannot be in the past'
                    }
                ]
            },
            Location: {
                markRequired: (event, opt) => ['Booked', 'Deferred'].includes(event.status[0]),
                validateOn: ['eventRender', 'eventClick', 'fieldChange', 'eventSave'],
                errorTests: [
                    { test: (event, opt) => !event.location || event.location.trim() === '', message: 'Treatments must have a location' }
                ]
            },
            Calendar: {
                validateOn: ['eventRender', 'eventClick', 'fieldChange', 'eventSave'],
                errorTests: [
                    { test: (event, opt) => event.schedule.name !== 'Treatments', message: 'Must be Treatments' }
                ]
            },
            Status: {
                validateOn: ['eventRender', 'eventClick', 'fieldChange', 'eventSave'],
                errorTests: [
                    { test: (event, opt) => event.status[0] !== 'Labs', message: 'Incorrect status for MRI. Please change to Labs' }
                ]
            },
            "Project Category": {
                validateOn: ['eventRender', 'eventClick', 'fieldChange', 'eventSave'],
                errorTests: [
                    { test: (event, opt) => !['Project', 'Check-in'].includes(opt.getField('Project Category')?.[0]), message: 'Can only be Project or Check-in.' }
                ]
            },
            "Truck Number": {
                markRequired: (event, opt) => event.status[0] === 'Booked',
                validateOn: ['eventRender', 'eventClick', 'fieldChange', 'eventSave'],
                errorTests: [
                    {
                        test: (event, opt) => !/^TRK-\d{3}$/.test(opt.getField('truckNumber') || ''),
                        message: 'Truck number is not valid. Please check the format.'
                    },
                    {
                        test: (event, opt) => {
                            if (opt.getField('truckNumber') === 'TRK-100') {
                                opt.setField('Hours Estimate', '40');
                                return false; // Test passes, so no error shown
                            }
                        }
                    }
                ]
            },
            "ToDo Complete?": {
                validateOn: ['eventRender', 'eventClick', 'fieldChange', 'eventSave'],
                errorTests: [
                    { test: (event, opt) => false, message: 'Test' }
                ]
            },
            "Hours Estimate": {
                validateOn: ['eventRender', 'eventClick', 'fieldChange', 'eventSave'],
                errorTests: [
                    { test: (event, opt) => opt.getField('Hours Estimate') == '' || !/^\d+$/.test(opt.getField('Hours Estimate')), message: 'Number is missing' }
                ]
            },
            "Reference URL": {
                validateOn: ['eventRender', 'eventClick', 'fieldChange', 'eventSave'],
                warningTests: [
                    { test: (event, opt) => !/^https?:\/\//.test(opt.getField('Reference URL')), message: 'Url is missing' }
                ]
            },
            "Project Size": {
                validateOn: ['eventRender', 'eventClick', 'fieldChange', 'eventSave'],
                warningTests: [
                    { test: (event, opt) => opt.getField('Project Size') == '', message: 'Can only be small, medium or large' }
                ]
            },
            "Due Date": {
                validateOn: ['eventRender', 'eventClick', 'fieldChange', 'eventSave'],
                warningTests: [
                    { test: (event, opt) => !opt.getField('Due Date'), message: 'Date is missing' }
                ],
                errorTests: [
                    { test: (event, opt) => opt.getField('Due Date') != '' && !moment(opt.getField('Due Date')).isAfter(moment()), message: 'Due date cannot be in the past' }
                ]
            },
            "Last Update Date Time": {
                validateOn: ['eventRender', 'eventClick', 'fieldChange', 'eventSave'],
                warningTests: [
                    { test: (event, opt) => !opt.getField('Last Update Date Time'), message: 'DateTime is missing' }
                ]
            }
        };

        //----------- End Configuration: You do not need to edit below this line -------------------

    } catch (error) {
        reportError(error);
    }

    //----------- The action itself: you may not need to edit this. -------------------

    // Action code goes inside this function
    function run() {

        // Initialize error handling system
        let allEventErrors = {};
        let allEventWarnings = {};
        let allEventRequired = {};

        // To track changes made during an edit session
        let cancelOnClick = false;

        // Error handler object for use by other app actions
        let errorHandler = {
            onEventClick: onEventClick,
            onFieldChange: onFieldChange,
            beforeEventRendered: beforeEventRendered,
            beforeEventSave: beforeEventSave,
            onEventSave: onEventSave,
            allEventErrors: allEventErrors,
            allEventWarnings: allEventWarnings,
            allEventRequired: allEventRequired,
            inputs: inputs
        };

        sc.init('errorHandler', errorHandler);

        // -----------------------------------------------------------
        // Event Handlers
        // -----------------------------------------------------------

        // Handle event click
        function onEventClick(event, editEvent, action) {

            console.log(event, editEvent);
            // Define popover object to isolate query selectors to it

            let popover;

            // Cancel the default action to prevent the popover from opening 
            // if another popover is still open

            if (cancelOnClick) {
                return action?.callbacks?.cancel();
            }

            action?.callbacks?.confirm();

            calculateEventErrors(event, editEvent, 'eventClick', {});

            // Get current errors/warnings/required for the event

            let eventErrors = allEventErrors[event.eventID]?.errorFields || {};
            let eventWarnings = allEventWarnings[event.eventID]?.warningFields || {};
            let eventRequired = allEventRequired[event.eventID]?.requiredFields || {};

            // Observe the event popover and add errors to the fields
            let eObserver = dbk.observe({
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

                const customFieldHasError = Object.keys(eventErrors).some(label => customFields.hasOwnProperty(label));
                const customFieldHasWarning = Object.keys(eventWarnings).some(label => customFields.hasOwnProperty(label));
                const customFieldsSelector = popover.querySelector('.dbk_editEvent div[name="customFields"]');

                if (customFieldsSelector) {
                    if (customFieldHasError) {
                        customFieldsSelector.classList.remove('hasChanged');
                        customFieldsSelector.classList.add('hasError');
                    } else if (customFieldHasWarning) {
                        customFieldsSelector.classList.remove('hasChanged');
                        customFieldsSelector.classList.add('hasWarning');
                    }
                }

                let customFieldsObserver = dbk.observe({
                    name: `event_cusfields_${event._id}`,
                    watch: popover,
                    until: `.ng-popover[data-popover-event-id="${event.eventID}"] .panel-switch:not(.fieldsProcessed)`,
                    then: checkCustomFields
                });

                dbk.observe({
                    name: `event_destroy_${event.eventID}`,
                    watch: q('.calendar-scroll'),
                    until: () => {
                        return !document.querySelector(`.ng-popover[data-popover-event-id="${event.eventID}"]`);
                    },
                    then: (o) => {
                        customFieldsObserver.destroy();
                        eObserver.destroy();
                        o.destroy();
                    }
                });
            }

            function checkCustomFields(o) {
                o.stop();

                // Name the custom fields

                let labels = popover.querySelectorAll('.panel-switch li');

                labels?.forEach((item) => {
                    let labelNode = item.querySelector('label');
                    let label = labelNode?.textContent?.trim();
                    if (label && customFields[label]) {
                        item.dataset.fieldId = customFields[label].id;
                        item.dataset.fieldName = customFields[label].field;
                        item.dataset.fieldLabel = label;
                    }
                });

                popover.querySelectorAll('.panel-switch:not(.fieldsProcessed)')?.forEach((panelSwitch) => {

                    labels?.forEach((item) => {
                        let label = item?.dataset?.fieldLabel;

                        if (eventErrors.hasOwnProperty(label)) {
                            item?.classList?.remove('hasChanged');
                            item?.classList?.add('hasError');
                        } else if (eventWarnings.hasOwnProperty(label)) {
                            item?.classList?.remove('hasChanged');
                            item?.classList?.add('hasWarning');
                        }

                        if (eventRequired.hasOwnProperty(label)) {
                            item?.classList?.add('requiredField');
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
                        tooltip.show();
                    }
                }

                function hideTooltip() {
                    tooltip?.hide();
                }

                function getTooltipText() {
                    // if (type === 'error') {
                    //     return allEventErrors[event.eventID]?.errorFields[label];
                    // } else if (type === 'warning') {
                    //     return allEventWarnings[event.eventID]?.warningFields[label];
                    // }

                    if (allEventErrors[event.eventID]?.errorFields[label]) {
                        return allEventErrors[event.eventID]?.errorFields[label];
                    } else if (allEventWarnings[event.eventID]?.warningFields[label]) {
                        return allEventWarnings[event.eventID]?.warningFields[label];
                    }

                    return ' - ';
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

                    if (type != '')
                        panelSelector?.classList?.add(type === 'error' ? 'hasError' : 'hasWarning');

                    panelSelector.dataset.fieldId = label;
                    panelSelector.dataset.fieldName = label;
                    panelSelector.dataset.fieldLabel = label;

                    if (eventRequired.hasOwnProperty(label)) {
                        panelSelector?.classList?.add('requiredField');
                    }

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

            // console.log("Field changed:", fieldId, value, label, params, event);

            let element = q(`[data-field-id="${fieldId}"]`);

            let errorFields = allEventErrors[event.eventID]?.errorFields || {};
            let warningFields = allEventWarnings[event.eventID]?.warningFields || {};

            if (element) {

                const changesObject = dbk.eventChanged(editEvent, event.beforeDrop || event);

                calculateEventErrors(event, editEvent, 'fieldChange', changesObject);

                errorFields = allEventErrors[event.eventID]?.errorFields || {};
                warningFields = allEventWarnings[event.eventID]?.warningFields || {};

                if (errorFields.hasOwnProperty(label)) {
                    element.classList.add('hasError');
                    setTimeout(() => {
                        element.dispatchEvent(new Event("dbkOnErrorAdd", { bubbles: true }));
                    }, 200);
                } else {
                    element.classList.remove('hasError');
                    element.dispatchEvent(new Event("dbkOnErrorRemove", { bubbles: true }));
                }

                if (warningFields.hasOwnProperty(label)) {
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
            }

            if (!Object.keys(errorFields).length || !Object.keys(warningFields).length) {
                if (!Object.keys(errorFields).length) {
                    qa(`[data-id="${event._id}"].hasError`)?.forEach(el => el.classList.remove('hasError'));
                }

                if (!Object.keys(warningFields).length) {
                    qa(`[data-id="${event._id}"].hasWarning`)?.forEach(el => el.classList.remove('hasWarning'));
                }
            }

            return action?.callbacks?.confirm();
        }

        // On Event Save

        function onEventSave(event, editEvent, action) {
            cancelOnClick = false;
        }

        // Before Event Save

        function beforeEventSave(event, editEvent, action) {

            // Handle field change event

            const changesObject = dbk.eventChanged(editEvent, event.beforeDrop || event);

            // If validateUnchangedEvents is false and there are no changes, skip validation

            if (inputs.validateUnchangedEvents && Object.keys(changesObject).length === 0) {
                return action?.callbacks?.confirm();
            }

            cancelOnClick = true;

            calculateEventErrors(event, editEvent, 'eventSave', changesObject);

            let errorFields = allEventErrors[event.eventID]?.errorFields || {};
            let warningFields = allEventWarnings[event.eventID]?.warningFields || {};

            if (!Object.keys(errorFields).length || !Object.keys(warningFields).length) {
                if (!Object.keys(errorFields).length) {
                    qa(`[data-id="${event._id}"].hasError`)?.forEach(el => el.classList.remove('hasError'));
                }

                if (!Object.keys(warningFields).length) {
                    qa(`[data-id="${event._id}"].hasWarning`)?.forEach(el => el.classList.remove('hasWarning'));
                }
            }

            if (Object.keys(errorFields).length > 0) {
                let errorListHtml = `<div class="errorHeader">${inputs.errorsModalMessage}</div><ul class="errorList">`;
                for (const [label, message] of Object.entries(errorFields)) {
                    if (Array.isArray(message)) {
                        message.forEach(msg => {
                            errorListHtml += `<li><strong>${label}</strong> - ${msg}</li>`;
                        });
                    } else {
                        errorListHtml += `<li><strong>${label}</strong> - ${message}</li>`;
                    }
                }
                errorListHtml += '</ul>';

                // Build modal button parameters based on options

                let modalButtons = [
                    inputs.errorsModalTitle,
                    errorListHtml
                ];

                // Always add Fix Errors button

                modalButtons.push(inputs.errorsModalFixButton);
                modalButtons.push(() => action?.callbacks?.cancel());

                // Add Save Anyway button if allowed

                if (inputs.allowSaveOnError) {
                    modalButtons.push(inputs.errorsModalSaveAnywayButton);
                    modalButtons.push(() => {
                        if (inputs.askForSecondConfirmationOnError) {
                            utilities.showModal(
                                "Confirm Changes",
                                "Are you sure you want to save changes anyway?",
                                "No, I want to fix errors",
                                () => action?.callbacks?.cancel(),
                                "Save Changes",
                                () => {
                                    // After confirming errors, check warnings

                                    if (Object.keys(warningFields).length > 0) {
                                        showWarningModal();
                                    } else {
                                        cancelOnClick = false;
                                        action?.callbacks?.confirm();
                                    }
                                }
                            );
                        } else {
                            // After confirming errors, check warnings

                            if (Object.keys(warningFields).length > 0) {
                                showWarningModal();
                            } else {
                                cancelOnClick = false;
                                action?.callbacks?.confirm();
                            }
                        }
                    });
                }

                utilities.showModal(...modalButtons);
            } else if (Object.keys(warningFields).length > 0) {
                showWarningModal();
            } else {
                cancelOnClick = true;
                action?.callbacks?.confirm();
            }

            function showWarningModal() {
                let warningListHtml = `<div class="warningHeader">${inputs.warningsModalMessage}</div><ul class="warningList">`;

                for (const [label, message] of Object.entries(warningFields)) {
                    if (Array.isArray(message)) {
                        message.forEach(msg => {
                            warningListHtml += `<li><strong>${label}</strong> - ${msg}</li>`;
                        });
                    } else {
                        warningListHtml += `<li><strong>${label}</strong> - ${message}</li>`;
                    }
                }

                warningListHtml += '</ul>';

                // Build modal button parameters based on options

                let modalButtons = [
                    inputs.warningsModalTitle,
                    warningListHtml
                ];

                // Always add Fix Warnings button

                modalButtons.push(inputs.warningsModalFixButton);
                modalButtons.push(() => action?.callbacks?.cancel());

                // Add Save Anyway button if allowed

                if (inputs.allowSaveOnWarning) {
                    modalButtons.push(inputs.warningsModalSaveAnywayButton);
                    modalButtons.push(() => {
                        if (inputs.askForSecondConfirmationOnWarning) {
                            utilities.showModal(
                                "Confirm Changes",
                                "Are you sure you want to save changes anyway?",
                                "No, I want to fix warnings",
                                () => {
                                    cancelOnClick = true;
                                    action?.callbacks?.cancel()
                                },
                                "Save Changes",
                                () => {
                                    cancelOnClick = false;
                                    action?.callbacks?.confirm();
                                }
                            );
                        } else {
                            cancelOnClick = false;
                            action?.callbacks?.confirm();
                        }
                    });
                }

                utilities.showModal(...modalButtons);
            }
        }

        // -----------------------------------------------------------
        // Error Calculation Logic
        // -----------------------------------------------------------

        // Calculate Event Error

        function calculateEventErrors(event, editEvent, trigger, changesObject = {}) {

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

            for (const [field, rules] of Object.entries(inputs.validationRules)) {

                let messages = { errors: [], warnings: [] };

                // Required field

                if (rules.hasOwnProperty('markRequired')) {
                    let isRequired = false;
                    if (typeof rules.markRequired === 'function') {

                        try {
                            isRequired = rules.markRequired(editEvent, {
                                event: event,
                                editEvent: editEvent,
                                trigger: trigger,
                                changes: changes,
                                errors: errorFields,
                                warnings: warningFields,
                                getField: (field) => getCustomFieldValue(editEvent, field),
                                setField: (field, value) => setCustomFieldValue(event, editEvent, field, value)
                            });
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

                // Error tests

                if (Array.isArray(rules.errorTests) && (rules.validateOn === undefined || rules.validateOn.includes(trigger))) {
                    for (let t = 0; t < rules.errorTests.length; t++) {
                        try {
                            const _test = rules.errorTests[t];
                            // If skipOnError is true, skip this test if there are already errors for this field
                            if (
                                !(_test?.skipOnError && messages.errors.length > 0) &&
                                _test['test'](editEvent, {
                                    event: event,
                                    editEvent: editEvent,
                                    trigger: trigger,
                                    changes: changes,
                                    errors: errorFields,
                                    warnings: warningFields,
                                    getField: (field) => getCustomFieldValue(editEvent, field),
                                    setField: (field, value) => setCustomFieldValue(event, editEvent, field, value)
                                }) === true
                            ) {
                                if (_test['message']) {
                                    messages.errors.push(_test['message']);
                                }
                            }
                        } catch (e) {
                            // If test throws, treat as no error
                            console.error(`Error in error validation test for ${field}:`, e);
                        }
                    }
                    if (messages.errors.length > 0) {
                        errorFields[field] = messages.errors; // messages.errors.length === 1 ? messages.errors[0] : messages.errors;
                    }
                }

                // Warning tests

                if (Array.isArray(rules.warningTests) && (rules.validateOn === undefined || rules.validateOn.includes(trigger))) {
                    for (let t = 0; t < rules.warningTests.length; t++) {
                        const _test = rules.warningTests[t];
                        try {
                            if (
                                !(_test?.skipOnError && messages.warnings.length > 0) &&
                                _test['test'](editEvent, {
                                    event: event,
                                    editEvent: editEvent,
                                    trigger: trigger,
                                    changes: changes,
                                    errors: errorFields,
                                    warnings: warningFields,
                                    getField: (field) => getCustomFieldValue(editEvent, field),
                                    setField: (field, value) => setCustomFieldValue(event, editEvent, field, value)
                                }) === true
                            ) {
                                if (_test['message']) {
                                    messages.warnings.push(_test['message']);
                                }
                            }
                        } catch (e) {
                            // If test throws, treat as no warning
                            console.error(`Error in warning validation test for ${field}:`, e);
                        }
                    }
                    if (messages.warnings.length > 0) {
                        warningFields[field] = messages.warnings; // messages.warnings.length === 1 ? messages.warnings[0] : messages.warnings;
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

            // Add error classes to elements that are in error

            for (const field of Object.keys(errorFields)) {
                qa(`[data-field-label="${field}"]`)?.forEach(element => {
                    element.classList.add('hasError');
                });
            }
            for (const field of Object.keys(warningFields)) {
                qa(`[data-field-label="${field}"]`)?.forEach(element => {
                    element.classList.add('hasWarning');
                });
            }
            for (const field of Object.keys(requiredFields)) {
                qa(`[data-field-label="${field}"]`)?.forEach(element => {
                    element.classList.add('requiredField');
                });
            }

            // Helper function to get custom field value by name
            // (either field label or "store in field" name).

            function getCustomFieldValue(event, name) {
                const id = Object.values(event.schedule.customFields)?.find(f => f.name === name || f.field === name)?.id;
                return id ? event[id] : undefined;
            }

            // Helper function to set custom field value by name

            function setCustomFieldValue(event, editEvent, name, value) {
                const id = Object.values(event.schedule.customFields)?.find(f => f.name === name || f.field === name)?.id;
                if (id) {
                    editEvent[id] = value;
                    dbk.refreshEditPopover(editEvent);
                }
            };
        }

        // -----------------------------------------------------------
        // Helper Functions
        // -----------------------------------------------------------

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

        // Helper function to get client events
        // Optionally filter by calendar name

        const getClientEvents = (cal) => {
            const events = sc.get('element').fullCalendar('clientEvents');
            return cal ? events?.filter(e => e.schedule.name === cal) : events;
        };

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