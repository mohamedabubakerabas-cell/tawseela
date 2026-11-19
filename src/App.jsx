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
  'السنتر / الجامعات',
  'الخرطوم - السوق العربي',
  'الخرطوم - الرياض',
  'الخرطوم - العمارات',
  'الخرطوم - الصحافة',
  'الخرطوم - جبرة',
  'الخرطوم - الكلاكلة',
  'بحري - المؤسسة',
  'بحري - شمبات',
  'أم درمان - السوق الشعبي',
  'أم درمان - الثورة',
  'أم درمان - الموردة',
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
    // تجاهل الخطأ إذا كان التخزين المحلي مقيداً في المتصفح
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
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
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
    <div style={ui.field}>
      <label style={ui.label}>
        {label} <span style={ui.req}>*</span>
      </label>
      <select
        value={customMode ? '__custom__' : value}
        onChange={handleSelect}
        style={ui.input}
      >
        <option value="">-- اختر منطقة شائعة أو اكتب موقعاً مخصصاً --</option>
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
            placeholder={placeholder || 'اكتب اسم المنطقة أو المحطة'}
            style={ui.input}
            required
          />
        </div>
      )}
    </div>
  );
}

const ui = {
  page: {
    fontFamily: "'Cairo', system-ui, -apple-system, sans-serif",
    direction: 'rtl',
    minHeight: '100vh',
    backgroundColor: '#f2f7f6',
    color: '#102a2e',
    paddingBottom: '48px',
  },
  header: {
    background: 'linear-gradient(135deg, #0d5c63 0%, #157a6e 100%)',
    color: '#ffffff',
    padding: '14px 14px 12px',
    position: 'sticky',
    top: 0,
    zIndex: 20,
    boxShadow: '0 2px 10px rgba(13, 92, 99, 0.2)',
  },
  headerWrap: {
    maxWidth: '880px',
    margin: '0 auto',
  },
  brandTitle: {
    margin: 0,
    fontSize: '1.35rem',
    fontWeight: 800,
    cursor: 'pointer',
  },
  brandSub: {
    margin: '2px 0 10px',
    fontSize: '0.82rem',
    color: '#d9f2ee',
  },
  tabsRow: {
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    paddingBottom: '2px',
  },
  tabBtn: (active) => ({
    flex: '0 0 auto',
    padding: '8px 13px',
    borderRadius: '10px',
    border: active ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.32)',
    backgroundColor: active ? '#ffffff' : 'rgba(255,255,255,0.12)',
    color: active ? '#0d5c63' : '#ffffff',
    fontFamily: 'inherit',
    fontSize: '0.86rem',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  }),
  main: {
    maxWidth: '880px',
    margin: '16px auto 0',
    padding: '0 14px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '15px',
    padding: '18px 16px',
    border: '1px solid #d4e4e2',
    boxShadow: '0 2px 8px rgba(16, 42, 46, 0.04)',
    marginBottom: '16px',
  },
  h2: {
    margin: '0 0 8px',
    fontSize: '1.15rem',
    fontWeight: 800,
    color: '#0d5c63',
  },
  h3: {
    margin: '0 0 8px',
    fontSize: '1rem',
    fontWeight: 800,
    color: '#144c52',
  },
  pMuted: {
    margin: '0 0 12px',
    fontSize: '0.9rem',
    color: '#4c676b',
    lineHeight: 1.65,
  },
  homeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(225px, 1fr))',
    gap: '12px',
    marginTop: '14px',
  },
  homeBtn: (bg, color, border) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '6px',
    padding: '18px 15px',
    borderRadius: '14px',
    backgroundColor: bg,
    color,
    border: border || 'none',
    fontFamily: 'inherit',
    textAlign: 'right',
    cursor: 'pointer',
  }),
  subTabRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginBottom: '16px',
  },
  subTabBtn: (active) => ({
    padding: '11px 12px',
    borderRadius: '11px',
    border: active ? '1.5px solid #0d5c63' : '1px solid #bfd6d3',
    backgroundColor: active ? '#0d5c63' : '#ffffff',
    color: active ? '#ffffff' : '#0d5c63',
    fontFamily: 'inherit',
    fontSize: '0.92rem',
    fontWeight: 700,
    cursor: 'pointer',
  }),
  filterPillRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  filterPill: (active) => ({
    padding: '8px 13px',
    borderRadius: '999px',
    border: active ? '1.5px solid #0d5c63' : '1px solid #b5cecb',
    backgroundColor: active ? '#0d5c63' : '#f4faf9',
    color: active ? '#ffffff' : '#143b40',
    fontFamily: 'inherit',
    fontSize: '0.84rem',
    fontWeight: 700,
    cursor: 'pointer',
  }),
  field: {
    marginBottom: '13px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontSize: '0.89rem',
    fontWeight: 700,
    color: '#143b40',
  },
  req: {
    color: '#c92a2a',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #b5cecb',
    backgroundColor: '#ffffff',
    color: '#102a2e',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '12px',
  },
  primaryBtn: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '11px',
    border: 'none',
    backgroundColor: '#0d5c63',
    color: '#ffffff',
    fontFamily: 'inherit',
    fontSize: '0.96rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '9px 13px',
    borderRadius: '10px',
    border: '1px solid #96b8b4',
    backgroundColor: '#edf6f5',
    color: '#0d5c63',
    fontFamily: 'inherit',
    fontSize: '0.85rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  warnBtn: {
    padding: '9px 13px',
    borderRadius: '10px',
    border: '1px solid #e6be8a',
    backgroundColor: '#fff9ef',
    color: '#9a5b00',
    fontFamily: 'inherit',
    fontSize: '0.85rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  dangerBtn: {
    padding: '9px 13px',
    borderRadius: '10px',
    border: '1px solid #e5a9a9',
    backgroundColor: '#fff2f2',
    color: '#a81f1f',
    fontFamily: 'inherit',
    fontSize: '0.85rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  subtleBtn: {
    padding: '8px 11px',
    borderRadius: '9px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#475569',
    fontFamily: 'inherit',
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  waLink: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '9px 14px',
    borderRadius: '10px',
    backgroundColor: '#15803d',
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '0.87rem',
    fontWeight: 700,
  },
  telLink: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '9px 14px',
    borderRadius: '10px',
    backgroundColor: '#0f766e',
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '0.87rem',
    fontWeight: 700,
  },
  rowWrap: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  itemBox: {
    border: '1px solid #d4e4e2',
    borderRadius: '12px',
    padding: '14px',
    backgroundColor: '#fafdfd',
    marginBottom: '12px',
  },
  badge: (bg, fg) => ({
    display: 'inline-block',
    padding: '3px 9px',
    borderRadius: '999px',
    backgroundColor: bg,
    color: fg,
    fontSize: '0.77rem',
    fontWeight: 700,
  }),
  okBox: {
    padding: '12px 14px',
    borderRadius: '11px',
    backgroundColor: '#e7f8ee',
    border: '1px solid #88dca9',
    color: '#11592e',
    marginBottom: '13px',
    fontSize: '0.9rem',
    lineHeight: 1.65,
  },
  errBox: {
    padding: '12px 14px',
    borderRadius: '11px',
    backgroundColor: '#fff1f1',
    border: '1px solid #f2b4b4',
    color: '#9e1c1c',
    marginBottom: '13px',
    fontSize: '0.9rem',
    lineHeight: 1.65,
  },
  infoBox: {
    padding: '11px 13px',
    borderRadius: '11px',
    backgroundColor: '#eef7f6',
    border: '1px solid #bdd9d6',
    color: '#134e4a',
    marginBottom: '13px',
    fontSize: '0.86rem',
    lineHeight: 1.6,
  },
  codeBox: {
    marginTop: '10px',
    padding: '12px',
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    border: '1.5px dashed #15803d',
    fontFamily: 'monospace',
    fontSize: '0.84rem',
    direction: 'ltr',
    textAlign: 'left',
    wordBreak: 'break-all',
    color: '#0f292e',
  },
  chipBtn: (selected) => ({
    padding: '7px 11px',
    borderRadius: '999px',
    border: selected ? '1px solid #0d5c63' : '1px solid #b5cecb',
    backgroundColor: selected ? '#0d5c63' : '#ffffff',
    color: selected ? '#ffffff' : '#143b40',
    fontFamily: 'inherit',
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: 'pointer',
  }),
};

export default function App() {
  const [tab, setTab] = useState(TABS.HOME);
  const [offerSubTab, setOfferSubTab] = useState('publish'); // 'publish' | 'my_ads'

  // حالة البحث واللوحة العامة
  const [offers, setOffers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardError, setBoardError] = useState('');
  const [searchStart, setSearchStart] = useState('');
  const [searchDest, setSearchDest] = useState('');
  const [searchTripKind, setSearchTripKind] = useState('all'); // 'all' | 'once' | 'recurring'

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

  // إدارة السائق لإعلانه يدوياً برمز الإدارة (id_token)
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
            ? {
                ...entry,
                available_seats: clampedSeats,
                status: effectiveStatus,
              }
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
          : 'تم نشر طلب التوصيلة بنجاح! سيظهر الآن لأصحاب العربات في تبويب البحث.'
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
        text: `تم تنظيف المنتهي بنجاح: حذف ${deletedOffers} عرض سائق و ${deletedRequests} طلب راكب.`,
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

  return (
    <div style={ui.page}>
      <header style={ui.header}>
        <div style={ui.headerWrap}>
          <h1 style={ui.brandTitle} onClick={() => setTab(TABS.HOME)}>
            توصيلة السنتر
          </h1>
          <p style={ui.brandSub}>
            توصيلات سريعة وترحيل منتظم بين طلاب الجامعة — مجاناً وبدون حساب
          </p>

          <nav style={ui.tabsRow} aria-label="الأقسام الرئيسية">
            <button
              type="button"
              style={ui.tabBtn(tab === TABS.HOME)}
              onClick={() => setTab(TABS.HOME)}
            >
              الرئيسية
            </button>
            <button
              type="button"
              style={ui.tabBtn(tab === TABS.SEARCH)}
              onClick={() => setTab(TABS.SEARCH)}
            >
              ابحث عن توصيلة / ترحيل
            </button>
            <button
              type="button"
              style={ui.tabBtn(tab === TABS.OFFER)}
              onClick={() => {
                setTab(TABS.OFFER);
                setOfferSubTab('publish');
              }}
            >
              أعرض توصيلة / ترحيل {activeMyOffersCount > 0 ? `(${activeMyOffersCount})` : ''}
            </button>
            <button
              type="button"
              style={ui.tabBtn(tab === TABS.REQUEST)}
              onClick={() => setTab(TABS.REQUEST)}
            >
              اطلب توصيلة / ترحيل
            </button>
            <button
              type="button"
              style={ui.tabBtn(tab === TABS.ADMIN)}
              onClick={() => setTab(TABS.ADMIN)}
            >
              الإدارة
            </button>
          </nav>
        </div>
      </header>

      <main style={ui.main}>
        {!supabase && (
          <div style={ui.errBox}>
            تنبيه إعداد: لم يتم العثور على <code>VITE_SUPABASE_URL</code> أو{' '}
            <code>VITE_SUPABASE_ANON_KEY</code>. أضفهما في إعدادات Netlify أو ملف{' '}
            <code>.env</code> ثم أعد النشر.
          </div>
        )}

        {tab === TABS.HOME && (
          <>
            <section style={ui.card}>
              <h2 style={ui.h2}>اختر ما تحتاجه الآن</h2>
              <p style={ui.pMuted}>
                سواء كنت تحتاج <strong>توصيلة سريعة لمرة واحدة</strong> أو{' '}
                <strong>ترحيلاً منتظماً يومياً أو أسبوعياً</strong>، تصفح الإعلانات
                وتواصل مباشرة عبر واتساب أو الاتصال.
              </p>

              <div style={ui.homeGrid}>
                <button
                  type="button"
                  style={ui.homeBtn('#0d5c63', '#ffffff')}
                  onClick={() => setTab(TABS.SEARCH)}
                >
                  <strong style={{ fontSize: '1.05rem' }}>
                    أبحث عن توصيلة أو ترحيل
                  </strong>
                  <span style={{ fontSize: '0.84rem', opacity: 0.92 }}>
                    تصفح عروض السائقين وطلبات الركاب المتاحة الآن ({filteredOffers.length}{' '}
                    عرض • {filteredRequests.length} طلب)
                  </span>
                </button>

                <button
                  type="button"
                  style={ui.homeBtn('#157a6e', '#ffffff')}
                  onClick={() => {
                    setTab(TABS.OFFER);
                    setOfferSubTab('publish');
                  }}
                >
                  <strong style={{ fontSize: '1.05rem' }}>
                    أعرض توصيلة أو ترحيل (لدي عربة)
                  </strong>
                  <span style={{ fontSize: '0.84rem', opacity: 0.92 }}>
                    انشر مشواراً لمرة واحدة أو ترحيلاً منتظماً وتحكم بمقاعدك بضغطة زر
                  </span>
                </button>

                <button
                  type="button"
                  style={ui.homeBtn('#ffffff', '#102a2e', '1.5px solid #96b8b4')}
                  onClick={() => setTab(TABS.REQUEST)}
                >
                  <strong style={{ fontSize: '1.05rem' }}>
                    أطلب توصيلة أو ترحيل
                  </strong>
                  <span style={{ fontSize: '0.84rem', color: '#4c676b' }}>
                    اطلب مشواراً لليوم أو ترحيلاً منتظماً ليتواصل معك السائقون
                  </span>
                </button>
              </div>

              {myOffers.length > 0 && (
                <div style={{ marginTop: '14px' }}>
                  <button
                    type="button"
                    style={{ ...ui.secondaryBtn, width: '100%', padding: '11px 14px' }}
                    onClick={() => {
                      setTab(TABS.OFFER);
                      setOfferSubTab('my_ads');
                    }}
                  >
                    إدارة إعلاناتي المحفوظة على هذا الجهاز ({myOffers.length})
                  </button>
                </div>
              )}
            </section>

            <section style={ui.card}>
              <h3 style={ui.h3}>الفرق بين التوصيلة والترحيل المنتظم</h3>
              <p style={{ ...ui.pMuted, marginBottom: 0 }}>
                • <strong>توصيلة (مرة واحدة):</strong> لمشوار محدد اليوم أو غداً، وتختفي
                تلقائياً بعد ساعات من موعدها.
                <br />• <strong>ترحيل منتظم (يومي / أيام محددة):</strong> للمداومين
                على نفس الخط أسبوعياً، ويبقى الإعلان ظاهراً لمدة أسبوع أو أكثر حسب
                اختيارك.
              </p>
            </section>
          </>
        )}

        {tab === TABS.SEARCH && (
          <>
            <section style={ui.card}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '10px',
                }}
              >
                <h2 style={{ ...ui.h2, margin: 0 }}>ابحث عن توصيلة أو ترحيل</h2>
                <button
                  type="button"
                  style={ui.secondaryBtn}
                  onClick={fetchPublicListings}
                  disabled={boardLoading}
                >
                  {boardLoading ? 'جاري التحديث...' : 'تحديث القائمة'}
                </button>
              </div>

              <div style={ui.filterPillRow}>
                <button
                  type="button"
                  style={ui.filterPill(searchTripKind === 'all')}
                  onClick={() => setSearchTripKind('all')}
                >
                  الكل
                </button>
                <button
                  type="button"
                  style={ui.filterPill(searchTripKind === 'once')}
                  onClick={() => setSearchTripKind('once')}
                >
                  توصيلة لمرة واحدة
                </button>
                <button
                  type="button"
                  style={ui.filterPill(searchTripKind === 'recurring')}
                  onClick={() => setSearchTripKind('recurring')}
                >
                  ترحيل منتظم (يومي / أسبوعي)
                </button>
              </div>

              <div style={ui.grid2}>
                <div style={ui.field}>
                  <label style={ui.label}>منطقة الانطلاق (أو محطة بالمسار)</label>
                  <input
                    type="text"
                    value={searchStart}
                    onChange={(e) => setSearchStart(e.target.value)}
                    placeholder="مثال: الرياض، جبرة، الثورة..."
                    style={ui.input}
                  />
                </div>
                <div style={ui.field}>
                  <label style={ui.label}>الوجهة</label>
                  <input
                    type="text"
                    value={searchDest}
                    onChange={(e) => setSearchDest(e.target.value)}
                    placeholder="مثال: السنتر، الجامعات..."
                    style={ui.input}
                  />
                </div>
              </div>

              {(searchStart || searchDest || searchTripKind !== 'all') && (
                <button
                  type="button"
                  style={ui.secondaryBtn}
                  onClick={() => {
                    setSearchStart('');
                    setSearchDest('');
                    setSearchTripKind('all');
                  }}
                >
                  مسح كل الفلاتر
                </button>
              )}
            </section>

            {boardError && <div style={ui.errBox}>{boardError}</div>}

            {reportMsg.text && (
              <div style={reportMsg.type === 'ok' ? ui.okBox : ui.errBox}>
                {reportMsg.text}
              </div>
            )}

            {reportTarget && (
              <section style={{ ...ui.card, borderColor: '#e5a9a9' }}>
                <h3 style={{ ...ui.h3, color: '#a81f1f' }}>
                  إرسال بلاغ عن: {reportTarget.label}
                </h3>
                <form onSubmit={handleSubmitReport}>
                  <div style={ui.field}>
                    <label style={ui.label}>
                      سبب البلاغ <span style={ui.req}>*</span>
                    </label>
                    <input
                      type="text"
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="مثال: رقم غير صحيح، إعلان مزعج، سلوك غير لائق..."
                      style={ui.input}
                      required
                    />
                  </div>
                  <div style={ui.field}>
                    <label style={ui.label}>تفاصيل إضافية (اختياري)</label>
                    <textarea
                      rows="2"
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="أضف أي تفاصيل تساعد المشرف..."
                      style={ui.input}
                    />
                  </div>
                  <div style={ui.rowWrap}>
                    <button
                      type="submit"
                      style={ui.dangerBtn}
                      disabled={reportLoading}
                    >
                      {reportLoading ? 'جاري الإرسال...' : 'تأكيد إرسال البلاغ'}
                    </button>
                    <button
                      type="button"
                      style={ui.secondaryBtn}
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
              </section>
            )}

            <section style={ui.card}>
              <h2 style={ui.h2}>عروض السائقين ({filteredOffers.length})</h2>
              <p style={ui.pMuted}>مرتبة حسب أقرب موعد تحرك ثم الأحدث نشراً.</p>

              {boardLoading && offers.length === 0 ? (
                <p style={ui.pMuted}>جاري تحميل عروض السائقين...</p>
              ) : filteredOffers.length === 0 ? (
                <p style={ui.pMuted}>
                  لا توجد عروض سائقين مطابقة حالياً. جرّب تغيير الفلتر أو انشر طلبك.
                </p>
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
                  const waText = `السلام عليكم كابتن ${offer.driver_name}، شاهدت عرض (${kindText}) في توصيلة السنتر من (${offer.start_area}) إلى (${offer.destination_area}) — ${timeText}. هل يوجد مقعد متاح؟`;
                  const waHref = buildWhatsAppLink(offer.whatsapp_number, waText);
                  const telHref = buildTelLink(
                    offer.phone_number || offer.whatsapp_number
                  );

                  return (
                    <article key={offer.id} style={ui.itemBox}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '8px',
                          marginBottom: '8px',
                        }}
                      >
                        <strong style={{ fontSize: '1.02rem', color: '#0d5c63' }}>
                          {offer.start_area} ← {offer.destination_area}
                        </strong>
                        <div style={ui.rowWrap}>
                          <span
                            style={ui.badge(
                              recurring ? '#ede9fe' : '#e0f2fe',
                              recurring ? '#5b21b6' : '#075985'
                            )}
                          >
                            {recurring ? 'ترحيل منتظم' : 'توصيلة لمرة واحدة'}
                          </span>
                          <span
                            style={ui.badge(
                              isFull ? '#ffe3e3' : '#dcfce7',
                              isFull ? '#a81f1f' : '#14532d'
                            )}
                          >
                            {isFull
                              ? 'مكتمل (لا توجد مقاعد)'
                              : `متاح ${offer.available_seats} من ${offer.total_seats} مقاعد`}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: '0.9rem',
                          lineHeight: 1.75,
                          color: '#254347',
                        }}
                      >
                        <div>
                          <strong>السائق:</strong> {offer.driver_name} •{' '}
                          <strong>العربة:</strong> {offer.vehicle_type}
                        </div>
                        <div>
                          <strong>{recurring ? 'وقت التحرك المعتاد:' : 'موعد التحرك:'}</strong>{' '}
                          {timeText}
                        </div>
                        <div>
                          <strong>السعر للمقعد:</strong>{' '}
                          {Number(offer.price_per_seat) > 0
                            ? `${Number(offer.price_per_seat).toLocaleString()} جنيه`
                            : 'مجاناً / بالاتفاق'}
                        </div>
                        {Array.isArray(offer.intermediate_stops) &&
                          offer.intermediate_stops.length > 0 && (
                            <div>
                              <strong>يمر بـ:</strong>{' '}
                              {offer.intermediate_stops.join(' ← ')}
                            </div>
                          )}
                      </div>

                      <div style={{ ...ui.rowWrap, marginTop: '12px' }}>
                        {waHref && (
                          <a
                            href={waHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={ui.waLink}
                          >
                            تواصل واتساب
                          </a>
                        )}
                        {telHref && (
                          <a href={telHref} style={ui.telLink}>
                            اتصال هاتفي
                          </a>
                        )}
                        <button
                          type="button"
                          style={ui.dangerBtn}
                          onClick={() => {
                            setReportMsg({ type: '', text: '' });
                            setReportTarget({
                              type: 'offer',
                              id: offer.id,
                              label: `عرض السائق ${offer.driver_name} (${offer.start_area} ← ${offer.destination_area})`,
                            });
                          }}
                        >
                          إبلاغ
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </section>

            <section style={ui.card}>
              <h2 style={ui.h2}>طلبات الطلاب ({filteredRequests.length})</h2>
              <p style={ui.pMuted}>
                طلاب يبحثون عن توصيلة أو ترحيل منتظم — إذا كنت صاحب عربة تواصل معهم
                مباشرة.
              </p>

              {boardLoading && requests.length === 0 ? (
                <p style={ui.pMuted}>جاري تحميل طلبات الطلاب...</p>
              ) : filteredRequests.length === 0 ? (
                <p style={ui.pMuted}>لا توجد طلبات طلاب مطابقة حالياً.</p>
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
                  const waText = `السلام عليكم ${req.passenger_name}، شاهدت طلب (${kindText}) الخاص بك في توصيلة السنتر من (${req.start_area}) إلى (${req.destination_area}) — ${timeText}. لدي مقعد متاح على هذا المسار.`;
                  const waHref = buildWhatsAppLink(req.whatsapp_number, waText);
                  const telHref = buildTelLink(req.phone_number || req.whatsapp_number);

                  return (
                    <article key={req.id} style={ui.itemBox}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '8px',
                          marginBottom: '8px',
                        }}
                      >
                        <strong style={{ fontSize: '1.02rem', color: '#0d5c63' }}>
                          {req.start_area} ← {req.destination_area}
                        </strong>
                        <div style={ui.rowWrap}>
                          <span
                            style={ui.badge(
                              recurring ? '#ede9fe' : '#e0f2fe',
                              recurring ? '#5b21b6' : '#075985'
                            )}
                          >
                            {recurring ? 'ترحيل منتظم' : 'توصيلة لمرة واحدة'}
                          </span>
                          <span style={ui.badge('#f1f5f9', '#334155')}>
                            مطلوب {req.seats_needed} مقعد
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: '0.9rem',
                          lineHeight: 1.75,
                          color: '#254347',
                        }}
                      >
                        <div>
                          <strong>الطالب:</strong> {req.passenger_name}
                        </div>
                        <div>
                          <strong>{recurring ? 'وقت التحرك المعتاد:' : 'الوقت المفضل:'}</strong>{' '}
                          {timeText}
                        </div>
                        {req.notes && (
                          <div>
                            <strong>ملاحظات:</strong> {req.notes}
                          </div>
                        )}
                      </div>

                      <div style={{ ...ui.rowWrap, marginTop: '12px' }}>
                        {waHref && (
                          <a
                            href={waHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={ui.waLink}
                          >
                            تواصل واتساب
                          </a>
                        )}
                        {telHref && (
                          <a href={telHref} style={ui.telLink}>
                            اتصال هاتفي
                          </a>
                        )}
                        <button
                          type="button"
                          style={ui.dangerBtn}
                          onClick={() => {
                            setReportMsg({ type: '', text: '' });
                            setReportTarget({
                              type: 'request',
                              id: req.id,
                              label: `طلب الطالب ${req.passenger_name} (${req.start_area} ← ${req.destination_area})`,
                            });
                          }}
                        >
                          إبلاغ
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </section>
          </>
        )}

        {tab === TABS.OFFER && (
          <>
            <div style={ui.subTabRow}>
              <button
                type="button"
                style={ui.subTabBtn(offerSubTab === 'publish')}
                onClick={() => setOfferSubTab('publish')}
              >
                نشر عرض جديد
              </button>
              <button
                type="button"
                style={ui.subTabBtn(offerSubTab === 'my_ads')}
                onClick={() => setOfferSubTab('my_ads')}
              >
                إعلاناتي على هذا الجهاز ({myOffers.length})
              </button>
            </div>

            {offerSubTab === 'publish' && (
              <section style={ui.card}>
                <h2 style={ui.h2}>أعرض توصيلة أو ترحيل (لأصحاب العربات)</h2>
                <p style={ui.pMuted}>
                  اختر هل المشوار <strong>توصيلة لمرة واحدة</strong> أم{' '}
                  <strong>ترحيل منتظم</strong>. سيُحفظ إعلانك تلقائياً في «إعلاناتي على
                  هذا الجهاز» للتحكم بالمقاعد أو الإغلاق بضغطة زر.
                </p>

                {offerError && <div style={ui.errBox}>{offerError}</div>}

                {savedManageCode && (
                  <div style={ui.okBox}>
                    <strong>تم نشر العرض وحفظه في «إعلاناتي» بنجاح!</strong>
                    <div style={{ marginTop: '6px' }}>
                      يمكنك تعديله الآن بضغطة زر من قسم «إعلاناتي على هذا الجهاز»، أو
                      نسخ الرمز الاحتياطي التالي لإدارته من هاتف آخر:
                    </div>
                    <div style={ui.codeBox}>{savedManageCode}</div>
                    <div style={{ ...ui.rowWrap, marginTop: '10px' }}>
                      <button
                        type="button"
                        style={ui.secondaryBtn}
                        onClick={() => setOfferSubTab('my_ads')}
                      >
                        الانتقال إلى إعلاناتي
                      </button>
                      <button
                        type="button"
                        style={ui.secondaryBtn}
                        onClick={() => handleCopyText(savedManageCode, '')}
                      >
                        {copiedCode ? 'تم النسخ بنجاح ✓' : 'نسخ الرمز الاحتياطي'}
                      </button>
                      <button
                        type="button"
                        style={ui.subtleBtn}
                        onClick={() => setTab(TABS.SEARCH)}
                      >
                        عرض في صفحة البحث
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handlePublishOffer}>
                  <div style={ui.field}>
                    <label style={ui.label}>
                      نوع العرض <span style={ui.req}>*</span>
                    </label>
                    <div style={ui.rowWrap}>
                      {RECURRENCE_CHOICES.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          style={ui.chipBtn(offerForm.recurrence_type === opt.value)}
                          onClick={() =>
                            setOfferForm({ ...offerForm, recurrence_type: opt.value })
                          }
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {offerForm.recurrence_type === 'weekdays' && (
                    <div style={ui.field}>
                      <label style={ui.label}>
                        اختر أيام الترحيل المنتظم <span style={ui.req}>*</span>
                      </label>
                      <div style={ui.rowWrap}>
                        {WEEKDAYS.map((day) => {
                          const selected = offerForm.recurrence_days.includes(day.key);
                          return (
                            <button
                              key={day.key}
                              type="button"
                              style={ui.chipBtn(selected)}
                              onClick={() => toggleOfferRecurrenceDay(day.key)}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={ui.grid2}>
                    <div style={ui.field}>
                      <label style={ui.label}>
                        اسم السائق <span style={ui.req}>*</span>
                      </label>
                      <input
                        type="text"
                        value={offerForm.driver_name}
                        onChange={(e) =>
                          setOfferForm({ ...offerForm, driver_name: e.target.value })
                        }
                        placeholder="مثال: أحمد محمد"
                        style={ui.input}
                        required
                      />
                    </div>

                    <div style={ui.field}>
                      <label style={ui.label}>
                        نوع العربة <span style={ui.req}>*</span>
                      </label>
                      <input
                        type="text"
                        value={offerForm.vehicle_type}
                        onChange={(e) =>
                          setOfferForm({ ...offerForm, vehicle_type: e.target.value })
                        }
                        placeholder="مثال: أكسنت فضي / فيتز / هايس"
                        style={ui.input}
                        required
                      />
                    </div>
                  </div>

                  <div style={ui.grid2}>
                    <div style={ui.field}>
                      <label style={ui.label}>
                        رقم الواتساب <span style={ui.req}>*</span>
                      </label>
                      <input
                        type="tel"
                        value={offerForm.whatsapp_number}
                        onChange={(e) =>
                          setOfferForm({ ...offerForm, whatsapp_number: e.target.value })
                        }
                        placeholder="مثال: 0912345678"
                        style={ui.input}
                        required
                      />
                    </div>

                    <div style={ui.field}>
                      <label style={ui.label}>رقم اتصال إضافي (اختياري)</label>
                      <input
                        type="tel"
                        value={offerForm.phone_number}
                        onChange={(e) =>
                          setOfferForm({ ...offerForm, phone_number: e.target.value })
                        }
                        placeholder="اتركه فارغاً لاستخدام رقم الواتساب"
                        style={ui.input}
                      />
                    </div>
                  </div>

                  <div style={ui.grid2}>
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
                      placeholder="اكتب الوجهة (مثال: السنتر)"
                    />
                  </div>

                  <div style={ui.field}>
                    <label style={ui.label}>
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
                      style={ui.input}
                    />
                  </div>

                  <div style={ui.grid2}>
                    <div style={ui.field}>
                      <label style={ui.label}>
                        {offerIsRecurring
                          ? 'تاريخ ووقت أول رحلة (توقيت التحرك المعتاد)'
                          : 'موعد المغادرة (يجب أن يكون في المستقبل)'}{' '}
                        <span style={ui.req}>*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={offerForm.departure_time}
                        onChange={(e) =>
                          setOfferForm({ ...offerForm, departure_time: e.target.value })
                        }
                        style={ui.input}
                        required
                      />
                    </div>

                    {offerIsRecurring ? (
                      <div style={ui.field}>
                        <label style={ui.label}>مدة بقاء إعلان الترحيل</label>
                        <select
                          value={offerForm.recurring_valid_days}
                          onChange={(e) =>
                            setOfferForm({
                              ...offerForm,
                              recurring_valid_days: Number(e.target.value),
                            })
                          }
                          style={ui.input}
                        >
                          <option value={7}>أسبوع واحد (7 أيام)</option>
                          <option value={14}>أسبوعان (14 يوماً)</option>
                          <option value={30}>شهر كامل (30 يوماً)</option>
                        </select>
                      </div>
                    ) : (
                      <div style={ui.field}>
                        <label style={ui.label}>
                          مدة بقاء الإعلان بعد المغادرة (بالساعات)
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
                          style={ui.input}
                        />
                      </div>
                    )}
                  </div>

                  <div style={ui.grid2}>
                    <div style={ui.field}>
                      <label style={ui.label}>
                        إجمالي مقاعد العربة <span style={ui.req}>*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={offerForm.total_seats}
                        onChange={(e) =>
                          setOfferForm({ ...offerForm, total_seats: e.target.value })
                        }
                        style={ui.input}
                        required
                      />
                    </div>

                    <div style={ui.field}>
                      <label style={ui.label}>
                        المقاعد المتاحة الآن <span style={ui.req}>*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={offerForm.available_seats}
                        onChange={(e) =>
                          setOfferForm({ ...offerForm, available_seats: e.target.value })
                        }
                        style={ui.input}
                        required
                      />
                    </div>
                  </div>

                  <div style={ui.field}>
                    <label style={ui.label}>
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
                      style={ui.input}
                    />
                  </div>

                  <button
                    type="submit"
                    style={ui.primaryBtn}
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
                <section style={ui.card}>
                  <h2 style={ui.h2}>إعلاناتي المحفوظة على هذا الجهاز ({myOffers.length})</h2>
                  <div style={ui.infoBox}>
                    تُحفظ هذه القائمة محلياً داخل متصفحك الحالي فقط، لتتمكن من تحديث
                    المقاعد أو إغلاق إعلاناتك بضغطة زر دون إدخال رمز الإدارة كل مرة.
                  </div>

                  {myOffersFeedback.text && (
                    <div
                      style={myOffersFeedback.type === 'ok' ? ui.okBox : ui.errBox}
                    >
                      {myOffersFeedback.text}
                    </div>
                  )}

                  {myOffers.length === 0 ? (
                    <div>
                      <p style={ui.pMuted}>
                        لا توجد إعلانات محفوظة على هذا الجهاز بعد. عند نشر عرض جديد
                        سيظهر هنا تلقائياً.
                      </p>
                      <button
                        type="button"
                        style={ui.secondaryBtn}
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

                      const badgeColors = isClosed
                        ? ['#e2e8f0', '#334155', 'مغلق']
                        : isExpired
                        ? ['#ffe3e3', '#a81f1f', 'منتهي الوقت']
                        : isFull
                        ? ['#fff3cd', '#854d0e', 'مكتمل (0 مقاعد)']
                        : ['#dcfce7', '#14532d', `متاح ${currentSeats} من ${totalSeats}`];

                      return (
                        <article key={item.id} style={ui.itemBox}>
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
                            <strong style={{ fontSize: '1rem', color: '#0d5c63' }}>
                              {item.start_area} ← {item.destination_area}
                            </strong>
                            <div style={ui.rowWrap}>
                              <span
                                style={ui.badge(
                                  recurring ? '#ede9fe' : '#e0f2fe',
                                  recurring ? '#5b21b6' : '#075985'
                                )}
                              >
                                {recurring ? 'ترحيل منتظم' : 'توصيلة'}
                              </span>
                              <span style={ui.badge(badgeColors[0], badgeColors[1])}>
                                {badgeColors[2]}
                              </span>
                            </div>
                          </div>

                          <div
                            style={{
                              fontSize: '0.87rem',
                              color: '#345256',
                              lineHeight: 1.7,
                            }}
                          >
                            <div>
                              <strong>{recurring ? 'التوقيت:' : 'الموعد:'}</strong>{' '}
                              {recurring
                                ? `${formatTimeOnly(item.departure_time)} (${formatRecurrence(
                                    item.recurrence_type,
                                    item.recurrence_days
                                  )})`
                                : formatDateTime(item.departure_time)}{' '}
                              • <strong>العربة:</strong> {item.vehicle_type}
                            </div>
                          </div>

                          <div style={{ ...ui.rowWrap, marginTop: '10px' }}>
                            {!isClosed && !isExpired && (
                              <>
                                <button
                                  type="button"
                                  style={ui.secondaryBtn}
                                  disabled={isBusy || currentSeats <= 0}
                                  onClick={() =>
                                    handleQuickManageMyOffer(
                                      item,
                                      currentSeats - 1,
                                      currentSeats - 1 <= 0 ? 'full' : 'active'
                                    )
                                  }
                                >
                                  − مقعد
                                </button>
                                <button
                                  type="button"
                                  style={ui.secondaryBtn}
                                  disabled={isBusy || currentSeats >= totalSeats}
                                  onClick={() =>
                                    handleQuickManageMyOffer(
                                      item,
                                      currentSeats + 1,
                                      'active'
                                    )
                                  }
                                >
                                  + مقعد
                                </button>
                                <button
                                  type="button"
                                  style={ui.warnBtn}
                                  disabled={isBusy || isFull}
                                  onClick={() =>
                                    handleQuickManageMyOffer(item, 0, 'full')
                                  }
                                >
                                  اكتملت المقاعد
                                </button>
                                <button
                                  type="button"
                                  style={ui.dangerBtn}
                                  disabled={isBusy}
                                  onClick={() =>
                                    handleQuickManageMyOffer(item, 0, 'closed')
                                  }
                                >
                                  إغلاق الإعلان
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              style={ui.subtleBtn}
                              onClick={() =>
                                handleCopyText(item.manageCode, item.id)
                              }
                            >
                              {copiedOfferId === item.id
                                ? 'تم نسخ الرمز ✓'
                                : 'نسخ الرمز'}
                            </button>

                            <button
                              type="button"
                              style={ui.subtleBtn}
                              onClick={() => handleRemoveFromMyDevice(item.id)}
                            >
                              إزالة من القائمة
                            </button>
                          </div>
                        </article>
                      );
                    })
                  )}
                </section>

                <section style={ui.card}>
                  <h3 style={ui.h3}>إدارة إعلان برمز يدوي (من جهاز آخر)</h3>
                  <p style={ui.pMuted}>
                    إذا نشرت إعلانك من هاتف آخر، الصق رمز الإدارة (
                    <code>id_token</code>) هنا للتحكم به.
                  </p>

                  {manageFeedback.text && (
                    <div
                      style={manageFeedback.type === 'ok' ? ui.okBox : ui.errBox}
                    >
                      {manageFeedback.text}
                    </div>
                  )}

                  <div style={ui.field}>
                    <label style={ui.label}>رمز الإدارة الكامل (id_token)</label>
                    <input
                      type="text"
                      value={manageCodeInput}
                      onChange={(e) => setManageCodeInput(e.target.value)}
                      placeholder="الصق الرمز هنا..."
                      style={{ ...ui.input, direction: 'ltr', textAlign: 'left' }}
                    />
                  </div>

                  <div style={ui.field}>
                    <label style={ui.label}>عدد المقاعد المتاحة الجديد</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={manageSeatsInput}
                      onChange={(e) => setManageSeatsInput(e.target.value)}
                      style={ui.input}
                    />
                  </div>

                  <div style={ui.rowWrap}>
                    <button
                      type="button"
                      style={ui.secondaryBtn}
                      disabled={manageLoading}
                      onClick={() => handleDriverManageAction('active')}
                    >
                      تحديث عدد المقاعد
                    </button>
                    <button
                      type="button"
                      style={ui.warnBtn}
                      disabled={manageLoading}
                      onClick={() => handleDriverManageAction('full')}
                    >
                      اكتملت المقاعد
                    </button>
                    <button
                      type="button"
                      style={ui.dangerBtn}
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

        {tab === TABS.REQUEST && (
          <section style={ui.card}>
            <h2 style={ui.h2}>اطلب توصيلة أو ترحيل (للطلاب)</h2>
            <p style={ui.pMuted}>
              حدد هل تحتاج <strong>توصيلة سريعة لمرة واحدة</strong> أم{' '}
              <strong>ترحيلاً منتظماً</strong> (يومي أو أيام محددة من الأسبوع) ليتواصل
              معك أصحاب العربات على نفس المسار.
            </p>

            {requestError && <div style={ui.errBox}>{requestError}</div>}
            {requestSuccess && (
              <div style={ui.okBox}>
                {requestSuccess}{' '}
                <button
                  type="button"
                  style={{ ...ui.secondaryBtn, marginRight: '8px' }}
                  onClick={() => setTab(TABS.SEARCH)}
                >
                  الانتقال لصفحة البحث
                </button>
              </div>
            )}

            <form onSubmit={handlePublishRequest}>
              <div style={ui.field}>
                <label style={ui.label}>
                  نوع الطلب <span style={ui.req}>*</span>
                </label>
                <div style={ui.rowWrap}>
                  {RECURRENCE_CHOICES.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      style={ui.chipBtn(requestForm.recurrence_type === opt.value)}
                      onClick={() =>
                        setRequestForm({ ...requestForm, recurrence_type: opt.value })
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {requestForm.recurrence_type === 'weekdays' && (
                <div style={ui.field}>
                  <label style={ui.label}>
                    اختر أيام الترحيل المطلوبة <span style={ui.req}>*</span>
                  </label>
                  <div style={ui.rowWrap}>
                    {WEEKDAYS.map((day) => {
                      const selected = requestForm.recurrence_days.includes(day.key);
                      return (
                        <button
                          key={day.key}
                          type="button"
                          style={ui.chipBtn(selected)}
                          onClick={() => toggleRequestRecurrenceDay(day.key)}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={ui.grid2}>
                <div style={ui.field}>
                  <label style={ui.label}>
                    الاسم <span style={ui.req}>*</span>
                  </label>
                  <input
                    type="text"
                    value={requestForm.passenger_name}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, passenger_name: e.target.value })
                    }
                    placeholder="مثال: سارة علي"
                    style={ui.input}
                    required
                  />
                </div>

                <div style={ui.field}>
                  <label style={ui.label}>
                    عدد المقاعد المطلوبة <span style={ui.req}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={requestForm.seats_needed}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, seats_needed: e.target.value })
                    }
                    style={ui.input}
                    required
                  />
                </div>
              </div>

              <div style={ui.grid2}>
                <div style={ui.field}>
                  <label style={ui.label}>
                    رقم الواتساب <span style={ui.req}>*</span>
                  </label>
                  <input
                    type="tel"
                    value={requestForm.whatsapp_number}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, whatsapp_number: e.target.value })
                    }
                    placeholder="مثال: 0912345678"
                    style={ui.input}
                    required
                  />
                </div>

                <div style={ui.field}>
                  <label style={ui.label}>رقم اتصال إضافي (اختياري)</label>
                  <input
                    type="tel"
                    value={requestForm.phone_number}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, phone_number: e.target.value })
                    }
                    placeholder="اتركه فارغاً لاستخدام رقم الواتساب"
                    style={ui.input}
                  />
                </div>
              </div>

              <div style={ui.grid2}>
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
                  placeholder="اكتب وجهتك"
                />
              </div>

              <div style={ui.grid2}>
                <div style={ui.field}>
                  <label style={ui.label}>
                    {requestIsRecurring
                      ? 'تاريخ ووقت أول يوم (توقيت التحرك المعتاد)'
                      : 'الوقت المفضل للتحرك (في المستقبل)'}{' '}
                    <span style={ui.req}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={requestForm.preferred_time}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, preferred_time: e.target.value })
                    }
                    style={ui.input}
                    required
                  />
                </div>

                {requestIsRecurring ? (
                  <div style={ui.field}>
                    <label style={ui.label}>مدة بقاء طلب الترحيل</label>
                    <select
                      value={requestForm.recurring_valid_days}
                      onChange={(e) =>
                        setRequestForm({
                          ...requestForm,
                          recurring_valid_days: Number(e.target.value),
                        })
                      }
                      style={ui.input}
                    >
                      <option value={7}>أسبوع واحد (7 أيام)</option>
                      <option value={14}>أسبوعان (14 يوماً)</option>
                      <option value={30}>شهر كامل (30 يوماً)</option>
                    </select>
                  </div>
                ) : (
                  <div style={ui.field}>
                    <label style={ui.label}>
                      مدة بقاء الطلب بعد الموعد (بالساعات)
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
                      style={ui.input}
                    />
                  </div>
                )}
              </div>

              <div style={ui.field}>
                <label style={ui.label}>ملاحظات إضافية (اختياري)</label>
                <textarea
                  rows="2"
                  value={requestForm.notes}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, notes: e.target.value })
                  }
                  placeholder="مثال: الانتظار أمام البوابة الرئيسية، أو تفاصيل الرجعة..."
                  style={ui.input}
                />
              </div>

              <button
                type="submit"
                style={ui.primaryBtn}
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

        {tab === TABS.ADMIN && (
          <>
            {!session ? (
              <section style={ui.card}>
                <h2 style={ui.h2}>دخول الإدارة</h2>
                <p style={ui.pMuted}>
                  هذه الصفحة مخصصة لمشرف الموقع فقط لإدارة البلاغات وحذف الإعلانات
                  المنتهية أو المخالفة.
                </p>
                {loginError && <div style={ui.errBox}>{loginError}</div>}
                <form onSubmit={handleAdminLogin}>
                  <div style={ui.field}>
                    <label style={ui.label}>البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      style={{ ...ui.input, direction: 'ltr', textAlign: 'left' }}
                      required
                    />
                  </div>
                  <div style={ui.field}>
                    <label style={ui.label}>كلمة المرور</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      style={{ ...ui.input, direction: 'ltr', textAlign: 'left' }}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    style={ui.primaryBtn}
                    disabled={loginLoading}
                  >
                    {loginLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
                  </button>
                </form>
              </section>
            ) : adminCheckLoading ? (
              <section style={ui.card}>
                <p style={ui.pMuted}>جاري التحقق من صلاحيات المشرف...</p>
              </section>
            ) : !isAdmin ? (
              <section style={ui.card}>
                <div style={ui.errBox}>
                  تم تسجيل الدخول بحساب ({session.user?.email})، لكنه غير مضاف في جدول{' '}
                  <code>admin_users</code>.
                </div>
                <button
                  type="button"
                  style={ui.secondaryBtn}
                  onClick={handleAdminLogout}
                >
                  تسجيل الخروج
                </button>
              </section>
            ) : (
              <>
                <section style={ui.card}>
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
                      <h2 style={{ ...ui.h2, margin: 0 }}>لوحة تحكم الإدارة</h2>
                      <p style={{ ...ui.pMuted, margin: '4px 0 0' }}>
                        مرحباً ({session.user?.email})
                      </p>
                    </div>
                    <div style={ui.rowWrap}>
                      <button
                        type="button"
                        style={ui.secondaryBtn}
                        onClick={fetchAdminDashboard}
                        disabled={adminDataLoading}
                      >
                        تحديث البيانات
                      </button>
                      <button
                        type="button"
                        style={ui.warnBtn}
                        onClick={handleDeleteExpiredAds}
                      >
                        حذف المنتهي (تنظيف)
                      </button>
                      <button
                        type="button"
                        style={ui.dangerBtn}
                        onClick={handleAdminLogout}
                      >
                        خروج
                      </button>
                    </div>
                  </div>
                </section>

                {adminFeedback.text && (
                  <div style={adminFeedback.type === 'ok' ? ui.okBox : ui.errBox}>
                    {adminFeedback.text}
                  </div>
                )}

                <section style={ui.card}>
                  <h2 style={ui.h2}>البلاغات ({adminReports.length})</h2>
                  {adminDataLoading ? (
                    <p style={ui.pMuted}>جاري تحميل البلاغات...</p>
                  ) : adminReports.length === 0 ? (
                    <p style={ui.pMuted}>لا توجد بلاغات حالياً.</p>
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
                        <article key={rep.id} style={ui.itemBox}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '8px',
                              marginBottom: '6px',
                            }}
                          >
                            <strong>
                              {rep.target_type === 'offer'
                                ? 'بلاغ على عرض سائق'
                                : 'بلاغ على طلب طالب'}
                            </strong>
                            <span
                              style={ui.badge(
                                rep.status === 'pending'
                                  ? '#fff3cd'
                                  : rep.status === 'reviewed'
                                  ? '#dcfce7'
                                  : '#e2e8f0',
                                rep.status === 'pending'
                                  ? '#854d0e'
                                  : rep.status === 'reviewed'
                                  ? '#14532d'
                                  : '#334155'
                              )}
                            >
                              {rep.status === 'pending'
                                ? 'قيد المراجعة'
                                : rep.status === 'reviewed'
                                ? 'تمت المراجعة'
                                : 'تم التجاهل'}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.89rem', lineHeight: 1.7 }}>
                            <div>
                              <strong>السبب:</strong> {rep.reason}
                            </div>
                            {rep.details && (
                              <div>
                                <strong>تفاصيل:</strong> {rep.details}
                              </div>
                            )}
                            <div>
                              <strong>تاريخ البلاغ:</strong> {formatDateTime(rep.created_at)}
                            </div>

                            {linkedOffer && (
                              <div
                                style={{
                                  marginTop: '8px',
                                  padding: '8px 10px',
                                  backgroundColor: '#eef6f5',
                                  borderRadius: '8px',
                                }}
                              >
                                <strong>الإعلان المرتبط:</strong> السائق{' '}
                                {linkedOffer.driver_name} ({linkedOffer.vehicle_type}) —{' '}
                                {linkedOffer.start_area} ← {linkedOffer.destination_area} •{' '}
                                {isRecurringType(linkedOffer.recurrence_type)
                                  ? `ترحيل منتظم (${formatRecurrence(
                                      linkedOffer.recurrence_type,
                                      linkedOffer.recurrence_days
                                    )})`
                                  : formatDateTime(linkedOffer.departure_time)}{' '}
                                • الحالة: {linkedOffer.status}
                              </div>
                            )}

                            {linkedRequest && (
                              <div
                                style={{
                                  marginTop: '8px',
                                  padding: '8px 10px',
                                  backgroundColor: '#eef6f5',
                                  borderRadius: '8px',
                                }}
                              >
                                <strong>الطلب المرتبط:</strong> الطالب{' '}
                                {linkedRequest.passenger_name} — {linkedRequest.start_area} ←{' '}
                                {linkedRequest.destination_area} •{' '}
                                {isRecurringType(linkedRequest.recurrence_type)
                                  ? `ترحيل منتظم (${formatRecurrence(
                                      linkedRequest.recurrence_type,
                                      linkedRequest.recurrence_days
                                    )})`
                                  : formatDateTime(linkedRequest.preferred_time)}{' '}
                                • الحالة: {linkedRequest.status}
                              </div>
                            )}
                          </div>

                          <div style={{ ...ui.rowWrap, marginTop: '10px' }}>
                            <button
                              type="button"
                              style={ui.secondaryBtn}
                              onClick={() => handleUpdateReportStatus(rep.id, 'reviewed')}
                            >
                              تمت المراجعة
                            </button>
                            <button
                              type="button"
                              style={ui.warnBtn}
                              onClick={() => handleUpdateReportStatus(rep.id, 'dismissed')}
                            >
                              تجاهل
                            </button>
                            <button
                              type="button"
                              style={ui.dangerBtn}
                              onClick={() =>
                                handleAdminDeleteListing(rep.target_type, targetId)
                              }
                            >
                              حذف الإعلان المرتبط
                            </button>
                          </div>
                        </article>
                      );
                    })
                  )}
                </section>

                <section style={ui.card}>
                  <h2 style={ui.h2}>كل عروض السائقين ({adminOffers.length})</h2>
                  {adminOffers.length === 0 ? (
                    <p style={ui.pMuted}>لا توجد عروض مسجلة.</p>
                  ) : (
                    adminOffers.map((o) => {
                      const expired = new Date(o.expires_at).getTime() <= Date.now();
                      const recurring = isRecurringType(o.recurrence_type);
                      return (
                        <div key={o.id} style={ui.itemBox}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '8px',
                            }}
                          >
                            <strong>
                              {o.driver_name}: {o.start_area} ← {o.destination_area}
                            </strong>
                            <div style={ui.rowWrap}>
                              <span
                                style={ui.badge(
                                  recurring ? '#ede9fe' : '#e0f2fe',
                                  recurring ? '#5b21b6' : '#075985'
                                )}
                              >
                                {recurring ? 'ترحيل منتظم' : 'توصيلة'}
                              </span>
                              <span
                                style={ui.badge(
                                  expired || o.status === 'closed' ? '#ffe3e3' : '#dcfce7',
                                  expired || o.status === 'closed' ? '#a81f1f' : '#14532d'
                                )}
                              >
                                {expired ? 'منتهي' : o.status}
                              </span>
                            </div>
                          </div>
                          <div style={{ fontSize: '0.86rem', marginTop: '4px' }}>
                            التحرك: {formatDateTime(o.departure_time)} • المقاعد:{' '}
                            {o.available_seats}/{o.total_seats}
                          </div>
                          <div style={{ marginTop: '8px' }}>
                            <button
                              type="button"
                              style={ui.dangerBtn}
                              onClick={() => handleAdminDeleteListing('offer', o.id)}
                            >
                              حذف العرض
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </section>

                <section style={ui.card}>
                  <h2 style={ui.h2}>كل طلبات الطلاب ({adminRequests.length})</h2>
                  {adminRequests.length === 0 ? (
                    <p style={ui.pMuted}>لا توجد طلبات مسجلة.</p>
                  ) : (
                    adminRequests.map((r) => {
                      const expired = new Date(r.expires_at).getTime() <= Date.now();
                      const recurring = isRecurringType(r.recurrence_type);
                      return (
                        <div key={r.id} style={ui.itemBox}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '8px',
                            }}
                          >
                            <strong>
                              {r.passenger_name}: {r.start_area} ← {r.destination_area}
                            </strong>
                            <div style={ui.rowWrap}>
                              <span
                                style={ui.badge(
                                  recurring ? '#ede9fe' : '#e0f2fe',
                                  recurring ? '#5b21b6' : '#075985'
                                )}
                              >
                                {recurring ? 'ترحيل منتظم' : 'توصيلة'}
                              </span>
                              <span
                                style={ui.badge(
                                  expired || r.status === 'closed' ? '#ffe3e3' : '#e0f2fe',
                                  expired || r.status === 'closed' ? '#a81f1f' : '#075985'
                                )}
                              >
                                {expired ? 'منتهي' : r.status}
                              </span>
                            </div>
                          </div>
                          <div style={{ fontSize: '0.86rem', marginTop: '4px' }}>
                            الوقت: {formatDateTime(r.preferred_time)} • المقاعد:{' '}
                            {r.seats_needed}
                          </div>
                          <div style={{ marginTop: '8px' }}>
                            <button
                              type="button"
                              style={ui.dangerBtn}
                              onClick={() => handleAdminDeleteListing('request', r.id)}
                            >
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
    </div>
  );
}
