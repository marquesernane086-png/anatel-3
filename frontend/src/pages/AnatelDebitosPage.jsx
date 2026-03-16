import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import AnatelHeader from '@/components/AnatelHeader';
import AnatelFooter from '@/components/AnatelFooter';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtCNPJ = (c) => {
  if (!c) return 'N/A';
  const n = c.replace(/\D/g, '');
  return n.length === 14 ? n.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : c;
};

export default function AnatelDebitosPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [taxas, setTaxas] = useState(null);
  const [loading, setLoading] = useState(true);
  const empresa = location.state?.dadosEmpresa;

  useEffect(() => {
    if (!empresa) { toast.error('Dados não encontrados'); navigate('/anatel'); return; }
    axios.get(`${API}/anatel/taxas/${empresa.cnpj?.replace(/\D/g, '') || ''}`)
      .then(r => setTaxas(r.data))
      .catch(() => toast.error('Erro ao carregar débitos'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'Rawline','Segoe UI',system-ui,sans-serif" }}>
      <AnatelHeader breadcrumb="Débitos FISTEL" />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#1351B4]/30 border-t-[#1351B4] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-[14px]">Carregando débitos...</p>
        </div>
      </main>
      <AnatelFooter />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'Rawline','Segoe UI',system-ui,sans-serif" }}>
      <AnatelHeader breadcrumb="Débitos FISTEL" />

      {/* Banner título — estilo .topo-com-degrade do ANATEL */}
      <div style={{ background: 'linear-gradient(90deg,#071D41 0%,#1351B4 100%)' }} className="py-6 px-4">
        <div className="max-w-[1280px] mx-auto">
          <p style={{ color: '#FFCD07' }} className="text-[11px] font-bold uppercase tracking-widest mb-1">FISTEL Online</p>
          <h1 className="text-white font-black text-[24px]">Débitos FISTEL — Taxa de Funcionamento</h1>
        </div>
      </div>

      <main className="flex-1 py-8 pb-32">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Coluna principal */}
            <div className="lg:col-span-2 space-y-5">

              {/* Dados do Contribuinte */}
              <div>
                <div style={{ borderBottom: '3px solid #1351B4' }} className="mb-0">
                  <div style={{ background: '#1351B4' }} className="px-5 py-3">
                    <h2 className="text-white font-bold text-[13px] uppercase tracking-wider">Dados do Contribuinte</h2>
                  </div>
                </div>
                <div style={{ border: '1px solid #e0e0e0', borderTop: 'none' }} className="p-5 bg-white">
                  <p className="font-black text-[#071D41] text-[18px] uppercase mb-4">{empresa?.nome || 'N/A'}</p>
                  <div className="grid sm:grid-cols-3 gap-3 mb-3">
                    {[
                      { label: 'CNPJ', val: fmtCNPJ(empresa?.cnpj) },
                      { label: 'Serviço', val: 'SME' },
                      { label: 'Situação', val: 'IRREGULAR', red: true },
                    ].map(f => (
                      <div key={f.label} style={{ background: '#f4f4f4', border: '1px solid #e0e0e0' }} className="p-3">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">{f.label}</p>
                        <p className={`font-bold text-[13px] ${f.red ? 'text-red-600' : 'text-[#071D41]'}`}>{f.val}</p>
                      </div>
                    ))}
                  </div>
                  {empresa?.telefone && (
                    <div style={{ background: '#fff8e1', border: '1px solid #ffc107' }} className="flex items-center gap-2 p-3 text-[12px]">
                      <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#856404' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span style={{ color: '#856404' }}>Linha vinculada: <strong>{empresa.telefone}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Débitos */}
              <div>
                <div style={{ background: '#dc3545' }} className="px-5 py-3">
                  <h2 className="text-white font-bold text-[13px] uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    Débito em Aberto — Ação Necessária
                  </h2>
                </div>
                <div style={{ border: '2px solid #dc3545', borderTop: 'none' }} className="bg-white">
                  {/* Valor total destaque */}
                  <div style={{ background: '#fff5f5', borderBottom: '1px solid #f5c6cb' }} className="p-5 text-center">
                    <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-1">Valor Total a Regularizar</p>
                    <p className="font-black text-[38px] text-red-600" data-testid="valor-total">
                      {fmt(taxas?.total)}
                    </p>
                  </div>

                  {/* Detalhamento */}
                  <div className="p-5">
                    {taxas?.taxas?.map((taxa, i) => (
                      <div key={i} style={{ border: '1px solid #e0e0e0' }} className="mb-3 last:mb-0">
                        <div style={{ background: '#f4f4f4', borderBottom: '1px solid #e0e0e0' }} className="px-4 py-2">
                          <p className="text-[11px] font-bold text-[#071D41] uppercase tracking-wider">{taxa.tipo}</p>
                        </div>
                        <div className="px-4 py-3">
                          <table className="w-full">
                            <tbody>
                              {[
                                { k: 'Período', v: taxa.periodo },
                                { k: 'Principal', v: fmt(taxa.principal) },
                                { k: 'Multa e acréscimos', v: `+ ${fmt(taxa.acrescimos)}`, red: true },
                              ].map(row => (
                                <tr key={row.k} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                  <td className="py-2 text-[12px] text-gray-500">{row.k}</td>
                                  <td className={`py-2 text-[13px] font-bold text-right ${row.red ? 'text-red-600' : 'text-[#071D41]'}`}>{row.v}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-5">
              {/* Info */}
              <div>
                <div style={{ background: '#1351B4' }} className="px-4 py-3">
                  <h3 className="text-white font-bold text-[13px] uppercase tracking-wider">Informações Importantes</h3>
                </div>
                <div style={{ border: '1px solid #e0e0e0', borderTop: 'none' }} className="p-4 bg-white">
                  {[
                    'A TFF é cobrada anualmente de toda empresa com linha telefônica ativa.',
                    'O não pagamento implica suspensão do serviço e inscrição em dívida ativa.',
                    'O pagamento via PIX tem aprovação em minutos.',
                  ].map((t, i) => (
                    <p key={i} className="flex items-start gap-2 text-[12px] text-gray-600 mb-3 last:mb-0">
                      <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full bg-[#1351B4] text-white font-bold text-[10px] mt-0.5">{i + 1}</span>
                      {t}
                    </p>
                  ))}
                </div>
              </div>

              {/* Forma de pagamento */}
              <div>
                <div style={{ background: '#1351B4' }} className="px-4 py-3">
                  <h3 className="text-white font-bold text-[13px] uppercase tracking-wider">Forma de Pagamento</h3>
                </div>
                <div style={{ border: '1px solid #e0e0e0', borderTop: 'none' }} className="p-4 bg-white">
                  <div style={{ border: '2px solid #32BCAD', background: '#f0fdfb' }} className="flex items-center gap-3 p-3 rounded">
                    <div style={{ background: '#32BCAD', borderRadius: 4 }} className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-black text-[11px]">PIX</span>
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-gray-700">Pagamento via PIX</p>
                      <p className="text-[11px] text-gray-500">Aprovação em minutos</p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Barra CTA fixa */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '2px solid #1351B4', zIndex: 50, boxShadow: '0 -2px 10px rgba(0,0,0,0.1)' }}>
        <div className="max-w-[1280px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="hidden sm:block">
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">Total a regularizar</p>
            <p className="font-black text-[22px] text-red-600">{fmt(taxas?.total)}</p>
          </div>
          <button
            data-testid="btn-regularizar"
            onClick={() => navigate('/anatel/pagamento', { state: { dadosEmpresa: empresa, taxas } })}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-white font-black text-[15px] px-8 py-3.5 cursor-pointer hover:opacity-90 transition-opacity"
            style={{ background: '#1351B4' }}
          >
            Regularizar Débito
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <AnatelFooter />
    </div>
  );
}
