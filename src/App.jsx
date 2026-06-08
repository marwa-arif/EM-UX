import React, { useState, useEffect, useRef, useCallback } from 'react'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import ErrorPage from './pages/ErrorPage.jsx'
import Topbar from './components/Topbar.jsx'
import LeftNav from './components/LeftNav.jsx'
import SubHeader from './components/SubHeader.jsx'
import { PageKG } from './pages/PageKG.jsx'
import { FilterPanel, GraphFilterDrawer } from './components/FilterPanel.jsx'
import { useTweaks, TweaksPanel, TweakSection, TweakSlider, TweakToggle } from './components/tweaks-panel.jsx'
import { PAI } from './ui.jsx'
import WorkspacePage from './pages/WorkspacePage.jsx'
import NavigatorPage from './pages/NavigatorPage.jsx'
import NavigatorPanel from './components/NavigatorPanel.jsx'
import FindingsPage from './pages/FindingsPage.jsx'
import ExposureOverviewPage from './pages/ExposureOverviewPage.jsx'
import DiscoverDevicePage   from './pages/DiscoverDevicePage.jsx'
import DiscoverCloudPage    from './pages/DiscoverCloudPage.jsx'
import DiscoverIdentityPage from './pages/DiscoverIdentityPage.jsx'
import CompliancePage       from './pages/CompliancePage.jsx'
import ComplianceMatrixPage   from './pages/ComplianceMatrixPage.jsx'
import ComplianceFindingsPage from './pages/ComplianceFindingsPage.jsx'
import AssessmentsPage        from './pages/AssessmentsPage.jsx'

// Paths in visual left-to-right order with staggered trace delays
const SPLASH_PATHS = [
  { d: 'M70.0009 89.4816C52.6161 89.4816 38.523 75.3888 38.5222 58.0046C38.5222 40.6186 52.6151 26.5256 69.9998 26.5247C87.3857 26.5247 101.479 40.6176 101.48 58.0019C101.48 75.3848 87.3871 89.4776 70.0024 89.4785M70.0009 24.0007C51.222 24.0007 35.9996 39.2232 36 58.0008C36 76.7781 51.2227 92.0004 70.0005 92C88.7777 92 104 76.7775 104 57.9995C104 39.2218 88.7788 24.0004 70.0009 24.0007Z', delay: 0 },
  { d: 'M64.8474 45.0907C64.6102 44.7772 64.3422 44.4864 64.0479 44.2222C62.4695 42.8384 60.8403 42.0302 57.1821 41.9965L54.8065 41.989H54.7918C54.667 41.9836 54.5419 41.9961 54.4204 42.0255C54.175 42.1032 53.9224 42.3091 54.1058 42.8564L54.3423 43.5567L54.6434 44.4506C54.6952 44.6851 54.8174 44.8999 54.9941 45.0682C55.1985 45.1711 55.4286 45.2194 55.6586 45.2079H56.3056C58.5974 45.2079 60.1269 45.66 61.1178 46.6322C62.0951 47.5864 62.5642 49.2374 62.5642 51.6794C62.5642 54.1213 62.0913 55.7722 61.1178 56.7274C60.1269 57.6991 58.5985 58.152 56.3067 58.152H55.6628C55.4312 58.1397 55.2008 58.1878 54.9952 58.2907C54.8181 58.459 54.6956 58.6734 54.6434 58.9078L54.3423 59.8018L54.1058 60.5023C53.9224 61.0489 54.175 61.2575 54.4208 61.333C54.5407 61.3626 54.6648 61.3749 54.7888 61.3697L57.1821 61.3622C60.8403 61.3281 62.4695 60.5201 64.0479 59.1365C64.3422 58.8722 64.6098 58.5812 64.8474 58.268C66.0202 56.7579 66.5927 54.6046 66.5927 51.6746C66.5927 48.7447 66.0221 46.5879 64.8474 45.0812', delay: 70 },
  { d: 'M78.9888 41.9875H76.9913C76.7205 41.9181 76.4322 41.9657 76.201 42.1183C75.9695 42.2708 75.818 42.5125 75.7862 42.7811L65.4493 72.9759C65.3955 73.1105 65.3625 73.2526 65.3516 73.3967C65.3518 73.6801 65.494 74.0152 66.1727 74.0152H68.1905C68.4638 74.0838 68.7545 74.035 68.9878 73.8816C69.2208 73.7278 69.3738 73.4844 69.4075 73.2136L79.7053 43.0133C79.7588 42.8802 79.7919 42.7397 79.8028 42.5972C79.8028 42.314 79.6621 41.9838 78.99 41.9838', delay: 140 },
  { d: 'M85.9465 54.8351C85.7031 54.6745 85.4095 54.6026 85.1167 54.6311H83.3577C83.0651 54.6022 82.7715 54.6745 82.529 54.8351C82.3386 55.0532 82.2507 55.3378 82.2875 55.621V73.0293C82.2507 73.3127 82.3386 73.5979 82.53 73.8159C82.7721 73.9765 83.0656 74.049 83.3575 74.0196H85.1167C85.4095 74.0482 85.7037 73.9762 85.9463 73.8153C86.1367 73.5975 86.2241 73.3125 86.1878 73.0293V55.621C86.2241 55.3378 86.1369 55.0533 85.9465 54.8351Z', delay: 210 },
  { d: 'M132.771 57.993H141.381C144.515 57.993 146.744 57.3928 148.067 56.1926C149.39 54.9924 150.052 52.9382 150.052 50.0298V49.0877C150.052 45.9782 149.4 43.7861 148.096 42.5113C146.792 41.2364 144.553 40.5975 141.379 40.5944H132.769L132.771 57.993ZM132.771 62.0024V77.3939C132.816 77.7313 132.717 78.0719 132.497 78.3376C132.2 78.5267 131.844 78.6102 131.49 78.5739H129.291C128.937 78.6098 128.582 78.5263 128.285 78.3376C128.065 78.0719 127.966 77.7313 128.011 77.3939V37.7617C127.965 37.4248 128.064 37.0844 128.285 36.8197C128.582 36.6306 128.937 36.5467 129.291 36.5818H141.202C146.045 36.5818 149.576 37.5544 151.797 39.4999C154.017 41.4454 155.126 44.5613 155.124 48.8483V50.0282C155.124 58.0089 150.483 61.9994 141.202 61.9994L132.771 62.0024Z', delay: 340 },
  { d: 'M188.702 47.9069C188.579 47.7514 188.295 47.6706 187.847 47.6706H187.052C185.167 47.6485 183.322 48.1917 181.771 49.2253C180.223 50.2448 179.006 51.666 178.258 53.3251V50.5887C178.258 50.5017 178.271 50.41 178.271 50.3073V48.9082C178.308 48.5662 178.222 48.2223 178.026 47.9349C177.751 47.723 177.399 47.6277 177.05 47.6706H169.624C169.275 47.6277 168.924 47.723 168.649 47.9349C168.454 48.2225 168.367 48.5661 168.403 48.9082V50.3073C168.366 50.6489 168.453 50.9922 168.649 51.279C168.923 51.4911 169.275 51.5865 169.624 51.5432H173.56V77.3853C173.513 77.7228 173.612 78.0639 173.834 78.3291C174.131 78.5182 174.487 78.6017 174.841 78.5653H177.095C177.448 78.6016 177.804 78.518 178.101 78.3291C178.323 78.0645 178.423 77.7232 178.378 77.3853V62.3469C178.365 60.9813 178.55 59.6208 178.926 58.3046C179.256 57.1421 179.793 56.0441 180.514 55.06C181.162 54.1739 182.007 53.4388 182.988 52.9083C183.989 52.386 185.114 52.1214 186.252 52.1402H187.841C188.288 52.1402 188.574 52.0625 188.695 51.904C188.848 51.6132 188.911 51.2862 188.877 50.9619V48.8382C188.911 48.5132 188.848 48.1859 188.695 47.8945', delay: 420 },
  { d: 'M217.587 50.5028C212.255 50.5028 209.568 53.9039 209.528 60.7063H225.281C225.492 58.0075 224.842 55.3111 223.419 52.9796C222.029 51.2599 219.839 50.3304 217.587 50.5028ZM209.528 64.5387V65.6597C209.528 72.1467 212.254 75.3898 217.708 75.3887C221.169 75.3887 223.469 74.111 224.608 71.5548C224.713 71.2361 224.89 70.9442 225.128 70.7013C225.403 70.5744 225.708 70.5208 226.012 70.5459H228.211C228.585 70.5171 228.961 70.5702 229.31 70.7015C229.473 70.8051 229.554 71.0705 229.553 71.4974C229.495 72.2447 229.266 72.97 228.882 73.6211C228.473 74.4279 227.96 75.1812 227.354 75.8629C226.219 77.039 224.804 77.9295 223.232 78.4578C221.404 79.1032 219.469 79.423 217.523 79.4014C213.986 79.62 210.523 78.3515 208.026 75.9221C205.644 73.152 204.453 69.6053 204.697 66.0124V61.5893C204.697 56.833 205.796 53.1863 207.994 50.649C210.411 48.0205 213.949 46.6166 217.581 46.8446C225.966 46.8446 230.159 51.3465 230.16 60.3503V63.3586C230.204 63.6962 230.105 64.0365 229.885 64.3022C229.587 64.4909 229.231 64.5744 228.877 64.5385L209.528 64.5387Z', delay: 500 },
  { d: 'M249.52 47.6786C249.84 47.6507 250.157 47.7457 250.404 47.9429C250.647 48.228 250.824 48.5597 250.924 48.9161L259.412 73.9235L267.656 48.9161C267.741 48.5462 267.919 48.2022 268.174 47.915C268.43 47.7363 268.744 47.6525 269.058 47.6787H271.624C272.274 47.6787 272.599 47.915 272.599 48.3876C272.561 48.6287 272.5 48.8659 272.417 49.0966L262.584 77.2862C262.461 77.6686 262.253 78.0207 261.976 78.3185C261.694 78.5175 261.347 78.6114 260.999 78.583H257.457C257.109 78.6125 256.762 78.5186 256.481 78.3185C256.202 78.0212 255.993 77.6691 255.869 77.2862L246.1 49.0966C246.018 48.8657 245.957 48.6285 245.918 48.3876C245.918 47.9212 246.24 47.6787 246.895 47.6787L249.52 47.6786Z', delay: 580 },
  { d: 'M301.419 63.5904C298.284 63.5904 296.117 64.062 294.916 65.0052C293.597 66.2276 292.933 67.9671 293.114 69.7237C292.964 71.2964 293.586 72.8461 294.794 73.9105C296.564 74.94 298.63 75.3949 300.686 75.2086H301.237C303.126 75.3869 305.005 74.7751 306.396 73.5282C307.574 71.9698 308.128 70.0522 307.954 68.1302V64.1191C306.732 63.9626 305.521 63.8351 304.32 63.7365C303.119 63.6381 302.153 63.5863 301.422 63.5812M301.055 59.6943C301.87 59.6943 302.909 59.7333 304.172 59.8109C305.435 59.8887 306.697 60.0068 307.957 60.1654V56.6845C308.12 54.9823 307.557 53.2896 306.399 51.9971C304.953 50.9049 303.128 50.3877 301.3 50.5513C299.8 50.4696 298.302 50.7423 296.936 51.3457C295.852 51.9744 295.022 52.942 294.584 54.0882C294.467 54.3848 294.304 54.6629 294.102 54.9138C293.825 55.0694 293.503 55.1323 293.186 55.0927L290.987 55.0925C290.614 55.1326 290.238 55.0493 289.92 54.8562C289.704 54.6114 289.604 54.2908 289.643 53.9717C289.66 53.3439 289.826 52.7282 290.126 52.1713C290.45 51.5239 290.86 50.9196 291.346 50.3741C292.42 49.1846 293.785 48.272 295.315 47.7186C297.239 47.0769 299.266 46.7771 301.3 46.834C305.371 46.834 308.302 47.5912 310.093 49.1055C311.885 50.6197 312.781 53.1072 312.78 56.5679V68.6588C312.78 72.2356 311.865 74.8786 310.034 76.5876C308.203 78.2967 305.272 79.1513 301.24 79.1513H300.324C296.172 79.1513 293.108 78.4145 291.133 76.9406C289.159 75.4668 288.172 73.0776 288.172 69.7735C288.172 66.2755 289.21 63.7195 291.286 62.1057C293.363 60.492 296.619 59.6867 301.055 59.6897', delay: 660 },
  { d: 'M337.548 77.3942C337.593 77.732 337.493 78.0732 337.271 78.3379C336.974 78.5268 336.619 78.6101 336.265 78.5742H334.012C333.657 78.6105 333.301 78.527 333.004 78.3379C332.783 78.0725 332.684 77.7318 332.728 77.3943V37.762C332.683 37.4248 332.783 37.0845 333.004 36.8198C333.301 36.6304 333.657 36.5464 334.012 36.5819H336.265C336.619 36.5467 336.974 36.6309 337.271 36.8198C337.493 37.0841 337.593 37.4245 337.548 37.762V77.3942Z', delay: 740 },
  { d: 'M369.929 50.5029C364.596 50.5029 361.91 53.904 361.869 60.7063H377.622C377.833 58.0074 377.183 55.311 375.76 52.9795C374.37 51.2601 372.18 50.3308 369.929 50.5029ZM361.869 64.5386V65.6596C361.869 72.1467 364.596 75.3898 370.051 75.3888C373.511 75.3888 375.812 74.1109 376.951 71.5549C377.056 71.2362 377.233 70.9443 377.471 70.7013C377.746 70.5743 378.051 70.5206 378.355 70.5459H380.554C380.928 70.5171 381.304 70.5704 381.653 70.7013C381.816 70.805 381.897 71.0704 381.896 71.4974C381.838 72.2447 381.609 72.9701 381.225 73.621C380.816 74.428 380.303 75.1814 379.697 75.863C378.562 77.0391 377.147 77.9299 375.575 78.4577C373.747 79.1031 371.813 79.4229 369.866 79.4014C366.329 79.62 362.866 78.3515 360.369 75.922C357.987 73.1521 356.796 69.6054 357.04 66.0125V61.5893C357.04 56.8331 358.139 53.1862 360.337 50.6489C362.754 48.0203 366.292 46.6164 369.924 46.8446C378.309 46.8446 382.502 51.3465 382.503 60.3503V63.3585C382.547 63.6961 382.448 64.0364 382.228 64.3023C381.93 64.4909 381.574 64.5744 381.22 64.5385L361.869 64.5386Z', delay: 820 },
  { d: 'M423.729 49.4975C421.613 47.6109 418.785 46.6514 415.913 46.8451C414.03 46.8129 412.163 47.1752 410.44 47.907C408.885 48.573 407.529 49.6079 406.499 50.9154V48.8508C406.546 48.5133 406.447 48.1721 406.226 47.9071C406.182 47.871 406.134 47.8406 406.081 47.8169C405.82 47.6895 405.528 47.6321 405.236 47.6506H397.822C397.473 47.6075 397.121 47.703 396.845 47.9149C396.651 48.2028 396.566 48.5465 396.602 48.8881V50.2873C396.565 50.6287 396.651 50.9717 396.845 51.2591C397.12 51.473 397.473 51.5692 397.822 51.5248H401.814V77.3948C401.768 77.7323 401.866 78.0734 402.088 78.3386C402.385 78.5273 402.741 78.6108 403.095 78.5749H405.349C405.702 78.6112 406.058 78.5278 406.355 78.3386C406.577 78.074 406.677 77.7329 406.632 77.3948V59.2905C406.519 57.0805 407.295 54.9139 408.798 53.2444C410.307 51.7041 412.437 50.8748 414.63 50.9729C416.576 50.7997 418.506 51.4325 419.941 52.7142C421.179 54.2913 421.767 56.2555 421.591 58.2271V77.3948C421.547 77.7323 421.645 78.0729 421.865 78.3386C422.163 78.5276 422.52 78.6111 422.874 78.5749H425.128C425.482 78.6108 425.837 78.5273 426.134 78.3386C426.355 78.0734 426.455 77.7327 426.411 77.3948V57.2259C426.614 54.4075 425.648 51.6267 423.723 49.499', delay: 900 },
  { d: 'M456.762 78.5771C454.566 78.7686 452.384 78.0876 450.718 76.6913C449.311 75.0178 448.631 72.8817 448.823 70.7337V51.5659H444.854C444.407 51.5659 444.123 51.4866 443.999 51.331C443.847 51.0398 443.784 50.7123 443.818 50.3874V48.853C443.784 48.5286 443.847 48.2017 443.999 47.911C444.123 47.7554 444.407 47.6745 444.854 47.6745H448.823V40.1825C448.78 39.8446 448.878 39.504 449.097 39.2371C449.396 39.05 449.752 38.9672 450.106 39.0024H452.36C452.714 38.9672 453.07 39.0501 453.367 39.2371C453.587 39.5035 453.686 39.8445 453.641 40.1825V47.6728H459.94C460.385 47.6728 460.669 47.7516 460.794 47.9093C460.946 48.2002 461.01 48.5271 460.976 48.8514V50.3858C461.01 50.7107 460.946 51.0381 460.794 51.3296C460.67 51.4851 460.384 51.5643 459.94 51.5643H453.649V69.9657C453.541 71.1704 453.83 72.3772 454.475 73.414C455.157 74.1573 456.167 74.541 457.191 74.4463H460.062C460.509 74.4463 460.796 74.5271 460.917 74.6826C461.068 74.9733 461.132 75.3003 461.099 75.6247V77.4017C461.132 77.7266 461.068 78.0538 460.917 78.3454C460.796 78.5009 460.509 78.5818 460.062 78.5818L456.762 78.5771Z', delay: 980 },
  { d: 'M523.512 62.9457H538.288L530.963 41.2423L523.512 62.9457ZM548.425 77.3359C548.492 77.506 548.534 77.6845 548.549 77.866C548.549 78.3376 548.222 78.574 547.57 78.575H544.822C544.479 78.6711 544.111 78.6146 543.815 78.4209C543.52 78.2273 543.33 77.9167 543.296 77.5738L539.694 67.0749H522.103L518.562 77.5738C518.529 77.9169 518.338 78.2273 518.043 78.4209C517.748 78.6146 517.379 78.671 517.036 78.575H514.472C513.822 78.575 513.496 78.3388 513.495 77.866C513.509 77.6847 513.549 77.5062 513.616 77.3359L527.601 37.881C527.704 37.512 527.892 37.170 528.149 36.8797C528.443 36.6541 528.816 36.5482 529.189 36.5843L533.097 36.5845C533.474 36.5476 533.851 36.6649 534.134 36.9078C534.379 37.1959 534.565 37.5261 534.683 37.881L548.425 77.3359Z', delay: 1080 },
  { d: 'M574.413 40.4667C574.763 40.51 575.114 40.4146 575.39 40.2024C575.585 39.9156 575.672 39.5722 575.635 39.2308V37.8316C575.672 37.4895 575.585 37.1458 575.39 36.8583C575.114 36.6466 574.763 36.5513 574.413 36.594H562.953C562.605 36.5513 562.253 36.6466 561.979 36.8583C561.784 37.1462 561.697 37.4895 561.734 37.8316V39.2308C561.697 39.5721 561.784 39.9152 561.979 40.2024C562.253 40.4146 562.605 40.51 562.953 40.4667H566.24V74.6933H562.953C562.605 74.6506 562.253 74.7458 561.979 74.9576C561.784 75.2456 561.698 75.5889 561.734 75.9308V77.3394C561.697 77.6807 561.784 78.0238 561.979 78.311C562.252 78.5242 562.605 78.6196 562.953 78.5754H574.413C574.763 78.6191 575.115 78.5237 575.39 78.311C575.586 78.0244 575.672 77.6808 575.635 77.3394V75.9308C575.672 75.5889 575.585 75.2452 575.39 74.9576C575.114 74.7458 574.763 74.6504 574.413 74.6933H571.131V40.4667H574.413Z', delay: 1160 },
];

function SplashScreen({ onDone }) {
  const isDark = (localStorage.getItem('pai-theme') || 'light') === 'dark';
  const [phase, setPhase] = useState('idle'); // idle | draw | fill | float | out

  const after = (...phases) => phases.includes(phase);

  useEffect(() => {
    const t0 = setTimeout(() => setPhase('draw'),  200);
    const t1 = setTimeout(() => setPhase('fill'),  1900); // after last stroke finishes
    const t2 = setTimeout(() => setPhase('float'), 2500);
    const t3 = setTimeout(() => setPhase('out'),   3200);
    const t4 = setTimeout(() => onDone(),           3750);
    return () => [t0, t1, t2, t3, t4].forEach(clearTimeout);
  }, [onDone]);

  const logoColor = isDark ? 'white' : '#101010';
  const barTrack  = isDark ? 'rgba(255,255,255,0.07)' : '#E8E8F4';

  return (
    <>
      <style>{`
        @keyframes stroke-draw {
          from { stroke-dashoffset: 1; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes fill-in {
          from { fill-opacity: 0; stroke-opacity: 1; }
          to   { fill-opacity: 1; stroke-opacity: 0; }
        }
        @keyframes logo-float {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-7px); }
        }
        @keyframes logo-glow {
          0%, 100% { filter: drop-shadow(0 0 0px rgba(99,96,216,0)); }
          50%      { filter: drop-shadow(0 0 24px rgba(99,96,216,0.5)); }
        }
        @keyframes em-bar {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes blob-drift-a {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33%      { transform: translate(35px, -22px) scale(1.08); }
          66%      { transform: translate(-18px, 28px) scale(0.95); }
        }
        @keyframes blob-drift-b {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          40%      { transform: translate(-28px, 18px) scale(1.1); }
          70%      { transform: translate(22px, -32px) scale(1.05); }
        }
        @keyframes blob-drift-c {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50%      { transform: translate(14px, 22px) scale(1.12); }
        }
      `}</style>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: isDark ? '#0D0D18' : '#F7F7FF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        opacity: phase === 'out' ? 0 : 1,
        transition: 'opacity 550ms ease',
      }}>

        {/* Blobs */}
        <div style={{
          position: 'absolute', width: 520, height: 520, top: '-8%', left: '8%',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(99,96,216,0.40) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(99,96,216,0.32) 0%, transparent 60%)',
          animation: 'blob-drift-a 9s ease-in-out infinite',
          pointerEvents: 'none', filter: 'blur(48px)',
        }} />
        <div style={{
          position: 'absolute', width: 440, height: 440, bottom: '-5%', right: '8%',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(71,173,203,0.32) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(71,173,203,0.26) 0%, transparent 60%)',
          animation: 'blob-drift-b 11s ease-in-out infinite',
          pointerEvents: 'none', filter: 'blur(56px)',
        }} />
        <div style={{
          position: 'absolute', width: 320, height: 320, top: '50%', left: '52%',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(99,96,216,0.22) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(99,96,216,0.20) 0%, transparent 60%)',
          animation: 'blob-drift-c 13s ease-in-out infinite',
          pointerEvents: 'none', filter: 'blur(64px)',
        }} />

        {/* PAI logo — ghost outlines appear first, then bright trace runs over each */}
        <svg
          width="306" height="58"
          viewBox="0 0 611 116"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: 'relative', zIndex: 1,
            color: logoColor,
            opacity: after('idle') ? 0 : 1,
            animation: after('float', 'out')
              ? 'logo-float 3.4s ease-in-out infinite, logo-glow 3.4s ease-in-out infinite'
              : 'none',
          }}
        >
          {/* Grey stroke draws per letter staggered, then all fills flood in at once */}
          {SPLASH_PATHS.map((p, i) => {
            const strokeAnim = `stroke-draw 480ms cubic-bezier(0.42,0,0.58,1) ${p.delay}ms both`
            const fillAnim   = 'fill-in 500ms cubic-bezier(0.42,0,0.58,1) forwards'
            const animation  = after('fill', 'float', 'out')
              ? `${strokeAnim}, ${fillAnim}`
              : after('draw') ? strokeAnim : 'none'
            return (
              <path
                key={i}
                d={p.d}
                pathLength="1"
                fill="currentColor"
                fillOpacity={0}
                stroke="#999"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="1"
                strokeDashoffset={1}
                style={{ animation }}
              />
            )
          })}
        </svg>

        {/* Loading bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
          background: barTrack,
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #6360D8 0%, #47ADCB 100%)',
            transformOrigin: 'left center',
            transform: 'scaleX(0)',
            animation: after('draw', 'fill', 'float', 'out') ? 'em-bar 3000ms cubic-bezier(0.4,0,0.2,1) forwards' : 'none',
          }} />
        </div>
      </div>
    </>
  );
}

const FLOAT_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "floatEnabled": true,
  "ampX": 6,
  "ampY": 3,
  "speedX": 0.7,
  "speedY": 0.5,
  "variation": 50,
  "edges": [
    ["account","identity","Associated with"],
    ["account","finding","Has"],
    ["application","host","Running on"],
    ["application","vulnerability","Has"],
    ["assessment","finding","Associated with"],
    ["cloudAccount","finding","Has"],
    ["cloudAccount","storage","Has"],
    ["cloudAccount","container","Has"],
    ["cloudAccount","host","Has"],
    ["cloudAccount","cluster","Has"],
    ["cluster","cluster","Has",null,"MapReduce Cluster","Compute Instance Group"],
    ["cluster","finding","Has"],
    ["cluster","container","Has",null,"Container Group"],
    ["cluster","container","Has",null,"Container Service"],
    ["cluster","cluster","Has",null,"Kubernetes Cluster","Compute Instance Group"],
    ["cluster","host","Has",null,"Compute Instance Group","Virtual Machine"],
    ["cluster","cloudAccount","Belongs to",true],
    ["container","cluster","Belongs to",true,null,"Container Service"],
    ["container","cloudAccount","Belongs to",true],
    ["container","finding","Has"],
    ["container","vulnerability","Has"],
    ["container","cluster","Belongs to",true,null,"Container Group"],
    ["host","person","Owned by"],
    ["host","cloudAccount","Belongs to",true],
    ["host","identity","Has"],
    ["host","finding","Has"],
    ["host","application","Hosting",true],
    ["host","vulnerability","Has"],
    ["host","cluster","Belongs to",true,"Virtual Machine","Compute Instance Group"],
    ["host","storage","Has",null,"Virtual Machine","Volume"],
    ["identity","person","Associated with"],
    ["identity","account","Has",true],
    ["identity","finding","Has"],
    ["identity","host","Associated with",true],
    ["network","finding","Has"],
    ["netSvc","finding","Has"],
    ["person","host","Owns",true],
    ["person","identity","Has",true],
    ["person","finding","Has"],
    ["storage","storage","Has",null,null,"Queue Service"],
    ["storage","finding","Has"],
    ["storage","storage","Belongs to",null,"Table Service"],
    ["storage","storage","Has",null,null,"Bucket"],
    ["storage","cloudAccount","Belongs to",true,"Storage Resource"],
    ["storage","storage","Belongs to",null,"File System Service"],
    ["storage","host","To",true,"Volume Associates","Virtual Machine"],
    ["vulnerability","host","On",true],
    ["vulnerability","container","On",true],
    ["vulnerability","finding","Has"],
    ["vulnerability","application","On",true]
  ]
}/*EDITMODE-END*/;

// ── Coming Soon placeholder ──────────────────────────────────────────────
function ComingSoon() {
  return (
    <div className="coming-soon">
      <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="64" cy="64" r="60" fill="#EEEEFF" />
        <circle cx="64" cy="64" r="40" stroke="var(--pai-indigo-light)" strokeWidth="2" fill="var(--card-bg)" />
        <circle cx="64" cy="64" r="32" stroke="var(--pai-indigo)" strokeWidth="2.5" fill="none" />
        <path d="M64 42 L64 64 L78 73" stroke="var(--pai-indigo)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="64" cy="64" r="3" fill="var(--pai-indigo)" />
        <circle cx="64" cy="34" r="2" fill="var(--pai-indigo)" />
        <circle cx="64" cy="94" r="2" fill="var(--pai-indigo)" />
        <circle cx="34" cy="64" r="2" fill="var(--pai-indigo)" />
        <circle cx="94" cy="64" r="2" fill="var(--pai-indigo)" />
        <circle cx="22" cy="34" r="6" fill="var(--pai-indigo)" opacity="0.12" />
        <circle cx="106" cy="95" r="8" fill="var(--pai-indigo)" opacity="0.08" />
        <circle cx="100" cy="22" r="4" fill="var(--pai-indigo)" opacity="0.16" />
        <circle cx="18" cy="88" r="5" fill="var(--pai-indigo)" opacity="0.1" />
      </svg>
      <div className="coming-soon__text">
        <div className="coming-soon__title">Coming Soon</div>
        <div className="coming-soon__desc">This page is currently under development and will be available soon.</div>
      </div>
    </div>
  );
}

// ── Edge editor ──────────────────────────────────────────────────────────
// Subscribes to PageKG's edge state via window.__kgGetEdges + 'kg-edges-changed'
// event, edits via window.__kgSetEdges.
function EdgeEditor({ onSaveDefault, savedEdges }) {
  const [edges, setLocalEdges] = useState([]);
  const [entities, setEntities] = useState([]);
  const [newSrc, setNewSrc] = useState('');
  const [newTgt, setNewTgt] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    const sync = () => {
      const e = window.__kgGetEdges?.() || [];
      setLocalEdges(e.map(x => [...x]));
      const list = window.__kgEntityList || [];
      setEntities(list);
      if (list.length && !newSrc) setNewSrc(list[0].id);
      if (list.length && !newTgt) setNewTgt(list[0].id);
    };
    sync();
    window.addEventListener('kg-edges-changed', sync);
    // Poll briefly in case PageKG mounts after this component
    const id = setInterval(sync, 250);
    const stop = setTimeout(() => clearInterval(id), 2000);
    return () => {
      window.removeEventListener('kg-edges-changed', sync);
      clearInterval(id); clearTimeout(stop);
    };
  }, []);

  const setEdges = (next) => window.__kgSetEdges?.(next);

  const removeEdge = (i) => {
    const next = edges.filter((_, idx) => idx !== i);
    setEdges(next);
  };
  const updateEdge = (i, field, value) => {
    const next = edges.map((e, idx) => {
      if (idx !== i) return e;
      const copy = [...e];
      if (field === 'src')      copy[0] = value;
      if (field === 'tgt')      copy[1] = value;
      if (field === 'label')    copy[2] = value || null;
      if (field === 'hidden')   copy[3] = !!value;
      if (field === 'srcAlias') copy[4] = value || null;
      if (field === 'tgtAlias') copy[5] = value || null;
      return copy;
    });
    setEdges(next);
  };
  const addEdge = () => {
    if (!newSrc || !newTgt) return;
    const next = [...edges, [newSrc, newTgt, newLabel || null]];
    setEdges(next);
    setNewLabel('');
  };
  const resetEdges = () => {
    if (savedEdges && Array.isArray(savedEdges)) {
      setEdges(savedEdges.map(e => [...e]));
    }
  };

  const saveAsDefault = () => {
    if (onSaveDefault) {
      onSaveDefault(edges.map(e => [...e]));
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    }
  };

  // Detect unsaved changes vs. persisted defaults
  const dirty = (() => {
    if (!savedEdges) return false;
    if (savedEdges.length !== edges.length) return true;
    for (let i = 0; i < edges.length; i++) {
      const a = edges[i], b = savedEdges[i];
      if (a[0] !== b[0] || a[1] !== b[1] || (a[2] || null) !== (b[2] || null) || (!!a[3]) !== (!!b[3]) || (a[4] || null) !== (b[4] || null) || (a[5] || null) !== (b[5] || null)) return true;
    }
    return false;
  })();

  const labelById = (id) => entities.find(e => e.id === id)?.label || id;

  return (
    <div className="ee-root">
      {/* Save bar */}
      <div className="ee-save-bar">
        <button
          onClick={saveAsDefault}
          disabled={!dirty && !savedFlash}
          className={`ee-save-btn${savedFlash ? ' ee-save-btn--saved' : dirty ? ' ee-save-btn--dirty' : ''}`}
        >
          {savedFlash ? 'Saved' : (dirty ? 'Save as default' : 'Default saved')}
        </button>
        <button
          onClick={resetEdges}
          disabled={!dirty}
          className={`ee-reset-btn${dirty ? ' ee-reset-btn--dirty' : ''}`}
        >
          Reset
        </button>
      </div>

      <div className="ee-row-header">
        <div>Source</div><div>Target</div><div>Label</div><div></div>
      </div>

      <div className="ee-scroll-list">
        {edges.map((e, i) => (
          <div key={i} className="ee-row">
            <select className="ee-field" value={e[0]} onChange={(ev) => updateEdge(i, 'src', ev.target.value)}>
              {entities.map(en => <option key={en.id} value={en.id}>{en.label}</option>)}
            </select>
            <select className="ee-field" value={e[1]} onChange={(ev) => updateEdge(i, 'tgt', ev.target.value)}>
              {entities.map(en => <option key={en.id} value={en.id}>{en.label}</option>)}
            </select>
            <input className="ee-field" placeholder="—"
                   value={e[2] || ''}
                   onChange={(ev) => updateEdge(i, 'label', ev.target.value)} />
            <button className="ee-x-btn" title="Remove edge" onClick={() => removeEdge(i)}>×</button>
          </div>
        ))}
        {edges.length === 0 && (
          <div className="ee-empty">No edges. Add one below.</div>
        )}
      </div>

      <div className="ee-add-section">
        <div className="ee-add-label">Add edge</div>
        <div className="ee-row">
          <select className="ee-field" value={newSrc} onChange={(e) => setNewSrc(e.target.value)}>
            {entities.map(en => <option key={en.id} value={en.id}>{en.label}</option>)}
          </select>
          <select className="ee-field" value={newTgt} onChange={(e) => setNewTgt(e.target.value)}>
            {entities.map(en => <option key={en.id} value={en.id}>{en.label}</option>)}
          </select>
          <input className="ee-field" placeholder="Relationship (optional)"
                 value={newLabel}
                 onChange={(e) => setNewLabel(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && addEdge()} />
          <button className="ee-x-btn ee-add-btn" title="Add edge" onClick={addEdge}>+</button>
        </div>
      </div>
    </div>
  );
}

const TAB_DEFS = [
  {
    id: 'filter',
    label: 'Filter',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
      </svg>
    ),
  },
  {
    id: 'navigator',
    label: 'Navigator',
    icon: <img src="/assets/icons/Navigator icon.svg" width={12} height={12} alt="" />,
  },
];

// ── Shared right panel tab strip ─────────────────────────────────────
function RightPanelShell({ tab, onTabSwitch, onClose, filterProps, navigatorProps, visitedTabs = [], navigatorFloating = false }) {
  const SHELL_WIDTH = 400;
  const isOpen = tab !== null;
  const isCollapsedForFloat = navigatorFloating && tab === 'navigator';
  const visibleTabs = TAB_DEFS.filter(t => visitedTabs.includes(t.id));

  return (
    <div
      className="rp-shell"
      style={{
        width: isCollapsedForFloat ? 0 : isOpen ? SHELL_WIDTH : 0,
        borderLeft: (isOpen && !isCollapsedForFloat) ? '1px solid var(--shell-border)' : 'none',
        boxShadow: (isOpen && !isCollapsedForFloat) ? '-4px 0 20px rgba(0,0,0,0.18)' : 'none',
      }}
    >
      <div className="rp-shell__inner" style={{ width: SHELL_WIDTH }}>
        {/* Tab strip — 48px to align with SubHeader */}
        <div className="rp-tabstrip">
          <div className={`rp-tabstrip__tabs${visibleTabs.length > 1 ? ' rp-seg-tabs' : ''}`}>
            {visibleTabs.map(t => (
              <button
                key={t.id}
                className={`rp-tab${tab === t.id ? ' rp-tab--active' : ''}`}
                onClick={() => onTabSwitch(t.id)}
              >
                <span className="rp-tab__icon">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
          <button
            className="rp-tab-close"
            onClick={onClose}
            title="Close panel"
            aria-label="Close panel"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Active panel content */}
        <div className="rp-content">
          {tab === 'filter' && (
            <FilterPanel
              {...filterProps}
              embedded={true}
              onClose={onClose}
            />
          )}
          {tab === 'navigator' && (
            <NavigatorPanel
              open={true}
              embedded={true}
              onClose={onClose}
              onNav={navigatorProps?.onNav}
              initialViewMode={navigatorProps?.initialViewMode}
              onViewModeChange={navigatorProps?.onViewModeChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Pages that have the Edit → Discover Dashboard shortcut ──────────
const DISCOVER_PAGES = new Set(['discover/device', 'discover/cloud', 'discover/identity']);

const _UNUSED = {
  'discover/device': {
    name: 'Device Dashboard',
    widgets: [
      {
        id: 1001, label: 'Total Devices', chartId: 'kpi', span: 1, sizeId: 'small', heightId: 'medium', phase: 'active',
        data: { value: '12,382', label: 'Total Devices', trend: '3.89%', trendUp: true },
      },
      {
        id: 1002, label: 'Criticality Insights', chartId: 'stack-hor', span: 2, sizeId: 'medium', heightId: 'medium', phase: 'active',
        data: [
          { label: 'Critical', count: '953',    pct: 1.74,  color: 'var(--pai-crit-fg)'  },
          { label: 'High',     count: '12,353', pct: 22.59, color: 'var(--pai-red-high)'  },
          { label: 'Medium',   count: '36,136', pct: 66.08, color: 'var(--pai-red-high)'  },
          { label: 'Low',      count: '5,244',  pct: 9.59,  color: 'var(--pai-green)'    },
        ],
      },
      {
        id: 1003, label: 'Data Source', chartId: 'hor-bar', span: 2, sizeId: 'medium', heightId: 'medium', phase: 'active',
        data: [
          { label: 'AWS',                 value: 100, secondary: 5,  count: '97' },
          { label: 'MS Azure',            value: 88,  secondary: 5,  count: '85' },
          { label: 'Qualys',              value: 58,  secondary: 21, count: '56' },
          { label: 'MS Active Directory', value: 48,  secondary: 31, count: '47' },
          { label: 'WIZ',                 value: 39,  secondary: 5,  count: '38' },
          { label: 'Infoblox',            value: 12,  secondary: 7,  count: '12' },
          { label: 'MS Defender',         value: 8,   secondary: 5,  count: '8'  },
          { label: 'Tenable',             value: 5,   secondary: 3,  count: '5'  },
        ],
      },
      {
        id: 1004, label: 'Asset Types', chartId: 'pie', span: 1, sizeId: 'small', heightId: 'medium', phase: 'active',
        totalLabel: '10,679',
        data: [
          { label: 'Server',           count: '4,086', value: 4086, pct: '33%',  color: 'var(--pai-indigo)'       },
          { label: 'Workstation',      count: '2,848', value: 2848, pct: '23%',  color: '#5BADB8'                 },
          { label: 'Network',          count: '2,600', value: 2600, pct: '21%',  color: 'var(--pai-green)'        },
          { label: 'Mobile',           count: '897',   value: 897,  pct: '8%',   color: 'var(--pai-high-fg)'      },
          { label: 'Printers',         count: '124',   value: 124,  pct: '1%',   color: 'var(--pai-high-fg)'     },
          { label: 'IOT',              count: '122',   value: 122,  pct: '1%',   color: 'var(--pai-indigo-muted)' },
        ],
      },
      { id: 1005, label: 'Insights', chartId: 'table', span: 4, sizeId: 'xlarge', heightId: 'large', phase: 'active' },
    ],
  },
  'discover/cloud': {
    name: 'Cloud Dashboard',
    widgets: [
      {
        id: 1001, label: 'Total Cloud Assets', chartId: 'kpi', span: 1, sizeId: 'small', heightId: 'medium', phase: 'active',
        data: { value: '11,722', label: 'Total Cloud Assets', trend: '2.14%', trendUp: true },
      },
      {
        id: 1002, label: 'Criticality Insights', chartId: 'stack-hor', span: 2, sizeId: 'medium', heightId: 'medium', phase: 'active',
        data: [
          { label: 'Critical', count: '750',   pct: 6.38,  color: 'var(--pai-crit-fg)'  },
          { label: 'High',     count: '3,560', pct: 30.26, color: 'var(--pai-red-high)'  },
          { label: 'Medium',   count: '4,188', pct: 35.60, color: 'var(--pai-red-high)'  },
          { label: 'Low',      count: '3,265', pct: 27.76, color: 'var(--pai-green)'    },
        ],
      },
      {
        id: 1003, label: 'Data Source', chartId: 'hor-bar', span: 2, sizeId: 'medium', heightId: 'medium', phase: 'active',
        data: [
          { label: 'AWS',         value: 100, secondary: 0,  count: '55' },
          { label: 'Wiz',         value: 75,  secondary: 27, count: '41' },
          { label: 'Qualys',      value: 53,  secondary: 36, count: '29' },
          { label: 'MS Intune',   value: 24,  secondary: 18, count: '13' },
          { label: 'MS Azure AD', value: 24,  secondary: 18, count: '13' },
          { label: 'MS Azure',    value: 15,  secondary: 9,  count: '8'  },
          { label: 'MS Defender', value: 11,  secondary: 7,  count: '6'  },
          { label: 'Tenable',     value: 7,   secondary: 4,  count: '4'  },
        ],
      },
      {
        id: 1004, label: 'Asset Types', chartId: 'pie', span: 1, sizeId: 'small', heightId: 'medium', phase: 'active',
        totalLabel: '11,722',
        data: [
          { label: 'Volume',                 count: '5,423', value: 5423, pct: '46%', color: 'var(--pai-indigo)'       },
          { label: 'Workstation',            count: '4,922', value: 4922, pct: '42%', color: '#5BADB8'                 },
          { label: 'Server',                 count: '381',   value: 381,  pct: '3%',  color: 'var(--pai-green)'        },
          { label: 'Kubernetes Container',   count: '353',   value: 353,  pct: '3%',  color: 'var(--pai-high-fg)'      },
          { label: 'Security Group',         count: '224',   value: 224,  pct: '2%',  color: 'var(--pai-high-fg)'     },
          { label: 'Serverless',             count: '66',    value: 66,   pct: '1%',  color: 'var(--pai-indigo-muted)' },
        ],
      },
      { id: 1005, label: 'Insights', chartId: 'table', span: 4, sizeId: 'xlarge', heightId: 'large', phase: 'active' },
    ],
  },
  'discover/identity': {
    name: 'Identity Dashboard',
    widgets: [
      {
        id: 1001, label: 'Total Identities', chartId: 'kpi', span: 1, sizeId: 'small', heightId: 'medium', phase: 'active',
        data: { value: '71,442', label: 'Total Identities', trend: '1.62%', trendUp: false },
      },
      {
        id: 1002, label: 'Criticality Insights', chartId: 'stack-hor', span: 2, sizeId: 'medium', heightId: 'medium', phase: 'active',
        data: [
          { label: 'Critical', count: '4,322',  pct: 6.05,  color: 'var(--pai-crit-fg)'  },
          { label: 'High',     count: '17,503', pct: 24.50, color: 'var(--pai-red-high)'  },
          { label: 'Medium',   count: '40,197', pct: 56.27, color: 'var(--pai-red-high)'  },
          { label: 'Low',      count: '9,420',  pct: 13.18, color: 'var(--pai-green)'    },
        ],
      },
      {
        id: 1003, label: 'Data Source', chartId: 'hor-bar', span: 2, sizeId: 'medium', heightId: 'medium', phase: 'active',
        data: [
          { label: 'MS Active Dire...', value: 100, secondary: 41, count: '59' },
          { label: 'MS Entra ID',       value: 64,  secondary: 25, count: '38' },
          { label: 'Windows Securit...', value: 63, secondary: 20, count: '37' },
          { label: 'MS Intune',         value: 49,  secondary: 14, count: '29' },
          { label: 'MS Defender',       value: 39,  secondary: 12, count: '23' },
          { label: 'MS Azure',          value: 10,  secondary: 5,  count: '6'  },
          { label: 'Okta',              value: 7,   secondary: 3,  count: '4'  },
        ],
      },
      {
        id: 1004, label: 'Identity Types', chartId: 'pie', span: 1, sizeId: 'small', heightId: 'medium', phase: 'active',
        totalLabel: '71,442',
        data: [
          { label: 'Non-Human', count: '57,687', value: 57687, pct: '80.75%', color: 'var(--pai-indigo)' },
          { label: 'Human',     count: '13,755', value: 13755, pct: '19.25%', color: 'var(--pai-green)'  },
        ],
      },
      { id: 1005, label: 'Insights', chartId: 'table', span: 4, sizeId: 'xlarge', heightId: 'large', phase: 'active' },
    ],
  },
};

function App() {
  const [current, setCurrent] = useState(() => {
    const path = window.location.pathname;
    if (path === '/workspace') return 'workspace';
    if (path.startsWith('/workspace/')) return path.slice(1);
    if (path === '/knowledge-graph') return 'kg';
    if (path === '/') return 'exposure/overview';
    return path.slice(1) || 'exposure/overview';
  });
  const [appMode, setAppMode] = useState('em'); // 'em' | 'studio'
  const [showSplash, setShowSplash] = useState(true);
  const onSplashDone = useCallback(() => setShowSplash(false), []);
  const [matrixFilter, setMatrixFilter] = useState(null); // { framework, frameworkName, groupBy, row, col, colId, score }
  const [theme, setTheme] = useState(() => localStorage.getItem('pai-theme') || 'light');
  const [collapsed, setCollapsed] = useState(false);
  const [rightPanel, setRightPanel] = useState(null); // null | 'filter' | 'navigator'
  const [navigatorQuery, setNavigatorQuery] = useState('');
  const [navigatorViewMode, setNavigatorViewMode] = useState('sidebar');
  const [navigatorFloating, setNavigatorFloating] = useState(false);
  const [visitedTabs, setVisitedTabs] = useState([]);
  const [graphFilterOpen, setGraphFilterOpen] = useState(false);
  const [filtersByPage, setFiltersByPage] = useState({});
  const [tweaks, setTweak] = useTweaks(FLOAT_TWEAK_DEFAULTS);
  const [canvasTop, setCanvasTop] = useState(0);
  const [complianceExpanded, setComplianceExpanded] = useState({});
  const canvasRef = useRef(null);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('theme-dark', theme === 'dark');
    html.classList.toggle('theme-light', theme === 'light');
    localStorage.setItem('pai-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // Set BEFORE first render of children so PageKG can read persisted edges synchronously
  if (typeof window !== 'undefined' && window.__floatTweaks !== tweaks) {
    window.__floatTweaks = tweaks;
  }

  // Keep in sync on subsequent updates (rAF reads it each frame)
  useEffect(() => { window.__floatTweaks = tweaks; }, [tweaks]);

  useEffect(() => {
    const measure = () => {
      if (canvasRef.current) setCanvasTop(canvasRef.current.getBoundingClientRect().top);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname;
      if (path === '/workspace') setCurrent('workspace');
      else if (path.startsWith('/workspace/')) setCurrent(path.slice(1));
      else if (path === '/knowledge-graph') setCurrent('kg');
      else if (path === '/') setCurrent('exposure/overview');
      else setCurrent(path.slice(1) || 'exposure/overview');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const timers = new WeakMap();
    const onScroll = (e) => {
      const el = e.target;
      if (!el?.classList?.contains('page-scroll')) return;
      el.classList.add('is-scrolling');
      if (timers.has(el)) clearTimeout(timers.get(el));
      timers.set(el, setTimeout(() => el.classList.remove('is-scrolling'), 3000));
    };
    document.addEventListener('scroll', onScroll, true);
    return () => document.removeEventListener('scroll', onScroll, true);
  }, []);

  const openRightTab = (tabName) => {
    setVisitedTabs(prev => prev.includes(tabName) ? prev : [...prev, tabName]);
    setRightPanel(prev => {
      const next = prev === tabName ? null : tabName;
      if (next) setCollapsed(true);
      return next;
    });
  };

  const handleNav = (id, data) => {
    if (id === 'navigator') {
      setNavigatorViewMode('sidebar');
      openRightTab('navigator');
      return;
    }
    if (id === 'navigator-page') {
      setRightPanel(null);
      setNavigatorQuery(data || '');
      setCurrent('navigator');
      history.pushState(null, '', '/navigator');
      return;
    }
    if (id === 'navigator-floating') {
      setNavigatorViewMode('floating');
      setCurrent('kg');
      history.pushState(null, '', '/knowledge-graph');
      openRightTab('navigator');
      return;
    }
    setCurrent(id);
    let url;
    if (id === 'workspace') url = '/workspace';
    else if (id.startsWith('workspace/')) url = `/${id}`;
    else if (id === 'kg') url = '/knowledge-graph';
    else url = `/${id}`;
    history.pushState(null, '', url);
  };

  // Per-page filter accessors
  const curPageFilters   = filtersByPage[current] || { count: 0, chips: [] };
  const activeFilterCount = curPageFilters.count;
  const activeFilters     = curPageFilters.chips;

  const setPageFilters = (pageId, count, chips) =>
    setFiltersByPage(prev => ({ ...prev, [pageId]: { count, chips } }));

  // Explore in: navigate to destId carrying the current page's filters
  const handleExplore = (destId) => {
    const src = filtersByPage[current] || { count: 0, chips: [] };
    setFiltersByPage(prev => ({ ...prev, [destId]: { count: src.count, chips: src.chips } }));
    handleNav(destId);
  };

  if (current === 'workspace' || current.startsWith('workspace/')) {
    return (
      <>
        {showSplash && <SplashScreen onDone={onSplashDone} />}
        <WorkspacePage onNav={handleNav} initialRoute={current} theme={theme} onToggleTheme={toggleTheme} />
      </>
    );
  }

  if (current === 'navigator' || current.startsWith('navigator/')) {
    return (
      <>
        {showSplash && <SplashScreen onDone={onSplashDone} />}
        <NavigatorPage onNav={handleNav} current={current} initialQuery={navigatorQuery} />
      </>
    );
  }

  const PAGE_META = {
    'exposure/overview': {
      title: 'Overview',
      breadcrumb: ['Home', 'Exposure', 'Overview'],
      breadcrumbHrefs: [null, null, null],
    },
    'exposure/findings': {
      title: 'Findings',
      breadcrumb: ['Home', 'Exposure', 'Findings'],
      breadcrumbHrefs: [null, null, null],
    },
    'discover/device': {
      title: 'Device',
      breadcrumb: ['Home', 'Discover', 'Device'],
      breadcrumbHrefs: [null, null, null],
    },
    'discover/cloud': {
      title: 'Cloud',
      breadcrumb: ['Home', 'Discover', 'Cloud'],
      breadcrumbHrefs: [null, null, null],
    },
    'discover/identity': {
      title: 'Identity',
      breadcrumb: ['Home', 'Discover', 'Identity'],
      breadcrumbHrefs: [null, null, null],
    },
    'report/compliance': {
      title: 'Compliance',
      breadcrumb: ['Home', 'Report', 'Compliance'],
      breadcrumbHrefs: [null, null, null],
    },
    'report/assessments': {
      title: 'Assessments',
      breadcrumb: ['Home', 'Report', 'Assessments'],
      breadcrumbHrefs: [null, null, null],
    },
    'report/compliance-matrix': {
      title: 'Compliance Matrix',
      breadcrumb: ['Home', 'Report', 'Compliance Matrix'],
      breadcrumbHrefs: [null, null, null],
    },
    'report/compliance-findings': {
      title: 'Compliance Findings',
      breadcrumb: ['Home', 'Report', 'Compliance Findings'],
      breadcrumbHrefs: [null, null, null],
    },
    'data-quality/overview': {
      title: 'Overview',
      breadcrumb: ['Home', 'Data Quality', 'Overview'],
      breadcrumbHrefs: [null, null, null],
    },
    'data-quality/in-depth': {
      title: 'In-Depth',
      breadcrumb: ['Home', 'Data Quality', 'In-Depth'],
      breadcrumbHrefs: [null, null, null],
    },
    'remediation/queue': {
      title: 'Queue',
      breadcrumb: ['Home', 'Remediation', 'Queue'],
      breadcrumbHrefs: [null, null, null],
    },
    'remediation/closed': {
      title: 'Closed',
      breadcrumb: ['Home', 'Remediation', 'Closed'],
      breadcrumbHrefs: [null, null, null],
    },
    kg: {
      title: 'Knowledge Graph',
      breadcrumb: ['Home', 'Knowledge Graph'],
      breadcrumbHrefs: ['/knowledge-graph', null],
      onAdd: () => {},
    },
  };

  if (!PAGE_META[current] && current !== 'kg') {
    return <ErrorPage type="notFound" onHome={() => { setCurrent('exposure/overview'); history.pushState(null, '', '/exposure/overview'); }} />;
  }

  const pageMeta = PAGE_META[current] || PAGE_META.kg;
  const isKG = current === 'kg' || !PAGE_META[current];

  const sharedRightPanel = (
    <RightPanelShell
      tab={rightPanel}
      onTabSwitch={openRightTab}
      onClose={() => { setRightPanel(null); setNavigatorFloating(false); }}
      visitedTabs={visitedTabs}
      filterProps={{ pageId: current, onApply: (c, chips, merge = false) => {
        if (merge) {
          setFiltersByPage(prev => {
            const cur = prev[current] || { count: 0, chips: [] };
            const merged = [...cur.chips, ...(chips || [])];
            return { ...prev, [current]: { count: new Set(merged.map(f => f.attrId)).size, chips: merged } };
          });
        } else {
          setPageFilters(current, c, chips || []);
        }
      }, onOpenGraphFilter: () => setGraphFilterOpen(o => !o), graphFilterOpen }}
      navigatorProps={{
        onNav: handleNav,
        initialViewMode: navigatorViewMode,
        onViewModeChange: (mode) => setNavigatorFloating(mode === 'floating'),
      }}
      navigatorFloating={navigatorFloating}
    />
  );

  return (
    <div className="app-shell">
      {showSplash && <SplashScreen onDone={onSplashDone} />}
      <Topbar onNav={handleNav} navigatorActive={rightPanel === 'navigator'} theme={theme} onToggleTheme={toggleTheme} />

      <div ref={isKG && appMode !== 'studio' ? canvasRef : null} className="app-body">
        <LeftNav
          current={current}
          onNav={handleNav}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          mode={appMode}
          onModeChange={setAppMode}
        />

        {appMode === 'studio' ? (
          <main className="exp-main exp-main--col">
            <SubHeader
              title="Studio"
              breadcrumb={['Studio']}
              breadcrumbHrefs={[null]}
            />
            <div className="page-scroll">
              <ComingSoon />
            </div>
          </main>
        ) : (
          <main className="exp-main exp-main--row">
            <div className="exp-content-col">
              <SubHeader
                title={pageMeta.title}
                breadcrumb={pageMeta.breadcrumb}
                breadcrumbHrefs={pageMeta.breadcrumbHrefs}
                breadcrumbClicks={[() => handleNav('exposure/overview')]}
                pageId={current}
                activeFilterCount={activeFilterCount}
                activeFilters={activeFilters}
                onRemoveFilter={(idx) => {
                  setFiltersByPage(prev => {
                    const cur = prev[current] || { count: 0, chips: [] };
                    const updated = cur.chips.filter((_, i) => i !== idx);
                    return { ...prev, [current]: { count: new Set(updated.map(c => c.attrId)).size, chips: updated } };
                  });
                }}
                onClearFilters={() => setPageFilters(current, 0, [])}
                filterActive={rightPanel === 'filter'}
                onFilter={() => openRightTab('filter')}
                onAdd={pageMeta.onAdd}
                onExplore={handleExplore}
                onEdit={DISCOVER_PAGES.has(current) ? () => {
                  setCurrent('workspace/dashboard/discover');
                  history.pushState(null, '', '/workspace');
                } : undefined}
              />
              <div className="page-scroll">
                {current === 'exposure/overview'   && <ExposureOverviewPage />}
                {current === 'exposure/findings'   && <FindingsPage onNav={handleNav} />}
                {current === 'discover/device'     && <DiscoverDevicePage />}
                {current === 'discover/cloud'      && <DiscoverCloudPage />}
                {current === 'discover/identity'   && <DiscoverIdentityPage />}
                {current === 'report/compliance'        && <CompliancePage expanded={complianceExpanded} onExpandChange={setComplianceExpanded} />}
                {current === 'report/assessments'       && <AssessmentsPage />}
                {current === 'report/compliance-matrix'    && <ComplianceMatrixPage onCellClick={filter => { setMatrixFilter(filter); handleNav('report/compliance-findings'); }} />}
                {current === 'report/compliance-findings'  && <ComplianceFindingsPage filter={matrixFilter} onClearFilter={() => setMatrixFilter(null)} />}
                {!isKG && current !== 'exposure/overview' && current !== 'exposure/findings' && current !== 'discover/device' && current !== 'discover/cloud' && current !== 'discover/identity' && current !== 'report/compliance' && current !== 'report/assessments' && current !== 'report/compliance-matrix' && current !== 'report/compliance-findings' && <ComingSoon />}
                {isKG && <PageKG />}
              </div>
            </div>
            {sharedRightPanel}
          </main>
        )}
      </div>

      {isKG && appMode !== 'studio' && GraphFilterDrawer && (
        <GraphFilterDrawer
          open={graphFilterOpen}
          onClose={() => setGraphFilterOpen(false)}
          onApply={(count) => { setPageFilters(current, count, activeFilters); setGraphFilterOpen(false); }}
          top={canvasTop}
        />
      )}

      {isKG && appMode !== 'studio' && (
        <TweaksPanel title="Tweaks">
          <style>{`.twk-panel { width: 360px !important; }`}</style>
          <TweakSection label="Graph float animation" />
          <TweakToggle label="Enabled" value={tweaks.floatEnabled}
                       onChange={(v) => setTweak('floatEnabled', v)} />
          <TweakSlider label="Amplitude X" value={tweaks.ampX} min={0} max={20} step={0.5} unit="px"
                       onChange={(v) => setTweak('ampX', v)} />
          <TweakSlider label="Amplitude Y" value={tweaks.ampY} min={0} max={20} step={0.5} unit="px"
                       onChange={(v) => setTweak('ampY', v)} />
          <TweakSlider label="Speed X" value={tweaks.speedX} min={0.05} max={3} step={0.05} unit=" rad/s"
                       onChange={(v) => setTweak('speedX', v)} />
          <TweakSlider label="Speed Y" value={tweaks.speedY} min={0.05} max={3} step={0.05} unit=" rad/s"
                       onChange={(v) => setTweak('speedY', v)} />
          <TweakSlider label="Per-node variation" value={tweaks.variation} min={0} max={100} step={5} unit="%"
                       onChange={(v) => setTweak('variation', v)} />

          <TweakSection label="Edges" />
          <EdgeEditor
            onSaveDefault={(eds) => setTweak('edges', eds)}
            savedEdges={tweaks.edges}
          />
        </TweaksPanel>
      )}
    </div>
  );
}

function AppWithBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

export default AppWithBoundary;
