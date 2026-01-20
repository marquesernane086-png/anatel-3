import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import GovBrHeader from '@/components/GovBrHeader';
import GovBrFooter from '@/components/GovBrFooter';
import { CheckCircle2, Home, Printer, Shield } from 'lucide-react';

const ConfirmacaoPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [valor, setValor] = React.useState(0);
  const [cnpj, setCnpj] = React.useState('');
  const [dataHora, setDataHora] = React.useState('');

  useEffect(() => {
    const valorPago = location.state?.valor || 0;
    const cnpjPago = location.state?.cnpj || '';
    
    if (!valorPago) {
      navigate('/');
      return;
    }
    
    setValor(valorPago);
    setCnpj(cnpjPago);
    setDataHora(new Date().toLocaleString('pt-BR'));
  }, [location, navigate]);

  const formatarValor = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  const imprimirComprovante = () => {
    window.print();
  };

  const voltarInicio = () => {
    navigate('/');
  };

  return (
    <div className=\"min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-blue-50\">\n      <GovBrHeader />\n      
      <main className=\"flex-1 flex items-center justify-center py-12 px-4\">\n        <Card className=\"max-w-2xl w-full shadow-2xl border-green-200 animate-in fade-in duration-500\">\n          <CardContent className=\"pt-8 pb-8\">\n            {/* Success Icon */}\n            <div className=\"flex justify-center mb-6\">\n              <div className=\"w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300\">\n                <CheckCircle2 className=\"w-14 h-14 text-white\" />\n              </div>\n            </div>\n\n            {/* Title */}\n            <h1 className=\"text-3xl font-bold text-center text-gray-900 mb-2\">\n              Pagamento Confirmado!\n            </h1>\n            <p className=\"text-center text-gray-600 mb-8\">\n              Seu pagamento foi processado com sucesso\n            </p>\n\n            {/* Payment Info */}\n            <Card className=\"bg-gray-50 mb-6\">\n              <CardContent className=\"pt-6\">\n                <div className=\"space-y-4\">\n                  <div className=\"flex justify-between items-center py-3 border-b border-gray-200\">\n                    <span className=\"font-medium text-gray-600\">Status:</span>\n                    <span className=\"font-bold text-green-600 flex items-center gap-2\">\n                      <CheckCircle2 className=\"w-5 h-5\" />\n                      Confirmado\n                    </span>\n                  </div>\n                  \n                  <div className=\"flex justify-between items-center py-3 border-b border-gray-200\">\n                    <span className=\"font-medium text-gray-600\">Valor:</span>\n                    <span className=\"font-bold text-gray-900 text-xl\">\n                      {formatarValor(valor)}\n                    </span>\n                  </div>\n                  \n                  <div className=\"flex justify-between items-center py-3 border-b border-gray-200\">\n                    <span className=\"font-medium text-gray-600\">CNPJ:</span>\n                    <span className=\"font-semibold text-gray-900\">\n                      {cnpj}\n                    </span>\n                  </div>\n                  \n                  <div className=\"flex justify-between items-center py-3\">\n                    <span className=\"font-medium text-gray-600\">Data/Hora:</span>\n                    <span className=\"font-semibold text-gray-900\">\n                      {dataHora}\n                    </span>\n                  </div>\n                </div>\n              </CardContent>\n            </Card>\n\n            {/* Success Message */}\n            <Alert className=\"border-green-200 bg-green-50 mb-6\">\n              <AlertDescription className=\"text-green-900\">\n                <div className=\"flex items-start gap-3\">\n                  <Shield className=\"w-5 h-5 mt-0.5\" />\n                  <div>\n                    <p className=\"font-bold mb-2\">Obrigado pelo pagamento!</p>\n                    <p className=\"text-sm\">\n                      Seus d\u00e9bitos DAS foram quitados. O cancelamento autom\u00e1tico do seu CNPJ foi evitado.\n                      A baixa ser\u00e1 processada automaticamente em at\u00e9 30 minutos.\n                    </p>\n                  </div>\n                </div>\n              </AlertDescription>\n            </Alert>\n\n            {/* Actions */}\n            <div className=\"flex flex-col sm:flex-row gap-4\">\n              <Button\n                data-testid=\"voltar-inicio-btn\"\n                onClick={voltarInicio}\n                className=\"flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-base\"\n              >\n                <Home className=\"w-5 h-5 mr-2\" />\n                Voltar ao In\u00edcio\n              </Button>\n              \n              <Button\n                data-testid=\"imprimir-btn\"\n                onClick={imprimirComprovante}\n                variant=\"outline\"\n                className=\"flex-1 font-semibold py-6 text-base\"\n              >\n                <Printer className=\"w-5 h-5 mr-2\" />\n                Imprimir Comprovante\n              </Button>\n            </div>\n\n            {/* Security Note */}\n            <p className=\"text-center text-sm text-gray-500 mt-6 flex items-center justify-center gap-2\">\n              <Shield className=\"w-4 h-4\" />\n              Pagamento processado com seguran\u00e7a\n            </p>\n          </CardContent>\n        </Card>\n      </main>\n      \n      <GovBrFooter />\n    </div>\n  );\n};\n\nexport default ConfirmacaoPage;
