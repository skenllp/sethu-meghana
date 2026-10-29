/**
 * SETHU & MEGHANA WEDDING - WISHES & GUESTBOOK API
 * 
 * ----------------------------------------------------------------------------
 * SETUP INSTRUCTIONS:
 * ----------------------------------------------------------------------------
 * 1. Open Google Sheets (https://sheets.new) and create a sheet.
 *    Name it e.g. "Sethu & Meghana Wedding Wishes"
 * 
 * 2. In Row 1 of your sheet, add these column headers:
 *    - A1: Timestamp
 *    - B1: Name
 *    - C1: Message
 * 
 * 3. In the Google Sheets top menu, click:
 *    Extensions > Apps Script
 * 
 * 4. Delete any code inside the editor, and paste this entire file content.
 * 
 * 5. Click the Save icon (💾).
 * 
 * 6. Click the blue "Deploy" button (top right) > "New deployment"
 * 
 * 7. In the modal that opens:
 *    - Click the gear icon next to "Select type" and choose "Web app"
 *    - Description: "Wedding Wishes API"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (CRITICAL: Select "Anyone" so guests can post without logging in)
 * 
 * 8. Click "Deploy".
 *    (Google may ask for authorization: click "Authorize access", choose your account,
 *     click "Advanced" -> "Go to ... (unsafe)", and click "Allow").
 * 
 * 9. Copy the "Web app URL" (it looks like: https://script.google.com/macros/s/.../exec).
 * 
 * 10. Open index.html in your project and update line:
 *     var WISHES_SHEET_URL = 'PASTE_YOUR_WEB_APP_URL_HERE';
 * ----------------------------------------------------------------------------
 */

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Optional fallback: handle GET-based wish submission
    if (e && e.parameter && e.parameter.action === "add") {
      var name = e.parameter.name || "Well-wisher";
      var message = e.parameter.message || "";
      var date = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd MMM yyyy, hh:mm a");
      sheet.appendRow([date, name, message]);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        date: date,
        name: name,
        message: message
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Default GET: Fetch all wishes
    var rows = sheet.getDataRange().getValues();
    var wishes = [];
    
    // Row 0 is header (Timestamp, Name, Message), so start from row 1
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      if (row[1] || row[2]) {
        wishes.push({
          date: row[0] ? formatTimestamp(row[0]) : "",
          name: row[1] ? row[1].toString() : "Well-wisher",
          message: row[2] ? row[2].toString() : ""
        });
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      wishes: wishes
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var name = "Well-wisher";
    var message = "";
    
    if (e && e.postData && e.postData.contents) {
      try {
        var parsed = JSON.parse(e.postData.contents);
        name = parsed.name || name;
        message = parsed.message || message;
      } catch (jsonErr) {
        if (e.parameter) {
          name = e.parameter.name || name;
          message = e.parameter.message || message;
        }
      }
    } else if (e && e.parameter) {
      name = e.parameter.name || name;
      message = e.parameter.message || message;
    }
    
    var date = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd MMM yyyy, hh:mm a");
    sheet.appendRow([date, name, message]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      date: date,
      name: name,
      message: message
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function formatTimestamp(val) {
  if (val instanceof Date) {
    return Utilities.formatDate(val, "Asia/Kolkata", "dd MMM yyyy, hh:mm a");
  }
  return val.toString();
}

