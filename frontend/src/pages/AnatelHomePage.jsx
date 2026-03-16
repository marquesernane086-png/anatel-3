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
                /* ── Resultado da consulta - Estilo Moderno ── */
                <div data-testid="resultado-consulta" className="space-y-6">
                  
                  {/* Card Principal da Empresa */}
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                    {/* Header com gradiente */}
                    <div style={{ background: 'linear-gradient(135deg, #071D41 0%, #1351B4 100%)' }} className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-[#FFCD07] text-[#071D41] text-[10px] font-black px-2 py-1 rounded uppercase">
                              Contribuinte Identificado
                            </span>
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase animate-pulse">
                              Irregular
                            </span>
                          </div>
                          <h2 className="text-white font-black text-2xl uppercase leading-tight mb-1">
                            {empresa.nome || 'N/A'}
                          </h2>
                          <p className="text-blue-200 text-sm">
                            Razão Social registrada na Receita Federal
                          </p>
                        </div>
                        <div className="hidden md:block">
                          <img 
                            src="https://customer-assets.emergentagent.com/job_lead-conversion-9/artifacts/ktf9iqob_pngwing.com.png"
                            alt="ANATEL"
                            className="w-16 h-auto opacity-80"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Informações detalhadas */}
                    <div className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">CNPJ</p>
                          <p className="text-[#071D41] font-bold text-sm">{cnpj || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Serviço</p>
                          <p className="text-[#071D41] font-bold text-sm">SME / FISTEL</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Situação</p>
                          <p className="text-red-600 font-black text-sm">IRREGULAR</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Exercício</p>
                          <p className="text-[#071D41] font-bold text-sm">2025</p>
                        </div>
                      </div>

                      {/* Telefone vinculado */}
                      {empresa.telefone && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                          <div className="bg-[#1351B4] rounded-full p-2">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-[11px] text-gray-500 uppercase tracking-wider font-bold">Linha Telefônica Vinculada</p>
                            <p className="text-[#1351B4] font-black text-lg">{empresa.telefone}</p>
                          </div>
                        </div>
                      )}

                      {/* Email se disponível */}
                      {empresa.email && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                          <div className="bg-gray-400 rounded-full p-2">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-[11px] text-gray-500 uppercase tracking-wider font-bold">Email de Contato</p>
                            <p className="text-gray-700 font-bold text-sm">{empresa.email}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card de Alerta - Débitos */}
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-lg p-5 shadow-md">
                    <div className="flex items-start gap-4">
                      <div className="bg-red-500 rounded-full p-3 flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-red-700 font-black text-lg mb-1">Débitos FISTEL Identificados</h3>
                        <p className="text-red-600 text-sm mb-3">
                          Este CNPJ possui taxas de fiscalização em aberto que precisam ser regularizadas.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-red-700">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Suspensão do serviço</span>
                          </div>
                          <div className="flex items-center gap-2 text-red-700">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Inscrição em dívida ativa</span>
                          </div>
                          <div className="flex items-center gap-2 text-red-700">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Multas e juros acumulados</span>
                          </div>
                          <div className="flex items-center gap-2 text-red-700">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Restrição cadastral</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card de Ação - Regularização */}
                  <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-green-100 rounded-full p-3">
                          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-[#071D41] font-black text-lg">Regularize Agora via PIX</h3>
                          <p className="text-gray-500 text-sm">Pagamento instantâneo • Baixa automática no sistema</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <button
                          data-testid="btn-ver-debitos"
                          onClick={() => navigate('/anatel/debitos', { state: { dadosEmpresa: empresa } })}
                          className="flex items-center justify-center gap-2 text-white font-black text-[15px] px-8 py-4 rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
                          style={{ background: 'linear-gradient(135deg, #1351B4 0%, #071D41 100%)' }}
                        >
                          Ver Débitos e Regularizar
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </button>
                        <button
                          onClick={() => { setCnpj(''); setEmpresa(null); }}
                          className="text-gray-500 font-medium text-sm hover:text-[#1351B4] cursor-pointer px-4 py-2 border border-gray-300 rounded-lg hover:border-[#1351B4] transition-colors"
                        >
                          Nova consulta
                        </button>
                      </div>
                    </div>
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
