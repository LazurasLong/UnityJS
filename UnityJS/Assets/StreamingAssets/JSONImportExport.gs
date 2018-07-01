////////////////////////////////////////////////////////////////////////
// JSON Import Export for Google Sheets
// By Don Hopkins, Ground Up Software.


////////////////////////////////////////////////////////////////////////


console = Logger;


////////////////////////////////////////////////////////////////////////


function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  ss.addMenu("JSONster", [
    {name: 'Spreadsheet To JSON', functionName: 'SpreadsheetToJSON'},
    {name: 'Clear Formatting', functionName: 'ClearFormatting'},
    {name: 'Clear Groups', functionName: 'ClearGroups'}
  ]);
}


////////////////////////////////////////////////////////////////////////


function doGet(e)
{
  var startTime = new Date();
  var path = e ? e.pathInfo : '';
  var parameter = e ? e.parameter : {};
  var data = GetData(path, parameter);
  var endTime = new Date();
  var requestTime = endTime - startTime;
  
  var result = {
    status: 'success',
    requestTime: requestTime,
    data: data
  };
  
  var output = JSON.stringify(result);
  
  return ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}


function GetData(path, parameter)
{
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var spreadsheetName = ss.getName();
  var spreadsheetID = ss.getId();
  var data = {
    path: path,
    parameter: parameter,
    name: spreadsheetName,
    spreadsheetID: spreadsheetID,
    sheets: {},
    sheetNames: [],
    ranges: {},
    rangeNames: []
  };

  var sheets = ss.getSheets();
  for (var index = 0, n = sheets.length; index < n; index++) {
    var sheet = sheets[index];
    var name = sheet.getName();
    var rows = sheet.getLastRow();
    var columns = sheet.getLastColumn();
    var values = sheet.getSheetValues(1, 1, rows, columns);
    var sheetID = sheet.getSheetId();
    data.sheetNames.push(name);
    data.sheets[name] = {
      name: name,
      spreadsheetID: spreadsheetID,
      sheetID: sheetID,
      index: index,
      rows: rows,
      columns: columns,
      values: values
    };
  }

  var namedRanges = ss.getNamedRanges();
  for (var index = 0, n = namedRanges.length; index < n; index++) {
    var namedRange = namedRanges[index];
    var name = namedRange.getName();
    var range = namedRange.getRange();
    var row = range.getRow();
    var column = range.getColumn();
    var width = range.getWidth();
    var height = range.getHeight();
    var sheet = range.getSheet();
    var sheetName = sheet.getName();
    data.rangeNames.push(name);
    data.ranges[name] = {
      name: name,
      index: index,
      row: row,
      column: column,
      width: width,
      height: height,
      sheet: sheetName
    };
  }

  return data;
}


////////////////////////////////////////////////////////////////////////


var gDefaultSheetName = "world";
//var gDefaultSheetName = "test";


function SpreadsheetToJSON(sheetName, isSingleSheet)
{
  if (!sheetName) {
    //sheetName = gDefaultSheetName;
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getActiveSheet();
    sheetName = sheet.getSheetName();
    isSingleSheet = true;
  }
  
  var sheets = {};
  var ranges = {};

  var scope = SheetToScope(sheets, ranges, sheetName, isSingleSheet);
  
  if (!scope) {
    console.log("SpreadsheetToJSON: SheetToScope returned null.");
  } else if (scope.error) {
    console.log("SpreadsheetToJSON: SheetToScope returned error: " + scope.error);
    return false;
  }
  
  console.log("SpreadsheetToJSON: result: " + ((scope == null) ? "NULL" : JSON.stringify(scope.value)));
  
  RenderToSheet(sheets, ranges, scope);
}


function RenderToSheet(sheets, ranges, scope)
{
  var sheetName = scope.sheetName;
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);
  var maxRows = sheet.getMaxRows();
  var maxColumns = sheet.getMaxColumns();
  var fullRange = sheet.getRange(1, 1, maxRows, maxColumns);

  ClearGroups(fullRange);
  ClearFormatting(fullRange);

  RenderScope(sheet, scope);
}


function ClearGroups(fullRange)
{
  if (!sheet) {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getActiveSheet();
    fullRange = sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns());
  }

  fullRange.shiftRowGroupDepth(-1000);
  fullRange.shiftColumnGroupDepth(-1000);
  sheet.setRowGroupControlPosition(SpreadsheetApp.GroupControlTogglePosition.BEFORE);
}


function ClearFormatting(fullRange)
{
  if (!sheet) {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getActiveSheet();
    fullRange = sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns());
  }

  fullRange.clearFormat();
}


function RenderScope(sheet, scope)
{
  var dataRange = sheet.getDataRange();
  
  if (scope.inObject) {
    RenderObjectKey(sheet, dataRange, scope.row, scope.column, scope.rowCount, scope.columnCount, scope.keyRow, scope.keyColumn, scope.key, scope.index);
  }
  
  if (scope.inArray) {
    RenderArrayIndex(sheet, dataRange, scope.row, scope.column, scope.rowCount, scope.columnCount, scope.index);
  }
  
  if (scope.gotType) {
    RenderType(sheet, dataRange, scope.typeRow, scope.typeColumn, scope.typeName);
  }

  if (scope.gotValue) {
    RenderValue(sheet, dataRange, scope.valueRow, scope.valueColumn, scope.valueRows, scope.valueColumns);
  }

  if (scope.gotParams) {
    RenderParams(sheet, dataRange, scope.paramsRow, scope.paramsColumn, scope.paramsRows, scope.paramsColumns);
  }
  
  if (scope.hasChildRows) {
    console.log("hasChildRows firstChildRow " + scope.firstChildRow + " lastChildRow " + scope.lastChildRow + " rowsUsed " + scope.rowsUsed);
    RenderChildRows(sheet, dataRange, scope.firstChildRow, scope.lastChildRow);
  }

  var comments = scope.comments;
  if (comments) {
    for (var commentIndex = 0, commentCount = comments.length;
         commentIndex < commentCount;
         commentIndex++) {
      var commentInfo = comments[commentIndex];
      RenderComment(sheet, dataRange, commentInfo[0], commentInfo[1], commentInfo[3]);
    }
  }
  
  var subScopes = scope.subScopes;
  if (subScopes) {
    for (var subScopeIndex = 0, subScopeCount = subScopes.length;
         subScopeIndex < subScopeCount;
         subScopeIndex++) {
      var subScope = subScopes[subScopeIndex];
      var subSheet =
          scope.isTopInSheet
              ? SpreadsheetApp.getActiveSpreadsheet().getSheetByName(subScope.sheetName)
              : sheet;
      RenderScope(subSheet, subScope);
    }
  }

}

// borders
//   top left bottom right vertical horizontal
//   color
//   style
//     dotted dashed solid solid_medium solid_thick double
// background color
// font color
// font family
// font size
// font weigh
//   bold normal
// font style
//   italic normal
// font line
//   underline line-through none
// horizontal alignment
//   left center right
// vertical alignment
//   top middle bottom
// text direction
//   left_to_right right_to_left
// text rotation
// vertical text
// wrap
// wrap strategy
//   wrap overflow clip
// note
// protected
// data validation
// number format


var gObjectKeyBackgroundColors = [
  "#fff1ce", "#fee49d", "#fbe5ce", "#f8ca9f"
];
var gObjectKeyHorizontalAlignment = 'right';
var gObjectKeyFontFamily = 'Arial';

function RenderObjectKey(sheet, dataRange, row, column, rows, columns, keyRow, keyColumn, key, index)
{
  var range = sheet.getRange(keyRow + 1, keyColumn, rows, columns + 2);
  range.setHorizontalAlignment(gObjectKeyHorizontalAlignment);
  range.setFontFamily(gObjectKeyFontFamily);
  var color =
    gObjectKeyBackgroundColors[
      (index & 1) | ((column & 1) << 1)]
  range.setBackground(color);
}


var gArrayIndexBackgroundColors = [
  "#d0e3f2", "#a0c6e6", "#d9d2e8", "#b4a8d5"
];

function RenderArrayIndex(sheet, dataRange, row, column, rows, columns, index)
{
  var range = sheet.getRange(row + 1, column, rows, columns + 1);
  var color =
    gArrayIndexBackgroundColors[
      (index & 1) | ((column & 1) << 1)]
  range.setBackground(color);
}


var gTypeColor = '#008000';
var gTypeBackgroundColor = '#c0ffc0';
var gTypeHorizontalAlignment = 'center';
var gTypeFontFamily = 'Courier';
var gTypeFontWeight = 'bold';
var gTypeFontBorderStyle = SpreadsheetApp.BorderStyle.SOLID_MEDIUM;

function RenderType(sheet, dataRange, row, column, type)
{
  var range = sheet.getRange(row + 1, column + 1);
  range.setHorizontalAlignment(gTypeHorizontalAlignment);
  range.setBackground(gTypeBackgroundColor);
  range.setFontFamily(gTypeFontFamily);
  range.setFontWeight(gTypeFontWeight);
  range.setBorder(true, true, true, true, false, false, gTypeColor, gTypeFontBorderStyle);
}


var gValueColor = '#000000';
var gValueFontFamily = 'Arial';
var gValueHorizontalAlignment = 'left';

function RenderValue(sheet, dataRange, row, column, rows, columns)
{
  if ((rows == 1) && (columns == 1)) {
    var range = sheet.getRange(row + 1, column + 1);
    range.setFontFamily(gValueFontFamily);
    range.setHorizontalAlignment(gValueHorizontalAlignment);
  }
}


function RenderParams(sheet, dataRange, row, column, rows, columns)
{
  
}


var gCommentColor = '#0000ff';
var gCommentFontFamily = 'Comic Sans MS';
var gCommentFontStyle = 'italic';
var gCommentLeftBorderStyle = SpreadsheetApp.BorderStyle.DOUBLE;
var gCommentHorizontalAlignment = 'left';

function RenderComment(sheet, dataRange, row, column, comment)
{
  var range = sheet.getRange(row + 1, column + 1);
  range.setFontFamily(gCommentFontFamily);
  range.setFontStyle(gCommentFontStyle);
  range.setFontColor(gCommentColor);
  range.setBorder(false, true, false, false, false, false, gCommentColor, gCommentLeftBorderStyle);
  range.setHorizontalAlignment(gCommentHorizontalAlignment);
}


function RenderChildRows(sheet, dataRange, firstChildRow, lastChildRow)
{
  if (lastChildRow == firstChildRow) {
    return;
  }
  var range = sheet.getRange(firstChildRow + 1, 1, lastChildRow - firstChildRow, 1);
  range.shiftRowGroupDepth(1);
}


function GetSheet(sheets, sheetName)
{
  var values = sheets[sheetName];
  if (values) {
    return values;
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    return null;
  }
  
  var dataRange = sheet.getDataRange();
  var numRows = dataRange.getNumRows();
  var numColumns = dataRange.getNumColumns();
  values = dataRange.getValues();

  // Make sure the rows are all filled!
  var nullString = "";
  for (var row = 0; row < numRows; row++) {
    var columnValues = values[row];
    while (columnValues.length < numColumns) {
      columnValues.push(nullString);
    }
  }
  
  return values;
}


function ParseSheet(sheetName)
{
    if (!sheetName || sheetName.length == 0) {
        return null;
    }

    var sheet = GetSheet(sheetName);

    //console.log("ParseSheet: sheet: " + JSON.stringify(sheet));

    if (!sheet || sheet.length == 0) {
        return null;
    }

    var scope = {
        sheetName: sheetName,
        sheet: sheet,
        row: 0,
        column: 0,
        rowCount: sheet.length,
        columnCount: sheet[0].length
    };

    var result =
        LoadJSONFromSheet(scope);
  
    console.log("ParseSheet: result: " + result + " scope: " + scope);

    return scope;
}


function SheetToScope(sheets, ranges, sheetName, isSingleSheet)
{
    if (!sheetName || sheetName.length == 0) {
        return null;
    }

    var sheet = GetSheet(sheets, sheetName);

    if (!sheet || sheet.length == 0) {
        return null;
    }

    var scope = {
        sheetName: sheetName,
        sheet: sheet,
        row: 0,
        column: 0,
        rowCount: sheet.length,
        columnCount: sheet[0].length,
        isTopInSheet: true,
        isSingleSheet: !!isSingleSheet 
    };

    scope.errorScope =
        LoadJSONFromSheet(sheets, ranges, scope);

    if (scope.errorScope) {
        if (scope.errorScope.error) {
            scope.error = scope.errorScope.error;
            scope.errorSheetName = scope.errorScope.errorSheetName;
            scope.errorRow = scope.errorScope.errorRow;
            scope.errorColumn = scope.errorScope.errorColumn;
        }
    }

    return scope;
}


// Recursively loads JSON from a spreadsheet.
// The scope is an object with the following input keys:
//   sheetName: name of the sheet
//   sheet: the spreadsheet, an array of arrays of strings
//   row: the row to read from
//   column: the column to read from
//   rowCount: the number of rows to consider
//   columnCount: the number of columns to consider
// The scope will be returned with the following output keys:
//   value: the value if there was no error
//   rowsUsed: the number of rows used
//   error: a string error message if there was an error
//   errorScope: the scope containing the error
// Returns null on success, or a scope with an error.
// The location of the error in the spreadsheet can be determined by the row and column of the errorScope.
// The scopes are enriched with optional metadata used to provide feedback by formatting the spreadsheet, etc.

function LoadJSONFromSheet(sheets, ranges, scope)
{
    var i;
    var key;
    var index;
    var unindented;
    var subScope;
    var stripNumberRegexp = new RegExp('[,$ ]', 'g');


    scope.currentRow = scope.row;
    scope.currentColumn = scope.column;
    scope.gotValue = true;
    scope.valueRow = scope.row;
    scope.valueColumn = scope.column;
    scope.valueRows = 1;
    scope.valueColumns = 1;
    scope.rowValues = scope.sheet[scope.currentRow];
    scope.value = null;
    scope.rowsUsed = 1;
    scope.comments = [];


    function GetColumnString(column, doNotTrim)
    {
        if (isNaN(column) || 
            ((column != "") && 
             (!column))) {
            var oops = true;
            return "";
        }

        var result = scope.rowValues[column];
        if (!result) {
            return "";
        }

        result = "" + result;

        if (!doNotTrim) {
            result = result.trim();
        }

        return result;
    }


    function GetColumnNumber(column)
    {
        var str = GetColumnString(column);

        str = str.replace(stripNumberRegexp, '');

        if (str == '') {
            str = '0';
        }

        return parseFloat(str);
    }


    function FindComments(row, column, columns)
    {
        var rowValues =
            scope.sheet[row];
        var end =
            columns
                ? (column + columns)
                : scope.rowValues.length;
        for (var col = column; col < end; col++) {
            var comment = rowValues[col];
            if (comment) {
                scope.comments.push([row, col, comment]);
            }
        }
    }


    // If a type was not passed in (not single cell), then pick up the type from
    // the cell in the spreadsheet and move to the next cell to the right.
    if (!scope.isSingleCell) {
        scope.gotType = true;
        scope.typeName = GetColumnString(scope.currentColumn);
        scope.typeRow = scope.currentRow;
        scope.typeColumn = scope.currentColumn;
        scope.valueColumn++;
        if (!scope.typeName) {
            scope.error = "Expected a typeName.";
            scope.errorSheetName = scope.sheetName;
            scope.errorRow = scope.currentRow;
            scope.errorColumn = scope.currentColumn;
            return scope; // error
        }
    }

    //console.log("LoadJSONFromSheet: row " + scope.row + " col " + scope.col + " rowCount " + scope.rowCount + " colCount " + scope.colCount + " typeName " + scope.typeName + " currentRow " + scope.currentRow + " currentColumn " + scope.currentColumn + " value " + value);

    switch (scope.typeName) {

        case "null":
            if (!scope.isSingleCell) {
                FindComments(scope.currentRow, scope.valueColumn);
            }
            scope.value = null;
            scope.valueColumn = -1;
            scope.valueRow = -1;
            scope.valueRows = 0;
            scope.valueColumns = 0;
            return null; // success

        case "boolean":
            if (!scope.isSingleCell) {
                FindComments(scope.currentRow, scope.valueColumn + 1);
            }
            scope.value = GetColumnString(scope.valueColumn).toLowerCase() == "true";
            return null; // success

        case "string":
            if (!scope.isSingleCell) {
                FindComments(scope.currentRow, scope.valueColumn + 1);
            }
            scope.value = GetColumnString(scope.valueColumn, true);
            return null; // success

        case "json":
            if (!scope.isSingleCell) {
                FindComments(scope.currentRow, scope.valueColumn + 1);
            }
            scope.value = "" + GetColumnString(scope.valueColumn, true);
            try {
                scope.value = JSON.parse(scope.value);
            } catch (e) {
                console.log("JSON PARSING ERROR", e, scope.value);
            }
            return null; // success

        case "number":
        case "float":
            if (!scope.isSingleCell) {
                FindComments(scope.currentRow, scope.valueColumn + 1);
            }
            scope.value = GetColumnNumber(scope.valueColumn);
            return null; // success

        case "integer":
            if (!scope.isSingleCell) {
                FindComments(scope.currentRow, scope.valueColumn + 1);
            }
            scope.value = Math.floor(GetColumnNumber(scope.valueColumn));
            return null; // success

        case "object":

            if (scope.isSingleCell) {
                scope.error = "Type object can't be used as a single cell.";
                scope.errorSheetName = scope.sheetName;
                scope.errorRow = scope.currentRow;
                scope.errorColumn = scope.currentColumn;
                return scope; // error
            }

            FindComments(scope.currentRow, scope.valueColumn);

            scope.value = {};
            scope.subScopes = [];
            scope.currentRow++;
            scope.hasChildRows = true;
            scope.firstChildRow = scope.currentRow;
            scope.lastRow = scope.row + scope.rowCount;
            scope.lastColumn = scope.column + scope.columnCount;
            index = 0;

            while (scope.currentRow < scope.lastRow) {
                scope.rowValues = scope.sheet[scope.currentRow];

                // If this row is unindented, then we are done.
                unindented = false;
                scope.previousColumn = scope.currentColumn - (scope.alreadyIndented ? 1 : 0);
                for (i = 0; i <= scope.previousColumn; i++) {
                    if (GetColumnString(i) != "") {
                        unindented = true;
                        break;
                    }
                }
                if (unindented) {
                    break;
                }

                scope.startColumn = scope.currentColumn + (scope.alreadyIndented ? 0 : 1);
                key = GetColumnString(scope.startColumn);
                if (key == "") {
                    FindComments(scope.currentRow, scope.startColumn + 1);
                    scope.currentRow++;
                } else {

                    subScope = {
                        parentScope: scope,
                        sheetName: scope.sheetName,
                        sheet: scope.sheet,
                        isSingleSheet: scope.isSingleSheet,
                        row: scope.currentRow,
                        column: scope.startColumn + 1,
                        rowCount: scope.lastRow - scope.currentRow,
                        columnCount: scope.lastColumn - scope.startColumn - 1,
                        alreadyIndented: true,
                        inObject: true,
                        index: index,
                        key: key,
                        keyRow: scope.currentRow,
                        keyColumn: scope.startColumn
                    };

                    scope.subScopes.push(subScope);
                    index++;

                    scope.errorScope = LoadJSONFromSheet(sheets, ranges, subScope);
                    if (scope.errorScope) {
                        return scope.errorScope; // error
                    }

                    scope.value[key] = subScope.value;
                    scope.currentRow += subScope.rowsUsed;

                    //console.log("SET OBJECT key " + key + " rowsUsed " + subScope.rowsUsed + " value " + JSON.stringify(subScope.value));
                }
            }

            scope.lastChildRow = scope.currentRow;

            // Return the number of rows actually used.
            scope.rowsUsed = scope.currentRow - scope.row;

            return null; // success

        case "array":

            if (scope.isSingleCell) {
                scope.error = "Type array can't be used as a single cell.";
                scope.errorSheetName = scope.sheetName;
                scope.errorRow = scope.currentRow;
                scope.errorColumn = scope.currentColumn;
                return scope; // error
            }

            FindComments(scope.currentRow, scope.valueColumn);

            scope.value = [];
            scope.subScopes = [];
            scope.currentRow++;
            scope.hasChildRows = true;
            scope.firstChildRow = scope.currentRow;
            scope.lastRow = scope.row + scope.rowCount;
            scope.lastColumn = scope.column + scope.columnCount;
            index = 0;

            while (scope.currentRow < scope.lastRow) {
                scope.rowValues = scope.sheet[scope.currentRow];

                // If this row is unindented, then we are done. 
                unindented = false;
                scope.previousColumn = scope.currentColumn - (scope.alreadyIndented ? 1 : 0);
                for (i = 0; i <= scope.previousColumn; i++) {
                    if (GetColumnString(i) != "") {
                        unindented = true;
                        break;
                    }
                }
                if (unindented) {
                    break;
                }

                scope.startColumn = scope.currentColumn + (scope.alreadyIndented ? 0 : 1);
                var cell = GetColumnString(scope.startColumn);
                if (!cell) {
                    FindComments(scope.currentRow, scope.startColumn + 1);
                    scope.currentRow++;
                } else {

                    subScope = {
                        parentScope: scope,
                        sheetName: scope.sheetName,
                        sheet: scope.sheet,
                        isSingleSheet: scope.isSingleSheet,
                        row: scope.currentRow,
                        column: scope.startColumn,
                        rowCount: scope.lastRow - scope.currentRow,
                        columnCount: scope.lastColumn - scope.startColumn,
                        inArray: true,
                        index: index
                    };

                    scope.subScopes.push(subScope);

                    scope.errorScope = LoadJSONFromSheet(sheets, ranges, subScope);
                    if (scope.errorScope) {
                        return scope.errorScope; // error
                    }

                    scope.value.push(subScope.value);
                    index++;

                    scope.currentRow += subScope.rowsUsed;

                }

            }

            scope.lastChildRow = scope.currentRow;

            // Return the number of rows actually used.
            scope.rowsUsed = scope.currentRow - scope.row;

            return null; // success

        case "sheet":

            if (!scope.isSingleCell) {
                FindComments(scope.currentRow, scope.valueColumn + 1);
            }

            var sheetName = GetColumnString(scope.valueColumn);
            if (sheetName == "") {
                scope.error = "Expected 'sheet sheetName'.";
                scope.errorSheetName = scope.sheetName;
                scope.errorRow = scope.currentRow;
                scope.errorColumn = scope.currentColumn;
                return scope;
            }

            if (scope.isSingleSheet) {

                scope.value = null;

            } else {
  
                scope.sheetScope = SheetToScope(sheets, ranges, sheetName);
                if (!scope.sheetScope) {
                    scope.error = "Could not find sheet: " + sheetName;
                    scope.errorSheetName = scope.sheetName;
                    scope.errorRow = scope.currentRow;
                    scope.errorColumn = scope.currentColumn;
                    return scope;
                }
    
                scope.sheetScope.parentScope = scope;
                scope.subScopes = [scope.sheetScope];
    
                if (scope.sheetScope.error) {
                    scope.errorScope = scope.sheetScope;
                    return scope.errorScope; // error
                }
    
                scope.value = scope.sheetScope.value;
              
            }
            return null; // success

        case "grid":

            if (scope.isSingleCell) {
                scope.error = "Type grid can't be used as a single cell.";
                scope.errorSheetName = scope.sheetName;
                scope.errorRow = scope.currentRow;
                scope.errorColumn = scope.currentColumn;
                return scope; // error
            }

            FindComments(scope.currentRow, scope.valueColumn + 3);

            scope.gotParams = true;
            scope.paramsRow = scope.currentRow;
            scope.paramsColumn = scope.valueColumn;
            scope.paramsRows = 1;
            scope.paramsColumns = 3;

            var gridTypeName = GetColumnString(scope.valueColumn);
            if (gridTypeName) {
                gridTypeName = ("" + gridTypeName).trim();
            }
            if (!gridTypeName) {
                scope.error = "Expected 'grid typeName columns rows'.";
                scope.errorSheetName = scope.sheetName;
                scope.errorRow = scope.currentRow;
                scope.errorColumn = scope.valueColumn;
                return scope; // error
            }

            var gridColumns = GetColumnString(scope.valueColumn + 1);
            if (gridColumns) {
                gridColumns = parseInt(gridColumns);
            }
            if (!gridColumns || (gridColumns < 1)) {
                scope.error = "Expected 'grid typeName columns rows', missing columns > 0.";
                scope.errorSheetName = scope.sheetName;
                scope.errorRow = scope.currentRow;
                scope.errorColumn = scope.valueColumn + 1;
                return scope; // error
            }

            var gridRows = GetColumnString(scope.valueColumn + 2);
            if (gridRows) {
                gridRows = parseInt(gridRows);
            }
            if (!gridRows || (gridRows < 1)) {
                scope.error = "Expected 'grid typeName columns rows', missing rows > 0";
                scope.errorSheetName = scope.sheetName;
                scope.errorRow = scope.currentRow;
                scope.errorColumn = scope.valueColumn + 2;
                return scope; // error
            }

            scope.value = [];
            scope.subScopes = [];
            scope.currentRow++;
            scope.hasChildRows = true;
            scope.firstChildRow = scope.currentRow;
            scope.lastChildRow = scope.currentRow + gridRows + 1;
            scope.valueRow = scope.currentRow;
            scope.valueColumn = scope.currentColumn;
            scope.valueRows = gridRows;
            scope.valueColumns = gridColumns;
            scope.startRow = scope.currentRow;
            scope.startColumn = scope.currentColumn;

            for (var gridRowIndex = 0; gridRowIndex < gridRows; gridRowIndex++) {

                var gridRow = scope.startRow + gridRowIndex;
                var gridRowValues = [];

                scope.value.push(gridRowValues);
                scope.rowValues = scope.sheet[gridRow];

                FindComments(gridRow, 0, scope.startColumn);
                FindComments(gridRow, scope.startColumn + gridColumns);

                for (var gridColumnIndex = 0; gridColumnIndex < gridColumns; gridColumnIndex++) {

                    var gridColumn = scope.startColumn + gridColumnIndex;

                    subScope = {
                        sheetName: scope.sheetName,
                        sheet: scope.sheet,
                        isSingleSheet: scope.isSingleSheet,
                        isSingleCell: true,
                        row: gridRow,
                        column: gridColumn,
                        rowCount: 1,
                        columnCount: 1,
                        typeName: gridTypeName,
                        alreadyIndented: true,
                        inGrid: true,
                        gridRow: gridRow,
                        gridColumn: gridColumn,
                        gridRowIndex: gridRowIndex,
                        gridColumnIndex: gridColumnIndex
                    };

                    scope.subScopes.push(subScope);

                    scope.errorScope = LoadJSONFromSheet(sheets, ranges, subScope);
                    if (scope.errorScope) {
                        return scope.errorScope; // error
                    }

                    gridRowValues.push(subScope.value);

                }

            }

            // Return the number of rows actually used.
            scope.rowsUsed += 1 + gridRows;

            return null; // success

        case "table":

            if (scope.isSingleCell) {
                scope.error = "Type table can't be used as a single cell.";
                scope.errorSheetName = scope.sheetName;
                scope.errorRow = scope.currentRow;
                scope.errorColumn = scope.currentColumn;
                return scope; // error
            }

            FindComments(scope.currentRow, scope.valueColumn);

            scope.value = [];
            scope.subScopes = [];

            scope.lastRow = scope.row + scope.rowCount;
            scope.lastColumn = scope.column + scope.columnCount;

            // Get the next indented row of headers.
            scope.currentRow++;

            // Make sure we are not at the end of the spreadsheet.
            if (scope.currentRow >= scope.lastRow) {
                scope.error = "Type table should be followed by a row of table headers.";
                scope.errorSheetName = scope.sheetName;
                scope.errorRow = scope.currentRow;
                scope.errorColumn = scope.currentColumn;
                return scope;
            }

            scope.rowValues = scope.sheet[scope.currentRow];

            var header;
            var headerColumn;
            var headerRow = scope.currentRow;

            // Make sure the next indented row of headers is not missing.
            scope.previousColumn = scope.currentColumn - (scope.alreadyIndented ? 1 : 0);
            for (headerColumn = 0; headerColumn <= scope.previousColumn; headerColumn++) {
                header = GetColumnString(headerColumn);
                if (header != "") {
                    scope.error = "Type table should be follow by an indented row of table headers, not an unindented row.";
                    scope.errorSheetName = scope.sheetName;
                    scope.errorRow = scope.currentRow;
                    scope.errorColumn = headerColumn;
                    return scope;
                }
            }

            // Make sure there are one or more indented headers.
            header = GetColumnString(headerColumn);

            if (!header) {
                scope.error = "Type table should be follow by an indented row of table headers. Missing the first header.";
                scope.errorSheetName = scope.sheetName;
                scope.errorRow = scope.currentRow;
                scope.errorColumn = headerColumn;
                return scope;
            }

            // Gather the headers, skipping columns with empty headers.
            var headers = [];
            var firstHeaderColumn = headerColumn;
            var lastHeaderColumn = -1;
            for (; headerColumn < scope.lastColumn; headerColumn++) {
                header = GetColumnString(headerColumn);
                if (header == "") {
                    continue;
                }
                headers.push([header, headerRow, headerColumn]);
                lastHeaderColumn = headerColumn;
            }

            var headerColumns = (lastHeaderColumn + 1) - firstHeaderColumn;
            scope.gotParams = true;
            scope.paramsRow = scope.currentRow;
            scope.paramsColumn = firstHeaderColumn;
            scope.paramsRows = 1;
            scope.paramsColumns = headerColumns;

            // Parse the column headers into tokens associated with columns.
            var tokens = [];
            scope.tokens = tokens;
            for (var headersIndex = 0, headersLength = headers.length; headersIndex < headersLength; headersIndex++) {

                var token = "";
                var headerInfo = headers[headersIndex];
                header = headerInfo[0];
                headerRow = headerInfo[1];
                headerColumn = headerInfo[2];

                function finishToken()
                {
                    if (token == "") {
                        return;
                    }
                    tokens.push([token, headerRow, headerColumn]);
                    token = "";
                }

                for (var headerIndex = 0, headerLength = header.length; headerIndex < headerLength; headerIndex++) {
                    var ch = header[headerIndex];

                    switch (ch) {

                        case '{':
                        case '}':
                        case '[':
                        case ']':
                            finishToken();
                            tokens.push([ch, headerRow, headerColumn]);
                            break;

                        case ' ':
                            finishToken();
                            break;

                        default:
                            token += ch;
                            break;

                    }

                }

                finishToken();

            }

            tokens.push(['.', -1, -1]);

            // Go to the next row and read in subsequent rows until the end of the spreadsheet or an unindented row.
            scope.currentRow++;
            index = 0;

            while (scope.currentRow < scope.lastRow) {

                scope.rowValues = scope.sheet[scope.currentRow];

                // If this row is unindented, then we are done.
                unindented = false;
                scope.previousColumn = scope.currentColumn - (scope.alreadyIndented ? 1 : 0);
                for (i = 0; i <= scope.previousColumn; i++) {
                    if (GetColumnString(i) != "") {
                        unindented = true;
                        break;
                    }
                }
                if (unindented) {
                    break;
                }

                scope.startColumn = scope.currentColumn + (scope.alreadyIndented ? 0 : 1);

                FindComments(scope.currentRow, 0, scope.startColumn);
                FindComments(scope.currentRow, lastHeaderColumn + 1);

                var tokenIndex = 0;
                var error = null;
                var errorRow = scope.currentRow;
                var errorColumn = scope.startColumn;
                var value = null;
                var valueStack = [];

                // Get the next tokenInfo, containing the token and the column in which it occurred.
                function NextTokenInfo()
                {
                    if (tokenIndex >= tokens.length) {
                        console.log("NextTokenInfo: Ran out of tokens!");
                        return ['.', -1, -1];
                    }
                    var tokenInfo = tokens[tokenIndex++];
                    return tokenInfo;
                }

                // Parse the top level structure, either an array or an object, into value.
                // Returns true if successful, false if not.
                // Sets value on success, or error on failure.
                function ParseTop()
                {
                    value = null;

                    var tokenInfo = NextTokenInfo();
                    var token = tokenInfo[0];

                    switch (token) {

                        case '{':
                            if (!ParseObject()) {
                                return false;
                            }
                            break;

                        case '[':
                            if (!ParseArray()) {
                                return false;
                            }
                            break;

                        default:
                            error = "ParseTop: expected initial '{' or '['.";
                            return false;

                    }

                    tokenInfo = NextTokenInfo();
                    token = tokenInfo[0];
                    if (token != '.') {
                        error = "ParseTop: did not expect any tokens after final '}' or ']'.";
                        errorRow = tokenRow;
                        errorColumn = tokenColumn;
                        return false;
                    }

                    return true;
                }

                // Parse an object into value.
                // Returns true if successful, false if not.
                // Sets value on success, or error on failure.
                function ParseObject()
                {
                    value = {};

                    while (true) {

                        var tokenInfo = NextTokenInfo();
                        var token = tokenInfo[0];
                        var tokenRow = tokenInfo[1];
                        var tokenColumn = tokenInfo[2];

                        switch (token) {

                            case '}':
                                return true;

                            case '{':
                            case '[':
                            case ']':
                            case '.':
                                error = "ParseObject: expected key of 'key type' or '}' instead of " + token;
                                errorRow = tokenRow;
                                errorColumn = tokenColumn;
                                return false;

                            default:

                                var key = token;
                                var typeTokenInfo = NextTokenInfo();
                                var typeToken = typeTokenInfo[0];
                                var typeRow = typeTokenInfo[1];
                                var typeColumn = typeTokenInfo[2];

                                switch (typeToken) {

                                    case '{':

                                        valueStack.push(value);

                                        if (!ParseObject()) {
                                            return false;
                                        }

                                        var objectValue = value;
                                        value = valueStack.pop();
                                        value[key] = objectValue;

                                        break;

                                    case '[':

                                        valueStack.push(value);

                                        if (!ParseArray()) {
                                            return false;
                                        }

                                        var arrayValue = value;
                                        value = valueStack.pop();
                                        value[key] = arrayValue;

                                        break;

                                    case '}':
                                    case ']':
                                    case '.':
                                        error = "ParseObject: expected type of 'key type' instead of " + token;
                                        errorRow = tokenRow;
                                        errorColumn = tokenColumn;
                                        return false;

                                    default:
                                        var typeName = typeToken;
                                        
                                        subScope = {
                                            sheetName: scope.sheetName,
                                            sheet: scope.sheet,
                                            isSingleSheet: scope.isSingleSheet,
                                            isSingleCell: true,
                                            row: scope.currentRow,
                                            column: typeColumn,
                                            rowCount: 1,
                                            columnCount: 1,
                                            typeName: typeName,
                                            alreadyIndented: true,
                                            inTable: true,
                                            index: index,
                                            tableRow: scope.currentRow,
                                            tableColumn: firstHeaderColumn,
                                            tableRows: 1,
                                            tableColumns: headerColumns,
                                            inTableObject: true,
                                            inTableObjectKey: key
                                        };

                                        scope.subScopes.push(subScope);

                                        scope.errorScope = LoadJSONFromSheet(sheets, ranges, subScope);
                                        if (scope.errorScope) {
                                            return false;
                                        }

                                        value[key] = subScope.value;

                                        break;

                                }

                                break;
                        }

                    }

                }

                // Parse an array into value.
                // Returns true if successful, false if not.
                // Sets value on success, or error on failure.
                function ParseArray()
                {
                    value = [];

                    while (true) {

                        var tokenInfo = NextTokenInfo();
                        var token = tokenInfo[0];
                        var tokenRow = tokenInfo[1];
                        var tokenColumn = tokenInfo[2];

                        switch (token) {

                            case ']':
                                return true;

                            case '}':
                            case '.':
                                error = "ParseArray: expected type or ']' instead of " + token;
                                errorRow = tokenRow;
                                errorColumn = tokenColumn;
                                return false;

                            case '{':

                                valueStack.push(value);

                                if (!ParseObject()) {
                                    return false;
                                }

                                var objectValue = value;
                                value = valueStack.pop();
                                value.push(objectValue);

                                break;

                            case '[':

                                valueStack.push(value);

                                if (!ParseArray()) {
                                    return false;
                                }

                                var arrayValue = value;
                                value = valueStack.pop();
                                value.push(arrayValue);

                                break;

                            default:

                                var typeName = token;

                                subScope = {
                                    sheetName: scope.sheetName,
                                    sheet: scope.sheet,
                                    isSingleSheet: scope.isSingleSheet,
                                    isSingleCell: true,
                                    row: scope.currentRow,
                                    column: tokenColumn,
                                    rowCount: 1,
                                    columnCount: 1,
                                    typeName: typeName,
                                    alreadyIndented: true,
                                    inTable: true,
                                    index: index,
                                    tableRow: scope.currentRow,
                                    tableColumn: firstHeaderColumn,
                                    tableRows: 1,
                                    tableColumns: headerColumns,
                                    inTableArray: true,
                                    inTableArrayIndex: subScope.value.length
                                };

                                scope.subScopes.push(subScope);

                                scope.errorScope = LoadJSONFromSheet(sheets, ranges, subScope);
                                if (scope.errorScope) {
                                    return false;
                                }

                                value.push(subScope.value);

                                break;
                        }

                    }
                }

                // Now parse this row into an array or object into value.
                if (ParseTop()) {
                    scope.value.push(value);
                } else {
                    scope.error = error;
                    scope.errorSheetName = scope.sheetName;
                    scope.errorRow = errorRow;
                    scope.errorColumn = errorColumn;
                    return scope; // error
                }

                // Go to the next row.
                scope.currentRow++;

            }

            // Return the number of rows actually used.
            scope.rowsUsed = scope.currentRow - scope.row;

            return null; // success

        default:
            scope.error = "Unexpected typeName: " + scope.typeName;
            scope.errorSheetName = scope.sheetName;
            scope.errorRow = scope.currentRow;
            scope.errorColumn = scope.currentColumn;
            return scope; // error

    }

}


////////////////////////////////////////////////////////////////////////
