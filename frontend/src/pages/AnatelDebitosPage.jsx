import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AnatelHeader from '@/components/AnatelHeader';
import AnatelFooter from '@/components/AnatelFooter';
import {
  AlertTriangle, DollarSign, Calendar, CheckCircle2,
  XCircle, Shield, Clock, Radio, Building2, FileWarning,
  Info, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AnatelDebitosPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dadosEmpresa, setDadosEmpresa] = useState(null);
  const [taxas, setTaxas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetalhes, setShowDetalhes] = useState(false);

  useEffect(() => {
    const dados = location.state?.dadosEmpresa;

    if (!dados) {
      toast.error('Dados da empresa não encontrados');
      navigate('/anatel');
      return;
    }

    setDadosEmpresa(dados);
    carregarTaxas(dados.cnpj);
  }, [location, navigate]);

  const carregarTaxas = async (cnpj) => {
    try {
      const cnpjLimpo = cnpj.replace(/\D/g, '');
      const response = await axios.get(`${API}/anatel/taxas/${cnpjLimpo}`);
      setTaxas(response.data);
    } catch (error) {
      console.error('Erro ao carregar taxas ANATEL:', error);
      toast.error('Erro ao carregar taxas FISTEL');
    } finally {
      setLoading(false);
    }
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarCNPJ = (cnpj) => {
    const numeros = cnpj.replace(/\D/g, '');
    return numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const irParaPagamento = () => {
    navigate('/anatel/pagamento', {
      state: {
        dadosEmpresa,
        taxas
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8F8F8]">
        <AnatelHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003580] mx-auto mb-4"></div>
            <p className="text-gray-600">Consultando taxas FISTEL...</p>
            <p className="text-sm text-gray-500 mt-1">Aguarde enquanto verificamos seu débito</p>
          </div>
        </div>
        <AnatelFooter />
      </div>
    );
  }

  const totalDevido = taxas?.total || 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F8F8]">
      <AnatelHeader />

      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">

          {/* Título da Página */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#003580] flex items-center gap-2 mb-1">
              <Radio className="w-7 h-7" />
              Taxa de Fiscalização de Telecomunicações — FISTEL
            </h1>
            <p className="text-gray-600 text-sm">
              Consulta e regularização de débitos referentes à Taxa de Fiscalização de Funcionamento (TFF) e Taxa de Instalação de Funcionamento (TFI).
            </p>
          </div>

          {/* Alerta Principal */}
          <div className="space-y-4 mb-6">
            <Alert className="border-[#E52207] bg-red-50">
              <FileWarning className="h-5 w-5 text-[#E52207]" />
              <AlertDescription className="text-red-900 font-bold text-sm">
                ATENÇÃO: Débitos FISTEL em aberto podem resultar em <strong>cancelamento de licença</strong>,
                <strong> suspensão dos serviços de telecomunicações</strong> e inscrição em <strong>Dívida Ativa da União</strong>.
              </AlertDescription>
            </Alert>

            <Alert className="border-yellow-400 bg-yellow-50">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <AlertDescription className="text-yellow-900 font-semibold text-sm">
                Os valores incluem atualização monetária (SELIC), multa de 20% e juros de mora. Regularize o quanto antes para evitar acréscimos.
              </AlertDescription>
            </Alert>
          </div>

          {/* Dados da Empresa */}
          <Card className="mb-6 border border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-[#003580] text-base">
                <Building2 className="w-5 h-5" />
                Dados do Contribuinte
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-500 font-medium w-28 shrink-0">CNPJ:</span>
                  <span className="font-bold text-gray-900">
                    {dadosEmpresa?.cnpj ? formatarCNPJ(dadosEmpresa.cnpj) : '-'}
                  </span>
                </div>
                <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-500 font-medium w-28 shrink-0">Razão Social:</span>
                  <span className="font-bold text-gray-900 uppercase">
                    {dadosEmpresa?.nome || 'N/A'}
                  </span>
                </div>
                <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-500 font-medium w-28 shrink-0">Serviço:</span>
                  <span className="font-bold text-gray-900">
                    {taxas?.servico || 'SMP – Serviço Móvel Pessoal'}
                  </span>
                </div>
                <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-500 font-medium w-28 shrink-0">N° Estações:</span>
                  <span className="font-bold text-gray-900">
                    {taxas?.num_estacoes || 1}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo do Débito */}
          <Card className="mb-6 border-2 border-[#003580] bg-white shadow-md">
            <CardHeader className="bg-[#003580] rounded-t-lg pb-3">
              <CardTitle className="flex items-center gap-2 text-white text-base">
                <DollarSign className="w-5 h-5" />
                Resumo do Débito FISTEL
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Valor Total em Aberto</p>
                  <p className="text-4xl font-black text-gray-900">
                    {formatarValor(totalDevido)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Inclui principal + multa + juros + atualização SELIC
                  </p>
                </div>
                <div className="text-left md:text-right bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-600 font-bold uppercase tracking-wide mb-1">Situação</p>
                  <p className="text-lg font-black text-red-700 flex items-center gap-1">
                    <XCircle className="w-5 h-5" />
                    INADIMPLENTE
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    {taxas?.quantidade_anos || 1} ano(s) em atraso
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalhamento das Taxas */}
          <Card className="mb-6 border border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-0">
              <button
                onClick={() => setShowDetalhes(!showDetalhes)}
                className="w-full flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors rounded-lg p-2 -mx-2"
              >
                <CardTitle className="text-gray-900 text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#003580]" />
                  Detalhamento dos Débitos FISTEL
                </CardTitle>
                {showDetalhes ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              <CardDescription className="text-xs mt-1 px-2">
                {taxas?.taxas?.length || 0} lançamento(s) identificado(s) para regularização
              </CardDescription>
            </CardHeader>

            {showDetalhes && (
              <CardContent className="pt-4">
                {/* Cabeçalho da tabela */}
                <div className="hidden md:grid grid-cols-5 gap-2 text-xs font-bold text-gray-500 uppercase tracking-wide bg-gray-100 rounded-lg px-4 py-2 mb-2">
                  <span>Tipo de Taxa</span>
                  <span>Período</span>
                  <span className="text-right">Principal (R$)</span>
                  <span className="text-right">Acréscimos (R$)</span>
                  <span className="text-right">Total (R$)</span>
                </div>

                <div className="space-y-2">
                  {taxas?.taxas?.map((taxa, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-5 gap-2 border border-gray-200 rounded-lg px-4 py-3 hover:border-[#003580] hover:bg-blue-50/30 transition-all"
                    >
                      {/* Mobile label */}
                      <div className="md:hidden flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="font-bold text-gray-800 text-sm">{taxa.tipo}</span>
                        <span className="ml-auto bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded">EM ABERTO</span>
                      </div>

                      {/* Desktop: tipo */}
                      <div className="hidden md:flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="font-semibold text-gray-800 text-sm">{taxa.tipo}</span>
                      </div>

                      {/* Período */}
                      <div className="flex items-center gap-1 text-sm">
                        <span className="md:hidden text-gray-500 text-xs">Período: </span>
                        <span className="text-gray-700">{taxa.periodo}</span>
                      </div>

                      {/* Principal */}
                      <div className="flex items-center gap-1 text-sm md:justify-end">
                        <span className="md:hidden text-gray-500 text-xs">Principal: </span>
                        <span className="text-gray-900 font-medium">{formatarValor(taxa.principal)}</span>
                      </div>

                      {/* Acréscimos */}
                      <div className="flex items-center gap-1 text-sm md:justify-end">
                        <span className="md:hidden text-gray-500 text-xs">Acréscimos: </span>
                        <span className="text-red-600 font-medium">+{formatarValor(taxa.acrescimos)}</span>
                      </div>

                      {/* Total */}
                      <div className="flex items-center gap-1 text-sm md:justify-end">
                        <span className="md:hidden text-gray-500 text-xs">Total: </span>
                        <span className="text-gray-900 font-bold">{formatarValor(taxa.total_item)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rodapé tabela */}
                <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-semibold">Total Geral</span>
                  <span className="text-xl font-black text-[#003580]">{formatarValor(totalDevido)}</span>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Informativo sobre FISTEL */}
          <Card className="mb-6 border border-blue-200 bg-blue-50 shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-[#003580] shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-bold mb-2">Sobre o FISTEL – Fundo de Fiscalização das Telecomunicações</p>
                  <ul className="space-y-1 text-blue-800">
                    <li>• A <strong>TFF (Taxa de Fiscalização de Funcionamento)</strong> é cobrada anualmente de toda empresa que possui linha telefônica ativa vinculada ao seu CNPJ.</li>
                    <li>• O <strong>não pagamento</strong> implica em suspensão da linha, bloqueio do serviço e inscrição em dívida ativa.</li>
                    <li>• Base legal: <strong>Lei nº 9.472/1997</strong> (Lei Geral de Telecomunicações) e <strong>Lei nº 9.998/2000</strong> (FISTEL).</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prazo de Vencimento */}
          <Alert className="border-red-300 bg-red-50 mb-6">
            <Clock className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-900 font-bold text-sm">
              Prazo de regularização: <span className="text-red-700 font-extrabold">IMEDIATO</span> — Após o vencimento, o valor é corrigido diariamente pela SELIC e incorre multa de 20%.
            </AlertDescription>
          </Alert>

          {/* Consequências e Benefícios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="border-red-200 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-[#E52207] text-sm font-bold">
                  <AlertTriangle className="w-5 h-5" />
                  Consequências do Não Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span><strong>Multa de 20%</strong> sobre o valor principal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span><strong>Juros SELIC</strong> diários acumulados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span><strong>Suspensão</strong> da licença de telecomunicações</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span><strong>Inscrição</strong> em Dívida Ativa da União</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span><strong>Cassação</strong> da Autorização/Concessão</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-[#003580] bg-blue-50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-[#003580] text-sm font-bold">
                  <Shield className="w-5 h-5" />
                  Benefícios de Regularizar Agora
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-blue-900 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#003580] shrink-0 mt-0.5" />
                    <span>Manter a <strong>licença ativa</strong> e regularizada</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#003580] shrink-0 mt-0.5" />
                    <span><strong>Evitar acréscimo</strong> de multas e juros</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#003580] shrink-0 mt-0.5" />
                    <span>Participar de <strong>licitações e contratos</strong> públicos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#003580] shrink-0 mt-0.5" />
                    <span>Emitir <strong>Certidão Negativa</strong> de Débitos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#003580] shrink-0 mt-0.5" />
                    <span>Manter <strong>operações ininterruptas</strong></span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Formas de Pagamento */}
          <Card className="mb-6 border border-gray-200 bg-white shadow-sm">
            <CardContent className="pt-5">
              <p className="text-sm font-bold text-[#003580] mb-3">Formas de pagamento aceitas:</p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-bold text-green-700">PIX</span>
                  <span className="text-xs text-green-600">Instantâneo</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-bold text-gray-700">GRU</span>
                  <span className="text-xs text-gray-500">Guia de Recolhimento</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botão Regularizar */}
          <Button
            onClick={irParaPagamento}
            className="w-full text-white font-bold py-6 text-lg shadow-lg transition-all hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: '#003580' }}
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              Regularizar Taxa FISTEL agora
            </span>
          </Button>

          <p className="text-center text-xs text-gray-500 mt-3">
            Você será direcionado ao sistema de pagamento seguro da Anatel via PIX
          </p>
        </div>
      </main>

      <AnatelFooter />
    </div>
  );
};

export default AnatelDebitosPage;
