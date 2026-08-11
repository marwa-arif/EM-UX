import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { createPortal } from 'react-dom'
import { DSPillSearch } from '../context/WorkspaceCtx.jsx'
import { useSavedFilters } from '../context/SavedFiltersCtx.jsx'
import { useToast } from '../context/ToastCtx.jsx'
import SegmentedTabs from './SegmentedTabs.jsx'
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

const GF_ENABLED_PAGES = new Set([
  'kg',
  'exposure/overview', 'exposure/findings',
  'discover/device', 'discover/cloud', 'discover/identity',
  'report/compliance', 'report/assessments', 'report/compliance-matrix', 'report/compliance-findings',
]);
function isGraphFilterEnabled(pageId) {
  return GF_ENABLED_PAGES.has(pageId);
}

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
  { id: 'netIface',     label: 'Network Interface',    file: 'entity-network-interface.svg', color: '#BA3D8C', tint: '#F6E6F0', stroke: '#E3B1D1', count: 3303     },
];

const GF_DEFAULT_SHOWN = GF_ENTITIES.map(e => e.id);

const SHOW_LIMIT = 8;

// ── Graph filter relation map & attribute data ────────────────────────────────

const ENTITY_RELATIONS = {
  host:         ['host', 'finding', 'vulnerability', 'network', 'storage', 'cluster', 'netIface', 'application'],
  storage:      ['host', 'finding', 'cluster'],
  cluster:      ['host', 'storage', 'container', 'finding'],
  identity:     ['identity', 'person', 'account', 'finding', 'host'],
  network:      ['host', 'netSvc', 'netIface', 'finding'],
  finding:      ['host', 'identity', 'vulnerability', 'assessment', 'storage', 'cluster', 'container', 'netSvc'],
  account:      ['account', 'identity', 'person', 'group', 'cloudAccount'],
  group:        ['group', 'person', 'account'],
  person:       ['identity', 'account', 'group'],
  application:  ['host', 'finding'],
  vulnerability:['finding', 'host'],
  assessment:   ['finding'],
  container:    ['cluster', 'finding'],
  cloudAccount: ['account', 'host', 'storage'],
  ticket:       ['finding', 'host'],
  netSvc:       ['network', 'finding'],
  netIface:     ['network', 'host'],
};

const GF_ENTITY_ATTRS = {
  identity: [
    { id: 'iden-entity-id',         label: 'Entity ID',            type: 'text',  patternSearch: true },
    { id: 'iden-display-label',     label: 'Display Label',        type: 'text',  patternSearch: true },
    { id: 'iden-type',              label: 'Type',                 type: 'enum',  options: [] },
    { id: 'iden-origin',            label: 'Origin',               type: 'enum',  options: [] },
    { id: 'iden-origin-count',      label: 'Origin (Count)',       type: 'numeric' },
    { id: 'iden-data-feed',         label: 'Data Feed',            type: 'enum',  options: ['AWS Cloudtrail ConsoleLogin','AWS IAM Center','CrowdStrike','MS Active Directory','MS Azure AD Devices','MS Azure AD Sign-in Logs','MS Azure AD User Registration','MS Azure AD Users','MS Defender Device List','MS Intune'], modes: ['AND','OR','EXACT'] },
    { id: 'iden-first-found',       label: 'First Found',          type: 'date' },
    { id: 'iden-first-seen',        label: 'First Seen',           type: 'date' },
    { id: 'iden-account-count',     label: 'Count of Accounts',    type: 'numeric' },
    { id: 'iden-last-found',        label: 'Last Found',           type: 'date' },
    { id: 'iden-last-active',       label: 'Last Active',          type: 'date' },
    { id: 'iden-activity-status',   label: 'Activity Status',      type: 'enum',  options: [] },
    { id: 'iden-lifetime',          label: 'Lifetime',             type: 'numeric' },
    { id: 'iden-recent-activity',   label: 'Recent Activity',      type: 'numeric' },
    { id: 'iden-completeness-score',label: 'Completeness Quality Score', type: 'range', min: 0, max: 100 },
    { id: 'iden-observed-lifetime', label: 'Observed Lifetime',    type: 'numeric' },
    { id: 'iden-recency',           label: 'Recency',              type: 'numeric' },
    { id: 'iden-description',       label: 'Description',          type: 'text',  patternSearch: true },
    { id: 'iden-business-unit',     label: 'Business Unit',        type: 'text',  patternSearch: true, modes: ['AND','OR','EXACT'] },
    { id: 'iden-location-country',  label: 'Location Country',     type: 'enum',  options: [] },
    { id: 'iden-location-city',     label: 'Location City',        type: 'enum',  options: [] },
    { id: 'iden-department',        label: 'Department',           type: 'text',  patternSearch: true },
    { id: 'iden-fragments',         label: 'Fragments',            type: 'text',  patternSearch: true },
    { id: 'iden-origin-contribution',label: 'Origin Contribution Type', type: 'enum', options: [] },
    { id: 'iden-identity-format',   label: 'Identity Format',      type: 'enum',  options: [] },
    { id: 'iden-ownership',         label: 'Ownership',            type: 'enum',  options: [] },
    { id: 'iden-identity-provider', label: 'Identity Provider',    type: 'enum',  options: [] },
    { id: 'iden-mfa-enabled',       label: 'Is MFA Enabled',       type: 'boolean' },
    { id: 'iden-aad-id',            label: 'AAD ID',               type: 'text',  patternSearch: true },
    { id: 'iden-email-id',          label: 'Email ID',             type: 'text',  patternSearch: true },
    { id: 'iden-employee-id',       label: 'Employee ID',          type: 'text',  patternSearch: true },
    { id: 'iden-identity-with-idp', label: 'Identity with IDP',    type: 'text',  patternSearch: true },
    { id: 'iden-upn',               label: 'User Principal Name',  type: 'text',  patternSearch: true },
    { id: 'iden-last-login',        label: 'Last Login',           type: 'date' },
    { id: 'iden-last-pw-change',    label: 'Last Password Change', type: 'date' },
    { id: 'iden-operational-status',label: 'Operational Status',   type: 'enum',  options: [] },
    { id: 'iden-account-never-expire',   label: 'Account Never Expire',   type: 'boolean' },
    { id: 'iden-pw-not-required',        label: 'Password Not Required',  type: 'boolean' },
    { id: 'iden-passwordless-capable',   label: 'Passwordless Capable',   type: 'boolean' },
    { id: 'iden-pw-never-expire',        label: 'Password Never Expire',  type: 'boolean' },
    { id: 'iden-last-pw-used',           label: 'Last Password Used Date', type: 'date' },
    { id: 'iden-successful-login-loc',   label: 'Successful Login Location',    type: 'text',  patternSearch: true },
    { id: 'iden-internal-service',       label: 'Internal Service',             type: 'boolean' },
    { id: 'iden-last-signin-attempt',    label: 'Last Signin Attempt',          type: 'date' },
    { id: 'iden-multi-location-flag',    label: 'Multiple Location Access Flag', type: 'boolean' },
    { id: 'iden-locations-one-day',      label: 'Locations Accessed In One Day', type: 'numeric' },
    { id: 'iden-sspr-registered',        label: 'Is SSPR Registered',           type: 'boolean' },
    { id: 'iden-auth-methods',           label: 'Authentication Methods Registered', type: 'enum',  options: [] },
    { id: 'iden-default-mfa',            label: 'Default MFA Method',           type: 'enum',  options: [] },
    { id: 'iden-ad-last-sync',           label: 'AD Last Sync Date',            type: 'date' },
    { id: 'iden-aad-created',            label: 'AAD Created',                  type: 'date' },
    { id: 'iden-ad-distinguished-name',  label: 'AD Distinguished Name',        type: 'text',  patternSearch: true },
    { id: 'iden-ad-domain',              label: 'AD Domain',                    type: 'text',  patternSearch: true },
    { id: 'iden-ad-sam-with-domain',     label: 'AD SAM Account Name With Domain', type: 'text', patternSearch: true },
    { id: 'iden-ad-sam-type',            label: 'AD SAM Account Type',          type: 'enum',  options: [] },
    { id: 'iden-ad-created',             label: 'AD Created',                   type: 'date' },
    { id: 'iden-aws-created',            label: 'AWS Created Date',             type: 'date' },
    { id: 'iden-auth-factors',           label: 'Authentication Factors',       type: 'enum',  options: ['MFA Enabled'], modes: ['AND','OR','EXACT'] },
    { id: 'iden-mdm-enrolled',           label: 'MDM Enrolled',                 type: 'boolean' },
    { id: 'iden-mdm-last-sync',          label: 'MDM Last Sync',                type: 'date' },
    { id: 'iden-sf-recruited-date',      label: 'SuccessFactors Recruited Date', type: 'date' },
    { id: 'iden-active-login-status',    label: 'Active Login Status',          type: 'enum',  options: [] },
    { id: 'iden-pw-rotation-compliant',  label: 'Password Rotation Compliant',  type: 'boolean' },
    { id: 'iden-pw-rotation-duration',   label: 'Password Rotation Compliant Duration', type: 'numeric' },
    { id: 'iden-active-login-duration',  label: 'Active User Login Duration',   type: 'numeric' },
    { id: 'iden-asset-criticality',      label: 'Asset Criticality',            type: 'enum',  options: [] },
    { id: 'iden-asset-crit-score',       label: 'Asset Criticality Score',      type: 'range', min: 1, max: 1000 },
    { id: 'iden-exposure-score',         label: 'Exposure Score',               type: 'range', min: 100, max: 550 },
    { id: 'iden-exposure-severity',      label: 'Exposure Severity',            type: 'enum',  options: [] },
    { id: 'iden-attack-surface',         label: 'Attack Surface',               type: 'enum',  options: ['Cloud'] },
    { id: 'iden-source-of-data',         label: 'Source of the Data',           type: 'enum',  options: ['SIT'] },
    { id: 'iden-cs-detection-id',        label: 'CrowdStrike Detection ID',     type: 'text',  patternSearch: true },
    { id: 'iden-cs-detection-severity',  label: 'CrowdStrike Detection Severity', type: 'enum', options: ['Critical'], modes: ['AND','OR','EXACT'] },
    { id: 'iden-cs-indicator-type',      label: 'CrowdStrike Indicator Type',   type: 'text',  patternSearch: true },
    { id: 'iden-cs-indicator-value',     label: 'CrowdStrike Indicator Value',  type: 'text',  patternSearch: true },
    { id: 'iden-cs-dlp-policy',          label: 'CrowdStrike DLP Policy Triggered',   type: 'boolean' },
    { id: 'iden-cs-assigned-to',         label: 'CrowdStrike Detection Assigned To',  type: 'text', patternSearch: true },
    { id: 'iden-cs-tactic',              label: 'CrowdStrike Detection Tactic',        type: 'text', patternSearch: true },
    { id: 'iden-cs-technique',           label: 'CrowdStrike Detection Technique',     type: 'text', patternSearch: true },
    { id: 'iden-cs-scenario',            label: 'CrowdStrike Detection Scenario',      type: 'text', patternSearch: true },
    { id: 'iden-cs-objective',           label: 'CrowdStrike Detection Objective',     type: 'text', patternSearch: true },
    { id: 'iden-cs-ioc-type',            label: 'CrowdStrike IOC Type',                type: 'text', patternSearch: true },
    { id: 'iden-cs-ioc-value',           label: 'CrowdStrike IOC Value',               type: 'text', patternSearch: true },
    { id: 'iden-cs-files-accessed',      label: 'CrowdStrike Detection Files Accessed', type: 'text', patternSearch: true },
  ],
  host: [
    { id: 'aad-created',               label: 'AAD Created',                    type: 'date'   },
    { id: 'aad-deleted-date',          label: 'AAD Deleted Date',               type: 'date'   },
    { id: 'aad-device-category',       label: 'AAD Device Category',            type: 'enum',  options: ['(empty)', 'Test E8'] },
    { id: 'aad-device-id',             label: 'AAD Device ID',                  type: 'text',  valueCount: 45498, patternSearch: true, modes: ['AND','OR','EXACT'] },
    { id: 'aad-enrolled',              label: 'AAD Enrolled',                   type: 'boolean' },
    { id: 'aad-management-service',    label: 'AAD Management Service',         type: 'enum',  options: ['(empty)', 'ClientCertificateAuth', 'ConfigMgr', 'MDM', 'MicrosoftSense', 'SCEP'] },
    { id: 'aad-management-status',     label: 'AAD Management Status',          type: 'enum',  options: ['false', 'true'] },
    { id: 'aad-system-label',          label: 'AAD System Label',               type: 'text'   },
    { id: 'accessibility',             label: 'Accessibility',                  type: 'enum',  options: ['(empty)', 'External', 'Internal'] },
    { id: 'account-id',               label: 'Account ID',                     type: 'text',  modes: ['AND','OR','EXACT'], valueCount: 8 },
    { id: 'active-blocking-mode',      label: 'Active Blocking Mode',           type: 'enum',  options: ['(empty)', 'false', 'true'] },
    { id: 'active-blocking-status',    label: 'Active Blocking Status',         type: 'enum',  options: [] },
    { id: 'active-operational-date',   label: 'Active Operational Date',        type: 'date'   },
    { id: 'active-owner-count',        label: 'Active Owner Count',             type: 'range', min: 0, max: 100 },
    { id: 'activity-status',           label: 'Activity Status',                type: 'enum',  options: ['Active'] },
    { id: 'ad-account-disabled-date',  label: 'AD Account Disabled Date',       type: 'date'   },
    { id: 'ad-created',               label: 'AD Created',                     type: 'date'   },
    { id: 'ad-distinguished-name',     label: 'AD Distinguished Name',          type: 'text'   },
    { id: 'ad-last-sync-date',         label: 'AD Last Sync Date',              type: 'date'   },
    { id: 'ad-object-guid',            label: 'AD ObjectGUID',                  type: 'text'   },
    { id: 'ad-operational-status',     label: 'AD Operational Status',          type: 'enum',  options: [] },
    { id: 'ad-uac-compliance-status',  label: 'AD UAC Compliance Status',       type: 'enum',  options: [] },
    { id: 'ad-user-account-control',   label: 'AD User Account Control',        type: 'text'   },
    { id: 'aggregated-quality-score',  label: 'Aggregated Quality Score',       type: 'range', min: 23.2143, max: 54.1667 },
    { id: 'asset-compliance-scope',    label: 'Asset Compliance Scope',         type: 'enum',  options: [] },
    { id: 'asset-criticality',         label: 'Asset Criticality',              type: 'enum',  options: ['Critical', 'High', 'Low', 'Medium'] },
    { id: 'asset-criticality-score',   label: 'Asset Criticality Score',        type: 'range', min: 0, max: 100 },
    { id: 'asset-role',                label: 'Asset Role',                     type: 'enum',  options: [] },
    { id: 'attack-surface',            label: 'Attack Surface',                 type: 'enum',  options: [] },
    { id: 'av-block-malicious-status', label: 'AV Block Malicious Code Status', type: 'enum',  options: [] },
    { id: 'av-last-scan-date',         label: 'AV Last Scan Date',              type: 'date'   },
    { id: 'av-scan-sla-breach',        label: 'AV Scan SLA Breach Duration',    type: 'range', min: 0, max: 1000 },
    { id: 'is-inventoried',            label: 'Is Inventoried',                 type: 'boolean' },
    { id: 'security-posture-score',    label: 'Security Posture Score',         type: 'range', min: 0, max: 100 },
  ],
  finding: [
    { id: 'find-entity-id',          label: 'Entity ID',            type: 'text',  patternSearch: true },
    { id: 'find-display-label',      label: 'Display Label',        type: 'text',  patternSearch: true },
    { id: 'find-type',               label: 'Type',                 type: 'enum',  options: [] },
    { id: 'find-origin',             label: 'Origin',               type: 'enum',  options: [] },
    { id: 'find-origin-count',       label: 'Origin (Count)',       type: 'numeric' },
    { id: 'find-data-feed',          label: 'Data Feed',            type: 'enum',  options: [], modes: ['AND','OR','EXACT'] },
    { id: 'find-first-found',        label: 'First Found',          type: 'date' },
    { id: 'find-first-seen',         label: 'First Seen',           type: 'date' },
    { id: 'find-last-found',         label: 'Last Found',           type: 'date' },
    { id: 'find-last-active',        label: 'Last Active',          type: 'date' },
    { id: 'find-activity-status',    label: 'Activity Status',      type: 'enum',  options: [] },
    { id: 'find-lifetime',           label: 'Lifetime',             type: 'numeric' },
    { id: 'find-recent-activity',    label: 'Recent Activity',      type: 'numeric' },
    { id: 'find-completeness-score', label: 'Completeness Quality Score',          type: 'range', min: 0, max: 100 },
    { id: 'find-aggregated-score',   label: 'Aggregated Quality Score',            type: 'range', min: 0, max: 100 },
    { id: 'find-score-category',     label: 'Completeness Quality Score Category', type: 'enum',  options: [] },
    { id: 'find-observed-lifetime',  label: 'Observed Lifetime',    type: 'numeric' },
    { id: 'find-recency',            label: 'Recency',              type: 'numeric' },
    { id: 'find-description',        label: 'Description',          type: 'enum',  options: [], valueCount: 106, patternSearch: true },
    { id: 'find-business-unit',      label: 'Business Unit',        type: 'text',  patternSearch: true, modes: ['AND','OR','EXACT'] },
    { id: 'find-location-country',   label: 'Location Country',     type: 'enum',  options: [] },
    { id: 'find-location-city',      label: 'Location City',        type: 'enum',  options: [] },
    { id: 'find-department',         label: 'Department',           type: 'text',  patternSearch: true },
    { id: 'find-fragments',          label: 'Fragments',            type: 'text',  patternSearch: true },
    { id: 'find-origin-contribution',label: 'Origin Contribution Type',            type: 'enum',  options: [] },
    { id: 'find-assessment',         label: 'Assessment',           type: 'enum',  options: [], valueCount: 106, patternSearch: true },
    { id: 'find-sub-type',           label: 'Finding Sub Type',     type: 'enum',  options: [] },
    { id: 'find-status',             label: 'Status',               type: 'enum',  options: [] },
    { id: 'find-cloud-vendor-sev',   label: 'Cloud Vendor Severity', type: 'enum', options: [] },
    { id: 'find-assoc-entities',     label: 'Associated Entities Display Label', type: 'text', patternSearch: true },
    { id: 'find-resolved-date',      label: 'Resolved Date',        type: 'date' },
    { id: 'find-assessment-id',      label: 'Assessment ID',        type: 'text',  patternSearch: true },
    { id: 'find-exposure-category',  label: 'Exposure Category',    type: 'enum',  options: [] },
    { id: 'find-sla-breach-duration',label: 'Finding SLA Breach Duration',  type: 'numeric' },
    { id: 'find-sla-resolved-status',label: 'Finding SLA Resolved Status',  type: 'enum',  options: [] },
    { id: 'find-asmt-weightage',     label: 'Assessment Weightage', type: 'range', min: 0, max: 100 },
    { id: 'find-asmt-severity',      label: 'Assessment Severity',  type: 'enum',  options: [] },
    { id: 'find-exposure-severity',  label: 'Exposure Severity',    type: 'enum',  options: [] },
    { id: 'find-reopened-date',      label: 'Finding Reopened Date', type: 'date' },
    { id: 'find-exposure-score',     label: 'Exposure Score',       type: 'range', min: 100, max: 550 },
    { id: 'find-likelihood',         label: 'Likelihood',           type: 'enum',  options: [] },
    { id: 'find-impact',             label: 'Impact',               type: 'enum',  options: [] },
    { id: 'find-contributed-to',     label: 'Contributed To',       type: 'enum',  options: [] },
    { id: 'find-scope-entity',       label: 'Scope Entity',         type: 'enum',  options: [] },
    { id: 'find-finding-source',     label: 'Finding Source',       type: 'enum',  options: [] },
    { id: 'find-evidence',           label: 'Evidence',             type: 'text',  patternSearch: true },
    { id: 'find-vuln-breach-dur',    label: 'Vulnerability Breach Duration',            type: 'numeric' },
    { id: 'find-vuln-patch-sla',     label: 'Vulnerability Patch SLA Breach Status',    type: 'boolean' },
    { id: 'find-vuln-sw-vendor',     label: 'Vulnerability Software Vendor',            type: 'text',  patternSearch: true, modes: ['AND','OR','EXACT'] },
    { id: 'find-vuln-sw-product',    label: 'Vulnerability Software Product',           type: 'text',  patternSearch: true, modes: ['AND','OR','EXACT'] },
    { id: 'find-vuln-software',      label: 'Vulnerability Software',                   type: 'text',  patternSearch: true },
    { id: 'find-vuln-title',         label: 'Vulnerability Title',  type: 'enum',  options: [], valueCount: 28852, patternSearch: true },
    { id: 'find-vuln-exploit',       label: 'Vulnerability Exploit Available',          type: 'boolean' },
    { id: 'find-vuln-patch',         label: 'Vulnerability Patch Available',            type: 'boolean' },
    { id: 'find-vuln-exploitability',label: 'Vulnerability Exploitability',             type: 'enum',  options: [] },
    { id: 'find-vuln-cvss31-score',  label: 'Vulnerability CVSSv3.1 Score',             type: 'range', min: 0, max: 10 },
    { id: 'find-vuln-cvss31-sev',    label: 'Vulnerability CVSSv3.1 Severity',          type: 'enum',  options: [] },
    { id: 'find-vuln-type',          label: 'Vulnerability Type',   type: 'enum',  options: [] },
    { id: 'find-source-of-data',     label: 'Source of the Data',   type: 'enum',  options: ['SIT'] },
  ],
  vulnerability: [
    { id: 'vuln-entity-id',       label: 'Entity ID',            type: 'text',  valueCount: 55700, patternSearch: true },
    { id: 'vuln-display-label',   label: 'Display Label',        type: 'text',  valueCount: 55696, patternSearch: true },
    { id: 'vuln-type',            label: 'Type',                 type: 'enum',  options: ['Informational', 'Vulnerability', 'Weakness'] },
    { id: 'vuln-origin',          label: 'Origin',               type: 'enum',  options: ['CISA Known Exploited Vulnerabilities', 'CISA Vulnrichment', 'EPSS', 'MS Defender', 'NVD', 'Qualys', 'Tenable.sc', 'Wiz'], modes: ['AND','OR','EXACT'] },
    { id: 'vuln-origin-count',    label: 'Origin (Count)',        type: 'range', min: 1, max: 8 },
    { id: 'vuln-data-feed',       label: 'Data Feed',            type: 'enum',  options: ['CISA Known Exploited Vulnerabilities', 'CISA Vulnrichment', 'EPSS', 'MS Defender', 'NVD', 'Qualys Host Vulnerability', 'Qualys KnowledgeBase', 'Tenable.sc', 'Wiz'], modes: ['AND','OR','EXACT'] },
    { id: 'vuln-first-found',     label: 'First Found',          type: 'date' },
    { id: 'vuln-first-seen',      label: 'First Seen',           type: 'date' },
    { id: 'vuln-last-found',      label: 'Last Found',           type: 'date' },
    { id: 'vuln-last-active',     label: 'Last Active',          type: 'date' },
    { id: 'vuln-activity-status', label: 'Activity Status',      type: 'enum',  options: ['Active', 'Inactive'] },
    { id: 'vuln-lifetime',        label: 'Lifetime',             type: 'range', min: 0, max: 618 },
    { id: 'vuln-recent-activity', label: 'Recent Activity',      type: 'range', min: 0, max: 365 },
    { id: 'vuln-completeness-qs', label: 'Completeness Quality Score',          type: 'range', min: 0, max: 100 },
    { id: 'vuln-aggregated-qs',   label: 'Aggregated Quality Score',            type: 'range', min: 0, max: 100 },
    { id: 'vuln-completeness-qsc',label: 'Completeness Quality Score Category', type: 'enum',  options: ['High', 'Low', 'Medium'] },
    { id: 'vuln-observed-lifetime',label: 'Observed Lifetime',   type: 'range', min: 0, max: 165 },
    { id: 'vuln-recency',         label: 'Recency',              type: 'range', min: 0, max: 165 },
    { id: 'vuln-description',     label: 'Description',          type: 'text',  valueCount: 50392, patternSearch: true, modes: ['AND','OR','EXACT'] },
    { id: 'vuln-business-unit',   label: 'Business Unit',        type: 'text',  patternSearch: true },
    { id: 'vuln-location-country',label: 'Location Country',     type: 'text',  patternSearch: true },
    { id: 'vuln-location-city',   label: 'Location City',        type: 'text',  patternSearch: true },
    { id: 'vuln-department',      label: 'Department',           type: 'text',  patternSearch: true },
    { id: 'vuln-fragments',       label: 'Fragments',            type: 'text',  patternSearch: true },
    { id: 'vuln-count-hosts-open',label: 'Count of Hosts with Open Vulnerability Findings',         type: 'range', min: 0, max: 1000 },
    { id: 'vuln-count-container', label: 'Count of Container with Vulnerability Findings',          type: 'range', min: 0, max: 1000 },
    { id: 'vuln-count-app',       label: 'Count of Application with Vulnerability Findings',        type: 'range', min: 0, max: 1000 },
    { id: 'vuln-count-app-open',  label: 'Count of Application with Open Vulnerability Findings',   type: 'range', min: 0, max: 1000 },
    { id: 'vuln-origin-contrib',  label: 'Origin Contribution Type',    type: 'enum',  options: ['Corroborated', 'Unique'] },
    { id: 'vuln-severity',        label: 'Vulnerability Severity',      type: 'enum',  options: ['Critical', 'High', 'Medium', 'Low', 'Informational'] },
    { id: 'vuln-cvss-normalised', label: 'CVSS Normalised',             type: 'range', min: 0, max: 10 },
    { id: 'vuln-exploitability',  label: 'Exploitability',              type: 'range', min: 0, max: 10 },
    { id: 'vuln-title',           label: 'Title',                       type: 'text',  patternSearch: true, modes: ['AND','OR','EXACT'] },
    { id: 'vuln-cve-id',          label: 'CVE ID',                      type: 'text',  patternSearch: true },
    { id: 'vuln-cvssv4-score',    label: 'CVSSv4.0 Score',              type: 'range', min: 0, max: 10 },
    { id: 'vuln-cvssv4-severity', label: 'CVSSv4.0 Severity',           type: 'enum',  options: ['Critical', 'High', 'Medium', 'Low', 'None'] },
    { id: 'vuln-cvssv31-score',   label: 'CVSSv3.1 Score',              type: 'range', min: 0, max: 10 },
    { id: 'vuln-cvssv31-vector',  label: 'CVSSv3.1 Vector',             type: 'text',  patternSearch: true },
    { id: 'vuln-cvssv31-severity',label: 'CVSSv3.1 Severity',           type: 'enum',  options: ['Critical', 'High', 'Medium', 'Low', 'None'] },
    { id: 'vuln-cvssv31-exploit', label: 'CVSSv3.1 Exploitability',     type: 'range', min: 0, max: 10 },
    { id: 'vuln-cvssv31-impact',  label: 'CVSSv3.1 Impact Score',       type: 'range', min: 0, max: 10 },
    { id: 'vuln-cvssv30-score',   label: 'CVSSv3.0 Score',              type: 'range', min: 0, max: 10 },
    { id: 'vuln-cvssv30-temporal',label: 'CVSSv3.0 Temporal Score',     type: 'range', min: 0, max: 10 },
    { id: 'vuln-cvssv30-vector',  label: 'CVSSv3.0 Vector',             type: 'text',  patternSearch: true },
    { id: 'vuln-cvssv30-severity',label: 'CVSSv3.0 Severity',           type: 'enum',  options: ['Critical', 'High', 'Medium', 'Low', 'None'] },
    { id: 'vuln-cvssv30-exploit', label: 'CVSSv3.0 Exploitability',     type: 'range', min: 0, max: 10 },
    { id: 'vuln-cvssv30-impact',  label: 'CVSSv3.0 Impact Score',       type: 'range', min: 0, max: 10 },
    { id: 'vuln-cvssv2-score',    label: 'CVSSv2 Score',                type: 'range', min: 0, max: 10 },
    { id: 'vuln-cvssv2-severity', label: 'CVSSv2 Severity',             type: 'enum',  options: ['High', 'Medium', 'Low'] },
    { id: 'vuln-cvssv2-exploit',  label: 'CVSSv2 Exploitability',       type: 'range', min: 0, max: 10 },
    { id: 'vuln-cvssv2-impact',   label: 'CVSSv2 Impact Score',         type: 'range', min: 0, max: 10 },
    { id: 'vuln-first-observed',  label: 'Vulnerability First Observed',type: 'date' },
    { id: 'vuln-last-modified',   label: 'Last Modified',               type: 'date' },
    { id: 'vuln-published-on',    label: 'Published On',                type: 'date' },
    { id: 'vuln-vendor-severity', label: 'Vendor Severity',             type: 'enum',  options: ['Critical', 'High', 'Medium', 'Low', 'Informational'] },
    { id: 'vuln-patch-available', label: 'Patch Available',             type: 'boolean' },
    { id: 'vuln-exploit-available',label: 'Exploit Available',          type: 'boolean' },
    { id: 'vuln-recommendation',  label: 'Recommendation',              type: 'text',  valueCount: 19451, patternSearch: true, modes: ['AND','OR','EXACT'] },
    { id: 'vuln-ms-update',       label: 'Microsoft Recommended Update',    type: 'text', patternSearch: true },
    { id: 'vuln-ms-update-id',    label: 'Microsoft Recommended Update ID', type: 'text', patternSearch: true },
  ],
  storage: [
    { id: 'stor-entity-id',        label: 'Entity ID',            type: 'text',  valueCount: 5541, patternSearch: true },
    { id: 'stor-display-label',    label: 'Display Label',        type: 'text',  valueCount: 5527, patternSearch: true },
    { id: 'stor-type',             label: 'Type',                 type: 'enum',  options: ['Bucket', 'File System Service', 'Storage Account', 'Table Service', 'Volume'] },
    { id: 'stor-origin',           label: 'Origin',               type: 'enum',  options: ['AWS', 'MS Azure'], modes: ['AND','OR','EXACT'] },
    { id: 'stor-origin-count',     label: 'Origin (Count)',        type: 'range', min: 1, max: 1 },
    { id: 'stor-data-feed',        label: 'Data Feed',            type: 'enum',  options: ['AWS Resource Details', 'AWS SH Findings', 'MS Azure Blob Storage Container', 'MS Azure File Share', 'MS Azure Queue Storage', 'MS Azure Resource Details', 'MS Azure Security Resources', 'MS Azure Table Storage'], modes: ['AND','OR','EXACT'] },
    { id: 'stor-first-found',      label: 'First Found',          type: 'date' },
    { id: 'stor-first-seen',       label: 'First Seen',           type: 'date' },
    { id: 'stor-last-found',       label: 'Last Found',           type: 'date' },
    { id: 'stor-last-active',      label: 'Last Active',          type: 'date' },
    { id: 'stor-activity-status',  label: 'Activity Status',      type: 'enum',  options: ['(empty)'] },
    { id: 'stor-lifetime',         label: 'Lifetime',             type: 'range', min: 0, max: 1000 },
    { id: 'stor-recent-activity',  label: 'Recent Activity',      type: 'range', min: 0, max: 365 },
    { id: 'stor-completeness-qs',  label: 'Completeness Quality Score',          type: 'range', min: 0, max: 100 },
    { id: 'stor-aggregated-qs',    label: 'Aggregated Quality Score',            type: 'range', min: 0, max: 100 },
    { id: 'stor-completeness-qsc', label: 'Completeness Quality Score Category', type: 'enum',  options: ['High', 'Low', 'Medium'] },
    { id: 'stor-observed-lifetime',label: 'Observed Lifetime',    type: 'range', min: 0, max: 1000 },
    { id: 'stor-recency',          label: 'Recency',              type: 'range', min: 0, max: 365 },
    { id: 'stor-description',      label: 'Description',          type: 'text',  patternSearch: true },
    { id: 'stor-business-unit',    label: 'Business Unit',        type: 'enum',  options: ['(empty)'] },
    { id: 'stor-location-country', label: 'Location Country',     type: 'text',  patternSearch: true },
    { id: 'stor-location-city',    label: 'Location City',        type: 'enum',  options: ['Mumbai', 'Pune', 'Virginia'] },
    { id: 'stor-department',       label: 'Department',           type: 'text',  patternSearch: true },
    { id: 'stor-fragments',        label: 'Fragments',            type: 'text',  patternSearch: true },
    { id: 'stor-deployment-type',  label: 'Deployment Type',      type: 'text',  patternSearch: true },
    { id: 'stor-origin-contrib',   label: 'Origin Contribution Type', type: 'enum', options: ['Corroborated', 'Unique'] },
    { id: 'stor-cloud-provider',   label: 'Cloud Provider',       type: 'enum',  options: ['AWS', 'MS Azure'] },
    { id: 'stor-account-id',       label: 'Account ID',           type: 'text',  patternSearch: true },
    { id: 'stor-cloud-region',     label: 'Cloud Region',         type: 'text',  patternSearch: true },
    { id: 'stor-k8s-cluster-name', label: 'Kubernetes Cluster Name', type: 'text', patternSearch: true },
    { id: 'stor-cloud-instance-id',label: 'Cloud Instance ID',    type: 'text',  patternSearch: true },
    { id: 'stor-resource-id',      label: 'Resource ID',          type: 'text',  patternSearch: true },
    { id: 'stor-resource-name',    label: 'Resource Name',        type: 'text',  patternSearch: true },
    { id: 'stor-native-type',      label: 'Native Type',          type: 'text',  patternSearch: true },
    { id: 'stor-last-op-state',    label: 'Last Known Operational State', type: 'text', patternSearch: true },
    { id: 'stor-environment',      label: 'Environment',          type: 'text',  patternSearch: true },
    { id: 'stor-provisioning-state',label: 'Provisioning State',  type: 'text',  patternSearch: true },
    { id: 'stor-enc-at-rest',      label: 'Encryption at Rest',   type: 'boolean' },
    { id: 'stor-enc-in-transit',   label: 'Encryption in Transit',type: 'boolean' },
    { id: 'stor-cloud-zone',       label: 'Cloud Zone Availability', type: 'text', patternSearch: true },
    { id: 'stor-active-op-date',   label: 'Active Operational Date', type: 'date' },
    { id: 'stor-billing-tag',      label: 'Billing Tag',          type: 'text',  patternSearch: true },
    { id: 'stor-volume-name',      label: 'Volume Name',          type: 'text',  patternSearch: true },
  ],
  network: [
    { id: 'net-entity-id',         label: 'Entity ID',            type: 'text',  valueCount: 77, patternSearch: true },
    { id: 'net-display-label',     label: 'Display Label',        type: 'text',  patternSearch: true },
    { id: 'net-type',              label: 'Type',                 type: 'text',  patternSearch: true },
    { id: 'net-origin',            label: 'Origin',               type: 'enum',  options: ['AWS', 'MS Azure'], modes: ['AND','OR','EXACT'] },
    { id: 'net-origin-count',      label: 'Origin (Count)',        type: 'range', min: 1, max: 1 },
    { id: 'net-data-feed',         label: 'Data Feed',            type: 'text',  patternSearch: true },
    { id: 'net-first-found',       label: 'First Found',          type: 'date' },
    { id: 'net-first-seen',        label: 'First Seen',           type: 'date' },
    { id: 'net-last-found',        label: 'Last Found',           type: 'date' },
    { id: 'net-last-active',       label: 'Last Active',          type: 'date' },
    { id: 'net-activity-status',   label: 'Activity Status',      type: 'enum',  options: ['(empty)'] },
    { id: 'net-lifetime',          label: 'Lifetime',             type: 'range', min: 0, max: 1000 },
    { id: 'net-recent-activity',   label: 'Recent Activity',      type: 'range', min: 0, max: 365 },
    { id: 'net-completeness-qs',   label: 'Completeness Quality Score',          type: 'range', min: 0, max: 100 },
    { id: 'net-aggregated-qs',     label: 'Aggregated Quality Score',            type: 'range', min: 0, max: 100 },
    { id: 'net-completeness-qsc',  label: 'Completeness Quality Score Category', type: 'enum',  options: ['High', 'Low', 'Medium'] },
    { id: 'net-observed-lifetime', label: 'Observed Lifetime',    type: 'range', min: 0, max: 1000 },
    { id: 'net-recency',           label: 'Recency',              type: 'range', min: 0, max: 365 },
    { id: 'net-business-unit',     label: 'Business Unit',        type: 'enum',  options: ['(empty)'] },
    { id: 'net-location-country',  label: 'Location Country',     type: 'enum',  options: ['(empty)', 'India'] },
    { id: 'net-location-city',     label: 'Location City',        type: 'text',  patternSearch: true },
    { id: 'net-department',        label: 'Department',           type: 'text',  patternSearch: true },
    { id: 'net-fragments',         label: 'Fragments',            type: 'text',  patternSearch: true },
    { id: 'net-resource-name',     label: 'Resource Name',        type: 'text',  patternSearch: true },
    { id: 'net-provisioning-state',label: 'Provisioning State',   type: 'text',  patternSearch: true },
    { id: 'net-resource-id',       label: 'Resource ID',          type: 'text',  patternSearch: true },
    { id: 'net-deployment-type',   label: 'Deployment Type',      type: 'text',  patternSearch: true },
    { id: 'net-environment',       label: 'Environment',          type: 'text',  patternSearch: true },
    { id: 'net-cloud-provider',    label: 'Cloud Provider',       type: 'enum',  options: ['AWS', 'MS Azure'] },
    { id: 'net-account-id',        label: 'Account ID',           type: 'text',  patternSearch: true },
    { id: 'net-cloud-region',      label: 'Cloud Region',         type: 'text',  patternSearch: true },
    { id: 'net-project',           label: 'Project',              type: 'text',  patternSearch: true },
    { id: 'net-mac-address',       label: 'MAC Address',          type: 'text',  patternSearch: true },
    { id: 'net-cidr-block',        label: 'CIDR Block',           type: 'text',  patternSearch: true },
    { id: 'net-count-open-findings',label: 'Count of Open Findings', type: 'range', min: 0, max: 1000 },
    { id: 'net-native-type',       label: 'Native Type',          type: 'text',  patternSearch: true },
    { id: 'net-last-op-state',     label: 'Last Known Operational State', type: 'text', patternSearch: true },
    { id: 'net-ddos-status',       label: 'DDOS Status',          type: 'text',  patternSearch: true },
    { id: 'net-cloud-zone',        label: 'Cloud Zone Availability', type: 'enum', options: ['(empty)', 'Multiple', 'Single'] },
    { id: 'net-available-addr',    label: 'Available Address Count',     type: 'range', min: 0, max: 10000 },
    { id: 'net-default-az',        label: 'Default for Availability Zone', type: 'boolean' },
    { id: 'net-map-public-ip',     label: 'Map Public IP on Launch',      type: 'boolean' },
    { id: 'net-map-customer-ip',   label: 'Map Customer Owned IP on Launch', type: 'boolean' },
    { id: 'net-status',            label: 'Status',               type: 'text',  patternSearch: true },
    { id: 'net-vpc-id',            label: 'VPC ID',               type: 'text',  patternSearch: true },
    { id: 'net-subnet-id',         label: 'Subnet ID',            type: 'text',  patternSearch: true },
    { id: 'net-assign-ipv6',       label: 'Assign IPV6 on Creation', type: 'boolean' },
    { id: 'net-native-ipv6',       label: 'Native IPV6',          type: 'boolean' },
    { id: 'net-origin-contrib',    label: 'Origin Contribution Type', type: 'enum', options: ['Corroborated', 'Unique'] },
    { id: 'net-asset-criticality', label: 'Asset Criticality',    type: 'enum',  options: ['Critical', 'High', 'Medium', 'Low'] },
    { id: 'net-asset-crit-score',  label: 'Asset Criticality Score', type: 'range', min: 1,   max: 1000 },
    { id: 'net-exposure-score',    label: 'Exposure Score',        type: 'range', min: 100, max: 550 },
    { id: 'net-exposure-severity', label: 'Exposure Severity',    type: 'enum',  options: ['Critical', 'High', 'Medium', 'Low'] },
    { id: 'net-attack-surface',    label: 'Attack Surface',       type: 'enum',  options: ['Cloud'] },
    { id: 'net-source-of-data',    label: 'Source of the Data',   type: 'enum',  options: ['SIT'] },
  ],
  assessment: [
    { id: 'asmt-entity-id',        label: 'Entity ID',            type: 'text',  patternSearch: true },
    { id: 'asmt-display-label',    label: 'Display Label',        type: 'text',  patternSearch: true },
    { id: 'asmt-type',             label: 'Type',                 type: 'text',  patternSearch: true },
    { id: 'asmt-origin',           label: 'Origin',               type: 'enum',  options: ['AWS', 'MS Azure'], modes: ['AND','OR','EXACT'] },
    { id: 'asmt-origin-count',     label: 'Origin (Count)',        type: 'range', min: 1, max: 1 },
    { id: 'asmt-data-feed',        label: 'Data Feed',            type: 'text',  patternSearch: true },
    { id: 'asmt-first-found',      label: 'First Found',          type: 'date' },
    { id: 'asmt-first-seen',       label: 'First Seen',           type: 'date' },
    { id: 'asmt-last-found',       label: 'Last Found',           type: 'date' },
    { id: 'asmt-last-active',      label: 'Last Active',          type: 'date' },
    { id: 'asmt-activity-status',  label: 'Activity Status',      type: 'enum',  options: ['(empty)'] },
    { id: 'asmt-lifetime',         label: 'Lifetime',             type: 'range', min: 0, max: 1000 },
    { id: 'asmt-recent-activity',  label: 'Recent Activity',      type: 'range', min: 0, max: 365 },
    { id: 'asmt-completeness-qs',  label: 'Completeness Quality Score',          type: 'range', min: 0,  max: 100 },
    { id: 'asmt-aggregated-qs',    label: 'Aggregated Quality Score',            type: 'range', min: 58, max: 75 },
    { id: 'asmt-completeness-qsc', label: 'Completeness Quality Score Category', type: 'enum',  options: ['High', 'Low', 'Medium'] },
    { id: 'asmt-observed-lifetime',label: 'Observed Lifetime',    type: 'range', min: 0, max: 1000 },
    { id: 'asmt-recency',          label: 'Recency',              type: 'range', min: 0, max: 365 },
    { id: 'asmt-description',      label: 'Description',          type: 'text',  patternSearch: true },
    { id: 'asmt-business-unit',    label: 'Business Unit',        type: 'enum',  options: ['(empty)'] },
    { id: 'asmt-location-country', label: 'Location Country',     type: 'text',  patternSearch: true },
    { id: 'asmt-location-city',    label: 'Location City',        type: 'text',  patternSearch: true },
    { id: 'asmt-department',       label: 'Department',           type: 'text',  patternSearch: true },
    { id: 'asmt-fragments',        label: 'Fragments',            type: 'text',  patternSearch: true },
    { id: 'asmt-origin-contrib',   label: 'Origin Contribution Type', type: 'enum', options: ['Corroborated', 'Unique'] },
    { id: 'asmt-assessment-id',    label: 'Assessment ID',        type: 'text',  patternSearch: true },
    { id: 'asmt-std',              label: 'Associated Standard',  type: 'text',  patternSearch: true },
    { id: 'asmt-control',          label: 'Associated Control',   type: 'text',  patternSearch: true },
    { id: 'asmt-cloud-provider',   label: 'Cloud Provider',       type: 'enum',  options: ['AWS', 'MS Azure'] },
    { id: 'asmt-severity',         label: 'Assessment Severity',  type: 'enum',  options: ['Critical', 'High', 'Medium', 'Low', 'Informational'] },
    { id: 'asmt-policy-def-id',    label: 'Policy Definition ID', type: 'text',  patternSearch: true },
    { id: 'asmt-affected-res-type',label: 'Affected Resource Type', type: 'text', patternSearch: true },
    { id: 'asmt-framework',        label: 'Associated Framework', type: 'text',  patternSearch: true },
    { id: 'asmt-exposure-category',label: 'Exposure Category',    type: 'enum',  options: ['Behavioural Indicator', 'Control Gap', 'Software Vulnerability'] },
    { id: 'asmt-assessment',       label: 'Assessment',           type: 'text',  patternSearch: true },
    { id: 'asmt-weightage',        label: 'Assessment Weightage', type: 'range', min: 0, max: 100 },
    { id: 'asmt-contributed-to',   label: 'Contributed To',       type: 'enum',  options: ['Exposure', 'Reporting'], modes: ['AND','OR','EXACT'] },
    { id: 'asmt-scope-entity',     label: 'Scope Entity',         type: 'enum',  options: ['Account', 'Cloud Account', 'Cluster', 'Container', 'Finding', 'Host', 'Identity', 'Network', 'Network Services', 'Person', 'Storage', 'Vulnerability'], modes: ['AND','OR','EXACT'] },
    { id: 'asmt-source',           label: 'Assessment Source',    type: 'enum',  options: ['Cloud Defined', 'Product Defined'] },
    { id: 'asmt-source-of-data',   label: 'Source of the Data',   type: 'enum',  options: ['SIT'] },
  ],
  cluster: [
    { id: 'clus-entity-id',          label: 'Entity ID',           type: 'text',  patternSearch: true },
    { id: 'clus-display-label',      label: 'Display Label',       type: 'text',  patternSearch: true },
    { id: 'clus-type',               label: 'Type',                type: 'enum',  options: [] },
    { id: 'clus-origin',             label: 'Origin',              type: 'enum',  options: [] },
    { id: 'clus-origin-count',       label: 'Origin (Count)',      type: 'numeric' },
    { id: 'clus-data-feed',          label: 'Data Feed',           type: 'enum',  options: [], modes: ['AND','OR','EXACT'] },
    { id: 'clus-first-found',        label: 'First Found',         type: 'date' },
    { id: 'clus-first-seen',         label: 'First Seen',          type: 'date' },
    { id: 'clus-last-found',         label: 'Last Found',          type: 'date' },
    { id: 'clus-last-active',        label: 'Last Active',         type: 'date' },
    { id: 'clus-activity-status',    label: 'Activity Status',     type: 'enum',  options: [] },
    { id: 'clus-lifetime',           label: 'Lifetime',            type: 'numeric' },
    { id: 'clus-recent-activity',    label: 'Recent Activity',     type: 'numeric' },
    { id: 'clus-completeness-score', label: 'Completeness Quality Score',          type: 'range', min: 0, max: 100 },
    { id: 'clus-aggregated-score',   label: 'Aggregated Quality Score',            type: 'range', min: 0, max: 100 },
    { id: 'clus-score-category',     label: 'Completeness Quality Score Category', type: 'enum',  options: [] },
    { id: 'clus-observed-lifetime',  label: 'Observed Lifetime',   type: 'numeric' },
    { id: 'clus-recency',            label: 'Recency',             type: 'numeric' },
    { id: 'clus-description',        label: 'Description',         type: 'text',  patternSearch: true },
    { id: 'clus-business-unit',      label: 'Business Unit',       type: 'text',  patternSearch: true, modes: ['AND','OR','EXACT'] },
    { id: 'clus-location-country',   label: 'Location Country',    type: 'enum',  options: ['India'] },
    { id: 'clus-location-city',      label: 'Location City',       type: 'enum',  options: [] },
    { id: 'clus-department',         label: 'Department',          type: 'text',  patternSearch: true },
    { id: 'clus-fragments',          label: 'Fragments',           type: 'text',  patternSearch: true },
    { id: 'clus-deployment-type',    label: 'Deployment Type',     type: 'enum',  options: [] },
    { id: 'clus-mapreduce-cig-count',label: 'Count of MapReduce Clusters having Compute Instance Groups',          type: 'numeric' },
    { id: 'clus-cig-mapreduce-count',label: 'Count of Compute Instance Groups Belonging to Mapreduce Clusters',   type: 'numeric' },
    { id: 'clus-k8s-cig-count',      label: 'Count of Kubernetes Clusters having Compute Instance Groups',        type: 'numeric' },
    { id: 'clus-cig-k8s-count',      label: 'Count of Compute Instance Groups Belonging To Kubernetes Clusters',  type: 'numeric' },
    { id: 'clus-active-finding-count',label: 'Active Cluster Finding Count',  type: 'numeric' },
    { id: 'clus-origin-contribution', label: 'Origin Contribution Type',      type: 'enum',  options: [] },
    { id: 'clus-cloud-provider',      label: 'Cloud Provider',     type: 'enum',  options: [] },
    { id: 'clus-account-id',          label: 'Account ID',         type: 'text',  patternSearch: true },
    { id: 'clus-cloud-region',        label: 'Cloud Region',       type: 'enum',  options: [] },
    { id: 'clus-resource-id',         label: 'Resource ID',        type: 'text',  patternSearch: true },
    { id: 'clus-resource-name',       label: 'Resource Name',      type: 'text',  patternSearch: true, modes: ['AND','OR','EXACT'] },
    { id: 'clus-native-type',         label: 'Native Type',        type: 'enum',  options: ['AWS AutoScaling Group','AWS EC2 Fleet','AWS EKS Cluster','AWS Lambda Function','Azure Container Group','Azure Managed Cluster','Azure Virtual Machine Scaleset'] },
    { id: 'clus-last-op-state',       label: 'Last Known Operational State', type: 'enum',  options: [] },
    { id: 'clus-environment',         label: 'Environment',        type: 'enum',  options: [] },
    { id: 'clus-provisioning-state',  label: 'Provisioning State', type: 'enum',  options: [] },
    { id: 'clus-zone-availability',   label: 'Cloud Zone Availability', type: 'enum',  options: [] },
    { id: 'clus-accessibility',       label: 'Accessibility',      type: 'enum',  options: [] },
    { id: 'clus-os-family',           label: 'OS Family',          type: 'enum',  options: [] },
    { id: 'clus-k8s-cluster-name',    label: 'Kubernetes Cluster Name',     type: 'text',  patternSearch: true },
    { id: 'clus-k8s-version',         label: 'Kubernetes Version',          type: 'text',  patternSearch: true },
    { id: 'clus-emr-cluster-id',      label: 'EMR Cluster ID',              type: 'text',  patternSearch: true },
    { id: 'clus-k8s-node-group-name', label: 'Kubernetes Node Group Name',  type: 'text',  patternSearch: true },
    { id: 'clus-k8s-node-group-vm',   label: 'Kubernetes Node Group VM Count', type: 'numeric' },
    { id: 'clus-ecs-cluster-name',    label: 'ECS Cluster Name',            type: 'text',  patternSearch: true },
    { id: 'clus-scaling-instance-count', label: 'Scaling Instance Count',  type: 'numeric' },
    { id: 'clus-scaling-instance-type',  label: 'Scaling Instance Type',   type: 'enum',  options: [] },
    { id: 'clus-scaling-instance-ids',   label: 'Scaling Instance IDs',    type: 'text',  patternSearch: true },
    { id: 'clus-scaling-group-name',     label: 'Scaling Group Name',      type: 'text',  patternSearch: true },
    { id: 'clus-ec2-fleet-id',           label: 'EC2 Fleet ID',            type: 'text',  patternSearch: true },
    { id: 'clus-edr-threat-count',       label: 'EDR Threat Count',        type: 'numeric' },
    { id: 'clus-aci-active-containers',  label: 'ACI Active Containers',   type: 'enum',  options: ['aks-eci-sol','aks-eci-sol-customimg'], modes: ['AND','OR','EXACT'] },
    { id: 'clus-private-ip',             label: 'Private IP',              type: 'text',  patternSearch: true },
    { id: 'clus-private-dns',            label: 'Private DNS Name',        type: 'text',  patternSearch: true },
    { id: 'clus-public-dns',             label: 'Public DNS Name',         type: 'text',  patternSearch: true },
    { id: 'clus-active-op-date',         label: 'Active Operational Date', type: 'date' },
    { id: 'clus-last-login',             label: 'Last Login',              type: 'date' },
    { id: 'clus-edr-last-scan',          label: 'EDR Last Scan Date',      type: 'date' },
    { id: 'clus-av-scan-completed',      label: 'Anti Virus Scan Completed',           type: 'boolean' },
    { id: 'clus-av-last-scan',           label: 'AV Last Scan Date',                   type: 'date' },
    { id: 'clus-av-sig-update-date',     label: 'AV Signature Update Date',            type: 'date' },
    { id: 'clus-av-block-malicious',     label: 'AV Block Malicious Code Status',       type: 'boolean' },
    { id: 'clus-av-sig-breach-status',   label: 'AV Signature Update SLA Breach Status', type: 'boolean' },
    { id: 'clus-av-scan-breach-status',  label: 'AV Scan SLA Breach Status',            type: 'boolean' },
    { id: 'clus-av-sig-breach-duration', label: 'AV Signature Update SLA Breach Duration', type: 'numeric' },
    { id: 'clus-av-scan-breach-duration',label: 'AV Scan SLA Breach Duration',          type: 'numeric' },
    { id: 'clus-av-sig-sla-duration',    label: 'AV Signature Update SLA Duration',     type: 'numeric' },
    { id: 'clus-av-scan-sla-duration',   label: 'AV Scan SLA Duration',                 type: 'numeric' },
    { id: 'clus-firewall-status',        label: 'Firewall Status',         type: 'enum',  options: [] },
    { id: 'clus-vm-product',             label: 'VM Product',              type: 'text',  patternSearch: true },
    { id: 'clus-vm-onboarding-status',   label: 'VM Onboarding Status',    type: 'enum',  options: [] },
    { id: 'clus-vm-tracking-method',     label: 'VM Tracking Method',      type: 'enum',  options: [] },
    { id: 'clus-vm-last-scan',           label: 'VM Last Scan Date',        type: 'date' },
    { id: 'clus-plan-name',              label: 'Plan Name',               type: 'text',  patternSearch: true },
    { id: 'clus-billing-tag',            label: 'Billing Tag',             type: 'text',  patternSearch: true, modes: ['AND','OR','EXACT'] },
    { id: 'clus-org-unit',               label: 'Organizational Unit',     type: 'text',  patternSearch: true },
    { id: 'clus-project',                label: 'Project',                 type: 'text',  patternSearch: true },
    { id: 'clus-instance-metadata-ver',  label: 'Instance Metadata Version', type: 'text', patternSearch: true },
    { id: 'clus-azure-resource-created', label: 'Azure Resource Created Date',  type: 'date' },
    { id: 'clus-azure-vmss-vm-count',    label: 'Azure VMSS VM Count',         type: 'numeric' },
    { id: 'clus-azure-vmss-vm-size',     label: 'Azure VMSS VM Size',          type: 'text',  patternSearch: true },
    { id: 'clus-azure-tags',             label: 'Azure Tags',                  type: 'text',  patternSearch: true },
    { id: 'clus-azure-public-network',   label: 'Azure Public Network Access', type: 'enum',  options: [] },
    { id: 'clus-azure-aks-power-state',  label: 'Azure AKS Power State',       type: 'enum',  options: [] },
    { id: 'clus-azure-aks-pool-type',    label: 'Azure AKS Node Pool Type',    type: 'enum',  options: [] },
    { id: 'clus-azure-aks-node-rg',      label: 'Azure AKS Node Resource Group', type: 'text', patternSearch: true },
    { id: 'clus-azure-aks-rbac',         label: 'Azure AKS Enable RBAC',       type: 'boolean' },
    { id: 'clus-qualys-detection',       label: 'Qualys Detection Method',     type: 'enum',  options: [] },
    { id: 'clus-sagemaker-config-id',    label: 'AWS Sagemaker Configuration ID',          type: 'text',  patternSearch: true },
    { id: 'clus-sagemaker-code-repo',    label: 'AWS Sagemaker Default Code Repository',   type: 'text',  patternSearch: true },
    { id: 'clus-sagemaker-internet',     label: 'AWS Sagemaker Direct Internet Access Status', type: 'boolean' },
    { id: 'clus-sagemaker-root',         label: 'AWS Sagemaker Root Access Status',         type: 'boolean' },
    { id: 'clus-sagemaker-network-iso',  label: 'AWS Sagemaker Network Isolation Status',   type: 'boolean' },
    { id: 'clus-cloud-account-count',    label: 'Count of Cloud Account',      type: 'numeric' },
    { id: 'clus-tenable-onboarding',     label: 'Tenable.io Onboarding Date',              type: 'date' },
    { id: 'clus-tenable-last-scan',      label: 'Tenable.io Asset Last Scan Date',         type: 'date' },
    { id: 'clus-tenable-last-auth-scan', label: 'Tenable.io Last Authenticated Scan Date', type: 'date' },
    { id: 'clus-tenable-aws-terminated', label: 'Tenable.io AWS Terminated Date',          type: 'date' },
    { id: 'clus-asset-criticality',      label: 'Asset Criticality',      type: 'enum',  options: [] },
    { id: 'clus-asset-crit-score',       label: 'Asset Criticality Score', type: 'range', min: 1, max: 1000 },
    { id: 'clus-exposure-score',         label: 'Exposure Score',         type: 'range', min: 100, max: 550 },
    { id: 'clus-exposure-severity',      label: 'Exposure Severity',      type: 'enum',  options: [] },
    { id: 'clus-attack-surface',         label: 'Attack Surface',         type: 'enum',  options: ['Cloud'] },
    { id: 'clus-source-of-data',         label: 'Source of the Data',     type: 'enum',  options: ['SIT'] },
  ],
  netIface: [
    { id: 'ni-entity-id',          label: 'Entity ID',            type: 'enum',  options: [], valueCount: 3303, patternSearch: true, modes: ['AND','OR','EXACT'] },
    { id: 'ni-display-label',      label: 'Display Label',        type: 'text',  patternSearch: true },
    { id: 'ni-type',               label: 'Type',                 type: 'enum',  options: [] },
    { id: 'ni-origin',             label: 'Origin',               type: 'enum',  options: [] },
    { id: 'ni-origin-count',       label: 'Origin (Count)',       type: 'numeric' },
    { id: 'ni-data-feed',          label: 'Data Feed',            type: 'enum',  options: [], modes: ['AND','OR','EXACT'] },
    { id: 'ni-first-found',        label: 'First Found',          type: 'date' },
    { id: 'ni-first-seen',         label: 'First Seen',           type: 'date' },
    { id: 'ni-last-found',         label: 'Last Found',           type: 'date' },
    { id: 'ni-last-active',        label: 'Last Active',          type: 'date' },
    { id: 'ni-activity-status',    label: 'Activity Status',      type: 'enum',  options: ['Active'] },
    { id: 'ni-lifetime',           label: 'Lifetime',             type: 'numeric' },
    { id: 'ni-recent-activity',    label: 'Recent Activity',      type: 'numeric' },
    { id: 'ni-observed-lifetime',  label: 'Observed Lifetime',    type: 'numeric' },
    { id: 'ni-recency',            label: 'Recency',              type: 'numeric' },
    { id: 'ni-business-unit',      label: 'Business Unit',        type: 'text',  patternSearch: true, modes: ['AND','OR','EXACT'] },
    { id: 'ni-location-country',   label: 'Location Country',     type: 'enum',  options: [] },
    { id: 'ni-location-city',      label: 'Location City',        type: 'enum',  options: [] },
    { id: 'ni-department',         label: 'Department',           type: 'text',  patternSearch: true },
    { id: 'ni-fragments',          label: 'Fragments',            type: 'text',  patternSearch: true },
    { id: 'ni-resource-name',      label: 'Resource Name',        type: 'text',  patternSearch: true, modes: ['AND','OR','EXACT'] },
    { id: 'ni-provisioning-state', label: 'Provisioning State',   type: 'enum',  options: [] },
    { id: 'ni-resource-id',        label: 'Resource ID',          type: 'text',  patternSearch: true },
    { id: 'ni-deployment-type',    label: 'Deployment Type',      type: 'enum',  options: [] },
    { id: 'ni-environment',        label: 'Environment',          type: 'enum',  options: [] },
    { id: 'ni-cloud-provider',     label: 'Cloud Provider',       type: 'enum',  options: [] },
    { id: 'ni-account-id',         label: 'Account ID',           type: 'text',  patternSearch: true },
    { id: 'ni-cloud-region',       label: 'Cloud Region',         type: 'enum',  options: [] },
    { id: 'ni-project',            label: 'Project',              type: 'text',  patternSearch: true },
    { id: 'ni-mac-address',        label: 'MAC Address',          type: 'text',  patternSearch: true },
    { id: 'ni-private-ip-version', label: 'Private IP address Version', type: 'enum', options: [] },
    { id: 'ni-private-ip',         label: 'Private IP',           type: 'text',  patternSearch: true },
    { id: 'ni-private-ip-alloc',   label: 'Private IP Allocation Method', type: 'enum', options: [] },
    { id: 'ni-public-ip-launch',   label: 'Public IP Address Mapped on Launch', type: 'boolean' },
    { id: 'ni-native-type',        label: 'Native Type',          type: 'enum',  options: [] },
    { id: 'ni-attachment-status',  label: 'Attachment Status',    type: 'enum',  options: [] },
    { id: 'ni-last-op-state',      label: 'Last Known Operational State', type: 'enum', options: ['Active'] },
    { id: 'ni-src-dst-check',      label: 'Source Destination Check',    type: 'boolean' },
    { id: 'ni-subnet-id',          label: 'Subnet ID',            type: 'text',  patternSearch: true },
    { id: 'ni-status',             label: 'Status',               type: 'enum',  options: [] },
    { id: 'ni-vpc-id',             label: 'VPC ID',               type: 'text',  patternSearch: true },
    { id: 'ni-deny-igw',           label: 'Deny All IGW Traffic', type: 'boolean' },
    { id: 'ni-security-group-id',  label: 'Security Group ID',    type: 'text',  patternSearch: true, modes: ['AND','OR','EXACT'] },
    { id: 'ni-zone-availability',  label: 'Cloud Zone Availability',      type: 'enum',  options: [] },
    { id: 'ni-vpc-encryption',     label: 'VPC Encryption Support Status', type: 'enum',  options: [] },
    { id: 'ni-accel-networking',   label: 'Accelerated Networking Status', type: 'enum',  options: [] },
    { id: 'ni-origin-contribution',label: 'Origin Contribution Type',     type: 'enum',  options: [] },
    { id: 'ni-completeness-score', label: 'Completeness Quality Score',          type: 'range', min: 0, max: 100 },
    { id: 'ni-aggregated-score',   label: 'Aggregated Quality Score',            type: 'range', min: 0, max: 100 },
    { id: 'ni-score-category',     label: 'Completeness Quality Score Category', type: 'enum',  options: [] },
    { id: 'ni-asset-criticality',  label: 'Asset Criticality',      type: 'enum',  options: [] },
    { id: 'ni-asset-crit-score',   label: 'Asset Criticality Score', type: 'range', min: 1, max: 1000 },
    { id: 'ni-exposure-score',     label: 'Exposure Score',         type: 'range', min: 100, max: 550 },
    { id: 'ni-exposure-severity',  label: 'Exposure Severity',      type: 'enum',  options: [] },
    { id: 'ni-attack-surface',     label: 'Attack Surface',         type: 'enum',  options: ['Cloud'], modes: ['AND','OR','EXACT'] },
    { id: 'ni-source-of-data',     label: 'Source of the Data',     type: 'enum',  options: ['SIT'],   modes: ['AND','OR','EXACT'] },
  ],
  person: [
    { id: 'per-entity-id',           label: 'Entity ID',            type: 'text',  patternSearch: true },
    { id: 'per-display-label',       label: 'Display Label',        type: 'text',  patternSearch: true },
    { id: 'per-type',                label: 'Type',                 type: 'enum',  options: ['Contractor','Permanent'] },
    { id: 'per-origin',              label: 'Origin',               type: 'enum',  options: [] },
    { id: 'per-origin-count',        label: 'Origin (Count)',       type: 'numeric' },
    { id: 'per-data-feed',           label: 'Data Feed',            type: 'enum',  options: [], modes: ['AND','OR','EXACT'] },
    { id: 'per-first-found',         label: 'First Found',          type: 'date' },
    { id: 'per-first-seen',          label: 'First Seen',           type: 'date' },
    { id: 'per-last-found',          label: 'Last Found',           type: 'date' },
    { id: 'per-last-active',         label: 'Last Active',          type: 'date' },
    { id: 'per-activity-status',     label: 'Activity Status',      type: 'enum',  options: [] },
    { id: 'per-lifetime',            label: 'Lifetime',             type: 'numeric' },
    { id: 'per-recent-activity',     label: 'Recent Activity',      type: 'numeric' },
    { id: 'per-completeness-score',  label: 'Completeness Quality Score',          type: 'range', min: 0, max: 100 },
    { id: 'per-aggregated-score',    label: 'Aggregated Quality Score',            type: 'range', min: 0, max: 100 },
    { id: 'per-score-category',      label: 'Completeness Quality Score Category', type: 'enum',  options: [] },
    { id: 'per-observed-lifetime',   label: 'Observed Lifetime',    type: 'numeric' },
    { id: 'per-recency',             label: 'Recency',              type: 'numeric' },
    { id: 'per-description',         label: 'Description',          type: 'text',  patternSearch: true },
    { id: 'per-business-unit',       label: 'Business Unit',        type: 'enum',  options: ['Acme Corp Financial Services','Acme Corp Financial services','Business Development','DevOps','HR','InfoSec','IT Support','Network Management','Prevalent AI India Private Ltd'] },
    { id: 'per-location-country',    label: 'Location Country',     type: 'enum',  options: [] },
    { id: 'per-location-city',       label: 'Location City',        type: 'enum',  options: [] },
    { id: 'per-department',          label: 'Department',           type: 'text',  patternSearch: true },
    { id: 'per-fragments',           label: 'Fragments',            type: 'text',  patternSearch: true },
    { id: 'per-identity-count',      label: 'Count of Identities',  type: 'numeric' },
    { id: 'per-owns-host-count',     label: 'Count of Owns Host',   type: 'numeric' },
    { id: 'per-leaver-sla-status',   label: 'Leaver Account Deletion SLA Breach Status', type: 'boolean' },
    { id: 'per-reg-host-count',      label: 'Registered Host Count',        type: 'numeric' },
    { id: 'per-active-reg-host',     label: 'Active Registered Host Count', type: 'numeric' },
    { id: 'per-leaver-del-duration', label: 'Leaver Account Deletion Duration', type: 'numeric' },
    { id: 'per-origin-contribution', label: 'Origin Contribution Type',     type: 'enum',  options: [] },
    { id: 'per-terminated-login',    label: 'Terminated User Login Status', type: 'enum',  options: [] },
    { id: 'per-full-name',           label: 'Full Name',            type: 'text',  patternSearch: true },
    { id: 'per-company',             label: 'Company',              type: 'text',  patternSearch: true },
    { id: 'per-employee-id',         label: 'Employee ID',          type: 'text',  patternSearch: true },
    { id: 'per-employee-status',     label: 'Employee Status',      type: 'enum',  options: [] },
    { id: 'per-employee-level',      label: 'Employee Level',       type: 'enum',  options: [] },
    { id: 'per-employment-type',     label: 'Employment Type',      type: 'enum',  options: [] },
    { id: 'per-email-id',            label: 'Email ID',             type: 'text',  patternSearch: true },
    { id: 'per-manager',             label: 'Manager',              type: 'text',  patternSearch: true },
    { id: 'per-recruited-on',        label: 'Recruited On',         type: 'date' },
    { id: 'per-last-termination',    label: 'Last Known Termination Date', type: 'date' },
    { id: 'per-contract-end',        label: 'Contract End',         type: 'date' },
    { id: 'per-job-title',           label: 'Job Title',            type: 'text',  patternSearch: true },
    { id: 'per-job-position-id',     label: 'Job Position ID',      type: 'text',  patternSearch: true },
    { id: 'per-job-function',        label: 'Job Function',         type: 'enum',  options: [] },
    { id: 'per-legal-entity',        label: 'Legal Entity',         type: 'text',  patternSearch: true },
    { id: 'per-org-unit-id',         label: 'Organisation Unit ID', type: 'text',  patternSearch: true },
    { id: 'per-cost-center',         label: 'Cost Center',          type: 'text',  patternSearch: true },
    { id: 'per-last-login',          label: 'Last Login',           type: 'date' },
    { id: 'per-terminated-on',       label: 'Terminated On',        type: 'date' },
    { id: 'per-external-email',      label: 'External Email ID',    type: 'text',  patternSearch: true },
    { id: 'per-phone-number',        label: 'Phone Number',         type: 'text',  patternSearch: true },
    { id: 'per-address',             label: 'Address',              type: 'text',  patternSearch: true },
    { id: 'per-last-pw-used',        label: 'Last Password Used Date',    type: 'date' },
    { id: 'per-ad-op-status',        label: 'AD Operational Status',      type: 'enum',  options: [] },
    { id: 'per-ad-created',          label: 'AD Created',                 type: 'date' },
    { id: 'per-ad-last-sync',        label: 'AD Last Sync Date',          type: 'date' },
    { id: 'per-ad-last-pw-change',   label: 'AD Last Password Change Date', type: 'date' },
    { id: 'per-ad-account-disabled', label: 'AD Account Disabled Date',   type: 'date' },
    { id: 'per-aad-created',         label: 'AAD Created',                type: 'date' },
    { id: 'per-aad-deleted',         label: 'AAD Deleted Date',           type: 'date' },
    { id: 'per-aad-user-id',         label: 'AAD User ID',                type: 'text',  patternSearch: true },
    { id: 'per-aws-created',         label: 'AWS Created Date',           type: 'date' },
    { id: 'per-sf-employee-status',  label: 'SF Employee Status',         type: 'enum',  options: [] },
    { id: 'per-project',             label: 'Project',                    type: 'text',  patternSearch: true },
    { id: 'per-source-of-data',      label: 'Source of the Data',         type: 'enum',  options: ['SIT'] },
    { id: 'per-security-training',   label: 'Security Training Due Date', type: 'date' },
    { id: 'per-asset-criticality',   label: 'Asset Criticality',          type: 'enum',  options: [] },
    { id: 'per-asset-crit-score',    label: 'Asset Criticality Score',    type: 'range', min: 1, max: 1000 },
    { id: 'per-exposure-score',      label: 'Exposure Score',             type: 'range', min: 100, max: 550 },
    { id: 'per-exposure-severity',   label: 'Exposure Severity',          type: 'enum',  options: [] },
    { id: 'per-attack-surface',      label: 'Attack Surface',             type: 'enum',  options: ['Cloud'] },
  ],
  application: [
    { id: 'app-entity-id',          label: 'Entity ID',            type: 'text',  patternSearch: true },
    { id: 'app-display-label',      label: 'Display Label',        type: 'text',  patternSearch: true },
    { id: 'app-type',               label: 'Type',                 type: 'enum',  options: ['Application','Database','Software','System','Tool'] },
    { id: 'app-origin',             label: 'Origin',               type: 'enum',  options: [] },
    { id: 'app-origin-count',       label: 'Origin (Count)',       type: 'numeric' },
    { id: 'app-data-feed',          label: 'Data Feed',            type: 'enum',  options: [], modes: ['AND','OR','EXACT'] },
    { id: 'app-first-found',        label: 'First Found',          type: 'date' },
    { id: 'app-first-seen',         label: 'First Seen',           type: 'date' },
    { id: 'app-last-found',         label: 'Last Found',           type: 'date' },
    { id: 'app-last-active',        label: 'Last Active',          type: 'date' },
    { id: 'app-activity-status',    label: 'Activity Status',      type: 'enum',  options: [] },
    { id: 'app-lifetime',           label: 'Lifetime',             type: 'numeric' },
    { id: 'app-recent-activity',    label: 'Recent Activity',      type: 'numeric' },
    { id: 'app-completeness-score', label: 'Completeness Quality Score',          type: 'range', min: 0, max: 100 },
    { id: 'app-aggregated-score',   label: 'Aggregated Quality Score',            type: 'range', min: 0, max: 100 },
    { id: 'app-score-category',     label: 'Completeness Quality Score Category', type: 'enum',  options: [] },
    { id: 'app-observed-lifetime',  label: 'Observed Lifetime',    type: 'numeric' },
    { id: 'app-recency',            label: 'Recency',              type: 'numeric' },
    { id: 'app-description',        label: 'Description',          type: 'text',  patternSearch: true },
    { id: 'app-business-unit',      label: 'Business Unit',        type: 'enum',  options: [] },
    { id: 'app-location-country',   label: 'Location Country',     type: 'enum',  options: [] },
    { id: 'app-location-city',      label: 'Location City',        type: 'enum',  options: [] },
    { id: 'app-department',         label: 'Department',           type: 'text',  patternSearch: true },
    { id: 'app-fragments',          label: 'Fragments',            type: 'text',  patternSearch: true },
    { id: 'app-host-count',         label: 'Count of Host Hosting Application',  type: 'numeric' },
    { id: 'app-vuln-count',         label: 'Count of Vulnerability Findings',    type: 'numeric' },
    { id: 'app-open-vuln-count',    label: 'Count of Open Vulnerability Findings', type: 'numeric' },
    { id: 'app-origin-contribution',label: 'Origin Contribution Type',  type: 'enum',  options: [] },
    { id: 'app-name',               label: 'Application Name',     type: 'text',  patternSearch: true, modes: ['AND','OR','EXACT'] },
    { id: 'app-vendor',             label: 'Application Vendor',   type: 'text',  patternSearch: true, modes: ['AND','OR','EXACT'] },
    { id: 'app-version',            label: 'Application Version',  type: 'text',  patternSearch: true },
    { id: 'app-license',            label: 'License',              type: 'enum',  options: [] },
    { id: 'app-risk-category',      label: 'Risk Category',        type: 'enum',  options: ['Cat 1','Cat 2','Cat 3','Cat 4'] },
    { id: 'app-operational-status', label: 'Operational Status',   type: 'enum',  options: [] },
    { id: 'app-lifecycle',          label: 'Application Lifecycle', type: 'enum',  options: [] },
    { id: 'app-criticality',        label: 'Application Criticality', type: 'enum', options: [] },
    { id: 'app-internet-facing',    label: 'Internet Facing',      type: 'boolean' },
    { id: 'app-retired-date',       label: 'Retired Date',         type: 'date' },
    { id: 'app-sensitive-info',     label: 'Sensitive Information', type: 'boolean' },
    { id: 'app-source-of-data',     label: 'Source of the Data',   type: 'enum',  options: ['SIT'] },
  ],
  container: [
    { id: 'con-entity-id',          label: 'Entity ID',            type: 'text',  patternSearch: true },
    { id: 'con-display-label',      label: 'Display Label',        type: 'text',  patternSearch: true },
    { id: 'con-type',               label: 'Type',                 type: 'enum',  options: ['Container Registry','Kubernetes Container','Serverless Container'] },
    { id: 'con-origin',             label: 'Origin',               type: 'enum',  options: [] },
    { id: 'con-origin-count',       label: 'Origin (Count)',       type: 'numeric' },
    { id: 'con-data-feed',          label: 'Data Feed',            type: 'enum',  options: [], modes: ['AND','OR','EXACT'] },
    { id: 'con-first-found',        label: 'First Found',          type: 'date' },
    { id: 'con-first-seen',         label: 'First Seen',           type: 'date' },
    { id: 'con-last-found',         label: 'Last Found',           type: 'date' },
    { id: 'con-last-active',        label: 'Last Active',          type: 'date' },
    { id: 'con-activity-status',    label: 'Activity Status',      type: 'enum',  options: [] },
    { id: 'con-lifetime',           label: 'Lifetime',             type: 'numeric' },
    { id: 'con-recent-activity',    label: 'Recent Activity',      type: 'numeric' },
    { id: 'con-completeness-score', label: 'Completeness Quality Score',          type: 'range', min: 0, max: 100 },
    { id: 'con-aggregated-score',   label: 'Aggregated Quality Score',            type: 'range', min: 0, max: 100 },
    { id: 'con-score-category',     label: 'Completeness Quality Score Category', type: 'enum',  options: [] },
    { id: 'con-observed-lifetime',  label: 'Observed Lifetime',    type: 'numeric' },
    { id: 'con-recency',            label: 'Recency',              type: 'numeric' },
    { id: 'con-description',        label: 'Description',          type: 'text',  patternSearch: true },
    { id: 'con-business-unit',      label: 'Business Unit',        type: 'text',  patternSearch: true, modes: ['AND','OR','EXACT'] },
    { id: 'con-location-country',   label: 'Location Country',     type: 'enum',  options: [] },
    { id: 'con-location-city',      label: 'Location City',        type: 'enum',  options: [] },
    { id: 'con-department',         label: 'Department',           type: 'text',  patternSearch: true },
    { id: 'con-fragments',          label: 'Fragments',            type: 'range', min: 1, max: 1 },
    { id: 'con-deployment-type',    label: 'Deployment Type',      type: 'enum',  options: [] },
    { id: 'con-origin-contribution',label: 'Origin Contribution Type', type: 'enum', options: [] },
    { id: 'con-cloud-provider',     label: 'Cloud Provider',       type: 'enum',  options: [] },
    { id: 'con-account-id',         label: 'Account ID',           type: 'text',  patternSearch: true },
    { id: 'con-cloud-region',       label: 'Cloud Region',         type: 'enum',  options: [] },
    { id: 'con-resource-id',        label: 'Resource ID',          type: 'text',  patternSearch: true },
    { id: 'con-resource-name',      label: 'Resource Name',        type: 'text',  patternSearch: true, modes: ['AND','OR','EXACT'] },
    { id: 'con-native-type',        label: 'Native Type',          type: 'enum',  options: [] },
    { id: 'con-last-op-state',      label: 'Last Known Operational State', type: 'enum', options: [] },
    { id: 'con-environment',        label: 'Environment',          type: 'enum',  options: [] },
    { id: 'con-zone-availability',  label: 'Cloud Zone Availability', type: 'enum', options: [] },
    { id: 'con-encryption-status',  label: 'Encryption Status',    type: 'enum',  options: [] },
    { id: 'con-private-ip',         label: 'Private IP',           type: 'text',  patternSearch: true },
    { id: 'con-billing-tag',        label: 'Billing Tag',          type: 'text',  patternSearch: true, modes: ['AND','OR','EXACT'] },
    { id: 'con-active-op-date',     label: 'Active Operational Date', type: 'date' },
    { id: 'con-internet-exposed',   label: 'Internet Exposed',     type: 'boolean' },
    { id: 'con-high-privileges',    label: 'Has High Privileges',  type: 'boolean' },
    { id: 'con-admin-privileges',   label: 'Has Admin Privileges', type: 'boolean' },
    { id: 'con-open-internet',      label: 'Open To All Internet', type: 'boolean' },
    { id: 'con-vuln-last-observed', label: 'Vulnerability Last Observed', type: 'date' },
    { id: 'con-aci-cluster-name',   label: 'ACI Cluster Name',    type: 'text',  patternSearch: true },
    { id: 'con-hostname',           label: 'Container Hostname',   type: 'text',  patternSearch: true },
    { id: 'con-cpu',                label: 'Container CPU',        type: 'numeric' },
    { id: 'con-ecs-task-arn',       label: 'Container ECS Task ARN', type: 'text', patternSearch: true },
    { id: 'con-is-serverless',      label: 'Is Container Serverless',   type: 'boolean' },
    { id: 'con-is-privileged',      label: 'Is Container Privileged',   type: 'boolean' },
    { id: 'con-tty-enabled',        label: 'Is Container TTY Enabled',  type: 'boolean' },
    { id: 'con-runs-as-root',       label: 'Container Runs as Root',    type: 'boolean' },
    { id: 'con-memory',             label: 'Container Memory',          type: 'numeric' },
    { id: 'con-application',        label: 'Container Application',     type: 'text',  patternSearch: true },
    { id: 'con-volume-name',        label: 'Container Volume Name',     type: 'text',  patternSearch: true },
    { id: 'con-port-protocol',      label: 'Container Port Protocol',   type: 'enum',  options: [] },
    { id: 'con-std-input',          label: 'Container Standard Input',      type: 'boolean' },
    { id: 'con-std-input-once',     label: 'Container Standard Input Once', type: 'boolean' },
    { id: 'con-priv-escalation',    label: 'Container Privilege Escalation', type: 'boolean' },
    { id: 'con-k8s-flavor',         label: 'Kubernetes Flavor',         type: 'enum',  options: [] },
    { id: 'con-read-only-root-fs',  label: 'Container Read Only Root FS', type: 'boolean' },
    { id: 'con-svc-container-count',label: 'Count of Container Services having Containers', type: 'numeric' },
    { id: 'con-grp-container-count',label: 'Count of Container Groups having Containers',   type: 'numeric' },
    { id: 'con-cloud-account-count',label: 'Count of Cloud Account',    type: 'numeric' },
    { id: 'con-azure-created',      label: 'Azure Resource Created Date', type: 'date' },
    { id: 'con-azure-tags',         label: 'Azure Tags',                  type: 'text',  patternSearch: true },
    { id: 'con-azure-modified',     label: 'Azure Resource Modified',     type: 'date' },
    { id: 'con-azure-az',           label: 'Azure Availability Zone',     type: 'enum',  options: [] },
    { id: 'con-azure-acr-admin',    label: 'Azure ACR Admin User Enabled',        type: 'boolean' },
    { id: 'con-azure-acr-quarantine',label: 'Azure ACR Quarantine Policy Status', type: 'enum',  options: [] },
    { id: 'con-azure-acr-trust',    label: 'Azure ACR Trust Policy Status',       type: 'enum',  options: [] },
    { id: 'con-azure-acr-retention',label: 'Azure ACR Retention Policy Status',   type: 'enum',  options: [] },
    { id: 'con-azure-acr-export',   label: 'Azure ACR Export Policy Status',      type: 'enum',  options: ['Enabled'] },
    { id: 'con-azure-acr-arm',      label: 'Azure ACR ARM Token Status',          type: 'enum',  options: [] },
    { id: 'con-azure-acr-soft-del', label: 'Azure ACR Soft Delete Policy',        type: 'enum',  options: [] },
    { id: 'con-azure-acr-encrypt',  label: 'Azure ACR Encryption Status',         type: 'enum',  options: [] },
    { id: 'con-azure-acr-endpoint', label: 'Azure ACR Data Endpoint Enabled',     type: 'boolean' },
    { id: 'con-azure-acr-network',  label: 'Azure ACR Network Rule Bypass Options', type: 'enum', options: [] },
    { id: 'con-azure-acr-zone-red', label: 'Azure ACR Zone Redundancy',           type: 'enum',  options: [] },
    { id: 'con-azure-acr-anon-pull',label: 'Azure ACR Anonymous Pull Enabled',    type: 'boolean' },
    { id: 'con-azure-port',         label: 'Azure Container Port',                type: 'text',  patternSearch: true },
    { id: 'con-azure-state',        label: 'Azure Container State',               type: 'enum',  options: [] },
    { id: 'con-azure-host-port',    label: 'Azure Container Host Port',           type: 'text',  patternSearch: true },
    { id: 'con-azure-runs-as-root', label: 'Azure Container Runs as Root',        type: 'boolean' },
    { id: 'con-aws-tags',           label: 'AWS Tags',                            type: 'text',  patternSearch: true },
    { id: 'con-aws-created',        label: 'AWS Resource Created Date',           type: 'date' },
    { id: 'con-aws-config-change',  label: 'AWS Resource Configuration Change Date', type: 'date' },
    { id: 'con-aws-az',             label: 'AWS Availability Zone',               type: 'enum',  options: ['Regional'] },
    { id: 'con-aws-ecr-scan',       label: 'AWS ECR Scan On Push',                type: 'boolean' },
    { id: 'con-aws-ecr-tag-imm',    label: 'AWS ECR Image Tag Immutability',      type: 'enum',  options: [] },
    { id: 'con-aws-port',           label: 'AWS Container Port',                  type: 'text',  patternSearch: true },
    { id: 'con-aws-host-port',      label: 'AWS Container Host Port',             type: 'text',  patternSearch: true },
    { id: 'con-aws-launch-type',    label: 'AWS Container Launch Type',           type: 'enum',  options: [] },
    { id: 'con-vuln-first-observed',label: 'Vulnerability First Observed',        type: 'date' },
    { id: 'con-wiz-id',             label: 'Wiz ID',                              type: 'text',  patternSearch: true },
    { id: 'con-wiz-op-state',       label: 'Wiz Operational State',               type: 'enum',  options: [] },
    { id: 'con-wiz-modified',       label: 'Wiz Modified Date',                   type: 'date' },
    { id: 'con-wiz-security-ctx',   label: 'Is Default Security Context As Per Wiz', type: 'boolean' },
    { id: 'con-wiz-active-svc',     label: 'Wiz Active Services',                 type: 'text',  patternSearch: true },
    { id: 'con-vuln-count',         label: 'Count of Vulnerability Findings',     type: 'numeric' },
    { id: 'con-open-vuln-count',    label: 'Count of Open Vulnerability Findings', type: 'numeric' },
    { id: 'con-active-finding-count',label: 'Active Container Finding Count',     type: 'numeric' },
    { id: 'con-asset-criticality',  label: 'Asset Criticality',                   type: 'enum',  options: [] },
    { id: 'con-asset-crit-score',   label: 'Asset Criticality Score',             type: 'range', min: 1, max: 1000 },
    { id: 'con-exposure-score',     label: 'Exposure Score',                      type: 'range', min: 100, max: 550 },
    { id: 'con-exposure-severity',  label: 'Exposure Severity',                   type: 'enum',  options: [] },
    { id: 'con-attack-surface',     label: 'Attack Surface',                      type: 'enum',  options: ['Cloud'] },
    { id: 'con-source-of-data',     label: 'Source of the Data',                  type: 'enum',  options: ['EDM','SIT'], modes: ['AND','OR','EXACT'] },
  ],
  cloudAccount: [
    { id: 'ca-entity-id',          label: 'Entity ID',            type: 'text',  patternSearch: true },
    { id: 'ca-display-label',      label: 'Display Label',        type: 'text',  patternSearch: true },
    { id: 'ca-type',               label: 'Type',                 type: 'enum',  options: ['AWS Account','Azure Subscription'] },
    { id: 'ca-origin',             label: 'Origin',               type: 'enum',  options: [] },
    { id: 'ca-origin-count',       label: 'Origin (Count)',       type: 'numeric' },
    { id: 'ca-data-feed',          label: 'Data Feed',            type: 'enum',  options: [], modes: ['AND','OR','EXACT'] },
    { id: 'ca-first-found',        label: 'First Found',          type: 'date' },
    { id: 'ca-first-seen',         label: 'First Seen',           type: 'date' },
    { id: 'ca-last-found',         label: 'Last Found',           type: 'date' },
    { id: 'ca-last-active',        label: 'Last Active',          type: 'date' },
    { id: 'ca-activity-status',    label: 'Activity Status',      type: 'enum',  options: [] },
    { id: 'ca-lifetime',           label: 'Lifetime',             type: 'numeric' },
    { id: 'ca-recent-activity',    label: 'Recent Activity',      type: 'numeric' },
    { id: 'ca-completeness-score', label: 'Completeness Quality Score',          type: 'range', min: 0, max: 100 },
    { id: 'ca-aggregated-score',   label: 'Aggregated Quality Score',            type: 'range', min: 0, max: 100 },
    { id: 'ca-score-category',     label: 'Completeness Quality Score Category', type: 'enum',  options: [] },
    { id: 'ca-observed-lifetime',  label: 'Observed Lifetime',    type: 'numeric' },
    { id: 'ca-recency',            label: 'Recency',              type: 'numeric' },
    { id: 'ca-description',        label: 'Description',          type: 'text',  patternSearch: true },
    { id: 'ca-business-unit',      label: 'Business Unit',        type: 'text',  patternSearch: true, modes: ['AND','OR','EXACT'] },
    { id: 'ca-location-country',   label: 'Location Country',     type: 'enum',  options: [] },
    { id: 'ca-location-city',      label: 'Location City',        type: 'enum',  options: [] },
    { id: 'ca-department',         label: 'Department',           type: 'text',  patternSearch: true },
    { id: 'ca-fragments',          label: 'Fragments',            type: 'text',  patternSearch: true },
    { id: 'ca-origin-contribution',label: 'Origin Contribution Type', type: 'enum', options: [] },
    { id: 'ca-account-id',         label: 'Account ID',           type: 'text',  patternSearch: true },
    { id: 'ca-account-name',       label: 'Account Name',         type: 'text',  patternSearch: true },
    { id: 'ca-cloud-provider',     label: 'Cloud Provider',       type: 'enum',  options: ['AWS','Azure'] },
    { id: 'ca-account-status',     label: 'Account Status',       type: 'enum',  options: [] },
    { id: 'ca-aws-arn',            label: 'AWS Arn',              type: 'text',  patternSearch: true },
    { id: 'ca-aws-email',          label: 'AWS Account Email',    type: 'text',  patternSearch: true },
    { id: 'ca-aws-status',         label: 'AWS Account Status',   type: 'enum',  options: [] },
    { id: 'ca-azure-sub-state',    label: 'Azure Subscription State',                  type: 'enum',  options: [] },
    { id: 'ca-azure-sub-policies', label: 'Azure Subscription Policies',               type: 'text',  patternSearch: true },
    { id: 'ca-azure-sub-location', label: 'Azure Subscription Location Placement ID',  type: 'text',  patternSearch: true },
    { id: 'ca-azure-sub-tags',     label: 'Azure Subscription Tags',                   type: 'text',  patternSearch: true },
    { id: 'ca-azure-tenant-id',    label: 'Azure Tenant ID',      type: 'text',  patternSearch: true },
    { id: 'ca-cluster-count',      label: 'Count of Cluster Resource',    type: 'numeric' },
    { id: 'ca-container-count',    label: 'Count of Container Resource',  type: 'numeric' },
    { id: 'ca-storage-count',      label: 'Count of Storage Resource',    type: 'numeric' },
    { id: 'ca-open-findings',      label: 'Count of Open Findings',       type: 'numeric' },
    { id: 'ca-source-of-data',     label: 'Source of the Data',           type: 'enum',  options: ['SIT'] },
  ],
  netSvc: [
    { id: 'ns-entity-id',          label: 'Entity ID',            type: 'text',  patternSearch: true },
    { id: 'ns-display-label',      label: 'Display Label',        type: 'text',  patternSearch: true },
    { id: 'ns-type',               label: 'Type',                 type: 'enum',  options: ['Internet Gateway','Public IP','Security Group'] },
    { id: 'ns-origin',             label: 'Origin',               type: 'enum',  options: [] },
    { id: 'ns-origin-count',       label: 'Origin (Count)',       type: 'numeric' },
    { id: 'ns-data-feed',          label: 'Data Feed',            type: 'enum',  options: [], modes: ['AND','OR','EXACT'] },
    { id: 'ns-first-found',        label: 'First Found',          type: 'date' },
    { id: 'ns-first-seen',         label: 'First Seen',           type: 'date' },
    { id: 'ns-last-found',         label: 'Last Found',           type: 'date' },
    { id: 'ns-last-active',        label: 'Last Active',          type: 'date' },
    { id: 'ns-activity-status',    label: 'Activity Status',      type: 'enum',  options: [] },
    { id: 'ns-lifetime',           label: 'Lifetime',             type: 'numeric' },
    { id: 'ns-recent-activity',    label: 'Recent Activity',      type: 'numeric' },
    { id: 'ns-observed-lifetime',  label: 'Observed Lifetime',    type: 'numeric' },
    { id: 'ns-recency',            label: 'Recency',              type: 'numeric' },
    { id: 'ns-business-unit',      label: 'Business Unit',        type: 'text',  patternSearch: true, modes: ['AND','OR','EXACT'] },
    { id: 'ns-location-country',   label: 'Location Country',     type: 'enum',  options: [] },
    { id: 'ns-location-city',      label: 'Location City',        type: 'enum',  options: [] },
    { id: 'ns-department',         label: 'Department',           type: 'text',  patternSearch: true },
    { id: 'ns-fragments',          label: 'Fragments',            type: 'range', min: 1, max: 1 },
    { id: 'ns-resource-name',      label: 'Resource Name',        type: 'text',  patternSearch: true, modes: ['AND','OR','EXACT'] },
    { id: 'ns-provisioning-state', label: 'Provisioning State',   type: 'enum',  options: [] },
    { id: 'ns-resource-id',        label: 'Resource ID',          type: 'text',  patternSearch: true },
    { id: 'ns-deployment-type',    label: 'Deployment Type',      type: 'enum',  options: [] },
    { id: 'ns-environment',        label: 'Environment',          type: 'enum',  options: [] },
    { id: 'ns-cloud-provider',     label: 'Cloud Provider',       type: 'enum',  options: [] },
    { id: 'ns-account-id',         label: 'Account ID',           type: 'text',  patternSearch: true },
    { id: 'ns-cloud-region',       label: 'Cloud Region',         type: 'enum',  options: ['centralindia'] },
    { id: 'ns-project',            label: 'Project',              type: 'text',  patternSearch: true },
    { id: 'ns-open-findings',      label: 'Count of Open Findings', type: 'numeric' },
    { id: 'ns-native-type',        label: 'Native Type',          type: 'enum',  options: [] },
    { id: 'ns-last-op-state',      label: 'Last Known Operational State', type: 'enum', options: [] },
    { id: 'ns-public-ip',          label: 'Public IP Address',              type: 'text',  patternSearch: true },
    { id: 'ns-public-ip-alloc',    label: 'Public IP Address Allocation Method', type: 'enum', options: [] },
    { id: 'ns-public-ip-version',  label: 'Public IP Address Version',      type: 'enum',  options: [] },
    { id: 'ns-insecure-rules',     label: 'Insecure Rules',       type: 'boolean' },
    { id: 'ns-origin-contribution',label: 'Origin Contribution Type',       type: 'enum',  options: [] },
    { id: 'ns-completeness-score', label: 'Completeness Quality Score',          type: 'range', min: 0, max: 100 },
    { id: 'ns-aggregated-score',   label: 'Aggregated Quality Score',            type: 'range', min: 0, max: 100 },
    { id: 'ns-score-category',     label: 'Completeness Quality Score Category', type: 'enum',  options: [] },
    { id: 'ns-asset-criticality',  label: 'Asset Criticality',      type: 'enum',  options: [] },
    { id: 'ns-asset-crit-score',   label: 'Asset Criticality Score', type: 'range', min: 1, max: 1000 },
    { id: 'ns-exposure-score',     label: 'Exposure Score',         type: 'range', min: 100, max: 550 },
    { id: 'ns-exposure-severity',  label: 'Exposure Severity',      type: 'enum',  options: [] },
    { id: 'ns-attack-surface',     label: 'Attack Surface',         type: 'enum',  options: ['Cloud'] },
    { id: 'ns-source-of-data',     label: 'Source of the Data',     type: 'enum',  options: ['SIT'] },
  ],
  account: [
    { id: 'account-type',    label: 'Account Type',    type: 'enum', options: ['User','Service','Admin','Guest'] },
    { id: 'mfa-enabled',     label: 'MFA Enabled',     type: 'boolean' },
    { id: 'last-login',      label: 'Last Login',      type: 'date' },
    { id: 'privilege-level', label: 'Privilege Level', type: 'enum', options: ['Admin','Standard','ReadOnly'] },
  ],
};

function getEntityAttrs(id) {
  return GF_ENTITY_ATTRS[id] || [
    { id: 'name',         label: 'Name',         type: 'text' },
    { id: 'status',       label: 'Status',       type: 'enum', options: ['Active','Inactive'] },
    { id: 'created-date', label: 'Created Date', type: 'date' },
  ];
}

function initNodePositions(ids) {
  const COLS = 9, GX = 120, GY = 150, X0 = 60, Y0 = 48;
  return Object.fromEntries(ids.map((id, i) => [
    id,
    { x: X0 + (i % COLS) * GX, y: Y0 + Math.floor(i / COLS) * GY },
  ]));
}

// ── helpers ──────────────────────────────────────────────────────────────────

function FPAttrIcon({ icon, size = 16 }) {
  return <img src={`/assets/icons/${icon}.svg`} width={size} height={size} alt="" className="fp-attr-icon" />;
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
      onClick={(e) => { e.stopPropagation(); onChange && onChange(e); }}
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
          <img src="/assets/icons/pin.svg" width={16} height={16} alt="" className="fp-saved-card__pin" />
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
function GFNode({ entity, selected, inPath, dimmed, hovered, style, onMouseDown, onClick, onMouseEnter, onMouseLeave }) {
  const entVars = {
    '--ent-color':  entity.color,
    '--ent-tint':   entity.tint,
    '--ent-stroke': entity.stroke,
  };
  const circleClass = `gf-node__circle${selected ? ' gf-node__circle--selected' : ''}`;
  return (
    <div
      className={`gf-node${dimmed ? ' gf-node--dimmed' : ''}${hovered ? ' gf-node--hovered' : ''}`}
      style={style}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={circleClass} style={entVars}>
        <img src={`/assets/icons/${entity.file}`} width={18} height={18} alt="" className="gf-node__img" />
        <span className="gf-node__count">{entity.count.toLocaleString()}</span>
      </div>
      <span className={`gf-node__label${selected ? ' gf-node__label--selected' : ''}`} style={entVars}>
        {entity.label}
      </span>
    </div>
  );
}

// ── Palette node (small, one-line row) ───────────────────────────────────────
function GFPaletteNode({ entity, selected, highlighted, dimmed, onClick, onMouseEnter, onMouseLeave }) {
  return (
    <div
      className={[
        'gf-pnode',
        selected    ? 'gf-pnode--selected'    : '',
        highlighted ? 'gf-pnode--highlighted' : '',
        dimmed      ? 'gf-pnode--dimmed'      : '',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="gf-pnode__circle">
        <img src={`/assets/icons/${entity.file}`} width={16} height={16} alt="" className="gf-pnode__img" />
      </div>
      <span className="gf-pnode__label">{entity.label}</span>
    </div>
  );
}

// ── Add / Hide Entity modal ───────────────────────────────────────────────────
function GFAddHidePopup({ shownIds, onApply, onClose }) {
  const [draft,  setDraft]  = useState(new Set(shownIds));
  const [search, setSearch] = useState('');

  const filtered    = GF_ENTITIES.filter(e => !search || e.label.toLowerCase().includes(search.toLowerCase()));
  const allChecked  = draft.size === GF_ENTITIES.length;
  const someChecked = draft.size > 0 && !allChecked;

  const toggle    = (id) => setDraft(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setDraft(allChecked ? new Set() : new Set(GF_ENTITIES.map(e => e.id)));

  return (
    <div className="gf-addhide-popup">
      <div className="gf-addhide-popup__header">
        <span className="gf-addhide-popup__title">Select Entities</span>
        <span className="gf-addhide-popup__count">{draft.size}/{GF_ENTITIES.length} selected</span>
      </div>
      <div className="gf-addhide-popup__search">
        <DSPillSearch value={search} onChange={setSearch} placeholder="Search Entity" width="100%" />
      </div>
      <div className="gf-addhide-popup__select-all" onClick={toggleAll}>
        <FPCheckbox checked={allChecked} indeterminate={someChecked} onChange={toggleAll} />
        <span className="gf-addhide-popup__all-label">Select All</span>
      </div>
      <div className="gf-addhide-popup__divider" />
      <div className="gf-addhide-popup__grid">
        {filtered.map(entity => (
          <label key={entity.id} className="gf-addhide-popup__item" onClick={() => toggle(entity.id)}>
            <FPCheckbox checked={draft.has(entity.id)} onChange={() => toggle(entity.id)} />
            <span className="gf-addhide-popup__item-label">{entity.label}</span>
          </label>
        ))}
      </div>
      <div className="gf-addhide-popup__footer">
        <button className="gf-addhide-popup__cancel" onClick={onClose}>Cancel</button>
        <button className="gf-addhide-popup__apply" onClick={() => { onApply([...draft]); onClose(); }}>Apply</button>
      </div>
    </div>
  );
}

// ── Mini calendar (used in attrs panel date picker) ───────────────────────────
const GF_MONTH_NAMES  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const GF_SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const GF_DAY_LABELS   = ['SU','MO','TU','WE','TH','FR','SA'];

function computePresetRange(preset, today) {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const thisMonOffset = (d.getDay() + 6) % 7; // days since this week's Monday
  if (preset === 'Last Calendar Week') {
    const start = new Date(d); start.setDate(d.getDate() - thisMonOffset - 7);
    const end   = new Date(start); end.setDate(start.getDate() + 6);
    return { start, end };
  }
  if (preset === 'Last Calendar Month') {
    const start = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    const end   = new Date(d.getFullYear(), d.getMonth(), 0);
    return { start, end };
  }
  if (preset === 'Last 6 Calendar Weeks') {
    const lastSun = new Date(d); lastSun.setDate(d.getDate() - thisMonOffset - 1);
    const start   = new Date(lastSun); start.setDate(lastSun.getDate() - 41);
    return { start, end: lastSun };
  }
  if (preset === 'Last 6 Calendar Months') {
    const end   = new Date(d.getFullYear(), d.getMonth(), 0);
    const start = new Date(d.getFullYear(), d.getMonth() - 6, 1);
    return { start, end };
  }
  if (preset === 'Last Year') {
    const y = d.getFullYear() - 1;
    return { start: new Date(y, 0, 1), end: new Date(y, 11, 31) };
  }
  return null;
}

function fmtDateRange(range, now) {
  const curY = now.getFullYear();
  const fmt  = (date) => `${GF_SHORT_MONTHS[date.getMonth()]} ${date.getDate()}${date.getFullYear() !== curY ? ` ${date.getFullYear()}` : ''}`;
  return `${fmt(range.start)} – ${fmt(range.end)}`;
}

function GFMiniCalendar({ monthName, year, month, rangeStart, rangeEnd, hoverDate, onDayClick, onDayHover }) {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );
  const rangeEnd2 = rangeEnd || hoverDate;
  const rS = rangeStart && rangeEnd2 && rangeStart <= rangeEnd2 ? rangeStart : rangeEnd2 && rangeStart ? rangeEnd2 : rangeStart;
  const rE = rangeStart && rangeEnd2 && rangeStart <= rangeEnd2 ? rangeEnd2 : rangeStart || null;

  return (
    <div className="gf-cal">
      <div className="gf-cal-title">{monthName} {year}</div>
      <div className="gf-cal-grid">
        {GF_DAY_LABELS.map(d => <div key={d} className="gf-cal-day-hdr">{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="gf-cal-cell gf-cal-cell--empty" />;
          const date   = new Date(year, month, d);
          const isS    = rS && date.getTime() === rS.getTime();
          const isE    = rE && date.getTime() === rE.getTime();
          const inRng  = rS && rE && date > rS && date < rE;
          let cls = 'gf-cal-cell';
          if (isS)   cls += ' gf-cal-cell--range-start';
          if (isE)   cls += ' gf-cal-cell--range-end';
          if (inRng) cls += ' gf-cal-cell--in-range';
          return (
            <button
              key={i}
              className={cls}
              onClick={() => onDayClick && onDayClick(date)}
              onMouseEnter={() => onDayHover && onDayHover(date)}
              onMouseLeave={() => onDayHover && onDayHover(null)}
            >{d}</button>
          );
        })}
      </div>
    </div>
  );
}

// ── Attributes panel (slides in beside canvas) ────────────────────────────────
const GF_DATE_PRESETS = ['Last Calendar Week','Last Calendar Month','Last 6 Calendar Weeks','Last 6 Calendar Months','Last Year','Select Period'];

function GFDatePicker({ compact, onChange }) {
  const now = new Date();
  const [datePreset,  setDatePreset]  = useState(null);
  const [cal1Month,   setCal1Month]   = useState(now.getMonth());
  const [cal1Year,    setCal1Year]    = useState(now.getFullYear());
  const [customStart, setCustomStart] = useState(null);
  const [customEnd,   setCustomEnd]   = useState(null);
  const [hoverDate,   setHoverDate]   = useState(null);

  const notifyChange = (preset, start, end) => {
    if (!onChange) return;
    if (preset && preset !== 'Select Period') onChange(preset);
    else if (preset === 'Select Period' && start && end) onChange('Select Period');
    else onChange(null);
  };

  const cal2Month = cal1Month === 11 ? 0 : cal1Month + 1;
  const cal2Year  = cal1Month === 11 ? cal1Year + 1 : cal1Year;

  const goPrev = () => { if (cal1Month === 0) { setCal1Month(11); setCal1Year(y => y - 1); } else setCal1Month(m => m - 1); };
  const goNext = () => { if (cal1Month === 11) { setCal1Month(0);  setCal1Year(y => y + 1); } else setCal1Month(m => m + 1); };

  const activeRange = datePreset && datePreset !== 'Select Period'
    ? computePresetRange(datePreset, now)
    : datePreset === 'Select Period' && customStart
      ? { start: customStart, end: customEnd || customStart }
      : null;

  const handleDayClick = (date) => {
    if (datePreset !== 'Select Period') return;
    if (!customStart || customEnd) { setCustomStart(date); setCustomEnd(null); notifyChange('Select Period', date, null); }
    else if (date < customStart) { const prev = customStart; setCustomStart(date); setCustomEnd(prev); notifyChange('Select Period', date, prev); }
    else { setCustomEnd(date); notifyChange('Select Period', customStart, date); }
  };

  const clear = () => { setDatePreset(null); setCustomStart(null); setCustomEnd(null); notifyChange(null, null, null); };

  return (
    <div className={`gf-datepicker${compact ? ' gf-datepicker--compact' : ''}`}>
      {/* Quick-select shortcuts */}
      <div className="gf-date-shortcuts">
        {GF_DATE_PRESETS.map(p => (
          <button
            key={p}
            onClick={() => { setDatePreset(p); setCustomStart(null); setCustomEnd(null); notifyChange(p, null, null); }}
            className={`gf-date-shortcut${datePreset === p ? ' gf-date-shortcut--active' : ''}`}
          >{p}</button>
        ))}
      </div>

      {/* Calendar — shown when a shortcut is active or Select Period */}
      {datePreset && (
        <div className="gf-cal-nav-row">
          <button className="gf-cal-nav-btn" onClick={goPrev}>‹</button>
          <div className="gf-attrs-cals">
            <GFMiniCalendar
              monthName={GF_MONTH_NAMES[cal1Month]} year={cal1Year} month={cal1Month}
              rangeStart={activeRange?.start} rangeEnd={activeRange?.end}
              hoverDate={datePreset === 'Select Period' && customStart && !customEnd ? hoverDate : null}
              onDayClick={handleDayClick} onDayHover={setHoverDate}
            />
            {!compact && (
              <GFMiniCalendar
                monthName={GF_MONTH_NAMES[cal2Month]} year={cal2Year} month={cal2Month}
                rangeStart={activeRange?.start} rangeEnd={activeRange?.end}
                hoverDate={datePreset === 'Select Period' && customStart && !customEnd ? hoverDate : null}
                onDayClick={handleDayClick} onDayHover={setHoverDate}
              />
            )}
          </div>
          <button className="gf-cal-nav-btn" onClick={goNext}>›</button>
        </div>
      )}
    </div>
  );
}

function GFAttrsPanel({ entityId, onClose, filters, onFiltersChange }) {
  const entity = GF_ENTITIES.find(e => e.id === entityId);
  const attrs  = getEntityAttrs(entityId);
  const [search,         setSearch]         = useState('');
  const [selectedAttrId, setSelectedAttrId] = useState(null);
  const [dateSelection,  setDateSelection]  = useState(null); // current preset string from GFDatePicker
  const [enumSels,       setEnumSels]       = useState({});

  const filtered     = attrs.filter(a => !search || a.label.toLowerCase().includes(search.toLowerCase()));
  const selectedAttr = attrs.find(a => a.id === selectedAttrId);
  const hasFilter    = (id) => !!(filters || {})[id];

  const applyFilter = (mode) => {
    if (!selectedAttr) return;
    let values = [];
    if (selectedAttr.type === 'date' && dateSelection) values = [dateSelection];
    else if (selectedAttr.type === 'enum' || selectedAttr.type === 'boolean') {
      values = [...(enumSels[selectedAttrId] || new Set())];
    }
    if (values.length) onFiltersChange?.({ ...(filters || {}), [selectedAttrId]: { mode, values } });
  };

  const toggleEnum = (attrId, opt) => setEnumSels(prev => {
    const cur = new Set(prev[attrId] || []);
    cur.has(opt) ? cur.delete(opt) : cur.add(opt);
    return { ...prev, [attrId]: cur };
  });


  return (
    <div className="gf-attrs-panel">
      <div className="gf-attrs-panel-header">
        <div className="gf-attrs-entity-info">
          <div className="gf-attrs-entity-swatch" style={{ '--ent-tint': entity?.tint, '--ent-stroke': entity?.stroke }}>
            {entity && <img src={`/assets/icons/${entity.file}`} width={14} height={14} alt="" />}
          </div>
          <span className="gf-attrs-entity-name">{entity?.label}</span>
        </div>
        <button className="gf-attrs-close" onClick={onClose} title="Close attributes">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>

      <div className="gf-attrs-body">
        {/* Left: searchable attribute list */}
        <div className="gf-attrs-list-col">
          <div className="gf-attrs-search">
            <DSPillSearch value={search} onChange={setSearch} placeholder="Search attribute" width="100%" />
          </div>
          <div className="gf-attrs-list">
            {filtered.map(attr => (
              <button
                key={attr.id}
                onClick={() => { setSelectedAttrId(attr.id); setDatePreset(null); }}
                className={`gf-attrs-item${selectedAttrId === attr.id ? ' gf-attrs-item--sel' : ''}${hasFilter(attr.id) ? ' gf-attrs-item--has' : ''}`}
              >
                <span className="gf-attrs-item-label">{attr.label}</span>
                {hasFilter(attr.id) && <span className="gf-attrs-item-dot" />}
              </button>
            ))}
          </div>
        </div>

        {/* Right: value picker */}
        <div className="gf-attrs-value-col">
          {!selectedAttr ? (
            <div className="gf-attrs-value-empty">Select an attribute to configure its filter</div>
          ) : (
            <>
              <div className="gf-attrs-value-title">{selectedAttr.label}</div>

              {selectedAttr.type === 'date' && <GFDatePicker onChange={setDateSelection} />}

              {(selectedAttr.type === 'enum' || selectedAttr.type === 'boolean') && (
                <div className="gf-attrs-enum-list">
                  {(selectedAttr.options || ['True','False']).map(opt => (
                    <label key={opt} className="gf-attrs-enum-item">
                      <FPCheckbox
                        checked={(enumSels[selectedAttrId] || new Set()).has(opt)}
                        onChange={() => toggleEnum(selectedAttrId, opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {selectedAttr.type === 'text' && (
                <div className="gf-attrs-text-input-wrap">
                  <input placeholder={`Filter by ${selectedAttr.label}…`} className="gf-attrs-text-input" />
                </div>
              )}

              <div className="gf-attrs-actions">
                <button onClick={() => applyFilter('EXCLUDE')} className="gf-attrs-exclude-btn">Exclude Selected</button>
                <button onClick={() => applyFilter('INCLUDE')} className="gf-attrs-include-btn">Include Selection</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Active filter tree view ───────────────────────────────────────────────────
function GFTreeView({ connections, onRemove }) {
  if (connections.length === 0) {
    return (
      <span className="gft-empty">
        Select a node, then click a connected node to build a path filter
      </span>
    );
  }
  return (
    <div className="gft-container">
      {connections.map((c, idx) => {
        const fromE = GF_ENTITIES.find(e => e.id === c.from);
        const toE   = GF_ENTITIES.find(e => e.id === c.to);
        return (
          <div key={idx} className="gft-group">
            <div className="gft-root-row">
              <span className="gft-entity-pill">{fromE?.label}</span>
            </div>
            <div className="gft-branches">
              <div className="gft-branch">
                <span className="gft-rel-pill">{fromE?.label} Has {toE?.label}</span>
                <div className="gft-attr-hint">No filters applied</div>
              </div>
              <div className="gft-branch gft-branch--last">
                <div className="gft-target-row">
                  <span className="gft-entity-pill">{toE?.label}</span>
                  <button className="gft-remove-btn" onClick={() => onRemove(c.from, c.to)}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Tree position helper ──────────────────────────────────────────────────────
// Returns {entityId: {x, y}} for all entities appearing in connections.
// New nodes are placed relative to their parent's current position in `existing`.
function buildTreePositions(connections, existing) {
  const pos = { ...existing };
  connections.forEach(({ from, to }) => {
    if (!pos[from]) {
      // New root: place to the right of all current nodes
      const maxX = Object.values(pos).reduce((m, p) => Math.max(m, p.x), -100);
      pos[from] = { x: Object.keys(pos).length === 0 ? 80 : maxX + 200, y: 24 };
    }
    if (!pos[to]) {
      // Sibling offset: count how many children 'from' already has
      const siblingCount = connections.filter(c => c.from === from && pos[c.to]).length;
      pos[to] = { x: pos[from].x + siblingCount * 140, y: pos[from].y + 140 };
    }
  });
  return pos;
}

// ── GF attribute panel body (accordion, shown in FilterPanel when GF tab active)
function GFAttrPanelBody({ entityId, onFiltersChange }) {
  const entity = GF_ENTITIES.find(e => e.id === entityId);
  const attrs  = getEntityAttrs(entityId);

  const [search,         setSearch]         = useState('');
  const [expanded,       setExpanded]       = useState(attrs[0]?.id ?? null);
  const [selections,     setSelections]     = useState({});
  const [attrModes,      setAttrModes]      = useState({});
  const [seqModes,       setSeqModes]       = useState({});
  const [groupSearch,    setGroupSearch]    = useState({});
  const [rangeVals,      setRangeVals]      = useState({});
  const [dateSelections, setDateSelections] = useState({});

  useEffect(() => {
    const newAttrs = getEntityAttrs(entityId);
    setSearch(''); setExpanded(newAttrs[0]?.id ?? null);
    setSelections({}); setAttrModes({}); setSeqModes({}); setGroupSearch({}); setRangeVals({}); setDateSelections({});
  }, [entityId]);

  // Report the current attribute-filter selections for this entity up to the parent
  useEffect(() => {
    const result = {};
    Object.entries(selections).forEach(([attrId, sel]) => {
      if (sel && sel.size > 0) result[attrId] = { mode: attrModes[attrId] || 'Include', values: [...sel] };
    });
    Object.entries(dateSelections).forEach(([attrId, preset]) => {
      if (preset) result[attrId] = { mode: 'Include', values: [preset] };
    });
    Object.entries(rangeVals).forEach(([attrId, r]) => {
      if (r) result[attrId] = { mode: 'Include', values: [`${r.from}–${r.to}`] };
    });
    onFiltersChange && onFiltersChange(result);
  }, [selections, attrModes, dateSelections, rangeVals]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = attrs.filter(a => !search || a.label.toLowerCase().includes(search.toLowerCase()));

  const toggle = (id) => setExpanded(prev => prev === id ? null : id);

  const toggleOpt = (attrId, opt) => setSelections(prev => {
    const cur = new Set(prev[attrId] || []);
    cur.has(opt) ? cur.delete(opt) : cur.add(opt);
    return { ...prev, [attrId]: cur };
  });

  const appliedCount = Object.values(selections).filter(s => s && s.size > 0).length + Object.values(dateSelections).filter(Boolean).length;

  return (
    <div className="gfa-body">
      {/* Entity identity strip */}
      <div className="gfa-entity-strip">
        <div className="gfa-entity-swatch" style={{ '--ent-tint': entity?.tint, '--ent-stroke': entity?.stroke }}>
          {entity && <img src={`/assets/icons/${entity.file}`} width={14} height={14} alt="" />}
        </div>
        <span className="gfa-entity-name">{entity?.label ?? entityId}</span>
        {appliedCount > 0 && <span className="gfa-applied-badge">{appliedCount}</span>}
      </div>

      {/* Attribute search */}
      <div className="gfa-search">
        <DSPillSearch value={search} onChange={setSearch} placeholder="Search attribute" width="100%" />
      </div>

      {/* Attribute accordions */}
      <div className="gfa-attrs">
        {filtered.map(attr => {
          const isOpen = expanded === attr.id;
          const sel    = selections[attr.id] || new Set();
          const mode   = attrModes[attr.id] || 'Include';
          const opts   = attr.options || (attr.type === 'boolean' ? ['True','False'] : []);
          const gSrch  = (groupSearch[attr.id] || '').toLowerCase();
          const visible = gSrch ? opts.filter(o => o.toLowerCase().includes(gSrch)) : opts;
          const allChk  = opts.length > 0 && opts.every(o => sel.has(o));
          const someChk = !allChk && opts.some(o => sel.has(o));
          const rng     = rangeVals[attr.id] || { from: attr.min ?? 0, to: attr.max ?? 100 };
          const hasContent = opts.length > 0 || attr.type === 'range' || attr.type === 'date' || attr.type === 'text';

          return (
            <div key={attr.id} className="gfa-attr">
              <button className="gfa-attr__header" onClick={() => toggle(attr.id)}>
                <span className="gfa-attr__label">{attr.label}</span>
                {sel.size > 0 && <span className="gfa-attr__badge">{sel.size}</span>}
                <span className={`fp-chevron${isOpen ? ' fp-chevron--open' : ''}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </button>

              <div className={`gfa-attr__body-wrap${isOpen && hasContent ? ' gfa-attr__body-wrap--open' : ''}`}>
                <div className="gfa-attr__body">
                  {(attr.type === 'enum' || attr.type === 'boolean') && opts.length > 0 && (
                    <>
                      {/* Include / Exclude mode bar */}
                      <div className="gfa-mode-bar">
                        {['Include','Exclude'].map(m => (
                          <button key={m}
                            className={`gfa-mode-btn${mode === m ? ' gfa-mode-btn--active' : ''}`}
                            onClick={() => setAttrModes(p => ({ ...p, [attr.id]: m }))}>
                            {m}
                          </button>
                        ))}
                      </div>
                      {/* Value search */}
                      <div className="gfa-attr__search">
                        <DSPillSearch
                          value={groupSearch[attr.id] || ''}
                          onChange={v => setGroupSearch(p => ({ ...p, [attr.id]: v }))}
                          placeholder={`Search ${attr.label}`}
                          width="100%"
                        />
                      </div>
                      {/* AND / OR / EXACT segmented tabs */}
                      {attr.modes && (
                        <div className="gfa-seq-tabs">
                          {attr.modes.map(m => (
                            <button key={m}
                              className={`gfa-seq-tab${(seqModes[attr.id] || attr.modes[0]) === m ? ' gfa-seq-tab--active' : ''}`}
                              onClick={() => setSeqModes(p => ({ ...p, [attr.id]: m }))}>
                              {m}
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Select All */}
                      <label
                        className="fp-option-label fp-option-label--bold"
                        onClick={() => setSelections(p => ({ ...p, [attr.id]: allChk ? new Set() : new Set(opts) }))}
                      >
                        <FPCheckbox
                          checked={allChk}
                          indeterminate={someChk}
                          onChange={() => {
                            setSelections(p => ({ ...p, [attr.id]: allChk ? new Set() : new Set(opts) }));
                          }}
                        />
                        Select All
                      </label>
                      {visible.map(opt => (
                        <label key={opt} className="fp-option-label fp-option-label--normal" onClick={() => toggleOpt(attr.id, opt)}>
                          <FPCheckbox checked={sel.has(opt)} onChange={() => toggleOpt(attr.id, opt)} />
                          {opt}
                        </label>
                      ))}
                    </>
                  )}
                  {(attr.type === 'enum' || attr.type === 'boolean') && opts.length === 0 && (
                    <p className="gfa-empty-hint">No values available</p>
                  )}
                  {attr.type === 'text' && (
                    <>
                      <div className="gfa-attr__search">
                        <DSPillSearch
                          value={groupSearch[attr.id] || ''}
                          onChange={v => setGroupSearch(p => ({ ...p, [attr.id]: v }))}
                          placeholder={`Search ${attr.label}…`}
                          width="100%"
                        />
                      </div>
                      {attr.modes && (
                        <div className="gfa-seq-tabs">
                          {attr.modes.map(m => (
                            <button key={m}
                              className={`gfa-seq-tab${(seqModes[attr.id] || attr.modes[0]) === m ? ' gfa-seq-tab--active' : ''}`}
                              onClick={() => setSeqModes(p => ({ ...p, [attr.id]: m }))}>
                              {m}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {attr.type === 'range' && (
                    <FPRangeSlider
                      min={attr.min ?? 0} max={attr.max ?? 100}
                      from={rng.from} to={rng.to}
                      onChange={(f, t) => setRangeVals(p => ({ ...p, [attr.id]: { from: f, to: t } }))}
                    />
                  )}
                  {attr.type === 'date' && (
                    <GFDatePicker compact onChange={(preset) => setDateSelections(p => ({ ...p, [attr.id]: preset }))} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Applied filters summary */}
      {appliedCount > 0 && (
        <div className="gfa-applied">
          <div className="gfa-applied__label">Filters</div>
          {Object.entries(selections).map(([attrId, sel]) => {
            if (!sel || sel.size === 0) return null;
            const a    = attrs.find(x => x.id === attrId);
            const mode = attrModes[attrId] || 'Include';
            return (
              <div key={attrId} className="gfa-applied__chip">
                <span className="gfa-applied__mode">{mode}</span>
                <span className="gfa-applied__text">{a?.label}: {[...sel].join(', ')}</span>
                <button className="gfa-applied__remove"
                  onClick={() => setSelections(p => { const n = {...p}; delete n[attrId]; return n; })}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            );
          })}
          {Object.entries(dateSelections).map(([attrId, preset]) => {
            if (!preset) return null;
            const a = attrs.find(x => x.id === attrId);
            return (
              <div key={attrId} className="gfa-applied__chip">
                <span className="gfa-applied__mode">Include</span>
                <span className="gfa-applied__text">{a?.label}: {preset}</span>
                <button className="gfa-applied__remove"
                  onClick={() => setDateSelections(p => { const n = {...p}; delete n[attrId]; return n; })}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── GFSidePanel — floating draggable/resizable graph canvas panel ─────────────
const GFSidePanel = forwardRef(function GFSidePanel({ onEntitySelect, selectedEntityId, onApply, onConnectionsChange, hidden, entityAttrFilters, onEntityAttrFiltersChange }, ref) {
  const [paths,             setPaths]             = useState([]);
  const [activePathIdx,     setActivePathIdx]     = useState(null);
  const [hoveredId,         setHoveredId]         = useState(null);
  const [hoveredLine,       setHoveredLine]       = useState(null);
  const [showAddHide,       setShowAddHide]       = useState(false);
  const [shownEntityIds,    setShownEntityIds]    = useState(() => new Set(GF_DEFAULT_SHOWN));
  const [implicitOn,        setImplicitOn]        = useState(false);
  const [size,              setSize]              = useState({ w: 600 });
  const setEntityAttrFilters = onEntityAttrFiltersChange;
  const [selectedNode,      setSelectedNode]      = useState(null); // { pathIdx, nodeIdx }

  const canvasRef = useRef(null);
  const panelRef  = useRef(null);
  const dragRef   = useRef(null);   // canvas pan drag
  const opRef     = useRef(null);   // panel drag/resize operation

  const visibleEntities = GF_ENTITIES.filter(e => shownEntityIds.has(e.id));

  // Layout constants
  const NODE_SLOT    = 96;
  const ENTITY_ROW_Y = 24;
  const PATH_Y0      = 180;
  const LEVEL_H      = 140;
  const CIRCLE_TOP   = 0;
  const CIRCLE_BOT   = 38;
  const CIRCLE_MID   = 19;
  const FAN_PAD      = 336;
  // Distribute visible entities evenly across the panel width
  const n = visibleEntities.length;
  const TOP_SLOT_W = n > 0 ? Math.max(NODE_SLOT, size.w / n) : NODE_SLOT;
  const SIZER_W    = n * TOP_SLOT_W + FAN_PAD + NODE_SLOT;

  const slotCenterX = (entityId) => {
    const idx = visibleEntities.findIndex(e => e.id === entityId);
    return idx >= 0 ? idx * TOP_SLOT_W + TOP_SLOT_W / 2 : 0;
  };

  const activePath       = (activePathIdx !== null && paths[activePathIdx]) ? paths[activePathIdx] : [];
  const activeId         = activePath.length > 0 ? activePath[activePath.length - 1] : null;
  const activeRootIdx    = activePath.length > 0 ? visibleEntities.findIndex(e => e.id === activePath[0]) : -1;
  const activePathSlotLeft = activeRootIdx >= 0 ? activeRootIdx * TOP_SLOT_W + (TOP_SLOT_W - NODE_SLOT) / 2 : 0;

  const hoveredPathIdx = hoveredId !== null ? paths.findIndex(p => p[0] === hoveredId) : -1;
  const hoveredIsRoot  = hoveredPathIdx >= 0;
  const previewId = (() => {
    if (hoveredId === null) return activeId;
    if (hoveredIsRoot) return paths[hoveredPathIdx][paths[hoveredPathIdx].length - 1];
    return hoveredId;
  })();
  const previewPath = (() => {
    if (hoveredIsRoot) return paths[hoveredPathIdx];
    if (hoveredId === null && activePathIdx !== null && paths[activePathIdx]) return paths[activePathIdx];
    return [];
  })();
  const potentialNextIds = previewId
    ? (ENTITY_RELATIONS[previewId] || []).filter(id => !previewPath.includes(id))
    : [];

  const fanSrcX = (() => {
    if (hoveredId !== null && !hoveredIsRoot) return slotCenterX(hoveredId);
    if (hoveredIsRoot) return slotCenterX(paths[hoveredPathIdx][0]);
    if (activePath.length > 0) return slotCenterX(activePath[0]);
    return 0;
  })();
  const fanSrcY = (() => {
    if (hoveredId !== null) {
      if (hoveredIsRoot) {
        const p = paths[hoveredPathIdx];
        return p.length <= 1 ? ENTITY_ROW_Y + CIRCLE_BOT : PATH_Y0 + (p.length - 2) * LEVEL_H + CIRCLE_BOT;
      }
      return ENTITY_ROW_Y + CIRCLE_BOT;
    }
    if (!activeId) return 0;
    return activePath.length <= 1 ? ENTITY_ROW_Y + CIRCLE_BOT : PATH_Y0 + (activePath.length - 2) * LEVEL_H + CIRCLE_BOT;
  })();
  const potentialY = (() => {
    if (hoveredId !== null) {
      if (hoveredIsRoot) return PATH_Y0 + Math.max(0, paths[hoveredPathIdx].length - 1) * LEVEL_H;
      return PATH_Y0;
    }
    return PATH_Y0 + Math.max(0, activePath.length - 1) * LEVEL_H;
  })();

  const allConnections = paths.flatMap(p =>
    p.length < 2 ? [] : p.slice(0, -1).map((from, i) => ({ from, to: p[i + 1] }))
  );
  const maxPathLength = paths.length > 0 ? Math.max(...paths.map(p => p.length)) : 1;

  const clusterHalfSpread = potentialNextIds.length > 0 ? (potentialNextIds.length - 1) / 2 * NODE_SLOT : 0;
  const clampedFanCenterX = potentialNextIds.length > 0
    ? Math.min(Math.max(fanSrcX, NODE_SLOT / 2 + clusterHalfSpread), SIZER_W - NODE_SLOT / 2 - clusterHalfSpread)
    : fanSrcX;

  const handleTopRowClick = (id) => {
    const existingIdx = paths.findIndex(p => p[0] === id);
    if (existingIdx >= 0) {
      setActivePathIdx(prev => prev === existingIdx ? null : existingIdx);
      setSelectedNode({ pathIdx: existingIdx, nodeIdx: 0 });
    } else {
      const newPaths = [...paths, [id]];
      setPaths(newPaths);
      setActivePathIdx(newPaths.length - 1);
      setSelectedNode({ pathIdx: newPaths.length - 1, nodeIdx: 0 });
    }
    onEntitySelect && onEntitySelect(id);
  };

  const handlePotentialClick = (connId) => {
    if (!previewId) return;
    if (hoveredIsRoot) {
      const newNodeIdx = paths[hoveredPathIdx].length;
      setPaths(prev => prev.map((p, i) => i === hoveredPathIdx ? [...p, connId] : p));
      setActivePathIdx(hoveredPathIdx);
      setSelectedNode({ pathIdx: hoveredPathIdx, nodeIdx: newNodeIdx });
    } else if (hoveredId !== null) {
      const newPaths = [...paths, [hoveredId, connId]];
      setPaths(newPaths);
      setActivePathIdx(newPaths.length - 1);
      setSelectedNode({ pathIdx: newPaths.length - 1, nodeIdx: 1 });
    } else {
      if (activePathIdx === null) return;
      const newNodeIdx = paths[activePathIdx].length;
      setPaths(prev => prev.map((p, i) => i === activePathIdx ? [...p, connId] : p));
      setSelectedNode({ pathIdx: activePathIdx, nodeIdx: newNodeIdx });
    }
    onEntitySelect && onEntitySelect(connId);
  };

  const handleStepBack = (pathIdx = activePathIdx) => {
    if (pathIdx === null) return;
    const p = paths[pathIdx];
    if (!p) return;
    if (p.length <= 1) {
      setPaths(prev => prev.filter((_, i) => i !== pathIdx));
      setActivePathIdx(null);
    } else {
      setPaths(prev => prev.map((pp, i) => i === pathIdx ? pp.slice(0, -1) : pp));
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedNode) return;
    const { pathIdx, nodeIdx } = selectedNode;
    setSelectedNode(null);
    if (nodeIdx === 0) {
      setPaths(prev => prev.filter((_, i) => i !== pathIdx));
      setActivePathIdx(prev => prev === pathIdx ? null : prev > pathIdx ? prev - 1 : prev);
    } else {
      setPaths(prev => prev.map((p, i) => i === pathIdx ? p.slice(0, nodeIdx) : p));
    }
  };

  const activeRoot = activePath.length > 0 ? activePath[0] : null;
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || activeRootIdx < 0) return;
    el.scrollTo({ left: Math.max(0, (activePathSlotLeft + NODE_SLOT / 2) - el.clientWidth / 2), behavior: 'smooth' });
  }, [activeRoot]); // eslint-disable-line react-hooks/exhaustive-deps

  // Canvas pan drag
  const handleCanvasMouseDown = (e) => {
    const el = canvasRef.current;
    if (!el) return;
    const tag = e.target.tagName.toLowerCase();
    if (['button','img','svg','path','line','circle','polyline'].includes(tag)) return;
    if (e.target.closest('.gf-node, .gf-entity-slot, .gf-canvas-add-hide, .gf-modal-wrap')) return;
    dragRef.current = { x: e.clientX, y: e.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop };
    el.style.cursor = 'grabbing';
    e.preventDefault();
  };
  const handleCanvasMouseMove = (e) => {
    if (!dragRef.current) return;
    const el = canvasRef.current;
    if (!el) return;
    el.scrollLeft = dragRef.current.scrollLeft - (e.clientX - dragRef.current.x);
    el.scrollTop  = dragRef.current.scrollTop  - (e.clientY - dragRef.current.y);
  };
  const handleCanvasMouseUp = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = '';
  };

  // Width-only resize via left edge — global listeners
  useEffect(() => {
    const onMove = (e) => {
      const op = opRef.current;
      if (!op) return;
      const dx = e.clientX - op.startX;
      setSize({ w: Math.max(300, op.startW - dx) });
    };
    const onUp = () => { opRef.current = null; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const startResize = (e) => {
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    opRef.current = { startX: e.clientX, startW: rect.width };
    document.body.style.userSelect = 'none';
    e.preventDefault();
    e.stopPropagation();
  };

  const attrFilterChips = () => {
    const chips = [];
    Object.entries(entityAttrFilters).forEach(([entityId, filters]) => {
      const entity = GF_ENTITIES.find(e => e.id === entityId);
      const attrs  = getEntityAttrs(entityId);
      Object.entries(filters || {}).forEach(([attrId, f]) => {
        if (!f?.values?.length) return;
        const a      = attrs.find(x => x.id === attrId);
        const isDate = a?.type === 'date';
        const preset = isDate ? f.values[0] : null;
        const range  = preset && preset !== 'Select Period' ? computePresetRange(preset, new Date()) : null;
        const valStr = range ? `${fmtDateRange(range, new Date())} (${preset})` : f.values.join(', ');
        chips.push({ key: `${entity?.label} · ${a?.label}`, attrId: `graph-attr-${entityId}-${attrId}`, value: `${f.mode} ${valStr}` });
      });
    });
    return chips;
  };
  const attrFilterCount = () => Object.values(entityAttrFilters).reduce(
    (sum, filters) => sum + Object.values(filters || {}).filter(f => f?.values?.length > 0).length, 0
  );

  const handleReset  = () => { setPaths([]); setActivePathIdx(null); setEntityAttrFilters({}); onApply && onApply(0, []); };
  const handleApply  = () => {
    const connChips = allConnections.map(c => {
      const fromE = GF_ENTITIES.find(e => e.id === c.from);
      const toE   = GF_ENTITIES.find(e => e.id === c.to);
      return { key: 'Graph Filter', attrId: 'graph-entity', value: `${fromE?.label} → ${toE?.label}` };
    });
    const chips = [...connChips, ...attrFilterChips()];
    onApply && onApply(chips.length, chips);
  };

  const totalFilterCount = allConnections.length + attrFilterCount();

  // Expose reset/apply to parent (FilterPanel footer) via ref
  useImperativeHandle(ref, () => ({
    reset: handleReset,
    apply: handleApply,
    connectionCount: totalFilterCount,
  }), [totalFilterCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent of filter count changes so footer Apply button can be enabled/disabled
  useEffect(() => {
    onConnectionsChange && onConnectionsChange(totalFilterCount);
  }, [totalFilterCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const panelStyle = {
    width: size.w,
    ...(hidden ? { display: 'none' } : {}),
  };

  return (
    <div className="gf-side-panel" style={panelStyle} ref={panelRef}>

      {/* Title header */}
      <div className="gf-side-panel__header">
        <span className="gf-side-panel__title">Graph Filter</span>
      </div>

      {/* Canvas — wrap keeps button pinned to visible area; area is the scrollable inner */}
      <div className="gf-canvas-wrap">
      <div className="gf-canvas-area"
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={() => { handleCanvasMouseUp(); setHoveredId(null); }}
        onClick={() => setSelectedNode(null)}
      >
        <div className="gf-canvas-sizer" style={{ width: SIZER_W, minHeight: PATH_Y0 + (maxPathLength + 2) * LEVEL_H + 80 }} />

        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
          {paths.map((p, pathIdx) => {
            const cx = slotCenterX(p[0]);
            return (
              <React.Fragment key={`plines-${pathIdx}`}>
                {p.length >= 2 && (() => {
                  const y1 = ENTITY_ROW_Y + CIRCLE_BOT, y2 = PATH_Y0 + CIRCLE_TOP, my = (y1+y2)/2;
                  const fromE = GF_ENTITIES.find(e => e.id === p[0]);
                  const toE   = GF_ENTITIES.find(e => e.id === p[1]);
                  return (
                    <g style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); setPaths(prev => prev.map((pp, i) => i === pathIdx ? [pp[0]] : pp)); setActivePathIdx(pathIdx); }}
                      onMouseEnter={() => setHoveredLine({ cx, cy: my, label: `${fromE?.label} → ${toE?.label}` })}
                      onMouseLeave={() => setHoveredLine(null)}>
                      <line x1={cx} y1={y1} x2={cx} y2={y2} stroke="transparent" strokeWidth={14} />
                      <line x1={cx} y1={y1} x2={cx} y2={y2} stroke="var(--pai-border-strong)" strokeWidth={1.5} strokeLinecap="round" />
                      <circle cx={cx} cy={my} r={4.5} fill="var(--ctrl-bg)" stroke="var(--pai-border-strong)" strokeWidth={1.5} />
                    </g>
                  );
                })()}
                {p.length > 2 && p.slice(1, -1).map((_, i) => {
                  const y1 = PATH_Y0 + i * LEVEL_H + CIRCLE_BOT, y2 = PATH_Y0 + (i+1) * LEVEL_H + CIRCLE_TOP, midY = (y1+y2)/2;
                  const fromE = GF_ENTITIES.find(e => e.id === p[i+1]);
                  const toE   = GF_ENTITIES.find(e => e.id === p[i+2]);
                  return (
                    <g key={`seg-${pathIdx}-${i}`} style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); handleStepBack(pathIdx); }}
                      onMouseEnter={() => setHoveredLine({ cx, cy: midY, label: `${fromE?.label} → ${toE?.label}` })}
                      onMouseLeave={() => setHoveredLine(null)}>
                      <line x1={cx} y1={y1} x2={cx} y2={y2} stroke="transparent" strokeWidth={14} />
                      <line x1={cx} y1={y1} x2={cx} y2={y2} stroke="var(--pai-border-strong)" strokeWidth={1.5} strokeLinecap="round" />
                      <circle cx={cx} cy={midY} r={4.5} fill="var(--ctrl-bg)" stroke="var(--pai-border-strong)" strokeWidth={1.5} />
                    </g>
                  );
                })}
              </React.Fragment>
            );
          })}
          {previewId && potentialNextIds.map((connId, ci) => {
            const tx = clampedFanCenterX + (ci - (potentialNextIds.length - 1) / 2) * NODE_SLOT;
            const y2 = potentialY + CIRCLE_TOP;
            const my = (fanSrcY + y2) / 2;
            const d  = `M${fanSrcX},${fanSrcY} C${fanSrcX},${my} ${tx},${my} ${tx},${y2}`;
            return <path key={`fan-${connId}`} d={d} stroke="var(--pai-border-strong)" strokeWidth={1.5} fill="none" strokeLinecap="round" />;
          })}
        </svg>

        {visibleEntities.map((entity, i) => {
          const pathIdx = paths.findIndex(p => p[0] === entity.id);
          const isSelected = selectedNode?.pathIdx === pathIdx && selectedNode?.nodeIdx === 0 && pathIdx >= 0;
          const inPath = pathIdx >= 0;
          return (
            <div key={entity.id} className="gf-entity-slot"
              style={{ left: i * TOP_SLOT_W, top: ENTITY_ROW_Y, width: TOP_SLOT_W }}
              onClick={(e) => { e.stopPropagation(); handleTopRowClick(entity.id); }}
              onMouseEnter={() => setHoveredId(entity.id)}>
              <GFNode entity={entity}
                selected={isSelected}
                inPath={inPath && !isSelected}
                dimmed={false} hovered={hoveredId === entity.id}
                style={{}} onMouseDown={() => {}} onClick={() => {}} onMouseEnter={() => {}} onMouseLeave={() => {}} />
            </div>
          );
        })}

        {paths.flatMap((p, pathIdx) => {
          const ri = visibleEntities.findIndex(e => e.id === p[0]);
          const slotLeft = ri >= 0 ? ri * TOP_SLOT_W + (TOP_SLOT_W - NODE_SLOT) / 2 : 0;
          return p.slice(1).map((entityId, i) => {
            const nodeIdx = i + 1;
            const entity = GF_ENTITIES.find(e => e.id === entityId);
            const isSelected = selectedNode?.pathIdx === pathIdx && selectedNode?.nodeIdx === nodeIdx;
            if (!entity) return null;
            return (
              <div key={`path-${pathIdx}-${nodeIdx}`} className="gf-entity-slot"
                style={{ left: slotLeft, top: PATH_Y0 + i * LEVEL_H, cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePathIdx(pathIdx);
                  setSelectedNode({ pathIdx, nodeIdx });
                  onEntitySelect && onEntitySelect(entityId);
                }}>
                <GFNode entity={entity} selected={isSelected} inPath={!isSelected} dimmed={false} hovered={false}
                  style={{}} onMouseDown={() => {}} onClick={() => {}} onMouseEnter={() => {}} onMouseLeave={() => {}} />
              </div>
            );
          });
        })}

        {previewId && potentialNextIds.map((connId, ci) => {
          const entity = GF_ENTITIES.find(e => e.id === connId);
          if (!entity) return null;
          const nodeLeft = clampedFanCenterX + (ci - (potentialNextIds.length - 1) / 2) * NODE_SLOT - NODE_SLOT / 2;
          return (
            <div key={`pot-${connId}`} className="gf-entity-slot gf-entity-slot--potential"
              style={{ left: nodeLeft, top: potentialY }}
              onClick={(e) => { e.stopPropagation(); handlePotentialClick(connId); }}>
              <GFNode entity={entity} selected={false} dimmed={true} hovered={false}
                style={{}} onMouseDown={() => {}} onClick={() => {}} onMouseEnter={() => {}} onMouseLeave={() => {}} />
            </div>
          );
        })}

        {hoveredLine && (
          <div className="gf-line-tooltip" style={{ left: hoveredLine.cx, top: Math.max(4, hoveredLine.cy - 34) }}>
            {hoveredLine.label}
          </div>
        )}

      </div>{/* end gf-canvas-area */}

        {/* Delete selected node button — above Add/Hide */}
        <button
          className={`gf-canvas-delete-btn${selectedNode ? ' gf-canvas-delete-btn--enabled' : ''}`}
          disabled={!selectedNode}
          title={selectedNode ? 'Delete selected node' : 'Select a node first'}
          onClick={(e) => { e.stopPropagation(); handleDeleteSelected(); }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>

        {/* Add/Hide button — outside scrollable area, stays pinned to canvas-wrap corner */}
        <button
          className={`gf-canvas-add-hide${showAddHide ? ' gf-canvas-add-hide--active' : ''}`}
          onClick={(e) => { e.stopPropagation(); setShowAddHide(v => !v); }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add / Hide Entity
        </button>

        {/* Add/Hide popup — anchored above the button, inside the panel */}
        {showAddHide && (
          <GFAddHidePopup
            shownIds={[...shownEntityIds]}
            onApply={(ids) => {
              const newSet = new Set(ids);
              setShownEntityIds(newSet);
              setPaths(prev => prev.filter(p => newSet.has(p[0])));
              setShowAddHide(false);
            }}
            onClose={() => setShowAddHide(false)}
          />
        )}
      </div>{/* end gf-canvas-wrap */}

      {/* Active filter preview */}
      <div className="gf-side-panel__bottom">
        <div className="gf-bottom-header">
          <div className="gf-bottom-preview-label">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            Active Filter Preview
          </div>
          <label className="gf-implicit-wrap">
            <div className={`gf-implicit-toggle${implicitOn ? ' gf-implicit-toggle--on' : ''}`} onClick={() => setImplicitOn(v => !v)}>
              <div className="gf-implicit-thumb" />
            </div>
            <span className="gf-implicit-label">Implicit</span>
          </label>
        </div>
        <div className="gf-bottom-tree">
          {/* Attribute filter chips per entity */}
          {Object.entries(entityAttrFilters).map(([entityId, filters]) => {
            const entries = Object.entries(filters || {}).filter(([, f]) => f?.values?.length > 0);
            if (entries.length === 0) return null;
            const entity = GF_ENTITIES.find(e => e.id === entityId);
            const attrs  = getEntityAttrs(entityId);
            return (
              <div key={entityId} className="gf-preview-entity-group">
                <div className="gf-preview-entity-label" style={{ '--ent-tint': entity?.tint, '--ent-stroke': entity?.stroke }}>
                  <div className="gf-preview-entity-swatch">
                    {entity && <img src={`/assets/icons/${entity.file}`} width={11} height={11} alt="" />}
                  </div>
                  {entity?.label}
                </div>
                {entries.map(([attrId, f]) => {
                  const a      = attrs.find(x => x.id === attrId);
                  const isDate = a?.type === 'date';
                  const preset = isDate ? f.values[0] : null;
                  const range  = preset && preset !== 'Select Period' ? computePresetRange(preset, new Date()) : null;
                  const valStr = range
                    ? `${fmtDateRange(range, new Date())} (${preset})`
                    : f.values.join(', ');
                  return (
                    <div key={attrId} className="gf-preview-attr-chip">
                      <span className="gf-preview-attr-name">{a?.label}</span>
                      <span className="gf-preview-attr-sep">:</span>
                      <span className="gf-preview-attr-badge">{f.mode}</span>
                      <span className="gf-preview-attr-val">{valStr}</span>
                      <button
                        className="gf-preview-attr-remove"
                        onClick={() => setEntityAttrFilters(prev => {
                          const updated = { ...prev[entityId] }; delete updated[attrId];
                          return { ...prev, [entityId]: updated };
                        })}
                      >
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Path connections */}
          {allConnections.length === 0 && Object.values(entityAttrFilters).every(f => Object.keys(f || {}).length === 0)
            ? <p className="gf-bottom-empty">Select a node, then click a connected node to build a path filter</p>
            : allConnections.length > 0 && <GFTreeView connections={allConnections} onRemove={(from, to) => {
                const pathIdx = paths.findIndex(p => {
                  const i = p.indexOf(to);
                  return i > 0 && p[i - 1] === from;
                });
                if (pathIdx < 0) return;
                const cutAt = paths[pathIdx].indexOf(to);
                setPaths(prev => prev.map((p, i) => i === pathIdx ? p.slice(0, cutAt) : p).filter(p => p.length > 0));
                if (pathIdx === activePathIdx) setActivePathIdx(null);
              }} />
          }
        </div>
      </div>

      {/* Left-edge resize handle */}
      <div className="gf-side-panel__resize gf-side-panel__resize--left" onMouseDown={startResize} />
    </div>
  );
});

// ── Graph Filter — full-viewport overlay ──────────────────────────────────────
function GraphFilterDrawer({ open, onClose, onApply, top = 0 }) {
  // paths: array of independent traversal chains, each is [rootId, child1Id, ...]
  const [paths,        setPaths]        = useState([]);
  const [activePathIdx,setActivePathIdx]= useState(null);
  const [hoveredId,    setHoveredId]    = useState(null);
  const [showAttrs,    setShowAttrs]    = useState(false);
  const [attrsEntityId,setAttrsEntityId]= useState(null);
  const [implicitOn,   setImplicitOn]   = useState(false);
  const [showAddHide,  setShowAddHide]  = useState(false);
  const [hoveredLine,  setHoveredLine]  = useState(null); // { cx, cy, label }
  const canvasRef  = useRef(null);
  const dragRef    = useRef(null); // { x, y, scrollLeft, scrollTop }

  // Layout constants — must be declared before derived values that reference them
  const NODE_SLOT    = 80;
  const X0           = 24;
  const ENTITY_ROW_Y = 24;
  const PATH_Y0      = 180;  // y of first connection below top row
  const LEVEL_H      = 140;  // vertical distance between path levels
  // GFNode internal geometry: count badge ~20px + gap 8px = circle top at 28px, bottom at 80px
  const CIRCLE_TOP   = 28;
  const CIRCLE_BOT   = 80;
  // Sizer width: all entity slots + right padding so rightmost node never clips
  const SIZER_W      = X0 + GF_ENTITIES.length * NODE_SLOT + NODE_SLOT;

  const slotCenterX = (entityId) => {
    const idx = GF_ENTITIES.findIndex(e => e.id === entityId);
    return X0 + (idx >= 0 ? idx : 0) * NODE_SLOT + NODE_SLOT / 2;
  };

  // Active path (the one currently being extended)
  const activePath       = (activePathIdx !== null && paths[activePathIdx]) ? paths[activePathIdx] : [];
  const activeId         = activePath.length > 0 ? activePath[activePath.length - 1] : null;
  const activeRootIdx    = activePath.length > 0 ? GF_ENTITIES.findIndex(e => e.id === activePath[0]) : -1;
  const activePathSlotLeft = activeRootIdx >= 0 ? X0 + activeRootIdx * NODE_SLOT : 0;

  // When hovering a top-row entity that is root of an existing path → preview from that path's tail.
  // When hovering a top-row entity with no path yet → preview from that entity.
  // When not hovering → preview from active path's tail.
  const hoveredPathIdx  = hoveredId !== null ? paths.findIndex(p => p[0] === hoveredId) : -1;
  const hoveredIsRoot   = hoveredPathIdx >= 0;
  const previewId = (() => {
    if (hoveredId === null) return activeId;
    if (hoveredIsRoot) return paths[hoveredPathIdx][paths[hoveredPathIdx].length - 1]; // tail of hovered path
    return hoveredId;
  })();

  // Exclude nodes already in the path that previewId belongs to
  const previewPath = (() => {
    if (hoveredIsRoot) return paths[hoveredPathIdx];
    if (hoveredId === null && activePathIdx !== null && paths[activePathIdx]) return paths[activePathIdx];
    return [];
  })();
  const potentialNextIds = previewId
    ? (ENTITY_RELATIONS[previewId] || []).filter(id => !previewPath.includes(id))
    : [];

  // Fan-out source x: chain nodes render in the ROOT's column, not the entity's natural column,
  // so fanSrcX must use the root entity's column center — not slotCenterX(previewId).
  const fanSrcX = (() => {
    if (hoveredId !== null && !hoveredIsRoot) return slotCenterX(hoveredId); // top-row hover, no path yet
    if (hoveredIsRoot) return slotCenterX(paths[hoveredPathIdx][0]);         // hovered path root's column
    if (activePath.length > 0) return slotCenterX(activePath[0]);            // active path root's column
    return 0;
  })();
  const fanSrcY = (() => {
    if (hoveredId !== null) {
      if (hoveredIsRoot) {
        const p = paths[hoveredPathIdx];
        return p.length <= 1 ? ENTITY_ROW_Y + CIRCLE_BOT : PATH_Y0 + (p.length - 2) * LEVEL_H + CIRCLE_BOT;
      }
      return ENTITY_ROW_Y + CIRCLE_BOT;
    }
    if (!activeId) return 0;
    return activePath.length <= 1 ? ENTITY_ROW_Y + CIRCLE_BOT : PATH_Y0 + (activePath.length - 2) * LEVEL_H + CIRCLE_BOT;
  })();

  const potentialY = (() => {
    if (hoveredId !== null) {
      if (hoveredIsRoot) return PATH_Y0 + Math.max(0, paths[hoveredPathIdx].length - 1) * LEVEL_H;
      return PATH_Y0;
    }
    return PATH_Y0 + Math.max(0, activePath.length - 1) * LEVEL_H;
  })();

  // All connections across all paths (for GFTreeView / apply)
  const allConnections = paths.flatMap(p =>
    p.length < 2 ? [] : p.slice(0, -1).map((from, i) => ({ from, to: p[i + 1] }))
  );

  const maxPathLength = paths.length > 0 ? Math.max(...paths.map(p => p.length)) : 1;

  // Clamp the potential-nodes cluster so it never overflows the left/right canvas edge
  const clusterHalfSpread = potentialNextIds.length > 0 ? (potentialNextIds.length - 1) / 2 * NODE_SLOT : 0;
  const clampedFanCenterX = potentialNextIds.length > 0
    ? Math.min(Math.max(fanSrcX, X0 + NODE_SLOT / 2 + clusterHalfSpread), SIZER_W - NODE_SLOT / 2 - clusterHalfSpread)
    : fanSrcX;

  // ── Click a top-row entity ────────────────────────────────────────────────
  // If a path already starts here, make it active. Otherwise start a new path.
  const handleTopRowClick = (id) => {
    const existingIdx = paths.findIndex(p => p[0] === id);
    if (existingIdx >= 0) {
      setActivePathIdx(prev => prev === existingIdx ? null : existingIdx);
    } else {
      const newPaths = [...paths, [id]];
      setPaths(newPaths);
      setActivePathIdx(newPaths.length - 1);
    }
  };

  // ── Click a potential next node ──────────────────────────────────────────────
  const handlePotentialClick = (connId) => {
    if (!previewId) return;
    if (hoveredIsRoot) {
      // Hovering root of existing path → extend that path
      setPaths(prev => prev.map((p, i) => i === hoveredPathIdx ? [...p, connId] : p));
      setActivePathIdx(hoveredPathIdx);
    } else if (hoveredId !== null) {
      // Hovering top-row entity with no path yet → create new path
      const newPaths = [...paths, [hoveredId, connId]];
      setPaths(newPaths);
      setActivePathIdx(newPaths.length - 1);
    } else {
      // No hover — extend active path's tail
      if (activePathIdx === null) return;
      setPaths(prev => prev.map((p, i) => i === activePathIdx ? [...p, connId] : p));
    }
  };

  // ── Step back: trim last node from active path (removes path if it becomes empty) ──
  const handleStepBack = (pathIdx = activePathIdx) => {
    if (pathIdx === null) return;
    const p = paths[pathIdx];
    if (!p) return;
    if (p.length <= 1) {
      setPaths(prev => prev.filter((_, i) => i !== pathIdx));
      setActivePathIdx(null);
    } else {
      setPaths(prev => prev.map((pp, i) => i === pathIdx ? pp.slice(0, -1) : pp));
    }
  };

  // Auto-scroll to center the active path's root column when it changes
  const activeRoot = activePath.length > 0 ? activePath[0] : null;
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || activeRootIdx < 0) return;
    const canvasW  = el.clientWidth;
    const targetX  = activePathSlotLeft + NODE_SLOT / 2;
    el.scrollTo({ left: Math.max(0, targetX - canvasW / 2), behavior: 'smooth' });
  }, [activeRoot]); // eslint-disable-line react-hooks/exhaustive-deps

  // Vertical scroll: keep the potential-next-nodes row visible whenever it changes
  const activeDepth = activePath.length;
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    // Bottom of the potential-nodes area (circle + label ≈ 110px below potentialY)
    const contentBottom = potentialY + 120;
    const canvasH = el.clientHeight;
    if (contentBottom > el.scrollTop + canvasH) {
      el.scrollTo({ top: Math.max(0, contentBottom - canvasH + 24), behavior: 'smooth' });
    }
  }, [activeDepth, potentialY]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = () => { setPaths([]); setActivePathIdx(null); onApply && onApply(0, []); };

  const handleApply = () => {
    const chips = allConnections.map(c => {
      const fromE = GF_ENTITIES.find(e => e.id === c.from);
      const toE   = GF_ENTITIES.find(e => e.id === c.to);
      return { key: 'Graph Filter', attrId: 'graph-entity', value: `${fromE?.label} → ${toE?.label}` };
    });
    onApply && onApply(chips.length, chips);
    onClose();
  };

  const handleCanvasMouseDown = (e) => {
    const el = canvasRef.current;
    if (!el) return;
    // Only drag when clicking the canvas background, not a node/button
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'button' || tag === 'img' || tag === 'svg' || tag === 'path' || tag === 'line' || tag === 'circle' || tag === 'polyline') return;
    if (e.target.closest('.gf-node, .gf-entity-slot, .gf-canvas-add-hide, .gf-modal-wrap')) return;
    dragRef.current = { x: e.clientX, y: e.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop };
    el.style.cursor = 'grabbing';
    e.preventDefault();
  };
  const handleCanvasMouseMove = (e) => {
    if (!dragRef.current) return;
    const el = canvasRef.current;
    if (!el) return;
    el.scrollLeft = dragRef.current.scrollLeft - (e.clientX - dragRef.current.x);
    el.scrollTop  = dragRef.current.scrollTop  - (e.clientY - dragRef.current.y);
  };
  const handleCanvasMouseUp = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = '';
  };

  if (!open) return null;

  return (
    <>
      <div className="gf-overlay-backdrop" onClick={onClose} style={{ top }} />
      <div className="gf-overlay" style={{ top }}>
        {/* ── Tab bar header ── */}
        <div className="gf-overlay-header">
          <div className="gf-overlay-tabs">
            <span className="gf-overlay-tab gf-overlay-tab--active">Graph Filter</span>
          </div>
          <div className="gf-overlay-header-right">
            <button
              onClick={() => {
                if (!showAttrs) { setAttrsEntityId(activeId || GF_ENTITIES[0]?.id); setShowAttrs(true); }
                else setShowAttrs(false);
              }}
              className={`gf-show-attrs-btn${showAttrs ? ' gf-show-attrs-btn--active' : ''}`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d={showAttrs ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6'}/>
              </svg>
              {showAttrs ? 'Hide Attributes' : 'Show Attributes'}
            </button>
            <button onClick={onClose} className="gf-overlay-close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Main: unified canvas + attrs panel ── */}
        <div className="gf-overlay-main">
          <div className="gf-canvas-wrap">
          <div
            className="gf-canvas-area"
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={() => { handleCanvasMouseUp(); setHoveredId(null); }}
          >

            {/* Sizer: drives scroll extents — grows with deepest path */}
            <div className="gf-canvas-sizer"
              style={{ width: SIZER_W, minHeight: PATH_Y0 + (maxPathLength + 2) * LEVEL_H + 80 }} />

            {/* Full-canvas SVG: path lines + fan-out curves */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>

              {/* Lines for every active path */}
              {paths.map((p, pathIdx) => {
                const ri  = GF_ENTITIES.findIndex(e => e.id === p[0]);
                const cx  = ri >= 0 ? X0 + ri * NODE_SLOT + NODE_SLOT / 2 : 0;
                return (
                  <React.Fragment key={`plines-${pathIdx}`}>
                    {/* Root → first chain node */}
                    {p.length >= 2 && (() => {
                      const y1 = ENTITY_ROW_Y + CIRCLE_BOT, y2 = PATH_Y0 + CIRCLE_TOP, my = (y1+y2)/2;
                      const fromE = GF_ENTITIES.find(e => e.id === p[0]);
                      const toE   = GF_ENTITIES.find(e => e.id === p[1]);
                      return (
                        <g style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                          onClick={(e) => { e.stopPropagation(); setPaths(prev => prev.map((pp, i) => i === pathIdx ? [pp[0]] : pp)); setActivePathIdx(pathIdx); }}
                          onMouseEnter={() => setHoveredLine({ cx, cy: my, label: `${fromE?.label} → ${toE?.label}` })}
                          onMouseLeave={() => setHoveredLine(null)}>
                          <line x1={cx} y1={y1} x2={cx} y2={y2} stroke="transparent" strokeWidth={14} />
                          <line x1={cx} y1={y1} x2={cx} y2={y2} stroke="var(--pai-border-strong)" strokeWidth={1.5} strokeLinecap="round" />
                          <circle cx={cx} cy={my} r={4.5} fill="var(--ctrl-bg)" stroke="var(--pai-border-strong)" strokeWidth={1.5} />
                        </g>
                      );
                    })()}
                    {/* Chain segments */}
                    {p.length > 2 && p.slice(1, -1).map((_, i) => {
                      const y1 = PATH_Y0 + i * LEVEL_H + CIRCLE_BOT, y2 = PATH_Y0 + (i+1) * LEVEL_H + CIRCLE_TOP, midY = (y1+y2)/2;
                      const fromE = GF_ENTITIES.find(e => e.id === p[i+1]);
                      const toE   = GF_ENTITIES.find(e => e.id === p[i+2]);
                      return (
                        <g key={`seg-${pathIdx}-${i}`} style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                          onClick={(e) => { e.stopPropagation(); handleStepBack(pathIdx); }}
                          onMouseEnter={() => setHoveredLine({ cx, cy: midY, label: `${fromE?.label} → ${toE?.label}` })}
                          onMouseLeave={() => setHoveredLine(null)}>
                          <line x1={cx} y1={y1} x2={cx} y2={y2} stroke="transparent" strokeWidth={14} />
                          <line x1={cx} y1={y1} x2={cx} y2={y2} stroke="var(--pai-border-strong)" strokeWidth={1.5} strokeLinecap="round" />
                          <circle cx={cx} cy={midY} r={4.5} fill="var(--ctrl-bg)" stroke="var(--pai-border-strong)" strokeWidth={1.5} />
                        </g>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {/* Fan-out bezier curves — clamped cluster so nodes stay within canvas */}
              {previewId && potentialNextIds.map((connId, ci) => {
                const tx = clampedFanCenterX + (ci - (potentialNextIds.length - 1) / 2) * NODE_SLOT;
                const y2 = potentialY + CIRCLE_TOP;
                const my = (fanSrcY + y2) / 2;
                const d  = `M${fanSrcX},${fanSrcY} C${fanSrcX},${my} ${tx},${my} ${tx},${y2}`;
                return (
                  <path key={`fan-${connId}`} d={d}
                    stroke="var(--pai-border-strong)" strokeWidth={1.5} fill="none" strokeLinecap="round" />
                );
              })}

            </svg>

            {/* ── Top row: all 17 entity nodes ── */}
            {GF_ENTITIES.map((entity, i) => (
              <div key={entity.id}
                className="gf-entity-slot"
                style={{ left: X0 + i * NODE_SLOT, top: ENTITY_ROW_Y }}
                onClick={(e) => { e.stopPropagation(); handleTopRowClick(entity.id); }}
                onMouseEnter={() => setHoveredId(entity.id)}
              >
                <GFNode entity={entity}
                  selected={paths.some(p => p[0] === entity.id)}
                  dimmed={false}
                  hovered={hoveredId === entity.id}
                  style={{}} onMouseDown={() => {}} onClick={() => {}} onMouseEnter={() => {}} onMouseLeave={() => {}} />
              </div>
            ))}

            {/* ── Chain nodes: render for every path, each in its root's column ── */}
            {paths.flatMap((p, pathIdx) => {
              const ri       = GF_ENTITIES.findIndex(e => e.id === p[0]);
              const slotLeft = ri >= 0 ? X0 + ri * NODE_SLOT : 0;
              const isActiveP = pathIdx === activePathIdx;
              return p.slice(1).map((entityId, i) => {
                const entity = GF_ENTITIES.find(e => e.id === entityId);
                const isTail = i === p.length - 2;
                if (!entity) return null;
                return (
                  <div key={`path-${pathIdx}-${i + 1}`}
                    className="gf-entity-slot"
                    style={{ left: slotLeft, top: PATH_Y0 + i * LEVEL_H, cursor: isTail && isActiveP ? 'pointer' : 'default' }}
                    onClick={(e) => { e.stopPropagation(); if (isTail && isActiveP) handleStepBack(pathIdx); }}
                  >
                    <GFNode entity={entity}
                      selected={isTail && isActiveP}
                      dimmed={false}
                      hovered={false}
                      style={{}} onMouseDown={() => {}} onClick={() => {}} onMouseEnter={() => {}} onMouseLeave={() => {}} />
                  </div>
                );
              });
            })}

            {/* ── Potential next nodes: clamped cluster so they stay on canvas ── */}
            {previewId && potentialNextIds.map((connId, ci) => {
              const entity = GF_ENTITIES.find(e => e.id === connId);
              if (!entity) return null;
              const nodeLeft = clampedFanCenterX + (ci - (potentialNextIds.length - 1) / 2) * NODE_SLOT - NODE_SLOT / 2;
              return (
                <div key={`pot-${connId}`}
                  className="gf-entity-slot gf-entity-slot--potential"
                  style={{ left: nodeLeft, top: potentialY }}
                  onClick={(e) => { e.stopPropagation(); handlePotentialClick(connId); }}
                >
                  <GFNode entity={entity} selected={false} dimmed={true} hovered={false}
                    style={{}} onMouseDown={() => {}} onClick={() => {}} onMouseEnter={() => {}} onMouseLeave={() => {}} />
                </div>
              );
            })}

            {/* ── Relationship tooltip — rendered last so it's above all nodes ── */}
            {hoveredLine && (
              <div className="gf-line-tooltip" style={{ left: hoveredLine.cx, top: Math.max(4, hoveredLine.cy - 34) }}>
                {hoveredLine.label}
              </div>
            )}

          </div>{/* end gf-canvas-area */}

            {/* ── Add / Hide Entity button — absolute inside canvas-wrap ── */}
            <button
              className={`gf-canvas-add-hide${showAddHide ? ' gf-canvas-add-hide--active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setShowAddHide(v => !v); }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add / Hide Entity
            </button>

            {showAddHide && (
              <GFAddHidePopup
                shownIds={GF_ENTITIES.map(e => e.id)}
                onApply={() => setShowAddHide(false)}
                onClose={() => setShowAddHide(false)}
              />
            )}

          </div>{/* end gf-canvas-wrap */}

          {showAttrs && attrsEntityId && (
            <GFAttrsPanel
              entityId={attrsEntityId}
              onClose={() => setShowAttrs(false)}
              filters={entityAttrFilters[attrsEntityId] || {}}
              onFiltersChange={(f) => setEntityAttrFilters(prev => ({ ...prev, [attrsEntityId]: f }))}
            />
          )}
        </div>

        {/* ── Bottom bar ── */}
        <div className="gf-overlay-bottom">
          <div className="gf-bottom-header">
            <div className="gf-bottom-preview-label">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              Active Filter Preview
            </div>
            <div className="gf-bottom-actions">
              <label className="gf-implicit-wrap">
                <div className={`gf-implicit-toggle${implicitOn ? ' gf-implicit-toggle--on' : ''}`} onClick={() => setImplicitOn(v => !v)}>
                  <div className="gf-implicit-thumb" />
                </div>
                <span className="gf-implicit-label">Implicit Filters</span>
              </label>
              <button className="gf-reset-btn" onClick={handleReset}>
                Reset
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </button>
              <button
                className={`gf-apply-btn${allConnections.length === 0 ? ' gf-apply-btn--disabled' : ''}`}
                disabled={allConnections.length === 0}
                onClick={handleApply}
              >
                Apply Filter
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </button>
            </div>
          </div>
          <div className="gf-bottom-tree">
            <GFTreeView connections={allConnections} onRemove={(from, to) => {
              // Find which path contains this connection and trim it there
              const pathIdx = paths.findIndex(p => {
                const i = p.indexOf(to);
                return i > 0 && p[i - 1] === from;
              });
              if (pathIdx < 0) return;
              const cutAt = paths[pathIdx].indexOf(to);
              setPaths(prev => prev.map((p, i) => i === pathIdx ? p.slice(0, cutAt) : p).filter(p => p.length > 0));
              if (pathIdx === activePathIdx) setActivePathIdx(null);
            }} />
          </div>
        </div>
      </div>

    </>
  );
}

// ── main filter panel ─────────────────────────────────────────────────────────

function FilterPanel({ onApply, onClose, embedded = false, pageId }) {
  const { savedFilters: FP_SAVED_ITEMS, deleteSavedFilter } = useSavedFilters();
  const { showToast } = useToast();
  const [deleteSavedTarget, setDeleteSavedTarget] = useState(null);
  const [tab,              setTab]             = useState('quick');
  const [selectedEntityId, setSelectedEntityId] = useState('host');
  const [gfConnCount,      setGfConnCount]      = useState(0);
  const [gfEntityAttrFilters, setGfEntityAttrFilters] = useState({});
  const [gfResetToken,    setGfResetToken]      = useState(0);
  const gfRef = useRef(null);
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
    if (!isGraphFilterEnabled(pageId)) setTab(prev => prev === 'graph' ? 'quick' : prev);
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

  const confirmDeleteSaved = () => {
    if (!deleteSavedTarget) return;
    deleteSavedFilter(deleteSavedTarget.id);
    if (selectedSavedId === deleteSavedTarget.id) setSelectedSavedId(null);
    if (appliedSavedId === deleteSavedTarget.id) setAppliedSavedId(null);
    showToast({ type: 'success', msg: `"${deleteSavedTarget.name}" filter deleted.` });
    setDeleteSavedTarget(null);
  };

  const handleReset = () => {
    if (tab === 'saved') { setSelectedSavedId(null); setAppliedSavedId(null); onApply && onApply(0); }
    else { setSelections({}); setRangeSelections({}); }
  };
  const handleApply = () => {
    if (tab === 'saved') {
      setAppliedSavedId(selectedSavedId);
      const item = FP_SAVED_ITEMS.find(i => i.id === selectedSavedId);
      if (item) {
        // Restore the actual filter criteria captured when this filter was saved —
        // applying a saved filter should behave exactly like applying those filters directly.
        const chips = item.filters || [];
        onApply && onApply(new Set(chips.map(c => c.attrId)).size, chips);
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
  // Recent Filters must reflect the drag-to-reorder + show-count saved via the settings
  // view (savedOrder/savedShowCount) — falling back to raw FP_SAVED_ITEMS order here was
  // why a reorder + Save changes never showed up. Any item not yet in savedOrder (added
  // after this panel's order was first initialized) is appended so it still appears.
  const orderedSavedIds = [...savedOrder, ...FP_SAVED_ITEMS.map(i => i.id).filter(id => !savedOrder.includes(id))];
  const orderedSaved = orderedSavedIds.map(id => FP_SAVED_ITEMS.find(i => i.id === id)).filter(Boolean).slice(0, savedShowCount);
  const filteredSaved = orderedSaved.filter(item => !savedSearch || item.name.toLowerCase().includes(savedSearch.toLowerCase()));

  return (
    <div className="fp-root">
      {/* Header — always shown */}
      <div className="fp-header">
        {!embedded && (
          <button onClick={onClose} className="fp-header__close-btn">
            <img src="/assets/icons/sidebar-collapse.svg" width={18} height={18} alt="" />
          </button>
        )}
        <div className="fp-header__tabs">
          <SegmentedTabs
            value={tab === 'quick' ? 'Quick Filters' : tab === 'graph' ? 'Graph Filter' : 'Saved Filters'}
            options={isGraphFilterEnabled(pageId) ? ['Quick Filters', 'Graph Filter', 'Saved Filters'] : ['Quick Filters', 'Saved Filters']}
            onChange={(v) => {
              if (v === 'Quick Filters') { setTab('quick'); setSettingsView(false); }
              else if (v === 'Graph Filter') { setTab('graph'); setSettingsView(false); }
              else { setTab('saved'); setSettingsView(false); }
            }}
            compact
          />
        </div>
        {tab !== 'graph' && (
          <button
            onClick={settingsView ? () => exitSettings(false) : enterSettings}
            className={`fp-header__settings-btn${settingsView ? ' fp-header__settings-btn--active' : ''}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        )}
      </div>

      {/* Scrollable body */}
      <div className="fp-body">

        {/* Graph Filter — entity attribute panel */}
        {tab === 'graph' && (
          <GFAttrPanelBody
            key={`${selectedEntityId}-${gfResetToken}`}
            entityId={selectedEntityId}
            onFiltersChange={(f) => setGfEntityAttrFilters(prev => ({ ...prev, [selectedEntityId]: f }))}
          />
        )}

        {/* Quick Settings */}
        {tab !== 'graph' && settingsView && tab === 'quick' && (
          <div className="fp-quick-settings">
            <div className="fp-quick-settings__actions">
              <button onClick={sortAttrsAZ} className="fp-sort-btn">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M7 12h10M11 18h2"/></svg>
                Sort A–Z
              </button>
              {isGraphFilterEnabled(pageId) && (
                <button onClick={() => setTab('graph')} className="fp-add-attr-btn">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Attributes
                </button>
              )}
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
                          <img src="/assets/icons/pin.svg" width={16} height={16} alt="" className="fp-saved-drag-card__pin" />
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteSavedTarget({ id: item.id, name: item.name })}
                      title="Delete saved filter"
                      className="fp-attr-delete-btn fp-saved-drag-card__delete-btn"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
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
                <img src="/assets/icons/explore.svg" width={16} height={16} alt="" />
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
                  {hasContent && (
                  <div className={`fp-options-wrap${isOpen ? ' fp-options-wrap--open' : ''}`}>
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
                          <label className="fp-option-label fp-option-label--bold" onClick={() => toggleSelectAll(attr)}>
                            <FPCheckbox checked={allChk} indeterminate={someChk} onChange={() => toggleSelectAll(attr)} />
                            Select All
                          </label>
                          {visible.map(opt => (
                            <label key={opt} className="fp-option-label fp-option-label--normal" onClick={() => toggleOption(attr.id, opt)}>
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
                  </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer — hidden for Graph Filter tab */}
      <div className="fp-footer">
        {tab === 'graph' ? (
          <div className="fp-footer__row">
            <button onClick={() => { gfRef.current?.reset(); setGfResetToken(t => t + 1); }} className="fp-footer-btn fp-footer-btn--danger">
              <span className="fp-mask-icon" />
              Reset
            </button>
            <button
              onClick={() => gfRef.current?.apply()}
              disabled={gfConnCount === 0}
              className={`fp-footer-btn fp-footer-btn--primary${gfConnCount === 0 ? ' fp-footer-btn--disabled' : ''}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Apply Filter
            </button>
          </div>
        ) : settingsView ? (
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

      {/* GFSidePanel — portal-rendered floating panel when Graph Filter tab is active */}
      {createPortal(
        <GFSidePanel
          ref={gfRef}
          hidden={tab !== 'graph'}
          onEntitySelect={(id) => setSelectedEntityId(id)}
          selectedEntityId={selectedEntityId}
          onApply={(count, chips) => onApply && onApply(count, chips)}
          onConnectionsChange={setGfConnCount}
          entityAttrFilters={gfEntityAttrFilters}
          onEntityAttrFiltersChange={setGfEntityAttrFilters}
        />,
        document.body
      )}

      {/* Delete saved filter — confirmation modal */}
      {deleteSavedTarget && createPortal(
        <div className="ds-modal-overlay">
          <div className="ds-modal" role="dialog" aria-modal="true">
            <div className="ds-modal-header">
              <span className="ds-modal-title fp-delete-modal-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                Delete Saved Filter
              </span>
              <button className="ds-modal-close" onClick={() => setDeleteSavedTarget(null)} aria-label="Close">×</button>
            </div>
            <div className="ds-modal-body"><span>Are you sure you want to delete <strong>{deleteSavedTarget.name}</strong>? This saved filter will be permanently removed and cannot be recovered.</span></div>
            <div className="ds-modal-footer">
              <button className="ds-btn sz-md t-outline" onClick={() => setDeleteSavedTarget(null)}>Cancel</button>
              <button className="ds-btn sz-md t-danger" onClick={confirmDeleteSaved}>Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export { FilterPanel, GraphFilterDrawer, GF_ENTITIES };
