import React, { useState, useEffect } from 'react'
import { DSPillSearch } from '../context/WorkspaceCtx.jsx'
import { SegmentedTabs } from '../pages/PageKG.jsx'
import '../styles/filter-panel.css'

const FP_DEFAULT_ATTRS = [
  { id: 'business-unit',     label: 'Business Unit',       sub: null,         icon: 'business-unit',       options: [] },
  { id: 'type-host',         label: 'Type',                sub: 'Host',       icon: 'type',                options: ['Server','Workstation','Mobile','Network','Printers','IOT','Scanners','Hypervisor','Cloud Storage'] },
  { id: 'infra-type',        label: 'Infrastructure Type', sub: null,         icon: 'infrastructure-type', options: [] },
  { id: 'data-source',       label: 'Data Source',         sub: null,         icon: 'data-source',         options: [] },
  { id: 'score',             label: 'Score',               sub: null,         icon: 'score',               options: [] },
  { id: 'asset-criticality', label: 'Asset Criticality',   sub: null,         icon: 'asset-criticality',   options: [] },
  { id: 'type-assessment',   label: 'Type',                sub: 'Assessment', icon: 'type',                options: [] },
];

const SEVERITY_OPTS   = ['Critical', 'High', 'Low', 'Medium'];
const BOOLEAN_OPTS    = ['(empty)', 'True', 'False'];

const PAGE_FILTER_ATTRS = {
  'kg': [
    { id: 'type',                              label: 'Type',                              icon: 'type',                options: ['(empty)', 'Application', 'Asset Management', 'AWS Account', 'AWS IAM User', 'Azure Subscription', 'Bucket', 'Cloud Security', 'Compute Instance Group'] },
    { id: 'origin',                            label: 'Origin',                            icon: 'data-source',         modes: ['AND', 'OR', 'EXACT'], options: ['AWS', 'AWS Cloudtrail', 'AWS IAM Center', 'AWS IAM Users', 'BambooHR', 'CISA Known Exploited Vulnerabilities', 'CISA Vulnrichment', 'CrowdStrike', 'EPSS'] },
    { id: 'business-unit',                     label: 'Business Unit',                     icon: 'business-unit',       options: ['(empty)', 'Acme Corp Financial Services', 'Acme Corp Financial services', 'Business Development', 'Customer Service', 'DevOps', 'Global', 'HR', 'InfoSec'] },
    { id: 'exposure-severity',                 label: 'Exposure Severity',                 icon: 'score',               options: SEVERITY_OPTS },
    { id: 'multiple-location-access-flag',     label: 'Multiple Location Access Flag',     icon: 'type',                options: ['(empty)', 'false', 'true'] },
    { id: 'av-scan-sla-breach-status',         label: 'AV Scan SLA Breach Status',         icon: 'type',                options: ['(empty)', 'false', 'true'] },
    { id: 'days-since-last-login',             label: 'Days Since Last Login',             icon: 'score',               type: 'range', min: 0, max: 1121, options: [] },
    { id: 'av-block-malicious-code-status',    label: 'AV Block Malicious Code Status',    icon: 'type',                options: [] },
    { id: 'active-registered-host-count',      label: 'Active Registered Host Count',      icon: 'score',               options: [] },
    { id: 'registered-host-count',             label: 'Registered Host Count',             icon: 'score',               options: [] },
    { id: 'vm-scan-sla-breach-status',         label: 'VM Scan SLA Breach Status',         icon: 'type',                options: [] },
    { id: 'naming-convention-compliance-status', label: 'Naming Convention Compliance Status', icon: 'type',            options: [] },
    { id: 'is-mfa-enabled',                   label: 'Is MFA Enabled',                    icon: 'type',                options: [] },
    { id: 'container-runs-as-root',            label: 'Container Runs as Root',            icon: 'type',                options: [] },
    { id: 'active-cluster-finding-count',      label: 'Active Cluster Finding Count',      icon: 'score',               options: [] },
    { id: 'password-vulnerability-count',      label: 'Password Vulnerability Count',      icon: 'score',               options: [] },
    { id: 'finding-sla-resolved-status',       label: 'Finding SLA Resolved Status',       icon: 'type',                options: [] },
    { id: 'cloud-zone-availability',           label: 'Cloud Zone Availability',           icon: 'infrastructure-type', options: [] },
    { id: 'azure-acr-quarantine-policy',       label: 'Azure ACR Quarantine Policy',       icon: 'type',                options: [] },
  ],
  'discover/cloud':                'discover/device',
  'discover/identity':             'discover/device',
  'report/assessments':            'report/compliance',
  'report/compliance-matrix':      'report/compliance',
  'report/compliance-findings':    'report/compliance',
  'report/compliance': [
    { id: 'assessment-severity',       label: 'Assessment Severity',       icon: 'score',               options: SEVERITY_OPTS },
    { id: 'assessment-weightage',      label: 'Assessment Weightage',      icon: 'score',               type: 'range', min: 1, max: 10, options: [] },
    { id: 'finding-origin',            label: 'Finding Origin',            icon: 'data-source',         modes: ['AND', 'OR', 'EXACT'], options: ['AWS', 'Knowledge Graph', 'MS Azure', 'MS Defender', 'Qualys', 'Tenable.sc', 'Wiz'] },
    { id: 'finding-source',            label: 'Finding Source',            icon: 'data-source',         options: ['Cloud Defined', 'Product Defined'] },
    { id: 'type',                      label: 'Type',                      icon: 'type',                options: ['Bucket', 'Compute Instance Group', 'Container Groups', 'Container Registry', 'File System Service', 'Human', 'Kubernetes Cluster', 'Kubernetes Container', 'Mobile'] },
    { id: 'finding-type',              label: 'Finding Type',              icon: 'type',                options: ['Asset Management', 'Cloud Security', 'Continuous Monitoring', 'Cryptographic Protections', 'Data Classification & Handling', 'Endpoint Security', 'Human Resources Security', 'Identification & Authentication', 'Mobile Device Management'] },
    { id: 'business-unit',             label: 'Business Unit',             icon: 'business-unit',       options: ['(empty)', 'Customer Service', 'Global', 'Networking', 'PriorityAccess', 'Production Server', 'Shared Unity', 'Zone A Protect', 'Zone A Server'] },
    { id: 'os-family',                 label: 'OS Family',                 icon: 'type',                options: ['(empty)', 'Android', 'iOS', 'Linux', 'macOS', 'Network OS', 'Windows'] },
    { id: 'finding-exposure-severity', label: 'Finding Exposure Severity', icon: 'score',               options: SEVERITY_OPTS },
    { id: 'exposure-category',         label: 'Exposure Category',         icon: 'type',                options: ['Control Gap', 'Software Vulnerability'] },
    { id: 'scope-entity',              label: 'Scope Entity',              icon: 'type',                modes: ['AND', 'OR', 'EXACT'], options: ['Cluster', 'Container', 'Host', 'Identity', 'Network', 'Network Services', 'Person', 'Storage', 'Vulnerability'] },
  ],
  'discover/device': [
    { id: 'type',           label: 'Type',            icon: 'type',                options: ['Server', 'Workstation', 'Mobile', 'Network', 'Printers', 'IOT', 'Scanners', 'Hypervisor', 'Cloud Storage'] },
    { id: 'origin',         label: 'Origin',          icon: 'data-source',         modes: ['AND', 'OR', 'EXACT'], options: [] },
    { id: 'business-unit',  label: 'Business Unit',   icon: 'business-unit',       options: ['(empty)', 'Customer Service', 'Global', 'Networking', 'PriorityAccess', 'Production Server', 'Shared Unity', 'Zone A Protect', 'Zone A Server'] },
    { id: 'accessibility',  label: 'Accessibility',   icon: 'type',                options: [] },
    { id: 'deployment-type',label: 'Deployment Type', icon: 'infrastructure-type', options: ['Cloud', 'On-Premise'] },
    { id: 'cloud-provider', label: 'Cloud Provider',  icon: 'infrastructure-type', options: ['(empty)', 'AWS', 'Azure'] },
    { id: 'environment',    label: 'Environment',     icon: 'infrastructure-type', options: ['(empty)', 'dev', 'developer', 'eng', 'engineering', 'integration', 'perf', 'perfext', 'prod'] },
    { id: 'asset-criticality', label: 'Asset Criticality', icon: 'asset-criticality', options: SEVERITY_OPTS },
    { id: 'asset-role',     label: 'Asset Role',      icon: 'type',                modes: ['AND', 'OR', 'EXACT'], options: ['AIX Server', 'Database', 'DNS Server', 'Domain Controller', 'ERP System', 'File Transfer Protocol', 'General Purpose', 'General Server', 'Hypervisor'] },
    { id: 'os-family',      label: 'OS Family',       icon: 'type',                options: ['(empty)', 'Android', 'iOS', 'Linux', 'macOS', 'Network OS', 'Windows'] },
    { id: 'edr-product',    label: 'EDR Product',     icon: 'type',                options: [] },
  ],
  'exposure/findings': [
    { id: 'exposure-category',         label: 'Exposure Category',         icon: 'type',                options: ['Control Gap', 'Software Vulnerability'] },
    { id: 'asset-origin',              label: 'Asset Origin',              icon: 'data-source',         modes: ['AND', 'OR', 'EXACT'], options: ['AWS', 'AWS Cloudtrail', 'AWS IAM Center', 'CrowdStrike', 'MS Active Directory', 'MS Active Directory Extract', 'MS Azure', 'MS Azure AD', 'MS Defender'] },
    { id: 'finding-origin',            label: 'Finding Origin',            icon: 'data-source',         modes: ['AND', 'OR', 'EXACT'], options: ['AWS', 'Knowledge Graph', 'MS Azure', 'MS Defender', 'Qualys', 'Tenable.sc', 'Wiz'] },
    { id: 'finding-source',            label: 'Finding Source',            icon: 'data-source',         options: ['Cloud Defined', 'Product Defined'] },
    { id: 'cloud-provider',            label: 'Cloud Provider',            icon: 'infrastructure-type', options: ['(empty)', 'AWS', 'Azure'] },
    { id: 'scope-entity',              label: 'Scope Entity',              icon: 'type',                modes: ['AND', 'OR', 'EXACT'], options: ['Cluster', 'Container', 'Host', 'Identity', 'Network', 'Network Services', 'Person', 'Storage', 'Vulnerability'] },
    { id: 'os-family',                 label: 'OS Family',                 icon: 'type',                options: ['(empty)', 'Android', 'iOS', 'Linux', 'macOS', 'Network OS', 'Windows'] },
    { id: 'impact',                    label: 'Impact',                    icon: 'score',               options: SEVERITY_OPTS },
    { id: 'likelihood',                label: 'Likelihood',                icon: 'score',               options: SEVERITY_OPTS },
    { id: 'type',                      label: 'Type',                      icon: 'type',                options: ['Bucket', 'Compute Instance Group', 'Container Groups', 'Container Registry', 'File System Service', 'Human', 'Kubernetes Cluster', 'Kubernetes Container', 'Mobile'] },
    { id: 'asset-role',                label: 'Asset Role',                icon: 'type',                modes: ['AND', 'OR', 'EXACT'], options: ['AIX Server', 'Database', 'DNS Server', 'Domain Controller', 'ERP System', 'File Transfer Protocol', 'General Purpose', 'General Server', 'Hypervisor'] },
    { id: 'finding-exposure-severity', label: 'Finding Exposure Severity', icon: 'score',               options: SEVERITY_OPTS },
    { id: 'business-unit',             label: 'Business Unit',             icon: 'business-unit',       options: ['(empty)', 'Customer Service', 'Global', 'Networking', 'PriorityAccess', 'Production Server', 'Shared Unity', 'Zone A Protect', 'Zone A Server'] },
    { id: 'deployment-type',           label: 'Deployment Type',           icon: 'infrastructure-type', options: ['Cloud', 'On-Premise'] },
    { id: 'vm-onboarding-status',      label: 'VM Onboarding Status',      icon: 'type',                options: BOOLEAN_OPTS },
  ],
  'exposure/overview': [
    { id: 'exposure-category',          label: 'Exposure Category',          icon: 'type',                options: ['Control Gap', 'Software Vulnerability'] },
    { id: 'asset-origin',               label: 'Asset Origin',               icon: 'data-source',         modes: ['AND', 'OR', 'EXACT'], options: ['AWS', 'AWS Cloudtrail', 'AWS IAM Center', 'CrowdStrike', 'MS Active Directory', 'MS Active Directory Extract', 'MS Azure', 'MS Azure AD', 'MS Defender'] },
    { id: 'finding-origin',             label: 'Finding Origin',             icon: 'data-source',         modes: ['AND', 'OR', 'EXACT'], options: ['AWS', 'Knowledge Graph', 'MS Azure', 'MS Defender', 'Qualys', 'Tenable.sc', 'Wiz'] },
    { id: 'finding-source',             label: 'Finding Source',             icon: 'data-source',         options: ['Cloud Defined', 'Product Defined'] },
    { id: 'cloud-provider',             label: 'Cloud Provider',             icon: 'infrastructure-type', options: ['(empty)', 'AWS', 'Azure'] },
    { id: 'os-family',                  label: 'OS Family',                  icon: 'type',                options: ['(empty)', 'Android', 'iOS', 'Linux', 'macOS', 'Network OS', 'Windows'] },
    { id: 'scope-entity',               label: 'Scope Entity',               icon: 'type',                modes: ['AND', 'OR', 'EXACT'], options: ['Cluster', 'Container', 'Host', 'Identity', 'Network', 'Network Services', 'Person', 'Storage', 'Vulnerability'] },
    { id: 'type',                       label: 'Type',                       icon: 'type',                options: ['Bucket', 'Compute Instance Group', 'Container Groups', 'Container Registry', 'File System Service', 'Human', 'Kubernetes Cluster', 'Kubernetes Container', 'Mobile'] },
    { id: 'asset-role',                 label: 'Asset Role',                 icon: 'type',                modes: ['AND', 'OR', 'EXACT'], options: ['AIX Server', 'Database', 'DNS Server', 'Domain Controller', 'ERP System', 'File Transfer Protocol', 'General Purpose', 'General Server', 'Hypervisor'] },
    { id: 'assessment-severity',        label: 'Assessment Severity',        icon: 'score',               options: SEVERITY_OPTS },
    { id: 'finding-exposure-severity',  label: 'Finding Exposure Severity',  icon: 'score',               options: SEVERITY_OPTS },
    { id: 'business-unit',              label: 'Business Unit',              icon: 'business-unit',       options: ['(empty)', 'Customer Service', 'Global', 'Networking', 'PriorityAccess', 'Production Server', 'Shared Unity', 'Zone A Protect', 'Zone A Server'] },
    { id: 'deployment-type',            label: 'Deployment Type',            icon: 'infrastructure-type', options: ['Cloud', 'On-Premise'] },
    { id: 'asset-criticality',          label: 'Asset Criticality',          icon: 'asset-criticality',   options: SEVERITY_OPTS },
    { id: 'vm-onboarding-status',       label: 'VM Onboarding Status',       icon: 'type',                options: BOOLEAN_OPTS },
    { id: 'antivirus',                  label: 'Antivirus',                  icon: 'type',                options: BOOLEAN_OPTS },
    { id: 'av-block',                   label: 'AV Block',                   icon: 'type',                options: BOOLEAN_OPTS },
    { id: 'firewall-enabled',           label: 'Firewall Enabled',           icon: 'type',                options: BOOLEAN_OPTS },
  ],
  'workspace/report': [
    { id: 'business-unit',               label: 'Business Unit',               icon: 'business-unit',       options: ['(empty)', 'Customer Service', 'Global', 'Networking', 'PriorityAccess', 'Production Server', 'Shared Unity', 'Zone A Protect', 'Zone A Server'] },
    { id: 'asset-criticality',           label: 'Asset Criticality',           icon: 'asset-criticality',   options: SEVERITY_OPTS },
    { id: 'type',                        label: 'Type',                        icon: 'type',                options: ['Server', 'Workstation', 'Mobile', 'Network', 'Printers', 'IOT', 'Scanners', 'Hypervisor', 'Cloud Storage'] },
    { id: 'deployment-type',             label: 'Deployment Type',             icon: 'infrastructure-type', options: ['Cloud', 'On-Premise'] },
    { id: 'asset-role',                  label: 'Asset Role',                  icon: 'type',                modes: ['AND', 'OR', 'EXACT'], options: ['AIX Server', 'Database', 'DNS Server', 'Domain Controller', 'ERP System', 'File Transfer Protocol', 'General Purpose', 'General Server', 'Hypervisor'] },
    { id: 'os-family',                   label: 'OS Family',                   icon: 'type',                options: ['(empty)', 'Android', 'iOS', 'Linux', 'macOS', 'Network OS', 'Windows'] },
    { id: 'os',                          label: 'OS',                          icon: 'type',                patternSearch: true, options: ['android 11', 'Android 11', 'android 12', 'Android 13', 'android 13', 'Android 14', 'Android 9', 'Cisco IOS', 'Debian', 'Debian 10'] },
    { id: 'accessibility',               label: 'Accessibility',               icon: 'type',                options: ['(empty)', 'External', 'Internal'] },
    { id: 'cloud-provider',              label: 'Cloud Provider',              icon: 'data-source',         options: ['(empty)', 'AWS', 'Azure'] },
    { id: 'cve-id',                      label: 'CVE ID',                      icon: 'score',               modes: ['AND', 'OR', 'EXACT'], patternSearch: true, options: ['cve-0000-0000', 'cve-1999-0005', 'cve-1999-0006', 'cve-1999-0017', 'cve-1999-0019', 'cve-1999-0024', 'cve-1999-0042', 'cve-1999-0043'] },
    { id: 'vulnerability-severity',      label: 'Vulnerability Severity',      icon: 'score',               options: SEVERITY_OPTS },
    { id: 'vulnerability-title',         label: 'Vulnerability Title',         icon: 'type',                patternSearch: true, options: ['(empty)', '".netrc" File Contains Authentication Credentials', '"B and R" Automation SiteManager', '"B and R" Automation Studio Multiple Vulnerabilities', '"B and R" Industrial Automation', '"git apply --reject" partially-corrupts', '"nph-test-cgi" CGI Vulnerability', '"test-cgi" CGI Vulnerability'] },
    { id: 'exploit-available',           label: 'Exploit Available',           icon: 'type',                options: BOOLEAN_OPTS },
    { id: 'sla-status',                  label: 'SLA Status',                  icon: 'type',                options: ['Breaching', 'No SLA', 'Over Halfway', 'Under Halfway'] },
    { id: 'vulnerability-finding-status',label: 'Vulnerability Finding Status',icon: 'type',                options: ['Closed', 'Open'] },
  ],
};

function getPageAttrs(pageId) {
  const entry = PAGE_FILTER_ATTRS[pageId];
  if (!entry) return FP_DEFAULT_ATTRS;
  if (typeof entry === 'string') return PAGE_FILTER_ATTRS[entry] || FP_DEFAULT_ATTRS;
  return entry;
}

const FP_SAVED_ITEMS = [
  { id: 'cs',  name: 'Critical Servers',           desc: 'Monitor activity on key servers.',                 author: 'You',      visibility: 'Private', count: 5,  pinned: true  },
  { id: 'chr', name: 'Corporate high risk assets', desc: 'Track sensitive corporate systems.',               author: 'John T',   visibility: 'Public',  count: 12, pinned: true  },
  { id: 'cdm', name: 'Client data management',     desc: 'Manage client information securely.',              author: 'Sarah L',  visibility: 'Public',  count: 8,  pinned: true  },
  { id: 'cm',  name: 'Compliance monitoring',      desc: 'Ensure regulatory compliance across departments.', author: 'Mark R',   visibility: 'Public',  count: 5,  pinned: false },
  { id: 'ir',  name: 'Incident response plans',    desc: 'Prepare for and respond to security incidents.',   author: 'You',      visibility: 'Public',  count: 10, pinned: false },
  { id: 'tif', name: 'Threat intel feeds',         desc: 'Stay ahead of emerging threats.',                  author: 'Jane Doe', visibility: 'Private', count: 8,  pinned: false },
];

const GF_ENTITIES = [
  { id: 'host',         label: 'Host',             file: 'entity-host.svg',              color: '#2B5690', tint: '#E3E9F1', stroke: '#AABBD3', count: 12382    },
  { id: 'storage',      label: 'Storage',          file: 'entity-storage.svg',           color: '#3A96C4', tint: '#E5F1F7', stroke: '#B0D5E7', count: 4070     },
  { id: 'cluster',      label: 'Cluster',          file: 'entity-cluster.svg',           color: '#3434B4', tint: '#E5E5F5', stroke: '#AEAEE1', count: 378      },
  { id: 'identity',     label: 'Identity',         file: 'entity-identity.svg',          color: '#A842D2', tint: '#F4E6F9', stroke: '#DCB3ED', count: 9928     },
  { id: 'network',      label: 'Network',          file: 'entity-network.svg',           color: '#00895E', tint: '#DEF0EA', stroke: '#99D0BF', count: 6389     },
  { id: 'finding',      label: 'Findings',         file: 'entity-finding.svg',           color: '#582DBB', tint: '#E9E4F6', stroke: '#BCABE4', count: 1398278  },
  { id: 'account',      label: 'Account',          file: 'entity-account.svg',           color: '#9269CF', tint: '#F1ECF9', stroke: '#D3C3EC', count: 15301    },
  { id: 'group',        label: 'Group',            file: 'entity-group.svg',             color: '#27BDC2', tint: '#E3F6F7', stroke: '#A9E5E7', count: 2        },
  { id: 'person',       label: 'Person',           file: 'entity-person.svg',            color: '#2E7690', tint: '#E4EDF1', stroke: '#ABC8D3', count: 304      },
  { id: 'application',  label: 'Application',      file: 'entity-application.svg',       color: '#AD803D', tint: '#F4EEE6', stroke: '#DECCB1', count: 4376     },
  { id: 'vulnerability',label: 'Vulnerability',    file: 'entity-vulnerability.svg',     color: '#AE5757', tint: '#F4E9E9', stroke: '#DFBCBC', count: 55230    },
  { id: 'assessment',   label: 'Assessment',       file: 'entity-assessment.svg',        color: '#AC6C36', tint: '#F4ECE5', stroke: '#DEC4AF', count: 497      },
  { id: 'container',    label: 'Container',        file: 'entity-cloud-container.svg',   color: '#66329C', tint: '#EBE4F2', stroke: '#C2ADD7', count: 358      },
  { id: 'cloudAccount', label: 'Cloud Account',    file: 'entity-cloud-account.svg',     color: '#3B43B0', tint: '#E6E7F5', stroke: '#B1B4DF', count: 15       },
  { id: 'ticket',       label: 'Ticket',           file: 'entity-ticket.svg',            color: '#3DBAAD', tint: '#E6F6F4', stroke: '#B1E3DE', count: 10       },
  { id: 'netSvc',       label: 'Network Services', file: 'entity-network-services.svg',  color: '#89A833', tint: '#F0F4E4', stroke: '#D0DCAD', count: 253      },
  { id: 'netIface',     label: 'Net Interface',    file: 'entity-network-interface.svg', color: '#BA3D8C', tint: '#F6E6F0', stroke: '#E3B1D1', count: 3303     },
];

const GF_DEFAULT_SHOWN = ['host', 'storage', 'cluster', 'identity', 'network', 'finding'];

const SHOW_LIMIT = 8;

// ── helpers ──────────────────────────────────────────────────────────────────

function FPAttrIcon({ icon, size = 16 }) {
  return <img src={`assets/icons/${icon}.svg`} width={size} height={size} alt="" className="fp-attr-icon" />;
}

function FPDragHandle() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="fp-drag-handle">
      <circle cx="4"  cy="3"  r="1.2"/><circle cx="10" cy="3"  r="1.2"/>
      <circle cx="4"  cy="7"  r="1.2"/><circle cx="10" cy="7"  r="1.2"/>
      <circle cx="4"  cy="11" r="1.2"/><circle cx="10" cy="11" r="1.2"/>
    </svg>
  );
}

function FPSubTooltip({ sub, children }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="fp-sub-tooltip-wrap"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span className="fp-sub-tooltip-bubble">
          {`Type is the attribute of the entity ${sub}`}
          <span className="fp-sub-tooltip-caret" />
        </span>
      )}
    </span>
  );
}

function FPModeBar({ modes, value, onChange }) {
  return (
    <div className="fp-mode-bar">
      <SegmentedTabs value={value} options={modes} onChange={onChange} fullWidth height={28} />
    </div>
  );
}

function FPRangeSlider({ min, max, from, to, onChange }) {
  const fromPct = ((from - min) / (max - min)) * 100;
  const toPct   = ((to   - min) / (max - min)) * 100;
  const trackVars = { '--fp-range-from': `${fromPct}%`, '--fp-range-to': `${toPct}%` };
  return (
    <div className="fp-range-wrap">
      <div className="fp-range-track-wrap" style={trackVars}>
        <div className="fp-range-track-bg" />
        <div className="fp-range-track-fill" />
        <input type="range" min={min} max={max} value={from} className="fp-range-input"
          onChange={e => onChange(Math.min(Number(e.target.value), to - 1), to)} />
        <input type="range" min={min} max={max} value={to} className="fp-range-input"
          onChange={e => onChange(from, Math.max(Number(e.target.value), from + 1))} />
      </div>
      <div className="fp-range-minmax">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      <div className="fp-range-fields">
        <div className="fp-range-field">
          <span className="fp-range-field-label">From</span>
          <input type="number" min={min} max={to - 1} value={from} className="fp-range-number-input"
            onChange={e => { const v = Math.max(min, Math.min(Number(e.target.value), to - 1)); onChange(v, to); }} />
        </div>
        <div className="fp-range-field">
          <span className="fp-range-field-label">To</span>
          <input type="number" min={from + 1} max={max} value={to} className="fp-range-number-input"
            onChange={e => { const v = Math.min(max, Math.max(Number(e.target.value), from + 1)); onChange(from, v); }} />
        </div>
      </div>
    </div>
  );
}

function FPCheckbox({ checked, indeterminate, onChange }) {
  return (
    <div
      onClick={onChange}
      className={`fp-checkbox${(checked || indeterminate) ? ' fp-checkbox--active' : ''}`}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5l2.5 2.5L8 3" stroke="var(--pai-surface)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {!checked && indeterminate && (
        <svg width="8" height="2" viewBox="0 0 8 2" fill="none">
          <path d="M0.5 1h7" stroke="var(--pai-surface)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )}
    </div>
  );
}

function FPSavedCard({ item, selected, applied, onSelect }) {
  return (
    <div
      onClick={onSelect}
      className={`fp-saved-card${selected ? ' fp-saved-card--selected' : ''}`}
    >
      <div className="fp-saved-card__body">
        <div className="fp-saved-card__content">
          <div className="fp-saved-card__name-row">
            <div className="fp-saved-card__title-row">
              <span className="fp-saved-card__name">{item.name}</span>
              {applied && <span className="fp-saved-card__applied-badge">Applied</span>}
            </div>
            <span className="fp-saved-card__desc">{item.desc}</span>
          </div>
          <div className="fp-saved-card__meta">
            <span className="fp-saved-card__meta-text">{item.author}</span>
            <span className="fp-saved-dot" />
            <span className="fp-saved-card__meta-text">{item.visibility}</span>
            <span className="fp-saved-dot" />
            <span className="fp-saved-card__meta-text">{item.count} filters</span>
          </div>
        </div>
        {item.pinned && (
          <img src="assets/icons/pin.svg" width={16} height={16} alt="" className="fp-saved-card__pin" />
        )}
      </div>
    </div>
  );
}

function FPStepper({ value, onChange, min = 1, max = 20 }) {
  return (
    <div className="fp-stepper">
      <span className="fp-stepper__value">{value}</span>
      <div className="fp-stepper__btns">
        <button onClick={() => onChange(Math.min(max, value + 1))} className="fp-stepper__btn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
        </button>
        <button onClick={() => onChange(Math.max(min, value - 1))} className="fp-stepper__btn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </button>
      </div>
    </div>
  );
}

// ── Graph filter node ─────────────────────────────────────────────────────────
function GFNode({ entity, selected, dimmed, onClick, onContextMenu }) {
  // Entity colours injected as CSS custom properties — no inline style values
  const entVars = {
    '--ent-color': entity.color,
    '--ent-tint':  entity.tint,
    '--ent-stroke': entity.stroke,
  };
  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`gf-node${dimmed ? ' gf-node--dimmed' : ''}`}
    >
      <div className="gf-node__count">
        {entity.count.toLocaleString()}
      </div>
      <div
        className={`gf-node__circle${selected ? ' gf-node__circle--selected' : ''}`}
        style={entVars}
      >
        <img src={`assets/icons/${entity.file}`} width={26} height={26} alt="" className="gf-node__img" />
      </div>
      <span
        className={`gf-node__label${selected ? ' gf-node__label--selected' : ''}`}
        style={entVars}
      >
        {entity.label}
      </span>
    </div>
  );
}

// ── Graph Filter side drawer ──────────────────────────────────────────────────
function GraphFilterDrawer({ open, onClose, onApply, top = 0 }) {
  const [gfShownIds,    setGfShownIds]    = useState(GF_DEFAULT_SHOWN);
  const [gfSelectedIds, setGfSelectedIds] = useState(new Set());
  const [gfContextMenu, setGfContextMenu] = useState(null);
  const [gfAddHideOpen, setGfAddHideOpen] = useState(false);

  const gfShownEntities = GF_ENTITIES.filter(e => gfShownIds.includes(e.id));

  const toggleGFNode = (id) => setGfSelectedIds(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });
  const toggleGFShown = (id) => setGfShownIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );
  const addFromMenu = () => {
    if (!gfContextMenu) return;
    setGfSelectedIds(prev => { const n = new Set(prev); n.add(gfContextMenu.entityId); return n; });
    setGfContextMenu(null);
  };

  const handleApply    = () => { onApply && onApply(gfSelectedIds.size); };
  const handleClearAll = () => { setGfSelectedIds(new Set()); onApply && onApply(0); };

  return (
    <>
      {/* Backdrop — top is dynamic (prop), kept as only inline style */}
      <div
        onClick={onClose}
        className={`gf-backdrop${open ? ' gf-backdrop--open' : ''}`}
        style={{ top }}
      />

      {/* Drawer */}
      <div
        onClick={() => { if (gfContextMenu) setGfContextMenu(null); if (gfAddHideOpen) setGfAddHideOpen(false); }}
        className={`gf-drawer${open ? ' gf-drawer--open' : ''}`}
        style={{ top }}
      >
        {/* Header */}
        <div className="gf-drawer__header">
          <div className="gf-drawer__title-group">
            <img src="assets/icons/navbar-kg.svg" width={18} height={18} alt="" className="gf-drawer__title-icon" />
            <span className="gf-drawer__title-text">Graph Filter</span>
          </div>
          <button onClick={onClose} className="gf-drawer__close-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Canvas */}
        <div className="gf-canvas">
          {/* Zoom controls */}
          <div className="gf-canvas__zoom-controls">
            {[
              { title: 'Zoom in',  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg> },
              { title: 'Zoom out', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg> },
              { title: 'Center',   icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg> },
            ].map(b => (
              <button key={b.title} title={b.title} className="gf-canvas-btn">{b.icon}</button>
            ))}
          </div>

          {/* Show Attributes */}
          <button className="gf-canvas__show-attrs">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Show Attributes
          </button>

          {/* Entity nodes */}
          <div className="gf-canvas__nodes">
            {gfShownEntities.map(entity => (
              <GFNode
                key={entity.id}
                entity={entity}
                selected={gfSelectedIds.has(entity.id)}
                dimmed={gfSelectedIds.size > 0 && !gfSelectedIds.has(entity.id)}
                onClick={() => toggleGFNode(entity.id)}
                onContextMenu={(e) => { e.preventDefault(); setGfContextMenu({ entityId: entity.id, x: e.clientX, y: e.clientY }); }}
              />
            ))}
            {gfShownEntities.length === 0 && (
              <div className="gf-canvas__empty">No entities shown. Use <strong>Add / Hide Entity</strong> to add some.</div>
            )}
          </div>

          {/* Bottom-left tool buttons */}
          <div className="gf-canvas__bottom-controls">
            {[
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>,
            ].map((icon, i) => (
              <button key={i} className="gf-canvas-btn">{icon}</button>
            ))}
          </div>

          {/* Right-click context menu — position from mouse coords, kept as inline */}
          {gfContextMenu && (
            <div
              onClick={e => e.stopPropagation()}
              className="gf-context-menu"
              style={{ top: gfContextMenu.y, left: gfContextMenu.x }}
            >
              {[
                { label: 'Add to filter', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>, action: addFromMenu },
                { label: 'View more options', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>, action: () => setGfContextMenu(null) },
              ].map(item => (
                <button key={item.label} onClick={item.action} className="gf-context-menu__btn">
                  <span className="gf-context-menu__icon">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {/* Add/Hide Entity popover */}
          {gfAddHideOpen && (
            <div
              onClick={e => e.stopPropagation()}
              className="gf-add-hide-popover"
            >
              <div className="gf-add-hide-popover__title">Entity Types</div>
              {GF_ENTITIES.map(entity => (
                <label
                  key={entity.id}
                  className="gf-add-hide-popover__row"
                >
                  <FPCheckbox checked={gfShownIds.includes(entity.id)} onChange={() => toggleGFShown(entity.id)} />
                  <div
                    className="gf-add-hide-popover__swatch"
                    style={{ '--ent-tint': entity.tint, '--ent-stroke': entity.stroke }}
                  >
                    <img src={`assets/icons/${entity.file}`} width={11} height={11} alt="" />
                  </div>
                  {entity.label}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="gf-toolbar">
          <div className="gf-toolbar__inner">
            <button
              onClick={e => { e.stopPropagation(); setGfAddHideOpen(v => !v); }}
              className={`gf-toolbar__add-btn${gfAddHideOpen ? ' gf-toolbar__add-btn--active' : ''}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <line x1="14" y1="17.5" x2="21" y2="17.5"/><line x1="17.5" y1="14" x2="17.5" y2="21"/>
              </svg>
              Add / Hide Entity
            </button>

            <span className="gf-toolbar__hint">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="gf-toolbar__hint-icon">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              Right click any node to add filter or view more options
            </span>

            <button onClick={handleClearAll} className="gf-toolbar__clear-btn">
              Clear All
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
              </svg>
            </button>

            <button onClick={handleApply} className="gf-toolbar__apply-btn">
              Apply filter
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </button>
          </div>

          {/* Preview strip */}
          <div className="gf-preview">
            <div className="gf-preview__label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              <span className="gf-preview__label-text">Preview</span>
            </div>
            <span className="gf-preview__show-text">Show</span>
            {gfSelectedIds.size === 0
              ? <span className="gf-preview__all-text">All entities</span>
              : [...gfSelectedIds].map(id => {
                  const ent = GF_ENTITIES.find(e => e.id === id);
                  if (!ent) return null;
                  const entVars = { '--ent-color': ent.color, '--ent-tint': ent.tint, '--ent-stroke': ent.stroke };
                  return (
                    <span key={id} className="gf-preview__tag" style={entVars}>
                      <div className="gf-preview__tag-icon">
                        <img src={`assets/icons/${ent.file}`} width={9} height={9} alt="" />
                      </div>
                      {ent.label}
                      <button onClick={() => toggleGFNode(id)} className="gf-preview__tag-remove">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </span>
                  );
                })
            }
          </div>
        </div>
      </div>
    </>
  );
}

// ── main filter panel ─────────────────────────────────────────────────────────

function FilterPanel({ onApply, onClose, onOpenGraphFilter, graphFilterOpen, embedded = false, pageId }) {
  const [tab,             setTab]            = useState('quick');
  const [settingsView,    setSettingsView]   = useState(false);
  const [search,          setSearch]         = useState('');
  const [savedSearch,     setSavedSearch]    = useState('');
  const [expanded,        setExpanded]       = useState(() => new Set([getPageAttrs(pageId)[0]?.id].filter(Boolean)));
  const [selections,      setSelections]     = useState({});
  const [groupSearch,     setGroupSearch]    = useState({});
  const [showAll,         setShowAll]        = useState({});
  const [attrModes,        setAttrModes]       = useState({});
  const [rangeSelections,  setRangeSelections] = useState({});
  const [attrs,            setAttrs]           = useState(() => getPageAttrs(pageId));
  const [pendingAttrs,    setPendingAttrs]   = useState(null);
  const [editingId,       setEditingId]      = useState(null);
  const [editingLabel,    setEditingLabel]   = useState('');
  const [selectedSavedId, setSelectedSavedId] = useState(null);
  const [appliedSavedId,  setAppliedSavedId]  = useState(null);
  const [savedOrder,      setSavedOrder]     = useState(FP_SAVED_ITEMS.map(i => i.id));
  const [savedShowCount,  setSavedShowCount] = useState(FP_SAVED_ITEMS.length);
  const [pendingSaved,    setPendingSaved]   = useState(null);
  const [qdragIdx,        setQdragIdx]       = useState(null);
  const [qdragOver,       setQdragOver]      = useState(null);
  const [sdragIdx,        setSdragIdx]       = useState(null);
  const [sdragOver,       setSdragOver]      = useState(null);

  useEffect(() => {
    const newAttrs = getPageAttrs(pageId);
    setAttrs(newAttrs);
    setSelections({});
    setAttrModes({});
    setRangeSelections({});
    setExpanded(new Set([newAttrs[0]?.id].filter(Boolean)));
    setPendingAttrs(null);
  }, [pageId]);

  const liveAttrs      = pendingAttrs || attrs;
  const liveSaved      = pendingSaved || { order: savedOrder, count: savedShowCount };
  const liveSavedItems = liveSaved.order.map(id => FP_SAVED_ITEMS.find(i => i.id === id)).filter(Boolean);

  const toggleExpanded  = (id) => setExpanded(prev => new Set(prev.has(id) ? [] : [id]));
  const toggleOption    = (attrId, opt) => setSelections(prev => { const c = new Set(prev[attrId] || []); c.has(opt) ? c.delete(opt) : c.add(opt); return { ...prev, [attrId]: c }; });
  const toggleSelectAll = (attr) => setSelections(prev => {
    const cur = prev[attr.id] || new Set();
    return { ...prev, [attr.id]: attr.options.every(o => cur.has(o)) ? new Set() : new Set(attr.options) };
  });

  const enterSettings = () => {
    if (tab === 'saved') setPendingSaved({ order: [...savedOrder], count: savedShowCount });
    else setPendingAttrs([...attrs]);
    setEditingId(null); setSettingsView(true);
  };
  const exitSettings = (save) => {
    if (save) {
      if (tab === 'saved' && pendingSaved) { setSavedOrder(pendingSaved.order); setSavedShowCount(pendingSaved.count); }
      else if (pendingAttrs) setAttrs(pendingAttrs);
    }
    setPendingAttrs(null); setPendingSaved(null); setEditingId(null); setSettingsView(false);
  };

  const deleteAttr  = (id) => { if (liveAttrs.length > 1) setPendingAttrs(liveAttrs.filter(a => a.id !== id)); };
  const startEdit   = (attr) => { setEditingId(attr.id); setEditingLabel(attr.label + (attr.sub ? ` · ${attr.sub}` : '')); };
  const applyEdit   = () => { setPendingAttrs(liveAttrs.map(a => a.id === editingId ? { ...a, label: editingLabel, sub: null } : a)); setEditingId(null); };
  const sortAttrsAZ = () => setPendingAttrs([...liveAttrs].sort((a, b) => (a.label + (a.sub || '')).localeCompare(b.label + (b.sub || ''))));

  const onQDragStart = (i) => setQdragIdx(i);
  const onQDragOver  = (e, i) => { e.preventDefault(); if (i !== qdragIdx) setQdragOver(i); };
  const onQDrop      = (e, i) => { e.preventDefault(); if (qdragIdx === null || qdragIdx === i) { setQdragIdx(null); setQdragOver(null); return; } const arr = [...liveAttrs]; const [m] = arr.splice(qdragIdx, 1); arr.splice(i, 0, m); setPendingAttrs(arr); setQdragIdx(null); setQdragOver(null); };
  const onQDragEnd   = () => { setQdragIdx(null); setQdragOver(null); };

  const onSDragStart = (i) => setSdragIdx(i);
  const onSDragOver  = (e, i) => { e.preventDefault(); if (i !== sdragIdx) setSdragOver(i); };
  const onSDrop      = (e, i) => { e.preventDefault(); if (sdragIdx === null || sdragIdx === i) { setSdragIdx(null); setSdragOver(null); return; } const arr = [...liveSaved.order]; const [m] = arr.splice(sdragIdx, 1); arr.splice(i, 0, m); setPendingSaved({ ...liveSaved, order: arr }); setSdragIdx(null); setSdragOver(null); };
  const onSDragEnd   = () => { setSdragIdx(null); setSdragOver(null); };

  const handleReset = () => {
    if (tab === 'saved') { setSelectedSavedId(null); setAppliedSavedId(null); onApply && onApply(0); }
    else { setSelections({}); setRangeSelections({}); }
  };
  const handleApply = () => {
    if (tab === 'saved') {
      setAppliedSavedId(selectedSavedId);
      const item = FP_SAVED_ITEMS.find(i => i.id === selectedSavedId);
      if (item) {
        onApply && onApply(1, [{ key: 'Saved Filter', attrId: 'saved-filter', value: item.name }]);
      }
    } else {
      const chips = [];
      attrs.forEach(attr => {
        if (attr.type === 'range') {
          const r = rangeSelections[attr.id];
          if (r && (r.from !== attr.min || r.to !== attr.max)) {
            chips.push({ key: attr.label, attrId: attr.id, value: `${r.from} – ${r.to}` });
          }
        } else {
          const sel = selections[attr.id];
          if (sel && sel.size > 0) {
            const key = attr.label + (attr.sub ? ` · ${attr.sub}` : '');
            const mode = attr.modes ? (attrModes[attr.id] || 'OR') : null;
            sel.forEach(value => chips.push({ key, attrId: attr.id, value, ...(mode ? { mode } : {}) }));
          }
        }
      });
      const count = Object.values(selections).filter(s => s && s.size > 0).length
        + attrs.filter(a => a.type === 'range' && rangeSelections[a.id] && (rangeSelections[a.id].from !== a.min || rangeSelections[a.id].to !== a.max)).length;
      onApply && onApply(count, chips);
    }
  };

  const filteredAttrs = attrs.filter(a => !search || (a.label + (a.sub ? ` ${a.sub}` : '')).toLowerCase().includes(search.toLowerCase()));
  const filteredSaved = FP_SAVED_ITEMS.filter(item => !savedSearch || item.name.toLowerCase().includes(savedSearch.toLowerCase()));

  return (
    <div className="fp-root">
      {/* Header — hidden when embedded in RightPanelShell */}
      {!embedded && (
        <div className="fp-header">
          <div className="fp-header__left">
            <button onClick={onClose} className="fp-header__close-btn">
              <img src="assets/icons/sidebar-collapse.svg" width={18} height={18} alt="" />
            </button>
            <span className="fp-header__title">Filter</span>
          </div>
          <button
            onClick={settingsView ? () => exitSettings(false) : enterSettings}
            className={`fp-header__settings-btn${settingsView ? ' fp-header__settings-btn--active' : ''}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="fp-tabs">
        <SegmentedTabs
          value={graphFilterOpen ? 'Graph Filter' : (tab === 'quick' ? 'Quick Filters' : 'Saved Filters')}
          options={['Quick Filters', 'Saved Filters', 'Graph Filter']}
          onChange={(v) => {
            if (v === 'Graph Filter') { onOpenGraphFilter && onOpenGraphFilter(); return; }
            if (graphFilterOpen) onOpenGraphFilter && onOpenGraphFilter();
            setTab(v === 'Quick Filters' ? 'quick' : 'saved');
            setSettingsView(false);
          }}
          fullWidth
          compact
        />
      </div>

      {/* Scrollable body */}
      <div className="fp-body">

        {/* Quick Settings */}
        {settingsView && tab === 'quick' && (
          <div className="fp-quick-settings">
            <div className="fp-quick-settings__actions">
              <button onClick={sortAttrsAZ} className="fp-sort-btn">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M7 12h10M11 18h2"/></svg>
                Sort A–Z
              </button>
              <button onClick={onOpenGraphFilter} className="fp-add-attr-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Attributes
              </button>
            </div>
            {liveAttrs.map((attr, i) => {
              const isEditing = editingId === attr.id;
              const isDragging = qdragIdx === i;
              const isOver = qdragOver === i && qdragIdx !== i;
              return (
                <div
                  key={attr.id}
                  onDragOver={(e) => onQDragOver(e, i)}
                  onDrop={(e) => onQDrop(e, i)}
                  className={`fp-attr-drag-container${isOver ? ' fp-attr-drag-container--over' : ''}`}
                >
                  <div className={`fp-attr-row${isDragging ? ' fp-attr-row--dragging' : ''}`}>
                    <span
                      draggable
                      onDragStart={() => onQDragStart(i)}
                      onDragEnd={onQDragEnd}
                      className="fp-attr-drag-handle"
                    >
                      <FPDragHandle />
                    </span>
                    <span className="fp-attr-label-wrap">
                      {attr.label}
                      {attr.sub && <span className="fp-attr-sub-text"> · {attr.sub}</span>}
                    </span>
                    <button
                      onClick={() => startEdit(attr)}
                      className="fp-attr-icon-btn"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      onClick={() => deleteAttr(attr.id)}
                      disabled={liveAttrs.length <= 1}
                      className="fp-attr-delete-btn"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                  {isEditing && (
                    <div className="fp-attr-edit-form">
                      <input
                        autoFocus
                        value={editingLabel}
                        onChange={e => setEditingLabel(e.target.value)}
                        className="fp-attr-edit-input"
                      />
                      <div className="fp-attr-edit-actions">
                        <button onClick={() => setEditingId(null)} className="fp-attr-edit-cancel">Cancel</button>
                        <button onClick={applyEdit} className="fp-attr-edit-apply">Apply</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Saved Settings */}
        {settingsView && tab === 'saved' && (
          <div className="fp-saved-settings">
            <div className="fp-saved-settings__header">
              <span className="fp-saved-settings__title">Recent Filters</span>
              <div className="fp-saved-settings__divider" />
              <FPStepper value={liveSaved.count} onChange={(v) => setPendingSaved({ ...liveSaved, count: v })} />
            </div>
            {liveSavedItems.map((item, i) => {
              const isDragging = sdragIdx === i;
              const isOver = sdragOver === i && sdragIdx !== i;
              return (
                <div
                  key={item.id}
                  onDragOver={(e) => onSDragOver(e, i)}
                  onDrop={(e) => onSDrop(e, i)}
                  className={`fp-saved-drag-row${isOver ? ' fp-saved-drag-row--over' : ''}`}
                >
                  <div className={`fp-saved-drag-inner${isDragging ? ' fp-saved-drag-inner--dragging' : ''}`}>
                    <span
                      draggable
                      onDragStart={() => onSDragStart(i)}
                      onDragEnd={onSDragEnd}
                      className="fp-saved-drag-handle"
                    >
                      <FPDragHandle />
                    </span>
                    <div className="fp-saved-drag-card">
                      <div className="fp-saved-drag-card__body">
                        <div className="fp-saved-drag-card__content">
                          <div className="fp-saved-drag-card__name-col">
                            <span className="fp-saved-drag-card__name">{item.name}</span>
                            <span className="fp-saved-drag-card__desc">{item.desc}</span>
                          </div>
                          <div className="fp-saved-drag-card__meta">
                            <span className="fp-saved-drag-card__meta-text">{item.author}</span>
                            <span className="fp-saved-drag-card__meta-dot" />
                            <span className="fp-saved-drag-card__meta-text">{item.visibility}</span>
                            <span className="fp-saved-drag-card__meta-dot" />
                            <span className="fp-saved-drag-card__meta-text">{item.count} filters</span>
                          </div>
                        </div>
                        {item.pinned && (
                          <img src="assets/icons/pin.svg" width={16} height={16} alt="" className="fp-saved-drag-card__pin" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Saved Filters view */}
        {!settingsView && tab === 'saved' && (
          <div className="fp-saved-view">
            <div className="fp-saved-view__search-row">
              <div className="fp-saved-view__search-wrap">
                <DSPillSearch value={savedSearch} onChange={setSavedSearch} placeholder="Search Saved Filters" width="100%" />
              </div>
              <button className="fp-view-all-btn">
                View all
                <img src="assets/icons/explore.svg" width={16} height={16} alt="" />
              </button>
            </div>
            <div className="fp-saved-section">
              <div className="fp-saved-section__header">
                <span className="fp-saved-section__title">Recent Filters</span>
                <div className="fp-saved-section__divider" />
              </div>
              {filteredSaved.map(item => (
                <FPSavedCard
                  key={item.id}
                  item={item}
                  selected={selectedSavedId === item.id}
                  applied={appliedSavedId === item.id}
                  onSelect={() => setSelectedSavedId(id => id === item.id ? null : item.id)}
                />
              ))}
              {filteredSaved.length === 0 && (
                <p className="fp-no-results">No saved filters found.</p>
              )}
            </div>
          </div>
        )}

        {/* Quick Filters view */}
        {!settingsView && tab === 'quick' && (
          <div>
            <div className="fp-quick-search-wrap">
              <DSPillSearch value={search} onChange={setSearch} placeholder="Search Quick Filters" width="100%" />
            </div>
            {filteredAttrs.map((attr) => {
              const isOpen  = expanded.has(attr.id);
              const sel     = selections[attr.id] || new Set();
              const gSrch   = groupSearch[attr.id] || '';
              const allOpts = attr.options?.filter(o => !gSrch || o.toLowerCase().includes(gSrch.toLowerCase())) ?? [];
              const visible = showAll[attr.id] ? allOpts : allOpts.slice(0, SHOW_LIMIT);
              const allChk  = allOpts.length > 0 && allOpts.every(o => sel.has(o));
              const someChk = allOpts.some(o => sel.has(o)) && !allChk;
              const rangeVal  = rangeSelections[attr.id];
              const rangeFrom = rangeVal?.from ?? attr.min;
              const rangeTo   = rangeVal?.to   ?? attr.max;
              const rangeActive = attr.type === 'range' && (rangeFrom !== attr.min || rangeTo !== attr.max);
              const hasContent = attr.type === 'range' || (attr.options?.length ?? 0) > 0;
              return (
                <div key={attr.id} className="fp-attr-group">
                  <button onClick={() => toggleExpanded(attr.id)} className="fp-attr-group__btn">
                    <span className="fp-attr-group__icon"><FPAttrIcon icon={attr.icon} size={16} /></span>
                    <span className="fp-attr-group__label">
                      {attr.label}
                      {attr.sub && (
                        <FPSubTooltip sub={attr.sub}>
                          <span className="fp-attr-group__sub-text"> · {attr.sub}</span>
                        </FPSubTooltip>
                      )}
                      {(sel.size > 0 || rangeActive) && (
                        <span className="fp-attr-group__badge">{rangeActive ? 1 : sel.size}</span>
                      )}
                    </span>
                    <span className={`fp-chevron${isOpen ? ' fp-chevron--open' : ''}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </span>
                  </button>
                  {isOpen && hasContent && (
                    <div className="fp-options">
                      {attr.type === 'range' ? (
                        <FPRangeSlider
                          min={attr.min} max={attr.max}
                          from={rangeFrom} to={rangeTo}
                          onChange={(f, t) => setRangeSelections(p => ({ ...p, [attr.id]: { from: f, to: t } }))}
                        />
                      ) : (
                        <>
                          {attr.modes && (
                            <FPModeBar
                              modes={attr.modes}
                              value={attrModes[attr.id] || 'OR'}
                              onChange={m => setAttrModes(p => ({ ...p, [attr.id]: m }))}
                            />
                          )}
                          <div className="fp-options__search-row">
                            <div className="fp-options__search-wrap">
                              <DSPillSearch value={gSrch} onChange={v => setGroupSearch(p => ({ ...p, [attr.id]: v }))} placeholder={`Search ${attr.label}`} width="100%" />
                            </div>
                            <div className="fp-options__sort">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--pai-fg3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/></svg>
                              <span className="fp-options__sort-label">A-Z</span>
                            </div>
                          </div>
                          {attr.patternSearch && (
                            <p className="fp-pattern-warning">
                              Selection limited to a maximum of 100 values, but you can still search with pattern
                            </p>
                          )}
                          <label className="fp-option-label fp-option-label--bold">
                            <FPCheckbox checked={allChk} indeterminate={someChk} onChange={() => toggleSelectAll(attr)} />
                            Select All
                          </label>
                          {visible.map(opt => (
                            <label key={opt} className="fp-option-label fp-option-label--normal">
                              <FPCheckbox checked={sel.has(opt)} onChange={() => toggleOption(attr.id, opt)} />
                              {opt}
                            </label>
                          ))}
                          {allOpts.length > SHOW_LIMIT && (
                            <button
                              onClick={() => setShowAll(p => ({ ...p, [attr.id]: !p[attr.id] }))}
                              className="fp-show-more-btn"
                            >
                              {showAll[attr.id] ? 'Show Less' : 'Show All'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fp-footer">
        {settingsView ? (
          <div className="fp-footer__row">
            <button onClick={() => exitSettings(false)} className="fp-footer-btn fp-footer-btn--outline">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Reset changes
            </button>
            <button onClick={() => exitSettings(true)} className="fp-footer-btn fp-footer-btn--primary">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Save changes
            </button>
          </div>
        ) : (
          <div className="fp-footer__row">
            <button onClick={handleReset} className="fp-footer-btn fp-footer-btn--danger">
              <span className="fp-mask-icon" />
              Reset
            </button>
            <button onClick={handleApply} className="fp-footer-btn fp-footer-btn--primary">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Apply
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { FilterPanel, GraphFilterDrawer };
