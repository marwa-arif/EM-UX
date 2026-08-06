import React, { useState, useRef, useEffect, useMemo, useLayoutEffect, useCallback } from 'react'
import { DSPillSearch } from '../context/WorkspaceCtx.jsx'
import '../styles/dashboard.css'
import '../styles/compliance.css'
import '../styles/kg.css'
import '../styles/drawer.css'
import '../styles/data-quality.css'

// ── Small icon set — same glyph language as DataQualityOverviewPage.jsx ────
const IcChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
)
const IcInfo = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)
const IcChevronUpDown = ({ open }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
       style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}>
    <path d="m6 9 6 6 6-6"/>
  </svg>
)
const IcDots = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/>
  </svg>
)
const IcZoomIn = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
)
const IcZoomOut = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/><line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
)
// Same reset asset as DashboardCanvas.jsx's toolbar "Reset" button —
// one shared icon for "reset the view" across the app, not a bespoke glyph.
// Rendered via mask (not <img>) + currentColor so it inherits the button's
// color — red once .dqid-reset-btn--active flips that color, for free.
const IcReset = () => (
  <span
    className="dqid-reset-icon"
    style={{ WebkitMaskImage: 'url(assets/icons/reset.svg)', maskImage: 'url(assets/icons/reset.svg)' }}
  />
)
const IcSource = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6"/><path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/>
  </svg>
)
const IcClose = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
  </svg>
)
const IcJump = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17 17 7"/><path d="M8 7h9v9"/>
  </svg>
)
const IcCopy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)
const IcList = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)
const IcLogic = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.7371 16.6788C11.9804 16.6788 12.1884 16.5941 12.3609 16.4245C12.5333 16.2549 12.6196 16.0484 12.6196 15.8051C12.6196 15.5618 12.5348 15.3538 12.3652 15.1813C12.1956 15.0088 11.9892 14.9226 11.7458 14.9226C11.5025 14.9226 11.2946 15.0074 11.1221 15.177C10.9496 15.3466 10.8633 15.553 10.8633 15.7963C10.8633 16.0397 10.9481 16.2476 11.1177 16.4201C11.2873 16.5926 11.4938 16.6788 11.7371 16.6788ZM16.4967 9.91614C16.74 9.91614 16.9479 9.83135 17.1204 9.66176C17.2929 9.49218 17.3792 9.28572 17.3792 9.04239C17.3792 8.79905 17.2944 8.59114 17.1248 8.41864C16.9552 8.246 16.7488 8.15968 16.5054 8.15968C16.2621 8.15968 16.0542 8.24454 15.8817 8.41426C15.7092 8.58385 15.6229 8.7903 15.6229 9.03364C15.6229 9.27697 15.7077 9.48489 15.8773 9.65739C16.0469 9.82989 16.2533 9.91614 16.4967 9.91614ZM9.03002 8.79114C9.18349 8.79114 9.3121 8.73961 9.41585 8.63655C9.51974 8.5335 9.57168 8.40586 9.57168 8.25364C9.57168 8.10128 9.51974 7.97225 9.41585 7.86655C9.3121 7.76072 9.18349 7.7078 9.03002 7.7078H5.75106C5.59759 7.7078 5.46897 7.75933 5.36522 7.86239C5.26134 7.96544 5.20939 8.09308 5.20939 8.2453C5.20939 8.39767 5.26134 8.52669 5.36522 8.63239C5.46897 8.73822 5.59759 8.79114 5.75106 8.79114H9.03002ZM9.03002 12.2911C9.18349 12.2911 9.3121 12.2396 9.41585 12.1366C9.51974 12.0335 9.57168 11.9059 9.57168 11.7536C9.57168 11.6013 9.51974 11.4722 9.41585 11.3666C9.3121 11.2607 9.18349 11.2078 9.03002 11.2078H5.75106C5.59759 11.2078 5.46897 11.2593 5.36522 11.3624C5.26134 11.4654 5.20939 11.5931 5.20939 11.7453C5.20939 11.8977 5.26134 12.0267 5.36522 12.1324C5.46897 12.2382 5.59759 12.2911 5.75106 12.2911H9.03002ZM3.75752 15.5828C3.38238 15.5828 3.06529 15.4532 2.80627 15.1941C2.54724 14.9349 2.41772 14.6176 2.41772 14.2422V5.7501C2.41772 5.37468 2.54724 5.0585 2.80627 4.80155C3.06529 4.54461 3.38238 4.41614 3.75752 4.41614H17.0427C17.1962 4.41614 17.3248 4.46767 17.4286 4.57072C17.5324 4.67378 17.5844 4.80142 17.5844 4.95364C17.5844 5.106 17.5324 5.23503 17.4286 5.34072C17.3248 5.44655 17.1962 5.49947 17.0427 5.49947H3.75752C3.69335 5.49947 3.6346 5.52621 3.58127 5.57968C3.52779 5.63301 3.50106 5.69176 3.50106 5.75593V14.243C3.50106 14.3072 3.52779 14.3659 3.58127 14.4193C3.6346 14.4727 3.69335 14.4995 3.75752 14.4995H7.73835C7.89182 14.4995 8.02043 14.551 8.12418 14.6541C8.22807 14.7571 8.28002 14.8847 8.28002 15.037C8.28002 15.1893 8.22807 15.3184 8.12418 15.4241C8.02043 15.5299 7.89182 15.5828 7.73835 15.5828H3.75752ZM11.7415 17.7622C11.1966 17.7622 10.7335 17.5716 10.3521 17.1905C9.97071 16.8094 9.78002 16.3467 9.78002 15.8024C9.78002 15.3525 9.91217 14.9545 10.1765 14.6084C10.4409 14.2623 10.782 14.0316 11.1998 13.9161V12.7976C11.1998 12.6077 11.264 12.4486 11.3923 12.3203C11.5208 12.1918 11.6799 12.1276 11.8696 12.1276H15.9594V10.9226C15.5416 10.8072 15.2006 10.577 14.9363 10.232C14.6718 9.88683 14.5396 9.48905 14.5396 9.03864C14.5396 8.49336 14.7303 8.03003 15.1117 7.64864C15.4931 7.26711 15.9562 7.07635 16.5011 7.07635C17.0459 7.07635 17.509 7.2669 17.8904 7.64801C18.2718 8.02912 18.4625 8.4919 18.4625 9.03635C18.4625 9.48607 18.3303 9.88405 18.0658 10.2303C17.8015 10.5764 17.4605 10.8072 17.0427 10.9226V12.5411C17.0427 12.7309 16.9786 12.89 16.8502 13.0184C16.7218 13.1468 16.5627 13.2109 16.3729 13.2109H12.2831V13.9161C12.7009 14.0316 13.042 14.2618 13.3063 14.6068C13.5707 14.9518 13.7029 15.3495 13.7029 15.8001C13.7029 16.3454 13.5122 16.8087 13.1308 17.1901C12.7495 17.5715 12.2863 17.7622 11.7415 17.7622Z"/>
  </svg>
)

// ── One icon per pipeline stage type — swapped in for the module chip's dot
// so Data/Extraction/Resolution/Entity Resolution/Enrichment/Publish each
// read as a distinct step rather than six identically-shaped dots. ────────
const IcStageData = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M3 5v14a9 3 0 0 0 18 0V5"/>
    <path d="M3 12a9 3 0 0 0 18 0"/>
  </svg>
)
const IcStageExtraction = () => (
  <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.125 1.5625C3.04212 1.5625 2.96263 1.59542 2.90403 1.65403C2.84542 1.71263 2.8125 1.79212 2.8125 1.875V13.125C2.8125 13.2079 2.84542 13.2874 2.90403 13.346C2.96263 13.4046 3.04212 13.4375 3.125 13.4375H4.21875C4.34307 13.4375 4.4623 13.4869 4.55021 13.5748C4.63811 13.6627 4.6875 13.7819 4.6875 13.9062C4.6875 14.0306 4.63811 14.1498 4.55021 14.2377C4.4623 14.3256 4.34307 14.375 4.21875 14.375H3.125C2.79348 14.375 2.47554 14.2433 2.24112 14.0089C2.0067 13.7745 1.875 13.4565 1.875 13.125V1.875C1.875 1.54348 2.0067 1.22554 2.24112 0.991117C2.47554 0.756696 2.79348 0.625 3.125 0.625H9.36375C9.69524 0.625071 10.0131 0.756813 10.2475 0.99125L12.7587 3.5025C12.9932 3.73687 13.1249 4.05476 13.125 4.38625V13.125C13.125 13.4565 12.9933 13.7745 12.7589 14.0089C12.5245 14.2433 12.2065 14.375 11.875 14.375H10.1562C10.0319 14.375 9.9127 14.3256 9.82479 14.2377C9.73689 14.1498 9.6875 14.0306 9.6875 13.9062C9.6875 13.7819 9.73689 13.6627 9.82479 13.5748C9.9127 13.4869 10.0319 13.4375 10.1562 13.4375H11.875C11.9579 13.4375 12.0374 13.4046 12.096 13.346C12.1546 13.2874 12.1875 13.2079 12.1875 13.125V4.38625C12.1876 4.34518 12.1796 4.30451 12.1639 4.26654C12.1482 4.22858 12.1253 4.19407 12.0963 4.165L9.585 1.65375C9.55593 1.62475 9.52142 1.60176 9.48346 1.58611C9.44549 1.57045 9.40482 1.56243 9.36375 1.5625H3.125Z" fill="currentColor"/>
    <path d="M7.1875 9.84375C7.1875 9.71943 7.23689 9.6002 7.32479 9.51229C7.4127 9.42439 7.53193 9.375 7.65625 9.375H8.28125C8.40557 9.375 8.5248 9.42439 8.61271 9.51229C8.70061 9.6002 8.75 9.71943 8.75 9.84375C8.75 9.96807 8.70061 10.0873 8.61271 10.1752C8.5248 10.2631 8.40557 10.3125 8.28125 10.3125H7.65625C7.53193 10.3125 7.4127 10.2631 7.32479 10.1752C7.23689 10.0873 7.1875 9.96807 7.1875 9.84375ZM7.65625 7.5C7.53193 7.5 7.4127 7.54939 7.32479 7.63729C7.23689 7.7252 7.1875 7.84443 7.1875 7.96875C7.1875 8.09307 7.23689 8.2123 7.32479 8.30021C7.4127 8.38811 7.53193 8.4375 7.65625 8.4375H8.28125C8.40557 8.4375 8.5248 8.38811 8.61271 8.30021C8.70061 8.2123 8.75 8.09307 8.75 7.96875C8.75 7.84443 8.70061 7.7252 8.61271 7.63729C8.5248 7.54939 8.40557 7.5 8.28125 7.5H7.65625ZM7.1875 6.09375C7.1875 5.96943 7.23689 5.8502 7.32479 5.76229C7.4127 5.67439 7.53193 5.625 7.65625 5.625H8.28125C8.40557 5.625 8.5248 5.67439 8.61271 5.76229C8.70061 5.8502 8.75 5.96943 8.75 6.09375C8.75 6.21807 8.70061 6.3373 8.61271 6.42521C8.5248 6.51311 8.40557 6.5625 8.28125 6.5625H7.65625C7.53193 6.5625 7.4127 6.51311 7.32479 6.42521C7.23689 6.3373 7.1875 6.21807 7.1875 6.09375ZM7.65625 3.75C7.53193 3.75 7.4127 3.79939 7.32479 3.88729C7.23689 3.9752 7.1875 4.09443 7.1875 4.21875C7.1875 4.34307 7.23689 4.4623 7.32479 4.55021C7.4127 4.63811 7.53193 4.6875 7.65625 4.6875H8.28125C8.40557 4.6875 8.5248 4.63811 8.61271 4.55021C8.70061 4.4623 8.75 4.34307 8.75 4.21875C8.75 4.09443 8.70061 3.9752 8.61271 3.88729C8.5248 3.79939 8.40557 3.75 8.28125 3.75H7.65625ZM7.1875 2.34375C7.1875 2.21943 7.23689 2.1002 7.32479 2.01229C7.4127 1.92439 7.53193 1.875 7.65625 1.875H8.28125C8.40557 1.875 8.5248 1.92439 8.61271 2.01229C8.70061 2.1002 8.75 2.21943 8.75 2.34375C8.75 2.46807 8.70061 2.5873 8.61271 2.67521C8.5248 2.76311 8.40557 2.8125 8.28125 2.8125H7.65625C7.53193 2.8125 7.4127 2.76311 7.32479 2.67521C7.23689 2.5873 7.1875 2.46807 7.1875 2.34375ZM6.09375 8.4375C5.96943 8.4375 5.8502 8.48689 5.76229 8.57479C5.67439 8.6627 5.625 8.78193 5.625 8.90625C5.625 9.03057 5.67439 9.1498 5.76229 9.23771C5.8502 9.32561 5.96943 9.375 6.09375 9.375H6.71875C6.84307 9.375 6.9623 9.32561 7.05021 9.23771C7.13811 9.1498 7.1875 9.03057 7.1875 8.90625C7.1875 8.78193 7.13811 8.6627 7.05021 8.57479C6.9623 8.48689 6.84307 8.4375 6.71875 8.4375H6.09375ZM5.625 7.03125C5.625 6.90693 5.67439 6.7877 5.76229 6.69979C5.8502 6.61189 5.96943 6.5625 6.09375 6.5625H6.71875C6.84307 6.5625 6.9623 6.61189 7.05021 6.69979C7.13811 6.7877 7.1875 6.90693 7.1875 7.03125C7.1875 7.15557 7.13811 7.2748 7.05021 7.36271C6.9623 7.45061 6.84307 7.5 6.71875 7.5H6.09375C5.96943 7.5 5.8502 7.45061 5.76229 7.36271C5.67439 7.2748 5.625 7.15557 5.625 7.03125ZM6.09375 4.6875C5.96943 4.6875 5.8502 4.73689 5.76229 4.82479C5.67439 4.9127 5.625 5.03193 5.625 5.15625C5.625 5.28057 5.67439 5.3998 5.76229 5.48771C5.8502 5.57561 5.96943 5.625 6.09375 5.625H6.71875C6.84307 5.625 6.9623 5.57561 7.05021 5.48771C7.13811 5.3998 7.1875 5.28057 7.1875 5.15625C7.1875 5.03193 7.13811 4.9127 7.05021 4.82479C6.9623 4.73689 6.84307 4.6875 6.71875 4.6875H6.09375ZM5.625 3.28125C5.625 3.15693 5.67439 3.0377 5.76229 2.94979C5.8502 2.86189 5.96943 2.8125 6.09375 2.8125H6.71875C6.84307 2.8125 6.9623 2.86189 7.05021 2.94979C7.13811 3.0377 7.1875 3.15693 7.1875 3.28125C7.1875 3.40557 7.13811 3.5248 7.05021 3.61271C6.9623 3.70061 6.84307 3.75 6.71875 3.75H6.09375C5.96943 3.75 5.8502 3.70061 5.76229 3.61271C5.67439 3.5248 5.625 3.40557 5.625 3.28125ZM6.875 10.625H7.5C7.83152 10.625 8.14946 10.7567 8.38388 10.9911C8.6183 11.2255 8.75 11.5435 8.75 11.875V14.5312C8.75 14.6556 8.70061 14.7748 8.61271 14.8627C8.5248 14.9506 8.40557 15 8.28125 15H6.09375C5.96943 15 5.8502 14.9506 5.76229 14.8627C5.67439 14.7748 5.625 14.6556 5.625 14.5312V11.875C5.625 11.5435 5.7567 11.2255 5.99112 10.9911C6.22554 10.7567 6.54348 10.625 6.875 10.625ZM6.5625 11.875V14.0625H7.8125V11.875C7.8125 11.7921 7.77958 11.7126 7.72097 11.654C7.66237 11.5954 7.58288 11.5625 7.5 11.5625H6.875C6.79212 11.5625 6.71263 11.5954 6.65403 11.654C6.59542 11.7126 6.5625 11.7921 6.5625 11.875Z" fill="currentColor"/>
  </svg>
)
const IcStageResolution = () => (
  <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.1875 12.4763V11.8513H12.8125V12.4763H2.1875ZM2.1875 3.14941V2.52441H12.8125V3.14941H2.1875ZM2.1875 5.64941V4.68754H3.14938V5.64941H2.1875ZM11.8512 5.64941V4.68754H12.8125V5.64941H11.8512ZM2.1875 10.3125V9.35129H3.14938V10.3125H2.1875ZM11.8512 10.3125V9.35129H12.8125V10.3125H11.8512ZM5.3125 10.3125V7.81254H2.1875V7.18754H5.3125V4.68754H9.6875V7.18754H12.8125V7.81254H9.6875V10.3125H5.3125Z" fill="currentColor"/>
  </svg>
)
const IcStageEntityExtraction = () => (
  <svg width="12" height="12" viewBox="0 0 17 17" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.30929 8.07961C4.30929 9.22572 4.6954 10.2165 5.46763 11.0519C6.23985 11.8874 7.19435 12.3534 8.33113 12.4499C8.44391 12.4679 8.53191 12.5198 8.59513 12.6056C8.65846 12.6915 8.69013 12.7931 8.69013 12.9103C8.69013 13.0522 8.63435 13.1582 8.52279 13.2283C8.41124 13.2983 8.28324 13.3243 8.13879 13.3064C6.79435 13.156 5.67557 12.5848 4.78246 11.5929C3.88924 10.6011 3.44263 9.42666 3.44263 8.06978C3.44263 6.72755 3.88624 5.55861 4.77346 4.56294C5.66068 3.56727 6.77391 2.99544 8.11313 2.84744C8.25502 2.82955 8.38557 2.85561 8.50479 2.92561C8.62402 2.99572 8.68363 3.10172 8.68363 3.24361C8.68363 3.36083 8.65307 3.46239 8.59196 3.54828C8.53085 3.63405 8.44391 3.68594 8.33113 3.70394C7.19435 3.8005 6.23985 4.26739 5.46763 5.10461C4.6954 5.94183 4.30929 6.9335 4.30929 8.07961ZM12.4131 8.51028H7.70863C7.58585 8.51028 7.48307 8.46911 7.40029 8.38678C7.31741 8.30455 7.27596 8.20244 7.27596 8.08044C7.27596 7.95844 7.31741 7.85516 7.40029 7.77061C7.48307 7.68594 7.58585 7.64361 7.70863 7.64361H12.4068L11.1913 6.42178C11.1033 6.33378 11.0621 6.23272 11.0676 6.11861C11.0732 6.0045 11.12 5.90344 11.208 5.81544C11.2961 5.72744 11.3975 5.68344 11.5123 5.68344C11.6272 5.68344 11.7266 5.72744 11.8106 5.81544L13.7003 7.70511C13.8097 7.81044 13.8645 7.93339 13.8645 8.07394C13.8645 8.21439 13.8097 8.33933 13.7003 8.44878L11.8106 10.3384C11.7225 10.4264 11.6221 10.4716 11.5093 10.4738C11.3965 10.4759 11.2961 10.4333 11.208 10.3461C11.12 10.2589 11.076 10.1557 11.076 10.0364C11.076 9.91733 11.12 9.81372 11.208 9.72561L12.4131 8.51028Z"/>
  </svg>
)
const IcStageEntityResolution = () => (
  <svg width="12" height="12" viewBox="0 0 17 17" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.13927 13.3437C7.18883 13.3437 6.37344 13.0035 5.69311 12.3232C5.01277 11.6429 4.67261 10.8275 4.67261 9.87704C4.67261 8.99049 4.966 8.22376 5.55277 7.57687C6.13955 6.92999 6.85727 6.55565 7.70594 6.45387V3.58254C7.70594 3.45921 7.74711 3.35526 7.82944 3.27071C7.91166 3.18604 8.01377 3.14371 8.13577 3.14371C8.25777 3.14371 8.36105 3.18526 8.44561 3.26837C8.53027 3.35148 8.57261 3.45465 8.57261 3.57787V6.44754C9.43238 6.55354 10.1529 6.92999 10.7341 7.57687C11.3153 8.22376 11.6059 8.99049 11.6059 9.87704C11.6059 10.8275 11.2686 11.6429 10.5938 12.3232C9.919 13.0035 9.10083 13.3437 8.13927 13.3437ZM8.15594 12.477C8.79927 12.477 9.36011 12.271 9.83844 11.859C10.3168 11.4472 10.6089 10.9309 10.7149 10.3104H5.59694C5.70294 10.9309 5.99511 11.4472 6.47344 11.859C6.95177 12.271 7.51261 12.477 8.15594 12.477ZM5.59694 9.44371H10.7149C10.6201 8.82315 10.3318 8.30693 9.85011 7.89504C9.36844 7.48304 8.80372 7.27704 8.15594 7.27704C7.50816 7.27704 6.94344 7.48304 6.46177 7.89504C5.98011 8.30693 5.69183 8.82315 5.59694 9.44371Z"/>
  </svg>
)
const IcStageEnrichment = () => (
  <svg width="12" height="12" viewBox="0 0 15 15" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.125 6.09375H14.0625V7.03125H13.125V6.09375ZM11.1459 2.24859L11.8088 1.58578L12.4716 2.24859L11.8088 2.91141L11.1459 2.24859ZM7.03125 0H7.96875V0.9375H7.03125V0ZM3.19125 2.92172L2.52797 2.25844L3.19125 1.59563L3.85406 2.25844L3.19125 2.92172ZM0.9375 6.09375H1.875V7.03125H0.9375V6.09375ZM6.09375 14.0625H8.90625V15H6.09375V14.0625ZM5.15625 12.1875H9.84375V13.125H5.15625V12.1875ZM7.5 1.875C4.92188 1.875 2.8125 3.98438 2.8125 6.5625C2.8125 8.625 3.75 9.51562 4.45312 10.125C4.92188 10.5469 5.15625 10.8281 5.15625 11.25H6.09375C6.09375 10.4062 5.57812 9.89062 5.0625 9.42188C4.40625 8.85938 3.75 8.20312 3.75 6.5625C3.75 4.5 5.4375 2.8125 7.5 2.8125C9.5625 2.8125 11.25 4.5 11.25 6.5625C11.25 8.20312 10.5938 8.85938 9.9375 9.42188C9.42188 9.89062 8.90625 10.3594 8.90625 11.25H9.84375C9.84375 10.8281 10.0781 10.5469 10.5469 10.125C11.25 9.51562 12.1875 8.625 12.1875 6.5625C12.1875 3.98438 10.0781 1.875 7.5 1.875Z"/>
  </svg>
)
const IcStagePublish = () => (
  <svg width="12" height="12" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="0.9375" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.7493 6.24989L6.8743 8.12489M12.6793 1.89427C12.7386 1.8738 12.8025 1.87043 12.8636 1.88455C12.9247 1.89866 12.9807 1.92969 13.025 1.97409C13.0693 2.01848 13.1003 2.07445 13.1143 2.1356C13.1283 2.19675 13.1249 2.26062 13.1043 2.31989L9.4018 12.9011C9.37965 12.9644 9.339 13.0195 9.28512 13.0594C9.23125 13.0993 9.16664 13.122 9.09967 13.1247C9.03271 13.1274 8.96648 13.1099 8.90957 13.0745C8.85267 13.0391 8.80772 12.9874 8.78055 12.9261L6.76868 8.39989C6.73483 8.32462 6.67457 8.26437 6.5993 8.23052L2.07305 6.21802C2.01199 6.19075 1.9605 6.1458 1.92524 6.08898C1.88999 6.03215 1.87258 5.96606 1.87527 5.89923C1.87796 5.83241 1.90063 5.76793 1.94034 5.71413C1.98006 5.66032 2.03499 5.61966 2.09805 5.59739L12.6793 1.89427Z"/>
  </svg>
)
const STAGE_ICONS = {
  'Data': IcStageData,
  'Entity Source Extraction': IcStageExtraction,
  'Entity Source Resolution': IcStageResolution,
  'Entity Extraction': IcStageEntityExtraction,
  'Entity Resolution': IcStageEntityResolution,
  'Enrichment': IcStageEnrichment,
  'Publish': IcStagePublish,
}
function StageIcon({ label }) {
  const Icon = STAGE_ICONS[label]
  return Icon ? <Icon /> : <span className="dqid-module-dot" />
}
// Pipeline stage chips always use the generic stage glyph — real vendor/source
// logos are reserved for data source cards (VendorNode, Mapped Sources tiles).
function StageChipIcon({ node }) {
  return <StageIcon label={node.label} />
}

// ── Entity glyph map — same 17 KG entity types / colors as DataQualityOverviewPage.jsx,
// duplicated locally so this page has no import-order dependency on that file. ──
const GLYPH_TO_FILE = {
  account: 'entity-account.svg', identity: 'entity-identity.svg', group: 'entity-group.svg',
  person: 'entity-person.svg', application: 'entity-application.svg', vulnerability: 'entity-vulnerability.svg',
  assessment: 'entity-assessment.svg', cluster: 'entity-cluster.svg', container: 'entity-cloud-container.svg',
  cloud: 'entity-cloud-account.svg', finding: 'entity-finding.svg', ticket: 'entity-ticket.svg',
  host: 'entity-host.svg', network: 'entity-network.svg', netsvc: 'entity-network-services.svg',
  netiface: 'entity-network-interface.svg', storage: 'entity-storage.svg',
}
const GLYPH_COLORS = {
  account:       { tint: '#F1ECF9', tintDark: '#1E1228', stroke: '#D3C3EC', strokeDark: '#3D2558', icon: '#9269CF' },
  identity:      { tint: '#F4E6F9', tintDark: '#22102E', stroke: '#DCB3ED', strokeDark: '#4D1E68', icon: '#A842D2' },
  group:         { tint: '#E3F6F7', tintDark: '#0D2A2B', stroke: '#A9E5E7', strokeDark: '#1A5254', icon: '#27BDC2' },
  person:        { tint: '#E4EDF1', tintDark: '#0E1F28', stroke: '#ABC8D3', strokeDark: '#1D3E50', icon: '#2E7690' },
  application:   { tint: '#F4EEE6', tintDark: '#261B0D', stroke: '#DECCB1', strokeDark: '#4E381A', icon: '#AD803D' },
  vulnerability: { tint: '#F4E9E9', tintDark: '#261313', stroke: '#DFBCBC', strokeDark: '#4E2626', icon: '#AE5757' },
  assessment:    { tint: '#F4ECE5', tintDark: '#241808', stroke: '#DEC4AF', strokeDark: '#4A3018', icon: '#AC6C36' },
  cluster:       { tint: '#E5E5F5', tintDark: '#0D0D28', stroke: '#AEAEE1', strokeDark: '#1A1A50', icon: '#3434B4' },
  container:     { tint: '#EBE4F2', tintDark: '#180C24', stroke: '#C2ADD7', strokeDark: '#321848', icon: '#66329C' },
  cloud:         { tint: '#E6E7F5', tintDark: '#0D1028', stroke: '#B1B4DF', strokeDark: '#1A2050', icon: '#3B43B0' },
  finding:       { tint: '#E9E4F6', tintDark: '#130A2A', stroke: '#BCABE4', strokeDark: '#281455', icon: '#582DBB' },
  ticket:        { tint: '#E6F6F4', tintDark: '#0D2A27', stroke: '#B1E3DE', strokeDark: '#1A524E', icon: '#3DBAAD' },
  host:          { tint: '#E3E9F1', tintDark: '#0A1520', stroke: '#AABBD3', strokeDark: '#163060', icon: '#2B5690' },
  network:       { tint: '#DEF0EA', tintDark: '#0A2018', stroke: '#99D0BF', strokeDark: '#143E30', icon: '#00895E' },
  netsvc:        { tint: '#F0F4E4', tintDark: '#1C230D', stroke: '#D0DCAD', strokeDark: '#38461A', icon: '#89A833' },
  netiface:      { tint: '#F6E6F0', tintDark: '#280D1E', stroke: '#E3B1D1', strokeDark: '#50183A', icon: '#BA3D8C' },
  storage:       { tint: '#E5F1F7', tintDark: '#0C2030', stroke: '#B0D5E7', strokeDark: '#184060', icon: '#3A96C4' },
}
function EntityIcon({ glyph, size = 16 }) {
  const file = GLYPH_TO_FILE[glyph]
  const colors = GLYPH_COLORS[glyph]
  if (!file) return null
  const maskUrl = `url(assets/icons/${file})`
  return (
    <span
      className="dqid-entity-badge"
      style={{
        width: size + 16, height: size + 16,
        '--dq-badge-tint': colors?.tint, '--dq-badge-tint-dark': colors?.tintDark,
        '--dq-badge-stroke': colors?.stroke, '--dq-badge-stroke-dark': colors?.strokeDark,
        '--dq-badge-icon': colors?.icon,
      }}
    >
      <span className="dq-entity-icon" style={{ width: size, height: size, WebkitMaskImage: maskUrl, maskImage: maskUrl }} />
    </span>
  )
}

const KG_ENTITY_TYPES = [
  { id: 'account',       name: 'Account',            glyph: 'account' },
  { id: 'identity',      name: 'Identity',           glyph: 'identity' },
  { id: 'group',         name: 'Group',              glyph: 'group' },
  { id: 'person',        name: 'Person',             glyph: 'person' },
  { id: 'application',   name: 'Application',        glyph: 'application' },
  { id: 'vulnerability', name: 'Vulnerability',      glyph: 'vulnerability' },
  { id: 'assessment',    name: 'Assessment',         glyph: 'assessment' },
  { id: 'cluster',       name: 'Cluster',            glyph: 'cluster' },
  { id: 'container',     name: 'Container',          glyph: 'container' },
  { id: 'cloudAccount',  name: 'Cloud Account',      glyph: 'cloud' },
  { id: 'finding',       name: 'Finding',            glyph: 'finding' },
  { id: 'ticket',        name: 'Ticket',             glyph: 'ticket' },
  { id: 'host',          name: 'Host',               glyph: 'host' },
  { id: 'network',       name: 'Network',            glyph: 'network' },
  { id: 'netSvc',        name: 'Network Services',   glyph: 'netsvc' },
  { id: 'netIface',      name: 'Network Interface',  glyph: 'netiface' },
  { id: 'storage',       name: 'Storage',            glyph: 'storage' },
]

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))

// Same hash + score formula as DataQualityOverviewPage.jsx's ENTITIES, so an
// entity's score reads identically on both pages instead of drifting apart.
function hashInt(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

// ── Real screenshot data ─────────────────────────────────────────────────
// Keyed by entity id, then dimension label. Only what's been screenshotted
// lives here — every other entity/dimension keeps generating deterministic
// dummy data below (see buildDummyVendors / buildFanInLineage), and gets
// swapped for real data only when a screenshot is provided for it.
//
// Shape: vendors -> groups (one Entity Source Resolution node each) -> tables
// (one Data + Entity Source Extraction pair each). Most groups have a single
// table (a plain 1:1:1 chain), but a group can fan in several raw tables into
// one resolution node — e.g. Azure AD's Sign-in Logs/User Registration/
// Directory Members/Users tables all resolve into one shared "MS Azure AD" node.
const REAL_OVERRIDES = {
  account: {
    Completeness: {
      score: 56,
      mergeScores: { entityResolve: 55, enrichment: 56, publish: 56 },
      mergeCounts: { entityResolve: 88, enrichment: 89, publish: 105 },
      mergeKnownAttrs: [
        'account_display_label', 'account_display_name', 'account_name', 'account_never_expires',
        'activity_status', 'class', 'count_of_origin', 'data_source_dev', 'data_source_subtype', 'display_label',
      ],
      enrichmentKnownAttrs: [
        'account_display_label', 'account_display_name', 'account_name', 'account_never_expires',
        'activity_status', 'associated_identities', 'class', 'count_of_origin', 'data_source_dev', 'data_source_subtype', 'display_label',
      ],
      vendors: [
        { name: 'AWS', groups: [
          {
            id: 'aws-cloudtrail', resolutionName: 'AWS Cloudtrail',
            resolutionScore: 79, resolutionCount: 47,
            resolutionAttrs: ['account_display_label', 'account_id', 'account_name', 'activity_status', 'class', 'count_of_origin', 'data_source_dev', 'data_source_subtype', 'display_label', 'first_found_date'],
            tables: [{
              id: 'aws-cloudtrail-t', dataName: 'AWS Cloudtrail', extractionName: 'AWS Cloudtrail',
              dataScore: 100, dataCount: 28,
              dataAttrs: ['AccessKeyId', 'CloudTrailEvent', 'EventId', 'EventName', 'EventSource', 'EventTime', 'ReadOnly', 'Username', 'class', 'event_timestamp'],
              extractionScore: 79, extractionCount: 43,
              extractionAttrs: ['account_display_label', 'account_id', 'account_name', 'activity_status', 'class', 'data_source_dev', 'data_source_subtype', 'display_label', 'first_found_date', 'first_seen_date'],
            }],
          },
          {
            // Screenshot showed a dash score here (likely mid-load in the real
            // product) — per the confirmed dummy-fill approach, a plausible
            // score is generated instead of replicating the dash state.
            id: 'aws-iam-users', resolutionName: 'AWS IAM List Users',
            resolutionScore: 61, resolutionCount: 48,
            resolutionAttrs: ['account_display_label', 'account_id', 'account_name', 'activity_status', 'aws_account_created', 'business_unit', 'class', 'count_of_origin', 'data_source_dev', 'data_source_subtype'],
            tables: [{
              id: 'aws-iam-users-t', dataName: 'AWS IAM Users', extractionName: 'AWS IAM Users',
              dataScore: 72, dataCount: 27,
              dataAttrs: ['Arn', 'CreateDate', 'PasswordLastUsed', 'Path', 'UserId', 'UserName', 'class', 'event_timestamp_created', 'event_timestamp_updated', 'event_timestamp_synced'],
              extractionScore: 58, extractionCount: 44,
              extractionAttrs: ['account_display_label', 'account_id', 'account_name', 'activity_status', 'aws_account_created', 'business_unit', 'class', 'data_source_dev', 'data_source_subtype', 'department'],
            }],
          },
          {
            id: 'aws-iam-center', resolutionName: 'AWS IAM Security Center Permission Set Assignment',
            resolutionScore: 67, resolutionCount: 50,
            resolutionAttrs: ['account_display_label', 'account_id', 'account_name', 'aws_account_created', 'class', 'count_of_origin', 'data_source_dev', 'data_source_subtype', 'display_label', 'first_found_date'],
            tables: [{
              id: 'aws-iam-center-t', dataName: 'AWS IAM Center', extractionName: 'AWS IAM Center',
              dataScore: 87, dataCount: 44,
              dataAttrs: ['AccountId', 'CreatedDate', 'DisplayName', 'Emails', 'IdentityStoreId', 'InstanceArn', 'Name', 'OwnerAccountId', 'PermissionSetArn', 'PrincipalId'],
              extractionScore: 66, extractionCount: 46,
              extractionAttrs: ['account_display_label', 'account_id', 'account_name', 'aws_account_created', 'class', 'data_source_dev', 'data_source_subtype', 'display_label', 'first_found_date', 'first_seen_date'],
            }],
          },
        ] },
        { name: 'MS Azure AD', groups: [
          {
            id: 'azure-ad', resolutionName: 'MS Azure AD',
            resolutionScore: 63, resolutionCount: 72,
            resolutionAttrs: ['aad_id', 'aad_id_with_service_principal', 'aad_id_with_service_principal_alt', 'account_display_label', 'account_name', 'activity_status', 'class', 'company_email_address', 'count_of_origin', 'data_source_dev'],
            tables: [
              {
                id: 'azure-signin-1', dataName: 'MS Azure AD Sign-in Logs User Principal Name', extractionName: 'MS Azure AD Sign-in Logs User Principal Name',
                dataScore: 95, dataCount: 43,
                dataAttrs: ['appDisplayName', 'appId', 'class', 'conditionalAccessStatus', 'correlationId', 'createdDateTime', 'deviceDetail', 'event_timestamp_created', 'event_timestamp_processed', 'event_timestamp_ingested'],
                extractionScore: 78, extractionCount: 49,
                extractionAttrs: ['aad_id', 'aad_id_with_service_principal', 'account_display_label', 'account_name', 'activity_status', 'class', 'company_email_address', 'data_source_dev', 'data_source_subtype', 'display_label'],
              },
              {
                id: 'azure-user-reg', dataName: 'MS Azure AD User Registration Details', extractionName: 'MS Azure AD User Registration Details',
                dataScore: 100, dataCount: 36,
                dataAttrs: ['class', 'defaultMfaMethod', 'event_timestamp_created', 'event_timestamp_updated', 'event_timestamp_registered', 'event_timestamp_verified', 'first_found_date', 'id', 'isAdmin', 'isMfaCapable'],
                extractionScore: 71, extractionCount: 47,
                extractionAttrs: ['account_display_label', 'account_name', 'class', 'company_email_address', 'data_source_dev', 'data_source_subtype', 'default_mfa_method', 'display_label', 'first_found_date', 'first_seen_date'],
              },
              {
                // Same truncated display name as azure-signin-1 in the real
                // product — a second, distinct sign-in-logs source table.
                id: 'azure-signin-2', dataName: 'MS Azure AD Sign-in Logs User Principal Name', extractionName: 'MS Azure AD Sign-in Logs User Principal Name',
                dataScore: 95, dataCount: 43,
                dataAttrs: ['appId', 'class', 'conditionalAccessStatus', 'correlationId', 'createdDateTime', 'deviceDetail', 'event_timestamp_created', 'event_timestamp_processed', 'event_timestamp_ingested', 'event_timestamp_expired'],
                extractionScore: 81, extractionCount: 51,
                extractionAttrs: ['aad_id', 'aad_id_with_service_principal', 'aad_id_with_service_principal_alt', 'account_display_label', 'account_name', 'activity_status', 'class', 'company_email_address', 'data_source_dev', 'data_source_subtype'],
              },
              {
                id: 'azure-dir-members', dataName: 'MS Azure AD Directory Members', extractionName: 'MS Azure AD Directory Members',
                dataScore: 97, dataCount: 35,
                dataAttrs: ['__odata_type', 'class', 'displayName', 'event_timestamp_created', 'event_timestamp_updated', 'event_timestamp_synced', 'event_timestamp_verified', 'first_found_date', 'givenName', 'id'],
                extractionScore: 73, extractionCount: 47,
                extractionAttrs: ['account_display_label', 'account_name', 'class', 'company_email_address', 'data_source_dev', 'data_source_subtype', 'display_label', 'entitlement_description', 'entitlement_details', 'entitlement_id'],
              },
              {
                id: 'azure-users', dataName: 'MS Azure AD Users', extractionName: 'MS Azure AD Users',
                dataScore: 52, dataCount: 92,
                dataAttrs: ['accountEnabled', 'class', 'cloudRealtimeCommunicationInfo', 'createdDateTime', 'displayName', 'event_timestamp_created', 'event_timestamp_updated', 'event_timestamp_synced', 'event_timestamp_verified', 'first_found_date'],
                extractionScore: 70, extractionCount: 46,
                extractionAttrs: ['aad_created_date', 'account_display_label', 'account_name', 'class', 'company_email_address', 'data_source_dev', 'data_source_subtype', 'display_label', 'first_found_date', 'first_seen_date'],
              },
            ],
          },
        ] },
        { name: 'MS Active Directory', groups: [
          {
            id: 'active-directory', resolutionName: 'Active Directory',
            resolutionScore: 78, resolutionCount: 59,
            resolutionAttrs: ['account_display_label', 'account_name', 'account_never_expires', 'activity_status', 'ad_created_date', 'ad_sam_account_name', 'bad_password_count', 'bad_password_count_reset', 'class', 'count_of_origin'],
            tables: [{
              id: 'ad-extract', dataName: 'MS Active Directory Extract', extractionName: 'MS Active Directory Extract',
              dataScore: 33, dataCount: 163,
              dataAttrs: ['CN', 'DisplayName', 'DistinguishedName', 'EmployeeID', 'GivenName', 'MemberOf', 'ObjectCategory', 'ObjectClass', 'ObjectGUID', 'SamAccountName'],
              extractionScore: 78, extractionCount: 55,
              extractionAttrs: ['account_display_label', 'account_name', 'account_never_expires', 'activity_status', 'ad_created_date', 'ad_sam_account_name', 'bad_password_count', 'bad_password_count_reset', 'class', 'data_source_dev'],
            }],
          },
        ] },
      ],
    },
  },
  application: {
    Completeness: {
      score: 78,
      mergeScores: { entityResolve: 78, enrichment: 78, publish: 78 },
      mergeCounts: { entityResolve: 55, enrichment: 58, publish: 65 },
      // Publish/Enrichment/Entity Resolution all showed the identical page-1
      // attribute list in the screenshots, so one shared list covers both
      // mergeKnownAttrs and enrichmentKnownAttrs here (unlike account's, which
      // diverge by one attr). Two names were column-truncated in every
      // screenshot they appeared in ("app_name__reso...", "exclude__temp_p...")
      // — best-effort full names below; "data_source_subtype" is carried over
      // unchanged from account's list since that field's full name is already
      // confirmed there.
      mergeKnownAttrs: [
        'activity_status', 'app_name', 'app_name__resolved', 'class', 'count_of_origin',
        'data_source_dev', 'data_source_subtype', 'display_label', 'exclude__temp_placeholder', 'first_found_date',
      ],
      vendors: [
        { name: 'Mega', groups: [
          {
            // Mega's single source table fans straight into Entity Resolution
            // with no "Entity Source Resolution" merge node in between — see
            // noResolution handling in buildFanInLineage/recomputeEdges.
            id: 'mega-list-apps', noResolution: true,
            tables: [{
              id: 'mega-list-apps-t', dataName: 'Mega List Applications', extractionName: 'Mega List Applications',
              dataScore: 100, dataCount: 24,
              dataAttrs: ['app_criticality', 'app_lifecycle', 'class', 'event_timestamp_created', 'event_timestamp_updated', 'first_found_date', 'internet_facing', 'last_found_date', 'p_id', 'pai_source'],
              extractionScore: 74, extractionCount: 45,
              extractionAttrs: ['activity_status', 'app_name', 'category', 'class', 'criticality', 'data_source_dev', 'data_source_subtype', 'derived_criticality', 'display_label', 'first_found_date'],
            }],
          },
        ] },
        { name: 'Microsoft Defender For Endpoint', groups: [
          {
            id: 'ms-defender', resolutionName: 'MS Defender',
            resolutionScore: 67, resolutionCount: 50,
            resolutionAttrs: ['activity_status', 'app_name', 'app_vendor', 'app_version', 'class', 'count_of_origin', 'data_source_dev', 'data_source_subtype', 'display_label', 'first_found_date'],
            tables: [
              {
                id: 'ms-defender-software', dataName: 'Microsoft Defender For Endpoint Device Software', extractionName: 'Microsoft Defender For Endpoint Device Software',
                dataScore: 97, dataCount: 34,
                dataAttrs: ['class', 'deviceId', 'deviceName', 'endOfSupportStatus', 'event_timestamp_created', 'event_timestamp_updated', 'event_timestamp_scanned', 'event_timestamp_synced', 'first_found_date', 'isValid'],
                extractionScore: 66, extractionCount: 46,
                extractionAttrs: ['activity_status', 'app_name', 'app_vendor', 'app_version', 'class', 'data_source_dev', 'data_source_subtype', 'display_label', 'first_found_date', 'first_seen_date'],
              },
              {
                // Same truncated display name as ms-defender-software in the
                // real product — a second, distinct table (CVE/vulnerability
                // fields here vs. install/inventory fields above).
                id: 'ms-defender-software-cve', dataName: 'Microsoft Defender For Endpoint Device Software', extractionName: 'Microsoft Defender For Endpoint Device Software',
                dataLogo: 'Microsoft Defender For Endpoint Device Software Vulnerability.svg',
                extractionLogo: 'Microsoft Defender For Endpoint Device Software Vulnerability.svg',
                dataScore: 85, dataCount: 49,
                dataAttrs: ['class', 'cveId', 'cvssScore', 'deviceId', 'deviceName', 'event_timestamp_published', 'event_timestamp_discovered', 'event_timestamp_updated', 'event_timestamp_remediated', 'exploitabilityLevel'],
                extractionScore: 63, extractionCount: 45,
                extractionAttrs: ['activity_status', 'app_name', 'app_vendor', 'app_version', 'class', 'data_source_dev', 'data_source_subtype', 'display_label', 'first_found_date', 'first_seen_date'],
              },
            ],
          },
        ] },
      ],
    },
  },
}

const ENTITIES = KG_ENTITY_TYPES.map(e => {
  const h = hashInt(e.id)
  const realCompleteness = REAL_OVERRIDES[e.id]?.Completeness?.score
  return { ...e, score: realCompleteness ?? (10 + (h % 89)), hash: h }
})

// Same 3-tier scale as the Overview gauge/attribute bars.
// Thresholds match ScoreLegend's own copy exactly (Low <=50, Medium 50-75,
// High >75) — these previously drifted from what the legend documented.
function scoreColor(score) {
  if (score > 75) return 'var(--pai-green)'
  if (score > 50) return 'var(--pai-high-fg)'
  return 'var(--pai-crit-fg)'
}

// Same 6 dimensions as DataQualityOverviewPage.jsx's makeDimensions(). The
// first dimension (Completeness) mirrors the entity's headline score exactly
// — every real screenshot so far describes Completeness — and every other
// dimension jitters around it as dummy data until it too is screenshotted.
const DIMENSIONS = ['Completeness', 'Accuracy', 'Integrity', 'Timeliness', 'Validity', 'Uniqueness']
function makeDimensions(entity) {
  return DIMENSIONS.map((label, i) => {
    const real = REAL_OVERRIDES[entity.id]?.[label]?.score
    if (real != null) return { label, value: real }
    if (i === 0) return { label, value: entity.score }
    return { label, value: clamp(entity.score + (((i * 17) % 30) - 15), 2, 100) }
  })
}

// ── Dimension tab strip — Completeness/Accuracy/Integrity/Timeliness/
// Validity/Uniqueness, each with its own score badge; switching tabs
// re-seeds the lineage canvas below (see buildFanInLineage). ──
function DimensionTabStrip({ dims, active, onChange }) {
  return (
    <div className="dqid-dim-tabs">
      {dims.map(d => (
        <button
          key={d.label}
          className={`dqid-dim-tab${d.label === active ? ' dqid-dim-tab--active' : ''}`}
          onClick={() => onChange(d.label)}
        >
          <span className="dqid-dim-tab__label">{d.label}</span>
          <span className="dqid-dim-tab__pct">{d.value}%</span>
        </button>
      ))}
    </div>
  )
}

// ── Fan-in lineage model ─────────────────────────────────────────────────
// Vendor -> one or more resolution groups -> one or more raw tables. Most
// groups hold a single table (a plain Data -> Extraction -> Resolution
// chain); a group can also fan in several raw tables that all resolve into
// one shared Resolution node. All resolution groups across all vendors then
// fan into one Entity Resolution -> one Enrichment -> one Publish node.
// Only vendors with a real logo in "Data source logos" (below) — keeps every
// dummy-generated vendor/table node showing a real brand mark instead of a
// mix of real logos and a generic fallback icon.
const VENDOR_POOL = ['AWS', 'ServiceNow', 'CrowdStrike', 'SentinelOne', 'Saviynt', 'Lansweeper']
const TABLE_SUFFIX_POOL = ['Directory Export', 'User Registry Sync', 'Audit Log Feed', 'Access Snapshot', 'Provisioning Export', 'Activity Stream', 'Config Extract', 'Event Stream']

// ── Data-source logos — real assets shipped under public/assets/Data source
// logos/ (163 files, exact table-name matches for most of the real sources
// screenshotted so far). Exact table name wins; vendor name is the fallback
// for dummy-generated or not-yet-cataloged tables. logoSrc() percent-encodes
// the path since every filename here contains spaces. ─────────────────────
const SOURCE_LOGO_MAP = {
  'AWS Cloudtrail': 'logo-aws-cloud-trail.svg',
  'AWS IAM Users': 'AWS IAM Users.svg',
  'AWS IAM Center': 'AWS IAM Center.svg',
  'AWS IAM List Users': 'AWS IAM Users.svg',
  'AWS IAM Security Center Permission Set Assignment': 'AWS IAM Center.svg',
  'MS Azure AD Sign-in Logs User Principal Name': 'MS Azure AD Sign-in Logs.svg',
  'MS Azure AD User Registration Details': 'MS Azure AD User Registration Details.svg',
  'MS Azure AD Directory Members': 'MS Azure AD Directory Members.svg',
  'MS Azure AD Users': 'MS Azure AD Users.svg',
  'MS Azure AD': 'logo-azure.svg',
  'Mega List Applications': 'logo-mega-software.svg',
  'MS Defender': 'MS Defender.svg',
  // Both Application/Defender tables share this exact display name in the
  // real product — this is just the default; the CVE/vulnerability table
  // overrides it via an explicit per-table `dataLogo`/`extractionLogo` below.
  'Microsoft Defender For Endpoint Device Software': 'Microsoft Defender For Endpoint Device Software Inventory.svg',
}
const VENDOR_LOGO_MAP = {
  'AWS': 'logo-aws.svg',
  'MS Azure AD': 'logo-azure.svg',
  'MS Active Directory': 'logo-windows-security-log.svg',
  'ServiceNow': 'logo-service-now.svg',
  'CrowdStrike': 'logo-crowdstrike.svg',
  'SentinelOne': 'logo-sentinel-one.svg',
  'Saviynt': 'logo-saviynt.svg',
  'Lansweeper': 'logo-lansweeper.svg',
  'Mega': 'logo-mega-software.svg',
  'Microsoft Defender For Endpoint': 'MS Defender.svg',
}
function logoForSource(name, vendor) {
  return SOURCE_LOGO_MAP[name] || VENDOR_LOGO_MAP[vendor] || VENDOR_LOGO_MAP[name] || null
}
function logoSrc(file) {
  return encodeURI(`assets/Data source logos/${file}`)
}

const ATTR_PREFIX_POOL = ['source', 'entity', 'contact', 'risk', 'identity', 'access', 'audit', 'sync', 'resolved', 'mapped', 'canonical', 'normalized', 'vendor', 'ingest', 'policy', 'session', 'role', 'tenant', 'org', 'record']
const ATTR_SUFFIX_POOL = ['_id', '_name', '_status', '_flag', '_date', '_score', '_type', '_ref', '_count', '_key', '_source', '_value', '_code', '_at', '_by', '_label']

function fillerAttrName(seed, i, used) {
  let name = ''
  let tries = 0
  do {
    const h = hashInt(`${seed}|${i}|${tries}`)
    const prefix = ATTR_PREFIX_POOL[h % ATTR_PREFIX_POOL.length]
    const suffix = ATTR_SUFFIX_POOL[(h >> 6) % ATTR_SUFFIX_POOL.length]
    name = `${prefix}${suffix}`
    tries++
  } while (used.has(name) && tries < 30)
  used.add(name)
  return name
}

function categoryForAttrName(name) {
  if (/date|_at$|timestamp/i.test(name)) return 'Timestamps'
  if (/id$|_key$|_ref$/i.test(name)) return 'Identifiers'
  if (/email|username|contact/i.test(name)) return 'Contact Info'
  if (/revenue|amount|financial/i.test(name)) return 'Financial'
  return 'Metadata'
}

// Builds a node's attribute list: known real names (from a screenshot) are
// always 100% — every screenshot shows shown attributes fully complete even
// when the node's own aggregate score is much lower — and the remaining rows
// are dummy-filled with jittered scores chosen so the list's average lands
// close to the node's real aggregate score.
function buildAttrRows(knownNames, total, targetScore, seed) {
  const count = Math.max(total, knownNames.length)
  const used = new Set(knownNames)
  const knownRows = knownNames.map(name => ({ name, score: 100, category: categoryForAttrName(name) }))
  const fillerCount = count - knownNames.length
  const fillerRows = []
  if (fillerCount > 0) {
    const neededSum = clamp(targetScore * count - 100 * knownNames.length, 0, fillerCount * 100)
    const fillerAvg = neededSum / fillerCount
    for (let i = 0; i < fillerCount; i++) {
      const h = hashInt(`${seed}|filler|${i}`)
      const score = clamp(Math.round(fillerAvg + ((h % 41) - 20)), 1, 100)
      const name = fillerAttrName(seed, i, used)
      fillerRows.push({ name, score, category: categoryForAttrName(name) })
    }
  }
  return [...knownRows, ...fillerRows]
}

// Deterministic dummy vendor/group/table catalog for entities (or
// dimensions) with no screenshot yet — same shape as REAL_OVERRIDES' vendors.
function buildDummyVendors(entity, dimIndex) {
  const h = entity.hash
  const vendorCount = 1 + (h % 2)
  const vendors = []
  for (let vi = 0; vi < vendorCount; vi++) {
    const vName = VENDOR_POOL[(h + vi * 7 + dimIndex * 3) % VENDOR_POOL.length]
    if (vendors.some(v => v.name === vName)) continue
    const groupCount = 1 + ((h >> (vi * 4 + 2)) % 2)
    const groups = []
    for (let gi = 0; gi < groupCount; gi++) {
      const gh = hashInt(`${entity.id}|${vName}|${gi}|${dimIndex}`)
      const tableCount = 1 + (gh % 2)
      const tables = []
      for (let ti = 0; ti < tableCount; ti++) {
        const th = hashInt(`${entity.id}|${vName}|${gi}|${ti}|${dimIndex}`)
        const suffix = TABLE_SUFFIX_POOL[th % TABLE_SUFFIX_POOL.length]
        tables.push({ id: `${entity.id}-${vi}-${gi}-${ti}`, dataName: `${vName} ${suffix}`, extractionName: `${vName} ${suffix}` })
      }
      groups.push({ id: `${entity.id}-${vi}-${gi}`, resolutionName: `${vName} ${TABLE_SUFFIX_POOL[gh % TABLE_SUFFIX_POOL.length]}`, tables })
    }
    vendors.push({ name: vName, groups })
  }
  return vendors
}

// Assembles the full fan-in lineage for the active entity + dimension tab.
// Pulls from REAL_OVERRIDES when that combination has been screenshotted,
// otherwise falls back to buildDummyVendors + formula-based scores — same
// "real where shown, dummy elsewhere" rule as the rest of this page.
function buildFanInLineage(entity, activeDim, dimScore) {
  const real = REAL_OVERRIDES[entity.id]?.[activeDim]
  const vendorsSrc = real?.vendors || buildDummyVendors(entity, DIMENSIONS.indexOf(activeDim))

  const allTables = []
  const groups = []
  const vendorGroups = vendorsSrc.map(v => {
    const vGroups = v.groups.map(g => {
      const tables = g.tables.map(t => {
        const seed = `${entity.id}|${activeDim}|${t.id}`
        const dataScore = t.dataScore ?? clamp(70 + (hashInt(`${seed}|d`) % 30), 40, 100)
        const extractionScore = t.extractionScore ?? clamp(50 + (hashInt(`${seed}|e`) % 35), 25, 100)
        const dataCount = t.dataCount ?? (15 + (hashInt(`${seed}|cd`) % 20))
        const extractionCount = t.extractionCount ?? (20 + (hashInt(`${seed}|ce`) % 25))
        return {
          id: t.id, vendor: v.name,
          data: {
            id: `${t.id}-data`, label: 'Data', color: '#6B7280', subtitle: t.dataName, isRaw: true,
            logo: t.dataLogo || logoForSource(t.dataName, v.name),
            score: dataScore, attributes: buildAttrRows(t.dataAttrs || [], dataCount, dataScore, `${seed}|data`),
          },
          extraction: {
            id: `${t.id}-extraction`, label: 'Entity Source Extraction', color: '#5859A0', subtitle: t.extractionName,
            logo: t.extractionLogo || logoForSource(t.extractionName, v.name),
            score: extractionScore, attributes: buildAttrRows(t.extractionAttrs || [], extractionCount, extractionScore, `${seed}|extraction`),
          },
        }
      })
      const seed = `${entity.id}|${activeDim}|${g.id}`
      // Some vendors fan a single raw table straight into Entity Resolution
      // with no intervening "Entity Source Resolution" merge step (seen in
      // the Application entity's Mega branch) — g.noResolution skips that
      // node entirely and the table's extraction node wires straight to
      // Entity Resolution instead.
      let resolution = null
      if (!g.noResolution) {
        const resolutionScore = g.resolutionScore ?? clamp(50 + (hashInt(`${seed}|r`) % 35), 25, 100)
        const resolutionCount = g.resolutionCount ?? (25 + (hashInt(`${seed}|cr`) % 30))
        resolution = {
          id: `${g.id}-resolution`, label: 'Entity Source Resolution', color: '#5B496C', subtitle: g.resolutionName,
          logo: g.resolutionLogo || logoForSource(g.resolutionName, v.name),
          score: resolutionScore, attributes: buildAttrRows(g.resolutionAttrs || [], resolutionCount, resolutionScore, `${seed}|resolution`),
        }
      }
      const group = {
        id: g.id, vendor: v.name, tableCount: tables.length, tables,
        resolution,
      }
      allTables.push(...tables)
      groups.push(group)
      return group
    })
    return { name: v.name, logo: VENDOR_LOGO_MAP[v.name] || null, tableCount: vGroups.reduce((s, g) => s + g.tableCount, 0), groups: vGroups }
  })

  const mergeScores = real?.mergeScores || {
    entityResolve: clamp(dimScore - 1 - (entity.hash % 4), 5, 100),
    enrichment: clamp(dimScore - (entity.hash % 2), 5, 100),
    publish: dimScore,
  }
  const baseCount = 40 + (entity.hash % 40)
  const mergeCounts = real?.mergeCounts || {
    entityResolve: baseCount,
    enrichment: baseCount + 1,
    publish: baseCount + 1 + 8 + (entity.hash % 10),
  }
  const knownBase = real?.mergeKnownAttrs || []
  const knownEnrich = real?.enrichmentKnownAttrs || knownBase

  const mergeNodes = {
    entityResolve: {
      id: 'entityResolve', label: 'Entity Resolution', color: '#7FA6D8', subtitle: entity.name,
      score: mergeScores.entityResolve, attributes: buildAttrRows(knownBase, mergeCounts.entityResolve, mergeScores.entityResolve, `${entity.id}|${activeDim}|er`),
    },
    enrichment: {
      id: 'enrichment', label: 'Enrichment', color: '#3E8098', subtitle: entity.name,
      score: mergeScores.enrichment, attributes: buildAttrRows(knownEnrich, mergeCounts.enrichment, mergeScores.enrichment, `${entity.id}|${activeDim}|en`),
    },
    publish: {
      id: 'publish', label: 'Publish', color: '#395782', subtitle: entity.name,
      score: mergeScores.publish, attributes: buildAttrRows(knownEnrich, mergeCounts.publish, mergeScores.publish, `${entity.id}|${activeDim}|pu`),
    },
  }

  return { vendorGroups, allTables, groups, mergeNodes }
}

// Deterministic per-attribute "top values" distribution + mock derived logic —
// reused by the attribute detail drawer regardless of which stage node opened it.
const SAMPLE_VALUES = {
  Identifiers: ['CUST-100234', 'CUST-100288', 'CUST-100355', 'CUST-100410', '(unresolved)'],
  'Contact Info': ['user@company.com', 'billing@company.com', 'no-reply@company.com', '(missing)'],
  Metadata: ['Active', 'Inactive', 'Pending Review', 'Archived', 'Unknown'],
  Timestamps: ['2024-01', '2024-04', '2024-07', '2024-10', '2025-01'],
  Financial: ['$0 – $50K', '$50K – $250K', '$250K – $1M', '$1M+', 'Not Disclosed'],
}
const LOGIC_POOL = {
  Identifiers: 'COALESCE(source_a.customer_id, source_b.legacy_id)',
  'Contact Info': "CONCAT(TRIM(local_part), '@', TRIM(domain))",
  Metadata: "CASE WHEN is_active THEN 'Active' ELSE 'Inactive' END",
  Timestamps: 'MAX(source_a.updated_at, source_b.updated_at)',
  Financial: 'ROUND(SUM(invoice_amount), 2)',
}

function buildAttributeDetail(attr, nodeId, entityId, vendors) {
  const h = hashInt(`${entityId}|${nodeId}|${attr.name}`)
  const pool = SAMPLE_VALUES[attr.category] || SAMPLE_VALUES.Metadata
  const n = 3 + (h % (pool.length - 2))
  const weights = Array.from({ length: n }, (_, i) => 1 + ((h >> (i * 3)) % 12))
  const total = weights.reduce((s, w) => s + w, 0)
  const rows = pool.slice(0, n).map((label, i) => ({
    label,
    pct: Math.round((weights[i] / total) * 1000) / 10,
  })).sort((a, b) => b.pct - a.pct)

  const totalRecords = 5000 + (h % 20000)
  const distinctValues = 20 + (h % 200)
  const sourceCount = 1 + (h % vendors.length)
  const mappedSources = vendors.slice(0, sourceCount)

  return {
    rows: rows.map(r => ({ ...r, count: Math.round((r.pct / 100) * totalRecords) })),
    totalRecords,
    distinctValues,
    mappedSources,
    logic: LOGIC_POOL[attr.category] || null,
  }
}

// Walks the offsetParent chain to get a node's position relative to `ancestor`,
// independent of the canvas's CSS zoom transform (which doesn't affect layout
// offsets) — this is what keeps the SVG edges aligned with the node cards.
function offsetRelativeTo(el, ancestor) {
  let x = 0, y = 0, node = el
  while (node && node !== ancestor) {
    x += node.offsetLeft
    y += node.offsetTop
    node = node.offsetParent
  }
  return { x, y }
}

// ── Small bars icon inside every score pill — all 5 bars the same height,
// filled bar count scales with score (1 of 5 at ~20%, all 5 at 100%),
// colored by the same 3-tier scale as the score text itself. ───────────────
function IcScoreBars({ score }) {
  const filled = clamp(Math.ceil(score / 20), 1, 5)
  const color = scoreColor(score)
  return (
    <span className="dqid-score-bars" aria-hidden="true">
      {[0, 1, 2, 3, 4].map(i => (
        <span key={i} className="dqid-score-bars__bar" style={{ background: i < filled ? color : 'var(--card-border)' }} />
      ))}
    </span>
  )
}

// ── Vendor / source node ────────────────────────────────────────────────
function VendorNode({ name, logo, dimmed, nodeRef }) {
  return (
    <div ref={nodeRef} className={`dqid-node dqid-node--vendor${dimmed ? ' dqid-node--dimmed' : ''}`}>
      <span className="dqid-vendor-icon">
        {logo ? <img src={logoSrc(logo)} width={16} height={16} alt="" /> : <IcSource />}
      </span>
      <span className="dqid-vendor-name">{name}</span>
      <span className="dqid-vendor-badge">Vendor</span>
    </div>
  )
}

// ── Pipeline stage node — expandable attribute list ─────────────────────
function StageNode({ node, expanded, onToggleExpand, selectedAttr, onSelectAttr, onOpenDetail, highlighted, dimmed, nodeRef }) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => (
    node.attributes.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
  ), [node.attributes, search])

  return (
    <div
      ref={nodeRef}
      className={`dqid-node dqid-node--stage${highlighted ? ' dqid-node--highlighted' : ''}${dimmed ? ' dqid-node--dimmed' : ''}`}
    >
      <div className="dqid-node__head">
        <span className="dqid-module-chip" style={{ '--dqid-module-color': node.color }}>
          <StageChipIcon node={node} />
          {node.label}
        </span>
        <span className="dqid-score-pill">
          <IcScoreBars score={node.score} />
          {node.score}%
        </span>
      </div>
      <div className="dqid-node__table" title={node.subtitle}>{node.subtitle}</div>

      <button className="dqid-node__toggle" onClick={onToggleExpand}>
        <span>{node.attributes.length} Attributes</span>
        <IcChevronUpDown open={expanded} />
      </button>

      {expanded && (
        <div className="dqid-node__body">
          <DSPillSearch value={search} onChange={setSearch} placeholder="Search attributes…" width={220} />
          <div className="dqid-attr-list">
            {filtered.length === 0 && <div className="dqid-attr-empty">No attributes found</div>}
            {filtered.map(a => {
              const isSelected = selectedAttr === a.name
              return (
                <div key={a.name} className={`dqid-attr-row${isSelected ? ' dqid-attr-row--selected' : ''}`}>
                  <button className="dqid-attr-row__main" onClick={() => onSelectAttr(a.name)} title={a.name}>
                    <span className="dqid-attr-row__name">{a.name}</span>
                    <span className="dqid-attr-row__bar">
                      <span className="cr-findings-bar__track">
                        <div className="cr-findings-bar__fill" style={{ '--cr-pct': `${a.score}%`, '--fb-color': scoreColor(a.score) }} />
                      </span>
                    </span>
                    <span className="dqid-attr-row__pct" style={{ color: scoreColor(a.score) }}>{a.score}%</span>
                  </button>
                  <button className="dqid-attr-row__detail" title="View attribute detail" onClick={() => onOpenDetail(a)}>
                    <IcDots />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Legend popover ───────────────────────────────────────────────────────
function ScoreLegend() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])
  return (
    <div ref={ref} className="dqid-legend">
      <button className="dqid-legend__trigger" onClick={() => setOpen(o => !o)} title="Score legend"><IcInfo /></button>
      <div className={`dqid-legend__pop${open ? ' dqid-legend__pop--open' : ''}`}>
        <div className="dqid-legend__row"><span className="dqid-legend__dot" style={{ background: 'var(--pai-crit-fg)' }} />Low (Completeness Score Less Than or Equal To 50%)</div>
        <div className="dqid-legend__row"><span className="dqid-legend__dot" style={{ background: 'var(--pai-high-fg)' }} />Medium (Completeness Score Between 50% and 75%)</div>
        <div className="dqid-legend__row"><span className="dqid-legend__dot" style={{ background: 'var(--pai-green)' }} />High (Completeness Score Greater Than 75%)</div>
      </div>
    </div>
  )
}

// ── Entity picker dropdown — entity icon + name + overall score pill ────
function EntityPicker({ entity, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="dqid-entity-picker">
      <button className={`dqid-entity-picker__btn${open ? ' dqid-entity-picker__btn--open' : ''}`} onClick={() => setOpen(o => !o)}>
        <EntityIcon glyph={entity.glyph} size={18} />
        <span className="dqid-entity-picker__name">{entity.name}</span>
        <span className="dqid-entity-picker__sep">|</span>
        <span className="dqid-entity-picker__score" style={{ color: scoreColor(entity.score) }}>{entity.score}%</span>
        <IcChevron />
      </button>
      {open && (
        <div className="dqid-entity-picker__menu">
          {ENTITIES.map(e => (
            <button
              key={e.id}
              className={`dqid-entity-picker__item${e.id === entity.id ? ' dqid-entity-picker__item--active' : ''}`}
              onClick={() => { onChange(e.id); setOpen(false) }}
            >
              <EntityIcon glyph={e.glyph} size={16} />
              <span>{e.name}</span>
              <span className="dqid-entity-picker__item-score" style={{ color: scoreColor(e.score) }}>{e.score}%</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Attribute detail drawer — reuses the app's comp-drawer shell, same
// header/section conventions as CompliancePage.jsx's assessment drawer, at
// this page's own narrower fixed width (see .dqid-drawer). ─────────────────
function AttributeDetailDrawer({ attr, node, entity, vendors, onClose }) {
  const [closing, setClosing] = useState(false)
  const [copied, setCopied] = useState(false)
  const handleClose = () => { setClosing(true); setTimeout(onClose, 180) }
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const detail = useMemo(() => buildAttributeDetail(attr, node.id, entity.id, vendors), [attr, node.id, entity.id, vendors])

  const handleCopyLogic = () => {
    navigator.clipboard?.writeText(detail.logic || '').catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <>
      <div className="comp-drawer-backdrop" onClick={handleClose} />
      <button className="comp-drawer-close-ext dqid-drawer-close-ext" onClick={handleClose}><IcClose /></button>
      <div className={`comp-drawer dqid-drawer${closing ? ' comp-drawer--closing' : ''}`}>
        <div className="comp-drawer-header">
          <div className="comp-drawer-header-content">
            <div className="comp-drawer-title-row">
              <span className="comp-drawer-title">{attr.name}</span>
              <span className="comp-drawer-badge">Entity Attributes</span>
            </div>
            <div className="dqid-drawer-sub">
              {detail.distinctValues.toLocaleString()} Distinct {detail.distinctValues === 1 ? 'Value' : 'Values'}
            </div>
          </div>
          <span className="dqid-drawer-stage-badge" style={{ '--dqid-module-color': node.color }}>
            <StageChipIcon node={node} />{node.label}<IcJump />
          </span>
        </div>

        <div className="comp-drawer-body">
          <div className="comp-drawer-section">
            <div className="dqid-drawer-values-head">
              <span className="comp-drawer-section-title"><span className="dqid-drawer-title-icon"><IcList /></span>Top {detail.rows.length} Values</span>
              <div className="dqid-drawer-values-head-cols">
                <span title="Percentage of entities with this value across the entire snapshot.">Percentage distribution</span>
                <span title="Number of entities that have the displayed value in the attribute.">Count</span>
              </div>
            </div>
            <div className="dqid-values-list">
              {detail.rows.map(r => (
                <div key={r.label} className="dqid-values-row">
                  <span className="dqid-values-row__label" title={r.label}>{r.label}</span>
                  <span className="cr-findings-bar" style={{ flex: 1 }}>
                    <span className="cr-findings-bar__track">
                      <div className="cr-findings-bar__fill" style={{ '--cr-pct': `${r.pct}%`, '--fb-color': 'var(--pai-indigo)' }} />
                    </span>
                    <span className="cr-findings-pct" style={{ '--fb-color': 'var(--pai-indigo)' }}>{r.pct}%</span>
                  </span>
                  <span className="dqid-values-row__count">{r.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {!node.isRaw && (
            <>
              <div className="comp-drawer-section">
                <span className="comp-drawer-section-title"><span className="dqid-drawer-title-icon"><IcLogic /></span>Logic</span>
                {detail.logic ? (
                  <div className="dqid-logic-box">
                    {detail.logic}
                    <button className="dqid-logic-copy-btn" title="Copy" onClick={handleCopyLogic}>
                      <IcCopy />{copied ? 'Copied' : ''}
                    </button>
                  </div>
                ) : (
                  <div className="dqid-logic-box dqid-logic-box--empty">No logic data to display</div>
                )}
              </div>

              <div className="comp-drawer-section">
                <span className="comp-drawer-section-title">Mapped Sources</span>
                <div className="dqid-sources-grid">
                  {detail.mappedSources.map(src => {
                    const logo = VENDOR_LOGO_MAP[src]
                    return (
                      <div key={src} className="dqid-source-tile">
                        <span className="dqid-source-tile__icon">
                          {logo ? <img src={logoSrc(logo)} width={20} height={20} alt="" /> : <IcSource />}
                        </span>
                        <span className="dqid-source-tile__label">{src}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default function DataQualityInDepthPage() {
  const [selectedId, setSelectedId] = useState('account')
  const [expanded, setExpanded] = useState(() => new Set())
  const [selectedAttr, setSelectedAttr] = useState(null)
  const [detailTarget, setDetailTarget] = useState(null) // { attr, node }
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  // The "fit all cards in view" state fitView() last computed — Reset restores
  // to this rather than a hardcoded zoom(1)/pan(0,0), and viewChanged compares
  // against it so the Reset button isn't lit up on a fresh, never-touched view.
  const [defaultView, setDefaultView] = useState({ zoom: 1, pan: { x: 0, y: 0 } })
  const [panning, setPanning] = useState(false)
  const [edges, setEdges] = useState([])
  const [activeDim, setActiveDim] = useState('Completeness')

  const entity = ENTITIES.find(e => e.id === selectedId) || ENTITIES[0]
  const dims = useMemo(() => makeDimensions(entity), [entity])
  const dimScore = dims[DIMENSIONS.indexOf(activeDim)].value
  const { vendorGroups, allTables, groups, mergeNodes } = useMemo(
    () => buildFanInLineage(entity, activeDim, dimScore),
    [entity, activeDim, dimScore]
  )
  const vendorNames = useMemo(() => vendorGroups.map(v => v.name), [vendorGroups])

  const canvasRef = useRef(null)
  const worldRef = useRef(null)
  const vendorRefs = useRef({})
  const dataRefs = useRef({})
  const extractionRefs = useRef({})
  const resolutionRefs = useRef({})
  const mergeRefs = useRef({})

  const toggleExpand = useCallback((id) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  const handleSelectAttr = useCallback((name) => {
    setSelectedAttr(prev => (prev === name ? null : name))
  }, [])

  // Reset per-entity interaction state so switching entities doesn't carry
  // over a stale expand/highlight state from the previous lineage. Zoom/pan
  // are handled separately by the fitView layout effect below.
  useEffect(() => {
    setExpanded(new Set())
    setSelectedAttr(null)
    setDetailTarget(null)
  }, [selectedId])

  // Default view: scale (and center) the whole lineage so every card is
  // visible without panning, capped at 100% so cards never render larger
  // than their designed size on a wide viewport. Re-measured on mount and
  // whenever the entity switches (vendor count is the only structural thing
  // that varies lineage width entity-to-entity) — a layout effect so it
  // applies before paint instead of flashing zoom(1) first.
  const fitView = useCallback(() => {
    const body = canvasRef.current
    const world = worldRef.current
    if (!body || !world) return
    const bodyW = body.clientWidth
    const bodyH = body.clientHeight
    const worldW = world.scrollWidth
    const worldH = world.scrollHeight
    if (!bodyW || !bodyH || !worldW || !worldH) return
    const fit = clamp(Math.round(Math.min(bodyW / worldW, bodyH / worldH) * 1000) / 1000, 0.5, 1)
    const nextPan = { x: (bodyW - worldW * fit) / 2, y: (bodyH - worldH * fit) / 2 }
    setZoom(fit)
    setPan(nextPan)
    setDefaultView({ zoom: fit, pan: nextPan })
  }, [])

  useLayoutEffect(() => {
    fitView()
  }, [fitView, selectedId])

  // Drag-to-pan — same model as KGPage's GraphCanvas: a mousedown that starts
  // on the canvas surface itself (not a node) tracks the cursor via window
  // listeners so the drag keeps working even if the pointer leaves the canvas.
  const panDrag = useRef({ active: false, sx: 0, sy: 0, ox: 0, oy: 0 })

  const handleCanvasMouseDown = useCallback((e) => {
    if (!e.target.hasAttribute('data-pan-surface')) return
    panDrag.current = { active: true, sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y }
    setPanning(true)
  }, [pan])

  useEffect(() => {
    const onMove = (e) => {
      if (!panDrag.current.active) return
      const { sx, sy, ox, oy } = panDrag.current
      setPan({ x: ox + (e.clientX - sx), y: oy + (e.clientY - sy) })
    }
    const onUp = () => {
      panDrag.current.active = false
      setPanning(false)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const zoomBy = useCallback((factor) => {
    setZoom(z => clamp(Math.round(z * factor * 100) / 100, 0.5, 2))
  }, [])
  const resetView = useCallback(() => { setZoom(defaultView.zoom); setPan(defaultView.pan) }, [defaultView])

  // Mouse-wheel zoom, anchored at the cursor position (not just the top-left
  // corner) — the pan offset is adjusted by the same factor as the zoom so
  // whatever point is under the cursor stays under the cursor. Attached as a
  // native, non-passive listener (below) rather than React's onWheel prop —
  // React registers wheel as passive by default, which silently swallows
  // preventDefault() and lets the scroll leak through to the page behind it.
  const handleWheelZoom = useCallback((e) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
    setZoom(z => {
      const newZoom = clamp(Math.round(z * factor * 1000) / 1000, 0.5, 2)
      const applied = newZoom / z
      setPan(p => ({ x: mx * (1 - applied) + applied * p.x, y: my * (1 - applied) + applied * p.y }))
      return newZoom
    })
  }, [])

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheelZoom, { passive: false })
    return () => el.removeEventListener('wheel', handleWheelZoom)
  }, [handleWheelZoom])

  // Reset button only needs to stand out once the view has actually drifted
  // from the fit-all default — comparing against defaultView (not a literal
  // zoom===1/pan===0,0) so it stays disabled on a fresh, never-touched view.
  const viewChanged = zoom !== defaultView.zoom || pan.x !== defaultView.pan.x || pan.y !== defaultView.pan.y

  // Edges run left -> right in the same order as the canvas columns below:
  // Publish -> Enrichment -> Entity Resolution -> (per-group) Resolution ->
  // Extraction -> Data -> Vendor — mirroring the real product's layout,
  // which reads finished/canonical on the left and raw source on the right.
  const recomputeEdges = useCallback(() => {
    const world = worldRef.current
    if (!world) return
    const centerRight = (el) => {
      const p = offsetRelativeTo(el, world)
      return { x: p.x + el.offsetWidth, y: p.y + el.offsetHeight / 2 }
    }
    const centerLeft = (el) => {
      const p = offsetRelativeTo(el, world)
      return { x: p.x, y: p.y + el.offsetHeight / 2 }
    }
    const next = []
    const puEl = mergeRefs.current.publish
    const enEl = mergeRefs.current.enrichment
    const erEl = mergeRefs.current.entityResolve
    if (puEl && enEl) next.push({ id: 'pu-en', a: centerRight(puEl), b: centerLeft(enEl), dim: false, active: !!selectedAttr })
    if (enEl && erEl) next.push({ id: 'en-er', a: centerRight(enEl), b: centerLeft(erEl), dim: false, active: !!selectedAttr })

    groups.forEach(g => {
      const gEl = g.resolution ? resolutionRefs.current[g.id] : null
      if (g.resolution && erEl && gEl) next.push({ id: `er-${g.id}`, a: centerRight(erEl), b: centerLeft(gEl), dim: !!selectedAttr })
      g.tables.forEach(t => {
        const xEl = extractionRefs.current[t.id]
        const dEl = dataRefs.current[t.id]
        const vEl = vendorRefs.current[t.vendor]
        if (g.resolution) {
          if (gEl && xEl) next.push({ id: `g-${t.id}`, a: centerRight(gEl), b: centerLeft(xEl), dim: !!selectedAttr })
        } else if (erEl && xEl) {
          next.push({ id: `er-${t.id}`, a: centerRight(erEl), b: centerLeft(xEl), dim: !!selectedAttr })
        }
        if (xEl && dEl) next.push({ id: `x-${t.id}`, a: centerRight(xEl), b: centerLeft(dEl), dim: !!selectedAttr })
        if (dEl && vEl) next.push({ id: `d-${t.id}`, a: centerRight(dEl), b: centerLeft(vEl), dim: !!selectedAttr })
      })
    })
    setEdges(next)
  }, [groups, selectedAttr])

  useLayoutEffect(() => {
    recomputeEdges()
  }, [recomputeEdges, expanded, zoom])

  useEffect(() => {
    const onResize = () => recomputeEdges()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [recomputeEdges])

  const worldSize = useMemo(() => {
    const world = worldRef.current
    if (!world) return { w: 0, h: 0 }
    return { w: world.scrollWidth, h: world.scrollHeight }
    // Recompute alongside edges — same triggers move node layout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges])

  return (
    <div className="dqid-page">
      <div className="dqid-header">
        <EntityPicker entity={entity} onChange={setSelectedId} />
        <ScoreLegend />
      </div>

      <div className="dqid-canvas">
        <div className="dqid-canvas__header">
          <DimensionTabStrip dims={dims} active={activeDim} onChange={setActiveDim} />
        </div>

        <div
          className={`dqid-canvas__body${panning ? ' dqid-canvas__body--panning' : ''}`}
          ref={canvasRef}
          data-pan-surface
          onMouseDown={handleCanvasMouseDown}
        >
          <div className="dqid-pan-layer" data-pan-surface style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
            <div className="dqid-world" ref={worldRef} data-pan-surface style={{ transform: `scale(${zoom})` }}>
              <svg className="dqid-edges" width={worldSize.w} height={worldSize.h}>
                {edges.map(e => (
                  <path
                    key={e.id}
                    d={`M ${e.a.x} ${e.a.y} C ${e.a.x + 40} ${e.a.y}, ${e.b.x - 40} ${e.b.y}, ${e.b.x} ${e.b.y}`}
                    fill="none"
                    stroke={e.active ? 'var(--pai-indigo)' : 'var(--card-border)'}
                    strokeWidth={e.active ? 2 : 1.5}
                    opacity={e.dim ? 0.35 : 1}
                  />
                ))}
              </svg>

              {['publish', 'enrichment', 'entityResolve'].map(key => (
                <div className="dqid-column dqid-column--center" data-pan-surface key={key}>
                  <StageNode
                    node={mergeNodes[key]}
                    expanded={expanded.has(mergeNodes[key].id)}
                    onToggleExpand={() => toggleExpand(mergeNodes[key].id)}
                    selectedAttr={selectedAttr}
                    onSelectAttr={handleSelectAttr}
                    onOpenDetail={(a) => setDetailTarget({ attr: a, node: mergeNodes[key] })}
                    highlighted={!!selectedAttr}
                    dimmed={false}
                    nodeRef={el => { if (el) mergeRefs.current[key] = el }}
                  />
                </div>
              ))}

              <div className="dqid-column" data-pan-surface>
                {groups.map(g => (
                  <div key={g.id} className="dqid-fan-group" data-pan-surface style={{ flexGrow: g.tableCount }}>
                    {g.resolution && (
                      <StageNode
                        node={g.resolution}
                        expanded={expanded.has(g.resolution.id)}
                        onToggleExpand={() => toggleExpand(g.resolution.id)}
                        selectedAttr={selectedAttr}
                        onSelectAttr={handleSelectAttr}
                        onOpenDetail={(a) => setDetailTarget({ attr: a, node: g.resolution })}
                        highlighted={!!selectedAttr}
                        dimmed={false}
                        nodeRef={el => { if (el) resolutionRefs.current[g.id] = el }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="dqid-column" data-pan-surface>
                {allTables.map(t => (
                  <StageNode
                    key={t.extraction.id}
                    node={t.extraction}
                    expanded={expanded.has(t.extraction.id)}
                    onToggleExpand={() => toggleExpand(t.extraction.id)}
                    selectedAttr={selectedAttr}
                    onSelectAttr={handleSelectAttr}
                    onOpenDetail={(a) => setDetailTarget({ attr: a, node: t.extraction })}
                    highlighted={!!selectedAttr}
                    dimmed={false}
                    nodeRef={el => { if (el) extractionRefs.current[t.id] = el }}
                  />
                ))}
              </div>

              <div className="dqid-column" data-pan-surface>
                {allTables.map(t => (
                  <StageNode
                    key={t.data.id}
                    node={t.data}
                    expanded={expanded.has(t.data.id)}
                    onToggleExpand={() => toggleExpand(t.data.id)}
                    selectedAttr={selectedAttr}
                    onSelectAttr={handleSelectAttr}
                    onOpenDetail={(a) => setDetailTarget({ attr: a, node: t.data })}
                    highlighted={!!selectedAttr}
                    dimmed={false}
                    nodeRef={el => { if (el) dataRefs.current[t.id] = el }}
                  />
                ))}
              </div>

              <div className="dqid-column dqid-column--vendors" data-pan-surface>
                {vendorGroups.map(v => (
                  <div key={v.name} className="dqid-fan-group" data-pan-surface style={{ flexGrow: v.tableCount }}>
                    <VendorNode
                      name={v.name}
                      logo={v.logo}
                      dimmed={!!selectedAttr}
                      nodeRef={el => { if (el) vendorRefs.current[v.name] = el }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="kg-zoom-rail-abs dqid-zoom-rail">
            <button className="kg-rail-btn-abs" title="Zoom out" onClick={() => zoomBy(0.8)}><IcZoomOut /></button>
            <button className="kg-rail-btn-abs" title="Zoom in" onClick={() => zoomBy(1.25)}><IcZoomIn /></button>
            <button
              className={`kg-rail-btn-abs${viewChanged ? ' dqid-reset-btn--active' : ''}`}
              title="Reset view"
              onClick={resetView}
              disabled={!viewChanged}
            ><IcReset /></button>
          </div>
        </div>
      </div>

      {detailTarget && (
        <AttributeDetailDrawer
          attr={detailTarget.attr}
          node={detailTarget.node}
          entity={entity}
          vendors={vendorNames}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </div>
  )
}
