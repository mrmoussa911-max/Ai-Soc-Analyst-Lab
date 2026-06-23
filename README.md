🤖 Project Autonomous-SOC-Analyst: Wazuh ➔ n8n ➔ Mistral AI ➔ VirusTotal Security Pipeline

An enterprise-grade, event-driven AI Security Operations Center (SOC) pipeline. This system intercepts high-severity security telemetry from Wazuh SIEM, routes it through a custom n8n orchestration workflow, performs automated context-aware threat lookup via the VirusTotal API, triages the risk using Mistral AI (LLM), and dispatches dynamic, beautifully designed HTML triage dispatches natively to the SOC inbox.

🏗️ Architecture Design & Telemetry Flow

+------------------+         +-----------------------+         +------------------------+
|  Target Systems  |         |  Wazuh Security SIEM  |         |      n8n Webhook       |
|  (Kali VM, etc.) | ------> |   (Manager Daemon)    | ------> |    (Production Path)   |
|   SSHD Service   |  Syslog | Decodes logs / Alerts |  HTTPS  | /webhook/<workflow_id> |
+------------------+         +-----------------------+         +------------------------+
                                                                            |
                                                                            v
+------------------+         +-----------------------+         +------------------------+
|   HTML Email     |         |      Mistral AI       |         |   VirusTotal Lookup    |
| Security Report  | <------ |      (AI Agent)       | <------ | (Conditional on Public |
|    (Inbox)       |  Gmail  | Reasoning & Context   |   API   |   Source IP Addresses) |
+------------------+         +-----------------------+         +------------------------+


Attack Simulation: An attacker targets an SSH endpoint using a network brute-force tool (e.g., THC-Hydra) or via local spoofing.

SIEM Detection: Wazuh parses syslog entries (/var/log/secure or /var/log/auth.log) using decoders, triggering high-severity alerts like Rule 5763 (Level 10).

Active Integration: The Wazuh Manager's integration daemon (wazuh-integratord) executes a custom Python script to securely pass the JSON payload to n8n over local network boundaries.

Autonomous Triage Orchestration (n8n):

Private IPs (Bypass Node): If the attacker's source IP is internal (e.g., RFC 1918), lookup queries are safely bypassed to prevent telemetry leakage.

Public IPs (Threat Intel Node): Public IPs are enriched on the fly using the VirusTotal API.

Cognitive Agent Processing: The enriched context is fed into a Mistral LLM configured with highly strict, security-focused system guidelines.

Data Extraction & Generation: A JavaScript-based parsing node extracts key elements (Wazuh Severity, Target Host, Rule ID, and Rule Description) and injects them into an executive HTML card email template sent via Gmail.

🛠️ Setup & Configuration

1. Wazuh Server Integration Config (/var/ossec/etc/ossec.conf)

The background integration daemon is configured on the Wazuh Manager to automatically monitor for Rule Alerts at or above Level 5:

<integration>
  <name>custom-n8n</name>
  <hook_url>http://<N8N_SERVER_IP>:5678/webhook/df3fb296-155d-478e-96f3-1be253915ab9</hook_url>
  <level>5</level>
  <alert_format>json</alert_format>
</integration>


Make sure to change <N8N_SERVER_IP> to your n8n server's private network IP and verify port 5678 is open in your local firewall.

2. Custom Wazuh Execution Script

Ensure your script /var/ossec/integrations/custom-n8n is owned by root:wazuh with permissions set to 750 so that the integration daemon can execute it securely:

sudo chown root:wazuh /var/ossec/integrations/custom-n8n
sudo chmod 750 /var/ossec/integrations/custom-n8n
sudo systemctl restart wazuh-manager


🤖 n8n AI Agent System Prompts

The core reasoning engine of this repository utilizes a structured LLM system instruction layout. This enforces zero hallucinations, bans raw LaTeX syntax formatting from the email layout, and ensures the AI utilizes live, real-time threat parameters.

🛡️ Triage Report Highlights (Production Dispatches)

Case A: Internal Attack (Bypassed Lookup)

When an attack originates internally (e.g., from 192.168.100.35):

AI Action: The system automatically identifies it as an RFC 1918 private IP.

Verdict: Flagged as Malicious/Suspicious internal action, recommending immediate host isolation and local auditing while skipping API lookups.

Case B: Public Simulated Attack (VirusTotal Enrichment)

When simulating an attack from a public spoofed IP (e.g., 203.0.113.50):

AI Action: The system executes the virustotal_lookup tool.

Verdict: Highlights the exact scanning engine metrics (e.g., 1/91 engine detections) and correctly warns of the reserved TEST-NET-3 IP space allocations.

📊 Key Takeaways & Learned Skills

Threat Intelligence Lifecycle: Hand-built end-to-end telemetry pipelines from raw syslog collection to security operations center execution.

Automation Engineering (SOAR): Bypassed the rigid constraints of traditional SIEM alert rules using flexible API orchestration in n8n.

Operational AI (LLMOps): Programmed robust structured data extraction regex models inside JavaScript nodes to map dynamic LLM output seamlessly into professional HTML email newsletters.