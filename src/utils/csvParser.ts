/**
 * Robust RFC-4180 compliant CSV parser.
 * Handles embedded commas, double quotes, and newlines correctly.
 */
export function parseCSVText(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const result: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped double quote ("")
        cell += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++; // Skip the '\n' in '\r\n'
      }
      row.push(cell);
      result.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  // Push remaining cells/rows
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    result.push(row);
  }

  if (result.length === 0) {
    return { headers: [], rows: [] };
  }

  // Find first non-empty row to use as headers
  let headerIndex = -1;
  for (let i = 0; i < result.length; i++) {
    if (result[i].some((val) => val.trim() !== "")) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = result[headerIndex].map((h) => h.trim());
  // Ensure we have unique non-empty header names
  const headers = rawHeaders.map((h, idx) => {
    if (!h) return `Column_${idx + 1}`;
    // Deduplicate headers
    let finalHeader = h;
    let count = 1;
    while (rawHeaders.slice(0, idx).includes(finalHeader)) {
      finalHeader = `${h}_${count}`;
      count++;
    }
    return finalHeader;
  });

  const rows: Record<string, string>[] = [];
  for (let i = headerIndex + 1; i < result.length; i++) {
    const rawRow = result[i];
    // Check if the row is entirely empty
    const isRowEmpty = rawRow.every((val) => val.trim() === "");
    if (isRowEmpty) {
      continue;
    }

    const rowObj: Record<string, string> = {};
    headers.forEach((header, colIdx) => {
      let val = rawRow[colIdx] !== undefined ? rawRow[colIdx] : "";
      // Trim values unless they are multiline or specific
      rowObj[header] = val.trim();
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

/**
 * Format bytes to a human-readable size
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Helper to generate a sample CRM CSV file string
 */
export function generateSampleCSVString(): string {
  return `created_at,name,email,country_code,mobile,company,city,state,country,lead_owner,status,notes,source,possession_time,description
2026-05-13 14:20:48,John Doe,john.doe@example.com,+91,9876543210,GrowEasy,Mumbai,Maharashtra,India,test@gmail.com,GOOD_LEAD_FOLLOW_UP,"Client is asking to reschedule demo",leads_on_demand,,
2026-05-13 14:25:30,Sarah Johnson,sarah.johnson@example.com,+91,9876543211,Tech Solutions,Bangalore,Karnataka,India,test@gmail.com,DID_NOT_CONNECT,"Person was busy, will try again next week",meridian_tower,,
2026-05-13 14:30:15,Rajesh Patel,rajesh.patel@example.com,+91,9876543212,Startup Inc,Delhi,Delhi,India,test@gmail.com,BAD_LEAD,Not interested in our services,eden_park,,
2026-05-13 14:35:22,Priya Singh,priya.singh@example.com,+91,9876543213,Enterprise Corp,Pune,Maharashtra,India,test@gmail.com,SALE_DONE,"Deal closed, onboarding in progress",sarjapur_plots,,
,Invalid Lead Row No Contact Info,,,,,,,,,,,,
2026-07-10 10:00:00,Multiple Emails & Phones,first@example.com;second@example.com,+1,1234567;9876543,Multi Corp,New York,NY,USA,test@gmail.com,GOOD_LEAD_FOLLOW_UP,Multiple contacts,leads_on_demand,Immediate,Testing multiple values extraction
`;
}
