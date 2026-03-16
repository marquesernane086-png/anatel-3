import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import AnatelHeader from '@/components/AnatelHeader';
import AnatelFooter from '@/components/AnatelFooter';
import { AlertTriangle, Building2, Search, Radio, FileText, Phone, ChevronRight } from 'lucide-react';
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
      toast.error('Digite um CNPJ válido');
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
    setCnpj(e.target.value);
  };

  const verTaxas = () => {
    if (dadosEmpresa) {
      navigate('/anatel/debitos', { state: { dadosEmpresa } });
    }
  };

  const novaConsulta = () => {
    setCnpj('');
    setDadosEmpresa(null);
    setShowResult(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4f8]">
      <AnatelHeader />

      <main className="flex-1">
        {/* Hero */}
        <div className="w-full bg-gradient-to-br from-[#071D41] to-[#1351b4] py-10 px-4">
          <div className="max-w-lg mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-4">
              <Radio className="w-4 h-4" />
              <span className="text-sm font-medium">FISTEL Online</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">
              Consulta de Débitos FISTEL
            </h1>
            <p className="text-blue-100 text-sm">
              Taxa de Fiscalização de Funcionamento
            </p>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 -mt-6">
          {/* Card de Consulta */}
          {!showResult ? (
            <Card className="bg-white border-0 shadow-lg">
              <CardContent className="p-5">
                <label className="block text-sm font-medium text-[#071D41] mb-2">
                  CNPJ
                </label>
                <Input
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={handleInputChange}
                  className="mb-4 h-12 text-base border-gray-300 focus:border-[#1351b4] focus:ring-[#1351b4]"
                  onKeyPress={(e) => e.key === 'Enter' && consultarCNPJ()}
                />
                <Button
                  onClick={consultarCNPJ}
                  disabled={loading}
                  className="w-full bg-[#1351b4] hover:bg-[#0c3d91] text-white font-semibold h-12 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Consultando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      Consultar FISTEL
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Resultado da Consulta */
            <Card className="bg-white border-0 shadow-lg">
              <CardContent className="p-5">
                {/* Empresa */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#1351b4] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-0.5">Empresa</p>
                    <p className="font-bold text-[#071D41] text-sm uppercase truncate">
                      {dadosEmpresa?.nome || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* CNPJ */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">CNPJ</p>
                    <p className="font-bold text-[#071D41] text-sm">
                      {dadosEmpresa?.cnpj ? formatarCNPJ(dadosEmpresa.cnpj) : cnpj}
                    </p>
                  </div>
                </div>

                {/* Telefone vinculado */}
                {dadosEmpresa?.telefone && (
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Linha vinculada</p>
                      <p className="font-bold text-[#071D41] text-sm">{dadosEmpresa.telefone}</p>
                    </div>
                  </div>
                )}

                {/* Alerta de Débitos */}
                <div className="bg-[#fef3cd] border border-[#ffc107] rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[#856404]" />
                    <span className="text-sm font-semibold text-[#856404]">
                      Débitos FISTEL identificados
                    </span>
                  </div>
                </div>

                {/* Botões */}
                <Button
                  onClick={verTaxas}
                  className="w-full bg-[#1351b4] hover:bg-[#0c3d91] text-white font-semibold h-12 mb-3 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    Ver Débitos
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </Button>

                <button
                  onClick={novaConsulta}
                  className="w-full text-[#1351b4] text-sm font-medium hover:underline cursor-pointer"
                >
                  Nova consulta
                </button>
              </CardContent>
            </Card>
          )}

          {/* Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Toda empresa com linha telefônica ativa vinculada ao CNPJ está sujeita ao pagamento da TFF.
            </p>
          </div>
        </div>
      </main>

      <AnatelFooter />
    </div>
  );
};

export default AnatelHomePage;
