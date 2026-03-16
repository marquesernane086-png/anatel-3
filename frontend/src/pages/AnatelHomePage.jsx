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
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Coluna esquerda + centro: Formulário FISTEL */}
            <div className="lg:col-span-2">

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
                /* ── Resultado da consulta ── */
                <div data-testid="resultado-consulta">
                  {/* Cabeçalho do contribuinte — estilo card azul */}
                  <div style={{ background: '#1351B4' }} className="p-5 mb-4">
                    <p className="text-[#FFCD07] text-[11px] font-bold uppercase tracking-widest mb-1">Contribuinte identificado</p>
                    <p className="text-white font-black text-[20px] uppercase leading-tight">{empresa.nome || 'N/A'}</p>
                    <p className="text-blue-200 text-[13px] mt-1">
                      CNPJ: {cnpj} &nbsp;|&nbsp; Serviço: SME
                    </p>
                  </div>

                  {/* Alerta de débito */}
                  <div style={{ background: '#fff3cd', border: '1px solid #ffc107' }} className="p-4 mb-4 flex items-start gap-3">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#856404' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <div>
                      <p className="font-bold text-[13px]" style={{ color: '#856404' }}>Débitos FISTEL identificados</p>
                      <p className="text-[12px]" style={{ color: '#856404' }}>
                        Este CNPJ possui taxas em aberto. Regularize para evitar suspensão do serviço e inscrição em dívida ativa.
                      </p>
                    </div>
                  </div>

                  {empresa.telefone && (
                    <div style={{ background: '#f4f4f4', border: '1px solid #e0e0e0' }} className="p-3 mb-5 flex items-center gap-2 text-[13px]">
                      <svg className="w-4 h-4 text-[#1351B4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-gray-600">Linha vinculada:</span>
                      <strong className="text-[#1351B4]">{empresa.telefone}</strong>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      data-testid="btn-ver-debitos"
                      onClick={() => navigate('/anatel/debitos', { state: { dadosEmpresa: empresa } })}
                      className="flex items-center justify-center gap-2 text-white font-bold text-[14px] px-6 py-3 cursor-pointer transition-colors hover:opacity-90"
                      style={{ background: '#1351B4' }}
                    >
                      Ver Débitos FISTEL
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
