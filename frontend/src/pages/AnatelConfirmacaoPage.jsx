import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AnatelHeader from '@/components/AnatelHeader';
import AnatelFooter from '@/components/AnatelFooter';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtCPF = (c) => {
  if (!c) return 'N/A';
  const n = c.replace(/\D/g, '');
  return n.length === 11 ? n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : c;
};

export default function AnatelConfirmacaoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const valor = location.state?.valor || 68.85;
  const cpf = location.state?.cpf || '';
  const dadosPessoa = location.state?.dadosPessoa || { nome: 'Contribuinte', cpf };
  const cpfUtilizado = location.state?.cpfUtilizado || null;

  const [mostrarTFI, setMostrarTFI] = useState(true);
  const valorTFI = 57.37;

  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const pagarTFI = () => {
    const pessoaCompleta = {
      ...dadosPessoa,
      cpf: dadosPessoa?.cpf || cpf
    };
    
    navigate('/anatel/pagamento', {
      state: {
        dadosPessoa: pessoaCompleta,
        taxas: {
          total: valorTFI,
          taxas: [{
            tipo: 'TFI – Taxa de Fiscalização de Instalação',
            periodo: 'Exercício 2025',
            principal: valorTFI,
            acrescimos: 0,
            total_item: valorTFI
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
                        { k: 'Contribuinte', v: (dadosPessoa?.nome || 'N/A').toUpperCase(), bold: true },
                        { k: 'CPF', v: fmtCPF(cpf) },
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
              {/* Oferta TFI - Segunda Taxa */}
              {mostrarTFI && (
                <div>
                  <div style={{ background: '#071D41' }} className="px-4 py-3 flex items-center gap-2">
                    <svg className="w-4 h-4" style={{ color: '#FFCD07' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <h3 className="text-white font-bold text-[13px] uppercase tracking-wider">TFI Pendente</h3>
                  </div>
                  <div style={{ border: '2px solid #071D41', borderTop: 'none' }} className="bg-white p-5">
                    <p className="text-[13px] text-gray-600 mb-4 leading-relaxed">
                      Ainda existe uma <strong>Taxa de Fiscalização de Instalação (TFI)</strong> pendente. Regularize agora sem multas.
                    </p>
                    <div style={{ background: '#fff3cd', border: '1px solid #ffc107' }} className="p-4 text-center mb-4">
                      <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">TFI 2025 - Sem acréscimos</p>
                      <p className="font-black text-[30px] text-[#071D41]">{fmt(valorTFI)}</p>
                    </div>
                    <button
                      data-testid="btn-pagar-tfi"
                      onClick={pagarTFI}
                      style={{ background: '#00A859' }}
                      className="w-full text-white font-black text-[14px] py-3.5 hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Pagar TFI agora
                    </button>
                  </div>
                </div>
              )}

              {!mostrarTFI && (
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
