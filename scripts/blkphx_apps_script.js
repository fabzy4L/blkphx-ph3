// ============================================================
// BLK PHX LABS — PH3 Training Log
// Apps Script Web App — paste this into Tools > Script editor
// Then: Deploy > New deployment > Web app > Anyone > Deploy
// Copy the Web App URL into the tracker app Settings
// ============================================================

const SHEET_NAME_SESSIONS = "Sessions";
const SHEET_NAME_LIFTS    = "Lifts";
const SHEET_NAME_STATS    = "Stats";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.type === "session") {
      writeSession(ss, data.session);
    } else if (data.type === "stats") {
      writeStats(ss, data.stats);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === "getSessions") {
    const sheet = getOrCreateSheet(ss, SHEET_NAME_SESSIONS);
    const data = sheet.getDataRange().getValues();
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, rows: data }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ success: true, status: "BLK PHX LABS API online" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function writeSession(ss, session) {
  // ---- SESSIONS SHEET ----
  const sessSheet = getOrCreateSheet(ss, SHEET_NAME_SESSIONS);
  if (sessSheet.getLastRow() === 0) {
    sessSheet.appendRow([
      "ID", "Date", "Type", "Bodyweight (lb)", "BF%", "Energy",
      "Run Distance (mi)", "Run Time (min)", "Run Pace (min/mi)",
      "PH3 Day", "Block", "Week", "Notes", "Squat 1RM Est.", "Bench 1RM Est.", "Deadlift 1RM Est.", "Total"
    ]);
    // Format header
    sessSheet.getRange(1, 1, 1, 17).setFontWeight("bold").setBackground("#1a1a2e").setFontColor("#e8ff47");
  }

  const pace = (session.runDist && session.runTime)
    ? Math.round((session.runTime / session.runDist) * 100) / 100
    : "";

  sessSheet.appendRow([
    session.id || Date.now(),
    session.date,
    session.type || "",
    session.bw || "",
    session.bf || "",
    session.energy || "",
    session.runDist || "",
    session.runTime || "",
    pace,
    session.programDay || "",
    session.block || "",
    session.week || "",
    session.notes || "",
    session.squat1rm || "",
    session.bench1rm || "",
    session.deadlift1rm || "",
    session.total || ""
  ]);

  // ---- LIFTS SHEET ----
  const liftSheet = getOrCreateSheet(ss, SHEET_NAME_LIFTS);
  if (liftSheet.getLastRow() === 0) {
    liftSheet.appendRow([
      "Session ID", "Date", "Exercise", "Type", "Set", "Weight (lb)", "Reps", "RIR", "Est. 1RM"
    ]);
    liftSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#1a1a2e").setFontColor("#00d4ff");
  }

  (session.lifts || []).forEach(lift => {
    (lift.sets || []).forEach((set, idx) => {
      liftSheet.appendRow([
        session.id,
        session.date,
        lift.name,
        lift.type || "",
        idx + 1,
        set.weight || "",
        set.reps || "",
        set.rir !== null && set.rir !== undefined ? set.rir : "",
        idx === 0 ? (lift.estimated1rm || "") : ""
      ]);
    });
  });
}

function writeStats(ss, stats) {
  const statsSheet = getOrCreateSheet(ss, SHEET_NAME_STATS);
  if (statsSheet.getLastRow() === 0) {
    statsSheet.appendRow(["Timestamp", "Squat 1RM", "Bench 1RM", "Deadlift 1RM", "Total", "Bodyweight", "Wilks", "DL/BW", "SQ/BW", "BN/BW"]);
    statsSheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#1a1a2e").setFontColor("#f5a623");
  }
  statsSheet.appendRow([
    new Date().toISOString(),
    stats.sq, stats.bn, stats.dl,
    stats.total,
    stats.bw,
    stats.wilks || "",
    stats.dl && stats.bw ? Math.round((stats.dl / stats.bw) * 100) / 100 : "",
    stats.sq && stats.bw ? Math.round((stats.sq / stats.bw) * 100) / 100 : "",
    stats.bn && stats.bw ? Math.round((stats.bn / stats.bw) * 100) / 100 : ""
  ]);
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}
