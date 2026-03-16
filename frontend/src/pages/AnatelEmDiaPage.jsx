import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AnatelHeader from '@/components/AnatelHeader';
import AnatelFooter from '@/components/AnatelFooter';

const fmtCNPJ = (c) => {
  if (!c) return 'N/A';
  const n = c.replace(/\D/g, '');
  return n.length === 14 ? n.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : c;
};

export default function AnatelEmDiaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const cnpj = location.state?.cnpj || '';
  const dadosEmpresa = location.state?.dadosEmpresa || { nome: 'Contribuinte', cnpj };

  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'Rawline','Segoe UI',system-ui,sans-serif" }}>
      <AnatelHeader breadcrumb="Situação Fiscal Regular" />

      {/* Banner verde */}
      <div style={{ background: 'linear-gradient(90deg,#0a4a0d 0%,#168821 100%)' }} className="py-6 px-4">
        <div className="max-w-[1280px] mx-auto flex items-center gap-4">
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '50%', width: 48, height: 48 }}
            className="flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-green-200 text-[11px] font-bold uppercase tracking-widest mb-0.5">FISTEL Online — Regularizado</p>
            <h1 className="text-white font-black text-[22px]">Empresa em Dia — Situação Fiscal Regular</h1>
          </div>
        </div>
      </div>

      <main className="flex-1 py-8">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Certificado */}
            <div className="lg:col-span-2" data-testid="certificado-em-dia">
              {/* Cabeçalho */}
              <div style={{ background: '#071D41' }} className="px-5 py-3 flex items-center justify-between">
                <span className="text-white font-bold text-[13px] uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-4 h-4" style={{ color: '#FFCD07' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Certificado de Situação Regular — FISTEL
                </span>
                <span style={{ background: '#168821' }} className="text-white text-[11px] font-black px-3 py-1 uppercase">REGULAR</span>
              </div>

              <div style={{ border: '1px solid #e0e0e0', borderTop: 'none' }} className="bg-white">
                {/* Destaque TFF quitadas */}
                <div style={{ border: '2px solid #168821', background: '#e8f5e9', margin: 24 }} className="p-6 text-center">
                  <svg className="w-12 h-12 text-[#168821] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-black text-[#168821] text-[24px]">TFF 2025 e 2026</p>
                  <p className="font-black text-[#168821] text-[14px] uppercase tracking-widest mt-1">QUITADAS</p>
                </div>

                {/* Tabela de dados */}
                <div className="px-6 pb-6">
                  <table className="w-full">
                    <tbody>
                      {[
                        { k: 'Contribuinte', v: (dadosEmpresa?.nome || 'N/A').toUpperCase(), bold: true },
                        { k: 'CNPJ', v: fmtCNPJ(cnpj) },
                        { k: 'Serviço', v: 'SME / FISTEL' },
                        { k: 'Exercícios quitados', v: '2025 e 2026', green: true },
                        { k: 'Data de regularização', v: dataHoje },
                      ].map(r => (
                        <tr key={r.k} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td className="py-3 text-[12px] text-gray-500 font-medium w-2/5">{r.k}</td>
                          <td className={`py-3 text-right text-[13px] ${r.bold ? 'font-black text-[#071D41]' : r.green ? 'font-bold text-[#168821]' : 'font-bold text-[#071D41]'}`}>{r.v}</td>
                        </tr>
                      ))}
                      <tr>
                        <td className="py-3 text-[12px] text-gray-500 font-medium">Situação atual</td>
                        <td className="py-3 text-right">
                          <span style={{ background: '#e8f5e9', color: '#168821', border: '1px solid #a5d6a7' }} className="px-3 py-1 text-[11px] font-black uppercase">REGULAR</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Próximo vencimento */}
                <div style={{ background: '#e3f2fd', borderTop: '1px solid #c7d9f5', borderBottom: '1px solid #c7d9f5' }} className="px-6 py-4 flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#1351B4] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-[13px] text-[#1351B4]">
                    Próxima taxa TFF devida em <strong>janeiro de 2027</strong>
                  </p>
                </div>

                {/* Ações */}
                <div style={{ background: '#f4f4f4', borderTop: '1px solid #e0e0e0' }} className="px-6 py-4 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => window.print()}
                    style={{ border: '2px solid #168821', color: '#168821' }}
                    className="flex items-center justify-center gap-2 font-bold text-[13px] px-5 py-2.5 hover:bg-[#168821] hover:text-white transition-colors cursor-pointer bg-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Imprimir certificado
                  </button>
                  <button
                    onClick={() => window.print()}
                    style={{ border: '1px solid #ccc', color: '#555' }}
                    className="flex items-center justify-center gap-2 font-medium text-[13px] px-5 py-2.5 hover:bg-gray-100 cursor-pointer bg-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Salvar PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-5">
              <button
                data-testid="btn-voltar-inicio"
                onClick={() => navigate('/anatel')}
                style={{ background: '#1351B4' }}
                className="w-full text-white font-black text-[15px] py-4 hover:opacity-90 cursor-pointer"
              >
                Voltar ao início
              </button>

              {/* Situação atual */}
              <div>
                <div style={{ background: '#168821' }} className="px-4 py-3">
                  <h3 className="text-white font-bold text-[13px] uppercase tracking-wider">Situação Atual</h3>
                </div>
                <div style={{ border: '2px solid #168821', borderTop: 'none' }} className="bg-white">
                  {[
                    { ano: 'TFF 2025', status: 'Quitada', green: true },
                    { ano: 'TFF 2026', status: 'Quitada', green: true },
                    { ano: 'TFF 2027', status: 'Jan/2027', green: false },
                  ].map(r => (
                    <div key={r.ano} style={{ borderBottom: '1px solid #f0f0f0' }} className="px-4 py-3 flex items-center justify-between">
                      <span className="text-[13px] text-gray-600">{r.ano}</span>
                      <span className={`text-[13px] font-bold ${r.green ? 'text-[#168821]' : 'text-gray-400'}`}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Atendimento */}
              <div style={{ background: '#f4f4f4', border: '1px solid #e0e0e0' }} className="p-4">
                <p className="text-[#1351B4] font-black text-[16px]">0800 728 9998</p>
                <p className="text-gray-500 text-[11px] mb-2">Seg. a Sex. — 8h às 20h</p>
                <a href="#" className="text-[#1351B4] text-[13px] hover:underline block">› www.gov.br/anatel</a>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <AnatelFooter />
    </div>
  );
}
