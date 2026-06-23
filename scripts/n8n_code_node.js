// 1. Get the markdown text output from the AI Agent node
let markdownText = "";
try {
  markdownText = $input.first().json.output || "";
} catch (e) {
  markdownText = "";
}

// Clean up any escaped newlines if present
markdownText = markdownText.replace(/\\n/g, '\n');

// 2. Extra robust extraction for high-visibility summary badges
const levelMatch = markdownText.match(/(?:Rule Level|Severity Level|Severity|Wazuh Severity)(?:\*\*)?:\s*`?([0-9]+)/i);
const agentMatch = markdownText.match(/(?:Agent Name|Agent|Hostname|Target Host)(?:\*\*)?:\s*`?([a-zA-Z0-9_-]+)/i);
const ruleMatch = markdownText.match(/(?:Rule ID|Rule|ID)(Lif)?(?:\*\*)?:\s*#?`?([0-9]+)/i);
const descMatch = markdownText.match(/(?:Rule Description|Description)(?:\*\*)?:\s*`?"?([^"\n\r]+)"?/i);

const extractedSev = levelMatch ? levelMatch[1] : "10";
const extractedAgent = agentMatch ? agentMatch[1] : "wazuh-server";
const extractedRule = ruleMatch ? ruleMatch[2] : "5760";
const extractedDesc = descMatch ? descMatch[1] : "SSHD Brute Force Attempt";

// Define security color codes based on Wazuh severity levels
let severityColor = "#3b82f6"; // Blue (Low)
if (parseInt(extractedSev) >= 12) {
  severityColor = "#ef4444"; // Red (Critical)
} else if (parseInt(extractedSev) >= 7) {
  severityColor = "#f97316"; // Orange (High)
} else if (parseInt(extractedSev) >= 4) {
  severityColor = "#eab308"; // Yellow (Medium)
}

// 3. Convert Markdown syntax into styled HTML elements safely
function markdownToHtml(md) {
  let html = md;

  // Fix line breaks first to standardize lines
  html = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Headers
  html = html.replace(/^#### (.*)/gm, '<h4 style="color: #334155; font-family: \'Segoe UI\', Arial, sans-serif; margin-top: 24px; margin-bottom: 8px; font-size: 15px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">$1</h4>');
  html = html.replace(/^### (.*)/gm, '<h3 style="color: #1e293b; font-family: \'Segoe UI\', Arial, sans-serif; margin-top: 30px; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 18px; font-weight: 700; letter-spacing: -0.3px;">$1</h3>');

  // Bold Text Blocks (**text**)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong style="color: #0f172a; font-weight: 600;">$1</strong>');

  // Inline Code blocks (`code`)
  html = html.replace(/`([^`]+)`/g, '<code style="background-color: #f1f5f9; padding: 3px 6px; border-radius: 4px; border: 1px solid #e2e8f0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; color: #dc2626; font-size: 13px; font-weight: 500;">$1</code>');

  // Unordered Lists (- item or ■ item)
  html = html.replace(/^\s*[-■]\s(.*)/gm, '<li style="margin-left: 15px; margin-bottom: 6px; line-height: 1.6; color: #475569; list-style-type: square;">$1</li>');

  // Ordered Lists (1. item)
  html = html.replace(/^\s*([0-9]+)\.\s(.*)/gm, '<li style="margin-left: 15px; margin-bottom: 8px; line-height: 1.6; color: #475569; list-style-type: decimal;">$2</li>');

  // Convert lone newlines into HTML breaks
  html = html.replace(/\n/g, '<br>');

  return html;
}

// 4. Return variables to map inside the HTML template / Gmail Node
return {
  htmlReport: markdownToHtml(markdownText),
  severity: extractedSev,
  severityColor: severityColor,
  agent: extractedAgent,
  ruleId: extractedRule,
  description: extractedDesc,
  email_subject: `⚠️ SOC Incident Report: [Level ${extractedSev}] - ${extractedDesc} on ${extractedAgent}`
};