import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AnatelHeader from '@/components/AnatelHeader';
import AnatelFooter from '@/components/AnatelFooter';
import { CheckCircle2, Radio, Download, Shield } from 'lucide-react';

const AnatelEmDiaPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Dados com fallback seguro
  const cnpj = location.state?.cnpj || '';
  const dadosEmpresa = location.state?.dadosEmpresa || { nome: 'Contribuinte', cnpj: cnpj };

  const formatarCNPJ = (c) => {
    if (!c) return 'N/A';
    const numeros = c.replace(/\D/g, '');
    if (numeros.length !== 14) return c;
    return numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4f8]">
      <AnatelHeader />

      <main className="flex-1 py-8">
        <div className="max-w-lg mx-auto px-4">

          {/* Selo de Sucesso */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#168821] rounded-full mb-4 shadow-lg">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#168821]">
              Empresa em Dia
            </h1>
            <p className="text-gray-600 mt-1">
              Situação fiscal regularizada junto à ANATEL
            </p>
          </div>

          {/* Certificado */}
          <Card className="bg-white border-0 shadow-lg mb-4 overflow-hidden">
            <div className="bg-gradient-to-r from-[#168821] to-[#1a9e28] px-4 py-4">
              <div className="flex items-center justify-center gap-2 text-white">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-bold">SITUAÇÃO FISCAL REGULAR</span>
              </div>
            </div>
            <CardContent className="p-5">
              
              {/* Badge de Quitação */}
              <div className="bg-[#e8f5e9] border border-[#168821] rounded-lg p-4 mb-5 text-center">
                <p className="text-[#168821] font-bold text-lg">
                  TFF 2025 e 2026
                </p>
                <p className="text-[#168821] text-sm font-medium">
                  QUITADAS
                </p>
              </div>

              {/* Dados */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Contribuinte</span>
                  <span className="font-semibold text-[#071D41] text-right text-xs max-w-[55%] uppercase">
                    {dadosEmpresa?.nome || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">CNPJ</span>
                  <span className="font-semibold text-[#071D41]">{formatarCNPJ(cnpj)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Serviço</span>
                  <span className="font-semibold text-[#071D41]">SME</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Exercícios</span>
                  <span className="font-bold text-[#168821]">2025 e 2026</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Data</span>
                  <span className="font-semibold text-[#071D41]">{dataHoje}</span>
                </div>
              </div>

              {/* Aviso */}
              <div className="mt-5 bg-[#e3f2fd] rounded-lg p-3 flex items-start gap-2">
                <Radio className="w-4 h-4 text-[#1351b4] flex-shrink-0 mt-0.5" />
                <span className="text-xs text-[#1351b4]">
                  Próxima taxa TFF devida em <strong>janeiro de 2027</strong>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="space-y-3">
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="w-full border-[#168821] text-[#168821] hover:bg-[#168821] hover:text-white cursor-pointer py-4"
            >
              <Download className="w-4 h-4 mr-2" />
              Salvar certificado
            </Button>

            <Button
              onClick={() => navigate('/anatel')}
              className="w-full bg-[#071D41] hover:bg-[#0c2d4a] text-white font-semibold py-4 cursor-pointer"
            >
              Voltar ao início
            </Button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Anatel 0800 728 9998 | www.gov.br/anatel
          </p>
        </div>
      </main>

      <AnatelFooter />
    </div>
  );
};

export default AnatelEmDiaPage;
