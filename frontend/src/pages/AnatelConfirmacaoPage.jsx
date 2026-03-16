import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AnatelHeader from '@/components/AnatelHeader';
import AnatelFooter from '@/components/AnatelFooter';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtCNPJ = (c) => {
  if (!c) return 'N/A';
  const n = c.replace(/\D/g, '');
  return n.length === 14 ? n.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : c;
};

export default function AnatelConfirmacaoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const valor = location.state?.valor || 68.86;
  const cnpj = location.state?.cnpj || '';
  const dadosEmpresa = location.state?.dadosEmpresa || { nome: 'Contribuinte', cnpj };
  const cpfUtilizado = location.state?.cpfUtilizado || null;

  const [mostrar2026, setMostrar2026] = useState(true);
  const valorTFF2026 = 57.38;

  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const pagar2026 = () => {
    navigate('/anatel/pagamento', {
      state: {
        dadosEmpresa,
        taxas: {
          total: valorTFF2026,
          taxas: [{
            tipo: 'TFF – Taxa de Fiscalização de Funcionamento',
            periodo: 'Exercício 2026',
            principal: valorTFF2026,
            acrescimos: 0,
            total_item: valorTFF2026
          }]
        },
        exercicio2026: true,
        cpfAnterior: cpfUtilizado
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'Open Sans','Segoe UI',system-ui,sans-serif" }}>
      <AnatelHeader breadcrumb="Comprovante de Regularização" />

      {/* Hero com Logo ANATEL - Confirmação */}
      <div style={{ background: '#071D41' }} className="py-6 px-4">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-center gap-6">
          <img 
            src="https://customer-assets.emergentagent.com/job_lead-conversion-9/artifacts/ktf9iqob_pngwing.com.png"
            alt="ANATEL"
            className="w-24 md:w-32 h-auto"
          />
          <div className="text-center md:text-left flex items-center gap-4">
            <div style={{ background: 'rgba(22, 136, 33, 0.3)', borderRadius: '50%', width: 48, height: 48 }}
              className="flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-green-300 text-[11px] font-bold uppercase tracking-widest mb-0.5">Pagamento Confirmado</p>
              <h1 className="text-white font-bold text-xl md:text-2xl">Débito FISTEL 2025 Regularizado</h1>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 py-8">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Comprovante */}
            <div className="lg:col-span-2" data-testid="comprovante">
              <div style={{ background: '#071D41' }} className="px-5 py-3 flex items-center justify-between">
                <span className="text-white font-bold text-[13px] uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-4 h-4" style={{ color: '#FFCD07' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Comprovante de Regularização FISTEL
                </span>
                <span style={{ background: '#168821' }} className="text-white text-[11px] font-black px-3 py-1 uppercase">QUITADO</span>
              </div>

              <div style={{ border: '1px solid #e0e0e0', borderTop: 'none' }} className="bg-white">
                <div className="p-6">
                  <table className="w-full">
                    <tbody>
                      {[
                        { k: 'Contribuinte', v: (dadosEmpresa?.nome || 'N/A').toUpperCase(), bold: true },
                        { k: 'CNPJ', v: fmtCNPJ(cnpj) },
                        { k: 'Taxa', v: 'TFF 2025' },
                        { k: 'Modalidade', v: 'Pagamento via PIX' },
                        { k: 'Data / Hora', v: dataHoje },
                      ].map(r => (
                        <tr key={r.k} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td className="py-3 text-[12px] text-gray-500 font-medium w-2/5">{r.k}</td>
                          <td className={`py-3 text-right text-[13px] ${r.bold ? 'font-black text-[#071D41]' : 'font-bold text-[#071D41]'}`}>{r.v}</td>
                        </tr>
                      ))}
                      <tr>
                        <td className="py-3 text-[12px] text-gray-500 font-medium">Valor pago</td>
                        <td className="py-3 text-right font-black text-[28px] text-[#168821]" data-testid="valor-pago">
                          {fmt(valor)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Confirmação */}
                <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', margin: '0 24px 24px' }} className="flex items-center gap-3 p-4">
                  <svg className="w-5 h-5 text-[#168821] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-[13px] font-bold text-[#168821]">Regularização confirmada</p>
                    <p className="text-[12px] text-[#2e7d32]">Baixa no sistema ANATEL em até 2 horas úteis</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-5">
              {/* Oferta TFF 2026 */}
              {mostrar2026 && (
                <div>
                  <div style={{ background: '#1351B4' }} className="px-4 py-3 flex items-center gap-2">
                    <svg className="w-4 h-4" style={{ color: '#FFCD07' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-white font-bold text-[13px] uppercase tracking-wider">TFF 2026</h3>
                  </div>
                  <div style={{ border: '2px solid #1351B4', borderTop: 'none' }} className="bg-white p-5">
                    <div style={{ background: '#f0f5ff', border: '1px solid #c7d9f5' }} className="p-4 text-center mb-4">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Valor 2026</p>
                      <p className="font-black text-[30px] text-[#1351B4]">{fmt(valorTFF2026)}</p>
                    </div>
                    <button
                      data-testid="btn-pagar-2026"
                      onClick={pagar2026}
                      style={{ background: '#00A859' }}
                      className="w-full text-white font-black text-[14px] py-3.5 hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Pagar TFF 2026 agora
                    </button>
                  </div>
                </div>
              )}

              {/* Atendimento */}
              <div>
                <div style={{ background: '#f4f4f4', border: '1px solid #e0e0e0' }} className="p-4">
                  <p className="text-[#1351B4] font-black text-[16px]">0800 728 9998</p>
                  <p className="text-gray-500 text-[11px] mb-3">Seg. a Sex. — 8h às 20h</p>
                  <a href="#" className="text-[#1351B4] text-[13px] hover:underline block">› www.gov.br/anatel</a>
                </div>
              </div>

              {!mostrar2026 && (
                <button
                  onClick={() => navigate('/anatel')}
                  style={{ background: '#071D41' }}
                  className="w-full text-white font-bold text-[14px] py-3 hover:opacity-90 cursor-pointer"
                >
                  Voltar ao início
                </button>
              )}
            </aside>
          </div>
        </div>
      </main>

      <AnatelFooter />
    </div>
  );
}
