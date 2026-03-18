import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AnatelHeader from '@/components/AnatelHeader';
import AnatelFooter from '@/components/AnatelFooter';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AnatelLinkPage() {
  const { cnpj } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const consultarCNPJ = async () => {
      if (!cnpj) {
        navigate('/anatel');
        return;
      }

      try {
        // Limpar CNPJ (remover pontuação se houver)
        const cnpjLimpo = cnpj.replace(/\D/g, '');
        
        console.log('[LINK] CNPJ da URL:', cnpjLimpo, '- Tamanho:', cnpjLimpo.length);

        // Se for CNPJ básico (8 dígitos), buscar na base de leads primeiro
        let cnpjCompleto = cnpjLimpo;
        
        if (cnpjLimpo.length === 8) {
          // Tentar buscar o CNPJ completo na base de leads
          try {
            const { data: leadData } = await axios.get(`${API}/leads/buscar/${cnpjLimpo}`);
            if (leadData && leadData.cnpj) {
              cnpjCompleto = leadData.cnpj.replace(/\D/g, '');
              console.log('[LINK] CNPJ encontrado na base de leads:', cnpjCompleto);
            } else {
              // Fallback: completar com 0001 + 00 (padrão matriz)
              cnpjCompleto = cnpjLimpo + '000100';
              console.log('[LINK] CNPJ completado (fallback):', cnpjCompleto);
            }
          } catch (e) {
            // Se não encontrar, usar padrão
            cnpjCompleto = cnpjLimpo + '000100';
            console.log('[LINK] CNPJ completado (fallback):', cnpjCompleto);
          }
        }

        console.log('[LINK] Consultando CNPJ final:', cnpjCompleto);

        // Consultar CNPJ
        const { data: empresaData } = await axios.post(`${API}/cnpj/consultar`, {
          cnpj: cnpjCompleto
        });

        console.log('[LINK] Dados da empresa:', empresaData);

        // Buscar taxas ANATEL
        const { data: taxasData } = await axios.get(`${API}/anatel/taxas/${cnpjCompleto}`);

        console.log('[LINK] Taxas:', taxasData);

        // Redirecionar para página de débitos com os dados
        navigate('/anatel/debitos', {
          state: {
            dadosEmpresa: empresaData,
            taxas: taxasData
          }
        });

      } catch (err) {
        console.error('[LINK] Erro:', err);
        setError('CNPJ não encontrado ou inválido');
        setLoading(false);
      }
    };

    consultarCNPJ();
  }, [cnpj, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'Open Sans','Segoe UI',system-ui,sans-serif" }}>
        <AnatelHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">CNPJ não encontrado</h1>
            <p className="text-gray-600 mb-6">O CNPJ informado não foi localizado em nossa base.</p>
            <button
              onClick={() => navigate('/anatel')}
              className="px-6 py-3 bg-[#1351B4] text-white font-bold rounded hover:bg-[#0c326f]"
            >
              Consultar outro CNPJ
            </button>
          </div>
        </main>
        <AnatelFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'Open Sans','Segoe UI',system-ui,sans-serif" }}>
      <AnatelHeader />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#1351B4] mx-auto mb-6"></div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Consultando CNPJ...</h1>
          <p className="text-gray-600">Aguarde enquanto verificamos os débitos FISTEL</p>
          <p className="text-sm text-gray-400 mt-4 font-mono">{cnpj}</p>
        </div>
      </main>
      <AnatelFooter />
    </div>
  );
}
