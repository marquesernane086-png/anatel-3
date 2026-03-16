import React, { useState } from 'react';

/* ─── Header fiel ao site oficial www.gov.br/anatel ─── */
const AnatelHeader = ({ breadcrumb = null }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header style={{ fontFamily: "'Rawline','Segoe UI',system-ui,sans-serif", background: '#fff' }}>

      {/* ══════════════════════════════════════════════════
          LINHA 1 — gov.br logo + Ministério + links inst.
          ══════════════════════════════════════════════════ */}
      <div style={{ background: '#fff', borderBottom: '1px solid #ededed' }}>
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 72,
          }}
        >
          {/* ── Esquerda: logo + ministério ── */}
          <a
            href="/anatel"
            style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', flexShrink: 0 }}
          >
            {/* Logo gov.br — imagem oficial do servidor do governo */}
            <img
              src="https://www.gov.br/++theme++padrao_govbr/img/logo-govbr-color-b.png"
              alt="gov.br"
              style={{ height: 56, width: 'auto', display: 'block' }}
              onError={(e) => {
                /* fallback SVG se imagem oficial não carregar */
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            {/* Fallback SVG (oculto por padrão) */}
            <span
              style={{
                display: 'none',
                alignItems: 'baseline',
                fontWeight: 900,
                fontSize: 32,
                letterSpacing: -1,
                lineHeight: 1,
              }}
            >
              <span style={{ color: '#1351B4' }}>go</span>
              <span style={{ color: '#FFCD07' }}>v</span>
              <span style={{ color: '#1351B4' }}>.</span>
              <span style={{ color: '#168821' }}>b</span>
              <span style={{ color: '#1351B4' }}>r</span>
            </span>

            {/* Separador + Ministério */}
            <span style={{ width: 1, height: 40, background: '#ccc', flexShrink: 0 }} />
            <span
              style={{ color: '#888', fontSize: 13, fontWeight: 400, lineHeight: 1.4, maxWidth: 160 }}
              className="hidden sm:block"
            >
              Ministério das<br />Comunicações
            </span>
          </a>

          {/* ── Direita: idiomas + links + Entrar ── */}
          <div
            className="hidden md:flex"
            style={{ alignItems: 'center', gap: 0 }}
          >
            {/* PT | EN | ES */}
            <div style={{ display: 'flex', alignItems: 'center', marginRight: 16 }}>
              {[['PT', true], ['EN', false], ['ES', false]].map(([lang, active], i) => (
                <React.Fragment key={lang}>
                  <a
                    href="#"
                    style={{
                      color: active ? '#1351B4' : '#999',
                      fontSize: 12,
                      fontWeight: active ? 700 : 400,
                      textDecoration: 'none',
                      padding: '2px 4px',
                      lineHeight: 1,
                    }}
                    className="hover:underline"
                  >
                    {lang}
                  </a>
                  {i < 2 && <span style={{ color: '#ddd', fontSize: 11, margin: '0 1px' }}>|</span>}
                </React.Fragment>
              ))}
            </div>

            {/* Links institucionais */}
            {['Órgãos do Governo', 'Acesso à Informação', 'Legislação'].map(link => (
              <a
                key={link}
                href="#"
                style={{
                  color: '#1351B4',
                  fontSize: 13,
                  fontWeight: 400,
                  textDecoration: 'none',
                  padding: '6px 10px',
                  whiteSpace: 'nowrap',
                }}
                className="hover:underline"
              >
                {link}
              </a>
            ))}

            {/* Acessibilidade */}
            <a
              href="#"
              style={{
                color: '#1351B4',
                fontSize: 13,
                fontWeight: 400,
                textDecoration: 'none',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
              }}
              className="hover:underline"
            >
              {/* Ícone acessibilidade oficial gov.br (círculo com metade preenchida) */}
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="9" stroke="#1351B4" strokeWidth="1.8"/>
                <path d="M10 1 A9 9 0 0 1 10 19 Z" fill="#1351B4"/>
              </svg>
              Acessibilidade
            </a>

            {/* Botão Entrar (visual only — sem login) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginLeft: 8,
                border: '1.5px solid #1351B4',
                borderRadius: 4,
                padding: '6px 14px',
                cursor: 'default',
                whiteSpace: 'nowrap',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="#1351B4" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="7" r="4" stroke="#1351B4" strokeWidth="2"/>
              </svg>
              <span style={{ color: '#1351B4', fontSize: 13, fontWeight: 700 }}>Entrar</span>
            </div>
          </div>

          {/* Mobile: hambúrguer */}
          <button
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#1351B4' }}
            aria-label="Menu"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
              }
            </svg>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          LINHA 2 — Agência + busca
          ══════════════════════════════════════════════════ */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e0e0e0' }}>
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
          }}
        >
          {/* Ícone 3 quadrados + nome da agência */}
          <a
            href="/anatel"
            style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
          >
            {/* 3 quadradinhos azuis (idênticos à imagem) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, width: 14, flexShrink: 0 }}>
              {[0,1,2,3].map(i => (
                <div
                  key={i}
                  style={{ width: 6, height: 6, background: '#1351B4', borderRadius: 0 }}
                />
              ))}
            </div>
            <span
              style={{ color: '#1351B4', fontSize: 20, fontWeight: 300, letterSpacing: '-0.3px' }}
            >
              Agência Nacional de Telecomunicações
            </span>
          </a>

          {/* Campo de busca — fundo cinza claro */}
          <div
            className="hidden md:flex"
            style={{
              alignItems: 'center',
              background: '#f0f0f0',
              borderRadius: 4,
              padding: '9px 16px',
              gap: 10,
              minWidth: 280,
              maxWidth: 340,
              flexShrink: 0,
            }}
          >
            <input
              type="text"
              placeholder="O que você procura?"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 14,
                color: '#555',
                fontFamily: 'inherit',
              }}
              aria-label="Busca"
            />
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              aria-label="Buscar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7.5" stroke="#1351B4" strokeWidth="2.2"/>
                <path d="M17 17L21.5 21.5" stroke="#1351B4" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          Mobile menu
          ══════════════════════════════════════════════════ */}
      {menuOpen && (
        <div style={{ background: '#fff', borderBottom: '1px solid #e0e0e0' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 24px' }}>
            <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: 4, padding: '8px 12px', gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                placeholder="O que você procura?"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: '#555' }}
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7.5" stroke="#1351B4" strokeWidth="2.2"/>
                <path d="M17 17L21.5 21.5" stroke="#1351B4" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </div>
            {['Órgãos do Governo', 'Acesso à Informação', 'Legislação', 'Acessibilidade'].map(item => (
              <a
                key={item}
                href="#"
                style={{
                  display: 'block',
                  color: '#1351B4',
                  fontSize: 14,
                  padding: '10px 0',
                  borderBottom: '1px solid #f0f0f0',
                  textDecoration: 'none',
                }}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          Breadcrumb (quando fornecido)
          ══════════════════════════════════════════════════ */}
      {breadcrumb && (
        <div style={{ background: '#f8f8f8', borderBottom: '1px solid #eaeaea' }}>
          <nav
            style={{
              maxWidth: 1280,
              margin: '0 auto',
              padding: '8px 24px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              color: '#666',
            }}
            aria-label="Navegação estrutural"
          >
            <a href="/anatel" style={{ color: '#1351B4', textDecoration: 'none' }} className="hover:underline">Anatel</a>
            <span style={{ color: '#bbb', margin: '0 2px' }}>›</span>
            <a href="#" style={{ color: '#1351B4', textDecoration: 'none' }} className="hover:underline">Regulado</a>
            <span style={{ color: '#bbb', margin: '0 2px' }}>›</span>
            <span style={{ color: '#333', fontWeight: 600 }}>{breadcrumb}</span>
          </nav>
        </div>
      )}
    </header>
  );
};

export default AnatelHeader;
