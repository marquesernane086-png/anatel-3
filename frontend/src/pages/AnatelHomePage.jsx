import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AnatelHeader from '@/components/AnatelHeader';
import AnatelFooter from '@/components/AnatelFooter';
import {
  AlertTriangle, Building2, Search, Radio, FileText,
  Shield, CheckCircle2, Info
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AnatelHomePage = () => {
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [dadosEmpresa, setDadosEmpresa] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const navigate = useNavigate();

  const consultarCNPJ = async () => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');

    if (!cnpjLimpo || cnpjLimpo.length < 11) {
      toast.error('Por favor, digite um CNPJ válido');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/cnpj/consultar`, { cnpj: cnpjLimpo });
      setDadosEmpresa(response.data);
      setShowResult(true);
    } catch (error) {
      console.error('Erro ao consultar CNPJ:', error);
      toast.error('Erro ao consultar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatarCNPJ = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 11) {
      return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const handleInputChange = (e) => {
    const valor = e.target.value;
    setCnpj(valor);
  };

  const verTaxas = () => {
    if (dadosEmpresa) {
      navigate('/anatel/debitos', { state: { dadosEmpresa } });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F8F8]">
      <AnatelHeader />

      <main className="flex-1">
        {/* Hero Banner ANATEL */}
        <div className="w-full bg-[#003580] py-10 px-4 sm:px-8 mb-8">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-white">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-4">
                  <Radio className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm font-semibold text-yellow-100">Sistema FISTEL Online</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold mb-3 leading-tight">
                  Consulta e Regularização de Débitos FISTEL
                </h1>
                <p className="text-blue-100 text-sm md:text-base leading-relaxed mb-6">
                  Verifique a situação da sua empresa perante a Anatel. Consulte os débitos de 
                  Taxa de Fiscalização de Funcionamento (TFF) e regularize sua situação para 
                  manter sua licença de telecomunicações ativa.
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 text-green-300 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Consulta gratuita</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-300 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pagamento instantâneo via PIX</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-300 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Baixa automática em até 2h</span>
                  </div>
                </div>
              </div>

              {/* Card de Consulta no Hero */}
              <div className="w-full md:w-[420px] bg-white rounded-xl shadow-xl p-6">
                <h2 className="text-[#003580] font-bold text-lg mb-1 flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Consultar Situação FISTEL
                </h2>
                <p className="text-gray-500 text-sm mb-4">
                  Digite o CNPJ para verificar débitos pendentes
                </p>

                {!showResult ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">
                        CNPJ
                      </label>
                      <Input
                        type="text"
                        placeholder="00.000.000/0000-00"
                        value={cnpj}
                        onChange={handleInputChange}
                        className="text-base border-gray-300 focus:ring-[#003580] focus:border-[#003580]"
                        maxLength={18}
                        onKeyDown={(e) => e.key === 'Enter' && consultarCNPJ()}
                      />
                    </div>

                    <Button
                      onClick={consultarCNPJ}
                      disabled={loading || !cnpj}
                      className="w-full text-white font-bold py-5 text-base cursor-pointer"
                      style={{ backgroundColor: '#003580' }}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Consultando...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Search className="w-5 h-5" />
                          Consultar FISTEL
                        </span>
                      )}
                    </Button>

                    <p className="text-center text-xs text-gray-400">
                      Serviço gratuito e oficial da Anatel
                    </p>
                  </div>
                ) : (
                  // Resultado da Consulta
                  <div className="space-y-4">
                    <Alert className="border-red-300 bg-red-50 py-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800 font-bold text-sm">
                        Débitos FISTEL identificados!
                      </AlertDescription>
                    </Alert>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                      <div className="flex gap-2 mb-1">
                        <Building2 className="w-4 h-4 text-[#003580] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Empresa</p>
                          <p className="font-bold text-gray-900 uppercase text-xs">{dadosEmpresa?.nome || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <FileText className="w-4 h-4 text-[#003580] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">CNPJ</p>
                          <p className="font-bold text-gray-900 text-xs">
                            {dadosEmpresa?.cnpj ? formatarCNPJ(dadosEmpresa.cnpj) : cnpj}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-2">
                      Foram identificados débitos de <strong>Taxa FISTEL</strong> em aberto. Regularize para manter sua licença ativa.
                    </p>

                    <Button
                      onClick={verTaxas}
                      className="w-full text-white font-bold py-4 text-sm cursor-pointer"
                      style={{ backgroundColor: '#003580' }}
                    >
                      <span className="flex items-center gap-2">
                        <Radio className="w-5 h-5" />
                        Ver Débitos FISTEL
                      </span>
                    </Button>

                    <button
                      onClick={() => { setShowResult(false); setCnpj(''); setDadosEmpresa(null); }}
                      className="w-full text-gray-500 text-xs hover:text-gray-700 hover:underline transition-colors cursor-pointer"
                    >
                      Consultar outro CNPJ
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Seção Informativa */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pb-12">

          {/* Cards de Informação */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Radio className="w-5 h-5 text-[#003580]" />
                  </div>
                  <h3 className="font-bold text-gray-900">O que é o FISTEL?</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  O Fundo de Fiscalização das Telecomunicações (FISTEL) é um fundo especial que financia 
                  a regulação e fiscalização das telecomunicações no Brasil, gerido pela Anatel.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">Quem deve pagar?</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  <strong>Toda empresa</strong> que possui linha telefônica ativa 
                  (fixa ou móvel) vinculada ao seu CNPJ está sujeita ao pagamento da Taxa de 
                  Fiscalização de Funcionamento (TFF) referente ao serviço de telecomunicações.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">Como regularizar?</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Consulte o débito pelo CNPJ, verifique o detalhamento das taxas em aberto e 
                  efetue o pagamento via PIX de forma rápida e segura. A baixa é automática.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Aviso Legal */}
          <Alert className="border-gray-200 bg-white shadow-sm">
            <Info className="h-5 w-5 text-[#003580]" />
            <AlertDescription className="text-gray-700 text-xs">
              <strong>Aviso:</strong> Este sistema é destinado exclusivamente à consulta e regularização de débitos de Taxa de Fiscalização de Telecomunicações (FISTEL) perante a Anatel. 
              Para dúvidas, entre em contato com a central de atendimento Anatel: <strong>0800 728 9998</strong> (gratuito).
            </AlertDescription>
          </Alert>
        </div>
      </main>

      <AnatelFooter />
    </div>
  );
};

export default AnatelHomePage;
