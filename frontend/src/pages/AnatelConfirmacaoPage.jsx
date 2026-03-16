import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AnatelHeader from '@/components/AnatelHeader';
import AnatelFooter from '@/components/AnatelFooter';
import { CheckCircle2, Radio, Download, Calendar, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AnatelConfirmacaoPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const valor = location.state?.valor || 0;
  const cnpj = location.state?.cnpj || '';
  const dadosEmpresa = location.state?.dadosEmpresa || null;
  const cpfUtilizado = location.state?.cpfUtilizado || null;
  
  const [mostrarOpcao2026, setMostrarOpcao2026] = useState(true);
  const [loading2026, setLoading2026] = useState(false);

  // Valor da taxa 2026 (sem multa)
  const valorTaxa2026 = 57.38;

  const formatarValor = (v) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(v);
  };

  const formatarCNPJ = (c) => {
    const numeros = c.replace(/\D/g, '');
    return numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const regularizar2026 = async () => {
    setLoading2026(true);
    
    try {
      // Navegar para página de pagamento com dados de 2026 e CPF anterior
      navigate('/anatel/pagamento', {
        state: {
          dadosEmpresa: dadosEmpresa || { cnpj, nome: 'Cliente' },
          taxas: {
            total: valorTaxa2026,
            taxas: [{
              tipo: "TFF – Taxa de Fiscalização de Funcionamento",
              periodo: "Exercício 2026",
              principal: valorTaxa2026,
              acrescimos: 0,
              total_item: valorTaxa2026
            }]
          },
          exercicio2026: true,
          cpfAnterior: cpfUtilizado  // Passar CPF do primeiro pagamento
        }
      });
    } catch (error) {
      console.error('Erro ao gerar PIX 2026:', error);
      toast.error('Erro ao gerar pagamento. Tente novamente.');
    } finally {
      setLoading2026(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F8F8]">
      <AnatelHeader />

      <main className="flex-1 py-12">
        <div className="max-w-xl mx-auto px-4 sm:px-6">

          {/* Ícone de Sucesso */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
              Pagamento Confirmado!
            </h1>
            <p className="text-gray-600 text-sm">
              Seu débito FISTEL foi regularizado com sucesso junto à Anatel
            </p>
          </div>

          {/* Recibo */}
          <Card className="border border-gray-200 bg-white shadow-lg mb-6">
            <CardHeader className="bg-[#003580] rounded-t-lg text-white py-4">
              <CardTitle className="flex items-center justify-center gap-2 text-base">
                <Radio className="w-5 h-5" />
                Comprovante de Regularização FISTEL
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Órgão:</span>
                  <span className="font-bold text-gray-900">ANATEL</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Tipo de Taxa:</span>
                  <span className="font-bold text-gray-900">TFF – Taxa de Fiscalização de Funcionamento</span>
                </div>
                {cnpj && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">CNPJ:</span>
                    <span className="font-bold text-gray-900">{formatarCNPJ(cnpj)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Exercício:</span>
                  <span className="font-bold text-gray-900">2025</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Valor pago:</span>
                  <span className="font-black text-green-700 text-lg">{formatarValor(valor)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Forma de pagamento:</span>
                  <span className="font-bold text-gray-900">PIX</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Data/Hora:</span>
                  <span className="font-bold text-gray-900">{dataHoje}</span>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                <CheckCircle2 className="w-4 h-4 inline mr-2" />
                <strong>Situação:</strong> Débito FISTEL regularizado. A baixa no sistema Anatel será processada em até 2 horas úteis.
              </div>
            </CardContent>
          </Card>

          {/* Card de Regularização 2026 */}
          {mostrarOpcao2026 && (
            <Card className="border-2 border-orange-400 bg-orange-50 shadow-lg mb-6">
              <CardHeader className="bg-orange-500 rounded-t-lg text-white py-4">
                <CardTitle className="flex items-center justify-center gap-2 text-base">
                  <Calendar className="w-5 h-5" />
                  Regularize o Exercício 2026
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <Alert className="border-orange-300 bg-orange-100">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <AlertDescription className="text-orange-900">
                    <p className="font-bold mb-1">Evite multas e juros!</p>
                    <p className="text-sm">Pague a TFF do exercício 2026 agora e economize 20% em acréscimos.</p>
                  </AlertDescription>
                </Alert>

                <div className="bg-white border border-orange-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-600">Taxa TFF 2026:</span>
                    <span className="font-black text-2xl text-orange-600">{formatarValor(valorTaxa2026)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    <span className="line-through text-red-400">Com atraso: {formatarValor(valorTaxa2026 * 1.20)}</span>
                    <span className="ml-2 text-green-600 font-bold">Você economiza: {formatarValor(valorTaxa2026 * 0.20)}</span>
                  </div>
                  
                  <Button
                    onClick={regularizar2026}
                    disabled={loading2026}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 cursor-pointer"
                  >
                    {loading2026 ? (
                      <span>Gerando pagamento...</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Pagar Taxa 2026 Agora
                      </span>
                    )}
                  </Button>
                </div>

                <button
                  onClick={() => setMostrarOpcao2026(false)}
                  className="w-full text-gray-500 text-xs hover:text-gray-700 hover:underline transition-colors cursor-pointer"
                >
                  Não, obrigado. Pagar depois.
                </button>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <div className="space-y-3">
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="w-full border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white transition-colors cursor-pointer flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Salvar comprovante
            </Button>

            <Button
              onClick={() => navigate('/anatel')}
              className="w-full text-white font-bold py-4 cursor-pointer"
              style={{ backgroundColor: '#003580' }}
            >
              <span className="flex items-center gap-2">
                <Radio className="w-5 h-5" />
                Voltar ao início
              </span>
            </Button>
          </div>

          {/* Nota de Rodapé */}
          <p className="text-center text-xs text-gray-400 mt-4">
            Em caso de dúvidas: Anatel 0800 728 9998 | www.gov.br/anatel
          </p>
        </div>
      </main>

      <AnatelFooter />
    </div>
  );
};

export default AnatelConfirmacaoPage;
