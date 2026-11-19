import React, { useState } from 'react';

const VIEWS = {
  HOME: 'home',
  SEARCH: 'search',
  OFFER: 'offer',
  REQUEST: 'request',
  ADMIN: 'admin',
};

const stage1Styles = {
  page: {
    fontFamily: "'Cairo', system-ui, -apple-system, sans-serif",
    direction: 'rtl',
    minHeight: '100vh',
    backgroundColor: '#f6f8fa',
    color: '#0f172a',
    margin: 0,
    paddingBottom: '48px',
  },
  header: {
    backgroundColor: '#0f4c5c',
    color: '#ffffff',
    padding: '18px 16px',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.12)',
  },
  headerInner: {
    maxWidth: '820px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  },
  brandTitle: {
    margin: 0,
    fontSize: '1.35rem',
    fontWeight: 800,
    cursor: 'pointer',
  },
  brandSub: {
    margin: '2px 0 0',
    fontSize: '0.85rem',
    opacity: 0.9,
  },
  navRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  navBtn: (active) => ({
    border: '1px solid rgba(255,255,255,0.35)',
    backgroundColor: active ? '#ffffff' : 'rgba(255,255,255,0.12)',
    color: active ? '#0f4c5c' : '#ffffff',
    padding: '8px 12px',
    borderRadius: '10px',
    fontFamily: 'inherit',
    fontSize: '0.85rem',
    fontWeight: 700,
    cursor: 'pointer',
  }),
  main: {
    maxWidth: '820px',
    margin: '20px auto 0',
    padding: '0 16px',
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '22px 18px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
    marginBottom: '18px',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px',
    marginTop: '16px',
  },
  actionBtn: (accent) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '6px',
    padding: '16px',
    borderRadius: '14px',
    border: accent ? 'none' : '1.5px solid #cbd5e1',
    backgroundColor: accent || '#ffffff',
    color: accent ? '#ffffff' : '#0f172a',
    fontFamily: 'inherit',
    textAlign: 'right',
    cursor: 'pointer',
    boxShadow: accent ? '0 4px 12px rgba(15, 76, 92, 0.2)' : 'none',
  }),
  statusBox: {
    backgroundColor: '#ecfeff',
    border: '1px solid #a5f3fc',
    color: '#155e75',
    borderRadius: '12px',
    padding: '14px 16px',
    fontSize: '0.92rem',
    lineHeight: 1.7,
  },
};

export default function App() {
  const [view, setView] = useState(VIEWS.HOME);

  return (
    <div style={stage1Styles.page}>
      <header style={stage1Styles.header}>
        <div style={stage1Styles.headerInner}>
          <div>
            <h1 style={stage1Styles.brandTitle} onClick={() => setView(VIEWS.HOME)}>
              توصيلـة السنتر
            </h1>
            <p style={stage1Styles.brandSub}>
              مشاركة المواصلات الجامعية بسهولة وبدون رسوم شهرية
            </p>
          </div>

          <nav style={stage1Styles.navRow} aria-label="التنقل الرئيسي">
            <button
              type="button"
              style={stage1Styles.navBtn(view === VIEWS.HOME)}
              onClick={() => setView(VIEWS.HOME)}
            >
              الرئيسية
            </button>
            <button
              type="button"
              style={stage1Styles.navBtn(view === VIEWS.SEARCH)}
              onClick={() => setView(VIEWS.SEARCH)}
            >
              أبحث عن ترحيل
            </button>
            <button
              type="button"
              style={stage1Styles.navBtn(view === VIEWS.OFFER)}
              onClick={() => setView(VIEWS.OFFER)}
            >
              أعرض مشواراً
            </button>
            <button
              type="button"
              style={stage1Styles.navBtn(view === VIEWS.REQUEST)}
              onClick={() => setView(VIEWS.REQUEST)}
            >
              أطلب ترحيلاً
            </button>
            <button
              type="button"
              style={stage1Styles.navBtn(view === VIEWS.ADMIN)}
              onClick={() => setView(VIEWS.ADMIN)}
            >
              الإدارة
            </button>
          </nav>
        </div>
      </header>

      <main style={stage1Styles.main}>
        <section style={stage1Styles.heroCard}>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 800 }}>
            أهلاً بك في توصيلـة السنتر
          </h2>
          <p style={{ margin: 0, color: '#475569', lineHeight: 1.7 }}>
            تصفح الرحلات المتاحة فوراً بدون إنشاء حساب، أو انشر مشوارك إذا كانت لديك عربة، أو اطلب
            ترحيلاً ليتواصل معك السائقون مباشرة عبر واتساب أو الاتصال.
          </p>

          <div style={stage1Styles.actionsGrid}>
            <button
              type="button"
              style={stage1Styles.actionBtn('#0f4c5c')}
              onClick={() => setView(VIEWS.SEARCH)}
            >
              <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>أبحث عن ترحيل</span>
              <span style={{ fontSize: '0.84rem', opacity: 0.92 }}>
                تصفح العروض حسب نقطة الانطلاق والوجهة والوقت
              </span>
            </button>

            <button
              type="button"
              style={stage1Styles.actionBtn('#1e6f5c')}
              onClick={() => setView(VIEWS.OFFER)}
            >
              <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>أعرض مشواراً (لدي عربة)</span>
              <span style={{ fontSize: '0.84rem', opacity: 0.92 }}>
                انشر رحلة لمرة واحدة أو متكررة وحدد المقاعد والسعر
              </span>
            </button>

            <button
              type="button"
              style={stage1Styles.actionBtn(null)}
              onClick={() => setView(VIEWS.REQUEST)}
            >
              <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>أطلب ترحيلاً</span>
              <span style={{ fontSize: '0.84rem', color: '#475569' }}>
                سجّل وجهتك ووقتك ليتواصل معك أصحاب العربات
              </span>
            </button>
          </div>
        </section>

        <div style={stage1Styles.statusBox}>
          <strong>حالة البناء (المرحلة 1):</strong> تم إعداد ملفات التأسيس الأساسية{' '}
          <code>package.json</code>، <code>index.html</code>، <code>.env.example</code>،{' '}
          <code>supabase/schema.sql</code>، <code>src/main.jsx</code>، و<code>src/App.jsx</code>.
          العرض الحالي النشط: <strong>{view}</strong>. سيتم ربط النماذج الكاملة ولوحة البحث والفلترة
          وإدارة الكابتن ولوحة الأدمن في المراحل التالية بعد التحقق.
        </div>
      </main>
    </div>
  );
}
