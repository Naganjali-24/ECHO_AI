
import React from 'react';

// Fix: Make children optional in type definition to avoid spread operator errors in children components
const IconBase = ({ children, className }: { children?: React.ReactNode, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {children}
  </svg>
);

export const AlertCircle = (props: { className?: string }) => (
  <IconBase {...props}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></IconBase>
);

export const CheckCircle = (props: { className?: string }) => (
  <IconBase {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></IconBase>
);

export const Sun = (props: { className?: string }) => (
  <IconBase {...props}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></IconBase>
);

export const Moon = (props: { className?: string }) => (
  <IconBase {...props}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></IconBase>
);

export const CloudLightning = (props: { className?: string }) => (
  <IconBase {...props}><path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"/><polyline points="13 11 9 17 15 17 11 23"/></IconBase>
);

export const Activity = (props: { className?: string }) => (
  <IconBase {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></IconBase>
);

export const ShieldAlert = (props: { className?: string }) => (
  <IconBase {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></IconBase>
);

export const Upload = (props: { className?: string }) => (
  <IconBase {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></IconBase>
);

export const Download = (props: { className?: string }) => (
  <IconBase {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></IconBase>
);

export const MapPin = (props: { className?: string }) => (
  <IconBase {...props}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></IconBase>
);

export const Home = (props: { className?: string }) => (
  <IconBase {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></IconBase>
);

export const List = (props: { className?: string }) => (
  <IconBase {...props}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></IconBase>
);

export const UserIcon = (props: { className?: string }) => (
  <IconBase {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></IconBase>
);

export const Globe = (props: { className?: string }) => (
  <IconBase {...props}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></IconBase>
);

export const Eye = (props: { className?: string }) => (
  <IconBase {...props}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></IconBase>
);

export const Zap = (props: { className?: string }) => (
  <IconBase {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></IconBase>
);

export const Loader2 = (props: { className?: string }) => (
  <IconBase {...props}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></IconBase>
);

export const Bell = (props: { className?: string }) => (
  <IconBase {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></IconBase>
);

export const RotateCw = (props: { className?: string }) => (
  <IconBase {...props}><path d="M21 2v6h-6"/><path d="M21 13a9 9 0 1 1-3-7.7L21 8"/></IconBase>
);

export const Radar = (props: { className?: string }) => (
  <IconBase {...props}><path d="M19.07 4.93A10 10 0 0 0 2 12h3.1a7 7 0 0 1 11.9 0H22a10 10 0 0 0-2.93-7.07Z"/><path d="M12 19a7 7 0 0 1-7-7H2a10 10 0 0 0 10 10v-3.1Z"/><path d="M12 5.1V2a10 10 0 0 0-10 10h3.1a7 7 0 0 1 6.9-6.9Z"/><path d="M22 12a10 10 0 0 0-10-10v3.1a7 7 0 0 1 7 7h3Z"/><circle cx="12" cy="12" r="2"/></IconBase>
);

export const Mic = (props: { className?: string }) => (
  <IconBase {...props}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></IconBase>
);

export const MicOff = (props: { className?: string }) => (
  <IconBase {...props}><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></IconBase>
);

export const Phone = (props: { className?: string }) => (
  <IconBase {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></IconBase>
);

export const Users = (props: { className?: string }) => (
  <IconBase {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></IconBase>
);

export const Server = (props: { className?: string }) => (
  <IconBase {...props}><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></IconBase>
);

export const BarChart = (props: { className?: string }) => (
  <IconBase {...props}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></IconBase>
);

export const Settings = (props: { className?: string }) => (
  <IconBase {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></IconBase>
);

export const Trash2 = (props: { className?: string }) => (
  <IconBase {...props}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></IconBase>
);

export const X = (props: { className?: string }) => (
  <IconBase {...props}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></IconBase>
);

export const Play = (props: { className?: string }) => (
  <IconBase {...props}><polygon points="5 3 19 12 5 21 5 3"/></IconBase>
);

export const Pause = (props: { className?: string }) => (
  <IconBase {...props}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></IconBase>
);

export const Search = (props: { className?: string }) => (
  <IconBase {...props}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></IconBase>
);

export const Target = (props: { className?: string }) => (
  <IconBase {...props}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></IconBase>
);

export const Wind = (props: { className?: string }) => (
  <IconBase {...props}><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></IconBase>
);

export const Thermometer = (props: { className?: string }) => (
  <IconBase {...props}><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></IconBase>
);

export const Waves = (props: { className?: string }) => (
  <IconBase {...props}><path d="M2 6c.6.5 1.2 1 2.5 1C5.8 7 7 6 7 6s1.2-1 2.5-1c1.3 0 2.5 1 2.5 1s1.2 1 2.5 1c1.3 0 2.5-1 2.5-1s1.2-1 2.5-1 2.5 1 2.5 1M2 12c.6.5 1.2 1 2.5 1 1.3 0 2.5-1 2.5-1s1.2-1 2.5-1c1.3 0 2.5 1 2.5 1s1.2 1 2.5 1c1.3 0 2.5-1 2.5-1s1.2-1 2.5-1 2.5 1 2.5 1M2 18c.6.5 1.2 1 2.5 1 1.3 0 2.5-1 2.5-1s1.2-1 2.5-1c1.3 0 2.5 1 2.5 1s1.2 1 2.5 1c1.3 0 2.5-1 2.5-1s1.2-1 2.5-1 2.5 1 2.5 1"/></IconBase>
);

export const Clock = (props: { className?: string }) => (
  <IconBase {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></IconBase>
);

export const Flag = (props: { className?: string }) => (
  <IconBase {...props}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></IconBase>
);

export const Award = (props: { className?: string }) => (
  <IconBase {...props}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></IconBase>
);

export const LogOut = (props: { className?: string }) => (
  <IconBase {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></IconBase>
);

export const Info = (props: { className?: string }) => (
  <IconBase {...props}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></IconBase>
);

// Added missing Radio icon export
export const Radio = (props: { className?: string }) => (
  <IconBase {...props}><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M7.76 7.76a6 6 0 0 0 0 8.49"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></IconBase>
);
