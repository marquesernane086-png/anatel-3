import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import AnatelHeader from '@/components/AnatelHeader';
import AnatelFooter from '@/components/AnatelFooter';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtCPF = (c) => {
  if (!c) return 'N/A';
  const n = c.replace(/\D/g, '');
  return n.length === 11 ? n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : c;
};

export default function AnatelDebitosPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [taxas, setTaxas] = useState(null);
  const [loading, setLoading] = useState(true);
  const pessoa = location.state?.dadosPessoa;

  useEffect(() => {
    if (!pessoa) { toast.error('Dados não encontrados'); navigate('/anatel'); return; }
    axios.get(`${API}/anatel/taxas/${pessoa.cpf?.replace(/\D/g, '') || ''}`)
      .then(r => setTaxas(r.data))
      .catch(() => toast.error('Erro ao carregar débitos'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'Open Sans','Segoe UI',system-ui,sans-serif" }}>
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
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'Open Sans','Segoe UI',system-ui,sans-serif" }}>
      <AnatelHeader breadcrumb="Débitos FISTEL" />

      {/* Hero com Logo ANATEL */}
      <div style={{ background: '#071D41' }} className="py-6 px-4">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-center gap-6">
          <img 
            src="https://customer-assets.emergentagent.com/job_lead-conversion-9/artifacts/ktf9iqob_pngwing.com.png"
            alt="ANATEL"
            className="w-24 md:w-32 h-auto"
          />
          <div className="text-center md:text-left">
            <p style={{ color: '#FFCD07' }} className="text-[11px] font-bold uppercase tracking-widest mb-1">FISTEL Online</p>
            <h1 className="text-white font-bold text-xl md:text-2xl">Débitos FISTEL — Taxa de Funcionamento</h1>
          </div>
        </div>
      </div>

      <main className="flex-1 py-8 pb-32">
        <div className="max-w-[900px] mx-auto px-4">
          <div className="space-y-4">

            {/* Card Dados do Contribuinte */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-[#1351B4] px-5 py-3">
                <h3 className="text-white font-semibold text-sm uppercase tracking-wide">Dados do Contribuinte</h3>
              </div>
              <div className="p-5">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start py-2 border-b border-gray-100">
                      <span className="text-gray-600 text-sm uppercase">Nome</span>
                      <span className="text-[#071D41] font-semibold text-right max-w-[60%]">{pessoa?.nome || 'N/A'}</span>
                    </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 text-sm uppercase">CPF</span>
                    <span className="text-[#071D41] font-semibold">{fmtCPF(pessoa?.cpf)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 text-sm uppercase">Serviço</span>
                    <span className="text-[#071D41] font-semibold">STMC - Serviço Telefônico Móvel Comutado</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 text-sm uppercase">Situação</span>
                    <span className="text-red-600 font-bold">IRREGULAR</span>
                  </div>
                  {pessoa?.telefone && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 text-sm uppercase">Telefone Vinculado</span>
                      <span className="text-[#1351B4] font-bold">{pessoa.telefone}</span>
                    </div>
                  )}
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
                    <span className="text-gray-600 text-sm uppercase">Tipo</span>
                    <span className="text-[#071D41] font-semibold">TFF - Taxa de Fiscalização de Funcionamento</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 text-sm uppercase">Exercício</span>
                    <span className="text-[#071D41] font-semibold">2025</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 text-sm uppercase">Principal</span>
                    <span className="text-[#071D41] font-semibold">{fmt(taxas?.taxas?.[0]?.principal || 5.00)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 text-sm uppercase">Multa e Acréscimos</span>
                    <span className="text-red-600 font-bold">+ {fmt(taxas?.taxas?.[0]?.acrescimos || 11.48)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-red-50 rounded-lg px-4 mt-2">
                    <span className="text-red-700 font-bold uppercase">Total a Regularizar</span>
                    <span className="text-red-600 font-black text-2xl">{fmt(taxas?.taxas?.[0]?.total_item)}</span>
                  </div>
                </div>
              </div>
            </div>

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

          </div>
        </div>
      </main>

      {/* Barra CTA fixa */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '2px solid #1351B4', zIndex: 50, boxShadow: '0 -2px 10px rgba(0,0,0,0.1)' }}>
        <div className="max-w-[1280px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="hidden sm:block">
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">Total a regularizar</p>
            <p className="font-black text-[22px] text-red-600">{fmt(taxas?.taxas?.[0]?.total_item)}</p>
          </div>
          <button
            data-testid="btn-regularizar"
            onClick={() => {
              // Passar apenas a primeira taxa (TFF) para pagamento
              const primeiraTaxa = taxas?.taxas?.[0];
              const taxasTFF = {
                ...taxas,
                total: primeiraTaxa?.total_item || taxas?.total,
                taxas: [primeiraTaxa]
              };
              navigate('/anatel/pagamento', { state: { dadosPessoa: pessoa, taxas: taxasTFF } });
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-white font-black text-[15px] px-8 py-3.5 cursor-pointer hover:opacity-90 transition-opacity"
            style={{ background: '#00A859' }}
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
