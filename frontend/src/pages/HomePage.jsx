import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import GovBrHeader from '@/components/GovBrHeader';
import GovBrFooter from '@/components/GovBrFooter';
import { AlertTriangle, Building2, FileText, Search } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [dadosEmpresa, setDadosEmpresa] = useState(null);
  const [showDebitos, setShowDebitos] = useState(false);
  const navigate = useNavigate();

  // Verificar se tem CNPJ na URL (query string ?cnpj=)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const cnpjUrl = urlParams.get('cnpj');
    if (cnpjUrl) {
      setCnpj(cnpjUrl);
      consultarCNPJ(cnpjUrl);
    }
    // eslint-disable-next-line
  }, []);

  const consultarCNPJ = async (cnpjConsulta) => {
    const cnpjLimpo = cnpjConsulta || cnpj;
    
    if (!cnpjLimpo) {
      toast.error('Por favor, digite um CNPJ');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/cnpj/consultar`, {
        cnpj: cnpjLimpo
      });
      
      setDadosEmpresa(response.data);
      setShowDebitos(true);
    } catch (error) {
      console.error('Erro ao consultar CNPJ:', error);
      toast.error('Erro ao consultar CNPJ. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatarCNPJ = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    return numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const handleInputChange = (e) => {
    const valor = e.target.value;
    setCnpj(valor);
  };

  const verDebitos = () => {
    if (dadosEmpresa) {
      navigate('/debitos', { state: { dadosEmpresa } });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <GovBrHeader />
      
      <main className="flex-1">
        {/* Hero Banner */}
        <div className="w-full bg-white mb-8 mt-6">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
            <div className="relative w-full rounded-lg overflow-hidden shadow-lg">
              <img
                src="https://www.gov.br/receitafederal/pt-br/assuntos/noticias/carrossel/esta-no-ar-a-nova-versao-do-sistema-de-procuracoes-eletronicas/@@images/e83c8a0b-004f-401e-aad8-c38ba2fdd89b.png"
                className="w-full h-auto object-cover"
                alt="Receita Federal"
              />
            </div>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 md:px-8 pb-8">
          <div className="max-w-2xl mx-auto space-y-6">
            
            {!showDebitos ? (
              // Formulário de Consulta CNPJ
              <Card className="border-blue-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                  <CardTitle className="flex items-center gap-2 text-[#0c326f]">
                    <Search className="w-6 h-6" />
                    Consultar Situação do MEI
                  </CardTitle>
                  <CardDescription>
                    Digite o CNPJ para verificar débitos pendentes
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CNPJ
                      </label>
                      <Input
                        data-testid="cnpj-input"
                        type="text"
                        placeholder="00.000.000/0000-00"
                        value={cnpj}
                        onChange={handleInputChange}
                        className="text-lg"
                        maxLength={18}
                      />
                    </div>
                    
                    <Button
                      data-testid="consultar-btn"
                      onClick={() => consultarCNPJ(cnpj)}
                      disabled={loading || !cnpj}
                      className="w-full bg-[#0c326f] hover:bg-[#06214d] text-white font-semibold py-6 text-lg"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Consultando...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Search className="w-5 h-5" />
                          Consultar CNPJ
                        </span>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Resultado da Consulta
              <div className="space-y-6">
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <AlertDescription className="text-red-800 font-semibold">
                    Seu MEI está INATIVO!
                  </AlertDescription>
                </Alert>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#0c326f]">
                      <Building2 className="w-5 h-5" />
                      Dados da Empresa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium text-gray-600">CNPJ:</span>
                      <span className="font-semibold text-gray-900">
                        {dadosEmpresa?.cnpj ? formatarCNPJ(dadosEmpresa.cnpj) : cnpj}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium text-gray-600">Razão Social:</span>
                      <span className="font-semibold text-gray-900 uppercase">
                        {dadosEmpresa?.nome || 'Empresa MEI'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="font-medium text-gray-600">Situação:</span>
                      <span className="font-semibold text-red-600">
                        {dadosEmpresa?.situacao || 'INATIVA'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-orange-600 mt-1" />
                      <div className="text-sm text-orange-900 leading-relaxed">
                        <p className="mb-3">
                          Foi identificado que o CNPJ <strong>{dadosEmpresa?.cnpj ? formatarCNPJ(dadosEmpresa.cnpj) : cnpj}</strong> possui débitos em aberto referentes ao pagamento do DAS.
                        </p>
                        <p className="mb-3">
                          A falta de regularização pode gerar <strong>multas</strong>, <strong>inscrição em dívida ativa</strong> e o <strong>cancelamento do registro MEI</strong>, com perda de todos os benefícios vinculados.
                        </p>
                        <p className="font-semibold">
                          Regularize sua situação para manter sua empresa ativa.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  data-testid="ver-debitos-btn"
                  onClick={verDebitos}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg"
                  style={{ backgroundColor: 'rgb(124, 179, 66)' }}
                >
                  Ver meus débitos
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <GovBrFooter />
    </div>
  );
};

export default HomePage;
