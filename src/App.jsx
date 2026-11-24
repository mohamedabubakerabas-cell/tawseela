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

const MY_OFFERS_STORAGE_KEY = 'tawseelat_my_offers_v1';
const MY_REQUESTS_STORAGE_KEY = 'tawseelat_my_requests_v1';

const AREA_GROUPS = [
  {
    label: 'نقاط الجامعة',
    areas: [
      'مجمع الوسط (السنتر) - البوابة الرئيسية',
      'مجمع الوسط - كلية الهندسة',
      'مجمع الوسط - شارع الجامعة',
      'مجمع شمبات (الزراعة / البيطرة)',
      'مجمع الطب والعلوم الصحية (القصر)',
      'كلية التربية - أم درمان',
    ],
  },
  {
    label: 'الخرطوم',
    areas: [
      'الخرطوم - السوق العربي',
      'الخرطوم - الرياض',
      'الخرطوم - العمارات',
      'الخرطوم - الصحافة',
      'الخرطوم - جبرة',
      'الخرطوم - الكلاكلة',
      'الخرطوم - شرق النيل',
      'الخرطوم - الأزهري',
      'الخرطوم - الطائف',
      'الخرطوم - أركويت',
      'الخرطوم - بري',
      'الخرطوم - السجانة',
    ],
  },
  {
    label: 'أم درمان',
    areas: [
      'أم درمان - السوق الشعبي',
      'أم درمان - الثورة',
      'أم درمان - الموردة',
      'أم درمان - المهندسين',
      'أم درمان - المنارة',
      'أم درمان - الجرافة',
      'أم درمان - الشهداء',
      'أم درمان - الملازمين',
      'أم درمان - الفتيحاب',
      'أم درمان - الدوحة',
      'أم درمان - العرضة',
    ],
  },
  {
    label: 'بحري',
    areas: [
      'بحري - المؤسسة',
      'بحري - الحلفايا / كافوري',
      'بحري - شمبات',
      'بحري - الكدرو',
      'بحري - الدروشاب',
      'بحري - السامراب',
      'بحري - دردوق',
      'بحري - الشعبية',
      'بحري - الصافية',
      'بحري - الأملاك',
    ],
  },
];

const POPULAR_AREAS = AREA_GROUPS.flatMap((g) => g.areas);

// فصل اسم المنطقة المختارة عن تفاصيل المكان: "الأزهري (مربع 1 جوار الرازي)"
function splitAreaValue(value) {
  const v = (value || '').trim();
  if (!v) return { name: '', detail: '' };
  if (POPULAR_AREAS.includes(v)) return { name: v, detail: '' };
  const sorted = [...POPULAR_AREAS].sort((a, b) => b.length - a.length);
  for (const p of sorted) {
    if (v.startsWith(p + ' (') && v.endsWith(')')) {
      return { name: p, detail: v.slice(p.length + 2, -1) };
    }
  }
  return { name: '', detail: '' };
}

// توحيد الكتابة العربية للبحث (الازهري = الأزهري، ة = ه، ى = ي)
function normalizeArabic(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

// مطابقة المسار؛ في الترحيل المنتظم (ذهاب وعودة) لا يهم الاتجاه
function routeMatches({ start, dest, stops }, startQ, destQ, anyDirection) {
  const s = normalizeArabic(start);
  const d = normalizeArabic(dest);
  const st = normalizeArabic(Array.isArray(stops) ? stops.join(' ') : '');
  const q1 = normalizeArabic(startQ);
  const q2 = normalizeArabic(destQ);
  const inStart = (q) => !q || s.includes(q) || st.includes(q);
  const inDest = (q) => !q || d.includes(q) || st.includes(q);
  if (inStart(q1) && inDest(q2)) return true;
  return Boolean(anyDirection) && inDest(q1) && inStart(q2);
}

function formatReturnTime(hhmm) {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm || '');
  if (!m) return '';
  return new Date(2000, 0, 1, Number(m[1]), Number(m[2])).toLocaleTimeString('ar', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

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

const OFFER_PUBLIC_COLUMNS = [
  'id',
  'driver_name',
  'whatsapp_number',
  'phone_number',
  'vehicle_type',
  'start_area',
  'destination_area',
  'intermediate_stops',
  'departure_time',
  'recurrence_type',
  'recurrence_days',
  'recurrence_group_id',
  'total_seats',
  'available_seats',
  'price_per_seat',
  'status',
  'expires_at',
  'created_at',
  'updated_at',
  'return_time',
  'notes',
].join(', ');

const REQUEST_PUBLIC_COLUMNS = [
  'id',
  'passenger_name',
  'whatsapp_number',
  'phone_number',
  'start_area',
  'destination_area',
  'preferred_time',
  'recurrence_type',
  'recurrence_days',
  'seats_needed',
  'notes',
  'status',
  'expires_at',
  'created_at',
].join(', ');

const APP_CSS = `
:root {
  --bg: #f3f6f6;
  --surface: #ffffff;
  --surface-soft: #f8fbfb;
  --primary: #0b555c;
  --primary-dark: #073e44;
  --primary-light: #e6f3f2;
  --accent: #d9822b;
  --accent-soft: #fef5e7;
  --text: #0f2629;
  --text-muted: #526b6e;
  --border: #dce7e6;
  --border-strong: #bdd1cf;
  --green: #15803d;
  --green-soft: #e6f7ed;
  --red: #b42318;
  --red-soft: #fef0f0;
  --violet: #5b21b6;
  --violet-soft: #f1ecfe;
  --sky: #0369a1;
  --sky-soft: #e6f4fc;
  --shadow-sm: 0 2px 8px rgba(11, 56, 62, 0.05);
  --shadow-md: 0 8px 24px rgba(11, 56, 62, 0.08);
  --radius-lg: 18px;
  --radius-md: 13px;
  --radius-sm: 10px;
}

* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

body {
  margin: 0;
  background-color: var(--bg);
  color: var(--text);
  font-family: 'Cairo', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  direction: rtl;
}

.tc-app {
  min-height: 100vh;
  padding-bottom: 92px;
}

/* Header */
.tc-header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: linear-gradient(135deg, #083f45 0%, #0d5c63 55%, #13736b 100%);
  color: #ffffff;
  box-shadow: 0 4px 18px rgba(8, 63, 69, 0.22);
}

.tc-header-inner {
  max-width: 920px;
  margin: 0 auto;
  padding: 13px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.tc-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  cursor: pointer;
  user-select: none;
}

.tc-logo-box {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(6px);
}

.tc-brand-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.tc-brand-sub {
  margin: 2px 0 0;
  font-size: 0.76rem;
  color: #cbece8;
  font-weight: 600;
}

.tc-desktop-nav {
  display: none;
  align-items: center;
  gap: 6px;
}

.tc-nav-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 13px;
  border-radius: 11px;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.1);
  color: #eef9f8;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}

.tc-nav-pill:hover {
  background: rgba(255, 255, 255, 0.2);
}

.tc-nav-pill.active {
  background: #ffffff;
  color: var(--primary-dark);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
}

.tc-live-dot-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 11px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.28);
  font-family: inherit;
  font-size: 0.76rem;
  font-weight: 700;
  color: #e6fffb;
  cursor: pointer;
  transition: background 0.16s ease, transform 0.12s ease;
  white-space: nowrap;
}

.tc-live-dot-badge:hover {
  background: rgba(255, 255, 255, 0.26);
}

.tc-live-dot-badge:active {
  transform: scale(0.96);
}

.tc-pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.28);
}

/* Mobile Bottom Nav */
.tc-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--border);
  box-shadow: 0 -4px 20px rgba(11, 56, 62, 0.08);
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  padding: 6px 6px calc(6px + env(safe-area-inset-bottom, 0px));
}

.tc-bottom-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 6px 4px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-family: inherit;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
  border-radius: 10px;
  position: relative;
  transition: color 0.15s ease, background 0.15s ease;
}

.tc-bottom-btn.active {
  color: var(--primary);
  background: var(--primary-light);
}

.tc-bottom-count {
  position: absolute;
  top: 2px;
  left: 16%;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--accent);
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Container & Cards */
.tc-main {
  max-width: 920px;
  margin: 18px auto 0;
  padding: 0 14px;
  animation: tcFadeIn 0.22s ease;
}

@keyframes tcFadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.tc-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px 18px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 16px;
}

/* Hero with University of Khartoum Background Image (/uofk-bg.jpg) */
.tc-hero {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  padding: 26px 20px;
  margin-bottom: 18px;
  background-color: #09464d;
  background-image:
    linear-gradient(135deg, rgba(7, 56, 62, 0.80) 0%, rgba(13, 92, 99, 0.72) 55%, rgba(20, 122, 110, 0.78) 100%),
    url('/uofk-bg.jpg');
  background-size: cover;
  background-position: center;
  color: #ffffff;
  box-shadow: 0 12px 28px rgba(11, 79, 86, 0.22);
}

.tc-hero::before {
  content: '';
  position: absolute;
  top: -40px;
  left: -40px;
  width: 190px;
  height: 190px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0) 70%);
  pointer-events: none;
}

.tc-hero-kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.24);
  font-size: 0.78rem;
  font-weight: 700;
  color: #e9fffc;
  margin-bottom: 10px;
}

.tc-hero-title {
  margin: 0 0 8px;
  font-size: 1.45rem;
  font-weight: 800;
  line-height: 1.35;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.22);
}

.tc-hero-desc {
  margin: 0 0 16px;
  font-size: 0.92rem;
  color: #e2f7f4;
  line-height: 1.7;
  max-width: 630px;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.18);
}

.tc-stats-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.tc-stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 13px;
  border-radius: 12px;
  background: rgba(7, 45, 50, 0.52);
  border: 1px solid rgba(255, 255, 255, 0.34);
  backdrop-filter: blur(6px);
  font-family: inherit;
  font-size: 0.83rem;
  font-weight: 700;
  color: #ffffff;
  cursor: pointer;
  transition: background 0.16s ease, transform 0.12s ease, border-color 0.16s ease;
}

.tc-stat-chip:hover {
  background: rgba(255, 255, 255, 0.22);
  border-color: #ffffff;
}

.tc-stat-chip:active {
  transform: scale(0.97);
}

/* Home Action Cards */
.tc-actions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.tc-action-tile {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 18px 16px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  text-align: right;
  font-family: inherit;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}

.tc-action-tile:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary);
}

.tc-action-tile.primary {
  background: linear-gradient(135deg, #f0faf8 0%, #ffffff 100%);
  border-color: #b7dcd8;
}

.tc-tile-icon {
  width: 50px;
  height: 50px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tc-tile-body {
  flex: 1;
  min-width: 0;
}

.tc-tile-title {
  display: block;
  font-size: 1.03rem;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 3px;
}

.tc-tile-sub {
  display: block;
  font-size: 0.84rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.tc-tile-arrow {
  color: var(--primary);
  opacity: 0.7;
  flex-shrink: 0;
}

/* Comparison info cards */
.tc-info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.tc-info-mini {
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px;
  display: flex;
  gap: 11px;
  align-items: flex-start;
}

/* Headings & Text */
.tc-h2 {
  margin: 0 0 6px;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--primary-dark);
  display: flex;
  align-items: center;
  gap: 8px;
}

.tc-h3 {
  margin: 0 0 8px;
  font-size: 0.98rem;
  font-weight: 800;
  color: var(--primary-dark);
}

.tc-muted {
  margin: 0 0 14px;
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.65;
}

/* Forms & Inputs */
.tc-form-section {
  padding: 15px;
  border-radius: var(--radius-md);
  background: var(--surface-soft);
  border: 1px solid var(--border);
  margin-bottom: 14px;
}

.tc-form-section-title {
  font-size: 0.86rem;
  font-weight: 800;
  color: var(--primary);
  margin: 0 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tc-grid-2 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.tc-field {
  margin-bottom: 12px;
}

.tc-field:last-child {
  margin-bottom: 0;
}

.tc-label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.86rem;
  font-weight: 700;
  color: #193b3f;
}

.tc-req {
  color: var(--red);
}

.tc-input {
  width: 100%;
  padding: 11px 13px;
  border-radius: 11px;
  border: 1.5px solid #cbdcdc;
  background: #ffffff;
  color: var(--text);
  font-family: inherit;
  font-size: 0.94rem;
  font-weight: 600;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.tc-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3.5px rgba(11, 85, 92, 0.13);
}

.tc-input-ltr {
  direction: ltr;
  text-align: left;
}

/* Segmented Controls & Chips */
.tc-segmented-4 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  padding: 5px;
  background: #e7f0ef;
  border-radius: 14px;
  margin-bottom: 16px;
}

.tc-seg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--text-muted);
  font-family: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}

.tc-seg-btn.active {
  background: #ffffff;
  color: var(--primary-dark);
  box-shadow: 0 2px 8px rgba(11, 56, 62, 0.1);
}

.tc-seg-btn.mine-highlight {
  color: #9a5308;
}

.tc-seg-btn.mine-highlight.active {
  background: #ffffff;
  color: var(--primary);
}

.tc-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.tc-chip {
  padding: 8px 13px;
  border-radius: 999px;
  border: 1.5px solid #c5dad8;
  background: #ffffff;
  color: #1f4448;
  font-family: inherit;
  font-size: 0.83rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tc-chip:hover {
  border-color: var(--primary);
}

.tc-chip.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #ffffff;
  box-shadow: 0 3px 10px rgba(11, 85, 92, 0.22);
}

/* Buttons */
.tc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 10px 15px;
  border-radius: 11px;
  border: 1px solid transparent;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.12s ease, opacity 0.15s ease, background 0.15s ease;
}

.tc-btn:active {
  transform: scale(0.98);
}

.tc-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.tc-btn-primary {
  width: 100%;
  padding: 13px 18px;
  background: linear-gradient(135deg, #0b555c 0%, #12706b 100%);
  color: #ffffff;
  font-size: 0.96rem;
  box-shadow: 0 5px 14px rgba(11, 85, 92, 0.22);
}

.tc-btn-primary:hover:not(:disabled) {
  opacity: 0.95;
}

.tc-btn-soft {
  background: var(--primary-light);
  color: var(--primary-dark);
  border-color: #c3e1df;
}

.tc-btn-soft:hover:not(:disabled) {
  background: #d8ecea;
}

.tc-btn-wa {
  background: #16a34a;
  color: #ffffff;
  box-shadow: 0 3px 10px rgba(22, 163, 74, 0.22);
}

.tc-btn-wa:hover {
  background: #15803d;
}

.tc-btn-call {
  background: #0d5c63;
  color: #ffffff;
}

.tc-btn-call:hover {
  background: #09444a;
}

.tc-btn-warn {
  background: var(--accent-soft);
  color: #9a5308;
  border-color: #f3d2a4;
}

.tc-btn-danger {
  background: var(--red-soft);
  color: var(--red);
  border-color: #f4c2c2;
}

.tc-btn-ghost {
  background: #ffffff;
  color: var(--text-muted);
  border-color: var(--border-strong);
}

.tc-btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

/* Listing Cards */
.tc-listing {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 13px;
  box-shadow: var(--shadow-sm);
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.tc-listing:hover {
  border-color: #b7d5d2;
  box-shadow: var(--shadow-md);
}

.tc-listing-own {
  border: 1.5px solid #0d5c63;
  background: linear-gradient(180deg, #f5fbfb 0%, #ffffff 42%);
}

.tc-listing-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.tc-price-tag {
  font-size: 0.92rem;
  font-weight: 800;
  color: var(--primary-dark);
  background: var(--accent-soft);
  border: 1px solid #f5d8aa;
  padding: 4px 10px;
  border-radius: 10px;
}

.tc-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
}

.tc-badge-own { background: #0b555c; color: #ffffff; }
.tc-badge-once { background: var(--sky-soft); color: var(--sky); }
.tc-badge-rec { background: var(--violet-soft); color: var(--violet); }
.tc-badge-ok { background: var(--green-soft); color: var(--green); }
.tc-badge-full { background: var(--red-soft); color: var(--red); }
.tc-badge-warn { background: var(--accent-soft); color: #9a5308; }
.tc-badge-neutral { background: #edf2f2; color: #385154; }

/* Route Timeline */
.tc-route-box {
  background: var(--surface-soft);
  border: 1px solid #e4efef;
  border-radius: 13px;
  padding: 12px 14px;
  margin-bottom: 12px;
}

.tc-route-point {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.96rem;
  font-weight: 800;
  color: var(--text);
}

.tc-dot-start {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--primary);
  box-shadow: 0 0 0 3px rgba(11, 85, 92, 0.18);
  flex-shrink: 0;
}

.tc-dot-end {
  width: 11px;
  height: 11px;
  border-radius: 3px;
  background: var(--accent);
  box-shadow: 0 0 0 3px rgba(217, 130, 43, 0.2);
  flex-shrink: 0;
}

.tc-route-line {
  width: 2px;
  min-height: 16px;
  margin: 3px 4.5px;
  border-right: 2px dashed #9cc0bc;
}

.tc-stops-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  margin: 6px 20px 6px 0;
}

.tc-stop-pill {
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--text-muted);
  background: #ffffff;
  border: 1px solid #d7e5e4;
  padding: 2px 8px;
  border-radius: 999px;
}

.tc-meta-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-size: 0.86rem;
  color: #2f4e52;
  margin-bottom: 12px;
}

.tc-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tc-notes-box {
  background: #fcfdfd;
  border-right: 3px solid var(--primary);
  padding: 8px 11px;
  border-radius: 8px;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.tc-listing-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 11px;
  border-top: 1px solid #ebf2f2;
}

/* Alerts & Code box */
.tc-alert {
  padding: 13px 15px;
  border-radius: 13px;
  font-size: 0.89rem;
  line-height: 1.65;
  margin-bottom: 14px;
}

.tc-alert-ok {
  background: var(--green-soft);
  border: 1px solid #96e0b3;
  color: #11532b;
}

.tc-alert-err {
  background: var(--red-soft);
  border: 1px solid #f4b8b8;
  color: #981b1b;
}

.tc-alert-info {
  background: var(--primary-light);
  border: 1px solid #bcdad7;
  color: var(--primary-dark);
}

.tc-code-box {
  margin-top: 10px;
  padding: 11px 13px;
  border-radius: 10px;
  background: #ffffff;
  border: 1.5px dashed #16a34a;
  font-family: monospace;
  font-size: 0.83rem;
  direction: ltr;
  text-align: left;
  word-break: break-all;
  color: var(--text);
}

/* Seat stepper */
.tc-seat-stepper {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--surface-soft);
  border: 1px solid var(--border-strong);
  border-radius: 11px;
  padding: 4px;
}

.tc-step-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: #ffffff;
  color: var(--primary-dark);
  font-family: inherit;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.tc-step-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Empty & Skeleton */
.tc-empty {
  text-align: center;
  padding: 28px 16px;
  color: var(--text-muted);
}

.tc-empty-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: var(--primary-light);
  color: var(--primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.tc-skeleton {
  height: 118px;
  border-radius: 15px;
  margin-bottom: 12px;
  background: linear-gradient(90deg, #edf3f3 25%, #f6fafa 50%, #edf3f3 75%);
  background-size: 200% 100%;
  animation: tcShimmer 1.3s infinite linear;
}

@keyframes tcShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Modal */
.tc-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(10, 32, 36, 0.52);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.tc-modal {
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  background: #ffffff;
  border-radius: 18px;
  padding: 20px 18px;
  box-shadow: 0 20px 48px rgba(10, 32, 36, 0.25);
  animation: tcFadeIn 0.18s ease;
}

/* Admin Stats */
.tc-admin-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.tc-admin-stat {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 13px 10px;
  text-align: center;
}

.tc-admin-stat-num {
  display: block;
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--primary-dark);
}

.tc-admin-stat-label {
  font-size: 0.77rem;
  color: var(--text-muted);
  font-weight: 700;
}

@media (min-width: 560px) {
  .tc-segmented-4 {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 720px) {
  .tc-app { padding-bottom: 44px; }
  .tc-desktop-nav { display: flex; }
  .tc-bottom-nav { display: none; }
  .tc-grid-2 { grid-template-columns: 1fr 1fr; }
  .tc-actions-grid { grid-template-columns: repeat(3, 1fr); }
  .tc-action-tile {
    flex-direction: column;
    align-items: flex-start;
    padding: 20px 18px;
  }
  .tc-tile-arrow { display: none; }
  .tc-info-grid { grid-template-columns: 1fr 1fr; }
  .tc-hero { padding: 34px 28px; }
  .tc-hero-title { font-size: 1.7rem; }
}
`;

function Icon({ name, size = 18 }) {
  const common = {
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

  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case 'ads':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 9h10" />
          <path d="M7 13h7" />
          <path d="M7 17h4" />
        </svg>
      );
    case 'car':
      return (
        <svg {...common}>
          <path d="M5 17h14v-5l-2-5H7l-2 5v5Z" />
          <circle cx="7.5" cy="17.5" r="1.5" />
          <circle cx="16.5" cy="17.5" r="1.5" />
          <path d="M5 12h14" />
        </svg>
      );
    case 'hand':
      return (
        <svg {...common}>
          <circle cx="12" cy="7" r="3" />
          <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 3 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-3Z" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'repeat':
      return (
        <svg {...common}>
          <path d="M17 2l4 4-4 4" />
          <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
          <path d="M7 22l-4-4 4-4" />
          <path d="M21 13v1a4 4 0 0 1-4 4H3" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg
          width={Math.max(size, 20)}
          height={Math.max(size, 20)}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      );
    case 'phone':
      return (
        <svg {...common}>
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.6a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6.3 6.3l1.3-1.3a2 2 0 0 1 2.1-.5c.8.4 1.7.6 2.6.7a2 2 0 0 1 1.7 2Z" />
        </svg>
      );
    case 'flag':
      return (
        <svg {...common}>
          <path d="M5 21V4" />
          <path d="M5 4h11l-2 4 2 4H5" />
        </svg>
      );
    case 'refresh':
      return (
        <svg {...common}>
          <path d="M21 12a9 9 0 1 1-2.6-6.4L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
      );
    case 'chevronLeft':
      return (
        <svg {...common}>
          <path d="m15 18-6-6 6-6" />
        </svg>
      );
    case 'copy':
      return (
        <svg {...common}>
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      );
    case 'edit':
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    case 'route':
      return (
        <svg {...common}>
          <circle cx="6" cy="19" r="3" />
          <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
          <circle cx="18" cy="5" r="3" />
        </svg>
      );
    case 'trash':
      return (
        <svg {...common}>
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
        </svg>
      );
    case 'campus':
      return (
        <svg {...common}>
          <path d="M2 10 12 5l10 5-10 5-10-5Z" />
          <path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
        </svg>
      );
    default:
      return null;
  }
}

function isRecurringType(type) {
  return type === 'daily' || type === 'weekdays';
}

function loadStorageList(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStorageList(key, list) {
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // تجاهل الخطأ إذا كان التخزين المحلي مقيداً
  }
}

function generateUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20
  )}-${hex.slice(20)}`;
}

function normalizeSudanNumber(raw) {
  if (!raw) return '';
  let digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00249')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0')) {
    digits = '249' + digits.slice(1);
  } else if (digits.length === 9 && digits.startsWith('9')) {
    digits = '249' + digits;
  }
  return digits;
}

function buildWhatsAppLink(rawPhone, message) {
  const num = normalizeSudanNumber(rawPhone);
  if (!num) return '';
  const encoded = encodeURIComponent(message || '');
  return `https://wa.me/${num}${encoded ? `?text=${encoded}` : ''}`;
}

function buildTelLink(rawPhone) {
  const num = normalizeSudanNumber(rawPhone);
  return num ? `tel:+${num}` : '';
}

function formatTimeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return '';
  const ago = (n, one, two, few, many) =>
    n === 1 ? `قبل ${one}` : n === 2 ? `قبل ${two}` : `قبل ${n} ${n <= 10 ? few : many}`;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'الآن';
  if (min < 60) return ago(min, 'دقيقة', 'دقيقتين', 'دقائق', 'دقيقة');
  const h = Math.floor(min / 60);
  if (h < 24) return ago(h, 'ساعة', 'ساعتين', 'ساعات', 'ساعة');
  const d = Math.floor(h / 24);
  return ago(d, 'يوم', 'يومين', 'أيام', 'يوماً');
}

function formatDateTime(iso) {
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

function formatTimeOnly(iso) {
  if (!iso) return 'غير محدد';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return d.toLocaleTimeString('ar-SD', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return d.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

function toDatetimeLocalValue(dateObj) {
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  if (Number.isNaN(d.getTime())) {
    return toDatetimeLocalValue(new Date(Date.now() + 60 * 60 * 1000));
  }
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatRecurrence(type, days) {
  if (type === 'daily') return 'يومياً';
  if (type === 'weekdays') {
    const namesMap = Object.fromEntries(WEEKDAYS.map((w) => [w.key, w.label]));
    const labels =
      Array.isArray(days) && days.length > 0
        ? days.map((k) => namesMap[k] || k).join('، ')
        : 'أيام محددة';
    return `أيام: ${labels}`;
  }
  return 'مرة واحدة';
}

function getEffectiveSortTimestamp(isoStr, recurrenceType) {
  const base = new Date(isoStr).getTime();
  if (Number.isNaN(base)) return Number.MAX_SAFE_INTEGER;
  const now = Date.now();
  if (!isRecurringType(recurrenceType) || base >= now) {
    return base;
  }
  const orig = new Date(base);
  const candidate = new Date(now);
  candidate.setHours(orig.getHours(), orig.getMinutes(), 0, 0);
  if (candidate.getTime() < now) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return candidate.getTime();
}

function parseManageCode(rawCode) {
  const cleaned = String(rawCode || '').trim();
  const idx = cleaned.indexOf('_');
  if (idx === -1) return null;
  const itemId = cleaned.slice(0, idx).trim();
  const manageToken = cleaned.slice(idx + 1).trim();
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(itemId) || !manageToken) return null;
  return { itemId, manageToken };
}

function AreaInput({ label, value, onChange, placeholder }) {
  const parsed = splitAreaValue(value);
  const [customMode, setCustomMode] = useState(Boolean(value) && !parsed.name);

  useEffect(() => {
    const p = splitAreaValue(value);
    if (value && !p.name) {
      setCustomMode(true);
    } else if (p.name) {
      setCustomMode(false);
    }
  }, [value]);

  const handleSelect = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setCustomMode(true);
      onChange('');
    } else {
      setCustomMode(false);
      onChange(val && parsed.detail ? `${val} (${parsed.detail})` : val);
    }
  };

  const setDetail = (d) => {
    const clean = d.replace(/[()]/g, '');
    onChange(clean ? `${parsed.name} (${clean})` : parsed.name);
  };

  return (
    <div className="tc-field">
      <label className="tc-label">
        {label} <span className="tc-req">*</span>
      </label>
      <select
        value={customMode ? '__custom__' : parsed.name}
        onChange={handleSelect}
        className="tc-input"
      >
        <option value="">-- اختر المنطقة --</option>
        {AREA_GROUPS.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </optgroup>
        ))}
        <option value="__custom__">منطقة أخرى (كتابة يدوية)...</option>
      </select>
      {!customMode && parsed.name && (
        <div style={{ marginTop: '8px' }}>
          <input
            type="text"
            maxLength={50}
            value={parsed.detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="تفاصيل المكان (اختياري): مثل مربع 1 جوار جامعة الرازي"
            className="tc-input"
          />
        </div>
      )}
      {customMode && (
        <div style={{ marginTop: '8px' }}>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || 'اكتب اسم المنطقة أو البوابة أو الداخلية'}
            className="tc-input"
            required
          />
        </div>
      )}
    </div>
  );
}

function AreaLabel({ value }) {
  const { name, detail } = splitAreaValue(value);
  if (!name) return <span>{value}</span>;
  return (
    <span>
      <strong>{name}</strong>
      {detail && (
        <span style={{ display: 'block', fontSize: '0.8rem', color: '#526b6e', fontWeight: 500 }}>
          {detail}
        </span>
      )}
    </span>
  );
}

function RouteTimeline({ start, destination, stops = [] }) {
  return (
    <div className="tc-route-box">
      <div className="tc-route-point">
        <span className="tc-dot-start" />
        <AreaLabel value={start} />
      </div>
      <div className="tc-route-line" />
      {Array.isArray(stops) && stops.length > 0 && (
        <div className="tc-stops-wrap">
          <span style={{ fontSize: '0.75rem', color: '#526b6e', fontWeight: 700 }}>
            يمر بـ:
          </span>
          {stops.map((st, idx) => (
            <span key={`${st}-${idx}`} className="tc-stop-pill">
              {st}
            </span>
          ))}
        </div>
      )}
      <div className="tc-route-point">
        <span className="tc-dot-end" />
        <AreaLabel value={destination} />
      </div>
    </div>
  );
}

const HOME_CSS = `
.tc-hero2 {
  position: relative; overflow: hidden; border-radius: 24px; color: #ffffff;
  min-height: 210px; padding: 20px 18px 16px; margin-top: 4px;
  display: flex; flex-direction: column; justify-content: space-between; gap: 16px;
  background-image: url('/hero.jpg'), url("%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' preserveAspectRatio='xMidYMid slice'%3E%3Cpath d='M-20 270 C 100 240 150 150 240 170 S 380 230 430 90' fill='none' stroke='%23b8f0dc' stroke-opacity='.4' stroke-width='3' stroke-dasharray='9 12' stroke-linecap='round'/%3E%3Cpath d='M0 -10 L2.5 -2.5 L10 0 L2.5 2.5 L0 10 L-2.5 2.5 L-10 0 L-2.5 -2.5 Z' transform='translate(50 50)' fill='%23f08a47' fill-opacity='0.85'/%3E%3Cpath d='M0 -8 L2.0 -2.0 L8 0 L2.0 2.0 L0 8 L-2.0 2.0 L-8 0 L-2.0 -2.0 Z' transform='translate(330 40)' fill='%23ffd28a' fill-opacity='0.85'/%3E%3Cpath d='M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z' transform='translate(190 90)' fill='%23ffffff' fill-opacity='0.6'/%3E%3Cpath d='M0 -9 L2.25 -2.25 L9 0 L2.25 2.25 L0 9 L-2.25 2.25 L-9 0 L-2.25 -2.25 Z' transform='translate(360 170)' fill='%23f08a47' fill-opacity='0.75'/%3E%3Cpath d='M0 -7 L1.75 -1.75 L7 0 L1.75 1.75 L0 7 L-1.75 1.75 L-7 0 L-1.75 -1.75 Z' transform='translate(70 200)' fill='%23ffd28a' fill-opacity='0.75'/%3E%3Cpath d='M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z' transform='translate(280 250)' fill='%23ffffff' fill-opacity='0.55'/%3E%3Ccircle cx='120' cy='140' r='2.5' fill='%23f08a47' fill-opacity='.6'/%3E%3Ccircle cx='250' cy='60' r='2' fill='%23ffffff' fill-opacity='.6'/%3E%3C/svg%3E"), linear-gradient(150deg, #1c8d76 0%, #0b555c 100%);
  background-size: cover, cover, cover;
  background-position: center, center, center;
  background-repeat: no-repeat, no-repeat, no-repeat;
  box-shadow: var(--shadow-md);
}
.tc-hero2::after {
  content: ''; position: absolute; top: 0; right: 0; bottom: 0; left: 0; pointer-events: none;
  background: linear-gradient(200deg, rgba(8, 64, 70, 0.55) 0%, rgba(8, 64, 70, 0) 62%);
}
.tc-hero2 > * { position: relative; z-index: 1; }
.tc-hero2-title { margin: 0; max-width: 80%; font-size: 1.4rem; font-weight: 800; line-height: 1.5; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.35); }
.tc-hero2-search {
  display: flex; align-items: center; gap: 10px; width: 100%; border: 0; cursor: pointer;
  background: rgba(255, 255, 255, 0.95); color: #5b7377; border-radius: 999px;
  padding: 13px 16px; font: inherit; font-size: 0.95rem; text-align: right;
}
.tc-act-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 14px 0; }
.tc-act {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
  min-height: 112px; padding: 16px 10px; border: 0; border-radius: 20px; cursor: pointer;
  font: inherit; font-weight: 800; font-size: 1rem; box-shadow: var(--shadow-sm);
}
.tc-act:active { transform: scale(0.98); }
.tc-act.dark { background: #0b555c; color: #ffffff; }
.tc-act.light { background: #ffffff; color: #073e44; border: 1px solid var(--border); }
.tc-act-ico { color: #e8873f; display: inline-flex; }
.tc-sec-head { display: flex; align-items: center; justify-content: space-between; margin: 18px 2px 10px; }
.tc-sec-head h2 { margin: 0; font-size: 1.1rem; color: #073e44; }
.tc-link-btn { background: none; border: 0; color: #d9632b; font: inherit; font-weight: 700; cursor: pointer; }
.tc-mini { background: #ffffff; border: 1px solid var(--border); border-radius: 18px; padding: 14px; margin-bottom: 10px; box-shadow: var(--shadow-sm); }
.tc-mini-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; color: #526b6e; font-size: 0.9rem; font-weight: 600; }
.tc-mini-foot { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; padding-top: 12px; border-top: 2px dashed #dbe7e4; }
.tc-mini-info { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; }
.tc-mini-foot .tc-btn { width: 100%; justify-content: center; }
.tc-howto summary { cursor: pointer; font-weight: 700; color: #0b555c; }
`;


const THEME_CSS = `
:root {
  --bg: #f4f8f7;
  --surface: #ffffff;
  --surface-soft: #f6faf9;
  --primary-light: #e3f3ee;
  --accent: #ec7a3c;
  --accent-soft: #fff0e2;
  --border: #e3ece9;
  --border-strong: #cddcd8;
  --shadow-sm: 0 2px 10px rgba(11, 85, 92, 0.08);
  --shadow-md: 0 8px 24px rgba(11, 85, 92, 0.14);
}
body { background: #f4f8f7; }
.tc-header {
  border-bottom: 3px solid var(--accent);
  background-image: url("%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 140' preserveAspectRatio='xMidYMid slice'%3E%3Cpath d='M-10 120 C 90 100 140 40 230 60 S 360 110 420 30' fill='none' stroke='%23b8f0dc' stroke-opacity='.32' stroke-width='2.5' stroke-dasharray='8 10' stroke-linecap='round'/%3E%3Cpath d='M0 -8 L2.0 -2.0 L8 0 L2.0 2.0 L0 8 L-2.0 2.0 L-8 0 L-2.0 -2.0 Z' transform='translate(36 28)' fill='%23f08a47' fill-opacity='0.8'/%3E%3Cpath d='M0 -5 L1.25 -1.25 L5 0 L1.25 1.25 L0 5 L-1.25 1.25 L-5 0 L-1.25 -1.25 Z' transform='translate(150 22)' fill='%23ffd28a' fill-opacity='0.8'/%3E%3Cpath d='M0 -7 L1.75 -1.75 L7 0 L1.75 1.75 L0 7 L-1.75 1.75 L-7 0 L-1.75 -1.75 Z' transform='translate(300 26)' fill='%23f08a47' fill-opacity='0.7'/%3E%3Cpath d='M0 -5 L1.25 -1.25 L5 0 L1.25 1.25 L0 5 L-1.25 1.25 L-5 0 L-1.25 -1.25 Z' transform='translate(370 92)' fill='%23ffd28a' fill-opacity='0.8'/%3E%3Cpath d='M0 -5 L1.25 -1.25 L5 0 L1.25 1.25 L0 5 L-1.25 1.25 L-5 0 L-1.25 -1.25 Z' transform='translate(90 100)' fill='%23ffffff' fill-opacity='0.5'/%3E%3Cpath d='M0 -4 L1.0 -1.0 L4 0 L1.0 1.0 L0 4 L-1.0 1.0 L-4 0 L-1.0 -1.0 Z' transform='translate(220 112)' fill='%23ffffff' fill-opacity='0.5'/%3E%3Ccircle cx='190' cy='70' r='2' fill='%23ffffff' fill-opacity='.6'/%3E%3Ccircle cx='330' cy='60' r='2' fill='%23f08a47' fill-opacity='.6'/%3E%3C/svg%3E"), linear-gradient(135deg, #0b555c 0%, #12776a 100%);
  background-size: cover, cover;
  background-position: center, center;
  background-repeat: no-repeat, no-repeat;
}
.tc-listing { background: #ffffff; border: 1px solid var(--border); border-radius: 20px; box-shadow: var(--shadow-sm); }
.tc-listing-own { border: 1.5px solid #0d5c63; background: linear-gradient(180deg, #f1faf7 0%, #ffffff 45%); }
.tc-listing-footer { border-top: 2px dashed #dbe7e4; }
.tc-route-line { border-right: 2px dashed var(--accent); }
.tc-dot-start { background: #0b555c; box-shadow: 0 0 0 3px rgba(11, 85, 92, 0.15); }
.tc-dot-end { background: var(--accent); box-shadow: 0 0 0 3px rgba(236, 122, 60, 0.18); }
.tc-badge-once { background: #ffe9d6; color: #c4561f; }
.tc-badge-rec { background: #dff3ec; color: #0b6b5e; }
.tc-btn-primary { background: linear-gradient(135deg, #f08a47 0%, #e8703f 100%); }
.tc-btn-call { background: #0b555c; }
.tc-btn-call:hover { background: #084046; }
.tc-btn-danger { background: #ffffff; color: #c0392b; border: 1.5px solid #f1c9c4; }
.tc-btn-danger:hover { background: #fdecea; }
.tc-bottom-nav { background: rgba(255, 255, 255, 0.97); border-top: 1px solid var(--border); }
.tc-bottom-btn.active { color: #0b555c; background: #e3f3ee; }
.tc-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3.5px rgba(236, 122, 60, 0.18); }
.tc-price-muted { font-size: 0.82rem; color: #6b8184; font-weight: 600; }
.tc-toast {
  position: fixed; left: 12px; right: 12px; bottom: 96px; z-index: 1000;
  max-width: 520px; margin: 0 auto; padding: 14px 16px; border-radius: 16px;
  background: #0b555c; color: #ffffff; font-weight: 700; text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28); animation: tc-toast-in 0.25s ease;
}
.tc-toast-error { background: #b3382c; }
@keyframes tc-toast-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.tc-form-section-title { color: #0b555c; }
.tc-form-section-title svg { color: var(--accent); }
.tc-form-section + .tc-form-section { border-top: 2px dashed #cfe3dd; margin-top: 18px; padding-top: 16px; }
`;

export default function App() {
  const [tab, setTab] = useState(TABS.HOME);
  const [boardSection, setBoardSection] = useState('all'); // 'all' | 'offers' | 'requests' | 'mine'

  // حالة الإعلانات والبحث
  const [offers, setOffers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardError, setBoardError] = useState('');
  const [searchStart, setSearchStart] = useState('');
  const [searchDest, setSearchDest] = useState('');
  const [searchTripKind, setSearchTripKind] = useState('all');

  // إعلاناتي المحفوظة محلياً (عروض + طلبات)
  const [myOffers, setMyOffers] = useState(() => loadStorageList(MY_OFFERS_STORAGE_KEY));
  const [myRequests, setMyRequests] = useState(() =>
    loadStorageList(MY_REQUESTS_STORAGE_KEY)
  );
  const [busyItemId, setBusyItemId] = useState('');
  const [ownerFeedback, setOwnerFeedback] = useState({ type: '', text: '' });
  const [copiedId, setCopiedId] = useState('');

  // نافذة تعديل الإعلان (عرض سائق أو طلب طالب)
  const [editModal, setEditModal] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // إدارة يدوية بالرمز من جهاز آخر
  const [manualKind, setManualKind] = useState('offer');
  const [manualCode, setManualCode] = useState('');
  const [manualSeats, setManualSeats] = useState(1);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualFeedback, setManualFeedback] = useState({ type: '', text: '' });

  // حالة الإبلاغ
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMsg, setReportMsg] = useState({ type: '', text: '' });

  // نموذج عرض السائق
  const initialFutureTime = useMemo(
    () => toDatetimeLocalValue(new Date(Date.now() + 60 * 60 * 1000)),
    []
  );

  const [offerForm, setOfferForm] = useState({
    driver_name: '',
    whatsapp_number: '',
    phone_number: '',
    vehicle_type: '',
    start_area: '',
    destination_area: '',
    intermediate_stops_input: '',
    departure_time: initialFutureTime,
    recurrence_type: 'once',
    recurrence_days: [],
    total_seats: 4,
    available_seats: 3,
    price_per_seat: 0,
    expires_after_hours: 3,
    return_time: '',
    notes: '',
    recurring_valid_days: 14,
  });
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerError, setOfferError] = useState('');

  // إشعار عائم يظهر في أسفل الشاشة مهما كان مكان التمرير
  const [toast, setToast] = useState(null);
  const showToast = (text, kind = 'ok') => setToast({ text, kind, id: Date.now() });
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (offerError) showToast(offerError, 'error');
  }, [offerError]);
  const [savedOfferCode, setSavedOfferCode] = useState('');

  // نموذج طلب توصيلة / ترحيل للطالب
  const [requestForm, setRequestForm] = useState({
    passenger_name: '',
    whatsapp_number: '',
    phone_number: '',
    start_area: '',
    destination_area: '',
    preferred_time: initialFutureTime,
    recurrence_type: 'once',
    recurrence_days: [],
    seats_needed: 1,
    notes: '',
    expires_after_hours: 3,
    recurring_valid_days: 14,
  });
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestError, setRequestError] = useState('');
  useEffect(() => {
    if (requestError) showToast(requestError, 'error');
  }, [requestError]);
  const [savedRequestCode, setSavedRequestCode] = useState('');

  // تبويب الإدارة
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [adminReports, setAdminReports] = useState([]);
  const [adminOffers, setAdminOffers] = useState([]);
  const [adminRequests, setAdminRequests] = useState([]);
  const [adminDataLoading, setAdminDataLoading] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState({ type: '', text: '' });

  const persistMyOffers = (updater) => {
    setMyOffers((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveStorageList(MY_OFFERS_STORAGE_KEY, next);
      return next;
    });
  };

  const persistMyRequests = (updater) => {
    setMyRequests((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveStorageList(MY_REQUESTS_STORAGE_KEY, next);
      return next;
    });
  };

  const myOffersById = useMemo(
    () => Object.fromEntries(myOffers.map((item) => [item.id, item])),
    [myOffers]
  );

  const myRequestsById = useMemo(
    () => Object.fromEntries(myRequests.map((item) => [item.id, item])),
    [myRequests]
  );

  const fetchPublicListings = async () => {
    if (!supabase) {
      setBoardError(
        'متغيرات البيئة غير مضبوطة (VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY).'
      );
      return;
    }
    setBoardLoading(true);
    setBoardError('');
    try {
      const nowIso = new Date().toISOString();
      let [offersRes, requestsRes] = await Promise.all([
        supabase
          .from('ride_offers')
          .select(OFFER_PUBLIC_COLUMNS)
          .gt('expires_at', nowIso)
          .in('status', ['active', 'full'])
          .order('departure_time', { ascending: true })
          .order('created_at', { ascending: false }),
        supabase
          .from('ride_requests')
          .select(REQUEST_PUBLIC_COLUMNS)
          .gt('expires_at', nowIso)
          .eq('status', 'active')
          .order('preferred_time', { ascending: true })
          .order('created_at', { ascending: false }),
      ]);

      if (offersRes.error && /return_time|notes|column/i.test(offersRes.error.message || '')) {
        const baseCols = OFFER_PUBLIC_COLUMNS.replace(', return_time', '').replace(', notes', '');
        offersRes = await supabase
          .from('ride_offers')
          .select(baseCols)
          .gt('expires_at', nowIso)
          .in('status', ['active', 'full'])
          .order('departure_time', { ascending: true })
          .order('created_at', { ascending: false });
      }
      if (offersRes.error) throw offersRes.error;
      if (requestsRes.error) throw requestsRes.error;

      const liveOffers = offersRes.data || [];
      const liveRequests = requestsRes.data || [];
      setOffers(liveOffers);
      setRequests(liveRequests);

      if (liveOffers.length > 0) {
        const liveMap = Object.fromEntries(liveOffers.map((o) => [o.id, o]));
        persistMyOffers((prev) =>
          prev.map((item) => {
            const match = liveMap[item.id];
            if (!match) return item;
            return {
              ...item,
              vehicle_type: match.vehicle_type,
              start_area: match.start_area,
              destination_area: match.destination_area,
              intermediate_stops: match.intermediate_stops || [],
              departure_time: match.departure_time,
              total_seats: match.total_seats,
              available_seats: match.available_seats,
              price_per_seat: match.price_per_seat,
              status: match.status,
              expires_at: match.expires_at,
              recurrence_type: match.recurrence_type,
              recurrence_days: match.recurrence_days,
            };
          })
        );
      }

      if (liveRequests.length > 0) {
        const liveReqMap = Object.fromEntries(liveRequests.map((r) => [r.id, r]));
        persistMyRequests((prev) =>
          prev.map((item) => {
            const match = liveReqMap[item.id];
            if (!match) return item;
            return {
              ...item,
              start_area: match.start_area,
              destination_area: match.destination_area,
              preferred_time: match.preferred_time,
              seats_needed: match.seats_needed,
              notes: match.notes || '',
              status: match.status,
              expires_at: match.expires_at,
              recurrence_type: match.recurrence_type,
              recurrence_days: match.recurrence_days,
            };
          })
        );
      }
    } catch (err) {
      setBoardError(
        err?.message || 'تعذر تحميل الإعلانات حالياً. تأكد من اتصالك بالإنترنت.'
      );
    } finally {
      setBoardLoading(false);
    }
  };

  const verifyAdminRole = async (nextSession) => {
    if (!supabase || !nextSession?.user?.id) {
      setIsAdmin(false);
      return;
    }
    setAdminCheckLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', nextSession.user.id)
        .maybeSingle();

      if (error) throw error;
      setIsAdmin(Boolean(data && data.user_id));
    } catch {
      setIsAdmin(false);
    } finally {
      setAdminCheckLoading(false);
    }
  };

  const fetchAdminDashboard = async () => {
    if (!supabase || !isAdmin) return;
    setAdminDataLoading(true);
    try {
      const [repRes, offRes, reqRes] = await Promise.all([
        supabase
          .from('reports')
          .select('id, target_type, offer_id, request_id, reason, details, status, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('ride_offers')
          .select(OFFER_PUBLIC_COLUMNS)
          .order('created_at', { ascending: false }),
        supabase
          .from('ride_requests')
          .select(REQUEST_PUBLIC_COLUMNS)
          .order('created_at', { ascending: false }),
      ]);

      if (repRes.error) throw repRes.error;
      if (offRes.error) throw offRes.error;
      if (reqRes.error) throw reqRes.error;

      setAdminReports(repRes.data || []);
      setAdminOffers(offRes.data || []);
      setAdminRequests(reqRes.data || []);
    } catch (err) {
      setAdminFeedback({
        type: 'error',
        text: err?.message || 'تعذر تحميل بيانات لوحة الإدارة.',
      });
    } finally {
      setAdminDataLoading(false);
    }
  };

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      const current = data?.session || null;
      setSession(current);
      verifyAdminRole(current);
    });

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      verifyAdminRole(nextSession);
    });

    return () => {
      authSub?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (tab === TABS.ADS || tab === TABS.HOME) {
      fetchPublicListings();
    }
  }, [tab]);

  useEffect(() => {
    if (tab === TABS.ADMIN && session && isAdmin) {
      fetchAdminDashboard();
    }
  }, [tab, session, isAdmin]);

  const filteredOffers = useMemo(() => {
    const startQ = searchStart.trim().toLowerCase();
    const destQ = searchDest.trim().toLowerCase();
    const nowMs = Date.now();
    return offers
      .filter((o) => new Date(o.expires_at).getTime() > nowMs)
      .filter((o) => o.status === 'active' || o.status === 'full')
      .filter((o) => {
        const recurring = isRecurringType(o.recurrence_type);
        if (searchTripKind === 'once' && recurring) return false;
        if (searchTripKind === 'recurring' && !recurring) return false;
        return true;
      })
      .filter((o) =>
        routeMatches(
          { start: o.start_area, dest: o.destination_area, stops: o.intermediate_stops },
          searchStart,
          searchDest,
          isRecurringType(o.recurrence_type)
        )
      )
      .sort((a, b) => {
        const depDiff =
          getEffectiveSortTimestamp(a.departure_time, a.recurrence_type) -
          getEffectiveSortTimestamp(b.departure_time, b.recurrence_type);
        if (depDiff !== 0) return depDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [offers, searchStart, searchDest, searchTripKind]);

  const filteredRequests = useMemo(() => {
    const startQ = searchStart.trim().toLowerCase();
    const destQ = searchDest.trim().toLowerCase();
    const nowMs = Date.now();
    return requests
      .filter((r) => new Date(r.expires_at).getTime() > nowMs)
      .filter((r) => r.status === 'active')
      .filter((r) => {
        const recurring = isRecurringType(r.recurrence_type);
        if (searchTripKind === 'once' && recurring) return false;
        if (searchTripKind === 'recurring' && !recurring) return false;
        return true;
      })
      .filter((r) =>
        routeMatches(
          { start: r.start_area, dest: r.destination_area, stops: [] },
          searchStart,
          searchDest,
          isRecurringType(r.recurrence_type)
        )
      )
      .sort((a, b) => {
        const timeDiff =
          getEffectiveSortTimestamp(a.preferred_time, a.recurrence_type) -
          getEffectiveSortTimestamp(b.preferred_time, b.recurrence_type);
        if (timeDiff !== 0) return timeDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [requests, searchStart, searchDest, searchTripKind]);

  const totalLiveAds = filteredOffers.length + filteredRequests.length;
  const totalMyAdsCount = myOffers.length + myRequests.length;

  const pendingReportsCount = useMemo(
    () => adminReports.filter((r) => r.status === 'pending').length,
    [adminReports]
  );

  const adminOffersMap = useMemo(
    () => Object.fromEntries(adminOffers.map((o) => [o.id, o])),
    [adminOffers]
  );

  const adminRequestsMap = useMemo(
    () => Object.fromEntries(adminRequests.map((r) => [r.id, r])),
    [adminRequests]
  );

  const handleCopyText = async (text, key) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(key);
      setTimeout(() => setCopiedId(''), 2200);
    } catch {
      setCopiedId('');
    }
  };

  const toggleOfferRecurrenceDay = (dayKey) => {
    setOfferForm((prev) => {
      const exists = prev.recurrence_days.includes(dayKey);
      return {
        ...prev,
        recurrence_days: exists
          ? prev.recurrence_days.filter((k) => k !== dayKey)
          : [...prev.recurrence_days, dayKey],
      };
    });
  };

  const toggleRequestRecurrenceDay = (dayKey) => {
    setRequestForm((prev) => {
      const exists = prev.recurrence_days.includes(dayKey);
      return {
        ...prev,
        recurrence_days: exists
          ? prev.recurrence_days.filter((k) => k !== dayKey)
          : [...prev.recurrence_days, dayKey],
      };
    });
  };

  const handlePublishOffer = async (e) => {
    e.preventDefault();
    setOfferError('');
    setSavedOfferCode('');

    if (!supabase) {
      setOfferError('إعدادات الاتصال بقاعدة البيانات غير مكتملة.');
      return;
    }

    const driverName = offerForm.driver_name.trim();
    const whatsapp = offerForm.whatsapp_number.trim();
    const phone = offerForm.phone_number.trim();
    const vehicleType = offerForm.vehicle_type.trim();
    const startArea = offerForm.start_area.trim();
    const destArea = offerForm.destination_area.trim();
    const totalSeats = parseInt(offerForm.total_seats, 10);
    const availableSeats = parseInt(offerForm.available_seats, 10);
    const pricePerSeat = Number(offerForm.price_per_seat);
    const recurring = isRecurringType(offerForm.recurrence_type);

    if (driverName.length < 2) {
      setOfferError('يرجى إدخال اسم السائق (حرفان على الأقل).');
      return;
    }
    if (whatsapp.length < 7) {
      setOfferError('يرجى إدخال رقم واتساب صحيح (7 أرقام على الأقل).');
      return;
    }
    if (vehicleType.length < 2) {
      setOfferError('يرجى تحديد نوع العربة (حرفان على الأقل).');
      return;
    }
    if (startArea.length < 2 || destArea.length < 2) {
      setOfferError('يرجى تحديد منطقة الانطلاق والوجهة بشكل صحيح.');
      return;
    }
    if (!offerForm.departure_time) {
      setOfferError('يرجى تحديد موعد التحرك.');
      return;
    }

    const depDate = new Date(offerForm.departure_time);
    if (Number.isNaN(depDate.getTime()) || depDate.getTime() <= Date.now()) {
      setOfferError('يجب أن يكون موعد التحرك في المستقبل.');
      return;
    }

    if (Number.isNaN(totalSeats) || totalSeats < 1 || totalSeats > 50) {
      setOfferError('إجمالي المقاعد يجب أن يكون بين 1 و 50.');
      return;
    }
    if (
      Number.isNaN(availableSeats) ||
      availableSeats < 0 ||
      availableSeats > 50 ||
      availableSeats > totalSeats
    ) {
      setOfferError('المقاعد المتاحة يجب أن تكون بين 0 وإجمالي المقاعد.');
      return;
    }
    if (Number.isNaN(pricePerSeat) || pricePerSeat < 0) {
      setOfferError('السعر للمقعد يجب أن يكون صفراً أو أكبر.');
      return;
    }
    if (
      offerForm.recurrence_type === 'weekdays' &&
      offerForm.recurrence_days.length === 0
    ) {
      setOfferError('يرجى اختيار يوم واحد على الأقل للترحيل المنتظم.');
      return;
    }

    const stopsArray = offerForm.intermediate_stops_input
      .split(/[,،\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (stopsArray.some((s) => s.length > 40)) {
      setOfferError(
        'اسم المحطة في خانة "يمر بـ" لازم يكون قصيراً (أقل من 40 حرفاً). اكتب التفاصيل الطويلة في خانة الملاحظات.'
      );
      return;
    }
    const returnTime =
      recurring && /^([01]\d|2[0-3]):[0-5]\d$/.test(offerForm.return_time || '')
        ? offerForm.return_time
        : null;
    const offerNotes = (offerForm.notes || '').trim().slice(0, 300);

    const expiresDate = recurring
      ? new Date(
          depDate.getTime() +
            Math.max(1, Number(offerForm.recurring_valid_days) || 14) *
              24 *
              60 *
              60 *
              1000
        )
      : new Date(
          depDate.getTime() +
            Math.max(1, Number(offerForm.expires_after_hours) || 3) *
              60 *
              60 *
              1000
        );

    const generatedId = generateUuid();
    const generatedToken = generateUuid();

    const payload = {
      id: generatedId,
      driver_name: driverName,
      whatsapp_number: whatsapp,
      phone_number: phone || null,
      vehicle_type: vehicleType,
      start_area: startArea,
      destination_area: destArea,
      intermediate_stops: stopsArray,
      departure_time: depDate.toISOString(),
      recurrence_type: offerForm.recurrence_type,
      recurrence_days:
        offerForm.recurrence_type === 'weekdays' ? offerForm.recurrence_days : [],
      recurrence_group_id: recurring ? generateUuid() : null,
      total_seats: totalSeats,
      available_seats: availableSeats,
      price_per_seat: pricePerSeat,
      status: 'active',
      expires_at: expiresDate.toISOString(),
      manage_token: generatedToken,
    };
    if (returnTime) payload.return_time = returnTime;
    if (offerNotes) payload.notes = offerNotes;

    setOfferSubmitting(true);
    try {
      const { error } = await supabase.from('ride_offers').insert(payload);
      if (error) throw error;

      const combinedCode = `${generatedId}_${generatedToken}`;
      setSavedOfferCode(combinedCode);

      persistMyOffers((prev) => [
        {
          id: generatedId,
          manageToken: generatedToken,
          manageCode: combinedCode,
          driver_name: driverName,
          vehicle_type: vehicleType,
          start_area: startArea,
          destination_area: destArea,
          intermediate_stops: stopsArray,
          departure_time: depDate.toISOString(),
          recurrence_type: offerForm.recurrence_type,
          recurrence_days:
            offerForm.recurrence_type === 'weekdays' ? offerForm.recurrence_days : [],
          expires_at: expiresDate.toISOString(),
          total_seats: totalSeats,
          available_seats: availableSeats,
          price_per_seat: pricePerSeat,
          status: availableSeats === 0 ? 'full' : 'active',
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);

      setOfferForm({
        driver_name: '',
        whatsapp_number: '',
        phone_number: '',
        vehicle_type: '',
        start_area: '',
        destination_area: '',
        intermediate_stops_input: '',
        departure_time: toDatetimeLocalValue(new Date(Date.now() + 60 * 60 * 1000)),
        recurrence_type: 'once',
        recurrence_days: [],
        total_seats: 4,
        available_seats: 3,
        price_per_seat: 0,
        expires_after_hours: 3,
        return_time: '',
        notes: '',
        recurring_valid_days: 14,
      });
      showToast('تم نشر عرضك بنجاح ✓ احتفظ برمز الإدارة');
      setTimeout(() => {
        const el = document.getElementById('tc-offer-success');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (err) {
      setOfferError(err?.message || 'حدث خطأ أثناء نشر العرض.');
    } finally {
      setOfferSubmitting(false);
    }
  };

  const handlePublishRequest = async (e) => {
    e.preventDefault();
    setRequestError('');
    setSavedRequestCode('');

    if (!supabase) {
      setRequestError('إعدادات الاتصال بقاعدة البيانات غير مكتملة.');
      return;
    }

    const passengerName = requestForm.passenger_name.trim();
    const whatsapp = requestForm.whatsapp_number.trim();
    const phone = requestForm.phone_number.trim();
    const startArea = requestForm.start_area.trim();
    const destArea = requestForm.destination_area.trim();
    const seatsNeeded = parseInt(requestForm.seats_needed, 10);
    const notes = requestForm.notes.trim();
    const recurring = isRecurringType(requestForm.recurrence_type);

    if (passengerName.length < 2) {
      setRequestError('يرجى إدخال الاسم (حرفان على الأقل).');
      return;
    }
    if (whatsapp.length < 7) {
      setRequestError('يرجى إدخال رقم واتساب صحيح (7 أرقام على الأقل).');
      return;
    }
    if (startArea.length < 2 || destArea.length < 2) {
      setRequestError('يرجى تحديد منطقة الانطلاق والوجهة بشكل صحيح.');
      return;
    }
    if (!requestForm.preferred_time) {
      setRequestError('يرجى تحديد وقت التحرك.');
      return;
    }

    const prefDate = new Date(requestForm.preferred_time);
    if (Number.isNaN(prefDate.getTime()) || prefDate.getTime() <= Date.now()) {
      setRequestError('يجب أن يكون وقت التحرك في المستقبل.');
      return;
    }

    if (Number.isNaN(seatsNeeded) || seatsNeeded < 1 || seatsNeeded > 20) {
      setRequestError('عدد المقاعد المطلوبة يجب أن يكون بين 1 و 20.');
      return;
    }

    if (
      requestForm.recurrence_type === 'weekdays' &&
      requestForm.recurrence_days.length === 0
    ) {
      setRequestError('يرجى اختيار يوم واحد على الأقل لطلب الترحيل المنتظم.');
      return;
    }

    const expiresDate = recurring
      ? new Date(
          prefDate.getTime() +
            Math.max(1, Number(requestForm.recurring_valid_days) || 14) *
              24 *
              60 *
              60 *
              1000
        )
      : new Date(
          prefDate.getTime() +
            Math.max(1, Number(requestForm.expires_after_hours) || 3) *
              60 *
              60 *
              1000
        );

    const generatedId = generateUuid();
    const generatedToken = generateUuid();

    const payload = {
      id: generatedId,
      passenger_name: passengerName,
      whatsapp_number: whatsapp,
      phone_number: phone || null,
      start_area: startArea,
      destination_area: destArea,
      preferred_time: prefDate.toISOString(),
      recurrence_type: requestForm.recurrence_type,
      recurrence_days:
        requestForm.recurrence_type === 'weekdays' ? requestForm.recurrence_days : [],
      seats_needed: seatsNeeded,
      notes: notes || null,
      status: 'active',
      expires_at: expiresDate.toISOString(),
      manage_token: generatedToken,
    };

    setRequestSubmitting(true);
    try {
      const { error } = await supabase.from('ride_requests').insert(payload);
      if (error) throw error;

      const combinedCode = `${generatedId}_${generatedToken}`;
      setSavedRequestCode(combinedCode);

      persistMyRequests((prev) => [
        {
          id: generatedId,
          manageToken: generatedToken,
          manageCode: combinedCode,
          passenger_name: passengerName,
          start_area: startArea,
          destination_area: destArea,
          preferred_time: prefDate.toISOString(),
          recurrence_type: requestForm.recurrence_type,
          recurrence_days:
            requestForm.recurrence_type === 'weekdays' ? requestForm.recurrence_days : [],
          seats_needed: seatsNeeded,
          notes,
          status: 'active',
          expires_at: expiresDate.toISOString(),
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);

      setRequestForm({
        passenger_name: '',
        whatsapp_number: '',
        phone_number: '',
        start_area: '',
        destination_area: '',
        preferred_time: toDatetimeLocalValue(new Date(Date.now() + 60 * 60 * 1000)),
        recurrence_type: 'once',
        recurrence_days: [],
        seats_needed: 1,
        notes: '',
        expires_after_hours: 3,
        recurring_valid_days: 14,
      });
      showToast('تم نشر طلبك بنجاح ✓ سيتواصل معك السائقون عبر واتساب');
      setTimeout(() => {
        const el = document.getElementById('tc-request-success');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (err) {
      setRequestError(err?.message || 'حدث خطأ أثناء نشر الطلب.');
    } finally {
      setRequestSubmitting(false);
    }
  };

  const handleOwnOfferSeatsOrStatus = async (ownItem, nextSeats, nextStatus) => {
    setOwnerFeedback({ type: '', text: '' });
    if (!supabase || !ownItem) return;

    if (nextStatus === 'closed') {
      const confirmed = window.confirm(
        'هل تريد إغلاق هذا العرض؟ سيختفي فوراً من قائمة الإعلانات.'
      );
      if (!confirmed) return;
    }

    const total = Math.max(1, Number(ownItem.total_seats) || 1);
    const clampedSeats =
      nextStatus === 'full' || nextStatus === 'closed'
        ? 0
        : Math.max(0, Math.min(total, Number(nextSeats) || 0));

    const effectiveStatus =
      nextStatus === 'closed'
        ? 'closed'
        : clampedSeats === 0 || nextStatus === 'full'
        ? 'full'
        : 'active';

    setBusyItemId(ownItem.id);
    try {
      const { data, error } = await supabase.rpc('driver_manage_offer', {
        p_offer_id: ownItem.id,
        p_manage_token: ownItem.manageToken,
        p_available_seats: clampedSeats,
        p_status: effectiveStatus,
      });

      if (error) throw error;
      if (!data) {
        setOwnerFeedback({
          type: 'error',
          text: 'تعذر تحديث الإعلان؛ ربما تم حذفه سابقاً أو انتهت صلاحيته.',
        });
        return;
      }

      persistMyOffers((prev) =>
        prev.map((entry) =>
          entry.id === ownItem.id
            ? { ...entry, available_seats: clampedSeats, status: effectiveStatus }
            : entry
        )
      );

      setOwnerFeedback({
        type: 'ok',
        text:
          effectiveStatus === 'closed'
            ? 'تم إغلاق عرضك بنجاح ولن يظهر للباحثين.'
            : effectiveStatus === 'full'
            ? 'تم تعليم رحلتك كمكتملة (0 مقاعد متاحة).'
            : `تم تحديث المقاعد المتاحة إلى ${clampedSeats} من ${total}.`,
      });
      fetchPublicListings();
    } catch (err) {
      setOwnerFeedback({
        type: 'error',
        text: err?.message || 'حدث خطأ أثناء تحديث الإعلان.',
      });
    } finally {
      setBusyItemId('');
    }
  };

  const handleOwnOfferDelete = async (ownItem) => {
    if (!supabase || !ownItem) return;
    const confirmed = window.confirm(
      'هل أنت متأكد من حذف هذا العرض نهائياً من الموقع؟ لا يمكن التراجع عن الحذف.'
    );
    if (!confirmed) return;

    setOwnerFeedback({ type: '', text: '' });
    setBusyItemId(ownItem.id);
    try {
      const { data, error } = await supabase.rpc('driver_delete_offer', {
        p_offer_id: ownItem.id,
        p_manage_token: ownItem.manageToken,
      });
      if (error) throw error;

      persistMyOffers((prev) => prev.filter((item) => item.id !== ownItem.id));
      setOwnerFeedback({
        type: 'ok',
        text: data
          ? 'تم حذف عرضك نهائياً من الموقع.'
          : 'كان العرض محذوفاً مسبقاً وتمت إزالته من جهازك.',
      });
      fetchPublicListings();
    } catch (err) {
      setOwnerFeedback({
        type: 'error',
        text: err?.message || 'حدث خطأ أثناء حذف العرض.',
      });
    } finally {
      setBusyItemId('');
    }
  };

  const handleOwnRequestStatus = async (ownReq, nextStatus) => {
    if (!supabase || !ownReq) return;
    if (nextStatus === 'closed') {
      const confirmed = window.confirm(
        'هل تريد إغلاق طلبك (لقيت توصيلة)؟ سيختفي فوراً من قائمة الإعلانات.'
      );
      if (!confirmed) return;
    }

    setOwnerFeedback({ type: '', text: '' });
    setBusyItemId(ownReq.id);
    try {
      const { data, error } = await supabase.rpc('passenger_manage_request', {
        p_request_id: ownReq.id,
        p_manage_token: ownReq.manageToken,
        p_status: nextStatus,
      });
      if (error) throw error;
      if (!data) {
        setOwnerFeedback({
          type: 'error',
          text: 'تعذر تحديث حالة الطلب؛ ربما تم حذفه سابقاً.',
        });
        return;
      }

      persistMyRequests((prev) =>
        prev.map((item) =>
          item.id === ownReq.id ? { ...item, status: nextStatus } : item
        )
      );
      setOwnerFeedback({
        type: 'ok',
        text:
          nextStatus === 'closed'
            ? 'تم إغلاق طلبك بنجاح (لقيت توصيلة).'
            : 'تمت إعادة تفعيل طلبك بنجاح.',
      });
      fetchPublicListings();
    } catch (err) {
      setOwnerFeedback({
        type: 'error',
        text: err?.message || 'حدث خطأ أثناء تحديث الطلب.',
      });
    } finally {
      setBusyItemId('');
    }
  };

  const handleOwnRequestDelete = async (ownReq) => {
    if (!supabase || !ownReq) return;
    const confirmed = window.confirm(
      'هل أنت متأكد من حذف هذا الطلب نهائياً من الموقع؟ لا يمكن التراجع عن الحذف.'
    );
    if (!confirmed) return;

    setOwnerFeedback({ type: '', text: '' });
    setBusyItemId(ownReq.id);
    try {
      const { data, error } = await supabase.rpc('passenger_delete_request', {
        p_request_id: ownReq.id,
        p_manage_token: ownReq.manageToken,
      });
      if (error) throw error;

      persistMyRequests((prev) => prev.filter((item) => item.id !== ownReq.id));
      setOwnerFeedback({
        type: 'ok',
        text: data
          ? 'تم حذف طلبك نهائياً من الموقع.'
          : 'كان الطلب محذوفاً مسبقاً وتمت إزالته من جهازك.',
      });
      fetchPublicListings();
    } catch (err) {
      setOwnerFeedback({
        type: 'error',
        text: err?.message || 'حدث خطأ أثناء حذف الطلب.',
      });
    } finally {
      setBusyItemId('');
    }
  };

  const openEditOfferModal = (ownItem, liveSource) => {
    const src = liveSource || ownItem;
    setEditError('');
    setEditModal({
      kind: 'offer',
      id: ownItem.id,
      manageToken: ownItem.manageToken,
      recurrence_type: src.recurrence_type || 'once',
      vehicle_type: src.vehicle_type || '',
      start_area: src.start_area || '',
      destination_area: src.destination_area || '',
      intermediate_stops_input: Array.isArray(src.intermediate_stops)
        ? src.intermediate_stops.join('، ')
        : '',
      departure_time: toDatetimeLocalValue(src.departure_time),
      total_seats: Number(src.total_seats) || 4,
      available_seats: Number(src.available_seats) || 0,
      price_per_seat: Number(src.price_per_seat) || 0,
    });
  };

  const openEditRequestModal = (ownReq, liveSource) => {
    const src = liveSource || ownReq;
    setEditError('');
    setEditModal({
      kind: 'request',
      id: ownReq.id,
      manageToken: ownReq.manageToken,
      recurrence_type: src.recurrence_type || 'once',
      start_area: src.start_area || '',
      destination_area: src.destination_area || '',
      preferred_time: toDatetimeLocalValue(src.preferred_time),
      seats_needed: Number(src.seats_needed) || 1,
      notes: src.notes || '',
    });
  };

  const handleSaveEditModal = async (e) => {
    e.preventDefault();
    if (!supabase || !editModal) return;
    setEditError('');

    if (editModal.kind === 'offer') {
      const vehicle = editModal.vehicle_type.trim();
      const startA = editModal.start_area.trim();
      const destA = editModal.destination_area.trim();
      const totalS = parseInt(editModal.total_seats, 10);
      const availS = parseInt(editModal.available_seats, 10);
      const price = Number(editModal.price_per_seat);
      const depDate = new Date(editModal.departure_time);

      if (vehicle.length < 2 || startA.length < 2 || destA.length < 2) {
        setEditError('يرجى التأكد من ملء نوع العربة ومنطقة الانطلاق والوجهة.');
        return;
      }
      if (Number.isNaN(depDate.getTime())) {
        setEditError('يرجى إدخال موعد تحرك صحيح.');
        return;
      }
      if (Number.isNaN(totalS) || totalS < 1 || totalS > 50) {
        setEditError('إجمالي المقاعد يجب أن يكون بين 1 و 50.');
        return;
      }
      if (Number.isNaN(availS) || availS < 0 || availS > totalS) {
        setEditError('المقاعد المتاحة يجب أن تكون بين 0 وإجمالي المقاعد.');
        return;
      }
      if (Number.isNaN(price) || price < 0) {
        setEditError('السعر يجب أن يكون صفراً أو أكبر.');
        return;
      }

      const stopsArr = editModal.intermediate_stops_input
        .split(/[,،\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const recurring = isRecurringType(editModal.recurrence_type);
      const baseExpiry = recurring
        ? depDate.getTime() + 14 * 24 * 60 * 60 * 1000
        : depDate.getTime() + 3 * 60 * 60 * 1000;
      const safeExpiryIso = new Date(
        Math.max(baseExpiry, Date.now() + 2 * 60 * 60 * 1000)
      ).toISOString();

      setEditSubmitting(true);
      try {
        const { data, error } = await supabase.rpc('driver_update_offer', {
          p_offer_id: editModal.id,
          p_manage_token: editModal.manageToken,
          p_vehicle_type: vehicle,
          p_start_area: startA,
          p_destination_area: destA,
          p_intermediate_stops: stopsArr,
          p_departure_time: depDate.toISOString(),
          p_total_seats: totalS,
          p_available_seats: availS,
          p_price_per_seat: price,
          p_expires_at: safeExpiryIso,
        });
        if (error) throw error;
        if (!data) {
          setEditError('تعذر حفظ التعديلات؛ ربما تم حذف الإعلان سابقاً.');
          return;
        }

        persistMyOffers((prev) =>
          prev.map((item) =>
            item.id === editModal.id
              ? {
                  ...item,
                  vehicle_type: vehicle,
                  start_area: startA,
                  destination_area: destA,
                  intermediate_stops: stopsArr,
                  departure_time: depDate.toISOString(),
                  total_seats: totalS,
                  available_seats: availS,
                  price_per_seat: price,
                  status: availS === 0 ? 'full' : 'active',
                  expires_at: safeExpiryIso,
                }
              : item
          )
        );
        setOwnerFeedback({ type: 'ok', text: 'تم تحديث بيانات عرضك بنجاح.' });
        setEditModal(null);
        fetchPublicListings();
      } catch (err) {
        setEditError(err?.message || 'حدث خطأ أثناء حفظ التعديلات.');
      } finally {
        setEditSubmitting(false);
      }
      return;
    }

    const startA = editModal.start_area.trim();
    const destA = editModal.destination_area.trim();
    const seatsN = parseInt(editModal.seats_needed, 10);
    const notesText = editModal.notes.trim();
    const prefDate = new Date(editModal.preferred_time);

    if (startA.length < 2 || destA.length < 2) {
      setEditError('يرجى تحديد منطقة الانطلاق والوجهة بشكل صحيح.');
      return;
    }
    if (Number.isNaN(prefDate.getTime())) {
      setEditError('يرجى إدخال وقت تحرك صحيح.');
      return;
    }
    if (Number.isNaN(seatsN) || seatsN < 1 || seatsN > 20) {
      setEditError('عدد المقاعد المطلوبة يجب أن يكون بين 1 و 20.');
      return;
    }

    const recurring = isRecurringType(editModal.recurrence_type);
    const baseExpiry = recurring
      ? prefDate.getTime() + 14 * 24 * 60 * 60 * 1000
      : prefDate.getTime() + 3 * 60 * 60 * 1000;
    const safeExpiryIso = new Date(
      Math.max(baseExpiry, Date.now() + 2 * 60 * 60 * 1000)
    ).toISOString();

    setEditSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('passenger_update_request', {
        p_request_id: editModal.id,
        p_manage_token: editModal.manageToken,
        p_start_area: startA,
        p_destination_area: destA,
        p_preferred_time: prefDate.toISOString(),
        p_seats_needed: seatsN,
        p_notes: notesText || null,
        p_expires_at: safeExpiryIso,
      });
      if (error) throw error;
      if (!data) {
        setEditError('تعذر حفظ التعديلات؛ ربما تم حذف الطلب سابقاً.');
        return;
      }

      persistMyRequests((prev) =>
        prev.map((item) =>
          item.id === editModal.id
            ? {
                ...item,
                start_area: startA,
                destination_area: destA,
                preferred_time: prefDate.toISOString(),
                seats_needed: seatsN,
                notes: notesText,
                status: 'active',
                expires_at: safeExpiryIso,
              }
            : item
        )
      );
      setOwnerFeedback({ type: 'ok', text: 'تم تحديث بيانات طلبك بنجاح.' });
      setEditModal(null);
      fetchPublicListings();
    } catch (err) {
      setEditError(err?.message || 'حدث خطأ أثناء حفظ التعديلات.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleManualAction = async (action) => {
    setManualFeedback({ type: '', text: '' });
    if (!supabase) return;
    const parsed = parseManageCode(manualCode);
    if (!parsed) {
      setManualFeedback({
        type: 'error',
        text: 'صيغة الرمز غير صحيحة. الصق الرمز كاملاً كما ظهر عند النشر (مع الشرطة السفلية _).',
      });
      return;
    }

    if (action === 'delete') {
      const ok = window.confirm('هل أنت متأكد من حذف هذا الإعلان نهائياً؟');
      if (!ok) return;
    }

    setManualLoading(true);
    try {
      let okResult = false;
      if (manualKind === 'offer') {
        if (action === 'delete') {
          const { data, error } = await supabase.rpc('driver_delete_offer', {
            p_offer_id: parsed.itemId,
            p_manage_token: parsed.manageToken,
          });
          if (error) throw error;
          okResult = Boolean(data);
          if (okResult) {
            persistMyOffers((prev) => prev.filter((o) => o.id !== parsed.itemId));
          }
        } else {
          const seatsNum =
            action === 'active' ? Math.max(0, parseInt(manualSeats, 10) || 0) : 0;
          const { data, error } = await supabase.rpc('driver_manage_offer', {
            p_offer_id: parsed.itemId,
            p_manage_token: parsed.manageToken,
            p_available_seats: seatsNum,
            p_status: action,
          });
          if (error) throw error;
          okResult = Boolean(data);
        }
      } else if (action === 'delete') {
        const { data, error } = await supabase.rpc('passenger_delete_request', {
          p_request_id: parsed.itemId,
          p_manage_token: parsed.manageToken,
        });
        if (error) throw error;
        okResult = Boolean(data);
        if (okResult) {
          persistMyRequests((prev) => prev.filter((r) => r.id !== parsed.itemId));
        }
      } else {
        const { data, error } = await supabase.rpc('passenger_manage_request', {
          p_request_id: parsed.itemId,
          p_manage_token: parsed.manageToken,
          p_status: 'closed',
        });
        if (error) throw error;
        okResult = Boolean(data);
      }

      if (!okResult) {
        setManualFeedback({
          type: 'error',
          text: 'لم يتم العثور على الإعلان أو أن الرمز لا يطابق النوع المختار.',
        });
        return;
      }

      setManualFeedback({ type: 'ok', text: 'تم تنفيذ الإجراء بنجاح.' });
      fetchPublicListings();
    } catch (err) {
      setManualFeedback({
        type: 'error',
        text: err?.message || 'حدث خطأ أثناء تنفيذ العملية.',
      });
    } finally {
      setManualLoading(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!supabase || !reportTarget) return;
    const reason = reportReason.trim();
    if (reason.length < 2) {
      setReportMsg({ type: 'error', text: 'يرجى كتابة سبب البلاغ (حرفان على الأقل).' });
      return;
    }

    const payload = {
      target_type: reportTarget.type,
      offer_id: reportTarget.type === 'offer' ? reportTarget.id : null,
      request_id: reportTarget.type === 'request' ? reportTarget.id : null,
      reason,
      details: reportDetails.trim() || null,
      status: 'pending',
    };

    setReportLoading(true);
    setReportMsg({ type: '', text: '' });
    try {
      const { error } = await supabase.from('reports').insert(payload);
      if (error) throw error;

      setReportMsg({
        type: 'ok',
        text: 'تم استلام البلاغ بنجاح وسيقوم المشرف بمراجعته.',
      });
      setReportReason('');
      setReportDetails('');
      setReportTarget(null);
    } catch (err) {
      setReportMsg({
        type: 'error',
        text: err?.message || 'تعذر إرسال البلاغ حالياً.',
      });
    } finally {
      setReportLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!supabase) {
      setLoginError('إعدادات Supabase غير مكتملة.');
      return;
    }
    setLoginLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      if (error) throw error;
      setLoginPassword('');
    } catch (err) {
      setLoginError(err?.message || 'بيانات الدخول غير صحيحة.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setIsAdmin(false);
    setAdminReports([]);
    setAdminOffers([]);
    setAdminRequests([]);
    setAdminFeedback({ type: '', text: '' });
  };

  const handleUpdateReportStatus = async (reportId, nextStatus) => {
    if (!supabase) return;
    setAdminFeedback({ type: '', text: '' });
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: nextStatus })
        .eq('id', reportId);
      if (error) throw error;

      setAdminFeedback({
        type: 'ok',
        text:
          nextStatus === 'reviewed'
            ? 'تم تحديث حالة البلاغ إلى (تمت المراجعة).'
            : 'تم تحديث حالة البلاغ إلى (تم التجاهل).',
      });
      fetchAdminDashboard();
    } catch (err) {
      setAdminFeedback({
        type: 'error',
        text: err?.message || 'تعذر تحديث حالة البلاغ.',
      });
    }
  };

  const handleAdminDeleteListing = async (targetType, targetId) => {
    if (!supabase || !targetId) return;
    const confirmed = window.confirm('هل أنت متأكد من حذف هذا الإعلان نهائياً؟');
    if (!confirmed) return;

    setAdminFeedback({ type: '', text: '' });
    try {
      const tableName = targetType === 'offer' ? 'ride_offers' : 'ride_requests';
      const { error } = await supabase.from(tableName).delete().eq('id', targetId);
      if (error) throw error;

      setAdminFeedback({ type: 'ok', text: 'تم حذف الإعلان بنجاح.' });
      fetchAdminDashboard();
      fetchPublicListings();
    } catch (err) {
      setAdminFeedback({
        type: 'error',
        text: err?.message || 'تعذر حذف الإعلان.',
      });
    }
  };

  const handleDeleteExpiredAds = async () => {
    if (!supabase) return;
    setAdminFeedback({ type: '', text: '' });
    try {
      const { data, error } = await supabase.rpc('admin_delete_expired_ads');
      if (error) throw error;

      const deletedOffers = data?.deleted_offers ?? 0;
      const deletedRequests = data?.deleted_requests ?? 0;
      setAdminFeedback({
        type: 'ok',
        text: `تم تنظيف المنتهي بنجاح: حذف ${deletedOffers} عرض سائق و ${deletedRequests} طلب طالب.`,
      });
      fetchAdminDashboard();
      fetchPublicListings();
    } catch (err) {
      setAdminFeedback({
        type: 'error',
        text: err?.message || 'تعذر حذف الإعلانات المنتهية.',
      });
    }
  };

  const offerIsRecurring = isRecurringType(offerForm.recurrence_type);
  const requestIsRecurring = isRecurringType(requestForm.recurrence_type);

  const openTab = (nextTab) => {
    setTab(nextTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAds = (section = 'all') => {
    setBoardSection(section);
    openTab(TABS.ADS);
  };

  return (
    <div className="tc-app">
      <style>{APP_CSS}</style>
      <style>{HOME_CSS}</style>
      <style>{THEME_CSS}</style>

      <header className="tc-header">
        <div className="tc-header-inner">
          <div className="tc-brand" onClick={() => openTab(TABS.HOME)}>
            <div className="tc-logo-box">
              <Icon name="campus" size={22} />
            </div>
            <div>
              <h1 className="tc-brand-title">توصيلة السنتر</h1>
              <p className="tc-brand-sub">مواصلات طلاب جامعة الخرطوم • توصيلة وترحيل</p>
            </div>
          </div>

          <nav className="tc-desktop-nav" aria-label="التنقل الرئيسي">
            <button
              type="button"
              className={`tc-nav-pill ${tab === TABS.HOME ? 'active' : ''}`}
              onClick={() => openTab(TABS.HOME)}
            >
              <Icon name="home" size={16} />
              الرئيسية
            </button>
            <button
              type="button"
              className={`tc-nav-pill ${tab === TABS.ADS ? 'active' : ''}`}
              onClick={() => openAds('all')}
            >
              <Icon name="ads" size={16} />
              الإعلانات ({totalLiveAds})
            </button>
            <button
              type="button"
              className={`tc-nav-pill ${tab === TABS.OFFER ? 'active' : ''}`}
              onClick={() => openTab(TABS.OFFER)}
            >
              <Icon name="car" size={16} />
              أعرض مشواراً
            </button>
            <button
              type="button"
              className={`tc-nav-pill ${tab === TABS.REQUEST ? 'active' : ''}`}
              onClick={() => openTab(TABS.REQUEST)}
            >
              <Icon name="hand" size={16} />
              اطلب توصيلة
            </button>
            <button
              type="button"
              className={`tc-nav-pill ${tab === TABS.ADMIN ? 'active' : ''}`}
              onClick={() => openTab(TABS.ADMIN)}
            >
              <Icon name="shield" size={16} />
              الإدارة
            </button>
          </nav>

          <button
            type="button"
            className="tc-live-dot-badge"
            onClick={() => openAds('all')}
            title="عرض جميع الإعلانات المتاحة الآن"
          >
            <span className="tc-pulse-dot" />
            <span>{totalLiveAds} إعلان متاح</span>
          </button>
        </div>
      </header>

      {toast && (
        <div
          className={`tc-toast ${toast.kind === 'error' ? 'tc-toast-error' : ''}`}
          role="status"
          onClick={() => setToast(null)}
        >
          {toast.text}
        </div>
      )}
      <datalist id="tc-areas-list">
        {POPULAR_AREAS.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>
      <main className="tc-main">
        {!supabase && (
          <div className="tc-alert tc-alert-err">
            تنبيه إعداد: لم يتم العثور على <code>VITE_SUPABASE_URL</code> أو{' '}
            <code>VITE_SUPABASE_ANON_KEY</code>. أضفهما في إعدادات الاستضافة أو ملف{' '}
            <code>.env</code> ثم أعد النشر.
          </div>
        )}

        {/* ======================= الرئيسية ======================= */}
        {tab === TABS.HOME && (
          <>
            <section className="tc-hero2">
              <h2 className="tc-hero2-title">مشوارك للجامعة أسهل وأوفر</h2>
              <button type="button" className="tc-hero2-search" onClick={() => openAds('all')}>
                <Icon name="search" size={18} />
                ابحث عن مسارك...
              </button>
            </section>

            <section className="tc-act-grid">
              <button type="button" className="tc-act dark" onClick={() => openTab(TABS.OFFER)}>
                <Icon name="car" size={30} />
                أعرض مشواراً
              </button>
              <button type="button" className="tc-act light" onClick={() => openTab(TABS.REQUEST)}>
                <span className="tc-act-ico">
                  <Icon name="hand" size={30} />
                </span>
                اطلب ترحيل
              </button>
            </section>

            {totalMyAdsCount > 0 && (
              <section
                className="tc-card"
                style={{
                  padding: '12px 14px',
                  borderColor: '#0d5c63',
                  background: 'linear-gradient(135deg, #eef7f6 0%, #ffffff 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <strong style={{ color: '#073e44', fontSize: '0.92rem' }}>
                  لديك {totalMyAdsCount} إعلان على هذا الجهاز
                </strong>
                <button
                  type="button"
                  className="tc-btn tc-btn-call"
                  onClick={() => openAds('mine')}
                >
                  <Icon name="edit" size={15} />
                  إدارة إعلاناتي
                </button>
              </section>
            )}

            <div className="tc-sec-head">
              <h2>أقرب الرحلات</h2>
              <button type="button" className="tc-link-btn" onClick={() => openAds('all')}>
                عرض الكل
              </button>
            </div>

            {(() => {
              const upcoming = filteredOffers
                .filter((o) => o.status !== 'full' && (Number(o.available_seats) || 0) > 0)
                .slice(0, 3);
              if (boardLoading && upcoming.length === 0) {
                return <p className="tc-muted">جارٍ تحميل الرحلات...</p>;
              }
              if (upcoming.length === 0) {
                return (
                  <div className="tc-card" style={{ textAlign: 'center' }}>
                    <p className="tc-muted" style={{ margin: '0 0 10px' }}>
                      لا توجد رحلات متاحة حالياً. كن أول من ينشر مشواره!
                    </p>
                    <button
                      type="button"
                      className="tc-btn tc-btn-call"
                      onClick={() => openTab(TABS.OFFER)}
                    >
                      أعرض مشواراً
                    </button>
                  </div>
                );
              }
              return upcoming.map((offer) => {
                const rec = isRecurringType(offer.recurrence_type);
                const when = rec
                  ? `الساعة ${formatTimeOnly(offer.departure_time)} (${formatRecurrence(
                      offer.recurrence_type,
                      offer.recurrence_days
                    )})`
                  : formatDateTime(offer.departure_time);
                const waText = `السلام عليكم كابتن ${offer.driver_name}، شفت عرضك في توصيلة السنتر: من (${offer.start_area}) إلى (${offer.destination_area}) — ${when}. أرغب في حجز مقعد، هل ما زال متاحاً؟ شكراً.`;
                return (
                  <article className="tc-mini" key={offer.id}>
                    <div className="tc-mini-top">
                      <span>
                        {offer.driver_name} • {Number(offer.available_seats) || 0} مقاعد
                      </span>
                      <span className={`tc-badge ${rec ? 'tc-badge-rec' : 'tc-badge-once'}`}>
                        {rec ? 'ترحيل منتظم' : 'توصيلة'}
                      </span>
                    </div>
                    <RouteTimeline
                      start={offer.start_area}
                      destination={offer.destination_area}
                      stops={offer.intermediate_stops}
                    />
                    <div className="tc-mini-foot">
                      <div className="tc-mini-info">
                        <span className="tc-meta-item">
                          <Icon name="clock" size={15} />
                          {when}
                        </span>
                        {Number(offer.price_per_seat) > 0 ? (
<span className="tc-price-tag">{`${Number(offer.price_per_seat).toLocaleString()} ج.س`}</span>
) : (
<span className="tc-price-muted">السعر بالاتفاق</span>
)}
                      </div>
                      <a
                        className="tc-btn tc-btn-wa"
                        href={buildWhatsAppLink(offer.whatsapp_number, waText)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Icon name="whatsapp" size={16} />
                        احجز مقعد
                      </a>
                    </div>
                  </article>
                );
              });
            })()}

            <details className="tc-card tc-howto">
              <summary>كيف يعمل؟ توصيلة سريعة أم ترحيل منتظم</summary>
              <div className="tc-info-grid" style={{ marginTop: '10px' }}>
                <div className="tc-info-mini">
                  <span className="tc-badge tc-badge-once" style={{ flexShrink: 0 }}>
                    <Icon name="clock" size={14} /> توصيلة
                  </span>
                  <div style={{ fontSize: '0.85rem', color: '#425d60', lineHeight: 1.6 }}>
                    لمشوار لمرة واحدة اليوم أو غداً؛ يختفي الإعلان تلقائياً بعد بضع
                    ساعات من وقت التحرك لتبقى القائمة حديثة.
                  </div>
                </div>
                <div className="tc-info-mini">
                  <span className="tc-badge tc-badge-rec" style={{ flexShrink: 0 }}>
                    <Icon name="repeat" size={14} /> ترحيل منتظم
                  </span>
                  <div style={{ fontSize: '0.85rem', color: '#425d60', lineHeight: 1.6 }}>
                    لطلاب جامعة الخرطوم والسائقين الملتزمين بنفس المسار يومياً أو في
                    أيام محددة؛ يبقى منشوراً لمدة أسبوع أو أسبوعين أو شهر.
                  </div>
                </div>
              </div>
            </details>
          </>
        )}
        {/* ======================= الإعلانات + إعلاناتي ======================= */}
        {tab === TABS.ADS && (
          <>
            <div className="tc-segmented-4">
              <button
                type="button"
                className={`tc-seg-btn ${boardSection === 'all' ? 'active' : ''}`}
                onClick={() => setBoardSection('all')}
              >
                الكل ({totalLiveAds})
              </button>
              <button
                type="button"
                className={`tc-seg-btn ${boardSection === 'offers' ? 'active' : ''}`}
                onClick={() => setBoardSection('offers')}
              >
                عروض السائقين ({filteredOffers.length})
              </button>
              <button
                type="button"
                className={`tc-seg-btn ${boardSection === 'requests' ? 'active' : ''}`}
                onClick={() => setBoardSection('requests')}
              >
                طلبات الطلاب ({filteredRequests.length})
              </button>
              <button
                type="button"
                className={`tc-seg-btn mine-highlight ${
                  boardSection === 'mine' ? 'active' : ''
                }`}
                onClick={() => setBoardSection('mine')}
              >
                إعلاناتي ({totalMyAdsCount})
              </button>
            </div>

            {boardSection !== 'mine' && (
              <section className="tc-card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                    marginBottom: '12px',
                  }}
                >
                  <h2 className="tc-h2" style={{ margin: 0 }}>
                    <Icon name="ads" size={20} />
                    الإعلانات المتاحة والبحث
                  </h2>
                  <button
                    type="button"
                    className="tc-btn tc-btn-soft"
                    onClick={fetchPublicListings}
                    disabled={boardLoading}
                  >
                    <Icon name="refresh" size={15} />
                    {boardLoading ? 'جاري التحديث...' : 'تحديث'}
                  </button>
                </div>

                <div className="tc-chips" style={{ marginBottom: '13px' }}>
                  <button
                    type="button"
                    className={`tc-chip ${searchTripKind === 'all' ? 'active' : ''}`}
                    onClick={() => setSearchTripKind('all')}
                  >
                    الكل
                  </button>
                  <button
                    type="button"
                    className={`tc-chip ${searchTripKind === 'once' ? 'active' : ''}`}
                    onClick={() => setSearchTripKind('once')}
                  >
                    توصيلة لمرة واحدة
                  </button>
                  <button
                    type="button"
                    className={`tc-chip ${searchTripKind === 'recurring' ? 'active' : ''}`}
                    onClick={() => setSearchTripKind('recurring')}
                  >
                    ترحيل منتظم
                  </button>
                </div>

                <div className="tc-grid-2">
                  <div className="tc-field">
                    <label className="tc-label">منطقة الانطلاق أو محطة بالمسار</label>
                    <input
                      type="text"
                      value={searchStart}
                      list="tc-areas-list"
                      onChange={(e) => setSearchStart(e.target.value)}
                      placeholder="مثال: الرياض، جبرة، الثورة، شمبات..."
                      className="tc-input"
                    />
                  </div>
                  <div className="tc-field">
                    <label className="tc-label">الوجهة (المجمع أو الحي)</label>
                    <input
                      type="text"
                      value={searchDest}
                      list="tc-areas-list"
                      onChange={(e) => setSearchDest(e.target.value)}
                      placeholder="مثال: السنتر، الهندسة، الطب، شمبات..."
                      className="tc-input"
                    />
                  </div>
                </div>

                {(searchStart || searchDest || searchTripKind !== 'all') && (
                  <div style={{ marginTop: '12px' }}>
                    <button
                      type="button"
                      className="tc-btn tc-btn-ghost"
                      onClick={() => {
                        setSearchStart('');
                        setSearchDest('');
                        setSearchTripKind('all');
                      }}
                    >
                      مسح كل الفلاتر
                    </button>
                  </div>
                )}
              </section>
            )}

            {boardError && <div className="tc-alert tc-alert-err">{boardError}</div>}

            {ownerFeedback.text && (
              <div
                className={`tc-alert ${
                  ownerFeedback.type === 'ok' ? 'tc-alert-ok' : 'tc-alert-err'
                }`}
              >
                {ownerFeedback.text}
              </div>
            )}

            {reportMsg.text && (
              <div
                className={`tc-alert ${
                  reportMsg.type === 'ok' ? 'tc-alert-ok' : 'tc-alert-err'
                }`}
              >
                {reportMsg.text}
              </div>
            )}

            {(boardSection === 'all' || boardSection === 'offers') && (
              <section style={{ marginBottom: '20px' }}>
                <h2 className="tc-h2" style={{ marginBottom: '10px' }}>
                  <Icon name="car" size={20} />
                  عروض السائقين ({filteredOffers.length})
                </h2>

                {boardLoading && offers.length === 0 ? (
                  <>
                    <div className="tc-skeleton" />
                    <div className="tc-skeleton" />
                  </>
                ) : filteredOffers.length === 0 ? (
                  <div className="tc-card tc-empty">
                    <div className="tc-empty-icon">
                      <Icon name="car" size={24} />
                    </div>
                    <div style={{ fontWeight: 700, marginBottom: '6px' }}>
                      لا توجد عروض سائقين مطابقة حالياً
                    </div>
                    <p className="tc-muted" style={{ marginBottom: '12px' }}>
                      يمكنك مسح الفلاتر أو نشر طلبك ليتواصل معك السائقون على نفس المسار.
                    </p>
                    <button
                      type="button"
                      className="tc-btn tc-btn-soft"
                      onClick={() => openTab(TABS.REQUEST)}
                    >
                      انشر طلب توصيلة / ترحيل
                    </button>
                  </div>
                ) : (
                  filteredOffers.map((offer) => {
                    const ownItem = myOffersById[offer.id];
                    const isMine = Boolean(ownItem);
                    const isBusy = busyItemId === offer.id;
                    const currentSeats = Number(offer.available_seats) || 0;
                    const totalSeats = Math.max(1, Number(offer.total_seats) || 1);
                    const isFull = offer.status === 'full' || currentSeats <= 0;
                    const recurring = isRecurringType(offer.recurrence_type);
                    const kindText = recurring ? 'ترحيل منتظم' : 'توصيلة';
                    const timeTextBase = recurring
                      ? `الساعة ${formatTimeOnly(offer.departure_time)} (${formatRecurrence(
                          offer.recurrence_type,
                          offer.recurrence_days
                        )})`
                      : formatDateTime(offer.departure_time);
                    const timeText =
                      recurring && offer.return_time
                        ? `${timeTextBase} • عودة ${formatReturnTime(offer.return_time)}`
                        : timeTextBase;
                    const waText = `السلام عليكم كابتن ${offer.driver_name}، أنا من طلاب جامعة الخرطوم وشفت عرضك (${kindText}) في توصيلة السنتر: من (${offer.start_area}) إلى (${offer.destination_area}) — ${timeText}. أرغب في حجز مقعد، هل ما زال متاحاً؟ شكراً.`;
                    const waHref = buildWhatsAppLink(offer.whatsapp_number, waText);
                    const telHref = buildTelLink(
                      offer.phone_number || offer.whatsapp_number
                    );

                    return (
                      <article
                        key={offer.id}
                        className={`tc-listing ${isMine ? 'tc-listing-own' : ''}`}
                      >
                        <div className="tc-listing-top">
                          <div className="tc-btn-row">
                            {isMine && (
                              <span className="tc-badge tc-badge-own">إعلانك</span>
                            )}
                            <span
                              className={`tc-badge ${
                                recurring ? 'tc-badge-rec' : 'tc-badge-once'
                              }`}
                            >
                              <Icon name={recurring ? 'repeat' : 'clock'} size={13} />
                              {recurring ? 'ترحيل منتظم' : 'توصيلة لمرة واحدة'}
                            </span>
                            <span
                              className={`tc-badge ${
                                isFull ? 'tc-badge-full' : 'tc-badge-ok'
                              }`}
                            >
                              {isFull
                                ? 'مكتمل (0 مقاعد)'
                                : `متاح ${currentSeats} من ${totalSeats}`}
                            </span>
                          </div>
                          {Number(offer.price_per_seat) > 0 ? (
<span className="tc-price-tag">{`${Number(offer.price_per_seat).toLocaleString()} ج.س`}</span>
) : (
<span className="tc-price-muted">السعر بالاتفاق</span>
)}
                        </div>

                        <RouteTimeline
                          start={offer.start_area}
                          destination={offer.destination_area}
                          stops={offer.intermediate_stops}
                        />
                        {offer.notes && <div className="tc-notes-box">{offer.notes}</div>}

                        <div className="tc-meta-grid">
                          <span className="tc-meta-item">
                            <Icon name="car" size={15} />
                            <strong>{offer.driver_name}</strong> • {offer.vehicle_type}
                          </span>
                          <span className="tc-meta-item">
                            <Icon name="clock" size={15} />
                            {timeText}
                          </span>
                          <span className="tc-meta-item">
                            <Icon name="clock" size={15} />
                            آخر تحديث {formatTimeAgo(offer.updated_at || offer.created_at)}
                          </span>
                        </div>

                        <div className="tc-listing-footer">
                          {isMine ? (
                            <>
                              <div className="tc-btn-row">
                                <div className="tc-seat-stepper">
                                  <button
                                    type="button"
                                    className="tc-step-btn"
                                    disabled={isBusy || currentSeats <= 0}
                                    onClick={() =>
                                      handleOwnOfferSeatsOrStatus(
                                        ownItem,
                                        currentSeats - 1,
                                        currentSeats - 1 <= 0 ? 'full' : 'active'
                                      )
                                    }
                                    aria-label="إنقاص مقعد"
                                  >
                                    −
                                  </button>
                                  <span
                                    style={{
                                      minWidth: '24px',
                                      textAlign: 'center',
                                      fontWeight: 800,
                                      fontSize: '0.9rem',
                                    }}
                                  >
                                    {currentSeats}
                                  </span>
                                  <button
                                    type="button"
                                    className="tc-step-btn"
                                    disabled={isBusy || currentSeats >= totalSeats}
                                    onClick={() =>
                                      handleOwnOfferSeatsOrStatus(
                                        ownItem,
                                        currentSeats + 1,
                                        'active'
                                      )
                                    }
                                    aria-label="زيادة مقعد"
                                  >
                                    +
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  className="tc-btn tc-btn-soft"
                                  disabled={isBusy}
                                  onClick={() => openEditOfferModal(ownItem, offer)}
                                >
                                  <Icon name="edit" size={14} />
                                  تعديل
                                </button>

                                <button
                                  type="button"
                                  className="tc-btn tc-btn-warn"
                                  disabled={isBusy || isFull}
                                  onClick={() =>
                                    handleOwnOfferSeatsOrStatus(ownItem, 0, 'full')
                                  }
                                >
                                  اكتملت
                                </button>
                              </div>

                              <button
                                type="button"
                                className="tc-btn tc-btn-danger"
                                disabled={isBusy}
                                onClick={() => handleOwnOfferDelete(ownItem)}
                              >
                                <Icon name="trash" size={14} />
                                حذف
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="tc-btn-row">
                                {waHref && (
                                  <a
                                    href={waHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="tc-btn tc-btn-wa"
                                  >
                                    <Icon name="whatsapp" size={16} />
                                    {isFull ? 'اسأل عن مقعد' : 'احجز مقعد'}
                                  </a>
                                )}
                                {telHref && (
                                  <a href={telHref} className="tc-btn tc-btn-call">
                                    <Icon name="phone" size={15} />
                                    اتصال
                                  </a>
                                )}
                              </div>
                              <button
                                type="button"
                                className="tc-btn tc-btn-ghost"
                                onClick={() => {
                                  setReportMsg({ type: '', text: '' });
                                  setReportTarget({
                                    type: 'offer',
                                    id: offer.id,
                                    label: `عرض السائق ${offer.driver_name} (${offer.start_area} ← ${offer.destination_area})`,
                                  });
                                }}
                              >
                                <Icon name="flag" size={14} />
                                إبلاغ
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

            {(boardSection === 'all' || boardSection === 'requests') && (
              <section>
                <h2 className="tc-h2" style={{ marginBottom: '10px' }}>
                  <Icon name="hand" size={20} />
                  طلبات طلاب جامعة الخرطوم ({filteredRequests.length})
                </h2>

                {boardLoading && requests.length === 0 ? (
                  <div className="tc-skeleton" />
                ) : filteredRequests.length === 0 ? (
                  <div className="tc-card tc-empty">
                    <div className="tc-empty-icon">
                      <Icon name="hand" size={24} />
                    </div>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                      لا توجد طلبات طلاب مطابقة حالياً
                    </div>
                    <p className="tc-muted" style={{ marginBottom: 0 }}>
                      عند نشر طلاب جامعة الخرطوم لطلبات توصيل أو ترحيل ستظهر هنا مباشرة.
                    </p>
                  </div>
                ) : (
                  filteredRequests.map((req) => {
                    const ownReq = myRequestsById[req.id];
                    const isMine = Boolean(ownReq);
                    const isBusy = busyItemId === req.id;
                    const recurring = isRecurringType(req.recurrence_type);
                    const kindText = recurring ? 'ترحيل منتظم' : 'توصيلة';
                    const timeText = recurring
                      ? `الساعة ${formatTimeOnly(req.preferred_time)} (${formatRecurrence(
                          req.recurrence_type,
                          req.recurrence_days
                        )})`
                      : formatDateTime(req.preferred_time);
                    const waText = `السلام عليكم ${req.passenger_name}، شاهدت طلب (${kindText}) الخاص بك في توصيلة السنتر - جامعة الخرطوم من (${req.start_area}) إلى (${req.destination_area}) — ${timeText}. لدي مقعد متاح على هذا المسار.`;
                    const waHref = buildWhatsAppLink(req.whatsapp_number, waText);
                    const telHref = buildTelLink(req.phone_number || req.whatsapp_number);

                    return (
                      <article
                        key={req.id}
                        className={`tc-listing tc-listing-req ${isMine ? 'tc-listing-own' : ''}`}
                      >
                        <div className="tc-listing-top">
                          <div className="tc-btn-row">
                            {isMine && (
                              <span className="tc-badge tc-badge-own">إعلانك</span>
                            )}
                            <span
                              className={`tc-badge ${
                                recurring ? 'tc-badge-rec' : 'tc-badge-once'
                              }`}
                            >
                              <Icon name={recurring ? 'repeat' : 'clock'} size={13} />
                              {recurring ? 'ترحيل منتظم' : 'توصيلة لمرة واحدة'}
                            </span>
                            <span className="tc-badge tc-badge-neutral">
                              مطلوب {req.seats_needed} مقعد
                            </span>
                          </div>
                        </div>

                        <RouteTimeline
                          start={req.start_area}
                          destination={req.destination_area}
                        />

                        <div className="tc-meta-grid">
                          <span className="tc-meta-item">
                            <Icon name="hand" size={15} />
                            <strong>{req.passenger_name}</strong>
                          </span>
                          <span className="tc-meta-item">
                            <Icon name="clock" size={15} />
                            {timeText}
                          </span>
                          <span className="tc-meta-item">
                            <Icon name="clock" size={15} />
                            نُشر {formatTimeAgo(req.created_at)}
                          </span>
                        </div>

                        {req.notes && (
                          <div className="tc-notes-box">{req.notes}</div>
                        )}

                        <div className="tc-listing-footer">
                          {isMine ? (
                            <>
                              <div className="tc-btn-row">
                                <button
                                  type="button"
                                  className="tc-btn tc-btn-soft"
                                  disabled={isBusy}
                                  onClick={() => openEditRequestModal(ownReq, req)}
                                >
                                  <Icon name="edit" size={14} />
                                  تعديل
                                </button>
                                <button
                                  type="button"
                                  className="tc-btn tc-btn-warn"
                                  disabled={isBusy}
                                  onClick={() => handleOwnRequestStatus(ownReq, 'closed')}
                                >
                                  <Icon name="check" size={14} />
                                  لقيت توصيلة (إغلاق)
                                </button>
                              </div>
                              <button
                                type="button"
                                className="tc-btn tc-btn-danger"
                                disabled={isBusy}
                                onClick={() => handleOwnRequestDelete(ownReq)}
                              >
                                <Icon name="trash" size={14} />
                                حذف
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="tc-btn-row">
                                {waHref && (
                                  <a
                                    href={waHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="tc-btn tc-btn-wa"
                                  >
                                    <Icon name="whatsapp" size={16} />
                                    واتساب
                                  </a>
                                )}
                                {telHref && (
                                  <a href={telHref} className="tc-btn tc-btn-call">
                                    <Icon name="phone" size={15} />
                                    اتصال
                                  </a>
                                )}
                              </div>
                              <button
                                type="button"
                                className="tc-btn tc-btn-ghost"
                                onClick={() => {
                                  setReportMsg({ type: '', text: '' });
                                  setReportTarget({
                                    type: 'request',
                                    id: req.id,
                                    label: `طلب الطالب ${req.passenger_name} (${req.start_area} ← ${req.destination_area})`,
                                  });
                                }}
                              >
                                <Icon name="flag" size={14} />
                                إبلاغ
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

            {boardSection === 'mine' && (
              <>
                <section className="tc-card">
                  <h2 className="tc-h2">
                    <Icon name="edit" size={20} />
                    إعلاناتي المحفوظة على هذا الجهاز ({totalMyAdsCount})
                  </h2>
                  <div className="tc-alert tc-alert-info" style={{ marginBottom: 0 }}>
                    تجمع هذه القائمة كل <strong>عروضك كسائق</strong> و
                    <strong>طلباتك كطالب</strong> المنشورة من متصفحك الحالي لتعديلها أو
                    إغلاقها أو حذفها نهائياً بضغطة زر.
                  </div>
                </section>

                <section className="tc-card">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginBottom: '12px',
                    }}
                  >
                    <h3 className="tc-h3" style={{ margin: 0 }}>
                      عروضي كسائق ({myOffers.length})
                    </h3>
                    <button
                      type="button"
                      className="tc-btn tc-btn-soft"
                      onClick={() => openTab(TABS.OFFER)}
                    >
                      + نشر عرض جديد
                    </button>
                  </div>

                  {myOffers.length === 0 ? (
                    <div className="tc-empty">
                      <div className="tc-empty-icon">
                        <Icon name="car" size={24} />
                      </div>
                      <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                        لا توجد عروض سائق محفوظة على هذا الجهاز بعد
                      </div>
                      <p className="tc-muted" style={{ marginBottom: 0 }}>
                        بمجرد نشر عرض جديد سيظهر هنا تلقائياً بأزرار التعديل والحذف.
                      </p>
                    </div>
                  ) : (
                    myOffers.map((item) => {
                      const isExpired =
                        item.expires_at &&
                        new Date(item.expires_at).getTime() <= Date.now();
                      const isClosed = item.status === 'closed';
                      const currentSeats = Number(item.available_seats) || 0;
                      const totalSeats = Math.max(1, Number(item.total_seats) || 1);
                      const isFull = item.status === 'full' || currentSeats <= 0;
                      const recurring = isRecurringType(item.recurrence_type);
                      const isBusy = busyItemId === item.id;

                      return (
                        <article key={item.id} className="tc-listing tc-listing-own">
                          <div className="tc-listing-top">
                            <div className="tc-btn-row">
                              <span
                                className={`tc-badge ${
                                  recurring ? 'tc-badge-rec' : 'tc-badge-once'
                                }`}
                              >
                                {recurring ? 'ترحيل منتظم' : 'توصيلة'}
                              </span>
                              <span
                                className={`tc-badge ${
                                  isClosed
                                    ? 'tc-badge-neutral'
                                    : isExpired
                                    ? 'tc-badge-full'
                                    : isFull
                                    ? 'tc-badge-warn'
                                    : 'tc-badge-ok'
                                }`}
                              >
                                {isClosed
                                  ? 'مغلق'
                                  : isExpired
                                  ? 'منتهي الوقت'
                                  : isFull
                                  ? 'مكتمل (0 مقاعد)'
                                  : `متاح ${currentSeats} من ${totalSeats}`}
                              </span>
                            </div>
                            {Number(item.price_per_seat) > 0 ? (
<span className="tc-price-tag">{`${Number(item.price_per_seat).toLocaleString()} ج.س`}</span>
) : (
<span className="tc-price-muted">السعر بالاتفاق</span>
)}
                          </div>

                          <RouteTimeline
                            start={item.start_area}
                            destination={item.destination_area}
                            stops={item.intermediate_stops}
                          />

                          <div className="tc-meta-grid">
                            <span className="tc-meta-item">
                              <Icon name="clock" size={15} />
                              {recurring
                                ? `${formatTimeOnly(
                                    item.departure_time
                                  )} (${formatRecurrence(
                                    item.recurrence_type,
                                    item.recurrence_days
                                  )})`
                                : formatDateTime(item.departure_time)}
                            </span>
                            <span className="tc-meta-item">
                              <Icon name="car" size={15} />
                              {item.vehicle_type}
                            </span>
                          </div>

                          <div className="tc-listing-footer">
                            <div className="tc-btn-row">
                              {!isClosed && !isExpired && (
                                <div className="tc-seat-stepper">
                                  <button
                                    type="button"
                                    className="tc-step-btn"
                                    disabled={isBusy || currentSeats <= 0}
                                    onClick={() =>
                                      handleOwnOfferSeatsOrStatus(
                                        item,
                                        currentSeats - 1,
                                        currentSeats - 1 <= 0 ? 'full' : 'active'
                                      )
                                    }
                                    aria-label="إنقاص مقعد"
                                  >
                                    −
                                  </button>
                                  <span
                                    style={{
                                      minWidth: '24px',
                                      textAlign: 'center',
                                      fontWeight: 800,
                                      fontSize: '0.9rem',
                                    }}
                                  >
                                    {currentSeats}
                                  </span>
                                  <button
                                    type="button"
                                    className="tc-step-btn"
                                    disabled={isBusy || currentSeats >= totalSeats}
                                    onClick={() =>
                                      handleOwnOfferSeatsOrStatus(
                                        item,
                                        currentSeats + 1,
                                        'active'
                                      )
                                    }
                                    aria-label="زيادة مقعد"
                                  >
                                    +
                                  </button>
                                </div>
                              )}

                              <button
                                type="button"
                                className="tc-btn tc-btn-soft"
                                disabled={isBusy}
                                onClick={() => openEditOfferModal(item)}
                              >
                                <Icon name="edit" size={14} />
                                تعديل
                              </button>

                              {!isClosed && !isExpired && (
                                <button
                                  type="button"
                                  className="tc-btn tc-btn-warn"
                                  disabled={isBusy}
                                  onClick={() =>
                                    handleOwnOfferSeatsOrStatus(item, 0, 'closed')
                                  }
                                >
                                  إغلاق
                                </button>
                              )}

                              <button
                                type="button"
                                className="tc-btn tc-btn-danger"
                                disabled={isBusy}
                                onClick={() => handleOwnOfferDelete(item)}
                              >
                                <Icon name="trash" size={14} />
                                حذف نهائياً
                              </button>
                            </div>

                            <button
                              type="button"
                              className="tc-btn tc-btn-ghost"
                              onClick={() => handleCopyText(item.manageCode, item.id)}
                            >
                              <Icon name="copy" size={14} />
                              {copiedId === item.id ? 'نُسخ ✓' : 'الرمز'}
                            </button>
                          </div>
                        </article>
                      );
                    })
                  )}
                </section>

                <section className="tc-card">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginBottom: '12px',
                    }}
                  >
                    <h3 className="tc-h3" style={{ margin: 0 }}>
                      طلباتي كطالب ({myRequests.length})
                    </h3>
                    <button
                      type="button"
                      className="tc-btn tc-btn-soft"
                      onClick={() => openTab(TABS.REQUEST)}
                    >
                      + نشر طلب جديد
                    </button>
                  </div>

                  {myRequests.length === 0 ? (
                    <div className="tc-empty">
                      <div className="tc-empty-icon">
                        <Icon name="hand" size={24} />
                      </div>
                      <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                        لا توجد طلبات محفوظة على هذا الجهاز بعد
                      </div>
                      <p className="tc-muted" style={{ marginBottom: 0 }}>
                        عند نشر طلب توصيلة أو ترحيل سيظهر هنا لتعديله أو إغلاقه أو حذفه.
                      </p>
                    </div>
                  ) : (
                    myRequests.map((req) => {
                      const isExpired =
                        req.expires_at &&
                        new Date(req.expires_at).getTime() <= Date.now();
                      const isClosed = req.status === 'closed';
                      const recurring = isRecurringType(req.recurrence_type);
                      const isBusy = busyItemId === req.id;

                      return (
                        <article key={req.id} className="tc-listing tc-listing-own">
                          <div className="tc-listing-top">
                            <div className="tc-btn-row">
                              <span
                                className={`tc-badge ${
                                  recurring ? 'tc-badge-rec' : 'tc-badge-once'
                                }`}
                              >
                                {recurring ? 'ترحيل منتظم' : 'توصيلة'}
                              </span>
                              <span
                                className={`tc-badge ${
                                  isClosed
                                    ? 'tc-badge-neutral'
                                    : isExpired
                                    ? 'tc-badge-full'
                                    : 'tc-badge-ok'
                                }`}
                              >
                                {isClosed
                                  ? 'مغلق (لقيت توصيلة)'
                                  : isExpired
                                  ? 'منتهي الوقت'
                                  : 'نشط'}
                              </span>
                              <span className="tc-badge tc-badge-neutral">
                                مطلوب {req.seats_needed} مقعد
                              </span>
                            </div>
                          </div>

                          <RouteTimeline
                            start={req.start_area}
                            destination={req.destination_area}
                          />

                          <div className="tc-meta-grid">
                            <span className="tc-meta-item">
                              <Icon name="clock" size={15} />
                              {recurring
                                ? `${formatTimeOnly(
                                    req.preferred_time
                                  )} (${formatRecurrence(
                                    req.recurrence_type,
                                    req.recurrence_days
                                  )})`
                                : formatDateTime(req.preferred_time)}
                            </span>
                          </div>

                          {req.notes && <div className="tc-notes-box">{req.notes}</div>}

                          <div className="tc-listing-footer">
                            <div className="tc-btn-row">
                              <button
                                type="button"
                                className="tc-btn tc-btn-soft"
                                disabled={isBusy}
                                onClick={() => openEditRequestModal(req)}
                              >
                                <Icon name="edit" size={14} />
                                تعديل
                              </button>

                              {!isClosed && !isExpired ? (
                                <button
                                  type="button"
                                  className="tc-btn tc-btn-warn"
                                  disabled={isBusy}
                                  onClick={() => handleOwnRequestStatus(req, 'closed')}
                                >
                                  <Icon name="check" size={14} />
                                  لقيت توصيلة (إغلاق)
                                </button>
                              ) : (
                                !isExpired && (
                                  <button
                                    type="button"
                                    className="tc-btn tc-btn-soft"
                                    disabled={isBusy}
                                    onClick={() => handleOwnRequestStatus(req, 'active')}
                                  >
                                    إعادة تفعيل
                                  </button>
                                )
                              )}

                              <button
                                type="button"
                                className="tc-btn tc-btn-danger"
                                disabled={isBusy}
                                onClick={() => handleOwnRequestDelete(req)}
                              >
                                <Icon name="trash" size={14} />
                                حذف نهائياً
                              </button>
                            </div>

                            <button
                              type="button"
                              className="tc-btn tc-btn-ghost"
                              onClick={() => handleCopyText(req.manageCode, req.id)}
                            >
                              <Icon name="copy" size={14} />
                              {copiedId === req.id ? 'نُسخ ✓' : 'الرمز'}
                            </button>
                          </div>
                        </article>
                      );
                    })
                  )}
                </section>

                <section className="tc-card">
                  <h3 className="tc-h3">إدارة إعلان برمز يدوي (من هاتف آخر)</h3>
                  <p className="tc-muted">
                    إذا نشرت إعلانك من جهاز آخر، اختر نوعه والصق الرمز (
                    <code>id_token</code>) للتحكم به أو حذفه.
                  </p>

                  {manualFeedback.text && (
                    <div
                      className={`tc-alert ${
                        manualFeedback.type === 'ok' ? 'tc-alert-ok' : 'tc-alert-err'
                      }`}
                    >
                      {manualFeedback.text}
                    </div>
                  )}

                  <div className="tc-chips" style={{ marginBottom: '12px' }}>
                    <button
                      type="button"
                      className={`tc-chip ${manualKind === 'offer' ? 'active' : ''}`}
                      onClick={() => setManualKind('offer')}
                    >
                      عرض سائق
                    </button>
                    <button
                      type="button"
                      className={`tc-chip ${manualKind === 'request' ? 'active' : ''}`}
                      onClick={() => setManualKind('request')}
                    >
                      طلب طالب
                    </button>
                  </div>

                  <div className="tc-grid-2">
                    <div className="tc-field">
                      <label className="tc-label">رمز الإدارة الكامل (id_token)</label>
                      <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="الصق الرمز هنا..."
                        className="tc-input tc-input-ltr"
                      />
                    </div>
                    {manualKind === 'offer' && (
                      <div className="tc-field">
                        <label className="tc-label">عدد المقاعد المتاحة الجديد</label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={manualSeats}
                          onChange={(e) => setManualSeats(e.target.value)}
                          className="tc-input"
                        />
                      </div>
                    )}
                  </div>

                  <div className="tc-btn-row" style={{ marginTop: '12px' }}>
                    {manualKind === 'offer' && (
                      <button
                        type="button"
                        className="tc-btn tc-btn-soft"
                        disabled={manualLoading}
                        onClick={() => handleManualAction('active')}
                      >
                        تحديث المقاعد
                      </button>
                    )}
                    <button
                      type="button"
                      className="tc-btn tc-btn-warn"
                      disabled={manualLoading}
                      onClick={() => handleManualAction('closed')}
                    >
                      إغلاق الإعلان
                    </button>
                    <button
                      type="button"
                      className="tc-btn tc-btn-danger"
                      disabled={manualLoading}
                      onClick={() => handleManualAction('delete')}
                    >
                      <Icon name="trash" size={14} />
                      حذف نهائياً
                    </button>
                  </div>
                </section>
              </>
            )}
          </>
        )}

        {/* ======================= أعرض مشواراً ======================= */}
        {tab === TABS.OFFER && (
          <section className="tc-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '6px',
              }}
            >
              <h2 className="tc-h2" style={{ margin: 0 }}>
                <Icon name="car" size={20} />
                أعرض توصيلة أو ترحيل (لأصحاب العربات)
              </h2>
              {totalMyAdsCount > 0 && (
                <button
                  type="button"
                  className="tc-btn tc-btn-soft"
                  onClick={() => openAds('mine')}
                >
                  إدارة إعلاناتي ({totalMyAdsCount})
                </button>
              )}
            </div>
            <p className="tc-muted">
              انشر رحلتك لطلاب جامعة الخرطوم، وسيُحفظ إعلانك تلقائياً في «إعلاناتي»
              ويظهر لك بشارة «إعلانك» مع أزرار التعديل والحذف مباشرة.
            </p>

            {offerError && <div className="tc-alert tc-alert-err">{offerError}</div>}

            {savedOfferCode && (
              <div id="tc-offer-success" style={{ scrollMarginTop: '100px' }} className="tc-alert tc-alert-ok">
                <strong>تم نشر العرض وحفظه في «إعلاناتي» بنجاح!</strong>
                <div style={{ marginTop: '5px' }}>
                  يمكنك الآن تعديله أو تحديث مقاعده أو حذفه من قسم «إعلاناتي»، أو نسخ
                  هذا الرمز الاحتياطي إذا أردت إدارته من هاتف آخر:
                </div>
                <div className="tc-code-box">{savedOfferCode}</div>
                <div className="tc-btn-row" style={{ marginTop: '10px' }}>
                  <button
                    type="button"
                    className="tc-btn tc-btn-call"
                    onClick={() => openAds('mine')}
                  >
                    الانتقال إلى إعلاناتي
                  </button>
                  <button
                    type="button"
                    className="tc-btn tc-btn-ghost"
                    onClick={() => handleCopyText(savedOfferCode, 'saved_offer')}
                  >
                    <Icon name="copy" size={15} />
                    {copiedId === 'saved_offer' ? 'تم النسخ ✓' : 'نسخ الرمز'}
                  </button>
                  <button
                    type="button"
                    className="tc-btn tc-btn-ghost"
                    onClick={() => openAds('offers')}
                  >
                    عرض في الإعلانات
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handlePublishOffer}>
              <div className="tc-form-section">
                <div className="tc-form-section-title">
                  <Icon name="repeat" size={16} />
                  1. نوع العرض
                </div>
                <div className="tc-chips">
                  {RECURRENCE_CHOICES.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`tc-chip ${
                        offerForm.recurrence_type === opt.value ? 'active' : ''
                      }`}
                      onClick={() =>
                        setOfferForm({ ...offerForm, recurrence_type: opt.value })
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {offerForm.recurrence_type === 'weekdays' && (
                  <div style={{ marginTop: '12px' }}>
                    <label className="tc-label">
                      اختر أيام الترحيل المنتظم <span className="tc-req">*</span>
                    </label>
                    <div className="tc-chips">
                      {WEEKDAYS.map((day) => (
                        <button
                          key={day.key}
                          type="button"
                          className={`tc-chip ${
                            offerForm.recurrence_days.includes(day.key) ? 'active' : ''
                          }`}
                          onClick={() => toggleOfferRecurrenceDay(day.key)}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="tc-form-section">
                <div className="tc-form-section-title">
                  <Icon name="car" size={16} />
                  2. بيانات السائق والتواصل
                </div>
                <div className="tc-grid-2">
                  <div className="tc-field">
                    <label className="tc-label">
                      اسم السائق <span className="tc-req">*</span>
                    </label>
                    <input
                      type="text"
                      value={offerForm.driver_name}
                      onChange={(e) =>
                        setOfferForm({ ...offerForm, driver_name: e.target.value })
                      }
                      placeholder="مثال: أحمد محمد"
                      className="tc-input"
                      required
                    />
                  </div>

                  <div className="tc-field">
                    <label className="tc-label">
                      نوع العربة <span className="tc-req">*</span>
                    </label>
                    <input
                      type="text"
                      value={offerForm.vehicle_type}
                      onChange={(e) =>
                        setOfferForm({ ...offerForm, vehicle_type: e.target.value })
                      }
                      placeholder="مثال: يارس أبيض / أكسنت / هايس"
                      className="tc-input"
                      required
                    />
                  </div>

                  <div className="tc-field">
                    <label className="tc-label">
                      رقم الواتساب <span className="tc-req">*</span>
                    </label>
                    <input
                      type="tel"
                      value={offerForm.whatsapp_number}
                      onChange={(e) =>
                        setOfferForm({ ...offerForm, whatsapp_number: e.target.value })
                      }
                      placeholder="مثال: 0912345678"
                      className="tc-input tc-input-ltr"
                      required
                    />
                  </div>

                  <div className="tc-field">
                    <label className="tc-label">رقم اتصال إضافي (اختياري)</label>
                    <input
                      type="tel"
                      value={offerForm.phone_number}
                      onChange={(e) =>
                        setOfferForm({ ...offerForm, phone_number: e.target.value })
                      }
                      placeholder="اتركه فارغاً لاستخدام رقم الواتساب"
                      className="tc-input tc-input-ltr"
                    />
                  </div>
                </div>
              </div>

              <div className="tc-form-section">
                <div className="tc-form-section-title">
                  <Icon name="route" size={16} />
                  3. المسار والتوقيت
                </div>
                <div className="tc-grid-2">
                  <AreaInput
                    label="منطقة الانطلاق"
                    value={offerForm.start_area}
                    onChange={(val) => setOfferForm({ ...offerForm, start_area: val })}
                    placeholder="اكتب نقطة الانطلاق"
                  />
                  <AreaInput
                    label="الوجهة"
                    value={offerForm.destination_area}
                    onChange={(val) =>
                      setOfferForm({ ...offerForm, destination_area: val })
                    }
                    placeholder="اكتب الوجهة (مثال: مجمع الوسط - كلية الهندسة)"
                  />
                </div>

                <div className="tc-field" style={{ marginTop: '12px' }}>
                  <label className="tc-label">
                    المحطات الوسيطة (أسماء أماكن قصيرة، افصل بينها بفاصلة)
                  </label>
                  <input
                    type="text"
                    value={offerForm.intermediate_stops_input}
                    onChange={(e) =>
                      setOfferForm({
                        ...offerForm,
                        intermediate_stops_input: e.target.value,
                      })
                    }
                    placeholder="مثال: شارع الستين، المعمورة، بري"
                    className="tc-input"
                  />
                </div>

                <div className="tc-field" style={{ marginTop: '12px' }}>
                  <label className="tc-label">ملاحظات للركاب (اختياري)</label>
                  <textarea
                    rows="2"
                    maxLength={300}
                    value={offerForm.notes}
                    onChange={(e) => setOfferForm({ ...offerForm, notes: e.target.value })}
                    placeholder="مثال: التحرك من الأزهري عبر شارع الستين، وأنتظر 5 دقائق فقط"
                    className="tc-input"
                  />
                </div>

                <div className="tc-grid-2" style={{ marginTop: '12px' }}>
                  <div className="tc-field">
                    <label className="tc-label">
                      {offerIsRecurring
                        ? 'تاريخ ووقت أول رحلة (توقيت التحرك المعتاد)'
                        : 'موعد المغادرة (في المستقبل)'}{' '}
                      <span className="tc-req">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={offerForm.departure_time}
                      onChange={(e) =>
                        setOfferForm({ ...offerForm, departure_time: e.target.value })
                      }
                      className="tc-input"
                      required
                    />
                  </div>

                  {offerIsRecurring ? (
                    <div className="tc-field">
                      <label className="tc-label">مدة بقاء إعلان الترحيل</label>
                      <select
                        value={offerForm.recurring_valid_days}
                        onChange={(e) =>
                          setOfferForm({
                            ...offerForm,
                            recurring_valid_days: Number(e.target.value),
                          })
                        }
                        className="tc-input"
                      >
                        <option value={7}>أسبوع واحد (7 أيام)</option>
                        <option value={14}>أسبوعان (14 يوماً)</option>
                        <option value={30}>شهر كامل (30 يوماً)</option>
                      </select>
                    </div>
                  ) : (
                    <div className="tc-field">
                      <label className="tc-label">
                        بقاء الإعلان بعد المغادرة (بالساعات)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="72"
                        value={offerForm.expires_after_hours}
                        onChange={(e) =>
                          setOfferForm({
                            ...offerForm,
                            expires_after_hours: e.target.value,
                          })
                        }
                        className="tc-input"
                      />
                    </div>
                  )}
                </div>

                {offerIsRecurring && (
                  <div className="tc-field" style={{ marginTop: '12px' }}>
                    <label className="tc-label">وقت رحلة العودة (اختياري)</label>
                    <input
                      type="time"
                      value={offerForm.return_time}
                      onChange={(e) => setOfferForm({ ...offerForm, return_time: e.target.value })}
                      className="tc-input"
                    />
                    <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#6b8184' }}>
                      إذا كانت لديك رحلة عودة في نفس اليوم (مثلاً بعد المحاضرات)، حدّد وقتها لتظهر في نفس الإعلان.
                    </p>
                  </div>
                )}
              </div>

              <div className="tc-form-section">
                <div className="tc-form-section-title">
                  <Icon name="clock" size={16} />
                  4. المقاعد والتكلفة
                </div>
                <div className="tc-grid-2">
                  <div className="tc-field">
                    <label className="tc-label">
                      إجمالي مقاعد العربة <span className="tc-req">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={offerForm.total_seats}
                      onChange={(e) =>
                        setOfferForm({ ...offerForm, total_seats: e.target.value })
                      }
                      className="tc-input"
                      required
                    />
                  </div>

                  <div className="tc-field">
                    <label className="tc-label">
                      المقاعد المتاحة الآن <span className="tc-req">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={offerForm.available_seats}
                      onChange={(e) =>
                        setOfferForm({ ...offerForm, available_seats: e.target.value })
                      }
                      className="tc-input"
                      required
                    />
                  </div>
                </div>

                <div className="tc-field" style={{ marginTop: '12px' }}>
                  <label className="tc-label">
                    السعر للمقعد بالجنيه السوداني (اختياري)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={offerForm.price_per_seat}
                    onChange={(e) =>
                      setOfferForm({ ...offerForm, price_per_seat: e.target.value })
                    }
                    className="tc-input"
                  />
                  <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#6b8184' }}>
                    إذا تركته 0 يظهر "السعر بالاتفاق". تحديد السعر يقلل الرسائل والمساومة.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="tc-btn tc-btn-primary"
                disabled={offerSubmitting}
              >
                {offerSubmitting
                  ? 'جاري النشر...'
                  : offerIsRecurring
                  ? 'نشر عرض الترحيل المنتظم'
                  : 'نشر عرض التوصيلة'}
              </button>
            </form>
          </section>
        )}

        {/* ======================= اطلب توصيلة / ترحيل ======================= */}
        {tab === TABS.REQUEST && (
          <section className="tc-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '6px',
              }}
            >
              <h2 className="tc-h2" style={{ margin: 0 }}>
                <Icon name="hand" size={20} />
                اطلب توصيلة أو ترحيل (لطلاب جامعة الخرطوم)
              </h2>
              {totalMyAdsCount > 0 && (
                <button
                  type="button"
                  className="tc-btn tc-btn-soft"
                  onClick={() => openAds('mine')}
                >
                  إدارة إعلاناتي ({totalMyAdsCount})
                </button>
              )}
            </div>
            <p className="tc-muted">
              حدد هل تحتاج <strong>توصيلة سريعة لمرة واحدة</strong> أم{' '}
              <strong>ترحيلاً منتظماً</strong> لمجمعك في جامعة الخرطوم، ويمكنك تعديل
              طلبك أو إغلاقه أو حذفه نهائياً في أي وقت من «إعلاناتي».
            </p>

            {requestError && (
              <div className="tc-alert tc-alert-err">{requestError}</div>
            )}

            {savedRequestCode && (
              <div id="tc-request-success" style={{ scrollMarginTop: '100px' }} className="tc-alert tc-alert-ok">
                <strong>تم نشر طلبك وحفظه في «إعلاناتي» بنجاح!</strong>
                <div style={{ marginTop: '5px' }}>
                  يمكنك الآن تعديله أو إغلاقه عند إيجاد توصيلة أو حذفه نهائياً من
                  «إعلاناتي»، وهذا الرمز الاحتياطي إذا احتجته من هاتف آخر:
                </div>
                <div className="tc-code-box">{savedRequestCode}</div>
                <div className="tc-btn-row" style={{ marginTop: '10px' }}>
                  <button
                    type="button"
                    className="tc-btn tc-btn-call"
                    onClick={() => openAds('mine')}
                  >
                    الانتقال إلى إعلاناتي
                  </button>
                  <button
                    type="button"
                    className="tc-btn tc-btn-ghost"
                    onClick={() => handleCopyText(savedRequestCode, 'saved_req')}
                  >
                    <Icon name="copy" size={15} />
                    {copiedId === 'saved_req' ? 'تم النسخ ✓' : 'نسخ الرمز'}
                  </button>
                  <button
                    type="button"
                    className="tc-btn tc-btn-ghost"
                    onClick={() => openAds('requests')}
                  >
                    عرض في الإعلانات
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handlePublishRequest}>
              <div className="tc-form-section">
                <div className="tc-form-section-title">
                  <Icon name="repeat" size={16} />
                  1. نوع الطلب
                </div>
                <div className="tc-chips">
                  {RECURRENCE_CHOICES.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`tc-chip ${
                        requestForm.recurrence_type === opt.value ? 'active' : ''
                      }`}
                      onClick={() =>
                        setRequestForm({ ...requestForm, recurrence_type: opt.value })
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {requestForm.recurrence_type === 'weekdays' && (
                  <div style={{ marginTop: '12px' }}>
                    <label className="tc-label">
                      اختر أيام الترحيل المطلوبة <span className="tc-req">*</span>
                    </label>
                    <div className="tc-chips">
                      {WEEKDAYS.map((day) => (
                        <button
                          key={day.key}
                          type="button"
                          className={`tc-chip ${
                            requestForm.recurrence_days.includes(day.key) ? 'active' : ''
                          }`}
                          onClick={() => toggleRequestRecurrenceDay(day.key)}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="tc-form-section">
                <div className="tc-form-section-title">
                  <Icon name="hand" size={16} />
                  2. بيانات الطالب والتواصل
                </div>
                <div className="tc-grid-2">
                  <div className="tc-field">
                    <label className="tc-label">
                      الاسم <span className="tc-req">*</span>
                    </label>
                    <input
                      type="text"
                      value={requestForm.passenger_name}
                      onChange={(e) =>
                        setRequestForm({ ...requestForm, passenger_name: e.target.value })
                      }
                      placeholder="مثال: سارة علي"
                      className="tc-input"
                      required
                    />
                  </div>

                  <div className="tc-field">
                    <label className="tc-label">
                      عدد المقاعد المطلوبة <span className="tc-req">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={requestForm.seats_needed}
                      onChange={(e) =>
                        setRequestForm({ ...requestForm, seats_needed: e.target.value })
                      }
                      className="tc-input"
                      required
                    />
                  </div>

                  <div className="tc-field">
                    <label className="tc-label">
                      رقم الواتساب <span className="tc-req">*</span>
                    </label>
                    <input
                      type="tel"
                      value={requestForm.whatsapp_number}
                      onChange={(e) =>
                        setRequestForm({
                          ...requestForm,
                          whatsapp_number: e.target.value,
                        })
                      }
                      placeholder="مثال: 0912345678"
                      className="tc-input tc-input-ltr"
                      required
                    />
                  </div>

                  <div className="tc-field">
                    <label className="tc-label">رقم اتصال إضافي (اختياري)</label>
                    <input
                      type="tel"
                      value={requestForm.phone_number}
                      onChange={(e) =>
                        setRequestForm({ ...requestForm, phone_number: e.target.value })
                      }
                      placeholder="اتركه فارغاً لاستخدام رقم الواتساب"
                      className="tc-input tc-input-ltr"
                    />
                  </div>
                </div>
              </div>

              <div className="tc-form-section">
                <div className="tc-form-section-title">
                  <Icon name="route" size={16} />
                  3. المسار والتوقيت
                </div>
                <div className="tc-grid-2">
                  <AreaInput
                    label="منطقة الانطلاق"
                    value={requestForm.start_area}
                    onChange={(val) =>
                      setRequestForm({ ...requestForm, start_area: val })
                    }
                    placeholder="اكتب منطقة انطلاقك"
                  />
                  <AreaInput
                    label="الوجهة"
                    value={requestForm.destination_area}
                    onChange={(val) =>
                      setRequestForm({ ...requestForm, destination_area: val })
                    }
                    placeholder="اكتب المجمع أو الكلية أو المنطقة"
                  />
                </div>

                <div className="tc-grid-2" style={{ marginTop: '12px' }}>
                  <div className="tc-field">
                    <label className="tc-label">
                      {requestIsRecurring
                        ? 'تاريخ ووقت أول يوم (توقيت التحرك المعتاد)'
                        : 'الوقت المفضل للتحرك (في المستقبل)'}{' '}
                      <span className="tc-req">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={requestForm.preferred_time}
                      onChange={(e) =>
                        setRequestForm({ ...requestForm, preferred_time: e.target.value })
                      }
                      className="tc-input"
                      required
                    />
                  </div>

                  {requestIsRecurring ? (
                    <div className="tc-field">
                      <label className="tc-label">مدة بقاء طلب الترحيل</label>
                      <select
                        value={requestForm.recurring_valid_days}
                        onChange={(e) =>
                          setRequestForm({
                            ...requestForm,
                            recurring_valid_days: Number(e.target.value),
                          })
                        }
                        className="tc-input"
                      >
                        <option value={7}>أسبوع واحد (7 أيام)</option>
                        <option value={14}>أسبوعان (14 يوماً)</option>
                        <option value={30}>شهر كامل (30 يوماً)</option>
                      </select>
                    </div>
                  ) : (
                    <div className="tc-field">
                      <label className="tc-label">
                        بقاء الطلب بعد الموعد (بالساعات)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="72"
                        value={requestForm.expires_after_hours}
                        onChange={(e) =>
                          setRequestForm({
                            ...requestForm,
                            expires_after_hours: e.target.value,
                          })
                        }
                        className="tc-input"
                      />
                    </div>
                  )}
                </div>

                <div className="tc-field" style={{ marginTop: '12px' }}>
                  <label className="tc-label">ملاحظات إضافية (اختياري)</label>
                  <textarea
                    rows="2"
                    value={requestForm.notes}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, notes: e.target.value })
                    }
                    placeholder="مثال: الانتظار أمام بوابة الهندسة، أو تفاصيل الرجعة..."
                    className="tc-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="tc-btn tc-btn-primary"
                disabled={requestSubmitting}
              >
                {requestSubmitting
                  ? 'جاري النشر...'
                  : requestIsRecurring
                  ? 'نشر طلب الترحيل المنتظم'
                  : 'نشر طلب التوصيلة'}
              </button>
            </form>
          </section>
        )}

        {/* ======================= الإدارة ======================= */}
        {tab === TABS.ADMIN && (
          <>
            {!session ? (
              <section className="tc-card" style={{ maxWidth: '460px', margin: '12px auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <div className="tc-empty-icon">
                    <Icon name="shield" size={24} />
                  </div>
                  <h2 className="tc-h2" style={{ justifyContent: 'center' }}>
                    دخول لوحة الإدارة
                  </h2>
                  <p className="tc-muted" style={{ marginBottom: 0 }}>
                    مخصصة لمشرف توصيلة السنتر — جامعة الخرطوم.
                  </p>
                </div>

                {loginError && <div className="tc-alert tc-alert-err">{loginError}</div>}

                <form onSubmit={handleAdminLogin}>
                  <div className="tc-field">
                    <label className="tc-label">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="tc-input tc-input-ltr"
                      required
                    />
                  </div>
                  <div className="tc-field">
                    <label className="tc-label">كلمة المرور</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="tc-input tc-input-ltr"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="tc-btn tc-btn-primary"
                    disabled={loginLoading}
                    style={{ marginTop: '6px' }}
                  >
                    {loginLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
                  </button>
                </form>
              </section>
            ) : adminCheckLoading ? (
              <section className="tc-card">
                <p className="tc-muted" style={{ margin: 0 }}>
                  جاري التحقق من صلاحيات المشرف...
                </p>
              </section>
            ) : !isAdmin ? (
              <section className="tc-card">
                <div className="tc-alert tc-alert-err">
                  تم تسجيل الدخول بحساب ({session.user?.email})، لكنه غير مضاف في جدول{' '}
                  <code>admin_users</code>.
                </div>
                <button
                  type="button"
                  className="tc-btn tc-btn-soft"
                  onClick={handleAdminLogout}
                >
                  تسجيل الخروج
                </button>
              </section>
            ) : (
              <>
                <section className="tc-card">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <h2 className="tc-h2" style={{ margin: 0 }}>
                        <Icon name="shield" size={20} />
                        لوحة تحكم الإدارة
                      </h2>
                      <p className="tc-muted" style={{ margin: '4px 0 0' }}>
                        المشرف: {session.user?.email}
                      </p>
                    </div>
                    <div className="tc-btn-row">
                      <button
                        type="button"
                        className="tc-btn tc-btn-soft"
                        onClick={fetchAdminDashboard}
                        disabled={adminDataLoading}
                      >
                        <Icon name="refresh" size={15} />
                        تحديث
                      </button>
                      <button
                        type="button"
                        className="tc-btn tc-btn-warn"
                        onClick={handleDeleteExpiredAds}
                      >
                        <Icon name="trash" size={15} />
                        حذف المنتهي
                      </button>
                      <button
                        type="button"
                        className="tc-btn tc-btn-danger"
                        onClick={handleAdminLogout}
                      >
                        خروج
                      </button>
                    </div>
                  </div>
                </section>

                <div className="tc-admin-stats">
                  <div className="tc-admin-stat">
                    <span className="tc-admin-stat-num">{pendingReportsCount}</span>
                    <span className="tc-admin-stat-label">بلاغات قيد المراجعة</span>
                  </div>
                  <div className="tc-admin-stat">
                    <span className="tc-admin-stat-num">{adminOffers.length}</span>
                    <span className="tc-admin-stat-label">إجمالي العروض</span>
                  </div>
                  <div className="tc-admin-stat">
                    <span className="tc-admin-stat-num">{adminRequests.length}</span>
                    <span className="tc-admin-stat-label">إجمالي الطلبات</span>
                  </div>
                </div>

                {adminFeedback.text && (
                  <div
                    className={`tc-alert ${
                      adminFeedback.type === 'ok' ? 'tc-alert-ok' : 'tc-alert-err'
                    }`}
                  >
                    {adminFeedback.text}
                  </div>
                )}

                <section className="tc-card">
                  <h2 className="tc-h2">البلاغات ({adminReports.length})</h2>
                  {adminDataLoading ? (
                    <div className="tc-skeleton" />
                  ) : adminReports.length === 0 ? (
                    <p className="tc-muted" style={{ marginBottom: 0 }}>
                      لا توجد بلاغات حالياً.
                    </p>
                  ) : (
                    adminReports.map((rep) => {
                      const linkedOffer =
                        rep.target_type === 'offer' ? adminOffersMap[rep.offer_id] : null;
                      const linkedRequest =
                        rep.target_type === 'request'
                          ? adminRequestsMap[rep.request_id]
                          : null;
                      const targetId =
                        rep.target_type === 'offer' ? rep.offer_id : rep.request_id;

                      return (
                        <article key={rep.id} className="tc-listing">
                          <div className="tc-listing-top">
                            <strong>
                              {rep.target_type === 'offer'
                                ? 'بلاغ على عرض سائق'
                                : 'بلاغ على طلب طالب'}
                            </strong>
                            <span
                              className={`tc-badge ${
                                rep.status === 'pending'
                                  ? 'tc-badge-warn'
                                  : rep.status === 'reviewed'
                                  ? 'tc-badge-ok'
                                  : 'tc-badge-neutral'
                              }`}
                            >
                              {rep.status === 'pending'
                                ? 'قيد المراجعة'
                                : rep.status === 'reviewed'
                                ? 'تمت المراجعة'
                                : 'تم التجاهل'}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.88rem', lineHeight: 1.7 }}>
                            <div>
                              <strong>السبب:</strong> {rep.reason}
                            </div>
                            {rep.details && (
                              <div>
                                <strong>تفاصيل:</strong> {rep.details}
                              </div>
                            )}
                            <div style={{ color: '#526b6e', fontSize: '0.82rem' }}>
                              تاريخ البلاغ: {formatDateTime(rep.created_at)}
                            </div>

                            {linkedOffer && (
                              <div className="tc-notes-box" style={{ marginTop: '8px' }}>
                                <strong>الإعلان المرتبط:</strong> {linkedOffer.driver_name}{' '}
                                ({linkedOffer.vehicle_type}) — {linkedOffer.start_area} ←{' '}
                                {linkedOffer.destination_area} • الحالة: {linkedOffer.status}
                              </div>
                            )}

                            {linkedRequest && (
                              <div className="tc-notes-box" style={{ marginTop: '8px' }}>
                                <strong>الطلب المرتبط:</strong>{' '}
                                {linkedRequest.passenger_name} — {linkedRequest.start_area}{' '}
                                ← {linkedRequest.destination_area} • الحالة:{' '}
                                {linkedRequest.status}
                              </div>
                            )}
                          </div>

                          <div className="tc-btn-row" style={{ marginTop: '10px' }}>
                            <button
                              type="button"
                              className="tc-btn tc-btn-soft"
                              onClick={() => handleUpdateReportStatus(rep.id, 'reviewed')}
                            >
                              تمت المراجعة
                            </button>
                            <button
                              type="button"
                              className="tc-btn tc-btn-warn"
                              onClick={() => handleUpdateReportStatus(rep.id, 'dismissed')}
                            >
                              تجاهل
                            </button>
                            <button
                              type="button"
                              className="tc-btn tc-btn-danger"
                              onClick={() =>
                                handleAdminDeleteListing(rep.target_type, targetId)
                              }
                            >
                              <Icon name="trash" size={14} />
                              حذف الإعلان المرتبط
                            </button>
                          </div>
                        </article>
                      );
                    })
                  )}
                </section>

                <section className="tc-card">
                  <h2 className="tc-h2">كل عروض السائقين ({adminOffers.length})</h2>
                  {adminOffers.length === 0 ? (
                    <p className="tc-muted" style={{ marginBottom: 0 }}>
                      لا توجد عروض مسجلة.
                    </p>
                  ) : (
                    adminOffers.map((o) => {
                      const expired = new Date(o.expires_at).getTime() <= Date.now();
                      const recurring = isRecurringType(o.recurrence_type);
                      return (
                        <div key={o.id} className="tc-listing">
                          <div className="tc-listing-top">
                            <strong>
                              {o.driver_name}: {o.start_area} ← {o.destination_area}
                            </strong>
                            <div className="tc-btn-row">
                              <span
                                className={`tc-badge ${
                                  recurring ? 'tc-badge-rec' : 'tc-badge-once'
                                }`}
                              >
                                {recurring ? 'ترحيل منتظم' : 'توصيلة'}
                              </span>
                              <span
                                className={`tc-badge ${
                                  expired || o.status === 'closed'
                                    ? 'tc-badge-full'
                                    : 'tc-badge-ok'
                                }`}
                              >
                                {expired ? 'منتهي' : o.status}
                              </span>
                            </div>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#425d60' }}>
                            الموعد: {formatDateTime(o.departure_time)} • المقاعد:{' '}
                            {o.available_seats}/{o.total_seats}
                          </div>
                          <div style={{ marginTop: '10px' }}>
                            <button
                              type="button"
                              className="tc-btn tc-btn-danger"
                              onClick={() => handleAdminDeleteListing('offer', o.id)}
                            >
                              <Icon name="trash" size={14} />
                              حذف العرض
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </section>

                <section className="tc-card">
                  <h2 className="tc-h2">كل طلبات الطلاب ({adminRequests.length})</h2>
                  {adminRequests.length === 0 ? (
                    <p className="tc-muted" style={{ marginBottom: 0 }}>
                      لا توجد طلبات مسجلة.
                    </p>
                  ) : (
                    adminRequests.map((r) => {
                      const expired = new Date(r.expires_at).getTime() <= Date.now();
                      const recurring = isRecurringType(r.recurrence_type);
                      return (
                        <div key={r.id} className="tc-listing">
                          <div className="tc-listing-top">
                            <strong>
                              {r.passenger_name}: {r.start_area} ← {r.destination_area}
                            </strong>
                            <div className="tc-btn-row">
                              <span
                                className={`tc-badge ${
                                  recurring ? 'tc-badge-rec' : 'tc-badge-once'
                                }`}
                              >
                                {recurring ? 'ترحيل منتظم' : 'توصيلة'}
                              </span>
                              <span
                                className={`tc-badge ${
                                  expired || r.status === 'closed'
                                    ? 'tc-badge-full'
                                    : 'tc-badge-once'
                                }`}
                              >
                                {expired ? 'منتهي' : r.status}
                              </span>
                            </div>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#425d60' }}>
                            الوقت: {formatDateTime(r.preferred_time)} • المقاعد:{' '}
                            {r.seats_needed}
                          </div>
                          <div style={{ marginTop: '10px' }}>
                            <button
                              type="button"
                              className="tc-btn tc-btn-danger"
                              onClick={() => handleAdminDeleteListing('request', r.id)}
                            >
                              <Icon name="trash" size={14} />
                              حذف الطلب
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </section>
              </>
            )}
          </>
        )}
      </main>

      {/* نافذة تعديل الإعلان المنبثقة */}
      {editModal && (
        <div
          className="tc-modal-backdrop"
          onClick={() => {
            if (!editSubmitting) setEditModal(null);
          }}
        >
          <div className="tc-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tc-h3">
              {editModal.kind === 'offer'
                ? 'تعديل عرض السائق'
                : 'تعديل طلب التوصيلة / الترحيل'}
            </h3>

            {editError && <div className="tc-alert tc-alert-err">{editError}</div>}

            <form onSubmit={handleSaveEditModal}>
              {editModal.kind === 'offer' ? (
                <>
                  <div className="tc-field">
                    <label className="tc-label">
                      نوع العربة <span className="tc-req">*</span>
                    </label>
                    <input
                      type="text"
                      value={editModal.vehicle_type}
                      onChange={(e) =>
                        setEditModal({ ...editModal, vehicle_type: e.target.value })
                      }
                      className="tc-input"
                      required
                    />
                  </div>
                  <AreaInput
                    label="منطقة الانطلاق"
                    value={editModal.start_area}
                    onChange={(val) => setEditModal({ ...editModal, start_area: val })}
                  />
                  <AreaInput
                    label="الوجهة"
                    value={editModal.destination_area}
                    onChange={(val) =>
                      setEditModal({ ...editModal, destination_area: val })
                    }
                  />
                  <div className="tc-field">
                    <label className="tc-label">المحطات الوسيطة (افصل بفاصلة)</label>
                    <input
                      type="text"
                      value={editModal.intermediate_stops_input}
                      onChange={(e) =>
                        setEditModal({
                          ...editModal,
                          intermediate_stops_input: e.target.value,
                        })
                      }
                      className="tc-input"
                    />
                  </div>
                  <div className="tc-field">
                    <label className="tc-label">
                      موعد التحرك <span className="tc-req">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={editModal.departure_time}
                      onChange={(e) =>
                        setEditModal({ ...editModal, departure_time: e.target.value })
                      }
                      className="tc-input"
                      required
                    />
                  </div>
                  <div className="tc-grid-2">
                    <div className="tc-field">
                      <label className="tc-label">إجمالي المقاعد</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={editModal.total_seats}
                        onChange={(e) =>
                          setEditModal({ ...editModal, total_seats: e.target.value })
                        }
                        className="tc-input"
                        required
                      />
                    </div>
                    <div className="tc-field">
                      <label className="tc-label">المقاعد المتاحة</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={editModal.available_seats}
                        onChange={(e) =>
                          setEditModal({ ...editModal, available_seats: e.target.value })
                        }
                        className="tc-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="tc-field" style={{ marginTop: '12px' }}>
                    <label className="tc-label">السعر للمقعد (ج.س)</label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={editModal.price_per_seat}
                      onChange={(e) =>
                        setEditModal({ ...editModal, price_per_seat: e.target.value })
                      }
                      className="tc-input"
                    />
                  </div>
                </>
              ) : (
                <>
                  <AreaInput
                    label="منطقة الانطلاق"
                    value={editModal.start_area}
                    onChange={(val) => setEditModal({ ...editModal, start_area: val })}
                  />
                  <AreaInput
                    label="الوجهة"
                    value={editModal.destination_area}
                    onChange={(val) =>
                      setEditModal({ ...editModal, destination_area: val })
                    }
                  />
                  <div className="tc-grid-2">
                    <div className="tc-field">
                      <label className="tc-label">
                        الوقت المفضل <span className="tc-req">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={editModal.preferred_time}
                        onChange={(e) =>
                          setEditModal({ ...editModal, preferred_time: e.target.value })
                        }
                        className="tc-input"
                        required
                      />
                    </div>
                    <div className="tc-field">
                      <label className="tc-label">عدد المقاعد المطلوبة</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={editModal.seats_needed}
                        onChange={(e) =>
                          setEditModal({ ...editModal, seats_needed: e.target.value })
                        }
                        className="tc-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="tc-field" style={{ marginTop: '12px' }}>
                    <label className="tc-label">ملاحظات إضافية</label>
                    <textarea
                      rows="2"
                      value={editModal.notes}
                      onChange={(e) =>
                        setEditModal({ ...editModal, notes: e.target.value })
                      }
                      className="tc-input"
                    />
                  </div>
                </>
              )}

              <div className="tc-btn-row" style={{ marginTop: '14px' }}>
                <button
                  type="submit"
                  className="tc-btn tc-btn-call"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
                <button
                  type="button"
                  className="tc-btn tc-btn-ghost"
                  disabled={editSubmitting}
                  onClick={() => setEditModal(null)}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة البلاغ المنبثقة */}
      {reportTarget && (
        <div
          className="tc-modal-backdrop"
          onClick={() => {
            if (!reportLoading) setReportTarget(null);
          }}
        >
          <div className="tc-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tc-h3" style={{ color: '#b42318' }}>
              إرسال بلاغ عن محتوى
            </h3>
            <p className="tc-muted" style={{ marginBottom: '12px' }}>
              {reportTarget.label}
            </p>
            <form onSubmit={handleSubmitReport}>
              <div className="tc-field">
                <label className="tc-label">
                  سبب البلاغ <span className="tc-req">*</span>
                </label>
                <input
                  type="text"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="مثال: رقم غير صحيح، إعلان مزعج..."
                  className="tc-input"
                  required
                />
              </div>
              <div className="tc-field">
                <label className="tc-label">تفاصيل إضافية (اختياري)</label>
                <textarea
                  rows="3"
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="أضف أي تفاصيل تساعد المشرف..."
                  className="tc-input"
                />
              </div>
              <div className="tc-btn-row" style={{ marginTop: '14px' }}>
                <button
                  type="submit"
                  className="tc-btn tc-btn-danger"
                  disabled={reportLoading}
                >
                  {reportLoading ? 'جاري الإرسال...' : 'تأكيد إرسال البلاغ'}
                </button>
                <button
                  type="button"
                  className="tc-btn tc-btn-ghost"
                  onClick={() => {
                    setReportTarget(null);
                    setReportReason('');
                    setReportDetails('');
                  }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* شريط التنقل السفلي للموبايل */}
      <nav className="tc-bottom-nav" aria-label="التنقل السفلي للموبايل">
        <button
          type="button"
          className={`tc-bottom-btn ${tab === TABS.HOME ? 'active' : ''}`}
          onClick={() => openTab(TABS.HOME)}
        >
          <Icon name="home" size={20} />
          <span>الرئيسية</span>
        </button>
        <button
          type="button"
          className={`tc-bottom-btn ${tab === TABS.ADS ? 'active' : ''}`}
          onClick={() => openAds('all')}
        >
          {totalLiveAds > 0 && (
            <span className="tc-bottom-count">{totalLiveAds}</span>
          )}
          <Icon name="ads" size={20} />
          <span>الإعلانات</span>
        </button>
        <button
          type="button"
          className={`tc-bottom-btn ${tab === TABS.OFFER ? 'active' : ''}`}
          onClick={() => openTab(TABS.OFFER)}
        >
          <Icon name="car" size={20} />
          <span>أعرض</span>
        </button>
        <button
          type="button"
          className={`tc-bottom-btn ${tab === TABS.REQUEST ? 'active' : ''}`}
          onClick={() => openTab(TABS.REQUEST)}
        >
          <Icon name="hand" size={20} />
          <span>اطلب</span>
        </button>
        <button
          type="button"
          className={`tc-bottom-btn ${tab === TABS.ADMIN ? 'active' : ''}`}
          onClick={() => openTab(TABS.ADMIN)}
        >
          <Icon name="shield" size={20} />
          <span>الإدارة</span>
        </button>
      </nav>
    </div>
  );
}