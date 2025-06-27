# Salesforce Modals from DayBack

This project contains a complete working example of how to extend the [DayBack Calendar](https://dayback.com) with **custom floating modal popovers** inside Salesforce. These modals load Visualforce pages—such as Chatter feeds or custom record views—directly above your calendar view, enhancing workflows without requiring users to leave the calendar interface.

## 🧩 Key Features

- Launch Visualforce modals dynamically from DayBack via custom button actions or event triggers.
- Display Salesforce Chatter activity for related records inside modals.
- Highlight events that have Chatter activity using custom icons and CSS.
- Enable secure, two-way messaging between DayBack’s canvas app and native Salesforce components.

---

## 📁 Repository Contents

| File | Description |
|------|-------------|
| `DayBackWithModals.vfp` | A modified Visualforce page that embeds DayBack and defines a hidden modal container to load VF content over the calendar. |
| `DayBackWithModalsJS.js` | A supporting static resource that manages the modal’s open/close behavior and handles Canvas messaging. |
| `EventChatter.vfp` | A Visualforce page that displays the Chatter feed for the `Technician_Assignment__c` custom object. |
| `FeedItemTrigger.trigger` | A Salesforce Apex trigger that sets a checkbox (`Has_Chatter_Activity__c`) to `true` when Chatter posts are added to Technician Assignment records. |
| `aer-open-chatter-on-click.js` | A DayBack "After Events Rendered" script that listens for clicks on the Chatter icon and opens the Chatter modal. |
| `bcr-subscribe-to-modal-closure.js` | A DayBack "Before Calendar Rendered" script that listens for modal closure events and triggers logic in DayBack accordingly. |
| `ber-add-chatter-css-class.js` | A "Before Event Rendered" script that adds a CSS class (`hasChatter`) to events that have Chatter activity. |
| `chatter-icon-styles.css` | CSS rules for styling events with Chatter activity—including a comment icon, color, and border highlights. |
| `oec-prevent-popover-from-opening.js` | An "On Event Click" script that prevents accidental opening of the DayBack event popover when clicking the Chatter icon. |
| `open-chatter-button-action.js` | A DayBack custom action script that triggers the modal to open the `EventChatter.vfp` page with the appropriate record context. |

---

## 🔧 Setup Instructions

1. **Install Visualforce Pages and Trigger**
   - Upload `DayBackWithModals.vfp` and `EventChatter.vfp` to your org.
   - Install `FeedItemTrigger.trigger` and replace the object prefix (`a09`) with the correct ID prefix for your object.

2. **Add Static Resources**
   - Upload `DayBackWithModalsJS.js` and `chatter-icon-styles.css` to Salesforce as static resources.
   - Name them exactly as the files are named.

3. **Configure DayBack**
   - Update the DayBack tab to point to `DayBackWithModals.vfp`.
   - Import DayBack custom actions:
     - `open-chatter-button-action.js`
     - `aer-open-chatter-on-click.js`
     - `ber-add-chatter-css-class.js`
     - `bcr-subscribe-to-modal-closure.js`
     - `oec-prevent-popover-from-opening.js`
   - Add the CSS in `chatter-icon-styles.css` to your DayBack Theme CSS settings.

4. **Add the Custom Field**
   - Create a checkbox field on your custom object named `Has_Chatter_Activity__c`.
   - Map this field to DayBack’s field mappings so it can be accessed in event scripts.

---

## 💡 Use Case Ideas

- Open Chatter threads directly from the calendar.
- Launch custom approval or update forms in a modal.
- Display audit logs or activity history for a record.
- Use modal callbacks to refresh calendar data in real time.

---

## 📬 Feedback & Contributions

Feel free to fork this repo, open issues, or submit improvements. For questions related to DayBack integrations, visit [https://dayback.com/help/](https://dayback.com/help/)

---
