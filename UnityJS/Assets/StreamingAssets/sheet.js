/*
 * sheet.js
 * Don Hopkins, Ground Up Software.
 */


function LoadSheets(sheets, sheetURLs, success, error)
{
    var xhrs = {};
    var calledError = false;

    for (var sheetName in sheetURLs) {
        (function (sheetName) {

            var sheetURL = 
                sheetURLs[sheetName];
            var url =
                'http://donhopkins.com/home/_p/miniProxy.php?' + 
                sheetURL +
                "&rand=" + 
                Math.random();

            var xhr = new XMLHttpRequest();
            xhrs[sheetName] = xhr;

            //console.log("sheets.js: LoadSheets: sheetName: " + sheetName + " url: " + url);

            xhr.onload = function() {
                var text = xhr.responseText;

                var sheet = ParseSheet(text);
                sheets[sheetName] = sheet;

                delete xhrs[sheetName];

                var sheetsLeft = Object.keys(xhrs).length;

                //console.log("sheets.js: LoadSheets: onload: Loaded sheetName: " + sheetName + " sheetsLeft: " + sheetsLeft);

                if (sheetsLeft === 0) {
                    success();
                }
            };

            xhr.onerror = function(error) {
                console.log("sheets.js: LoadSheets: error 1 loading sheetName: " + sheetName + " url:", url, "xhr:", xhr, "REPLIED:", xhr.statusText, "error:", error);
                if (!calledError) {
                    calledError = true;
                    error();
                }
            };

            xhr.onloadend = function(a) {
                if (xhr.status >= 400) {
                    console.log("sheets.js: LoadSheets: error 2 loading sheetName: " + sheetName + " url:", url, "xhr:", xhr, "REPLIED:", xhr.statusText);
                } else if (xhr.status === 0) {
                    console.log("sheets.js: LoadSheets: error 3 loading sheetName: " + sheetName + " url:", url, "xhr:", xhr, "REPLIED:", xhr.statusText);
                }
                if (!calledError) {
                    calledError = true;
                    error();
                }
            };

            xhr.open('GET', url);
            xhr.send();

        })(sheetName);
    }
}


function ParseSheet(text)
{
    text = text.replace(/\r\n/g, '\n');
    text = text.replace(/\r/g, '\n');
    var lines = text.split('\n');
    var sheet = [];
    for (var i = 0, n = lines.length; i < n; i++) {
        var line = lines[i];
        var columns = line.split('\t');
        sheet.push(columns);
    }
    return sheet;
}



function GetSheet(sheets, sheetName)
{
    var sheet = 
        sheets[sheetName];
    return sheet;
}


function SheetToScope(sheets, sheetName)
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
        columnCount: sheet[0].length
    };

    scope.errorScope =
        LoadJSONFromSheet(sheets, scope);

    if (scope.errorScope) {
        if (scope.errorScope.error) {
            scope.error = scope.errorScope.error;
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

function LoadJSONFromSheet(sheets, scope)
{
    var i;
    var name;
    var unindented;
    var subScope;

    scope.currentRow = scope.row;
    scope.currentColumn = scope.column;
    scope.valueColumn = scope.column;
    scope.rowValues = scope.sheet[scope.currentRow];
    scope.value = null;
    scope.rowsUsed = 1;
    scope.fixedType = !!scope.typeName;

    function GetColumnString(column, doNotTrim)
    {
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

    // If a fixed type was not passed in, then pick up the type from
    // the cell in the spreadsheet and move to the next cell to the right.
    if (!scope.fixedType) {
        scope.typeName = GetColumnString(scope.currentColumn);
        scope.valueColumn++;
        if (!scope.typeName) {
            scope.error = "Expected a typeName.";
            return scope; // error
        }
    }

    //console.log("LoadJSONFromSheet: row " + scope.row + " col " + scope.col + " rowCount " + scope.rowCount + " colCount " + scope.colCount + " typeName " + scope.typeName + " currentRow " + scope.currentRow + " currentColumn " + scope.currentColumn + " value " + value);

    switch (scope.typeName) {

        case "null":
            scope.value = null;
            return null; // success

        case "boolean":
            scope.value = GetColumnString(scope.valueColumn).toLowerCase() == "true";
            return null; // success

        case "string":
            scope.value = GetColumnString(scope.valueColumn, true);
            return null; // success

        case "json":
            scope.value = "" + GetColumnString(scope.valueColumn, true);
            try {
                scope.value = JSON.parse();
            } catch (e) {
                console.log("JSON PARSING ERROR", e, scope.value);
            }
            return null; // success

        case "number":
        case "float":
            scope.value = parseFloat(GetColumnString(scope.valueColumn) || 0);
            return null; // success

        case "integer":
            scope.value = parseInt(GetColumnString(scope.valueColumn) || 0);
            return null; // success

        case "grid":

            if (scope.fixedType) {
                scope.error = "Type grid can't be used as a fixed type.";
                return scope; // error
            }

            var gridTypeName = GetColumnString(scope.valueColumn);
            if (gridTypeName) {
                gridTypeName = ("" + gridTypeName).trim();
            }
            if (!gridTypeName) {
                scope.error = "Expected 'grid typeName columns rows'.";
                return scope; // error
            }

            var gridColumns = GetColumnString(scope.valueColumn + 1);
            if (gridColumns) {
                gridColumns = parseInt(gridColumns);
            }
            if (!gridColumns || (gridColumns < 1)) {
                scope.error = "Expected 'grid typeName columns rows', missing columns > 0.";
                return scope; // error
            }

            var gridRows = GetColumnString(scope.valueColumn + 2);
            if (gridRows) {
                gridRows = parseInt(gridRows);
            }
            if (!gridRows || (gridRows < 1)) {
                scope.error = "Expected 'grid typeName columns rows', missing rows > 0";
                return scope; // error
            }

            scope.value = [];
            scope.subScopes = [];
            scope.currentRow++;

            for (var gridRow = 0; gridRow < gridRows; gridRow++) {

                var gridRowValues = [];

                scope.startColumn = scope.currentColumn;
                scope.value.push(gridRowValues);
                scope.rowValues = scope.sheet[scope.currentRow];

                for (var gridColumn = 0; gridColumn < gridColumns; gridColumn++) {

                    subScope = {
                        sheetName: scope.sheetName,
                        sheet: scope.sheet,
                        row: scope.currentRow + gridRow,
                        column: scope.startColumn + gridColumn,
                        rowCount: 1,
                        columnCount: 1,
                        typeName: gridTypeName
                    };

                    scope.subScopes.push(subScope);

                    scope.errorScope = LoadJSONFromSheet(sheets, subScope);
                    if (scope.errorScope) {
                        return scope.errorScope; // error
                    }

                    gridRowValues.push(subScope.value);

                }

            }

            // Return the number of rows actually used.
            scope.rowsUsed += 1 + gridRows;

            return null; // success

        case "object":

            if (scope.fixedType) {
                scope.error = "Type object can't be used as a fixed type.";
                return scope; // error
            }

            scope.value = {};
            scope.subScopes = [];

            scope.currentRow++;
            scope.lastRow = scope.row + scope.rowCount;
            scope.lastColumn = scope.column + scope.columnCount;

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
                name = GetColumnString(scope.startColumn);
                if (name == "") {
                    scope.currentRow++;
                } else {

                    subScope = {
                        parentScope: scope,
                        sheetName: scope.sheetName,
                        sheet: scope.sheet,
                        row: scope.currentRow,
                        column: scope.startColumn + 1,
                        rowCount: scope.lastRow - scope.currentRow,
                        columnCount: scope.lastColumn - scope.startColumn - 1,
                        alreadyIndented: true
                    };

                    scope.subScopes.push(subScope);

                    scope.errorScope = LoadJSONFromSheet(sheets, subScope);
                    if (scope.errorScope) {
                        return scope.errorScope; // error
                    }

                    scope.value[name] = subScope.value;
                    scope.currentRow += subScope.rowsUsed;

                    //console.log("SET OBJECT name " + name + " rowsUsed " + subScope.rowsUsed + " value " + JSON.stringify(subScope.value));
                }
            }

            // Return the number of rows actually used.
            scope.rowsUsed = scope.currentRow - scope.row;

            return null; // success

        case "array":

            if (scope.fixedType) {
                scope.error = "Type array can't be used as a fixed type.";
                return scope; // error
            }

            scope.value = [];
            scope.subScopes = [];

            scope.currentRow++;
            scope.lastRow = scope.row + scope.rowCount;
            scope.lastColumn = scope.column + scope.columnCount;

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
                name = GetColumnString(scope.startColumn);
                if (name == "") {
                    scope.currentRow++;
                } else {

                    subScope = {
                        parentScope: scope,
                        sheetName: scope.sheetName,
                        sheet: scope.sheet,
                        row: scope.currentRow,
                        column: scope.startColumn,
                        rowCount: scope.lastRow - scope.currentRow,
                        columnCount: scope.lastColumn - scope.startColumn
                    };

                    scope.subScopes.push(subScope);

                    scope.errorScope = LoadJSONFromSheet(sheets, subScope);
                    if (scope.errorScope) {
                        return scope.errorScope; // error
                    }

                    scope.value.push(subScope.value);

                    scope.currentRow += subScope.rowsUsed;

                }

            }

            // Return the number of rows actually used.
            scope.rowsUsed = scope.currentRow - scope.row;

            return null; // success

        case "table":

            if (scope.fixedType) {
                scope.error = "Type array can't be used as a fixed type.";
                return scope; // error
            }

            scope.value = [];
            scope.subScopes = [];

            scope.lastRow = scope.row + scope.rowCount;
            scope.lastColumn = scope.column + scope.columnCount;

            // Get the next indented row of headers.
            scope.currentRow++;

            // Make sure we are not at the end of the spreadsheet.
            if (scope.currentRow >= scope.lastRow) {
                scope.error = "Type table should be followed by a row of table headers.";
                return scope;
            }

            scope.rowValues = scope.sheet[scope.currentRow];

            var header;
            var headerColumn;

            // Make sure the next indented row of headers is not missing.
            scope.previousColumn = scope.currentColumn - (scope.alreadyIndented ? 1 : 0);
            for (headerColumn = 0; headerColumn <= scope.previousColumn; headerColumn++) {
                header = GetColumnString(headerColumn);
                if (header != "") {
                    scope.error = "Type table should be follow by an indented row of table headers, not an unindented row.";
                    return scope;
                }
            }

            // Make sure there are one or more indented headers.
            header = GetColumnString(headerColumn);

            if (header == "") {
                scope.error = "Type table should be follow by an indented row of table headers. Missing the first header.";
                return scope;
            }

            // Gather the headers, skipping columns with empty headers.
            var headers = [];
            for (; headerColumn < scope.lastColumn; headerColumn++) {
                header = GetColumnString(headerColumn);
                if (header == "") {
                    continue;
                }
                headers.push([header, headerColumn]);
            }

            // Parse the column headers into tokens associated with columns.
            var tokens = [];
            for (var headersIndex = 0, headersLength = headers.length; headersIndex < headersLength; headersIndex++) {

                var token = "";
                var headerInfo = headers[headersIndex];
                header = headerInfo[0];
                headerColumn = headerInfo[1];

                function finishToken()
                {
                    if (token == "") {
                        return;
                    }
                    tokens.push([token, headerColumn]);
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
                            tokens.push([ch, headerColumn]);
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

            tokens.push(['.', -1]);

            // Go to the next row and read in subsequent rows until the end of the spreadsheet or an unindented row.
            scope.currentRow++;

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

                var lastColumn = -1;
                var tokenIndex = 0;
                var error = null;
                var value = null;
                var valueStack = [];

                // Get the next tokenInfo, containing the token and the column in which it occurred.
                function NextTokenInfo()
                {
                    if (tokenIndex >= tokens.length) {
                        console.log("NextTokenInfo: Ran out of tokens!");
                        return ['.', -1];
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

                        switch (token) {

                            case '}':
                                return true;

                            case '{':
                            case '[':
                            case ']':
                            case '.':
                                error = "ParseObject: expected key of 'key type' or '}' instead of " + token;
                                return false;

                            default:

                                var key = token;
                                var typeTokenInfo = NextTokenInfo();
                                var typeToken = typeTokenInfo[0];
                                var typeColumn = typeTokenInfo[1];

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
                                        return false;

                                    default:
                                        var typeName = typeToken;
                                        
                                        subScope = {
                                            sheetName: scope.sheetName,
                                            sheet: scope.sheet,
                                            row: scope.currentRow,
                                            column: typeColumn,
                                            rowCount: 1,
                                            columnCount: 1,
                                            typeName: typeName
                                        };

                                        scope.subScopes.push(subScope);

                                        scope.errorScope = LoadJSONFromSheet(sheets, subScope);
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
                        var tokenColumn = tokenInfo[1];

                        switch (token) {

                            case ']':
                                return true;

                            case '}':
                            case '.':
                                error = "ParseArray: expected type or ']' instead of " + token;
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
                                    row: scope.currentRow,
                                    column: tokenColumn,
                                    rowCount: 1,
                                    columnCount: 1,
                                    typeName: typeName
                                };

                                scope.subScopes.push(subScope);

                                scope.errorScope = LoadJSONFromSheet(sheets, subScope);
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
                    return scope; // error
                }

                // Go to the next row.
                scope.currentRow++;

            }

            // Return the number of rows actually used.
            scope.rowsUsed = scope.currentRow - scope.row;

            return null; // success

        case "sheet":

            var sheetName = GetColumnString(scope.currentColumn + 1);
            if (sheetName == "") {
                scope.error = "Expected 'sheet sheetName'.";
                return scope;
            }

            scope.sheetScope = SheetToScope(sheets, sheetName);
            if (!scope.sheetScope) {
                scope.error = "Could not find sheet: " + sheetName;
                return scope;
            }

            scope.sheetScope.parentScope = scope;
            scope.subScopes = [scope.sheetScope];

            if (scope.sheetScope.error) {
                scope.errorScope = scope.sheetScope;
                return scope.errorScope; // error
            }

            scope.value = scope.sheetScope.value;
            return null; // success

        default:
            scope.error = "Unexpected typeName: " + scope.typeName;
            return scope; // error

    }

}
