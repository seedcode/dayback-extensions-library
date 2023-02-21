// Custom Popover Panel v1.0 - Part 1
//
// Purpose:
// This app action loads the google charts library
// for use with custom side panels. If you do not
// intend to use google charts in your side panels
// you can omit installation of this action.
//
// Action Type: Before Calendar Rendered
// Prevent Default Action: No
//
// More info on custom actions here:
// https://docs.dayback.com/article/140-custom-app-actions

var script = document.createElement('script');  
script.setAttribute('src','https://www.gstatic.com/charts/loader.js');
document.head.appendChild(script);