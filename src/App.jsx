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
  SEARCH: 'search',
  OFFER: 'offer',
  REQUEST: 'request',
  ADMIN: 'admin',
};

const MY_OFFERS_STORAGE_KEY = 'tawseelat_my_offers_v1';

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
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.22);
  font-size: 0.76rem;
  font-weight: 700;
  color: #e6fffb;
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

/* Hero with University of Khartoum Background Image Support (/uofk-bg.jpg) */
.tc-hero {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  padding: 26px 20px;
  margin-bottom: 18px;
  background-color: #09464d;
  background-image:
    linear-gradient(135deg, rgba(7, 56, 62, 0.84) 0%, rgba(13, 92, 99, 0.76) 55%, rgba(20, 122, 110, 0.80) 100%),
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
  background: radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 70%);
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
  gap: 8px;
}

.tc-stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 13px;
  border-radius: 12px;
  background: rgba(7, 45, 50, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.24);
  backdrop-filter: blur(6px);
  font-size: 0.82rem;
  font-weight: 700;
  color: #ffffff;
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
.tc-segmented {
  display: grid;
  grid-template-columns: 1fr 1fr;
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
  padding: 10px 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--text-muted);
  font-family: inherit;
  font-size: 0.89rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
}

.tc-seg-btn.active {
  background: #ffffff;
  color: var(--primary-dark);
  box-shadow: 0 2px 8px rgba(11, 56, 62, 0.1);
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

/* Seat stepper in My Ads */
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
  max-width: 460px;
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
        <svg {...common}>
          <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.5L3 20l1.2-5.1A8.5 8.5 0 1 1 21 11.5Z" />
          <path d="M9.5 9.5c.3 1.7 2.3 3.7 4 4" />
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

function loadMySavedOffers() {
  try {
    const raw = window.localStorage.getItem(MY_OFFERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMySavedOffers(list) {
  try {
    window.localStorage.setItem(MY_OFFERS_STORAGE_KEY, JSON.stringify(list));
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
  const pad = (n) => String(n).padStart(2, '0');
  return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(
    dateObj.getDate()
  )}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
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
  const offerId = cleaned.slice(0, idx).trim();
  const manageToken = cleaned.slice(idx + 1).trim();
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(offerId) || !manageToken) return null;
  return { offerId, manageToken };
}

function AreaInput({ label, value, onChange, placeholder }) {
  const isPreset = POPULAR_AREAS.includes(value);
  const [customMode, setCustomMode] = useState(Boolean(value) && !isPreset);

  useEffect(() => {
    if (value && !POPULAR_AREAS.includes(value)) {
      setCustomMode(true);
    }
  }, [value]);

  const handleSelect = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setCustomMode(true);
      onChange('');
    } else {
      setCustomMode(false);
      onChange(val);
    }
  };

  return (
    <div className="tc-field">
      <label className="tc-label">
        {label} <span className="tc-req">*</span>
      </label>
      <select
        value={customMode ? '__custom__' : value}
        onChange={handleSelect}
        className="tc-input"
      >
        <option value="">-- اختر مجمعاً أو منطقة أو اكتب موقعاً مخصصاً --</option>
        {POPULAR_AREAS.map((area) => (
          <option key={area} value={area}>
            {area}
          </option>
        ))}
        <option value="__custom__">موقع آخر (كتابة يدوية)...</option>
      </select>
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

function RouteTimeline({ start, destination, stops = [] }) {
  return (
    <div className="tc-route-box">
      <div className="tc-route-point">
        <span className="tc-dot-start" />
        <span>{start}</span>
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
        <span>{destination}</span>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState(TABS.HOME);
  const [offerSubTab, setOfferSubTab] = useState('publish');
  const [boardSection, setBoardSection] = useState('all');

  // حالة البحث واللوحة العامة
  const [offers, setOffers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardError, setBoardError] = useState('');
  const [searchStart, setSearchStart] = useState('');
  const [searchDest, setSearchDest] = useState('');
  const [searchTripKind, setSearchTripKind] = useState('all');

  // إعلاناتي المحفوظة محلياً على هذا الجهاز
  const [myOffers, setMyOffers] = useState(() => loadMySavedOffers());
  const [busyMyOfferId, setBusyMyOfferId] = useState('');
  const [myOffersFeedback, setMyOffersFeedback] = useState({ type: '', text: '' });
  const [copiedOfferId, setCopiedOfferId] = useState('');

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
    recurring_valid_days: 14,
  });
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerError, setOfferError] = useState('');
  const [savedManageCode, setSavedManageCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // إدارة السائق لإعلانه يدوياً برمز الإدارة
  const [manageCodeInput, setManageCodeInput] = useState('');
  const [manageSeatsInput, setManageSeatsInput] = useState(1);
  const [manageLoading, setManageLoading] = useState(false);
  const [manageFeedback, setManageFeedback] = useState({ type: '', text: '' });

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
  const [requestSuccess, setRequestSuccess] = useState('');

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
      saveMySavedOffers(next);
      return next;
    });
  };

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
      const [offersRes, requestsRes] = await Promise.all([
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

      if (offersRes.error) throw offersRes.error;
      if (requestsRes.error) throw requestsRes.error;

      const liveOffers = offersRes.data || [];
      setOffers(liveOffers);
      setRequests(requestsRes.data || []);

      if (liveOffers.length > 0) {
        const liveMap = Object.fromEntries(liveOffers.map((o) => [o.id, o]));
        persistMyOffers((prev) =>
          prev.map((item) => {
            const match = liveMap[item.id];
            if (!match) return item;
            return {
              ...item,
              available_seats: match.available_seats,
              total_seats: match.total_seats,
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
    if (tab === TABS.SEARCH || tab === TABS.HOME) {
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
      .filter((o) => {
        const stopsText = Array.isArray(o.intermediate_stops)
          ? o.intermediate_stops.join(' ')
          : '';
        const startHaystack = `${o.start_area || ''} ${stopsText}`.toLowerCase();
        const destHaystack = `${o.destination_area || ''} ${stopsText}`.toLowerCase();
        return (
          (!startQ || startHaystack.includes(startQ)) &&
          (!destQ || destHaystack.includes(destQ))
        );
      })
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
      .filter((r) => {
        const okStart = !startQ || (r.start_area || '').toLowerCase().includes(startQ);
        const okDest = !destQ || (r.destination_area || '').toLowerCase().includes(destQ);
        return okStart && okDest;
      })
      .sort((a, b) => {
        const timeDiff =
          getEffectiveSortTimestamp(a.preferred_time, a.recurrence_type) -
          getEffectiveSortTimestamp(b.preferred_time, b.recurrence_type);
        if (timeDiff !== 0) return timeDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [requests, searchStart, searchDest, searchTripKind]);

  const activeMyOffersCount = useMemo(() => {
    const nowMs = Date.now();
    return myOffers.filter(
      (item) =>
        item.status !== 'closed' &&
        (!item.expires_at || new Date(item.expires_at).getTime() > nowMs)
    ).length;
  }, [myOffers]);

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
    setSavedManageCode('');
    setCopiedCode(false);

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

    setOfferSubmitting(true);
    try {
      const { error } = await supabase.from('ride_offers').insert(payload);
      if (error) throw error;

      const combinedCode = `${generatedId}_${generatedToken}`;
      setSavedManageCode(combinedCode);

      const savedEntry = {
        id: generatedId,
        manageToken: generatedToken,
        manageCode: combinedCode,
        driver_name: driverName,
        vehicle_type: vehicleType,
        start_area: startArea,
        destination_area: destArea,
        departure_time: depDate.toISOString(),
        recurrence_type: offerForm.recurrence_type,
        recurrence_days:
          offerForm.recurrence_type === 'weekdays' ? offerForm.recurrence_days : [],
        expires_at: expiresDate.toISOString(),
        total_seats: totalSeats,
        available_seats: availableSeats,
        status: availableSeats === 0 ? 'full' : 'active',
        created_at: new Date().toISOString(),
      };
      persistMyOffers((prev) => [savedEntry, ...prev]);

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
        recurring_valid_days: 14,
      });
    } catch (err) {
      setOfferError(err?.message || 'حدث خطأ أثناء نشر العرض.');
    } finally {
      setOfferSubmitting(false);
    }
  };

  const handleCopyText = async (text, offerIdKey) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      if (offerIdKey) {
        setCopiedOfferId(offerIdKey);
        setTimeout(() => setCopiedOfferId(''), 2200);
      } else {
        setCopiedCode(true);
      }
    } catch {
      if (!offerIdKey) setCopiedCode(false);
    }
  };

  const handleQuickManageMyOffer = async (item, nextSeats, nextStatus) => {
    setMyOffersFeedback({ type: '', text: '' });
    if (!supabase) {
      setMyOffersFeedback({
        type: 'error',
        text: 'إعدادات الاتصال بقاعدة البيانات غير مكتملة.',
      });
      return;
    }

    if (nextStatus === 'closed') {
      const confirmed = window.confirm(
        'هل تريد إغلاق هذا الإعلان نهائياً؟ سيختفي فوراً من صفحة البحث.'
      );
      if (!confirmed) return;
    }

    const total = Math.max(1, Number(item.total_seats) || 1);
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

    setBusyMyOfferId(item.id);
    try {
      const { data, error } = await supabase.rpc('driver_manage_offer', {
        p_offer_id: item.id,
        p_manage_token: item.manageToken,
        p_available_seats: clampedSeats,
        p_status: effectiveStatus,
      });

      if (error) throw error;
      if (!data) {
        setMyOffersFeedback({
          type: 'error',
          text: 'تعذر تحديث الإعلان؛ ربما تم حذفه سابقاً من قِبل الإدارة أو انتهت صلاحيته.',
        });
        return;
      }

      persistMyOffers((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? { ...entry, available_seats: clampedSeats, status: effectiveStatus }
            : entry
        )
      );

      const okMsg =
        effectiveStatus === 'closed'
          ? `تم إغلاق إعلان (${item.start_area} ← ${item.destination_area}) بنجاح.`
          : effectiveStatus === 'full'
          ? `تم تعليم رحلة (${item.start_area} ← ${item.destination_area}) كمكتملة.`
          : `تم تحديث المقاعد المتاحة إلى ${clampedSeats} من ${total}.`;

      setMyOffersFeedback({ type: 'ok', text: okMsg });
      fetchPublicListings();
    } catch (err) {
      setMyOffersFeedback({
        type: 'error',
        text: err?.message || 'حدث خطأ أثناء تحديث الإعلان.',
      });
    } finally {
      setBusyMyOfferId('');
    }
  };

  const handleRemoveFromMyDevice = (offerId) => {
    persistMyOffers((prev) => prev.filter((item) => item.id !== offerId));
    setMyOffersFeedback({
      type: 'ok',
      text: 'تمت إزالة البطاقة من قائمة جهازك فقط.',
    });
  };

  const handleDriverManageAction = async (nextStatus) => {
    setManageFeedback({ type: '', text: '' });
    if (!supabase) {
      setManageFeedback({
        type: 'error',
        text: 'إعدادات الاتصال بقاعدة البيانات غير مكتملة.',
      });
      return;
    }

    const parsed = parseManageCode(manageCodeInput);
    if (!parsed) {
      setManageFeedback({
        type: 'error',
        text: 'صيغة رمز الإدارة غير صحيحة. الصق الرمز كاملاً كما ظهر عند النشر (مع الشرطة السفلية _).',
      });
      return;
    }

    const seatsNum =
      nextStatus === 'active' ? Math.max(0, parseInt(manageSeatsInput, 10) || 0) : 0;

    setManageLoading(true);
    try {
      const { data, error } = await supabase.rpc('driver_manage_offer', {
        p_offer_id: parsed.offerId,
        p_manage_token: parsed.manageToken,
        p_available_seats: seatsNum,
        p_status: nextStatus,
      });

      if (error) throw error;
      if (!data) {
        setManageFeedback({
          type: 'error',
          text: 'لم يتم العثور على الإعلان أو أن رمز الإدارة غير صحيح.',
        });
        return;
      }

      const finalStatus =
        nextStatus === 'closed'
          ? 'closed'
          : nextStatus === 'full' || seatsNum === 0
          ? 'full'
          : 'active';

      persistMyOffers((prev) =>
        prev.map((entry) =>
          entry.id === parsed.offerId
            ? { ...entry, available_seats: seatsNum, status: finalStatus }
            : entry
        )
      );

      const successText =
        nextStatus === 'closed'
          ? 'تم إغلاق الإعلان بنجاح ولن يظهر للباحثين.'
          : nextStatus === 'full'
          ? 'تم تعليم الرحلة كمكتملة (0 مقاعد متاحة).'
          : `تم تحديث المقاعد المتاحة إلى ${seatsNum} بنجاح.`;

      setManageFeedback({ type: 'ok', text: successText });
      fetchPublicListings();
    } catch (err) {
      setManageFeedback({
        type: 'error',
        text: err?.message || 'تعذر تنفيذ تحديث الإعلان حالياً.',
      });
    } finally {
      setManageLoading(false);
    }
  };

  const handlePublishRequest = async (e) => {
    e.preventDefault();
    setRequestError('');
    setRequestSuccess('');

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

    const payload = {
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
    };

    setRequestSubmitting(true);
    try {
      const { error } = await supabase.from('ride_requests').insert(payload);
      if (error) throw error;

      setRequestSuccess(
        recurring
          ? 'تم نشر طلب الترحيل المنتظم بنجاح! سيبقى ظاهراً للسائقين طوال المدة التي اخترتها.'
          : 'تم نشر طلب التوصيلة بنجاح! سيظهر الآن لأصحاب العربات في صفحة البحث.'
      );
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
    } catch (err) {
      setRequestError(err?.message || 'حدث خطأ أثناء نشر الطلب.');
    } finally {
      setRequestSubmitting(false);
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

  return (
    <div className="tc-app">
      <style>{APP_CSS}</style>

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
              className={`tc-nav-pill ${tab === TABS.SEARCH ? 'active' : ''}`}
              onClick={() => openTab(TABS.SEARCH)}
            >
              <Icon name="search" size={16} />
              البحث
            </button>
            <button
              type="button"
              className={`tc-nav-pill ${tab === TABS.OFFER ? 'active' : ''}`}
              onClick={() => {
                setOfferSubTab('publish');
                openTab(TABS.OFFER);
              }}
            >
              <Icon name="car" size={16} />
              أعرض مشواراً {activeMyOffersCount > 0 ? `(${activeMyOffersCount})` : ''}
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

          <div className="tc-live-dot-badge">
            <span className="tc-pulse-dot" />
            <span>{filteredOffers.length + filteredRequests.length} متاح</span>
          </div>
        </div>
      </header>

      <main className="tc-main">
        {!supabase && (
          <div className="tc-alert tc-alert-err">
            تنبيه إعداد: لم يتم العثور على <code>VITE_SUPABASE_URL</code> أو{' '}
            <code>VITE_SUPABASE_ANON_KEY</code>. أضفهما في إعدادات Netlify أو ملف{' '}
            <code>.env</code> ثم أعد النشر.
          </div>
        )}

        {/* ======================= الرئيسية ======================= */}
        {tab === TABS.HOME && (
          <>
            <section className="tc-hero">
              <div className="tc-hero-kicker">
                <Icon name="campus" size={15} />
                <span>مبادرة طلابية لطلاب جامعة الخرطوم</span>
              </div>
              <h2 className="tc-hero-title">مشوارك لجامعة الخرطوم أسهل وأوفر مع زملائك</h2>
              <p className="tc-hero-desc">
                منصة مجانية تربط طلاب جامعة الخرطوم أصحاب العربات بزملائهم على نفس
                المسار لمجمعات الوسط وشمبات والطب والتربية — سواء لـ{' '}
                <strong>توصيلة سريعة لليوم</strong> أو{' '}
                <strong>ترحيل منتظم يومي أو أسبوعي</strong>، بدون تسجيل حساب.
              </p>
              <div className="tc-stats-strip">
                <span className="tc-stat-chip">
                  <Icon name="car" size={16} />
                  {filteredOffers.length} عرض سائق متاح الآن
                </span>
                <span className="tc-stat-chip">
                  <Icon name="hand" size={16} />
                  {filteredRequests.length} طلب طالب نشط
                </span>
              </div>
            </section>

            <section className="tc-actions-grid">
              <button
                type="button"
                className="tc-action-tile primary"
                onClick={() => openTab(TABS.SEARCH)}
              >
                <span
                  className="tc-tile-icon"
                  style={{ background: '#0b555c', color: '#ffffff' }}
                >
                  <Icon name="search" size={24} />
                </span>
                <span className="tc-tile-body">
                  <span className="tc-tile-title">أبحث عن توصيلة أو ترحيل</span>
                  <span className="tc-tile-sub">
                    تصفح عروض السائقين وطلبات طلاب جامعة الخرطوم وفلتر حسب المسار
                  </span>
                </span>
                <span className="tc-tile-arrow">
                  <Icon name="chevronLeft" size={20} />
                </span>
              </button>

              <button
                type="button"
                className="tc-action-tile"
                onClick={() => {
                  setOfferSubTab('publish');
                  openTab(TABS.OFFER);
                }}
              >
                <span
                  className="tc-tile-icon"
                  style={{ background: '#e6f7ed', color: '#15803d' }}
                >
                  <Icon name="car" size={24} />
                </span>
                <span className="tc-tile-body">
                  <span className="tc-tile-title">أعرض توصيلة أو ترحيل (لدي عربة)</span>
                  <span className="tc-tile-sub">
                    شارك مقاعدك الفارغة مع زملائك وتحكم بها بضغطة زر من جهازك
                  </span>
                </span>
                <span className="tc-tile-arrow">
                  <Icon name="chevronLeft" size={20} />
                </span>
              </button>

              <button
                type="button"
                className="tc-action-tile"
                onClick={() => openTab(TABS.REQUEST)}
              >
                <span
                  className="tc-tile-icon"
                  style={{ background: '#fef5e7', color: '#c47119' }}
                >
                  <Icon name="hand" size={24} />
                </span>
                <span className="tc-tile-body">
                  <span className="tc-tile-title">أطلب توصيلة أو ترحيل</span>
                  <span className="tc-tile-sub">
                    انشر منطقتك ومجمعك الجامعي وموعدك ليتواصل معك السائقون مباشرة
                  </span>
                </span>
                <span className="tc-tile-arrow">
                  <Icon name="chevronLeft" size={20} />
                </span>
              </button>
            </section>

            {myOffers.length > 0 && (
              <section className="tc-card" style={{ padding: '14px 16px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <strong style={{ color: '#073e44', fontSize: '0.96rem' }}>
                      لديك {myOffers.length} إعلان محفوظ على هذا الجهاز
                    </strong>
                    <div style={{ fontSize: '0.82rem', color: '#526b6e' }}>
                      عدّل عدد المقاعد أو أغلق الإعلان فوراً بدون إدخال الرمز.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="tc-btn tc-btn-soft"
                    onClick={() => {
                      setOfferSubTab('my_ads');
                      openTab(TABS.OFFER);
                    }}
                  >
                    إدارة إعلاناتي
                  </button>
                </div>
              </section>
            )}

            <section className="tc-card">
              <h3 className="tc-h3">توصيلة سريعة أم ترحيل منتظم؟</h3>
              <div className="tc-info-grid">
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
            </section>
          </>
        )}

        {/* ======================= البحث ======================= */}
        {tab === TABS.SEARCH && (
          <>
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
                  <Icon name="search" size={20} />
                  ابحث عن توصيلة أو ترحيل
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

            <div
              className="tc-segmented"
              style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
            >
              <button
                type="button"
                className={`tc-seg-btn ${boardSection === 'all' ? 'active' : ''}`}
                onClick={() => setBoardSection('all')}
              >
                الكل ({filteredOffers.length + filteredRequests.length})
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
            </div>

            {boardError && <div className="tc-alert tc-alert-err">{boardError}</div>}

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
                    const isFull =
                      offer.status === 'full' || Number(offer.available_seats) <= 0;
                    const recurring = isRecurringType(offer.recurrence_type);
                    const kindText = recurring ? 'ترحيل منتظم' : 'توصيلة';
                    const timeText = recurring
                      ? `الساعة ${formatTimeOnly(offer.departure_time)} (${formatRecurrence(
                          offer.recurrence_type,
                          offer.recurrence_days
                        )})`
                      : formatDateTime(offer.departure_time);
                    const waText = `السلام عليكم كابتن ${offer.driver_name}، شاهدت عرض (${kindText}) في توصيلة السنتر - جامعة الخرطوم من (${offer.start_area}) إلى (${offer.destination_area}) — ${timeText}. هل يوجد مقعد متاح؟`;
                    const waHref = buildWhatsAppLink(offer.whatsapp_number, waText);
                    const telHref = buildTelLink(
                      offer.phone_number || offer.whatsapp_number
                    );

                    return (
                      <article key={offer.id} className="tc-listing">
                        <div className="tc-listing-top">
                          <div className="tc-btn-row">
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
                                : `متاح ${offer.available_seats} من ${offer.total_seats}`}
                            </span>
                          </div>
                          <span className="tc-price-tag">
                            {Number(offer.price_per_seat) > 0
                              ? `${Number(offer.price_per_seat).toLocaleString()} ج.س`
                              : 'مجاناً / بالاتفاق'}
                          </span>
                        </div>

                        <RouteTimeline
                          start={offer.start_area}
                          destination={offer.destination_area}
                          stops={offer.intermediate_stops}
                        />

                        <div className="tc-meta-grid">
                          <span className="tc-meta-item">
                            <Icon name="car" size={15} />
                            <strong>{offer.driver_name}</strong> • {offer.vehicle_type}
                          </span>
                          <span className="tc-meta-item">
                            <Icon name="clock" size={15} />
                            {timeText}
                          </span>
                        </div>

                        <div className="tc-listing-footer">
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
                                type: 'offer',
                                id: offer.id,
                                label: `عرض السائق ${offer.driver_name} (${offer.start_area} ← ${offer.destination_area})`,
                              });
                            }}
                          >
                            <Icon name="flag" size={14} />
                            إبلاغ
                          </button>
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
                      <article key={req.id} className="tc-listing">
                        <div className="tc-listing-top">
                          <div className="tc-btn-row">
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
                        </div>

                        {req.notes && (
                          <div className="tc-notes-box">{req.notes}</div>
                        )}

                        <div className="tc-listing-footer">
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
                        </div>
                      </article>
                    );
                  })
                )}
              </section>
            )}
          </>
        )}

        {/* ======================= أعرض مشواراً + إعلاناتي ======================= */}
        {tab === TABS.OFFER && (
          <>
            <div className="tc-segmented">
              <button
                type="button"
                className={`tc-seg-btn ${offerSubTab === 'publish' ? 'active' : ''}`}
                onClick={() => setOfferSubTab('publish')}
              >
                <Icon name="car" size={16} />
                نشر عرض جديد
              </button>
              <button
                type="button"
                className={`tc-seg-btn ${offerSubTab === 'my_ads' ? 'active' : ''}`}
                onClick={() => setOfferSubTab('my_ads')}
              >
                <Icon name="route" size={16} />
                إعلاناتي ({myOffers.length})
              </button>
            </div>

            {offerSubTab === 'publish' && (
              <section className="tc-card">
                <h2 className="tc-h2">
                  <Icon name="car" size={20} />
                  أعرض توصيلة أو ترحيل (لأصحاب العربات)
                </h2>
                <p className="tc-muted">
                  انشر رحلتك لطلاب جامعة الخرطوم، وسيُحفظ إعلانك تلقائياً في «إعلاناتي»
                  للتحكم بالمقاعد أو الإغلاق بضغطة زر.
                </p>

                {offerError && <div className="tc-alert tc-alert-err">{offerError}</div>}

                {savedManageCode && (
                  <div className="tc-alert tc-alert-ok">
                    <strong>تم نشر العرض وحفظه في «إعلاناتي» بنجاح!</strong>
                    <div style={{ marginTop: '5px' }}>
                      يمكنك إدارته الآن مباشرة من قسم «إعلاناتي»، أو نسخ هذا الرمز
                      الاحتياطي إذا أردت التعديل من هاتف آخر:
                    </div>
                    <div className="tc-code-box">{savedManageCode}</div>
                    <div className="tc-btn-row" style={{ marginTop: '10px' }}>
                      <button
                        type="button"
                        className="tc-btn tc-btn-soft"
                        onClick={() => setOfferSubTab('my_ads')}
                      >
                        الانتقال إلى إعلاناتي
                      </button>
                      <button
                        type="button"
                        className="tc-btn tc-btn-ghost"
                        onClick={() => handleCopyText(savedManageCode, '')}
                      >
                        <Icon name="copy" size={15} />
                        {copiedCode ? 'تم النسخ ✓' : 'نسخ الرمز'}
                      </button>
                      <button
                        type="button"
                        className="tc-btn tc-btn-ghost"
                        onClick={() => openTab(TABS.SEARCH)}
                      >
                        عرض في البحث
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
                                offerForm.recurrence_days.includes(day.key)
                                  ? 'active'
                                  : ''
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
                            setOfferForm({
                              ...offerForm,
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
                        onChange={(val) =>
                          setOfferForm({ ...offerForm, start_area: val })
                        }
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
                        المحطات الوسيطة في المسار (اختياري، افصل بينها بفاصلة)
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
                            setOfferForm({
                              ...offerForm,
                              departure_time: e.target.value,
                            })
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
                            setOfferForm({
                              ...offerForm,
                              available_seats: e.target.value,
                            })
                          }
                          className="tc-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="tc-field" style={{ marginTop: '12px' }}>
                      <label className="tc-label">
                        السعر للمقعد (جنيه سوداني — اكتب 0 إذا كان مجاناً أو بالاتفاق)
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

            {offerSubTab === 'my_ads' && (
              <>
                <section className="tc-card">
                  <h2 className="tc-h2">
                    <Icon name="route" size={20} />
                    إعلاناتي المحفوظة على هذا الجهاز ({myOffers.length})
                  </h2>
                  <div className="tc-alert tc-alert-info">
                    تُحفظ هذه القائمة محلياً داخل متصفح جهازك فقط، لتتمكن من تعديل المقاعد
                    أو إغلاق الإعلان فوراً دون إدخال رمز الإدارة.
                  </div>

                  {myOffersFeedback.text && (
                    <div
                      className={`tc-alert ${
                        myOffersFeedback.type === 'ok' ? 'tc-alert-ok' : 'tc-alert-err'
                      }`}
                    >
                      {myOffersFeedback.text}
                    </div>
                  )}

                  {myOffers.length === 0 ? (
                    <div className="tc-empty">
                      <div className="tc-empty-icon">
                        <Icon name="car" size={24} />
                      </div>
                      <div style={{ fontWeight: 700, marginBottom: '6px' }}>
                        لا توجد إعلانات محفوظة على هذا الجهاز بعد
                      </div>
                      <p className="tc-muted">
                        بمجرد نشر أول عرض سيظهر هنا تلقائياً بأزرار التحكم السريع.
                      </p>
                      <button
                        type="button"
                        className="tc-btn tc-btn-soft"
                        onClick={() => setOfferSubTab('publish')}
                      >
                        نشر أول عرض الآن
                      </button>
                    </div>
                  ) : (
                    myOffers.map((item) => {
                      const isExpired =
                        item.expires_at &&
                        new Date(item.expires_at).getTime() <= Date.now();
                      const isClosed = item.status === 'closed';
                      const isFull =
                        item.status === 'full' || Number(item.available_seats) <= 0;
                      const recurring = isRecurringType(item.recurrence_type);
                      const isBusy = busyMyOfferId === item.id;
                      const currentSeats = Number(item.available_seats) || 0;
                      const totalSeats = Math.max(1, Number(item.total_seats) || 1);

                      return (
                        <article key={item.id} className="tc-listing">
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
                          </div>

                          <RouteTimeline
                            start={item.start_area}
                            destination={item.destination_area}
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
                                <>
                                  <div className="tc-seat-stepper">
                                    <button
                                      type="button"
                                      className="tc-step-btn"
                                      disabled={isBusy || currentSeats <= 0}
                                      onClick={() =>
                                        handleQuickManageMyOffer(
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
                                        handleQuickManageMyOffer(
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

                                  <button
                                    type="button"
                                    className="tc-btn tc-btn-warn"
                                    disabled={isBusy || isFull}
                                    onClick={() =>
                                      handleQuickManageMyOffer(item, 0, 'full')
                                    }
                                  >
                                    اكتملت
                                  </button>

                                  <button
                                    type="button"
                                    className="tc-btn tc-btn-danger"
                                    disabled={isBusy}
                                    onClick={() =>
                                      handleQuickManageMyOffer(item, 0, 'closed')
                                    }
                                  >
                                    إغلاق الإعلان
                                  </button>
                                </>
                              )}
                            </div>

                            <div className="tc-btn-row">
                              <button
                                type="button"
                                className="tc-btn tc-btn-ghost"
                                onClick={() =>
                                  handleCopyText(item.manageCode, item.id)
                                }
                              >
                                <Icon name="copy" size={14} />
                                {copiedOfferId === item.id ? 'نُسخ ✓' : 'الرمز'}
                              </button>
                              <button
                                type="button"
                                className="tc-btn tc-btn-ghost"
                                onClick={() => handleRemoveFromMyDevice(item.id)}
                              >
                                إزالة
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  )}
                </section>

                <section className="tc-card">
                  <h3 className="tc-h3">إدارة إعلان برمز يدوي (من جهاز آخر)</h3>
                  <p className="tc-muted">
                    إذا نشرت إعلانك من هاتف آخر، الصق رمز الإدارة (
                    <code>id_token</code>) هنا لتحديث المقاعد أو إغلاقه.
                  </p>

                  {manageFeedback.text && (
                    <div
                      className={`tc-alert ${
                        manageFeedback.type === 'ok' ? 'tc-alert-ok' : 'tc-alert-err'
                      }`}
                    >
                      {manageFeedback.text}
                    </div>
                  )}

                  <div className="tc-grid-2">
                    <div className="tc-field">
                      <label className="tc-label">رمز الإدارة الكامل (id_token)</label>
                      <input
                        type="text"
                        value={manageCodeInput}
                        onChange={(e) => setManageCodeInput(e.target.value)}
                        placeholder="الصق الرمز هنا..."
                        className="tc-input tc-input-ltr"
                      />
                    </div>
                    <div className="tc-field">
                      <label className="tc-label">عدد المقاعد المتاحة الجديد</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={manageSeatsInput}
                        onChange={(e) => setManageSeatsInput(e.target.value)}
                        className="tc-input"
                      />
                    </div>
                  </div>

                  <div className="tc-btn-row" style={{ marginTop: '12px' }}>
                    <button
                      type="button"
                      className="tc-btn tc-btn-soft"
                      disabled={manageLoading}
                      onClick={() => handleDriverManageAction('active')}
                    >
                      تحديث المقاعد
                    </button>
                    <button
                      type="button"
                      className="tc-btn tc-btn-warn"
                      disabled={manageLoading}
                      onClick={() => handleDriverManageAction('full')}
                    >
                      اكتملت المقاعد
                    </button>
                    <button
                      type="button"
                      className="tc-btn tc-btn-danger"
                      disabled={manageLoading}
                      onClick={() => handleDriverManageAction('closed')}
                    >
                      إغلاق الإعلان نهائياً
                    </button>
                  </div>
                </section>
              </>
            )}
          </>
        )}

        {/* ======================= اطلب توصيلة / ترحيل ======================= */}
        {tab === TABS.REQUEST && (
          <section className="tc-card">
            <h2 className="tc-h2">
              <Icon name="hand" size={20} />
              اطلب توصيلة أو ترحيل (لطلاب جامعة الخرطوم)
            </h2>
            <p className="tc-muted">
              حدد هل تحتاج <strong>توصيلة سريعة لمرة واحدة</strong> أم{' '}
              <strong>ترحيلاً منتظماً</strong> لمجمعك في جامعة الخرطوم ليتواصل معك
              أصحاب العربات على نفس المسار.
            </p>

            {requestError && (
              <div className="tc-alert tc-alert-err">{requestError}</div>
            )}
            {requestSuccess && (
              <div className="tc-alert tc-alert-ok">
                <div>{requestSuccess}</div>
                <div style={{ marginTop: '10px' }}>
                  <button
                    type="button"
                    className="tc-btn tc-btn-soft"
                    onClick={() => openTab(TABS.SEARCH)}
                  >
                    الانتقال لصفحة البحث
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
          className={`tc-bottom-btn ${tab === TABS.SEARCH ? 'active' : ''}`}
          onClick={() => openTab(TABS.SEARCH)}
        >
          <Icon name="search" size={20} />
          <span>البحث</span>
        </button>
        <button
          type="button"
          className={`tc-bottom-btn ${tab === TABS.OFFER ? 'active' : ''}`}
          onClick={() => {
            setOfferSubTab('publish');
            openTab(TABS.OFFER);
          }}
        >
          {activeMyOffersCount > 0 && (
            <span className="tc-bottom-count">{activeMyOffersCount}</span>
          )}
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
