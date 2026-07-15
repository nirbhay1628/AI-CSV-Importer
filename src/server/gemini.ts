import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please add it via Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export interface CRMRecord {
  created_at?: string;
  name?: string;
  email?: string;
  country_code?: string;
  mobile_without_country_code?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  lead_owner?: string;
  crm_status?: "GOOD_LEAD_FOLLOW_UP" | "DID_NOT_CONNECT" | "BAD_LEAD" | "SALE_DONE" | "";
  crm_note?: string;
  data_source?: "leads_on_demand" | "meridian_tower" | "eden_park" | "varah_swamy" | "sarjapur_plots" | "";
  possession_time?: string;
  description?: string;
}

export interface ExtractedResult {
  status: "imported" | "skipped";
  skipReason?: string;
  data: CRMRecord | null;
  originalRow: Record<string, string>;
}

/**
 * Send a batch of CSV rows to Gemini to map them intelligently to the CRM schema.
 */
export async function processCSVBatch(
  rows: Record<string, string>[]
): Promise<ExtractedResult[]> {
  const ai = getGeminiClient();

  const systemInstruction = `You are a highly accurate CRM data extraction AI. Your task is to map raw data from arbitrary CSV columns to the GrowEasy CRM schema.

Analyze all columns in each row to intelligently map them to the CRM fields. Follow these rules strictly:

1. **Intelligent Column Mapping**:
   - **Name**: Map from "Name", "Lead Name", "Full Name", "Contact Name", "Client", etc. If there are separate "First Name" and "Last Name" columns, concatenate them (e.g. "John" and "Doe" -> "John Doe").
   - **Email**: Map from "Email", "E-mail", "Email Address", "Mail", "Gmail", "Contact Email", etc.
   - **Mobile / Phone**: Map from "Phone", "Phone Number", "Mobile", "Contact", "Contact Number", "Cell", "Telephone", "Mobile Number", "WhatsApp", etc.
   - **Company**: Map from "Company", "Company Name", "Firm", "Organization", "Business", etc.
   - **City**: Map from "City", "Town", "Location", etc.
   - **State**: Map from "State", "Region", "Province", etc.
   - **Country**: Map from "Country", "Nation", etc.
   - **Lead Owner**: Map from "Lead Owner", "Owner", "Sales Rep", "Assigned To", "Agent", etc.
   - **Possession Time**: Map from "Possession Time", "Property Possession", "Move-in Time", etc.
   - **Description**: Map from "Description", "Details", "About", "Additional Info", etc.

2. **Phone & Country Code Extraction**:
   - If a phone number is provided, clean any dashes, spaces, parentheses, or non-numeric formatting (except a leading '+' for country code).
   - If the raw phone number begins with a country code (e.g., "+91", "+1", "+44"), or if there's a separate country code column:
     - Extract the country calling code prefix (e.g., "+91") into 'country_code'.
     - Extract the remaining digits into 'mobile_without_country_code'.
   - If no country code is found, set 'country_code' to "" and set 'mobile_without_country_code' to the full number.

3. **Multiple Emails or Mobile Numbers**:
   - If multiple email addresses are found (either in one column or multiple columns, e.g. separated by comma or semicolon), use the first email for 'email' and append the remaining emails into 'crm_note'.
   - If multiple mobile numbers are found, use the first mobile for 'mobile_without_country_code' and append the remaining numbers into 'crm_note'.

4. **Allowed CRM Status Values** (for 'crm_status'):
   - Use ONLY one of these exact values: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE.
   - Map semantic equivalents intelligently:
     - "Good Lead", "Follow up", "Interested", "Good", "FollowUp", "Callback" -> GOOD_LEAD_FOLLOW_UP
     - "Did Not Connect", "Busy", "Ringing", "Unreachable", "No Answer", "Not Answered" -> DID_NOT_CONNECT
     - "Bad Lead", "Not Interested", "Spam", "Invalid", "Junk", "Wrong Number" -> BAD_LEAD
     - "Sale Done", "Closed", "Converted", "Deal Done", "Closed Won", "Done" -> SALE_DONE
   - If the input status doesn't match confidently, leave it empty.

5. **Allowed Data Source Values** (for 'data_source'):
   - Use ONLY one of these exact values: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots.
   - Map raw data source columns or names:
     - "Leads on demand", "Leads", "On Demand" -> leads_on_demand
     - "Meridian Tower", "Meridian" -> meridian_tower
     - "Eden Park", "Eden" -> eden_park
     - "Varah Swamy", "Varah" -> varah_swamy
     - "Sarjapur Plots", "Sarjapur" -> sarjapur_plots
   - If none match confidently, leave it blank ("").

6. **Date Format** (for 'created_at'):
   - Map from "Created At", "Date Created", "Timestamp", "Date", etc.
   - Ensure the date is formatted as "YYYY-MM-DD HH:mm:ss" so that "new Date(created_at)" can parse it in JavaScript.

7. **CRM Notes** ('crm_note'):
   - Use 'crm_note' to store remarks, follow-up notes, additional comments, extra phone numbers, extra email addresses, or any other useful details that do not fit into other specific fields.

8. **Skip Invalid Records**:
   - If a record contains NEITHER a valid email address nor a valid mobile phone number, the status MUST be 'skipped' with a skipReason of "Contains neither email nor mobile number".

9. **Mapping Alignment**:
   - Return exactly one output object corresponding to each input row, in the exact same index order.`;

  const prompt = `Map these raw CSV rows to our CRM structure. Maintain the array order and return the result as JSON.

Input Rows:
${JSON.stringify(rows, null, 2)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            results: {
              type: Type.ARRAY,
              description: "Array of mapped records matching the exact order of input rows.",
              items: {
                type: Type.OBJECT,
                required: ["status"],
                properties: {
                  status: {
                    type: Type.STRING,
                    description: "Must be 'imported' or 'skipped'. If it lacks BOTH an email and mobile phone number, it MUST be 'skipped'.",
                  },
                  skipReason: {
                    type: Type.STRING,
                    description: "Reason for skipping the row. E.g. 'Contains neither email nor mobile number'. Required if status is 'skipped'.",
                  },
                  data: {
                    type: Type.OBJECT,
                    description: "CRM Fields. If skipped, return null or leave empty.",
                    properties: {
                      created_at: {
                        type: Type.STRING,
                        description: "Lead creation date (format: YYYY-MM-DD HH:mm:ss). If absent, use the current timestamp.",
                      },
                      name: { type: Type.STRING, description: "Lead name." },
                      email: { type: Type.STRING, description: "Primary email. Use first if multiple exist." },
                      country_code: { type: Type.STRING, description: "Country calling code (e.g. '+91', '+1')." },
                      mobile_without_country_code: { type: Type.STRING, description: "Mobile number without country code." },
                      company: { type: Type.STRING, description: "Company name." },
                      city: { type: Type.STRING, description: "City name." },
                      state: { type: Type.STRING, description: "State name." },
                      country: { type: Type.STRING, description: "Country name." },
                      lead_owner: { type: Type.STRING, description: "Lead owner." },
                      crm_status: {
                        type: Type.STRING,
                        description: "Must be exactly: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE, or empty string.",
                      },
                      crm_note: {
                        type: Type.STRING,
                        description: "Remarks, follow-up notes, additional phone numbers, additional email addresses, or any other useful info.",
                      },
                      data_source: {
                        type: Type.STRING,
                        description: "Must be exactly: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots, or empty string.",
                      },
                      possession_time: { type: Type.STRING, description: "Property possession time." },
                      description: { type: Type.STRING, description: "Additional description." },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No text response returned from Gemini.");
    }

    const parsed = JSON.parse(text);
    console.log("RAW GEMINI RESPONSE PATH:", JSON.stringify(parsed, null, 2));
    if (!parsed || !Array.isArray(parsed.results)) {
      throw new Error("Invalid output format returned from Gemini.");
    }

    // Stitch the results with original rows
    return parsed.results.map((res: any, idx: number) => {
      // Local validation double check (e.g. if the model missed skipping but record has neither email nor mobile)
      const data = res.data || {};
      const hasEmail = typeof data.email === "string" && data.email.trim().length > 0;
      const hasMobile = typeof data.mobile_without_country_code === "string" && data.mobile_without_country_code.trim().length > 0;

      let finalStatus = res.status;
      let finalReason = res.skipReason || "";

      if (!hasEmail && !hasMobile) {
        finalStatus = "skipped";
        finalReason = "Contains neither email nor mobile number";
      }

      return {
        status: finalStatus,
        skipReason: finalReason,
        data: finalStatus === "skipped" ? null : {
          created_at: data.created_at || new Date().toISOString().replace('T', ' ').substring(0, 19),
          name: data.name || "",
          email: data.email || "",
          country_code: data.country_code || "",
          mobile_without_country_code: data.mobile_without_country_code || "",
          company: data.company || "",
          city: data.city || "",
          state: data.state || "",
          country: data.country || "",
          lead_owner: data.lead_owner || "",
          crm_status: data.crm_status || "",
          crm_note: data.crm_note || "",
          data_source: data.data_source || "",
          possession_time: data.possession_time || "",
          description: data.description || "",
        },
        originalRow: rows[idx] || {},
      };
    });
  } catch (error) {
    console.error("Gemini batch processing error:", error);
    // Fallback if Gemini fails entirely or returned bad json: return all rows as skipped/failed
    return rows.map((row) => ({
      status: "skipped",
      skipReason: error instanceof Error ? error.message : "Internal mapping error",
      data: null,
      originalRow: row,
    }));
  }
}
