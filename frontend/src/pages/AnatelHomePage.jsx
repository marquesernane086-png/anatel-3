import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AnatelHeader from '@/components/AnatelHeader';
import AnatelFooter from '@/components/AnatelFooter';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/* ─────────────── helpers ─────────────── */
const formatCNPJ = (v) => {
  const n = v.replace(/\D/g, '');
  if (n.length <= 11) return n.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return n.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};

/* ─────────────── component ─────────────── */
export default function AnatelHomePage() {
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [empresa, setEmpresa] = useState(null);
  const navigate = useNavigate();

  const consultar = async () => {
    const limpo = cnpj.replace(/\D/g, '');
    if (!limpo || limpo.length < 11) { toast.error('Digite um CNPJ válido'); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/cnpj/consultar`, { cnpj: limpo });
      setEmpresa(data);
    } catch {
      toast.error('Erro ao consultar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'Rawline', 'Segoe UI', system-ui, sans-serif" }}>
      <AnatelHeader breadcrumb="Consulta FISTEL" />

      <main className="flex-1">

        {/* ── Hero com Logo ANATEL ── */}
        <div className="bg-[#071D41] py-8">
          <div className="max-w-[1280px] mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-6">
            <img 
              src="https://customer-assets.emergentagent.com/job_lead-conversion-9/artifacts/ktf9iqob_pngwing.com.png"
              alt="ANATEL"
              className="w-32 md:w-40 h-auto"
            />
            <div className="text-center md:text-left">
              <h1 className="text-white font-bold text-2xl md:text-3xl">Agência Nacional de Telecomunicações</h1>
              <p className="text-[#93c2f5] text-sm mt-2">Regularização de Taxas FISTEL</p>
            </div>
          </div>
        </div>

        {/* ── Seção principal ── */}
        <div className="max-w-[1280px] mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">

            {/* Coluna central: Formulário FISTEL */}
            <div>

              {/* Título da seção (estilo .cabecalho-linha) */}
              <div style={{ borderBottom: '3px solid #1351B4' }} className="mb-5 pb-2">
                <h2 className="text-[#1351B4] font-black text-[19px] uppercase tracking-wide">
                  Regularização FISTEL
                </h2>
              </div>

              {!empresa ? (
                /* ── Card de consulta ── */
                <div className="border border-gray-200 bg-white p-6">
                  <p className="text-gray-600 text-[14px] mb-5 leading-relaxed">
                    Informe o CNPJ da empresa para verificar a existência de débitos na
                    <strong className="text-[#1351B4]"> Taxa de Fiscalização de Funcionamento (TFF)</strong> do FISTEL.
                  </p>

                  <div className="mb-4">
                    <label className="block text-[13px] font-bold text-[#333] mb-1.5" htmlFor="cnpj-input">
                      CNPJ da Empresa *
                    </label>
                    <input
                      id="cnpj-input"
                      data-testid="cnpj-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={18}
                      placeholder="00.000.000/0000-00"
                      value={cnpj}
                      onChange={e => setCnpj(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && consultar()}
                      className="w-full border border-gray-400 px-3 py-2.5 text-[14px] outline-none focus:border-[#1351B4] focus:ring-2 focus:ring-[#1351B4]/20"
                      style={{ maxWidth: 400 }}
                    />
                  </div>

                  <button
                    data-testid="btn-consultar"
                    onClick={consultar}
                    disabled={loading}
                    className="inline-flex items-center gap-2 font-bold text-[14px] text-white px-6 py-2.5 transition-colors disabled:opacity-60 cursor-pointer"
                    style={{ background: loading ? '#6b9ed6' : '#1351B4' }}
                  >
                    {loading ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Consultando...</>
                    ) : (
                      <>Consultar FISTEL</>
                    )}
                  </button>
                </div>

              ) : (
                /* ── Resultado da consulta - Estilo Limpo ── */
                <div data-testid="resultado-consulta" className="space-y-4">
                  
                  {/* Card Dados do Contribuinte */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <svg className="w-6 h-6 text-[#1351B4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <h3 className="text-[#1351B4] font-bold text-lg italic">Dados do Contribuinte</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-gray-100">
                        <span className="text-gray-500 italic">CNPJ:</span>
                        <span className="text-[#071D41] font-bold text-lg">{cnpj}</span>
                      </div>
                      <div className="flex justify-between items-start py-3 border-b border-gray-100">
                        <span className="text-gray-500 italic">Razão Social:</span>
                        <span className="text-[#071D41] font-bold text-lg uppercase text-right max-w-[60%]">{empresa.nome || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-start py-3 border-b border-gray-100">
                        <span className="text-gray-500 italic">Serviço:</span>
                        <span className="text-[#071D41] font-bold text-right">STMC - Serviço Telefônico Móvel Comutado</span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <span className="text-gray-500 italic">Nº Estações:</span>
                        <span className="text-[#071D41] font-bold">1</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Taxa em Aberto */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-red-500 font-bold text-lg italic">Taxa em Aberto</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-gray-100">
                        <span className="text-gray-500 italic">Tipo:</span>
                        <span className="text-[#071D41] font-bold">TFF - Taxa de Fiscalização de Funcionamento</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-gray-100">
                        <span className="text-gray-500 italic">Exercício:</span>
                        <span className="text-[#071D41] font-bold">2025</span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <span className="text-gray-500 italic">Situação:</span>
                        <span className="text-red-600 font-bold">IRREGULAR - Débito em Aberto</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Telefone Móvel Vinculado */}
                  {empresa.telefone && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <svg className="w-6 h-6 text-[#1351B4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-[#1351B4] font-bold text-lg italic">Telefone Móvel Vinculado</h3>
                      </div>
                      
                      <div className="flex justify-between items-center py-3">
                        <span className="text-gray-500 italic">Número:</span>
                        <span className="text-[#1351B4] font-bold text-xl">{empresa.telefone}</span>
                      </div>
                    </div>
                  )}

                  {/* Alerta */}
                  <div style={{ background: '#fff3cd', borderLeft: '4px solid #ffc107' }} className="p-4 flex items-start gap-3">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#856404' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <div>
                      <p className="font-bold text-[13px]" style={{ color: '#856404' }}>Atenção: Débito pendente</p>
                      <p className="text-[12px]" style={{ color: '#856404' }}>
                        Regularize para evitar suspensão do serviço e inscrição em dívida ativa.
                      </p>
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      data-testid="btn-ver-debitos"
                      onClick={() => navigate('/anatel/debitos', { state: { dadosEmpresa: empresa } })}
                      className="flex items-center justify-center gap-2 text-white font-bold text-[14px] px-6 py-3 cursor-pointer transition-colors hover:opacity-90 rounded"
                      style={{ background: '#1351B4' }}
                    >
                      Ver Débitos e Regularizar
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => { setCnpj(''); setEmpresa(null); }}
                      className="text-[#1351B4] font-medium text-[13px] hover:underline cursor-pointer px-4 py-3"
                    >
                      Nova consulta
                    </button>
                  </div>
                </div>
              )}

              {/* ── Card informativo O que é FISTEL ── */}
              <div style={{ background: '#f4f4f4', border: '1px solid #e0e0e0' }} className="mt-6 p-5">
                <p style={{ color: '#1351B4' }} className="font-bold text-[13px] uppercase tracking-wider mb-3">
                  O que é o FISTEL?
                </p>
                <p className="text-gray-600 text-[13px] leading-relaxed mb-3">
                  O Fundo de Fiscalização das Telecomunicações (FISTEL) é um fundo contábil destinado ao financiamento
                  das atividades de fiscalização do setor de telecomunicações.
                </p>
                <ul className="space-y-2">
                  {[
                    'A Taxa de Fiscalização de Funcionamento (TFF) é cobrada anualmente de toda empresa com linha ativa.',
                    'O não pagamento implica suspensão do serviço e inscrição em dívida ativa.',
                    'O pagamento pode ser realizado via PIX com aprovação imediata.',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1351B4] mt-1.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AnatelFooter />
    </div>
  );
}
