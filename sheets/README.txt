Install the "clasp" utility for managing google App Scripts.

https://developers.google.com/apps-script/guides/clasp

npm install @google/clasp -g

Log in:

clasp login

https://codelabs.developers.google.com/codelabs/clasp/#0

----

JSONster.gs is an app script bound to a spreadsheet.
The spreadsheet is the "container" of the script.
The script is bound to the spreadsheet, so it has permission and access.
The script is also contained in a project associated with the sheet.

Container-bound scripts:

https://developers.google.com/apps-script/guides/bound

Extending Google Sheets:
https://developers.google.com/apps-script/guides/sheets

Spreadsheet:
JSONster World

Spreadsheet ID:
1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w

https://docs.google.com/spreadsheets/d/1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w/edit#gid=0

For each instance of a spreadsheet with a script bound to it, there is a project.

Project:
JSONster - project-id-0993534538869130315

https://console.cloud.google.com/home/dashboard?project=project-id-0993534538869130315

Script:
JSONster.gs

Script ID:
19SOWT78niSnnYTM7eCAk7kMm2h0j4E1I2ePmeqfSiR5HFF69_zn8r5dR

https://script.google.com/macros/d/MdVIZmXeb4OwWm2sBIoxhEaJGBFN6q3R9/edit?uiv=2&mid=ACjPJvFXc9jkX6DAFcd80AyFaLCb9e5r5ZMFA8rL1jI_Z9-StpMI2Q3msLV_tNibUcOanOKPLX9XYUbqTIXXb-QMHqf7L0yzMIbHSx9vo75u2wZQ-nWl9AHVGgA479Lpz0-z0lDXv91wbqwo

----

Clone the script:

cd JSONster

clasp clone 19SOWT78niSnnYTM7eCAk7kMm2h0j4E1I2ePmeqfSiR5HFF69_zn8r5dR

clasp pull

rm -f "*~" ; clasp push

NOTE: In order for clasp push to work, you have to go to the
usersettings of the script project and enable the Google Apps Script
API. https://script.google.com/home/usersettings

NOTE: In order for clasp push to work, there may not be any extraneous
files in the directory, including backups like "JSONster.js~" or
"README.txt".

NOTE: In the project, the script is named "JSONster.gs", but in the
directory, it's named "JSONster.js".

----
