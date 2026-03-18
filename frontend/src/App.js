import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
// Páginas ANATEL (Principal)
import AnatelHomePage from './pages/AnatelHomePage';
import AnatelDebitosPage from './pages/AnatelDebitosPage';
import AnatelPagamentoPage from './pages/AnatelPagamentoPage';
import AnatelConfirmacaoPage from './pages/AnatelConfirmacaoPage';
import AnatelEmDiaPage from './pages/AnatelEmDiaPage';
import AnatelLinkPage from './pages/AnatelLinkPage';
// Admin
import PainelPage from './pages/PainelPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="App min-h-screen bg-gray-50">
        <Routes>
          {/* Redireciona "/" para "/anatel" */}
          <Route path="/" element={<Navigate to="/anatel" replace />} />
          
          {/* Rotas ANATEL - Sistema Principal */}
          <Route path="/anatel" element={<AnatelHomePage />} />
          <Route path="/anatel/debitos" element={<AnatelDebitosPage />} />
          <Route path="/anatel/pagamento" element={<AnatelPagamentoPage />} />
          <Route path="/anatel/confirmacao" element={<AnatelConfirmacaoPage />} />
          <Route path="/anatel/em-dia" element={<AnatelEmDiaPage />} />
          
          {/* Admin - URL discreta */}
          <Route path="/painel" element={<PainelPage />} />
          
          {/* Links únicos com CNPJ - DEVE SER A ÚLTIMA ROTA */}
          <Route path="/:cnpj" element={<AnatelLinkPage />} />
        </Routes>
        <Toaster position="top-center" />
      </div>
    </BrowserRouter>
  );
}

export default App;
