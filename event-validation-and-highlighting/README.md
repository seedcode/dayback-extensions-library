# Event Validation & Highlighting 

This library implements a comprehensive system for validating user interactions with event data. It can be used to validate events or specific fields, show which fields are required, highlight fields with issues directly in the Edit Event popover, and visually flags event pills on the calendar with error/warning badges.

---

## What this action does

- **Validates** standard and custom fields on multiple triggers (`eventRender`, `eventClick`, `fieldChange`, `eventSave`) based on user configuration.
- **Supports async checks** (e.g., Salesforce lookups) and a **query cache** to reduce API calls.
- **Highlights fields** inside the Edit Event popover with error/warning styles and tooltips.
- **Adds icons** to calendar event pills when an event has errors or warnings.
- Can **auto-correct/auto-fill** fields (e.g., set `End` based on a selected “Treatment Type”).

---

# Defining Event Validation Rules

The `validationRules` object contains one property for each field you want to validate.  
Each property is an object that defines the validation rules for that field.

You can define rules for standard fields (`Title`, `Description`, `Start`, `End`, `Location`, `Calendar`, `Resource`, `Status`) as well as custom fields by their **label name**.

---

## Basic Structure

```js
inputs.validationRules = {
    Title: { ... },
    Description: { ... },
    Resource: { ... },
    Status: { ... },
    "Custom Field Label": { ... }
}
```

Each field in `validationRules` represents an object that contains one or more of the following optional properties:

```js
"Field Label": {
    markRequired: (boolean or function),
    hideField: (boolean or function),
    showField: (boolean or function),
    validateOn: (array),
    errorTests: (array),
    warningTests: (array)
}
```

---

## Properties

### `markRequired` (boolean or function)

Marks a field as required in the Edit Event popover. A red asterisk appears next to the field.

- **true** → Always required.  
- **false** or not specified → Not required.  
- **function(event)** → Dynamically required depending on event state.

**Example:**

```js
inputs.validationRules = {
    Location: {
        markRequired: (event) => event.status[0] == 'Booked'
    },
    Status: {
        markRequired: true
    }
}
```

⚠️ If you mark a field required, also add related **errorTests** to ensure users get feedback when leaving it blank.

---

### `hideField` (boolean or function)

Hides the field in the Edit Event popover.

- **true** → Always hidden.  
- **false** → Shown normally.  
- **function(event)** → Dynamically hidden.

**Example:**

```js
inputs.validationRules = {
    "Hours Estimate": {
        markRequired: (event) => opt.getField('Event Type') === 'Task',
        hideField: (event) => event.getField('Event Type') !== 'Task'
    }
}
```

---

### `showField` (boolean or function)

Inverse of `hideField`. Explicitly shows the field.

- **true** → Always visible.  
- **false** → Always hidden.  
- **function(event)** → Dynamically visible.

**Example:**

```js
inputs.validationRules = {
    "Hours Estimate": {
        markRequired: (event) => opt.getField('Event Type') === 'Task',
        showField: (event) => event.getField('Event Type') === 'Task'
    }
}
```

---

### `validateOn` (array)

Defines when validation is triggered.  
- `fieldChange` – When a field changes in the popover.  
- `eventSave` – On save or close of popover.  


Validate always:

```js
Title: {
    markRequired: true,
    errorTests: [ ... ]
}
```

Equivalent to:

```js
Title: {
    validateOn: ['eventRender', 'eventClick', 'fieldChange', 'eventSave'],
    markRequired: true,
    errorTests: [ ... ]
}
```

Validate only when event is opened:

```js
Status: {
    validateOn: ['eventClick'],

---

### `errorTests` (array)
Each test object must contain:

- `test(event, opt)` – Returns `true` if error.  
- `message` (string) – Error message to show.  
- `skipOnError` (optional) – If `true`, this test is skipped if previous tests failed.

**Example:**

```js
Title: {
    validateOn: ['eventRender', 'eventClick', 'fieldChange', 'eventSave'],
    markRequired: true,
    errorTests: [
        {
            test: (event, opt) => !event.title || event.title.trim() === '',
            message: 'Title is missing'
        },
        {
            test: (event, opt) => event.title.length < 3,
            message: 'Title is too short',
            skipOnError: true
        }
}
```

---

### `warningTests` (array)

Defines validation tests for warnings (similar to errors but less strict).

- `test(event, opt)` – Returns `true` if warning.  
- `message` – Warning message to show.  
- `skipOnError` – Optional, same behavior as in error tests.

---

## Test Function Parameters

Each test function receives:

- `event` – The event object (or `editEvent` when in popover).  
- `opt` – Options object with context and helpers:
  - `trigger` – Which trigger fired (`eventRender`, `eventClick`, etc).  
  - `event` – Current event object.  
  - `editEvent` – Editable event object.  
  - `changes` – Fields changed in current session.  
  - `errors`, `warnings` – Already-found issues.  
  - `getField(labelOrApiName)` – Get value of custom or standard field.  
  - `setField(labelOrApiName, value)` – Set a field value.  
  - `fieldChanged(label?)` – Check if field changed.  

**Example:**

```js
test: (event, opt) => {
    return opt.trigger === 'eventSave' && !opt.fieldChanged()
}
```

---

## Standard vs Custom Fields

Standard fields available directly:

```js
event.title
event.description
event.start // moment object
event.end   // moment object
event.location
event.schedule.name
event.resource // array
event.status   // array
```

Custom fields require helpers:

```js
const truckNumber = opt.getField("Truck Number");       // by label
const truckNumber = opt.getField("Truck_Number__c");    // by API name

opt.setField("Truck Number", "TRK-100");
```

---

## The `changes` Object

When editing, this object shows only modified fields:

```js
{
    title: "New Title",
    description: "New Description",
    start: moment(),
    end: moment(),
    location: "New Location",
    "Truck Number": "TRK-100",
    "Contract Signed": true
}
```

---

## Examples

### Simple Title Validation

```js
inputs.validationRules = {
    Title: {
        validateOn: ['eventRender', 'eventClick', 'fieldChange', 'eventSave'],
        markRequired: true,
        errorTests: [
            {
                test: (event, opt) => !event.titleEdit || event.titleEdit.trim() === '',
                message: 'Title is missing'
            },
            {
                test: (event, opt) => event.titleEdit && event.titleEdit.length < 3,
                message: 'Title is too short',
                skipOnError: true
            }
        ]
    }
}
```

---

### Advanced Title Validation

```js
Title: {
    validateOn: ['eventClick', 'fieldChange', 'eventSave'],
    markRequired: true,
    errorTests: [
        {
            test: (event, opt) => opt.trigger !== 'eventSave' && (!event.titleEdit || event.titleEdit.trim() === ''),
            message: 'Title is missing'
        },
        {
            test: (event, opt) => opt.trigger === 'eventSave' && event.titleEdit.length < 3,
            message: 'Title is too short'
        }
    ]
}
```

---

### Conditional Status Validation

```js
Status: {
    validateOn: ['fieldChange'],
    errorTests: [
        {
            test: (editEvent, opt) => {
                const contractSigned = opt.getField('Contract Signed');
                if (editEvent.status[0] === 'Confirmed' && contractSigned !== true) {
                    editEvent.status[0] = opt.event.status[0]; // revert
                    return true;
                }
                return false;
            },
            message: 'Cannot set status to Confirmed unless Contract Signed is true.'
        }
    ]
}
```

Alternative with warnings:

```js
Status: {
    validateOn: ['fieldChange', 'eventSave'],
    warningTests: [
        {
            test: (event, opt) => {
                const contractSigned = opt.getField('Contract Signed');
                return opt.trigger === 'fieldChange' && event.status[0] === 'Confirmed' && contractSigned !== true;
            },
            message: 'If you set status to Confirmed, please ensure Contract Signed is true.'
        }
    ],
    errorTests: [
        {
            test: (editEvent, opt) => {
                const contractSigned = opt.getField('Contract Signed');
                return opt.trigger === 'eventSave' && editEvent.status[0] === 'Confirmed' && contractSigned !== true;
            },
            message: 'Cannot set status to Confirmed unless Contract Signed is true.'
        }
    ]
}
```

---

### Contract Signed Dependency

```js
"Contract Signed": {
    validateOn: ['fieldChange', 'eventSave'],
    markRequired: (editEvent, opt) => editEvent.status[0] === 'Confirmed',
    warningTests: [
        {
            test: (editEvent, opt) => {
                const contractSigned = opt.getField('Contract Signed');
                if (editEvent.status[0] === 'Confirmed' && contractSigned !== true) {
                    editEvent.status[0] = 'Pending';
                    dbk.refreshEditPopover(editEvent);
                }
                return editEvent.status[0] === 'Confirmed' && contractSigned !== true;
            },
            message: 'Contract must be signed if status is Confirmed. Status set to Pending.'
        }
    ]
}
```

---

### Auto-Setting Treatment Duration

```js
"Treatment Type": {
    validateOn: ['fieldChange', 'eventSave'],
    markRequired: true,
    errorTests: [
        {
            test: (event, opt) => {
                const changes = opt.getField('changes');
                const tx = opt.getField('Treatment Type');
                if (!(changes && changes['Treatment Type'])) return false;

                if (event.start) {
                    let mins;
                    switch (tx) {
                        case 'Microneedling': mins = 60; break;
                        case 'Laser Hair Removal': mins = 90; break;
                        case 'IV Drip': mins = 75; break;
                        default: mins = 60;
                    }
                    event.end = event.start.clone().add(mins, 'minutes');
                    dbk.refreshEditPopover(event);
                }
                return false;
            },
            message: 'Invalid Treatment Type'
        }
    ]
}
```

---

## Asynchronous Tests

You can run async validations (e.g., Salesforce record checks).

- Async tests return a **Promise**.  
- They run sequentially so `skipOnError` still works.  
- For parallel checks, use `Promise.all` inside one test.

**Example:**

```js
{
    test: async (event, opt) => {
        const result = await someAsyncFunction(event);
        return result; // true = error, false = ok
    }
}
```

**Behavior Notes:**
- On **eventSave**, validation waits for all async tests to complete before saving.  
- On other triggers, errors/warnings appear after the promise resolves (may be delayed).  
