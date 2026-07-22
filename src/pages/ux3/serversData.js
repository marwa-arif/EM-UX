// Synthetic demo data — illustrative server/vulnerability figures for UI development.
// Not tied to any real client engagement, asset, or individual.

// ── Open Vulnerabilities Trend (All Servers) ────────────────────────
export const ALL_SERVERS_TREND = {
  categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  rows: [
    { name: 'Jan', Critical: 2824,  High: 30249,  Medium: 75433 },
    { name: 'Feb', Critical: 8533,  High: 148012, Medium: 77974 },
    { name: 'Mar', Critical: 7945,  High: 146403, Medium: 68251 },
    { name: 'Apr', Critical: 8233,  High: 110682, Medium: 52918 },
    { name: 'May', Critical: 4577,  High: 101362, Medium: 47372 },
    { name: 'Jun', Critical: 3390,  High: 92402,  Medium: 36822 },
  ],
};

// ── Crown Jewels Servers ─────────────────────────────────────────────
export const CJ_HEADER = { windows: 473, linux: 29, asOf: '6 June 2026' };

export const CJ_BASELINE_TABLE = {
  title: 'March Baseline',
  columns: [
    { key: 'hod', label: 'HOD' },
    { key: 'sysType', label: 'System Type' },
    { key: 'assetCount', label: 'Asset Count', align: 'right' },
    { key: 'critical', label: 'Critical', align: 'right', sev: 'critical' },
    { key: 'high', label: 'High', align: 'right', sev: 'high' },
    { key: 'medium', label: 'Medium', align: 'right', sev: 'medium' },
    { key: 'total', label: 'Total', align: 'right' },
  ],
  rows: [
    { hod: 'J. MERCER', sysType: 'Domain Controller, Voice Servers', assetCount: 415, critical: 138, high: 1742, medium: 1263, total: 3143 },
    { hod: 'A. HARRISON', sysType: 'Application, Database', assetCount: 151, critical: 116, high: 963, medium: 967, total: 2046 },
    { hod: 'D. WHITFIELD', sysType: 'PIM, Vault', assetCount: 11, critical: 10, high: 51, medium: 34, total: 95 },
    { hod: 'P. ASHFORD', sysType: 'Application', assetCount: 1, critical: 0, high: 74, medium: 11, total: 85 },
    { hod: 'T. WHITMORE', sysType: 'Domain Controller', assetCount: 8, critical: 0, high: 24, medium: 13, total: 37 },
    { hod: 'S. PEMBERTON', sysType: 'Application', assetCount: 5, critical: 0, high: 8, medium: 6, total: 14 },
    { hod: 'Grand Total', sysType: '', assetCount: 591, critical: 264, high: 2862, medium: 2294, total: 5420, _total: true },
  ],
};

export const CJ_CURRENT_TABLE = {
  title: 'Current Status (March–June Vulnerabilities)',
  columns: CJ_BASELINE_TABLE.columns,
  rows: [
    { hod: 'J. MERCER', sysType: 'Domain controller, Voice servers', assetCount: 346, critical: 476, high: 18141, medium: 5377, total: 23994 },
    { hod: 'A. HARRISON', sysType: 'Application, Database', assetCount: 142, critical: 141, high: 4079, medium: 1330, total: 5550 },
    { hod: 'T. WHITMORE', sysType: 'APAC — Domain controller', assetCount: 6, critical: 40, high: 860, medium: 430, total: 1330 },
    { hod: 'K. SHELDON', sysType: 'Application', assetCount: 2, critical: 8, high: 176, medium: 107, total: 291 },
    { hod: 'D. WHITFIELD', sysType: 'PIM Vault', assetCount: 6, critical: 10, high: 201, medium: 49, total: 260 },
    { hod: 'Grand Total', sysType: '', assetCount: 502, critical: 675, high: 23457, medium: 7293, total: 31425, _total: true },
  ],
};

export const CJ_WEEKLY_TREND = {
  rows: [
    { name: 'Week 2-Mar', Critical: 1818, High: 32329, Medium: 14717 },
    { name: 'Week 3-Mar', Critical: 1617, High: 22068, Medium: 12366 },
    { name: 'Week 4-Mar', Critical: 1334, High: 16258, Medium: 10681 },
    { name: 'Week 1-Apr', Critical: 1216, High: 14362, Medium: 10450 },
    { name: 'Week 2-Apr', Critical: 872,  High: 9539,  Medium: 7775  },
    { name: 'Week 3-Apr', Critical: 612,  High: 5954,  Medium: 4523  },
    { name: 'Week 4-Apr', Critical: 489,  High: 4415,  Medium: 3475  },
    { name: 'Week 1-May', Critical: 313,  High: 3868,  Medium: 3141  },
    { name: 'Week 2-May', Critical: 306,  High: 3571,  Medium: 2917  },
    { name: 'Week 3-May', Critical: 300,  High: 3395,  Medium: 2794  },
    { name: 'Week 4-May', Critical: 290,  High: 3103,  Medium: 2625  },
    { name: 'Week 1-Jun', Critical: 264,  High: 2862,  Medium: 2294  },
  ],
};

export const CJ_NOTES = [
  'Digitization team has fixed EOL Office suite for 8 of 12 servers. 4 servers are in progress.',
  'Voice team — EOL telephony dependency, timeline awaited (~2k).',
  'CJ status 29th Apr — 85K open vulnerabilities reduced to 31.5K currently.',
  'Servers — 591, no Critical/High/Medium vuln or scan error — 57, Decommissioned — 32.',
];

// ── Server Inventory and Vulnerabilities Details ────────────────────
export const INVENTORY_TABLE = {
  columns: [
    { key: 'serverType', label: 'Server Type' },
    { key: 'totalAssets', label: 'Total Assets', align: 'right' },
    { key: 'reachable', label: 'Reachable', align: 'right' },
    { key: 'nonReachable', label: 'Non-Reachable', align: 'right' },
    { key: 'critical', label: 'Critical', align: 'right', sev: 'critical' },
    { key: 'high', label: 'High', align: 'right', sev: 'high' },
    { key: 'medium', label: 'Medium', align: 'right', sev: 'medium' },
    { key: 'totalVulns', label: 'Total Vulns', align: 'right' },
  ],
  rows: [
    { serverType: 'Windows', totalAssets: 1139, reachable: 1081, nonReachable: 58, critical: 2778, high: 84367, medium: 30705, totalVulns: 117850 },
    { serverType: 'Linux', totalAssets: 484, reachable: 317, nonReachable: 167, critical: 612, high: 8035, medium: 6117, totalVulns: 14764 },
    { serverType: 'Total', totalAssets: 1623, reachable: 1275, nonReachable: 348, critical: 3390, high: 92402, medium: 36822, totalVulns: 132614, _total: true },
  ],
};

export const INVENTORY_NOTES = {
  windows: [
    'Continuously sharing non-reachability reminders with stakeholders.',
    'Servers with no Critical/High/Medium vulnerability, a scanning issue, or a corrupted agent — 128.',
  ],
  linux: [
    'Continuously sharing non-reachability reminders with stakeholders and rectifying the Linux inventory.',
    'Approx. 119 Linux servers are EOL/EOS.',
  ],
};

// ── Windows Servers ───────────────────────────────────────────────
export const WIN_AGEING_TABLE = {
  columns: [
    { key: 'ageing', label: 'Ageing' },
    { key: 'critical', label: 'Critical', align: 'right', sev: 'critical' },
    { key: 'high', label: 'High', align: 'right', sev: 'high' },
    { key: 'medium', label: 'Medium', align: 'right', sev: 'medium' },
  ],
  rows: [
    { ageing: '>90 Days', critical: 644, high: 25397, medium: 8870 },
    { ageing: '61-90 Days', critical: 68, high: 3203, medium: 1058 },
    { ageing: '31-60 Days', critical: 565, high: 11846, medium: 5259 },
    { ageing: '<30 Days', critical: 1501, high: 43921, medium: 15518 },
  ],
};

export const WIN_HOD_TABLE = {
  columns: [
    { key: 'hod', label: 'Head Of Department' },
    { key: 'assetCount', label: 'Asset Count', align: 'right' },
    { key: 'critical', label: 'Critical', align: 'right', sev: 'critical' },
    { key: 'high', label: 'High', align: 'right', sev: 'high' },
    { key: 'medium', label: 'Medium', align: 'right', sev: 'medium' },
    { key: 'total', label: 'Total', align: 'right' },
  ],
  rows: [
    { hod: 'J. MERCER', assetCount: 757, critical: 2070, high: 65566, medium: 22838, total: 90474 },
    { hod: 'A. HARRISON', assetCount: 138, critical: 368, high: 8645, medium: 3731, total: 12744 },
    { hod: 'TO-BE-IDENTIFIED', assetCount: 4, critical: 84, high: 2763, medium: 1202, total: 4049 },
    { hod: 'M. FENWICK', assetCount: 2, critical: 70, high: 2648, medium: 976, total: 3694 },
    { hod: 'R. COLLIER', assetCount: 29, critical: 50, high: 2210, medium: 831, total: 3091 },
    { hod: 'T. WHITMORE', assetCount: 9, critical: 58, high: 1379, medium: 643, total: 2080 },
    { hod: 'D. WHITFIELD', assetCount: 11, critical: 54, high: 591, medium: 249, total: 894 },
    { hod: 'K. SHELDON', assetCount: 3, critical: 24, high: 565, medium: 235, total: 824 },
    { hod: 'Total', assetCount: 953, critical: 2778, high: 84367, medium: 30705, total: 117850, _total: true },
  ],
};

export const WIN_TREND = {
  rows: [
    { name: 'Jan', Critical: 1954, High: 21730, Medium: 63773 },
    { name: 'Feb', Critical: 7119, High: 135105, Medium: 64983 },
    { name: 'Mar', Critical: 5987, High: 119348, Medium: 43130 },
    { name: 'Apr', Critical: 7667, High: 101042, Medium: 42950 },
    { name: 'May', Critical: 4008, High: 92336, Medium: 39031 },
    { name: 'Jun', Critical: 2778, High: 84367, Medium: 30705 },
  ],
};

export const WIN_TOP_CONTRIB_NOTE = "Top finding's contributors are browsers, .NET related.";

// ── Top Vulnerable Hosts & CVE-wise (Windows) ────────────────────────
export const WIN_TOP_CRITICAL_CVE = {
  columns: [
    { key: 'cve', label: 'CVE-ID' },
    { key: 'count', label: 'Count', align: 'right' },
    { key: 'details', label: 'Details' },
  ],
  rows: [
    { cve: 'CVE-2026-8511, CVE-2026-8580, CVE-2026-7908', count: 970, details: 'Google Chrome related' },
    { cve: 'CVE-2026-45495', count: 950, details: 'Microsoft Edge (Chromium-based) Remote Code Execution Vulnerability' },
    { cve: 'CVE-2026-41089', count: 461, details: 'Stack-based buffer overflow in Windows Netlogon' },
    { cve: 'CVE-2024-37980, CVE-2024-37341', count: 323, details: 'Remote Code Execution related' },
    { cve: 'CVE-2015-2590, CVE-2013-2465', count: 158, details: 'Java related' },
    { cve: 'CVE-2023-36788', count: 91, details: '.NET related' },
    { cve: 'CVE-2026-33824', count: 58, details: 'Double free in Windows IKE Extension allows an unauthorized attacker to execute code over a network.' },
    { cve: 'CVE-2024-21375, CVE-2024-21450', count: 34, details: 'Microsoft SQL Server Elevation of Privilege Vulnerability' },
    { cve: 'CVE-2024-0161, CVE-2024-0172', count: 22, details: 'Hardware related' },
    { cve: 'CVE-2025-47955, CVE-2024-38240', count: 10, details: 'Windows Remote Access Connection Manager related' },
  ],
};

export const WIN_TOP_HIGH_CVE = {
  columns: WIN_TOP_CRITICAL_CVE.columns,
  rows: [
    { cve: 'CVE-2026-34329, CVE-2026-34343', count: 5719, details: 'Heap-based buffer overflow in Windows' },
    { cve: 'CVE-2026-34333, CVE-2026-34330', count: 2882, details: 'Win32K — GRFX application related' },
    { cve: 'CVE-2019-0548, CVE-2026-23666', count: 1769, details: '.NET related' },
    { cve: 'CVE-2025-21587, CVE-2025-50063', count: 617, details: 'Java related' },
    { cve: 'CVE-2026-32161', count: 461, details: 'Windows Native WiFi Miniport Driver related' },
    { cve: 'CVE-2026-33834', count: 461, details: 'Improper access control in Windows Event Logging service' },
    { cve: 'CVE-2026-33838', count: 461, details: 'Double free in Windows Message Queuing' },
    { cve: 'CVE-2026-34341', count: 461, details: 'Double free in Windows Link-Layer Discovery Protocol (LLDP)' },
    { cve: 'CVE-2026-34342', count: 461, details: 'Windows Print Spooler Components related' },
    { cve: 'CVE-2024-0172, CVE-2023-25537', count: 65, details: 'Hardware related' },
  ],
};

export const WIN_TOP_HOSTS = {
  columns: [
    { key: 'asset', label: 'Asset Name' },
    { key: 'critical', label: 'Critical', align: 'right', sev: 'critical' },
    { key: 'high', label: 'High', align: 'right', sev: 'high' },
  ],
  rows: [
    { asset: 'FILE-SRV-01', critical: 149, high: 637 },
    { asset: 'SCCM-SRV-01', critical: 124, high: 2456 },
    { asset: 'DC-SRV-01', critical: 90, high: 1120 },
    { asset: 'MDM-SRV-01', critical: 69, high: 2138 },
    { asset: 'TEST-SRV-01', critical: 61, high: 2119 },
    { asset: 'CTX-TLS-SRV-01', critical: 55, high: 573 },
    { asset: 'DB-SRV-01', critical: 50, high: 1749 },
    { asset: 'CTX-NPS-SRV-02', critical: 37, high: 1191 },
    { asset: 'CTX-NPS-SRV-01', critical: 37, high: 1130 },
    { asset: 'DC-SRV-02', critical: 32, high: 1318 },
    { asset: 'DB-SRV-02', critical: 31, high: 1316 },
    { asset: 'DB-SRV-03', critical: 31, high: 1315 },
    { asset: 'WEB-SRV-13', critical: 22, high: 684 },
    { asset: 'WEB-SRV-14', critical: 22, high: 684 },
    { asset: 'WEB-SRV-15', critical: 20, high: 704 },
    { asset: 'WEB-SRV-16', critical: 20, high: 691 },
    { asset: 'APP-SRV-01', critical: 19, high: 968 },
    { asset: 'CTX-CORP-SRV-01', critical: 19, high: 747 },
    { asset: 'FTP-SRV-01', critical: 19, high: 598 },
    { asset: 'SCALE-SRV-01', critical: 12, high: 737 },
  ],
};

// ── Linux Servers ─────────────────────────────────────────────────
export const LINUX_AGEING_TABLE = {
  columns: WIN_AGEING_TABLE.columns,
  rows: [
    { ageing: '>90 Days', critical: 355, high: 3471, medium: 3820 },
    { ageing: '61-90 Days', critical: 1, high: 314, medium: 198 },
    { ageing: '31-60 Days', critical: 32, high: 2058, medium: 948 },
    { ageing: '<30 Days', critical: 224, high: 2192, medium: 1151 },
  ],
};

export const LINUX_ASSET_OWNER_TABLE = {
  columns: [
    { key: 'owner', label: 'Asset Owner' },
    { key: 'serverCount', label: 'Server Count', align: 'right' },
    { key: 'critical', label: 'Critical', align: 'right', sev: 'critical' },
    { key: 'high', label: 'High', align: 'right', sev: 'high' },
    { key: 'medium', label: 'Medium', align: 'right', sev: 'medium' },
    { key: 'total', label: 'Total', align: 'right' },
  ],
  rows: [
    { owner: 'A. HARRISON', serverCount: 105, critical: 321, high: 2346, medium: 1570, total: 4237 },
    { owner: 'D. WHITFIELD', serverCount: 96, critical: 173, high: 2830, medium: 1847, total: 4850 },
    { owner: 'J. MERCER', serverCount: 68, critical: 118, high: 2859, medium: 2700, total: 5677 },
    { owner: 'Total', serverCount: 269, critical: 612, high: 8035, medium: 6117, total: 14764, _total: true },
  ],
};

export const LINUX_TREND = {
  rows: [
    { name: 'Jan', Critical: 870,  High: 8519,  Medium: 11660 },
    { name: 'Feb', Critical: 1414, High: 12907, Medium: 12991 },
    { name: 'Mar', Critical: 819,  High: 17468, Medium: 14889 },
    { name: 'Apr', Critical: 566,  High: 9641,  Medium: 9968  },
    { name: 'May', Critical: 569,  High: 9026,  Medium: 8341  },
    { name: 'Jun', Critical: 612,  High: 8035,  Medium: 6117  },
  ],
};

export const LINUX_EOL_NOTES = [
  '~119 servers EOL need to be upgraded:',
  'RHEL obsolete version',
  'CentOS Linux obsolete version',
  'Obsolete version of HP-UX',
];

// ── Top Vulnerable Hosts & VA Title-wise (Linux) ─────────────────────
export const LINUX_TOP_CRITICAL_CVE = {
  columns: [
    { key: 'checkId', label: 'Check ID' },
    { key: 'details', label: 'Details' },
    { key: 'count', label: 'Count', align: 'right' },
  ],
  rows: [
    { checkId: 'CVE-2026-31402', details: 'Kernel heap overflow / NFSv4 memory corruption / privilege escalation', count: 71 },
    { checkId: 'CVE-2026-4631', details: 'Cockpit RCE via SSH injection and unauthenticated command execution', count: 38 },
    { checkId: 'CVE-2026-33186', details: 'gRPC authorization bypass — improper HTTP/2 validation', count: 18 },
    { checkId: 'CVE-2006-10003', details: 'XML parser memory corruption — crafted input exploitation', count: 15 },
    { checkId: 'No CVE given', details: 'Obsolete HP-UX OS — unsupported software risk and missing patches', count: 13 },
    { checkId: 'CVE-2025-41239, CVE-2025-41237, CVE-2025-41236', details: 'VMware info disclosure / integer overflow / virtualization flaws', count: 12 },
    { checkId: 'CVE-2025-41238', details: 'VMware heap overflow vulnerability', count: 12 },
    { checkId: 'CVE-2023-25690, CVE-2022-22720, CVE-2021-44790', details: 'Apache HTTP request smuggling / OOB write / request handling flaws', count: 12 },
    { checkId: 'No CVE given', details: 'CentOS obsolete version & unsupported OS exposure', count: 9 },
    { checkId: 'CVE-2026-22984, CVE-2026-31607', details: 'Kernel memory issues / system instability / privilege risks', count: 8 },
  ],
};

export const LINUX_TOP_HOSTS = {
  columns: [
    { key: 'ip', label: 'Asset IP' },
    { key: 'process', label: 'Process' },
    { key: 'critical', label: 'Critical', align: 'right', sev: 'critical' },
    { key: 'high', label: 'High', align: 'right', sev: 'high' },
  ],
  rows: [
    { ip: '10.20.40.10', process: 'Core-App', critical: 18, high: 750 },
    { ip: '10.30.5.5', process: 'SIEM / Cribl', critical: 40, high: 631 },
    { ip: '10.40.15.30', process: 'Core-App', critical: 6, high: 250 },
    { ip: '10.40.15.31', process: 'Core-App', critical: 6, high: 250 },
    { ip: '10.40.15.39', process: 'Core-App', critical: 6, high: 250 },
    { ip: '10.40.15.40', process: 'Core-App', critical: 6, high: 250 },
    { ip: '10.20.40.55', process: 'Core-App', critical: 49, high: 189 },
    { ip: '10.20.40.90', process: 'Core-App', critical: 8, high: 202 },
    { ip: '10.40.70.12', process: 'Core-App', critical: 2, high: 185 },
    { ip: '10.20.40.66', process: 'Core-App', critical: 37, high: 131 },
    { ip: '10.50.100.30', process: 'SIEM / Cribl', critical: 3, high: 161 },
    { ip: '10.60.90.44', process: 'Shared Services', critical: 1, high: 156 },
    { ip: '10.20.40.67', process: 'Core-App', critical: 44, high: 97 },
    { ip: '172.31.34.16', process: 'Billing', critical: 42, high: 95 },
    { ip: '10.20.40.75', process: 'Core-App', critical: 22, high: 97 },
    { ip: '10.20.40.76', process: 'Core-App', critical: 22, high: 97 },
    { ip: '10.40.70.20', process: 'Core-App', critical: 2, high: 108 },
    { ip: '10.40.70.26', process: 'Core-App', critical: 2, high: 108 },
    { ip: '10.40.70.22', process: 'Core-App', critical: 2, high: 106 },
    { ip: '10.40.70.24', process: 'Core-App', critical: 2, high: 106 },
  ],
};

// ── Cloud Servers ─────────────────────────────────────────────────
export const AZURE_WIN_HOD_TABLE = {
  columns: [
    { key: 'hod', label: 'Head Of Department' },
    { key: 'critical', label: 'Critical', align: 'right', sev: 'critical' },
    { key: 'high', label: 'High', align: 'right', sev: 'high' },
    { key: 'medium', label: 'Medium', align: 'right', sev: 'medium' },
    { key: 'total', label: 'Total', align: 'right' },
  ],
  rows: [
    { hod: 'J. MERCER', critical: 265, high: 15901, medium: 3352, total: 19518 },
    { hod: 'A. HARRISON', critical: 36, high: 1047, medium: 307, total: 1390 },
    { hod: 'Grand Total', critical: 301, high: 16948, medium: 3659, total: 20908, _total: true },
  ],
};

export const AZURE_LINUX_HOD_TABLE = {
  columns: AZURE_WIN_HOD_TABLE.columns,
  rows: [
    { hod: 'D. WHITFIELD', critical: 2, high: 11, medium: 3, total: 16 },
    { hod: 'A. HARRISON', critical: 0, high: 9, medium: 0, total: 9 },
    { hod: 'J. MERCER', critical: 0, high: 1, medium: 0, total: 1 },
    { hod: 'Grand Total', critical: 2, high: 21, medium: 3, total: 26, _total: true },
  ],
};

export const AZURE_TOP_WIN_HOSTS = {
  columns: [
    { key: 'host', label: 'Hostname' },
    { key: 'role', label: 'Device Role' },
    { key: 'critical', label: 'Critical', align: 'right', sev: 'critical' },
    { key: 'high', label: 'High', align: 'right', sev: 'high' },
  ],
  rows: [
    { host: 'CTX-NPS-SRV-02', role: 'Citrix', critical: 37, high: 1191 },
    { host: 'CTX-NPS-SRV-01', role: 'Citrix', critical: 37, high: 1130 },
    { host: 'SCALE-SRV-01', role: '—', critical: 12, high: 737 },
    { host: 'NAV-DB-SRV-01', role: 'Database', critical: 13, high: 435 },
    { host: 'CTX-ATHR-NW-MI', role: 'Citrix', critical: 16, high: 429 },
    { host: 'CTX-EDGE-03', role: 'Citrix', critical: 9, high: 387 },
    { host: 'CTX-EDGE-02', role: 'Citrix', critical: 9, high: 387 },
    { host: 'CTX-EDGE-01', role: 'Citrix', critical: 9, high: 387 },
    { host: 'CTX-EDGE-04', role: 'Citrix', critical: 9, high: 387 },
    { host: 'CTX-INCRED-MI', role: 'Citrix', critical: 8, high: 355 },
  ],
};

export const AZURE_TOP_LINUX_HOSTS = {
  columns: [
    { key: 'host', label: 'Host IP' },
    { key: 'role', label: 'Device Role' },
    { key: 'critical', label: 'Critical', align: 'right', sev: 'critical' },
    { key: 'high', label: 'High', align: 'right', sev: 'high' },
  ],
  rows: [
    { host: '10.20.40.55', role: 'Cloud', critical: 49, high: 189 },
    { host: '10.20.40.67', role: 'Cloud', critical: 44, high: 97 },
    { host: '172.31.34.16', role: 'Cloud', critical: 42, high: 95 },
    { host: '10.30.5.5', role: 'Cloud', critical: 40, high: 631 },
    { host: '10.20.40.66', role: 'Cloud', critical: 37, high: 131 },
    { host: '10.20.40.76', role: 'Cloud', critical: 22, high: 97 },
    { host: '10.20.40.75', role: 'Cloud', critical: 22, high: 97 },
    { host: '172.31.34.15', role: 'Cloud', critical: 20, high: 35 },
    { host: '10.20.40.10', role: 'Cloud', critical: 18, high: 750 },
    { host: '10.70.68.21', role: 'Cloud', critical: 10, high: 85 },
  ],
};

export const AZURE_TOP_CVE = {
  columns: [
    { key: 'checkId', label: 'Check ID' },
    { key: 'details', label: 'Details' },
    { key: 'critical', label: 'Critical', align: 'right', sev: 'critical' },
  ],
  rows: [
    { checkId: 'CVE-2026-41089', details: 'Windows Netlogon stack-based buffer overflow remote code execution', critical: 43 },
    { checkId: 'CVE-2026-45495', details: 'Microsoft Edge remote code execution', critical: 11 },
    { checkId: 'CVE-2026-7908', details: 'Chrome fullscreen use-after-free sandbox escape', critical: 11 },
    { checkId: 'CVE-2026-7910', details: 'Chrome views use-after-free site isolation bypass', critical: 11 },
    { checkId: 'CVE-2026-8511', details: 'Chrome UI use-after-free sandbox escape', critical: 11 },
    { checkId: 'CVE-2026-8580', details: 'Chrome Mojo use-after-free sandbox escape', critical: 11 },
    { checkId: 'CVE-2026-6920', details: 'Chrome Android GPU out-of-bounds read sandbox escape', critical: 10 },
    { checkId: 'CVE-2026-7333', details: 'Chrome GPU use-after-free sandbox escape', critical: 10 },
    { checkId: 'CVE-2026-6919', details: 'Chrome DevTools use-after-free sandbox escape', critical: 8 },
    { checkId: 'CVE-2026-33824', details: 'Windows IKE Extension double free remote code execution', critical: 7 },
  ],
};
