import React from 'react';

const GovBrHeader = () => {
  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm">
      {/* Top Bar */}
      <div className="bg-white py-2 px-4 sm:px-8 border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="https://www.gov.br/++theme++padrao_govbr/img/govbr-logo-large.png" 
              alt="gov.br" 
              className="h-[25px]"
            />
            <span className="text-[12px] text-gray-500 font-bold uppercase hidden sm:inline-block">
              MINISTÉRIO DA FAZENDA
            </span>
          </div>
          <div className="flex items-center gap-4 text-[13px] font-semibold text-gray-700">
            <a href="#" className="hover:text-blue-600 transition-colors">Acessibilidade</a>
            <a href="#" className="hover:text-blue-600 transition-colors hidden sm:inline">Alto Contraste</a>
            <a href="#" className="hover:text-blue-600 transition-colors hidden sm:inline">VLibras</a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center w-full md:w-auto">
            <div className="flex flex-col">
              <a href="/" className="text-[#0c326f] text-[28px] font-bold leading-tight hover:underline transition-all">
                Receita Federal
              </a>
              <span className="text-[14px] text-gray-600">Ministério da Fazenda</span>
            </div>
          </div>
          
          <div className="w-full md:w-auto flex flex-col gap-2">
            <div className="relative w-full md:w-[400px]">
              <input
                type="text"
                placeholder="O que você procura?"
                className="w-full border border-gray-300 rounded-full py-2 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#0c326f] hover:text-blue-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="w-full bg-[#0c326f] text-white hidden md:block">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <nav className="flex items-center gap-8 h-[48px] text-[14px] font-semibold">
            <a href="#" className="hover:bg-[#06214d] px-3 h-full flex items-center transition-colors">Assuntos</a>
            <a href="#" className="hover:bg-[#06214d] px-3 h-full flex items-center transition-colors">Centrais de Conteúdo</a>
            <a href="#" className="hover:bg-[#06214d] px-3 h-full flex items-center transition-colors">Acesso à Informação</a>
            <a href="#" className="hover:bg-[#06214d] px-3 h-full flex items-center transition-colors">Canais de Atendimento</a>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default GovBrHeader;
