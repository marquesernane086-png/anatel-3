import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { QRCode } from 'react-qrcode-logo';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AnatelHeader from '@/components/AnatelHeader';
import AnatelFooter from '@/components/AnatelFooter';
import { Copy, CheckCircle2, Clock, Smartphone, Radio, Shield } from 'lucide-react';
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
    // Evitar chamada duplicada com useRef (imediato, não causa re-render)
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
    gerarPix(dados, taxasData);
  }, []);

  const gerarPix = async (empresa, taxasData) => {
    setLoading(true);

    try {
      const response = await axios.post(`${API}/pagamento/pix`, {
        cnpj: empresa.cnpj,
        nome: empresa.nome,
        email: 'contato@empresa.com',
        valor: taxasData.total
      });

      setPagamento(response.data);
      toast.success('QR Code PIX gerado com sucesso!');
      iniciarMonitoramento(response.data.id);
    } catch (error) {
      console.error('Erro ao gerar PIX:', error);
      toast.error('Erro ao gerar PIX. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // APENAS PARA TESTES - Simular aprovação do PIX
  const simularAprovacao = async () => {
    if (!pagamento?.id) return;
    
    try {
      await axios.post(`${API}/pagamento/simular-aprovacao/${pagamento.id}`);
      toast.success('Pagamento simulado como aprovado!');
      
      // Redirecionar para confirmação
      setTimeout(() => {
        navigate('/anatel/confirmacao', {
          state: {
            valor: taxas.total,
            cnpj: dadosEmpresa.cnpj,
            dadosEmpresa: dadosEmpresa
          }
        });
      }, 1000);
    } catch (error) {
      console.error('Erro ao simular aprovação:', error);
      toast.error('Erro ao simular aprovação');
    }
  };

  const iniciarMonitoramento = (transactionId) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API}/pagamento/status/${transactionId}`);
        const status = response.data.status;

        if (status === 'paid' || status === 'approved' || status === 'CONFIRMED') {
          clearInterval(interval);
          toast.success('Pagamento confirmado!');
          setTimeout(() => {
            navigate('/anatel/confirmacao', {
              state: {
                valor: taxas.total,
                cnpj: dadosEmpresa.cnpj,
                dadosEmpresa: dadosEmpresa
              }
            });
          }, 1500);
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    }, 10000);

    setTimeout(() => clearInterval(interval), 30 * 60 * 1000);
  };

  const copiarPixCode = () => {
    if (pagamento?.qr_code) {
      navigator.clipboard.writeText(pagamento.qr_code);
      setCopiado(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  if (loading || !pagamento) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8F8F8]">
        <AnatelHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003580] mx-auto mb-4"></div>
            <p className="text-[#003580] font-semibold">Gerando pagamento FISTEL...</p>
            <p className="text-sm text-gray-500 mt-2">Aguarde enquanto preparamos seu QR Code PIX</p>
          </div>
        </div>
        <AnatelFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F8F8]">
      <AnatelHeader />

      <main className="flex-1 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-8">

          {/* Título */}
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-[#003580] flex items-center justify-center gap-2">
              <Radio className="w-6 h-6" />
              Pagamento da Taxa FISTEL
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Regularização via PIX — Baixa automática em até 2 horas
            </p>
          </div>

          {/* Card Principal PIX */}
          <Card className="border-[#003580] bg-white shadow-xl mb-6">
            <CardHeader className="bg-[#003580] rounded-t-lg">
              <CardTitle className="flex items-center justify-center gap-2 text-white text-lg">
                <Smartphone className="w-6 h-6" />
                Pagamento via PIX
              </CardTitle>
              <p className="text-center text-sm text-blue-200 mt-1">
                Escaneie o QR Code ou use o Pix Copia e Cola
              </p>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Valor */}
              <div className="text-center bg-[#F8F8F8] border border-[#003580] p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mb-1">Valor a pagar — Taxa FISTEL</p>
                <p className="text-4xl font-black text-[#003580]">
                  {formatarValor(pagamento.valor)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Referente à Taxa de Fiscalização de Funcionamento (TFF)
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center py-2">
                <div className="p-5 bg-white rounded-xl border-2 border-[#003580]/20 shadow-md">
                  <QRCode
                    value={pagamento.qr_code}
                    size={260}
                    qrStyle="dots"
                    eyeRadius={8}
                    fgColor="#003580"
                  />
                </div>
              </div>

              {/* Copia e Cola */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase text-center tracking-wide">
                  PIX Copia e Cola
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pagamento.qr_code}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-xs text-gray-600 bg-gray-50 focus:outline-none font-mono"
                  />
                  <Button
                    onClick={copiarPixCode}
                    className={`px-5 cursor-pointer transition-all ${
                      copiado
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-[#003580] hover:bg-[#002060]'
                    }`}
                    title="Copiar código PIX"
                  >
                    {copiado ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Instruções */}
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-900 text-sm">
                  <strong>Como pagar via PIX:</strong>
                  <ol className="mt-2 space-y-1 ml-4 list-decimal">
                    <li>Abra o aplicativo do seu banco</li>
                    <li>Acesse a opção <strong>"Pagar com PIX"</strong></li>
                    <li>Escaneie o QR Code <strong>ou</strong> cole o código copiado</li>
                    <li>Confirme os dados e efetue o pagamento</li>
                  </ol>
                </AlertDescription>
              </Alert>

              {/* Status Aguardando */}
              <Alert className="border-yellow-300 bg-yellow-50">
                <Clock className="h-5 w-5 text-yellow-600" />
                <AlertDescription className="text-yellow-900">
                  <p className="font-bold mb-1">Aguardando confirmação do pagamento...</p>
                  <p className="text-sm">A baixa do débito FISTEL será realizada automaticamente em até 2 horas após a confirmação do PIX.</p>
                </AlertDescription>
              </Alert>

              {/* Segurança */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield className="w-4 h-4 text-[#003580]" />
                <span>Pagamento seguro • Sistema oficial Anatel • Criptografia SSL</span>
              </div>
            </CardContent>
          </Card>

          {/* Botão Voltar */}
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="w-full border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white transition-colors cursor-pointer"
          >
            Voltar aos débitos
          </Button>
        </div>
      </main>

      <AnatelFooter />
    </div>
  );
};

export default AnatelPagamentoPage;
