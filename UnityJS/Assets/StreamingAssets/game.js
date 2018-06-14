/*
 * game.js
 * Don Hopkins, Ground Up Software.
 */


////////////////////////////////////////////////////////////////////////
// Error Handler


window.onerror = function(message, source, line, column, error) {
    console.log("!!!!!!!!!!!!!!!! WINDOW.ONERROR", "MESSAGE", message, "LINE", line, "COLUMN", column, "SOURCE", source);
};


////////////////////////////////////////////////////////////////////////
// Globals


globals.sheetURLs = {
    world: 'https://docs.google.com/spreadsheets/d/1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w/export?format=tsv&id=1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w&gid=0',
    texturePaths: 'https://docs.google.com/spreadsheets/d/1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w/export?format=tsv&id=1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w&gid=580619937',
    prefabMap: 'https://docs.google.com/spreadsheets/d/1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w/export?format=tsv&id=1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w&gid=1469835123',
    bowConfigs_outline: 'https://docs.google.com/spreadsheets/d/1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w/export?format=tsv&id=1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w&gid=650116669',
    bowConfigs_table: 'https://docs.google.com/spreadsheets/d/1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w/export?format=tsv&id=1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w&gid=233501381',
    twoDeeArray: 'https://docs.google.com/spreadsheets/d/1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w/export?format=tsv&id=1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w&gid=1423929352',
    threeDeeArray: 'https://docs.google.com/spreadsheets/d/1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w/export?format=tsv&id=1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w&gid=669397076',
    fourDeeArray: 'https://docs.google.com/spreadsheets/d/1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w/export?format=tsv&id=1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w&gid=894939244',
    vectorArrayDict: 'https://docs.google.com/spreadsheets/d/1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w/export?format=tsv&id=1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w&gid=325407406',
    test: 'https://docs.google.com/spreadsheets/u/0/d/1TxWvkOkeqij4AygDaKfcO4LdrLYSKkPrXOHlAOwEtRc/export?format=tsv&id=1TxWvkOkeqij4AygDaKfcO4LdrLYSKkPrXOHlAOwEtRc&gid=0'
};

globals.sheets = [];


////////////////////////////////////////////////////////////////////////


function CreateObjects()
{
    CreateInterface(true);
    CreatePieTracker();
    //CreateCanvas();
    LoadWorld();
}


function CreateInterface(createCamera)
{
    if (createCamera) {
        globals.camera = CreatePrefab({
            prefab: 'Prefabs/Camera',
            obj: {
                doNotDelete: true
            },
            config: {
                "transform/localPosition": {x: 0, y: 200, z: -200},
                "transform/localRotation": {pitch: 45}
            }
        });
    }

    globals.light = CreatePrefab({
        prefab: 'Prefabs/Light',
        obj: {
            doNotDelete: true
        }
    });

    globals.eventSystem = CreatePrefab({
        prefab: 'Prefabs/EventSystem',
        obj: {
            doNotDelete: true
        }
    });

    globals.overlay = CreatePrefab({
        prefab: 'Prefabs/TextOverlays',
        obj: {
            doNotDelete: true
        }
    });
}


function LoadWorld()
{
    var xhrs = {};

    for (var sheetName in globals.sheetURLs) {
        (function (sheetName) {

            var sheetURL = 
                globals.sheetURLs[sheetName];
            var url =
                'http://donhopkins.com/home/_p/miniProxy.php?' + 
                sheetURL +
                "&rand=" + 
                Math.random();

            var xhr = new XMLHttpRequest();
            xhrs[sheetName] = xhr;

            console.log("game.js: LoadWorld: sheetName: " + sheetName + " url: " + url);

            xhr.onload = function() {
                var text = xhr.responseText;

                var sheet = ParseSheet(text);
                globals.sheets[sheetName] = sheet;

                delete xhrs[sheetName];

                var sheetsLeft = Object.keys(xhrs).length;

                console.log("game.js: LoadWorld: onload: Loaded sheetName: " + sheetName + " sheetsLeft: " + sheetsLeft);

                if (sheetsLeft === 0) {
                    if (!globals.sheets['world']) {
                        console.log("game.js: LoadWorld: onload: Finished loading sheets, but world was not loaded!");
                    } else {
                        var scope = SheetToScope('world');
                        var error = scope.error;
                        var world = scope.value;
                        if (error) {
                            console.log("game.js: LoadWorld: onload: Error loading sheetName " + sheetName + " error: " + error);
                        } else if (!world) {
                            console.log("game.js: LoadWorld: onload: Loaded world but it was null.");
                        } else {
                            globals.world = world;
                            console.log("game.js: LoadWorld: onload: Loaded world:", world);
                            StartWorld(world);
                        }
                    }
                }
            };

            xhr.onerror = function(error) {
                console.log("game.js: LoadWorld: error 1 loading sheetName: " + sheetName + " url:", url, "xhr:", xhr, "REPLIED:", xhr.statusText, "error:", error);
            };

            xhr.onloadend = function(a) {
                if (xhr.status >= 400) {
                    console.log("game.js: LoadWorld: error 2 loading sheetName: " + sheetName + " url:", url, "xhr:", xhr, "REPLIED:", xhr.statusText);
                } else if (xhr.status === 0) {
                    console.log("game.js: LoadWorld: error 3 loading sheetName: " + sheetName + " url:", url, "xhr:", xhr, "REPLIED:", xhr.statusText);
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



function GetSheet(sheetName)
{
    var sheet = 
        globals.sheets[sheetName];
    return sheet;
}


function SheetToScope(sheetName)
{
    if (!sheetName || sheetName.length == 0) {
        return null;
    }

    var sheet = GetSheet(sheetName);

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
        LoadJSONFromSheet(scope);

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

function LoadJSONFromSheet(scope)
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

            var gridTypeName = GetColumnString(scope.valueColumn + 1);
            if (gridTypeName) {
                gridTypeName = ("" + gridTypeName).trim();
            }
            if (!gridTypeName) {
                scope.error = "Expected 'grid typeName columns rows'.";
                return scope; // error
            }

            var gridColumns = GetColumnString(scope.valueColumn + 2);
            if (gridColumns) {
                gridColumns = parseInt(gridColumns);
            }
            if (!gridColumns || (gridColumns < 1)) {
                scope.error = "Expected 'grid typeName columns rows', missing columns > 0.";
                return scope; // error
            }

            var gridRows = GetColumnString(scope.valueColumn + 3);
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

                    scope.errorScope = LoadJSONFromSheet(subScope);
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

                    scope.errorScope = LoadJSONFromSheet(subScope);
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

                    scope.errorScope = LoadJSONFromSheet(subScope);
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
                        var tokenColumn = tokenInfo[1];

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

                                        scope.errorScope = LoadJSONFromSheet(subScope);
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

                                scope.errorScope = LoadJSONFromSheet(subScope);
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

            scope.sheetScope = SheetToScope(sheetName);
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


function StartWorld(world)
{
    var hexes = world.prefabMap.hexes;
    var vegetation = world.prefabMap.vegetation;
    var rows = [];
    //var component = 'Tracker';
    var component = 'HexTile';

    world.rows = rows;

    var dx = world.tileColumns * world.tileDX * -1.0;
    var dy = world.tileRows * world.tileDY * -0.5;

    for (var y = 0; y < world.tileRows; y++) {
        var tileY =
            world.tileY + dy +
            (y * world.tileDY);
        var row = [];
        rows.push(row);

        for (var x = 0; x < world.tileColumns; x++) {

            var tileX =
                world.tileX + dx +
                ((y & 1) ? world.tileDX : 0) +
                (x * world.tileDX * 2);

            var tileZ =
                world.tileHeight[y][x];

            var prefabName =
                hexes.dir + 
                world.tileName[y][x];

            var textureName = 
                world.tileTexture[y][x];

            var updateMaterialParams = [{
                tiling: world.materialTiling,
                offset: world.materialOffset,
                texture_MainTex: textureName + "/" + textureName + "_COLOR",
                texture_BumpMap: textureName + "/" + textureName + "_NORM"
            }];

            var prefabs = []

            if (world.makeTiles) {

                var tilePrefab =
                    CreatePrefab({
                        prefab: prefabName, 
                        component: component, // component
                        obj: { // obj
                            x: x,
                            y: y,
                            tileX: tileX,
                            tileY: tileY
                        }, 
                        config: { // config 
                            "transform/localPosition": {x: tileX, y: tileZ, z: tileY},
                            "component:MeshRenderer/materials/index:0/method:UpdateMaterial": updateMaterialParams,
                            "component:MeshRenderer/materials/index:1/method:UpdateMaterial": updateMaterialParams,
                            "component:MeshRenderer/materials/index:2/method:UpdateMaterial": updateMaterialParams
                        }, 
                        interests: { // interests
                            MouseDown: {
                                query: {
                                    position: "transform/localPosition"
                                },
                                handler: function(obj, result) {
                                    console.log("MouseDown on Hex", obj.x, obj.y, result.position, obj.prefabName);
                                }
                            }
                        }
                    });

                prefabs.push(tilePrefab);

                if (world.makeVegetation) {

                    var vegPrefabName =
                        vegetation.dir +
                        world.tileVegetation[y][x];

                    var vegPrefab =
                        CreatePrefab({
                            prefab: vegPrefabName, 
                            //component: component, // component
                            obj: { // obj
                                x: x,
                                y: y,
                                tileX: tileX,
                                tileY: tileY
                            }, 
                            config: { // config 
                                "transform/localPosition": {x: tileX, y: tileZ, z: tileY}
                            }, 
                            interests: { // interests
                                MouseDown: {
                                    query: {
                                        position: "transform/localPosition"
                                    },
                                    handler: function(obj, result) {
                                        console.log("MouseDown on Veg", obj.x, obj.y, result.position, obj.prefabName);
                                    }
                                }
                            },
                            postEvents: [
                                {
                                    event: 'SetParent',
                                    data: {
                                        'path': 'object:' + tilePrefab.id
                                    }
                                }
                            ]

                        });

                    prefabs.push(vegPrefab);

                }

            }

            row.push(prefabs);

        }

    }

    var fromTile = world.rows[0][0][0];
    var toTile = world.rows[world.tileRows - 1][world.tileColumns - 1][0];
    var bowCount = world.bowConfigs.length;

    //console.log("bowConfigs", JSON.stringify(world.bowConfigs));

    world.rainbow =
        CreatePrefab({
            prefab: 'Prefabs/Rainbow',
            config: {
                'fromTransform!': 'object:' + fromTile.id + '/transform',
                'toTransform!': 'object:' + toTile.id + '/transform',
                fromWidth: bowCount * 4.0,
                toWidth: bowCount * 4.0
            }
        });

    world.bows = [];

    for (var bowIndex = 0;
         bowIndex < bowCount;
         bowIndex++) {

        var bowConfig = 
            world.bowConfigs[bowIndex];

        //console.log("bowConfig", JSON.stringify(bowConfig));

        var bow =
            CreatePrefab({
                prefab: 'Prefabs/Bow',
                config: bowConfig,
                postEvents: [
                    {
                        event: 'SetParent',
                        data: {
                            'path': 'object:' + world.rainbow.id
                        }
                    }
                ]});

        world.bows.push(bow);

    }

}


////////////////////////////////////////////////////////////////////////

/*

{ bowStart number
bowEnd number
bowHeight number
startWidth number
endWidth number
widthMultiplier number
fromLocalOffset { x number }
toLocalOffset { x number }
lineRenderer/startColor { r number
g number
b number }
lineRenderer/endColor { r number
g number
b number }
lineRenderer/alignment string
lineRenderer/widthCurve { animationCurveType string
keys [ { time number
value number }
{ time number
value number }
{ time number
value number }
{ time number
value number }
{ time number
value number } ] }
lineRenderer/colorGradient { gradientMode string
alphaKeys [ { time number
alpha number }
{ time number
alpha number }
{ time number
alpha number }
{ time number
alpha number }
{ time number
alpha number } ]
colorKeys [ { time number
color { r number
g number
b number } }
{ time number
color { r number
g number
b number } }
{ time number
color { r number
g number
b number } }
{ time number
color { r number
g number
b number } }
{ time number
color { r number
g number
b number } } ] } }

*/

