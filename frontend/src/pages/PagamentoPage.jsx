import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { QRCode } from 'react-qrcode-logo';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GovBrHeader from '@/components/GovBrHeader';
import GovBrFooter from '@/components/GovBrFooter';
import { Copy, CheckCircle2, Clock, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PagamentoPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dadosEmpresa, setDadosEmpresa] = useState(null);
  const [debitos, setDebitos] = useState(null);
  const [pagamento, setPagamento] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const dados = location.state?.dadosEmpresa;
    const debitosData = location.state?.debitos;
    
    if (!dados || !debitosData) {
      toast.error('Dados não encontrados');
      navigate('/');
      return;
    }
    
    setDadosEmpresa(dados);
    setDebitos(debitosData);
    
    // Gerar PIX automaticamente
    gerarPix(dados, debitosData);
  }, [location, navigate]);

  const gerarPix = async (empresa, debitosData) => {
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/pagamento/pix`, {
        cnpj: empresa.cnpj,
        nome: empresa.nome,
        email: 'contato@mei.com',
        valor: debitosData.total
      });
      
      setPagamento(response.data);
      toast.success('QR Code PIX gerado com sucesso!');
      
      // Iniciar monitoramento de status
      iniciarMonitoramento(response.data.id);
    } catch (error) {
      console.error('Erro ao gerar PIX:', error);
      toast.error('Erro ao gerar PIX. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const iniciarMonitoramento = (transactionId) => {
    // Verificar status a cada 10 segundos
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API}/pagamento/status/${transactionId}`);
        const status = response.data.status;
        
        if (status === 'paid' || status === 'approved' || status === 'CONFIRMED') {
          clearInterval(interval);
          toast.success('Pagamento confirmado!');
          setTimeout(() => {
            navigate('/confirmacao', { 
              state: { 
                valor: debitos.total,
                cnpj: dadosEmpresa.cnpj 
              } 
            });
          }, 1500);
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    }, 10000);
    
    // Limpar interval após 30 minutos
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
      <div className="min-h-screen flex flex-col bg-white">
        <GovBrHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Gerando PIX...</p>
            <p className="text-sm text-gray-500 mt-2">Aguarde alguns segundos</p>
          </div>
        </div>
        <GovBrFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <GovBrHeader />
      
      <main className="flex-1 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-8">
          
          {/* Card Principal - QR Code PIX */}
          <Card className="border-green-200 bg-white shadow-xl mb-6">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
              <CardTitle className="flex items-center justify-center gap-2 text-green-700 text-xl">
                <Smartphone className="w-6 h-6" />
                Pagamento via PIX
              </CardTitle>
              <p className="text-center text-sm text-gray-600 mt-2">
                Escaneie o QR Code ou use o copia e cola para pagar
              </p>
            </CardHeader>
            
            <CardContent className="pt-6 space-y-6">
              {/* Valor */}
              <div className="text-center bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Valor a pagar</p>
                <p className="text-3xl font-black text-gray-900">
                  {formatarValor(pagamento.valor)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Via {pagamento.gateway.toUpperCase()}
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center py-4">
                <div className="p-6 bg-white rounded-xl border-2 border-gray-200 shadow-lg">
                  <QRCode
                    value={pagamento.qr_code}
                    size={280}
                    qrStyle="dots"
                    eyeRadius={10}
                  />
                </div>
              </div>
                  />
                </div>
              </div>

              {/* Copia e Cola */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase text-center">
                  PIX Copia e Cola
                </p>
                <div className="flex gap-2">
                  <input
                    data-testid="pix-code-input"
                    type="text"
                    readOnly
                    value={pagamento.qr_code}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-xs text-gray-600 bg-gray-50 focus:outline-none font-mono"
                  />
                  <Button
                    data-testid="copy-pix-btn"
                    onClick={copiarPixCode}
                    className={`px-6 ${
                      copiado 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-[#0c326f] hover:bg-[#06214d]'
                    } transition-all`}
                    title="Copiar"
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
                  <strong>Como pagar:</strong>
                  <ol className="mt-2 space-y-1 ml-4">
                    <li>1. Abra o app do seu banco</li>
                    <li>2. Escolha "Pagar com PIX"</li>
                    <li>3. Escaneie o QR Code ou cole o código</li>
                    <li>4. Confirme o pagamento</li>
                  </ol>
                </AlertDescription>
              </Alert>

              {/* Status Aguardando */}
              <Alert className="border-yellow-200 bg-yellow-50">
                <Clock className="h-5 w-5 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <p className="font-bold mb-1">Aguardando pagamento...</p>
                  <p className="text-sm">Após pagar, a baixa será automática em até 30 minutos.</p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Botão Voltar */}
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="w-full"
          >
            Voltar
          </Button>
        </div>
      </main>
      
      <GovBrFooter />
    </div>
  );
};

export default PagamentoPage;
