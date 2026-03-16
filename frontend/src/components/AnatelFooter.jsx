import React from 'react';

const AnatelFooter = () => (
  <footer style={{ fontFamily: "'Rawline', 'Segoe UI', system-ui, sans-serif" }}>
    {/* Corpo azul escuro */}
    <div style={{ background: '#071D41' }} className="pt-10 pb-6">
      <div className="max-w-[1280px] mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

          {/* Coluna 1 — Logo */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_lead-conversion-9/artifacts/ktf9iqob_pngwing.com.png"
                alt="ANATEL"
                className="w-16 h-auto"
              />
              <div>
                <p className="text-white font-bold text-[15px] leading-none">Anatel</p>
                <p style={{ color: '#93c2f5' }} className="text-[10px] mt-0.5">Agência Nacional de Telecomunicações</p>
              </div>
            </div>
            <p style={{ color: '#93c2f5' }} className="text-[12px] leading-relaxed">
              Vinculada ao Ministério das Comunicações. Responsável pela regulação das telecomunicações no Brasil.
            </p>
          </div>

          {/* Coluna 2 — Serviços */}
          <div>
            <h3 className="text-white font-bold text-[13px] uppercase tracking-wider mb-4">Serviços</h3>
            <ul className="space-y-2">
              {['Consulta de Taxas FISTEL', 'Pagamento de Débitos', 'Homologação de Equipamentos', 'Outorga de Serviços', 'Fiscalização Online'].map(s => (
                <li key={s}>
                  <a href="#" style={{ color: '#93c2f5' }} className="text-[12px] hover:text-white hover:underline transition-colors">{s}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 3 — Informações */}
          <div>
            <h3 className="text-white font-bold text-[13px] uppercase tracking-wider mb-4">Informações</h3>
            <ul className="space-y-2">
              {['Sobre a Anatel', 'Legislação', 'Regulamentação', 'Transparência', 'Notícias'].map(s => (
                <li key={s}>
                  <a href="#" style={{ color: '#93c2f5' }} className="text-[12px] hover:text-white hover:underline transition-colors">{s}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 4 — Atendimento */}
          <div>
            <h3 className="text-white font-bold text-[13px] uppercase tracking-wider mb-4">Atendimento</h3>
            <p className="text-white font-black text-[18px] mb-1">0800 728 9998</p>
            <p style={{ color: '#93c2f5' }} className="text-[11px] mb-4">Seg. a Sex. — 8h às 20h</p>
            <ul className="space-y-2">
              {['Fale Conosco', 'Ouvidoria', 'Carta de Serviços'].map(s => (
                <li key={s}>
                  <a href="#" style={{ color: '#93c2f5' }} className="text-[12px] hover:text-white hover:underline transition-colors">{s}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Rodapé inferior */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }} className="pt-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p style={{ color: '#5a8bb5' }} className="text-[11px] text-center md:text-left">
            Conteúdo publicado sob a{' '}
            <a href="#" className="hover:text-white underline">licença Creative Commons Atribuição 3.0</a>
          </p>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-[13px]">gov.br</span>
            <span style={{ color: '#5a8bb5' }} className="text-[11px]">/anatel</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default AnatelFooter;
