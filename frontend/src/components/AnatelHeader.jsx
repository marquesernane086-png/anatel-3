import React, { useState } from 'react';

const AnatelHeader = ({ breadcrumb = null }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full" style={{ fontFamily: "'Rawline', 'Segoe UI', system-ui, sans-serif" }}>

      {/* ── 1. Barra preta superior gov.br ── */}
      <div style={{ backgroundColor: '#000', padding: '4px 0' }}>
        <div className="max-w-[1280px] mx-auto px-4 flex items-center justify-between">
          {/* Logo gov.br texto branco */}
          <a href="https://www.gov.br" target="_blank" rel="noreferrer" className="flex items-center gap-2">
            <svg height="20" viewBox="0 0 176 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="0" y="28" fill="white" fontSize="22" fontWeight="800" fontFamily="Arial, sans-serif" letterSpacing="-1">gov.br</text>
            </svg>
          </a>
          <div className="flex items-center gap-4 text-[11px] text-white/70">
            <a href="#" className="hover:text-white transition-colors">Acessibilidade</a>
            <a href="#" className="hover:text-white transition-colors hidden sm:inline">Alto Contraste</a>
            <a href="#" className="hover:text-white transition-colors hidden sm:inline">VLibras</a>
          </div>
        </div>
      </div>

      {/* ── 2. Header branco com logo ANATEL + busca ── */}
      <div className="bg-white" style={{ borderBottom: '1px solid #e0e0e0' }}>
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="flex items-center justify-between h-[72px] gap-4">
            {/* Logo */}
            <a href="/anatel" className="flex items-center gap-3 hover:opacity-85 transition-opacity flex-shrink-0">
              <div
                className="flex items-center justify-center rounded"
                style={{ background: '#1351B4', width: 48, height: 48 }}
              >
                <span className="text-white font-black text-[13px] leading-none tracking-tight">ANA<br/>TEL</span>
              </div>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-[#1351B4] font-black text-[19px] tracking-tight leading-none">Anatel</span>
                <span className="text-gray-500 text-[11px] font-medium mt-0.5">Agência Nacional de Telecomunicações</span>
              </div>
            </a>

            {/* Campo de busca — desktop */}
            <div className="hidden md:flex flex-1 max-w-lg">
              <div className="flex w-full border border-gray-300 rounded overflow-hidden">
                <input
                  type="text"
                  placeholder="O que você procura?"
                  className="flex-1 px-4 py-2 text-sm outline-none"
                />
                <button
                  className="px-4 flex items-center justify-center bg-[#1351B4] hover:bg-[#0c3d91] transition-colors"
                  aria-label="Buscar"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Ações direita */}
            <div className="flex items-center gap-3">
              <button
                className="md:hidden text-[#1351B4]"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Buscar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button
                className="md:hidden text-[#1351B4]"
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

          {/* Mobile busca */}
          {searchOpen && (
            <div className="md:hidden pb-3">
              <div className="flex border border-gray-300 rounded overflow-hidden">
                <input type="text" placeholder="O que você procura?" className="flex-1 px-4 py-2 text-sm outline-none" />
                <button className="px-4 bg-[#1351B4] text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Barra de navegação principal ── */}
      <div style={{ background: '#1351B4' }}>
        <div className="max-w-[1280px] mx-auto px-4">
          <nav className="hidden md:flex items-stretch h-[44px]" role="navigation">
            {[
              { label: 'Consumidor', href: '#' },
              { label: 'Regulado', href: '#' },
              { label: 'Dados', href: '#' },
              { label: 'Legislação', href: '#' },
              { label: 'Homologação', href: '#' },
              { label: 'Acesso à Informação', href: '#' },
            ].map((item, i) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center px-5 text-white text-[13px] font-semibold hover:bg-white/10 transition-colors border-r border-white/20 whitespace-nowrap"
                style={{ borderLeft: i === 0 ? '1px solid rgba(255,255,255,0.2)' : undefined }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Mobile nav */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-1">
              {['Consumidor', 'Regulado', 'Dados', 'Legislação', 'Homologação', 'Acesso à Informação'].map(item => (
                <a key={item} href="#" className="block py-2.5 px-2 text-white text-sm font-semibold border-b border-white/10 hover:bg-white/10">
                  {item}
                </a>
              ))}
            </nav>
          )}
        </div>
      </div>

      {/* ── 4. Breadcrumb ── */}
      <div style={{ background: '#f4f4f4', borderBottom: '1px solid #e0e0e0' }}>
        <div className="max-w-[1280px] mx-auto px-4 py-2">
          <nav className="flex flex-wrap items-center gap-1 text-[12px] text-gray-500" aria-label="Navegação estrutural">
            <a href="/anatel" className="hover:text-[#1351B4] hover:underline">Anatel</a>
            <span className="mx-1 text-gray-400">›</span>
            <a href="#" className="hover:text-[#1351B4] hover:underline">Regulado</a>
            <span className="mx-1 text-gray-400">›</span>
            <span className="text-[#1351B4] font-semibold">{breadcrumb || 'Taxas FISTEL'}</span>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default AnatelHeader;
