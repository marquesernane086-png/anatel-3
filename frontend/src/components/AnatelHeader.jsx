import React, { useState } from 'react';

const AnatelHeader = ({ breadcrumb = null }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className="w-full"
      style={{ fontFamily: "'Rawline', 'Segoe UI', system-ui, sans-serif", background: '#fff' }}
    >
      {/* ── Linha 1: gov.br logo + Ministério + links institucionais ── */}
      <div
        className="w-full"
        style={{ borderBottom: '1px solid #e8e8e8', background: '#fff' }}
      >
        <div
          className="max-w-[1280px] mx-auto px-4 sm:px-6"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 64 }}
        >
          {/* Lado esquerdo: logo gov.br + Ministério das Comunicações */}
          <a href="/anatel" className="flex items-center gap-3 hover:opacity-90 transition-opacity flex-shrink-0">
            {/* Logo gov.br colorido (SVG fiel ao original) */}
            <svg
              width="98"
              height="56"
              viewBox="0 0 98 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="gov.br"
              style={{ flexShrink: 0 }}
            >
              {/* "g" azul */}
              <text x="0" y="38" fontSize="44" fontWeight="900" fontFamily="'Rawline','Arial Black',sans-serif" fill="#1351B4">g</text>
              {/* "o" amarelo */}
              <text x="24" y="38" fontSize="44" fontWeight="900" fontFamily="'Rawline','Arial Black',sans-serif" fill="#FFCD07">o</text>
              {/* "v" verde */}
              <text x="48" y="38" fontSize="44" fontWeight="900" fontFamily="'Rawline','Arial Black',sans-serif" fill="#168821">v</text>
              {/* ponto azul */}
              <text x="69" y="38" fontSize="44" fontWeight="900" fontFamily="'Rawline','Arial Black',sans-serif" fill="#1351B4">.</text>
              {/* "b" azul */}
              <text x="76" y="38" fontSize="44" fontWeight="900" fontFamily="'Rawline','Arial Black',sans-serif" fill="#1351B4">b</text>
              {/* "r" azul — posição ajustada pois 'b' é mais largo */}
              <text x="94" y="38" fontSize="44" fontWeight="900" fontFamily="'Rawline','Arial Black',sans-serif" fill="#168821">r</text>
            </svg>

            {/* Separador vertical */}
            <div style={{ width: 1, height: 36, background: '#ccc', marginLeft: 4, marginRight: 4 }} />

            {/* Ministério das Comunicações */}
            <span
              className="hidden sm:block"
              style={{ color: '#888', fontSize: 12, fontWeight: 400, lineHeight: 1.3, maxWidth: 140 }}
            >
              Ministério das<br />Comunicações
            </span>
          </a>

          {/* Lado direito: links + idiomas + acessibilidade + Entrar */}
          <div className="hidden md:flex items-center gap-1" style={{ flexWrap: 'nowrap' }}>
            {/* Idiomas */}
            <div className="flex items-center" style={{ gap: 2, marginRight: 12 }}>
              {['PT', 'EN', 'ES'].map((lang, i) => (
                <React.Fragment key={lang}>
                  <a
                    href="#"
                    style={{
                      color: i === 0 ? '#1351B4' : '#888',
                      fontSize: 12,
                      fontWeight: i === 0 ? 700 : 400,
                      textDecoration: 'none',
                      padding: '2px 3px',
                    }}
                    className="hover:underline"
                  >
                    {lang}
                  </a>
                  {i < 2 && <span style={{ color: '#ccc', fontSize: 10 }}>|</span>}
                </React.Fragment>
              ))}
            </div>

            {/* Links institucionais */}
            {['Órgãos do Governo', 'Acesso à Informação', 'Legislação'].map(link => (
              <a
                key={link}
                href="#"
                style={{ color: '#1351B4', fontSize: 13, fontWeight: 400, textDecoration: 'none', padding: '4px 8px', whiteSpace: 'nowrap' }}
                className="hover:underline"
              >
                {link}
              </a>
            ))}

            {/* Acessibilidade */}
            <a
              href="#"
              style={{ color: '#1351B4', fontSize: 13, fontWeight: 400, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', textDecoration: 'none' }}
              className="hover:underline"
            >
              {/* Ícone acessibilidade — círculo metade */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#1351B4" strokeWidth="2"/>
                <path d="M12 2 A10 10 0 0 1 12 22 Z" fill="#1351B4"/>
              </svg>
              Acessibilidade
            </a>

            {/* Botão Entrar — SEM funcionalidade de login */}
            <button
              style={{
                color: '#1351B4',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                border: '1px solid #1351B4',
                borderRadius: 4,
                padding: '5px 12px',
                background: 'transparent',
                cursor: 'default',
                marginLeft: 4,
                whiteSpace: 'nowrap',
              }}
              aria-label="Entrar"
              tabIndex={-1}
            >
              {/* Ícone pessoa */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#1351B4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="#1351B4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Entrar
            </button>
          </div>

          {/* Mobile: hambúrguer */}
          <button
            className="md:hidden"
            style={{ color: '#1351B4', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* ── Linha 2: Hambúrguer + "Agência Nacional de Telecomunicações" + Busca ── */}
      <div
        className="w-full"
        style={{ background: '#fff', borderBottom: '1px solid #e0e0e0' }}
      >
        <div
          className="max-w-[1280px] mx-auto px-4 sm:px-6"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 64, gap: 16 }}
        >
          {/* Esquerda: ≡ + nome da agência */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Ícone de 3 linhas (hambúrguer) azul */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, cursor: 'pointer' }} aria-hidden="true">
              <span style={{ display: 'block', width: 5, height: 5, background: '#1351B4' }} />
              <span style={{ display: 'block', width: 5, height: 5, background: '#1351B4' }} />
              <span style={{ display: 'block', width: 5, height: 5, background: '#1351B4' }} />
            </div>
            <a
              href="/anatel"
              style={{ color: '#1351B4', fontSize: 18, fontWeight: 400, textDecoration: 'none', letterSpacing: '-0.2px' }}
              className="hover:underline"
            >
              Agência Nacional de Telecomunicações
            </a>
          </div>

          {/* Direita: campo de busca com fundo cinza */}
          <div
            className="hidden md:flex items-center"
            style={{
              background: '#f0f0f0',
              borderRadius: 4,
              padding: '8px 14px',
              gap: 10,
              minWidth: 260,
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
              }}
              aria-label="Campo de busca"
            />
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              aria-label="Buscar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="7" stroke="#1351B4" strokeWidth="2.2"/>
                <path d="M16.5 16.5 L21 21" stroke="#1351B4" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav expandido */}
      {mobileMenuOpen && (
        <div style={{ background: '#fff', borderBottom: '1px solid #e0e0e0' }}>
          <div className="max-w-[1280px] mx-auto px-4 py-3">
            {/* Busca mobile */}
            <div style={{ background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', padding: '8px 12px', gap: 8, marginBottom: 12 }}>
              <input type="text" placeholder="O que você procura?" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: '#555' }} />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#1351B4" strokeWidth="2.2"/><path d="M16.5 16.5 L21 21" stroke="#1351B4" strokeWidth="2.2" strokeLinecap="round"/></svg>
            </div>
            {['Órgãos do Governo', 'Acesso à Informação', 'Legislação', 'Acessibilidade'].map(item => (
              <a key={item} href="#" style={{ display: 'block', color: '#1351B4', fontSize: 14, padding: '8px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none' }}>{item}</a>
            ))}
          </div>
        </div>
      )}

      {/* ── Breadcrumb ── */}
      {breadcrumb && (
        <div style={{ background: '#f8f8f8', borderBottom: '1px solid #e8e8e8' }}>
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-2">
            <nav className="flex flex-wrap items-center gap-1" aria-label="Navegação estrutural" style={{ fontSize: 12, color: '#666' }}>
              <a href="/anatel" style={{ color: '#1351B4', textDecoration: 'none' }} className="hover:underline">Anatel</a>
              <span style={{ color: '#aaa', margin: '0 2px' }}>›</span>
              <a href="#" style={{ color: '#1351B4', textDecoration: 'none' }} className="hover:underline">Regulado</a>
              <span style={{ color: '#aaa', margin: '0 2px' }}>›</span>
              <span style={{ color: '#333', fontWeight: 600 }}>{breadcrumb}</span>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default AnatelHeader;
