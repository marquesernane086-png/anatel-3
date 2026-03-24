import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AnatelHeader from '@/components/AnatelHeader';
import AnatelFooter from '@/components/AnatelFooter';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/* ─────────────── helpers ─────────────── */
const formatCPF = (v) => {
  const n = v.replace(/\D/g, '');
  return n.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

/* ─────────────── component ─────────────── */
export default function AnatelHomePage() {
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [pessoa, setPessoa] = useState(null);
  const navigate = useNavigate();

  const consultar = async () => {
    const limpo = cpf.replace(/\D/g, '');
    if (!limpo || limpo.length !== 11) { toast.error('Digite um CPF válido (11 dígitos)'); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/cpf/consultar`, { cpf: limpo });
      setPessoa(data);
    } catch {
      toast.error('Erro ao consultar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'Open Sans', 'Segoe UI', system-ui, sans-serif" }}>
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

              {!pessoa ? (
                /* ── Card de consulta ── */
                <div className="border border-gray-200 bg-white p-6">
                  <p className="text-gray-600 text-[14px] mb-5 leading-relaxed">
                    Informe o CPF do contribuinte para verificar a existência de débitos na
                    <strong className="text-[#1351B4]"> Taxa de Fiscalização de Funcionamento (TFF)</strong> do FISTEL.
                  </p>

                  <div className="mb-4">
                    <label className="block text-[13px] font-bold text-[#333] mb-1.5" htmlFor="cpf-input">
                      CPF do Contribuinte *
                    </label>
                    <input
                      id="cpf-input"
                      data-testid="cpf-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={14}
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={e => setCpf(formatCPF(e.target.value))}
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
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-[#1351B4] px-5 py-3">
                      <h3 className="text-white font-semibold text-sm uppercase tracking-wide">Dados do Contribuinte</h3>
                    </div>
                    <div className="p-5">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 text-sm uppercase">CPF</span>
                          <span className="text-[#071D41] font-semibold">{formatCPF(cpf)}</span>
                        </div>
                        <div className="flex justify-between items-start py-2 border-b border-gray-100">
                          <span className="text-gray-600 text-sm uppercase">Nome</span>
                          <span className="text-[#071D41] font-semibold text-right max-w-[60%]">{pessoa.nome || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-start py-2 border-b border-gray-100">
                          <span className="text-gray-600 text-sm uppercase">Serviço</span>
                          <span className="text-[#071D41] font-semibold text-right">STMC - Serviço Telefônico Móvel Comutado</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600 text-sm uppercase">Nº Estações</span>
                          <span className="text-[#071D41] font-semibold">1</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Taxa em Aberto */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-red-600 px-5 py-3">
                      <h3 className="text-white font-semibold text-sm uppercase tracking-wide">Taxa em Aberto</h3>
                    </div>
                    <div className="p-5">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 text-sm">Tipo</span>
                          <span className="text-[#071D41] font-semibold">TFF - Taxa de Fiscalização de Funcionamento</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 text-sm">Exercício</span>
                          <span className="text-[#071D41] font-semibold">2025</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600 text-sm">Situação</span>
                          <span className="text-red-600 font-bold">IRREGULAR - Débito em Aberto</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Telefone Móvel Vinculado */}
                  {pessoa.telefone && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <div className="bg-[#1351B4] px-5 py-3">
                        <h3 className="text-white font-semibold text-sm uppercase tracking-wide">Telefone Móvel Vinculado</h3>
                      </div>
                      <div className="p-5">
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600 text-sm">Número</span>
                          <span className="text-[#1351B4] font-bold text-lg">{pessoa.telefone}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Alerta */}
                  <div style={{ background: '#fff3cd', borderLeft: '4px solid #ffc107' }} className="p-4 flex items-start gap-3 mb-24">
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

                  {/* Botão Fixo */}
                  <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
                    <div className="max-w-3xl mx-auto px-4 py-4">
                      <button
                        data-testid="btn-ver-debitos"
                        onClick={() => navigate('/anatel/debitos', { state: { dadosPessoa: pessoa } })}
                        className="w-full flex items-center justify-center gap-3 text-white font-bold text-lg px-8 py-4 cursor-pointer transition-colors hover:opacity-90 rounded-lg"
                        style={{ background: '#00A859' }}
                      >
                        Ver Débitos e Regularizar
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
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
                    'A Taxa de Fiscalização de Funcionamento (TFF) é cobrada anualmente de todo contribuinte com linha ativa.',
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
