import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const TABS = {
  HOME: 'home',
  ADS: 'ads',
  OFFER: 'offer',
  REQUEST: 'request',
  ADMIN: 'admin',
};

const MY_OFFERS_KEY = 'tawseelat_my_offers_v1';
const MY_REQUESTS_KEY = 'tawseelat_my_requests_v1';

const POPULAR_AREAS = [
  'مجمع الوسط (السنتر) - البوابة الرئيسية',
  'مجمع الوسط - كلية الهندسة',
  'مجمع الوسط - شارع الجامعة',
  'مجمع شمبات (الزراعة / البيطرة)',
  'مجمع الطب والعلوم الصحية (القصر)',
  'كلية التربية - أم درمان',
  'الخرطوم - السوق العربي',
  'الخرطوم - الرياض',
  'الخرطوم - العمارات',
  'الخرطوم - الصحافة',
  'الخرطوم - جبرة',
  'الخرطوم - الكلاكلة',
  'بحري - المؤسسة',
  'بحري - الحلفايا / كافوري',
  'أم درمان - السوق الشعبي',
  'أم درمان - الثورة',
  'أم درمان - الموردة / المهندسين',
];

const WEEKDAYS = [
  { key: 'sun', label: 'الأحد' },
  { key: 'mon', label: 'الاثنين' },
  { key: 'tue', label: 'الثلاثاء' },
  { key: 'wed', label: 'الأربعاء' },
  { key: 'thu', label: 'الخميس' },
  { key: 'fri', label: 'الجمعة' },
  { key: 'sat', label: 'السبت' },
];

const RECURRENCE_CHOICES = [
  { value: 'once', label: 'توصيلة (مرة واحدة)' },
  { value: 'daily', label: 'ترحيل منتظم (يومياً)' },
  { value: 'weekdays', label: 'ترحيل منتظم (أيام محددة)' },
];

const OFFER_COLS =
  'id, driver_name, whatsapp_number, phone_number, vehicle_type, start_area, destination_area, intermediate_stops, departure_time, recurrence_type, recurrence_days, recurrence_group_id, total_seats, available_seats, price_per_seat, status, expires_at, created_at';

const REQUEST_COLS =
  'id, passenger_name, whatsapp_number, phone_number, start_area, destination_area, preferred_time, recurrence_type, recurrence_days, seats_needed, notes, status, expires_at, created_at';

const APP_CSS = `
:root {
  --bg: #f3f6f6; --surface: #ffffff; --soft: #f8fbfb;
  --primary: #0b555c; --primary-dark: #073e44; --primary-light: #e6f3f2;
  --accent: #d9822b; --accent-soft: #fef5e7;
  --text: #0f2629; --muted: #526b6e; --border: #dce7e6; --border-strong: #bdd1cf;
  --green: #15803d; --green-soft: #e6f7ed; --red: #b42318; --red-soft: #fef0f0;
  --violet: #5b21b6; --violet-soft: #f1ecfe; --sky: #0369a1; --sky-soft: #e6f4fc;
}
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
body { margin: 0; background: var(--bg); color: var(--text); font-family: 'Cairo', system-ui, -apple-system, sans-serif; direction: rtl; }
.tc-app { min-height: 100vh; padding-bottom: 92px; }

.tc-header { position: sticky; top: 0; z-index: 30; background: linear-gradient(135deg, #083f45 0%, #0d5c63 55%, #13736b 100%); color: #fff; box-shadow: 0 4px 18px rgba(8,63,69,.22); }
.tc-header-in { max-width: 920px; margin: 0 auto; padding: 13px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.tc-brand { display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; }
.tc-logo { width: 42px; height: 42px; border-radius: 13px; background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.tc-brand h1 { margin: 0; font-size: 1.18rem; font-weight: 800; line-height: 1.2; }
.tc-brand p { margin: 2px 0 0; font-size: .75rem; color: #cbece8; font-weight: 600; }
.tc-nav { display: none; align-items: center; gap: 6px; }
.tc-nav-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 11px; border: 1px solid transparent; background: rgba(255,255,255,.1); color: #eef9f8; font: 700 .84rem inherit; cursor: pointer; white-space: nowrap; }
.tc-nav-btn.active { background: #fff; color: var(--primary-dark); box-shadow: 0 3px 10px rgba(0,0,0,.12); }
.tc-live-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 11px; border-radius: 999px; background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.28); font: 700 .76rem inherit; color: #e6fffb; cursor: pointer; white-space: nowrap; }
.tc-dot-live { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 0 3px rgba(74,222,128,.28); }

.tc-bnav { position: fixed; bottom: 0; left: 0; right: 0; z-index: 40; background: rgba(255,255,255,.97); backdrop-filter: blur(12px); border-top: 1px solid var(--border); box-shadow: 0 -4px 18px rgba(11,56,62,.08); display: grid; grid-template-columns: repeat(5, 1fr); padding: 6px 6px calc(6px + env(safe-area-inset-bottom, 0px)); }
.tc-bnav-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 6px 4px; border: none; background: transparent; color: var(--muted); font: 700 .7rem inherit; cursor: pointer; border-radius: 10px; position: relative; }
.tc-bnav-btn.active { color: var(--primary); background: var(--primary-light); }
.tc-bnav-cnt { position: absolute; top: 2px; left: 16%; min-width: 17px; height: 17px; padding: 0 4px; border-radius: 999px; background: var(--accent); color: #fff; font-size: .65rem; font-weight: 800; display: flex; align-items: center; justify-content: center; }

.tc-main { max-width: 920px; margin: 18px auto 0; padding: 0 14px; }
.tc-card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 18px; box-shadow: 0 2px 8px rgba(11,56,62,.05); margin-bottom: 16px; }
.tc-hero { position: relative; overflow: hidden; border-radius: 22px; padding: 26px 20px; margin-bottom: 18px; background-color: #09464d; background-image: linear-gradient(135deg, rgba(7,56,62,.78) 0%, rgba(13,92,99,.70) 55%, rgba(20,122,110,.76) 100%), url('/uofk-bg.jpg'); background-size: cover; background-position: center; color: #fff; box-shadow: 0 12px 28px rgba(11,79,86,.22); }
.tc-kicker { display: inline-flex; align-items: center; gap: 6px; padding: 4px 11px; border-radius: 999px; background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.25); font-size: .78rem; font-weight: 700; margin-bottom: 10px; }
.tc-hero h2 { margin: 0 0 8px; font-size: 1.45rem; font-weight: 800; line-height: 1.35; text-shadow: 0 2px 10px rgba(0,0,0,.25); }
.tc-hero p { margin: 0 0 16px; font-size: .92rem; color: #e2f7f4; line-height: 1.7; max-width: 630px; }
.tc-stat-btn { display: inline-flex; align-items: center; gap: 7px; padding: 8px 13px; border-radius: 12px; background: rgba(7,45,50,.55); border: 1px solid rgba(255,255,255,.35); backdrop-filter: blur(6px); font: 700 .83rem inherit; color: #fff; cursor: pointer; }

.tc-grid-3 { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 16px; }
.tc-grid-2 { display: grid; grid-template-columns: 1fr; gap: 12px; }
.tc-tile { display: flex; align-items: center; gap: 14px; width: 100%; padding: 17px 15px; border-radius: 18px; border: 1px solid var(--border); background: #fff; color: var(--text); text-align: right; font-family: inherit; cursor: pointer; box-shadow: 0 2px 8px rgba(11,56,62,.05); }
.tc-tile.primary { background: linear-gradient(135deg, #f0faf8 0%, #fff 100%); border-color: #b7dcd8; }
.tc-tile-ico { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.tc-h2 { margin: 0 0 6px; font-size: 1.12rem; font-weight: 800; color: var(--primary-dark); display: flex; align-items: center; gap: 8px; }
.tc-h3 { margin: 0 0 8px; font-size: .98rem; font-weight: 800; color: var(--primary-dark); }
.tc-muted { margin: 0 0 13px; font-size: .88rem; color: var(--muted); line-height: 1.65; }

.tc-seg-4 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; padding: 5px; background: #e7f0ef; border-radius: 14px; margin-bottom: 16px; }
.tc-seg-btn { display: inline-flex; align-items: center; justify-content: center; gap: 5px; padding: 10px 8px; border: none; border-radius: 10px; background: transparent; color: var(--muted); font: 700 .84rem inherit; cursor: pointer; white-space: nowrap; }
.tc-seg-btn.active { background: #fff; color: var(--primary-dark); box-shadow: 0 2px 8px rgba(11,56,62,.1); }
.tc-seg-btn.mine { color: #9a5308; }
.tc-seg-btn.mine.active { color: var(--primary); }

.tc-sec { padding: 14px; border-radius: 13px; background: var(--soft); border: 1px solid var(--border); margin-bottom: 14px; }
.tc-sec-title { font-size: .86rem; font-weight: 800; color: var(--primary); margin: 0 0 11px; display: flex; align-items: center; gap: 6px; }
.tc-field { margin-bottom: 12px; }
.tc-field:last-child { margin-bottom: 0; }
.tc-label { display: block; margin-bottom: 6px; font-size: .86rem; font-weight: 700; color: #193b3f; }
.tc-req { color: var(--red); }
.tc-input { width: 100%; padding: 10px 12px; border-radius: 11px; border: 1.5px solid #cbdcdc; background: #fff; color: var(--text); font: 400 .94rem inherit; }
.tc-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(11,85,92,.13); }
.tc-ltr { direction: ltr; text-align: left; }

.tc-chips, .tc-row { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; }
.tc-chip { padding: 8px 13px; border-radius: 999px; border: 1.5px solid #c5dad8; background: #fff; color: #1f4448; font: 700 .83rem inherit; cursor: pointer; }
.tc-chip.active { background: var(--primary); border-color: var(--primary); color: #fff; }

.tc-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 13px; border-radius: 11px; border: 1px solid transparent; font: 700 .86rem inherit; cursor: pointer; text-decoration: none; }
.tc-btn:disabled { opacity: .55; cursor: not-allowed; }
.tc-btn-primary { width: 100%; padding: 13px 18px; background: linear-gradient(135deg, #0b555c 0%, #12706b 100%); color: #fff; font-size: .95rem; }
.tc-btn-soft { background: var(--primary-light); color: var(--primary-dark); border-color: #c3e1df; }
.tc-btn-wa { background: #16a34a; color: #fff; }
.tc-btn-call { background: #0d5c63; color: #fff; }
.tc-btn-warn { background: var(--accent-soft); color: #9a5308; border-color: #f3d2a4; }
.tc-btn-danger { background: var(--red-soft); color: var(--red); border-color: #f4c2c2; }
.tc-btn-ghost { background: #fff; color: var(--muted); border-color: var(--border-strong); }

.tc-item { background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 15px; margin-bottom: 13px; box-shadow: 0 2px 8px rgba(11,56,62,.05); }
.tc-item.own { border: 1.5px solid #0d5c63; background: linear-gradient(180deg, #f5fbfa 0%, #fff 40%); }
.tc-item-top { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 11px; }
.tc-item-foot { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding-top: 11px; border-top: 1px solid #ebf2f2; }
.tc-price { font-size: .9rem; font-weight: 800; color: var(--primary-dark); background: var(--accent-soft); border: 1px solid #f5d8aa; padding: 4px 10px; border-radius: 10px; }
.tc-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 999px; font-size: .75rem; font-weight: 700; }
.b-own { background: #0b555c; color: #fff; }
.b-once { background: var(--sky-soft); color: var(--sky); }
.b-rec { background: var(--violet-soft); color: var(--violet); }
.b-ok { background: var(--green-soft); color: var(--green); }
.b-full { background: var(--red-soft); color: var(--red); }
.b-warn { background: var(--accent-soft); color: #9a5308; }
.b-neu { background: #edf2f2; color: #385154; }

.tc-route { background: var(--soft); border: 1px solid #e4efef; border-radius: 13px; padding: 11px 13px; margin-bottom: 11px; }
.tc-pt { display: flex; align-items: center; gap: 9px; font-size: .95rem; font-weight: 800; }
.tc-dot-s { width: 10px; height: 10px; border-radius: 50%; background: var(--primary); box-shadow: 0 0 0 3px rgba(11,85,92,.18); flex-shrink: 0; }
.tc-dot-e { width: 10px; height: 10px; border-radius: 3px; background: var(--accent); box-shadow: 0 0 0 3px rgba(217,130,43,.2); flex-shrink: 0; }
.tc-line { width: 2px; min-height: 15px; margin: 3px 4px; border-right: 2px dashed #9cc0bc; }
.tc-stops { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; margin: 5px 18px 5px 0; }
.tc-stop { font-size: .75rem; font-weight: 700; color: var(--muted); background: #fff; border: 1px solid #d7e5e4; padding: 2px 8px; border-radius: 999px; }
.tc-meta { display: flex; flex-wrap: wrap; gap: 7px 15px; font-size: .85rem; color: #2f4e52; margin-bottom: 11px; }
.tc-notes { background: #fcfdfd; border-right: 3px solid var(--primary); padding: 8px 11px; border-radius: 8px; font-size: .84rem; color: var(--muted); margin-bottom: 11px; }

.tc-stepper { display: inline-flex; align-items: center; gap: 6px; background: var(--soft); border: 1px solid var(--border-strong); border-radius: 11px; padding: 3px; }
.tc-step { width: 30px; height: 30px; border-radius: 8px; border: none; background: #fff; color: var(--primary-dark); font-weight: 800; font-size: 1rem; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
.tc-step:disabled { opacity: .4; cursor: not-allowed; }

.tc-alert { padding: 12px 14px; border-radius: 12px; font-size: .89rem; line-height: 1.65; margin-bottom: 14px; }
.a-ok { background: var(--green-soft); border: 1px solid #96e0b3; color: #11532b; }
.a-err { background: var(--red-soft); border: 1px solid #f4b8b8; color: #981b1b; }
.a-info { background: var(--primary-light); border: 1px solid #bcdad7; color: var(--primary-dark); }
.tc-code { margin-top: 9px; padding: 10px 12px; border-radius: 10px; background: #fff; border: 1.5px dashed #16a34a; font-family: monospace; font-size: .82rem; direction: ltr; text-align: left; word-break: break-all; }

.tc-empty { text-align: center; padding: 24px 14px; color: var(--muted); }
.tc-skel { height: 110px; border-radius: 15px; margin-bottom: 12px; background: linear-gradient(90deg,#edf3f3 25%,#f6fafa 50%,#edf3f3 75%); background-size: 200% 100%; animation: sh 1.3s infinite linear; }
@keyframes sh { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.tc-modal-bg { position: fixed; inset: 0; z-index: 60; background: rgba(10,32,36,.55); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 14px; }
.tc-modal { width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; background: #fff; border-radius: 18px; padding: 20px 18px; box-shadow: 0 20px 48px rgba(10,32,36,.25); }
.tc-stats-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
.tc-stat-box { background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 12px 8px; text-align: center; }
.tc-stat-box strong { display: block; font-size: 1.3rem; color: var(--primary-dark); }
.tc-stat-box span { font-size: .76rem; color: var(--muted); font-weight: 700; }

@media (min-width: 560px) { .tc-seg-4 { grid-template-columns: repeat(4, 1fr); } }
@media (min-width: 720px) {
  .tc-app { padding-bottom: 40px; }
  .tc-nav { display: flex; }
  .tc-bnav { display: none; }
  .tc-grid-2 { grid-template-columns: 1fr 1fr; }
  .tc-grid-3 { grid-template-columns: repeat(3, 1fr); }
  .tc-tile { flex-direction: column; align-items: flex-start; padding: 19px 17px; }
  .tc-tile-arr { display: none; }
  .tc-hero { padding: 34px 28px; }
  .tc-hero h2 { font-size: 1.68rem; }
}
`;

function Icon({ name, size = 17 }) {
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };
  const map = {
    home: (
      <>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      </>
    ),
    ads: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 9h10M7 13h7M7 17h4" />
      </>
    ),
    car: (
      <>
        <path d="M5 17h14v-5l-2-5H7l-2 5v5ZM5 12h14" />
        <circle cx="7.5" cy="17.5" r="1.5" />
        <circle cx="16.5" cy="17.5" r="1.5" />
      </>
    ),
    hand: (
      <>
        <circle cx="12" cy="7" r="3" />
        <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
      </>
    ),
    shield: <path d="M12 3 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-3Z" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    repeat: (
      <>
        <path d="M17 2l4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3" />
      </>
    ),
    whatsapp: (
      <>
        <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.5L3 20l1.2-5.1A8.5 8.5 0 1 1 21 11.5Z" />
        <path d="M9.5 9.5c.3 1.7 2.3 3.7 4 4" />
      </>
    ),
    phone: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.6a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6.3 6.3l1.3-1.3a2 2 0 0 1 2.1-.5c.8.4 1.7.6 2.6.7a2 2 0 0 1 1.7 2Z" />
    ),
    flag: <path d="M5 21V4m0 0h11l-2 4 2 4H5" />,
    refresh: <path d="M21 12a9 9 0 1 1-2.6-6.4L21 8m0-5v5h-5" />,
    left: <path d="m15 18-6-6 6-6" />,
    copy: (
      <>
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </>
    ),
    edit: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />,
    check: <path d="M20 6 9 17l-5-5" />,
    trash: <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6" />,
    campus: (
      <>
        <path d="M2 10 12 5l10 5-10 5-10-5Z" />
        <path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
      </>
    ),
  };
  return <svg {...p}>{map[name] || null}</svg>;
}

const isRecurring = (t) => t === 'daily' || t === 'weekdays';

function loadList(key) {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveList(key, list) {
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

function generateUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function normalizeSudan(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('00249')) d = d.slice(2);
  else if (d.startsWith('0')) d = '249' + d.slice(1);
  else if (d.length === 9 && d.startsWith('9')) d = '249' + d;
  return d;
}

const waLink = (phone, msg) => {
  const n = normalizeSudan(phone);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(msg || '')}` : '';
};

const telLink = (phone) => {
  const n = normalizeSudan(phone);
  return n ? `tel:+${n}` : '';
};

function fmtDateTime(iso) {
  if (!iso) return 'غير محدد';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return d.toLocaleString('ar-SD', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return d.toLocaleString('ar-EG', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

function fmtTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return d.toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  }
}

function toInputDateTime(val) {
  const d = val instanceof Date ? val : new Date(val);
  const safe = Number.isNaN(d.getTime()) ? new Date(Date.now() + 3600000) : d;
  const pad = (n) => String(n).padStart(2, '0');
  return `${safe.getFullYear()}-${pad(safe.getMonth() + 1)}-${pad(safe.getDate())}T${pad(
    safe.getHours()
  )}:${pad(safe.getMinutes())}`;
}

function fmtRec(type, days) {
  if (type === 'daily') return 'يومياً';
  if (type === 'weekdays') {
    const m = Object.fromEntries(WEEKDAYS.map((w) => [w.key, w.label]));
    return `أيام: ${Array.isArray(days) && days.length ? days.map((k) => m[k] || k).join('، ') : 'محددة'}`;
  }
  return 'مرة واحدة';
}

function sortKey(iso, recType) {
  const base = new Date(iso).getTime();
  if (Number.isNaN(base)) return Number.MAX_SAFE_INTEGER;
  const now = Date.now();
  if (!isRecurring(recType) || base >= now) return base;
  const o = new Date(base);
  const c = new Date(now);
  c.setHours(o.getHours(), o.getMinutes(), 0, 0);
  if (c.getTime() < now) c.setDate(c.getDate() + 1);
  return c.getTime();
}

function parseCode(raw) {
  const s = String(raw || '').trim();
  const i = s.indexOf('_');
  if (i === -1) return null;
  const itemId = s.slice(0, i).trim();
  const manageToken = s.slice(i + 1).trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId) || !manageToken) {
    return null;
  }
  return { itemId, manageToken };
}

function AreaInput({ label, value, onChange, placeholder }) {
  const [custom, setCustom] = useState(Boolean(value) && !POPULAR_AREAS.includes(value));

  useEffect(() => {
    if (value && !POPULAR_AREAS.includes(value)) setCustom(true);
    else if (POPULAR_AREAS.includes(value)) setCustom(false);
  }, [value]);

  return (
    <div className="tc-field">
      <label className="tc-label">
        {label} <span className="tc-req">*</span>
      </label>
      <select
        className="tc-input"
        value={custom ? '__custom__' : value}
        onChange={(e) => {
          if (e.target.value === '__custom__') {
            setCustom(true);
            onChange('');
          } else {
            setCustom(false);
            onChange(e.target.value);
          }
        }}
      >
        <option value="">-- اختر مجمعاً أو منطقة أو موقعاً مخصصاً --</option>
        {POPULAR_AREAS.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
        <option value="__custom__">موقع آخر (كتابة يدوية)...</option>
      </select>
      {custom && (
        <input
          type="text"
          className="tc-input"
          style={{ marginTop: 8 }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'اكتب اسم المنطقة أو البوابة أو الداخلية'}
          required
        />
      )}
    </div>
  );
}

function RouteBox({ start, dest, stops = [] }) {
  return (
    <div className="tc-route">
      <div className="tc-pt">
        <span className="tc-dot-s" />
        <span>{start}</span>
      </div>
      <div className="tc-line" />
      {Array.isArray(stops) && stops.length > 0 && (
        <div className="tc-stops">
          <span style={{ fontSize: '.74rem', color: '#526b6e', fontWeight: 700 }}>يمر بـ:</span>
          {stops.map((st, idx) => (
            <span key={`${st}-${idx}`} className="tc-stop">
              {st}
            </span>
          ))}
        </div>
      )}
      <div className="tc-pt">
        <span className="tc-dot-e" />
        <span>{dest}</span>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState(TABS.HOME);
  const [section, setSection] = useState('all'); // 'all' | 'offers' | 'requests' | 'mine'

  const [offers, setOffers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [boardErr, setBoardErr] = useState('');
  const [qStart, setQStart] = useState('');
  const [qDest, setQDest] = useState('');
  const [qKind, setQKind] = useState('all');

  const [myOffers, setMyOffers] = useState(() => loadList(MY_OFFERS_KEY));
  const [myRequests, setMyRequests] = useState(() => loadList(MY_REQUESTS_KEY));
  const [busyId, setBusyId] = useState('');
  const [ownerMsg, setOwnerMsg] = useState({ type: '', text: '' });
  const [copiedId, setCopiedId] = useState('');

  const [editModal, setEditModal] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState('');

  const [manualKind, setManualKind] = useState('offer');
  const [manualCode, setManualCode] = useState('');
  const [manualSeats, setManualSeats] = useState(1);
  const [manualBusy, setManualBusy] = useState(false);
  const [manualMsg, setManualMsg] = useState({ type: '', text: '' });

  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportBusy, setReportBusy] = useState(false);
  const [reportMsg, setReportMsg] = useState({ type: '', text: '' });

  const defaultTime = useMemo(() => toInputDateTime(new Date(Date.now() + 3600000)), []);

  const [offerForm, setOfferForm] = useState({
    driver_name: '',
    whatsapp_number: '',
    phone_number: '',
    vehicle_type: '',
    start_area: '',
    destination_area: '',
    stops_text: '',
    departure_time: defaultTime,
    recurrence_type: 'once',
    recurrence_days: [],
    total_seats: 4,
    available_seats: 3,
    price_per_seat: 0,
    exp_hours: 3,
    rec_days: 14,
  });
  const [offerBusy, setOfferBusy] = useState(false);
  const [offerErr, setOfferErr] = useState('');
  const [savedOfferCode, setSavedOfferCode] = useState('');

  const [reqForm, setReqForm] = useState({
    passenger_name: '',
    whatsapp_number: '',
    phone_number: '',
    start_area: '',
    destination_area: '',
    preferred_time: defaultTime,
    recurrence_type: 'once',
    recurrence_days: [],
    seats_needed: 1,
    notes: '',
    exp_hours: 3,
    rec_days: 14,
  });
  const [reqBusy, setReqBusy] = useState(false);
  const [reqErr, setReqErr] = useState('');
  const [savedReqCode, setSavedReqCode] = useState('');

  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginErr, setLoginErr] = useState('');
  const [adminReports, setAdminReports] = useState([]);
  const [adminOffers, setAdminOffers] = useState([]);
  const [adminRequests, setAdminRequests] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMsg, setAdminMsg] = useState({ type: '', text: '' });

  const setAndSaveOffers = (fn) =>
    setMyOffers((prev) => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      saveList(MY_OFFERS_KEY, next);
      return next;
    });

  const setAndSaveRequests = (fn) =>
    setMyRequests((prev) => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      saveList(MY_REQUESTS_KEY, next);
      return next;
    });

  const myOffersMap = useMemo(() => Object.fromEntries(myOffers.map((x) => [x.id, x])), [myOffers]);
  const myRequestsMap = useMemo(() => Object.fromEntries(myRequests.map((x) => [x.id, x])), [myRequests]);

  const fetchBoard = async () => {
    if (!supabase) {
      setBoardErr('متغيرات البيئة غير مضبوطة (VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY).');
      return;
    }
    setLoadingBoard(true);
    setBoardErr('');
    try {
      const nowIso = new Date().toISOString();
      const [oRes, rRes] = await Promise.all([
        supabase
          .from('ride_offers')
          .select(OFFER_COLS)
          .gt('expires_at', nowIso)
          .in('status', ['active', 'full'])
          .order('departure_time', { ascending: true })
          .order('created_at', { ascending: false }),
        supabase
          .from('ride_requests')
          .select(REQUEST_COLS)
          .gt('expires_at', nowIso)
          .eq('status', 'active')
          .order('preferred_time', { ascending: true })
          .order('created_at', { ascending: false }),
      ]);
      if (oRes.error) throw oRes.error;
      if (rRes.error) throw rRes.error;

      const liveO = oRes.data || [];
      const liveR = rRes.data || [];
      setOffers(liveO);
      setRequests(liveR);

      if (liveO.length) {
        const m = Object.fromEntries(liveO.map((o) => [o.id, o]));
        setAndSaveOffers((prev) =>
          prev.map((x) => (m[x.id] ? { ...x, ...m[x.id] } : x))
        );
      }
      if (liveR.length) {
        const m = Object.fromEntries(liveR.map((r) => [r.id, r]));
        setAndSaveRequests((prev) =>
          prev.map((x) => (m[x.id] ? { ...x, ...m[x.id] } : x))
        );
      }
    } catch (err) {
      setBoardErr(err?.message || 'تعذر تحميل الإعلانات حالياً.');
    } finally {
      setLoadingBoard(false);
    }
  };

  const checkAdmin = async (s) => {
    if (!supabase || !s?.user?.id) {
      setIsAdmin(false);
      return;
    }
    setCheckingAdmin(true);
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', s.user.id)
        .maybeSingle();
      if (error) throw error;
      setIsAdmin(Boolean(data?.user_id));
    } catch {
      setIsAdmin(false);
    } finally {
      setCheckingAdmin(false);
    }
  };

  const fetchAdmin = async () => {
    if (!supabase || !isAdmin) return;
    setAdminLoading(true);
    try {
      const [rep, off, req] = await Promise.all([
        supabase
          .from('reports')
          .select('id, target_type, offer_id, request_id, reason, details, status, created_at')
          .order('created_at', { ascending: false }),
        supabase.from('ride_offers').select(OFFER_COLS).order('created_at', { ascending: false }),
        supabase.from('ride_requests').select(REQUEST_COLS).order('created_at', { ascending: false }),
      ]);
      if (rep.error) throw rep.error;
      if (off.error) throw off.error;
      if (req.error) throw req.error;
      setAdminReports(rep.data || []);
      setAdminOffers(off.data || []);
      setAdminRequests(req.data || []);
    } catch (err) {
      setAdminMsg({ type: 'err', text: err?.message || 'تعذر تحميل لوحة الإدارة.' });
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      const cur = data?.session || null;
      setSession(cur);
      checkAdmin(cur);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, next) => {
      setSession(next);
      checkAdmin(next);
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (tab === TABS.HOME || tab === TABS.ADS) fetchBoard();
  }, [tab]);

  useEffect(() => {
    if (tab === TABS.ADMIN && session && isAdmin) fetchAdmin();
  }, [tab, session, isAdmin]);

  const filteredOffers = useMemo(() => {
    const s = qStart.trim().toLowerCase();
    const d = qDest.trim().toLowerCase();
    const now = Date.now();
    return offers
      .filter((o) => new Date(o.expires_at).getTime() > now && (o.status === 'active' || o.status === 'full'))
      .filter((o) => (qKind === 'once' ? !isRecurring(o.recurrence_type) : qKind === 'recurring' ? isRecurring(o.recurrence_type) : true))
      .filter((o) => {
        const stops = (o.intermediate_stops || []).join(' ');
        return (
          (!s || `${o.start_area} ${stops}`.toLowerCase().includes(s)) &&
          (!d || `${o.destination_area} ${stops}`.toLowerCase().includes(d))
        );
      })
      .sort((a, b) => sortKey(a.departure_time, a.recurrence_type) - sortKey(b.departure_time, b.recurrence_type) || new Date(b.created_at) - new Date(a.created_at));
  }, [offers, qStart, qDest, qKind]);

  const filteredRequests = useMemo(() => {
    const s = qStart.trim().toLowerCase();
    const d = qDest.trim().toLowerCase();
    const now = Date.now();
    return requests
      .filter((r) => new Date(r.expires_at).getTime() > now && r.status === 'active')
      .filter((r) => (qKind === 'once' ? !isRecurring(r.recurrence_type) : qKind === 'recurring' ? isRecurring(r.recurrence_type) : true))
      .filter((r) => (!s || (r.start_area || '').toLowerCase().includes(s)) && (!d || (r.destination_area || '').toLowerCase().includes(d)))
      .sort((a, b) => sortKey(a.preferred_time, a.recurrence_type) - sortKey(b.preferred_time, b.recurrence_type) || new Date(b.created_at) - new Date(a.created_at));
  }, [requests, qStart, qDest, qKind]);

  const totalLiveAds = filteredOffers.length + filteredRequests.length;
  const totalMyAds = myOffers.length + myRequests.length;
  const adminOffersMap = useMemo(() => Object.fromEntries(adminOffers.map((o) => [o.id, o])), [adminOffers]);
  const adminRequestsMap = useMemo(() => Object.fromEntries(adminRequests.map((r) => [r.id, r])), [adminRequests]);

  const openTab = (t) => {
    setTab(t);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAds = (sec = 'all') => {
    setSection(sec);
    openTab(TABS.ADS);
  };

  const copyText = async (txt, id) => {
    if (!txt) return;
    try {
      await navigator.clipboard.writeText(txt);
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 2000);
    } catch {
      setCopiedId('');
    }
  };

  // ==================== نشر عرض سائق ====================
  const publishOffer = async (e) => {
    e.preventDefault();
    setOfferErr('');
    setSavedOfferCode('');
    if (!supabase) return setOfferErr('إعدادات قاعدة البيانات غير مكتملة.');

    const name = offerForm.driver_name.trim();
    const wa = offerForm.whatsapp_number.trim();
    const phone = offerForm.phone_number.trim();
    const vehicle = offerForm.vehicle_type.trim();
    const startA = offerForm.start_area.trim();
    const destA = offerForm.destination_area.trim();
    const total = parseInt(offerForm.total_seats, 10);
    const avail = parseInt(offerForm.available_seats, 10);
    const price = Number(offerForm.price_per_seat);
    const dep = new Date(offerForm.departure_time);
    const rec = isRecurring(offerForm.recurrence_type);

    if (name.length < 2 || vehicle.length < 2 || startA.length < 2 || destA.length < 2) {
      return setOfferErr('يرجى التأكد من ملء الاسم ونوع العربة والانطلاق والوجهة.');
    }
    if (wa.length < 7) return setOfferErr('يرجى إدخال رقم واتساب صحيح (7 أرقام على الأقل).');
    if (Number.isNaN(dep.getTime()) || dep.getTime() <= Date.now()) {
      return setOfferErr('يجب أن يكون موعد التحرك في المستقبل.');
    }
    if (Number.isNaN(total) || total < 1 || total > 50 || Number.isNaN(avail) || avail < 0 || avail > total) {
      return setOfferErr('تحقق من عدد المقاعد الإجمالي والمتاح.');
    }
    if (Number.isNaN(price) || price < 0) return setOfferErr('السعر يجب أن يكون صفراً أو أكبر.');
    if (offerForm.recurrence_type === 'weekdays' && offerForm.recurrence_days.length === 0) {
      return setOfferErr('اختر يوماً واحداً على الأقل للترحيل الأسبوعي.');
    }

    const stops = offerForm.stops_text.split(/[,،\n]+/).map((s) => s.trim()).filter(Boolean);
    const exp = new Date(
      dep.getTime() + (rec ? Math.max(1, Number(offerForm.rec_days) || 14) * 86400000 : Math.max(1, Number(offerForm.exp_hours) || 3) * 3600000)
    );
    const id = generateUuid();
    const token = generateUuid();

    const payload = {
      id,
      driver_name: name,
      whatsapp_number: wa,
      phone_number: phone || null,
      vehicle_type: vehicle,
      start_area: startA,
      destination_area: destA,
      intermediate_stops: stops,
      departure_time: dep.toISOString(),
      recurrence_type: offerForm.recurrence_type,
      recurrence_days: offerForm.recurrence_type === 'weekdays' ? offerForm.recurrence_days : [],
      recurrence_group_id: rec ? generateUuid() : null,
      total_seats: total,
      available_seats: avail,
      price_per_seat: price,
      status: 'active',
      expires_at: exp.toISOString(),
      manage_token: token,
    };

    setOfferBusy(true);
    try {
      const { error } = await supabase.from('ride_offers').insert(payload);
      if (error) throw error;
      const code = `${id}_${token}`;
      setSavedOfferCode(code);
      setAndSaveOffers((prev) => [
        { ...payload, manageToken: token, manageCode: code, status: avail === 0 ? 'full' : 'active', created_at: new Date().toISOString() },
        ...prev,
      ]);
      setOfferForm({
        driver_name: '',
        whatsapp_number: '',
        phone_number: '',
        vehicle_type: '',
        start_area: '',
        destination_area: '',
        stops_text: '',
        departure_time: toInputDateTime(new Date(Date.now() + 3600000)),
        recurrence_type: 'once',
        recurrence_days: [],
        total_seats: 4,
        available_seats: 3,
        price_per_seat: 0,
        exp_hours: 3,
        rec_days: 14,
      });
    } catch (err) {
      setOfferErr(err?.message || 'حدث خطأ أثناء نشر العرض.');
    } finally {
      setOfferBusy(false);
    }
  };

  // ==================== نشر طلب طالب ====================
  const publishRequest = async (e) => {
    e.preventDefault();
    setReqErr('');
    setSavedReqCode('');
    if (!supabase) return setReqErr('إعدادات قاعدة البيانات غير مكتملة.');

    const name = reqForm.passenger_name.trim();
    const wa = reqForm.whatsapp_number.trim();
    const phone = reqForm.phone_number.trim();
    const startA = reqForm.start_area.trim();
    const destA = reqForm.destination_area.trim();
    const seats = parseInt(reqForm.seats_needed, 10);
    const notes = reqForm.notes.trim();
    const pref = new Date(reqForm.preferred_time);
    const rec = isRecurring(reqForm.recurrence_type);

    if (name.length < 2 || startA.length < 2 || destA.length < 2) {
      return setReqErr('يرجى إدخال الاسم ومنطقة الانطلاق والوجهة.');
    }
    if (wa.length < 7) return setReqErr('يرجى إدخال رقم واتساب صحيح (7 أرقام على الأقل).');
    if (Number.isNaN(pref.getTime()) || pref.getTime() <= Date.now()) {
      return setReqErr('يجب أن يكون وقت التحرك في المستقبل.');
    }
    if (Number.isNaN(seats) || seats < 1 || seats > 20) return setReqErr('عدد المقاعد بين 1 و 20.');
    if (reqForm.recurrence_type === 'weekdays' && reqForm.recurrence_days.length === 0) {
      return setReqErr('اختر يوماً واحداً على الأقل لطلب الترحيل الأسبوعي.');
    }

    const exp = new Date(
      pref.getTime() + (rec ? Math.max(1, Number(reqForm.rec_days) || 14) * 86400000 : Math.max(1, Number(reqForm.exp_hours) || 3) * 3600000)
    );
    const id = generateUuid();
    const token = generateUuid();

    const payload = {
      id,
      passenger_name: name,
      whatsapp_number: wa,
      phone_number: phone || null,
      start_area: startA,
      destination_area: destA,
      preferred_time: pref.toISOString(),
      recurrence_type: reqForm.recurrence_type,
      recurrence_days: reqForm.recurrence_type === 'weekdays' ? reqForm.recurrence_days : [],
      seats_needed: seats,
      notes: notes || null,
      status: 'active',
      expires_at: exp.toISOString(),
      manage_token: token,
    };

    setReqBusy(true);
    try {
      const { error } = await supabase.from('ride_requests').insert(payload);
      if (error) throw error;
      const code = `${id}_${token}`;
      setSavedReqCode(code);
      setAndSaveRequests((prev) => [
        { ...payload, manageToken: token, manageCode: code, notes, created_at: new Date().toISOString() },
        ...prev,
      ]);
      setReqForm({
        passenger_name: '',
        whatsapp_number: '',
        phone_number: '',
        start_area: '',
        destination_area: '',
        preferred_time: toInputDateTime(new Date(Date.now() + 3600000)),
        recurrence_type: 'once',
        recurrence_days: [],
        seats_needed: 1,
        notes: '',
        exp_hours: 3,
        rec_days: 14,
      });
    } catch (err) {
      setReqErr(err?.message || 'حدث خطأ أثناء نشر الطلب.');
    } finally {
      setReqBusy(false);
    }
  };

  // ==================== إدارة إعلاناتي (عروض وطلبات) ====================
  const manageOwnOffer = async (item, nextSeats, nextStatus) => {
    if (!supabase || !item) return;
    if (nextStatus === 'closed' && !window.confirm('هل تريد إغلاق هذا العرض؟ سيختفي من قائمة الإعلانات.')) return;
    const total = Math.max(1, Number(item.total_seats) || 1);
    const seats = nextStatus === 'full' || nextStatus === 'closed' ? 0 : Math.max(0, Math.min(total, Number(nextSeats) || 0));
    const status = nextStatus === 'closed' ? 'closed' : seats === 0 || nextStatus === 'full' ? 'full' : 'active';

    setOwnerMsg({ type: '', text: '' });
    setBusyId(item.id);
    try {
      const { data, error } = await supabase.rpc('driver_manage_offer', {
        p_offer_id: item.id,
        p_manage_token: item.manageToken,
        p_available_seats: seats,
        p_status: status,
      });
      if (error) throw error;
      if (!data) return setOwnerMsg({ type: 'err', text: 'تعذر التحديث؛ ربما حُذف الإعلان سابقاً.' });

      setAndSaveOffers((prev) => prev.map((x) => (x.id === item.id ? { ...x, available_seats: seats, status } : x)));
      setOwnerMsg({
        type: 'ok',
        text: status === 'closed' ? 'تم إغلاق عرضك بنجاح.' : status === 'full' ? 'تم تعليم الرحلة كمكتملة.' : `تم تحديث المقاعد إلى ${seats} من ${total}.`,
      });
      fetchBoard();
    } catch (err) {
      setOwnerMsg({ type: 'err', text: err?.message || 'حدث خطأ أثناء التحديث.' });
    } finally {
      setBusyId('');
    }
  };

  const deleteOwnOffer = async (item) => {
    if (!supabase || !item) return;
    if (!window.confirm('هل أنت متأكد من حذف عرضك نهائياً من الموقع؟')) return;
    setOwnerMsg({ type: '', text: '' });
    setBusyId(item.id);
    try {
      const { data, error } = await supabase.rpc('driver_delete_offer', {
        p_offer_id: item.id,
        p_manage_token: item.manageToken,
      });
      if (error) throw error;
      setAndSaveOffers((prev) => prev.filter((x) => x.id !== item.id));
      setOwnerMsg({ type: 'ok', text: data ? 'تم حذف عرضك نهائياً.' : 'أُزيلت البطاقة من جهازك.' });
      fetchBoard();
    } catch (err) {
      setOwnerMsg({ type: 'err', text: err?.message || 'تعذر حذف العرض.' });
    } finally {
      setBusyId('');
    }
  };

  const manageOwnRequest = async (req, nextStatus) => {
    if (!supabase || !req) return;
    if (nextStatus === 'closed' && !window.confirm('هل تريد إغلاق طلبك (لقيت توصيلة)؟')) return;
    setOwnerMsg({ type: '', text: '' });
    setBusyId(req.id);
    try {
      const { data, error } = await supabase.rpc('passenger_manage_request', {
        p_request_id: req.id,
        p_manage_token: req.manageToken,
        p_status: nextStatus,
      });
      if (error) throw error;
      if (!data) return setOwnerMsg({ type: 'err', text: 'تعذر تحديث الطلب؛ ربما حُذف سابقاً.' });

      setAndSaveRequests((prev) => prev.map((x) => (x.id === req.id ? { ...x, status: nextStatus } : x)));
      setOwnerMsg({
        type: 'ok',
        text: nextStatus === 'closed' ? 'تم إغلاق طلبك (لقيت توصيلة) ولن يظهر في الإعلانات.' : 'تمت إعادة تفعيل طلبك بنجاح.',
      });
      fetchBoard();
    } catch (err) {
      setOwnerMsg({ type: 'err', text: err?.message || 'حدث خطأ أثناء تحديث الطلب.' });
    } finally {
      setBusyId('');
    }
  };

  const deleteOwnRequest = async (req) => {
    if (!supabase || !req) return;
    if (!window.confirm('هل أنت متأكد من حذف طلبك نهائياً من الموقع؟')) return;
    setOwnerMsg({ type: '', text: '' });
    setBusyId(req.id);
    try {
      const { data, error } = await supabase.rpc('passenger_delete_request', {
        p_request_id: req.id,
        p_manage_token: req.manageToken,
      });
      if (error) throw error;
      setAndSaveRequests((prev) => prev.filter((x) => x.id !== req.id));
      setOwnerMsg({ type: 'ok', text: data ? 'تم حذف طلبك نهائياً.' : 'أُزيلت البطاقة من جهازك.' });
      fetchBoard();
    } catch (err) {
      setOwnerMsg({ type: 'err', text: err?.message || 'تعذر حذف الطلب.' });
    } finally {
      setBusyId('');
    }
  };

  const openEditOffer = (own, live) => {
    const s = live || own;
    setEditErr('');
    setEditModal({
      kind: 'offer',
      id: own.id,
      manageToken: own.manageToken,
      recurrence_type: s.recurrence_type || 'once',
      vehicle_type: s.vehicle_type || '',
      start_area: s.start_area || '',
      destination_area: s.destination_area || '',
      stops_text: Array.isArray(s.intermediate_stops) ? s.intermediate_stops.join('، ') : '',
      departure_time: toInputDateTime(s.departure_time),
      total_seats: Number(s.total_seats) || 4,
      available_seats: Number(s.available_seats) || 0,
      price_per_seat: Number(s.price_per_seat) || 0,
    });
  };

  const openEditRequest = (own, live) => {
    const s = live || own;
    setEditErr('');
    setEditModal({
      kind: 'request',
      id: own.id,
      manageToken: own.manageToken,
      recurrence_type: s.recurrence_type || 'once',
      start_area: s.start_area || '',
      destination_area: s.destination_area || '',
      preferred_time: toInputDateTime(s.preferred_time),
      seats_needed: Number(s.seats_needed) || 1,
      notes: s.notes || '',
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!supabase || !editModal) return;
    setEditErr('');
    const rec = isRecurring(editModal.recurrence_type);

    if (editModal.kind === 'offer') {
      const v = editModal.vehicle_type.trim();
      const sa = editModal.start_area.trim();
      const da = editModal.destination_area.trim();
      const tot = parseInt(editModal.total_seats, 10);
      const av = parseInt(editModal.available_seats, 10);
      const pr = Number(editModal.price_per_seat);
      const dep = new Date(editModal.departure_time);
      if (v.length < 2 || sa.length < 2 || da.length < 2 || Number.isNaN(dep.getTime())) {
        return setEditErr('يرجى التأكد من صحة البيانات والموعد.');
      }
      if (tot < 1 || tot > 50 || av < 0 || av > tot || pr < 0) {
        return setEditErr('تحقق من قيم المقاعد والسعر.');
      }
      const stops = editModal.stops_text.split(/[,،\n]+/).map((x) => x.trim()).filter(Boolean);
      const expIso = new Date(Math.max(dep.getTime() + (rec ? 14 * 86400000 : 3 * 3600000), Date.now() + 7200000)).toISOString();

      setEditSaving(true);
      try {
        const { data, error } = await supabase.rpc('driver_update_offer', {
          p_offer_id: editModal.id,
          p_manage_token: editModal.manageToken,
          p_vehicle_type: v,
          p_start_area: sa,
          p_destination_area: da,
          p_intermediate_stops: stops,
          p_departure_time: dep.toISOString(),
          p_total_seats: tot,
          p_available_seats: av,
          p_price_per_seat: pr,
          p_expires_at: expIso,
        });
        if (error) throw error;
        if (!data) return setEditErr('تعذر حفظ التعديلات.');
        setAndSaveOffers((prev) =>
          prev.map((x) =>
            x.id === editModal.id
              ? { ...x, vehicle_type: v, start_area: sa, destination_area: da, intermediate_stops: stops, departure_time: dep.toISOString(), total_seats: tot, available_seats: av, price_per_seat: pr, status: av === 0 ? 'full' : 'active', expires_at: expIso }
              : x
          )
        );
        setOwnerMsg({ type: 'ok', text: 'تم تحديث عرضك بنجاح.' });
        setEditModal(null);
        fetchBoard();
      } catch (err) {
        setEditErr(err?.message || 'حدث خطأ أثناء الحفظ.');
      } finally {
        setEditSaving(false);
      }
      return;
    }

    const sa = editModal.start_area.trim();
    const da = editModal.destination_area.trim();
    const seats = parseInt(editModal.seats_needed, 10);
    const notes = editModal.notes.trim();
    const pref = new Date(editModal.preferred_time);
    if (sa.length < 2 || da.length < 2 || Number.isNaN(pref.getTime()) || seats < 1 || seats > 20) {
      return setEditErr('يرجى التأكد من صحة البيانات والموعد والمقاعد.');
    }
    const expIso = new Date(Math.max(pref.getTime() + (rec ? 14 * 86400000 : 3 * 3600000), Date.now() + 7200000)).toISOString();

    setEditSaving(true);
    try {
      const { data, error } = await supabase.rpc('passenger_update_request', {
        p_request_id: editModal.id,
        p_manage_token: editModal.manageToken,
        p_start_area: sa,
        p_destination_area: da,
        p_preferred_time: pref.toISOString(),
        p_seats_needed: seats,
        p_notes: notes || null,
        p_expires_at: expIso,
      });
      if (error) throw error;
      if (!data) return setEditErr('تعذر حفظ التعديلات.');
      setAndSaveRequests((prev) =>
        prev.map((x) =>
          x.id === editModal.id
            ? { ...x, start_area: sa, destination_area: da, preferred_time: pref.toISOString(), seats_needed: seats, notes, status: 'active', expires_at: expIso }
            : x
        )
      );
      setOwnerMsg({ type: 'ok', text: 'تم تحديث طلبك بنجاح.' });
      setEditModal(null);
      fetchBoard();
    } catch (err) {
      setEditErr(err?.message || 'حدث خطأ أثناء الحفظ.');
    } finally {
      setEditSaving(false);
    }
  };

  const runManual = async (action) => {
    setManualMsg({ type: '', text: '' });
    const parsed = parseCode(manualCode);
    if (!parsed) return setManualMsg({ type: 'err', text: 'صيغة الرمز غير صحيحة (يجب أن يحتوي على الشرطة السفلية _).' });
    if (action === 'delete' && !window.confirm('هل أنت متأكد من الحذف النهائي؟')) return;

    setManualBusy(true);
    try {
      let ok = false;
      if (manualKind === 'offer') {
        if (action === 'delete') {
          const { data, error } = await supabase.rpc('driver_delete_offer', { p_offer_id: parsed.itemId, p_manage_token: parsed.manageToken });
          if (error) throw error;
          ok = Boolean(data);
          if (ok) setAndSaveOffers((p) => p.filter((x) => x.id !== parsed.itemId));
        } else {
          const { data, error } = await supabase.rpc('driver_manage_offer', {
            p_offer_id: parsed.itemId,
            p_manage_token: parsed.manageToken,
            p_available_seats: action === 'active' ? Math.max(0, parseInt(manualSeats, 10) || 0) : 0,
            p_status: action,
          });
          if (error) throw error;
          ok = Boolean(data);
        }
      } else if (action === 'delete') {
        const { data, error } = await supabase.rpc('passenger_delete_request', { p_request_id: parsed.itemId, p_manage_token: parsed.manageToken });
        if (error) throw error;
        ok = Boolean(data);
        if (ok) setAndSaveRequests((p) => p.filter((x) => x.id !== parsed.itemId));
      } else {
        const { data, error } = await supabase.rpc('passenger_manage_request', { p_request_id: parsed.itemId, p_manage_token: parsed.manageToken, p_status: 'closed' });
        if (error) throw error;
        ok = Boolean(data);
      }
      if (!ok) return setManualMsg({ type: 'err', text: 'الرمز غير صحيح أو الإعلان غير موجود.' });
      setManualMsg({ type: 'ok', text: 'تم تنفيذ الإجراء بنجاح.' });
      fetchBoard();
    } catch (err) {
      setManualMsg({ type: 'err', text: err?.message || 'حدث خطأ.' });
    } finally {
      setManualBusy(false);
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!supabase || !reportTarget) return;
    if (reportReason.trim().length < 2) return setReportMsg({ type: 'err', text: 'اكتب سبب البلاغ (حرفان على الأقل).' });
    setReportBusy(true);
    try {
      const { error } = await supabase.from('reports').insert({
        target_type: reportTarget.type,
        offer_id: reportTarget.type === 'offer' ? reportTarget.id : null,
        request_id: reportTarget.type === 'request' ? reportTarget.id : null,
        reason: reportReason.trim(),
        details: reportDetails.trim() || null,
        status: 'pending',
      });
      if (error) throw error;
      setReportMsg({ type: 'ok', text: 'تم إرسال البلاغ بنجاح وسيراجعه المشرف.' });
      setReportTarget(null);
      setReportReason('');
      setReportDetails('');
    } catch (err) {
      setReportMsg({ type: 'err', text: err?.message || 'تعذر إرسال البلاغ.' });
    } finally {
      setReportBusy(false);
    }
  };

  const adminLogin = async (e) => {
    e.preventDefault();
    setLoginErr('');
    setLoginBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      setPassword('');
    } catch (err) {
      setLoginErr(err?.message || 'بيانات الدخول غير صحيحة.');
    } finally {
      setLoginBusy(false);
    }
  };

  const adminLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setAdminReports([]);
    setAdminOffers([]);
    setAdminRequests([]);
  };

  const updateReportStatus = async (id, status) => {
    const { error } = await supabase.from('reports').update({ status }).eq('id', id);
    if (error) setAdminMsg({ type: 'err', text: error.message });
    else {
      setAdminMsg({ type: 'ok', text: 'تم تحديث حالة البلاغ.' });
      fetchAdmin();
    }
  };

  const adminDelete = async (type, id) => {
    if (!id || !window.confirm('حذف هذا الإعلان نهائياً؟')) return;
    const { error } = await supabase.from(type === 'offer' ? 'ride_offers' : 'ride_requests').delete().eq('id', id);
    if (error) setAdminMsg({ type: 'err', text: error.message });
    else {
      setAdminMsg({ type: 'ok', text: 'تم الحذف بنجاح.' });
      fetchAdmin();
      fetchBoard();
    }
  };

  const deleteExpired = async () => {
    const { data, error } = await supabase.rpc('admin_delete_expired_ads');
    if (error) setAdminMsg({ type: 'err', text: error.message });
    else {
      setAdminMsg({ type: 'ok', text: `تم حذف ${data?.deleted_offers ?? 0} عرض و ${data?.deleted_requests ?? 0} طلب منتهي.` });
      fetchAdmin();
      fetchBoard();
    }
  };

  return (
    <div className="tc-app">
      <style>{APP_CSS}</style>

      <header className="tc-header">
        <div className="tc-header-in">
          <div className="tc-brand" onClick={() => openTab(TABS.HOME)}>
            <div className="tc-logo"><Icon name="campus" size={22} /></div>
            <div>
              <h1>توصيلة السنتر</h1>
              <p>مواصلات طلاب جامعة الخرطوم • توصيلة وترحيل</p>
            </div>
          </div>

          <nav className="tc-nav">
            <button type="button" className={`tc-nav-btn ${tab === TABS.HOME ? 'active' : ''}`} onClick={() => openTab(TABS.HOME)}>
              <Icon name="home" size={16} /> الرئيسية
            </button>
            <button type="button" className={`tc-nav-btn ${tab === TABS.ADS ? 'active' : ''}`} onClick={() => openAds('all')}>
              <Icon name="ads" size={16} /> الإعلانات ({totalLiveAds})
            </button>
            <button type="button" className={`tc-nav-btn ${tab === TABS.OFFER ? 'active' : ''}`} onClick={() => openTab(TABS.OFFER)}>
              <Icon name="car" size={16} /> أعرض مشواراً
            </button>
            <button type="button" className={`tc-nav-btn ${tab === TABS.REQUEST ? 'active' : ''}`} onClick={() => openTab(TABS.REQUEST)}>
              <Icon name="hand" size={16} /> اطلب توصيلة
            </button>
            <button type="button" className={`tc-nav-btn ${tab === TABS.ADMIN ? 'active' : ''}`} onClick={() => openTab(TABS.ADMIN)}>
              <Icon name="shield" size={16} /> الإدارة
            </button>
          </nav>

          <button type="button" className="tc-live-btn" onClick={() => openAds('all')}>
            <span className="tc-dot-live" />
            <span>{totalLiveAds} متاح</span>
          </button>
        </div>
      </header>

      <main className="tc-main">
        {!supabase && (
          <div className="tc-alert a-err">
            تنبيه: متغيرات <code>VITE_SUPABASE_URL</code> و <code>VITE_SUPABASE_ANON_KEY</code> غير مضبوطة.
          </div>
        )}

        {/* ==================== الرئيسية ==================== */}
        {tab === TABS.HOME && (
          <>
            <section className="tc-hero">
              <div className="tc-kicker"><Icon name="campus" size={15} /> مبادرة طلابية لطلاب جامعة الخرطوم</div>
              <h2>مشوارك لجامعة الخرطوم أسهل وأوفر مع زملائك</h2>
              <p>
                منصة مجانية تربط طلاب جامعة الخرطوم أصحاب العربات بزملائهم على نفس المسار
                لمجمعات الوسط وشمبات والطب والتربية — سواء لـ <strong>توصيلة سريعة</strong> أو{' '}
                <strong>ترحيل منتظم</strong> بدون إنشاء حساب.
              </p>
              <div className="tc-row">
                <button type="button" className="tc-stat-btn" onClick={() => openAds('offers')}>
                  <Icon name="car" size={16} /> {filteredOffers.length} عرض سائق متاح <Icon name="left" size={14} />
                </button>
                <button type="button" className="tc-stat-btn" onClick={() => openAds('requests')}>
                  <Icon name="hand" size={16} /> {filteredRequests.length} طلب طالب نشط <Icon name="left" size={14} />
                </button>
              </div>
            </section>

            {totalMyAds > 0 && (
              <section className="tc-card" style={{ borderColor: '#0d5c63', background: 'linear-gradient(135deg,#eef7f6,#fff)', padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <strong style={{ color: '#073e44' }}>لديك {totalMyAds} إعلان على هذا الجهاز ({myOffers.length} عرض • {myRequests.length} طلب)</strong>
                    <div style={{ fontSize: '.82rem', color: '#425d60' }}>عدّل بياناتها أو أغلقها أو احذفها نهائياً بضغطة زر.</div>
                  </div>
                  <button type="button" className="tc-btn tc-btn-call" onClick={() => openAds('mine')}>
                    <Icon name="edit" size={15} /> إدارة إعلاناتي
                  </button>
                </div>
              </section>
            )}

            <section className="tc-grid-3">
              <button type="button" className="tc-tile primary" onClick={() => openAds('all')}>
                <span className="tc-tile-ico" style={{ background: '#0b555c', color: '#fff' }}><Icon name="ads" size={23} /></span>
                <span style={{ flex: 1 }}>
                  <strong style={{ display: 'block', marginBottom: 3 }}>تصفح الإعلانات ({totalLiveAds})</strong>
                  <span style={{ fontSize: '.83rem', color: '#526b6e' }}>استعرض عروض السائقين وطلبات الطلاب أو أدر إعلاناتك</span>
                </span>
                <span className="tc-tile-arr"><Icon name="left" size={19} /></span>
              </button>

              <button type="button" className="tc-tile" onClick={() => openTab(TABS.OFFER)}>
                <span className="tc-tile-ico" style={{ background: '#e6f7ed', color: '#15803d' }}><Icon name="car" size={23} /></span>
                <span style={{ flex: 1 }}>
                  <strong style={{ display: 'block', marginBottom: 3 }}>أعرض توصيلة أو ترحيل</strong>
                  <span style={{ fontSize: '.83rem', color: '#526b6e' }}>لأصحاب العربات — شارك مقاعدك وتحكم بإعلانك مباشرة</span>
                </span>
                <span className="tc-tile-arr"><Icon name="left" size={19} /></span>
              </button>

              <button type="button" className="tc-tile" onClick={() => openTab(TABS.REQUEST)}>
                <span className="tc-tile-ico" style={{ background: '#fef5e7', color: '#c47119' }}><Icon name="hand" size={23} /></span>
                <span style={{ flex: 1 }}>
                  <strong style={{ display: 'block', marginBottom: 3 }}>أطلب توصيلة أو ترحيل</strong>
                  <span style={{ fontSize: '.83rem', color: '#526b6e' }}>انشر مسارك ليتواصل معك السائقون وأغلقه فور إيجاد توصيلة</span>
                </span>
                <span className="tc-tile-arr"><Icon name="left" size={19} /></span>
              </button>
            </section>
          </>
        )}

        {/* ==================== الإعلانات وإعلاناتي ==================== */}
        {tab === TABS.ADS && (
          <>
            <div className="tc-seg-4">
              <button type="button" className={`tc-seg-btn ${section === 'all' ? 'active' : ''}`} onClick={() => setSection('all')}>
                الكل ({totalLiveAds})
              </button>
              <button type="button" className={`tc-seg-btn ${section === 'offers' ? 'active' : ''}`} onClick={() => setSection('offers')}>
                عروض السائقين ({filteredOffers.length})
              </button>
              <button type="button" className={`tc-seg-btn ${section === 'requests' ? 'active' : ''}`} onClick={() => setSection('requests')}>
                طلبات الطلاب ({filteredRequests.length})
              </button>
              <button type="button" className={`tc-seg-btn mine ${section === 'mine' ? 'active' : ''}`} onClick={() => setSection('mine')}>
                إعلاناتي ({totalMyAds})
              </button>
            </div>

            {section !== 'mine' && (
              <section className="tc-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  <h2 className="tc-h2" style={{ margin: 0 }}><Icon name="ads" size={19} /> الإعلانات المتاحة والبحث</h2>
                  <button type="button" className="tc-btn tc-btn-soft" onClick={fetchBoard} disabled={loadingBoard}>
                    <Icon name="refresh" size={15} /> {loadingBoard ? 'تحديث...' : 'تحديث'}
                  </button>
                </div>
                <div className="tc-chips" style={{ marginBottom: 12 }}>
                  {[['all', 'الكل'], ['once', 'توصيلة لمرة واحدة'], ['recurring', 'ترحيل منتظم']].map(([k, l]) => (
                    <button key={k} type="button" className={`tc-chip ${qKind === k ? 'active' : ''}`} onClick={() => setQKind(k)}>
                      {l}
                    </button>
                  ))}
                </div>
                <div className="tc-grid-2">
                  <div className="tc-field">
                    <label className="tc-label">الانطلاق أو محطة بالمسار</label>
                    <input type="text" className="tc-input" value={qStart} onChange={(e) => setQStart(e.target.value)} placeholder="مثال: الرياض، جبرة، الثورة..." />
                  </div>
                  <div className="tc-field">
                    <label className="tc-label">الوجهة (المجمع أو الحي)</label>
                    <input type="text" className="tc-input" value={qDest} onChange={(e) => setQDest(e.target.value)} placeholder="مثال: السنتر، الهندسة، شمبات..." />
                  </div>
                </div>
                {(qStart || qDest || qKind !== 'all') && (
                  <button type="button" className="tc-btn tc-btn-ghost" style={{ marginTop: 10 }} onClick={() => { setQStart(''); setQDest(''); setQKind('all'); }}>
                    مسح الفلاتر
                  </button>
                )}
              </section>
            )}

            {boardErr && <div className="tc-alert a-err">{boardErr}</div>}
            {ownerMsg.text && <div className={`tc-alert ${ownerMsg.type === 'ok' ? 'a-ok' : 'a-err'}`}>{ownerMsg.text}</div>}
            {reportMsg.text && <div className={`tc-alert ${reportMsg.type === 'ok' ? 'a-ok' : 'a-err'}`}>{reportMsg.text}</div>}

            {(section === 'all' || section === 'offers') && (
              <section style={{ marginBottom: 18 }}>
                <h2 className="tc-h2"><Icon name="car" size={19} /> عروض السائقين ({filteredOffers.length})</h2>
                {loadingBoard && !offers.length ? (
                  <div className="tc-skel" />
                ) : !filteredOffers.length ? (
                  <div className="tc-card tc-empty">لا توجد عروض سائقين مطابقة حالياً.</div>
                ) : (
                  filteredOffers.map((o) => {
                    const own = myOffersMap[o.id];
                    const mine = Boolean(own);
                    const busy = busyId === o.id;
                    const seats = Number(o.available_seats) || 0;
                    const tot = Math.max(1, Number(o.total_seats) || 1);
                    const full = o.status === 'full' || seats <= 0;
                    const rec = isRecurring(o.recurrence_type);
                    const tTxt = rec ? `الساعة ${fmtTime(o.departure_time)} (${fmtRec(o.recurrence_type, o.recurrence_days)})` : fmtDateTime(o.departure_time);
                    const msg = `السلام عليكم كابتن ${o.driver_name}، شاهدت عرضك في توصيلة السنتر من (${o.start_area}) إلى (${o.destination_area}) — ${tTxt}. هل يوجد مقعد متاح؟`;

                    return (
                      <article key={o.id} className={`tc-item ${mine ? 'own' : ''}`}>
                        <div className="tc-item-top">
                          <div className="tc-row">
                            {mine && <span className="tc-badge b-own">إعلانك</span>}
                            <span className={`tc-badge ${rec ? 'b-rec' : 'b-once'}`}>{rec ? 'ترحيل منتظم' : 'توصيلة'}</span>
                            <span className={`tc-badge ${full ? 'b-full' : 'b-ok'}`}>{full ? 'مكتمل (0)' : `متاح ${seats} من ${tot}`}</span>
                          </div>
                          <span className="tc-price">{Number(o.price_per_seat) > 0 ? `${Number(o.price_per_seat).toLocaleString()} ج.س` : 'مجاناً / بالاتفاق'}</span>
                        </div>
                        <RouteBox start={o.start_area} dest={o.destination_area} stops={o.intermediate_stops} />
                        <div className="tc-meta">
                          <span><strong>{o.driver_name}</strong> • {o.vehicle_type}</span>
                          <span><Icon name="clock" size={14} /> {tTxt}</span>
                        </div>
                        <div className="tc-item-foot">
                          {mine ? (
                            <>
                              <div className="tc-row">
                                <div className="tc-stepper">
                                  <button type="button" className="tc-step" disabled={busy || seats <= 0} onClick={() => manageOwnOffer(own, seats - 1, seats - 1 <= 0 ? 'full' : 'active')}>−</button>
                                  <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 800 }}>{seats}</span>
                                  <button type="button" className="tc-step" disabled={busy || seats >= tot} onClick={() => manageOwnOffer(own, seats + 1, 'active')}>+</button>
                                </div>
                                <button type="button" className="tc-btn tc-btn-soft" disabled={busy} onClick={() => openEditOffer(own, o)}>
                                  <Icon name="edit" size={14} /> تعديل
                                </button>
                                <button type="button" className="tc-btn tc-btn-warn" disabled={busy || full} onClick={() => manageOwnOffer(own, 0, 'full')}>
                                  اكتملت
                                </button>
                              </div>
                              <button type="button" className="tc-btn tc-btn-danger" disabled={busy} onClick={() => deleteOwnOffer(own)}>
                                <Icon name="trash" size={14} /> حذف
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="tc-row">
                                <a href={waLink(o.whatsapp_number, msg)} target="_blank" rel="noopener noreferrer" className="tc-btn tc-btn-wa">
                                  <Icon name="whatsapp" size={15} /> واتساب
                                </a>
                                <a href={telLink(o.phone_number || o.whatsapp_number)} className="tc-btn tc-btn-call">
                                  <Icon name="phone" size={14} /> اتصال
                                </a>
                              </div>
                              <button type="button" className="tc-btn tc-btn-ghost" onClick={() => setReportTarget({ type: 'offer', id: o.id, label: `عرض ${o.driver_name} (${o.start_area} ← ${o.destination_area})` })}>
                                <Icon name="flag" size={14} /> إبلاغ
                              </button>
                            </>
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </section>
            )}

            {(section === 'all' || section === 'requests') && (
              <section>
                <h2 className="tc-h2"><Icon name="hand" size={19} /> طلبات طلاب جامعة الخرطوم ({filteredRequests.length})</h2>
                {loadingBoard && !requests.length ? (
                  <div className="tc-skel" />
                ) : !filteredRequests.length ? (
                  <div className="tc-card tc-empty">لا توجد طلبات طلاب مطابقة حالياً.</div>
                ) : (
                  filteredRequests.map((r) => {
                    const own = myRequestsMap[r.id];
                    const mine = Boolean(own);
                    const busy = busyId === r.id;
                    const rec = isRecurring(r.recurrence_type);
                    const tTxt = rec ? `الساعة ${fmtTime(r.preferred_time)} (${fmtRec(r.recurrence_type, r.recurrence_days)})` : fmtDateTime(r.preferred_time);
                    const msg = `السلام عليكم ${r.passenger_name}، شاهدت طلبك في توصيلة السنتر من (${r.start_area}) إلى (${r.destination_area}) — ${tTxt}. لدي مقعد متاح على هذا المسار.`;

                    return (
                      <article key={r.id} className={`tc-item ${mine ? 'own' : ''}`}>
                        <div className="tc-item-top">
                          <div className="tc-row">
                            {mine && <span className="tc-badge b-own">إعلانك</span>}
                            <span className={`tc-badge ${rec ? 'b-rec' : 'b-once'}`}>{rec ? 'ترحيل منتظم' : 'توصيلة'}</span>
                            <span className="tc-badge b-neu">مطلوب {r.seats_needed} مقعد</span>
                          </div>
                        </div>
                        <RouteBox start={r.start_area} dest={r.destination_area} />
                        <div className="tc-meta">
                          <span><strong>{r.passenger_name}</strong></span>
                          <span><Icon name="clock" size={14} /> {tTxt}</span>
                        </div>
                        {r.notes && <div className="tc-notes">{r.notes}</div>}
                        <div className="tc-item-foot">
                          {mine ? (
                            <>
                              <div className="tc-row">
                                <button type="button" className="tc-btn tc-btn-soft" disabled={busy} onClick={() => openEditRequest(own, r)}>
                                  <Icon name="edit" size={14} /> تعديل
                                </button>
                                <button type="button" className="tc-btn tc-btn-warn" disabled={busy} onClick={() => manageOwnRequest(own, 'closed')}>
                                  <Icon name="check" size={14} /> لقيت توصيلة (إغلاق)
                                </button>
                              </div>
                              <button type="button" className="tc-btn tc-btn-danger" disabled={busy} onClick={() => deleteOwnRequest(own)}>
                                <Icon name="trash" size={14} /> حذف
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="tc-row">
                                <a href={waLink(r.whatsapp_number, msg)} target="_blank" rel="noopener noreferrer" className="tc-btn tc-btn-wa">
                                  <Icon name="whatsapp" size={15} /> واتساب
                                </a>
                                <a href={telLink(r.phone_number || r.whatsapp_number)} className="tc-btn tc-btn-call">
                                  <Icon name="phone" size={14} /> اتصال
                                </a>
                              </div>
                              <button type="button" className="tc-btn tc-btn-ghost" onClick={() => setReportTarget({ type: 'request', id: r.id, label: `طلب ${r.passenger_name} (${r.start_area} ← ${r.destination_area})` })}>
                                <Icon name="flag" size={14} /> إبلاغ
                              </button>
                            </>
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </section>
            )}

            {section === 'mine' && (
              <>
                <section className="tc-card">
                  <h2 className="tc-h2"><Icon name="edit" size={19} /> إعلاناتي المنشورة من هذا الجهاز ({totalMyAds})</h2>
                  <div className="tc-alert a-info" style={{ marginBottom: 0 }}>
                    تجمع هذه القائمة كل <strong>عروضك كسائق</strong> و<strong>طلباتك كطالب</strong> المنشورة من متصفحك الحالي لتعديلها أو إغلاقها أو حذفها نهائياً.
                  </div>
                </section>

                <section className="tc-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 className="tc-h3" style={{ margin: 0 }}>عروضي كسائق ({myOffers.length})</h3>
                    <button type="button" className="tc-btn tc-btn-soft" onClick={() => openTab(TABS.OFFER)}>+ عرض جديد</button>
                  </div>
                  {!myOffers.length ? (
                    <p className="tc-muted" style={{ marginBottom: 0 }}>لا توجد عروض محفوظة على هذا الجهاز بعد.</p>
                  ) : (
                    myOffers.map((item) => {
                      const exp = item.expires_at && new Date(item.expires_at).getTime() <= Date.now();
                      const closed = item.status === 'closed';
                      const seats = Number(item.available_seats) || 0;
                      const tot = Math.max(1, Number(item.total_seats) || 1);
                      const busy = busyId === item.id;
                      const rec = isRecurring(item.recurrence_type);

                      return (
                        <article key={item.id} className="tc-item own">
                          <div className="tc-item-top">
                            <div className="tc-row">
                              <span className={`tc-badge ${rec ? 'b-rec' : 'b-once'}`}>{rec ? 'ترحيل منتظم' : 'توصيلة'}</span>
                              <span className={`tc-badge ${closed ? 'b-neu' : exp ? 'b-full' : seats <= 0 ? 'b-warn' : 'b-ok'}`}>
                                {closed ? 'مغلق' : exp ? 'منتهي' : seats <= 0 ? 'مكتمل' : `متاح ${seats} من ${tot}`}
                              </span>
                            </div>
                            <span className="tc-price">{Number(item.price_per_seat) > 0 ? `${Number(item.price_per_seat).toLocaleString()} ج.س` : 'مجاناً / بالاتفاق'}</span>
                          </div>
                          <RouteBox start={item.start_area} dest={item.destination_area} stops={item.intermediate_stops} />
                          <div className="tc-meta">
                            <span>{item.vehicle_type}</span>
                            <span>{rec ? `${fmtTime(item.departure_time)} (${fmtRec(item.recurrence_type, item.recurrence_days)})` : fmtDateTime(item.departure_time)}</span>
                          </div>
                          <div className="tc-item-foot">
                            <div className="tc-row">
                              {!closed && !exp && (
                                <div className="tc-stepper">
                                  <button type="button" className="tc-step" disabled={busy || seats <= 0} onClick={() => manageOwnOffer(item, seats - 1, seats - 1 <= 0 ? 'full' : 'active')}>−</button>
                                  <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 800 }}>{seats}</span>
                                  <button type="button" className="tc-step" disabled={busy || seats >= tot} onClick={() => manageOwnOffer(item, seats + 1, 'active')}>+</button>
                                </div>
                              )}
                              <button type="button" className="tc-btn tc-btn-soft" disabled={busy} onClick={() => openEditOffer(item)}>
                                <Icon name="edit" size={14} /> تعديل
                              </button>
                              {!closed && !exp && (
                                <button type="button" className="tc-btn tc-btn-warn" disabled={busy} onClick={() => manageOwnOffer(item, 0, 'closed')}>إغلاق</button>
                              )}
                              <button type="button" className="tc-btn tc-btn-danger" disabled={busy} onClick={() => deleteOwnOffer(item)}>
                                <Icon name="trash" size={14} /> حذف نهائياً
                              </button>
                            </div>
                            <button type="button" className="tc-btn tc-btn-ghost" onClick={() => copyText(item.manageCode, item.id)}>
                              <Icon name="copy" size={14} /> {copiedId === item.id ? 'نُسخ ✓' : 'الرمز'}
                            </button>
                          </div>
                        </article>
                      );
                    })
                  )}
                </section>

                <section className="tc-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 className="tc-h3" style={{ margin: 0 }}>طلباتي كطالب ({myRequests.length})</h3>
                    <button type="button" className="tc-btn tc-btn-soft" onClick={() => openTab(TABS.REQUEST)}>+ طلب جديد</button>
                  </div>
                  {!myRequests.length ? (
                    <p className="tc-muted" style={{ marginBottom: 0 }}>لا توجد طلبات محفوظة على هذا الجهاز بعد.</p>
                  ) : (
                    myRequests.map((req) => {
                      const exp = req.expires_at && new Date(req.expires_at).getTime() <= Date.now();
                      const closed = req.status === 'closed';
                      const busy = busyId === req.id;
                      const rec = isRecurring(req.recurrence_type);

                      return (
                        <article key={req.id} className="tc-item own">
                          <div className="tc-item-top">
                            <div className="tc-row">
                              <span className={`tc-badge ${rec ? 'b-rec' : 'b-once'}`}>{rec ? 'ترحيل منتظم' : 'توصيلة'}</span>
                              <span className={`tc-badge ${closed ? 'b-neu' : exp ? 'b-full' : 'b-ok'}`}>
                                {closed ? 'مغلق (لقيت توصيلة)' : exp ? 'منتهي' : 'نشط'}
                              </span>
                              <span className="tc-badge b-neu">{req.seats_needed} مقعد</span>
                            </div>
                          </div>
                          <RouteBox start={req.start_area} dest={req.destination_area} />
                          <div className="tc-meta">
                            <span>{rec ? `${fmtTime(req.preferred_time)} (${fmtRec(req.recurrence_type, req.recurrence_days)})` : fmtDateTime(req.preferred_time)}</span>
                          </div>
                          {req.notes && <div className="tc-notes">{req.notes}</div>}
                          <div className="tc-item-foot">
                            <div className="tc-row">
                              <button type="button" className="tc-btn tc-btn-soft" disabled={busy} onClick={() => openEditRequest(req)}>
                                <Icon name="edit" size={14} /> تعديل
                              </button>
                              {!closed && !exp ? (
                                <button type="button" className="tc-btn tc-btn-warn" disabled={busy} onClick={() => manageOwnRequest(req, 'closed')}>
                                  <Icon name="check" size={14} /> لقيت توصيلة (إغلاق)
                                </button>
                              ) : (
                                !exp && (
                                  <button type="button" className="tc-btn tc-btn-soft" disabled={busy} onClick={() => manageOwnRequest(req, 'active')}>
                                    إعادة تفعيل
                                  </button>
                                )
                              )}
                              <button type="button" className="tc-btn tc-btn-danger" disabled={busy} onClick={() => deleteOwnRequest(req)}>
                                <Icon name="trash" size={14} /> حذف نهائياً
                              </button>
                            </div>
                            <button type="button" className="tc-btn tc-btn-ghost" onClick={() => copyText(req.manageCode, req.id)}>
                              <Icon name="copy" size={14} /> {copiedId === req.id ? 'نُسخ ✓' : 'الرمز'}
                            </button>
                          </div>
                        </article>
                      );
                    })
                  )}
                </section>

                <section className="tc-card">
                  <h3 className="tc-h3">إدارة إعلان من هاتف آخر (بالرمز السري)</h3>
                  {manualMsg.text && <div className={`tc-alert ${manualMsg.type === 'ok' ? 'a-ok' : 'a-err'}`}>{manualMsg.text}</div>}
                  <div className="tc-chips" style={{ marginBottom: 10 }}>
                    <button type="button" className={`tc-chip ${manualKind === 'offer' ? 'active' : ''}`} onClick={() => setManualKind('offer')}>عرض سائق</button>
                    <button type="button" className={`tc-chip ${manualKind === 'request' ? 'active' : ''}`} onClick={() => setManualKind('request')}>طلب طالب</button>
                  </div>
                  <div className="tc-grid-2">
                    <div className="tc-field">
                      <label className="tc-label">الرمز الكامل (id_token)</label>
                      <input type="text" className="tc-input tc-ltr" value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder="الصق الرمز هنا..." />
                    </div>
                    {manualKind === 'offer' && (
                      <div className="tc-field">
                        <label className="tc-label">المقاعد المتاحة</label>
                        <input type="number" min="0" max="50" className="tc-input" value={manualSeats} onChange={(e) => setManualSeats(e.target.value)} />
                      </div>
                    )}
                  </div>
                  <div className="tc-row" style={{ marginTop: 10 }}>
                    {manualKind === 'offer' && (
                      <button type="button" className="tc-btn tc-btn-soft" disabled={manualBusy} onClick={() => runManual('active')}>تحديث المقاعد</button>
                    )}
                    <button type="button" className="tc-btn tc-btn-warn" disabled={manualBusy} onClick={() => runManual('closed')}>إغلاق</button>
                    <button type="button" className="tc-btn tc-btn-danger" disabled={manualBusy} onClick={() => runManual('delete')}>
                      <Icon name="trash" size={14} /> حذف نهائياً
                    </button>
                  </div>
                </section>
              </>
            )}
          </>
        )}

        {/* ==================== أعرض مشواراً ==================== */}
        {tab === TABS.OFFER && (
          <section className="tc-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
              <h2 className="tc-h2" style={{ margin: 0 }}><Icon name="car" size={19} /> أعرض توصيلة أو ترحيل</h2>
              {totalMyAds > 0 && (
                <button type="button" className="tc-btn tc-btn-soft" onClick={() => openAds('mine')}>إعلاناتي ({totalMyAds})</button>
              )}
            </div>
            <p className="tc-muted">انشر عرضك لطلاب جامعة الخرطوم، وسيُحفظ تلقائياً في «إعلاناتي» للتعديل أو الحذف بضغطة زر.</p>

            {offerErr && <div className="tc-alert a-err">{offerErr}</div>}
            {savedOfferCode && (
              <div className="tc-alert a-ok">
                <strong>تم نشر عرضك وحفظه في «إعلاناتي» بنجاح!</strong>
                <div className="tc-code">{savedOfferCode}</div>
                <div className="tc-row" style={{ marginTop: 10 }}>
                  <button type="button" className="tc-btn tc-btn-call" onClick={() => openAds('mine')}>الانتقال إلى إعلاناتي</button>
                  <button type="button" className="tc-btn tc-btn-ghost" onClick={() => copyText(savedOfferCode, 'so')}>
                    <Icon name="copy" size={14} /> {copiedId === 'so' ? 'نُسخ ✓' : 'نسخ الرمز'}
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={publishOffer}>
              <div className="tc-sec">
                <div className="tc-sec-title"><Icon name="repeat" size={15} /> 1. نوع العرض</div>
                <div className="tc-chips">
                  {RECURRENCE_CHOICES.map((c) => (
                    <button key={c.value} type="button" className={`tc-chip ${offerForm.recurrence_type === c.value ? 'active' : ''}`} onClick={() => setOfferForm({ ...offerForm, recurrence_type: c.value })}>
                      {c.label}
                    </button>
                  ))}
                </div>
                {offerForm.recurrence_type === 'weekdays' && (
                  <div className="tc-chips" style={{ marginTop: 10 }}>
                    {WEEKDAYS.map((d) => {
                      const on = offerForm.recurrence_days.includes(d.key);
                      return (
                        <button
                          key={d.key}
                          type="button"
                          className={`tc-chip ${on ? 'active' : ''}`}
                          onClick={() =>
                            setOfferForm((p) => ({
                              ...p,
                              recurrence_days: on ? p.recurrence_days.filter((x) => x !== d.key) : [...p.recurrence_days, d.key],
                            }))
                          }
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="tc-sec">
                <div className="tc-sec-title"><Icon name="car" size={15} /> 2. بيانات السائق والتواصل</div>
                <div className="tc-grid-2">
                  <div className="tc-field">
                    <label className="tc-label">اسم السائق <span className="tc-req">*</span></label>
                    <input type="text" className="tc-input" value={offerForm.driver_name} onChange={(e) => setOfferForm({ ...offerForm, driver_name: e.target.value })} placeholder="مثال: أحمد محمد" required />
                  </div>
                  <div className="tc-field">
                    <label className="tc-label">نوع العربة <span className="tc-req">*</span></label>
                    <input type="text" className="tc-input" value={offerForm.vehicle_type} onChange={(e) => setOfferForm({ ...offerForm, vehicle_type: e.target.value })} placeholder="مثال: يارس أبيض / أكسنت" required />
                  </div>
                  <div className="tc-field">
                    <label className="tc-label">رقم الواتساب <span className="tc-req">*</span></label>
                    <input type="tel" className="tc-input tc-ltr" value={offerForm.whatsapp_number} onChange={(e) => setOfferForm({ ...offerForm, whatsapp_number: e.target.value })} placeholder="0912345678" required />
                  </div>
                  <div className="tc-field">
                    <label className="tc-label">رقم اتصال إضافي (اختياري)</label>
                    <input type="tel" className="tc-input tc-ltr" value={offerForm.phone_number} onChange={(e) => setOfferForm({ ...offerForm, phone_number: e.target.value })} placeholder="اختياري" />
                  </div>
                </div>
              </div>

              <div className="tc-sec">
                <div className="tc-sec-title"><Icon name="ads" size={15} /> 3. المسار والموعد والمقاعد</div>
                <div className="tc-grid-2">
                  <AreaInput label="منطقة الانطلاق" value={offerForm.start_area} onChange={(v) => setOfferForm({ ...offerForm, start_area: v })} />
                  <AreaInput label="الوجهة" value={offerForm.destination_area} onChange={(v) => setOfferForm({ ...offerForm, destination_area: v })} />
                </div>
                <div className="tc-field" style={{ marginTop: 10 }}>
                  <label className="tc-label">المحطات الوسيطة (اختياري، افصل بفاصلة)</label>
                  <input type="text" className="tc-input" value={offerForm.stops_text} onChange={(e) => setOfferForm({ ...offerForm, stops_text: e.target.value })} placeholder="مثال: شارع الستين، المعمورة، بري" />
                </div>
                <div className="tc-grid-2" style={{ marginTop: 10 }}>
                  <div className="tc-field">
                    <label className="tc-label">{isRecurring(offerForm.recurrence_type) ? 'وقت التحرك المعتاد (تاريخ أول يوم)' : 'موعد المغادرة (في المستقبل)'} <span className="tc-req">*</span></label>
                    <input type="datetime-local" className="tc-input" value={offerForm.departure_time} onChange={(e) => setOfferForm({ ...offerForm, departure_time: e.target.value })} required />
                  </div>
                  {isRecurring(offerForm.recurrence_type) ? (
                    <div className="tc-field">
                      <label className="tc-label">مدة بقاء إعلان الترحيل</label>
                      <select className="tc-input" value={offerForm.rec_days} onChange={(e) => setOfferForm({ ...offerForm, rec_days: Number(e.target.value) })}>
                        <option value={7}>أسبوع (7 أيام)</option>
                        <option value={14}>أسبوعان (14 يوماً)</option>
                        <option value={30}>شهر (30 يوماً)</option>
                      </select>
                    </div>
                  ) : (
                    <div className="tc-field">
                      <label className="tc-label">بقاء الإعلان بعد الموعد (ساعات)</label>
                      <input type="number" min="1" max="72" className="tc-input" value={offerForm.exp_hours} onChange={(e) => setOfferForm({ ...offerForm, exp_hours: e.target.value })} />
                    </div>
                  )}
                  <div className="tc-field">
                    <label className="tc-label">إجمالي المقاعد <span className="tc-req">*</span></label>
                    <input type="number" min="1" max="50" className="tc-input" value={offerForm.total_seats} onChange={(e) => setOfferForm({ ...offerForm, total_seats: e.target.value })} required />
                  </div>
                  <div className="tc-field">
                    <label className="tc-label">المقاعد المتاحة <span className="tc-req">*</span></label>
                    <input type="number" min="0" max="50" className="tc-input" value={offerForm.available_seats} onChange={(e) => setOfferForm({ ...offerForm, available_seats: e.target.value })} required />
                  </div>
                </div>
                <div className="tc-field" style={{ marginTop: 10 }}>
                  <label className="tc-label">السعر للمقعد (ج.س — اكتب 0 إذا مجاناً أو بالاتفاق)</label>
                  <input type="number" min="0" step="50" className="tc-input" value={offerForm.price_per_seat} onChange={(e) => setOfferForm({ ...offerForm, price_per_seat: e.target.value })} />
                </div>
              </div>

              <button type="submit" className="tc-btn tc-btn-primary" disabled={offerBusy}>
                {offerBusy ? 'جاري النشر...' : isRecurring(offerForm.recurrence_type) ? 'نشر عرض الترحيل المنتظم' : 'نشر عرض التوصيلة'}
              </button>
            </form>
          </section>
        )}

        {/* ==================== اطلب توصيلة / ترحيل ==================== */}
        {tab === TABS.REQUEST && (
          <section className="tc-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
              <h2 className="tc-h2" style={{ margin: 0 }}><Icon name="hand" size={19} /> اطلب توصيلة أو ترحيل</h2>
              {totalMyAds > 0 && (
                <button type="button" className="tc-btn tc-btn-soft" onClick={() => openAds('mine')}>إعلاناتي ({totalMyAds})</button>
              )}
            </div>
            <p className="tc-muted">انشر طلبك وسيُحفظ تلقائياً في «إعلاناتي» لتعديله أو إغلاقه عند إيجاد توصيلة أو حذفه نهائياً.</p>

            {reqErr && <div className="tc-alert a-err">{reqErr}</div>}
            {savedReqCode && (
              <div className="tc-alert a-ok">
                <strong>تم نشر طلبك وحفظه في «إعلاناتي» بنجاح!</strong>
                <div className="tc-code">{savedReqCode}</div>
                <div className="tc-row" style={{ marginTop: 10 }}>
                  <button type="button" className="tc-btn tc-btn-call" onClick={() => openAds('mine')}>الانتقال إلى إعلاناتي</button>
                  <button type="button" className="tc-btn tc-btn-ghost" onClick={() => copyText(savedReqCode, 'sr')}>
                    <Icon name="copy" size={14} /> {copiedId === 'sr' ? 'نُسخ ✓' : 'نسخ الرمز'}
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={publishRequest}>
              <div className="tc-sec">
                <div className="tc-sec-title"><Icon name="repeat" size={15} /> 1. نوع الطلب</div>
                <div className="tc-chips">
                  {RECURRENCE_CHOICES.map((c) => (
                    <button key={c.value} type="button" className={`tc-chip ${reqForm.recurrence_type === c.value ? 'active' : ''}`} onClick={() => setReqForm({ ...reqForm, recurrence_type: c.value })}>
                      {c.label}
                    </button>
                  ))}
                </div>
                {reqForm.recurrence_type === 'weekdays' && (
                  <div className="tc-chips" style={{ marginTop: 10 }}>
                    {WEEKDAYS.map((d) => {
                      const on = reqForm.recurrence_days.includes(d.key);
                      return (
                        <button
                          key={d.key}
                          type="button"
                          className={`tc-chip ${on ? 'active' : ''}`}
                          onClick={() =>
                            setReqForm((p) => ({
                              ...p,
                              recurrence_days: on ? p.recurrence_days.filter((x) => x !== d.key) : [...p.recurrence_days, d.key],
                            }))
                          }
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="tc-sec">
                <div className="tc-sec-title"><Icon name="hand" size={15} /> 2. بيانات الطالب والتواصل</div>
                <div className="tc-grid-2">
                  <div className="tc-field">
                    <label className="tc-label">الاسم <span className="tc-req">*</span></label>
                    <input type="text" className="tc-input" value={reqForm.passenger_name} onChange={(e) => setReqForm({ ...reqForm, passenger_name: e.target.value })} placeholder="مثال: سارة علي" required />
                  </div>
                  <div className="tc-field">
                    <label className="tc-label">المقاعد المطلوبة <span className="tc-req">*</span></label>
                    <input type="number" min="1" max="20" className="tc-input" value={reqForm.seats_needed} onChange={(e) => setReqForm({ ...reqForm, seats_needed: e.target.value })} required />
                  </div>
                  <div className="tc-field">
                    <label className="tc-label">رقم الواتساب <span className="tc-req">*</span></label>
                    <input type="tel" className="tc-input tc-ltr" value={reqForm.whatsapp_number} onChange={(e) => setReqForm({ ...reqForm, whatsapp_number: e.target.value })} placeholder="0912345678" required />
                  </div>
                  <div className="tc-field">
                    <label className="tc-label">رقم اتصال إضافي (اختياري)</label>
                    <input type="tel" className="tc-input tc-ltr" value={reqForm.phone_number} onChange={(e) => setReqForm({ ...reqForm, phone_number: e.target.value })} placeholder="اختياري" />
                  </div>
                </div>
              </div>

              <div className="tc-sec">
                <div className="tc-sec-title"><Icon name="ads" size={15} /> 3. المسار والموعد</div>
                <div className="tc-grid-2">
                  <AreaInput label="منطقة الانطلاق" value={reqForm.start_area} onChange={(v) => setReqForm({ ...reqForm, start_area: v })} />
                  <AreaInput label="الوجهة" value={reqForm.destination_area} onChange={(v) => setReqForm({ ...reqForm, destination_area: v })} />
                  <div className="tc-field">
                    <label className="tc-label">{isRecurring(reqForm.recurrence_type) ? 'توقيت التحرك المعتاد (أول يوم)' : 'الوقت المفضل (في المستقبل)'} <span className="tc-req">*</span></label>
                    <input type="datetime-local" className="tc-input" value={reqForm.preferred_time} onChange={(e) => setReqForm({ ...reqForm, preferred_time: e.target.value })} required />
                  </div>
                  {isRecurring(reqForm.recurrence_type) ? (
                    <div className="tc-field">
                      <label className="tc-label">مدة بقاء طلب الترحيل</label>
                      <select className="tc-input" value={reqForm.rec_days} onChange={(e) => setReqForm({ ...reqForm, rec_days: Number(e.target.value) })}>
                        <option value={7}>أسبوع (7 أيام)</option>
                        <option value={14}>أسبوعان (14 يوماً)</option>
                        <option value={30}>شهر (30 يوماً)</option>
                      </select>
                    </div>
                  ) : (
                    <div className="tc-field">
                      <label className="tc-label">بقاء الطلب بعد الموعد (ساعات)</label>
                      <input type="number" min="1" max="72" className="tc-input" value={reqForm.exp_hours} onChange={(e) => setReqForm({ ...reqForm, exp_hours: e.target.value })} />
                    </div>
                  )}
                </div>
                <div className="tc-field" style={{ marginTop: 10 }}>
                  <label className="tc-label">ملاحظات إضافية (اختياري)</label>
                  <textarea rows="2" className="tc-input" value={reqForm.notes} onChange={(e) => setReqForm({ ...reqForm, notes: e.target.value })} placeholder="مثال: الانتظار أمام بوابة الهندسة..." />
                </div>
              </div>

              <button type="submit" className="tc-btn tc-btn-primary" disabled={reqBusy}>
                {reqBusy ? 'جاري النشر...' : isRecurring(reqForm.recurrence_type) ? 'نشر طلب الترحيل المنتظم' : 'نشر طلب التوصيلة'}
              </button>
            </form>
          </section>
        )}

        {/* ==================== الإدارة ==================== */}
        {tab === TABS.ADMIN && (
          <>
            {!session ? (
              <section className="tc-card" style={{ maxWidth: 440, margin: '10px auto' }}>
                <h2 className="tc-h2"><Icon name="shield" size={19} /> دخول لوحة الإدارة</h2>
                {loginErr && <div className="tc-alert a-err">{loginErr}</div>}
                <form onSubmit={adminLogin}>
                  <div className="tc-field">
                    <label className="tc-label">البريد الإلكتروني</label>
                    <input type="email" className="tc-input tc-ltr" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="tc-field">
                    <label className="tc-label">كلمة المرور</label>
                    <input type="password" className="tc-input tc-ltr" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <button type="submit" className="tc-btn tc-btn-primary" disabled={loginBusy}>
                    {loginBusy ? 'جاري التحقق...' : 'تسجيل الدخول'}
                  </button>
                </form>
              </section>
            ) : checkingAdmin ? (
              <section className="tc-card">جاري التحقق من صلاحيات المشرف...</section>
            ) : !isAdmin ? (
              <section className="tc-card">
                <div className="tc-alert a-err">هذا الحساب ({session.user?.email}) غير مضاف في جدول <code>admin_users</code>.</div>
                <button type="button" className="tc-btn tc-btn-soft" onClick={adminLogout}>خروج</button>
              </section>
            ) : (
              <>
                <section className="tc-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <h2 className="tc-h2" style={{ margin: 0 }}><Icon name="shield" size={19} /> لوحة الإدارة</h2>
                      <span style={{ fontSize: '.82rem', color: '#526b6e' }}>{session.user?.email}</span>
                    </div>
                    <div className="tc-row">
                      <button type="button" className="tc-btn tc-btn-soft" onClick={fetchAdmin} disabled={adminLoading}><Icon name="refresh" size={14} /> تحديث</button>
                      <button type="button" className="tc-btn tc-btn-warn" onClick={deleteExpired}><Icon name="trash" size={14} /> حذف المنتهي</button>
                      <button type="button" className="tc-btn tc-btn-danger" onClick={adminLogout}>خروج</button>
                    </div>
                  </div>
                </section>

                <div className="tc-stats-3">
                  <div className="tc-stat-box"><strong>{adminReports.filter((x) => x.status === 'pending').length}</strong><span>بلاغات جديدة</span></div>
                  <div className="tc-stat-box"><strong>{adminOffers.length}</strong><span>العروض</span></div>
                  <div className="tc-stat-box"><strong>{adminRequests.length}</strong><span>الطلبات</span></div>
                </div>

                {adminMsg.text && <div className={`tc-alert ${adminMsg.type === 'ok' ? 'a-ok' : 'a-err'}`}>{adminMsg.text}</div>}

                <section className="tc-card">
                  <h2 className="tc-h2">البلاغات ({adminReports.length})</h2>
                  {!adminReports.length ? (
                    <p className="tc-muted" style={{ marginBottom: 0 }}>لا توجد بلاغات.</p>
                  ) : (
                    adminReports.map((rep) => {
                      const lo = rep.target_type === 'offer' ? adminOffersMap[rep.offer_id] : null;
                      const lr = rep.target_type === 'request' ? adminRequestsMap[rep.request_id] : null;
                      const tid = rep.target_type === 'offer' ? rep.offer_id : rep.request_id;
                      return (
                        <article key={rep.id} className="tc-item">
                          <div className="tc-item-top">
                            <strong>{rep.target_type === 'offer' ? 'بلاغ على عرض سائق' : 'بلاغ على طلب طالب'}</strong>
                            <span className={`tc-badge ${rep.status === 'pending' ? 'b-warn' : rep.status === 'reviewed' ? 'b-ok' : 'b-neu'}`}>{rep.status}</span>
                          </div>
                          <div style={{ fontSize: '.87rem', lineHeight: 1.65 }}>
                            <div><strong>السبب:</strong> {rep.reason}</div>
                            {rep.details && <div><strong>تفاصيل:</strong> {rep.details}</div>}
                            {lo && <div className="tc-notes" style={{ marginTop: 6 }}>{lo.driver_name} — {lo.start_area} ← {lo.destination_area}</div>}
                            {lr && <div className="tc-notes" style={{ marginTop: 6 }}>{lr.passenger_name} — {lr.start_area} ← {lr.destination_area}</div>}
                          </div>
                          <div className="tc-row" style={{ marginTop: 10 }}>
                            <button type="button" className="tc-btn tc-btn-soft" onClick={() => updateReportStatus(rep.id, 'reviewed')}>تمت المراجعة</button>
                            <button type="button" className="tc-btn tc-btn-warn" onClick={() => updateReportStatus(rep.id, 'dismissed')}>تجاهل</button>
                            <button type="button" className="tc-btn tc-btn-danger" onClick={() => adminDelete(rep.target_type, tid)}>حذف الإعلان</button>
                          </div>
                        </article>
                      );
                    })
                  )}
                </section>

                <section className="tc-card">
                  <h2 className="tc-h2">كل العروض ({adminOffers.length})</h2>
                  {adminOffers.map((o) => (
                    <div key={o.id} className="tc-item">
                      <div className="tc-item-top">
                        <strong>{o.driver_name}: {o.start_area} ← {o.destination_area}</strong>
                        <span className="tc-badge b-neu">{new Date(o.expires_at) <= new Date() ? 'منتهي' : o.status}</span>
                      </div>
                      <button type="button" className="tc-btn tc-btn-danger" onClick={() => adminDelete('offer', o.id)}>
                        <Icon name="trash" size={14} /> حذف العرض
                      </button>
                    </div>
                  ))}
                </section>

                <section className="tc-card">
                  <h2 className="tc-h2">كل الطلبات ({adminRequests.length})</h2>
                  {adminRequests.map((r) => (
                    <div key={r.id} className="tc-item">
                      <div className="tc-item-top">
                        <strong>{r.passenger_name}: {r.start_area} ← {r.destination_area}</strong>
                        <span className="tc-badge b-neu">{new Date(r.expires_at) <= new Date() ? 'منتهي' : r.status}</span>
                      </div>
                      <button type="button" className="tc-btn tc-btn-danger" onClick={() => adminDelete('request', r.id)}>
                        <Icon name="trash" size={14} /> حذف الطلب
                      </button>
                    </div>
                  ))}
                </section>
              </>
            )}
          </>
        )}
      </main>

      {/* ==================== نافذة التعديل ==================== */}
      {editModal && (
        <div className="tc-modal-bg" onClick={() => !editSaving && setEditModal(null)}>
          <div className="tc-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tc-h3">{editModal.kind === 'offer' ? 'تعديل عرض السائق' : 'تعديل طلب التوصيلة / الترحيل'}</h3>
            {editErr && <div className="tc-alert a-err">{editErr}</div>}
            <form onSubmit={saveEdit}>
              {editModal.kind === 'offer' ? (
                <>
                  <div className="tc-field">
                    <label className="tc-label">نوع العربة</label>
                    <input type="text" className="tc-input" value={editModal.vehicle_type} onChange={(e) => setEditModal({ ...editModal, vehicle_type: e.target.value })} required />
                  </div>
                  <AreaInput label="منطقة الانطلاق" value={editModal.start_area} onChange={(v) => setEditModal({ ...editModal, start_area: v })} />
                  <AreaInput label="الوجهة" value={editModal.destination_area} onChange={(v) => setEditModal({ ...editModal, destination_area: v })} />
                  <div className="tc-field">
                    <label className="tc-label">المحطات الوسيطة</label>
                    <input type="text" className="tc-input" value={editModal.stops_text} onChange={(e) => setEditModal({ ...editModal, stops_text: e.target.value })} />
                  </div>
                  <div className="tc-field">
                    <label className="tc-label">موعد التحرك</label>
                    <input type="datetime-local" className="tc-input" value={editModal.departure_time} onChange={(e) => setEditModal({ ...editModal, departure_time: e.target.value })} required />
                  </div>
                  <div className="tc-grid-2">
                    <div className="tc-field">
                      <label className="tc-label">إجمالي المقاعد</label>
                      <input type="number" min="1" max="50" className="tc-input" value={editModal.total_seats} onChange={(e) => setEditModal({ ...editModal, total_seats: e.target.value })} required />
                    </div>
                    <div className="tc-field">
                      <label className="tc-label">المتاحة</label>
                      <input type="number" min="0" max="50" className="tc-input" value={editModal.available_seats} onChange={(e) => setEditModal({ ...editModal, available_seats: e.target.value })} required />
                    </div>
                  </div>
                  <div className="tc-field" style={{ marginTop: 10 }}>
                    <label className="tc-label">السعر للمقعد (ج.س)</label>
                    <input type="number" min="0" step="50" className="tc-input" value={editModal.price_per_seat} onChange={(e) => setEditModal({ ...editModal, price_per_seat: e.target.value })} />
                  </div>
                </>
              ) : (
                <>
                  <AreaInput label="منطقة الانطلاق" value={editModal.start_area} onChange={(v) => setEditModal({ ...editModal, start_area: v })} />
                  <AreaInput label="الوجهة" value={editModal.destination_area} onChange={(v) => setEditModal({ ...editModal, destination_area: v })} />
                  <div className="tc-grid-2">
                    <div className="tc-field">
                      <label className="tc-label">الوقت المفضل</label>
                      <input type="datetime-local" className="tc-input" value={editModal.preferred_time} onChange={(e) => setEditModal({ ...editModal, preferred_time: e.target.value })} required />
                    </div>
                    <div className="tc-field">
                      <label className="tc-label">المقاعد المطلوبة</label>
                      <input type="number" min="1" max="20" className="tc-input" value={editModal.seats_needed} onChange={(e) => setEditModal({ ...editModal, seats_needed: e.target.value })} required />
                    </div>
                  </div>
                  <div className="tc-field" style={{ marginTop: 10 }}>
                    <label className="tc-label">ملاحظات</label>
                    <textarea rows="2" className="tc-input" value={editModal.notes} onChange={(e) => setEditModal({ ...editModal, notes: e.target.value })} />
                  </div>
                </>
              )}
              <div className="tc-row" style={{ marginTop: 14 }}>
                <button type="submit" className="tc-btn tc-btn-call" disabled={editSaving}>{editSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button>
                <button type="button" className="tc-btn tc-btn-ghost" disabled={editSaving} onClick={() => setEditModal(null)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== نافذة البلاغ ==================== */}
      {reportTarget && (
        <div className="tc-modal-bg" onClick={() => !reportBusy && setReportTarget(null)}>
          <div className="tc-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tc-h3" style={{ color: '#b42318' }}>إرسال بلاغ</h3>
            <p className="tc-muted">{reportTarget.label}</p>
            <form onSubmit={submitReport}>
              <div className="tc-field">
                <label className="tc-label">سبب البلاغ <span className="tc-req">*</span></label>
                <input type="text" className="tc-input" value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="مثال: رقم غير صحيح أو إعلان مزعج" required />
              </div>
              <div className="tc-field">
                <label className="tc-label">تفاصيل (اختياري)</label>
                <textarea rows="2" className="tc-input" value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} />
              </div>
              <div className="tc-row" style={{ marginTop: 12 }}>
                <button type="submit" className="tc-btn tc-btn-danger" disabled={reportBusy}>{reportBusy ? 'إرسال...' : 'تأكيد البلاغ'}</button>
                <button type="button" className="tc-btn tc-btn-ghost" onClick={() => setReportTarget(null)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== شريط التنقل السفلي للموبايل ==================== */}
      <nav className="tc-bnav">
        <button type="button" className={`tc-bnav-btn ${tab === TABS.HOME ? 'active' : ''}`} onClick={() => openTab(TABS.HOME)}>
          <Icon name="home" size={20} /><span>الرئيسية</span>
        </button>
        <button type="button" className={`tc-bnav-btn ${tab === TABS.ADS ? 'active' : ''}`} onClick={() => openAds('all')}>
          {totalLiveAds > 0 && <span className="tc-bnav-cnt">{totalLiveAds}</span>}
          <Icon name="ads" size={20} /><span>الإعلانات</span>
        </button>
        <button type="button" className={`tc-bnav-btn ${tab === TABS.OFFER ? 'active' : ''}`} onClick={() => openTab(TABS.OFFER)}>
          <Icon name="car" size={20} /><span>أعرض</span>
        </button>
        <button type="button" className={`tc-bnav-btn ${tab === TABS.REQUEST ? 'active' : ''}`} onClick={() => openTab(TABS.REQUEST)}>
          <Icon name="hand" size={20} /><span>اطلب</span>
        </button>
        <button type="button" className={`tc-bnav-btn ${tab === TABS.ADMIN ? 'active' : ''}`} onClick={() => openTab(TABS.ADMIN)}>
          <Icon name="shield" size={20} /><span>الإدارة</span>
        </button>
      </nav>
    </div>
  );
}
