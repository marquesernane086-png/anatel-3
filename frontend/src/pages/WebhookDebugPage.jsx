import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function WebhookDebugPage() {
  const [logs, setLogs] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = async () => {
    try {
      const { data } = await axios.get(`${API}/webhook/logs?limit=20`);
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Erro ao buscar logs:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data } = await axios.get(`${API}/transactions/recent?limit=10`);
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Erro ao buscar transações:', err);
    }
  };

  const testWebhook = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      const { data } = await axios.post(`${API}/webhook/test`);
      setTestResult(data);
      fetchLogs();
      fetchTransactions();
    } catch (err) {
      setTestResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const simulatePayment = async (transactionId) => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/webhook/simulate-paid/${transactionId}`);
      alert(`Pagamento simulado! Status: ${data.new_status}`);
      fetchLogs();
      fetchTransactions();
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchTransactions();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchLogs();
        fetchTransactions();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'waiting_payment': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-400">🔧 Webhook Debug</h1>
            <p className="text-gray-400 mt-1">Monitor de webhooks em tempo real</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              Auto-refresh (5s)
            </label>
            <button
              onClick={() => { fetchLogs(); fetchTransactions(); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>

        {/* URL do Webhook */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-400 mb-2">URL do Webhook (configure na Zippify):</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-900 px-4 py-2 rounded text-green-400 font-mono text-sm">
              {BACKEND_URL}/api/webhook/zippify
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${BACKEND_URL}/api/webhook/zippify`);
                alert('URL copiada!');
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
            >
              📋 Copiar
            </button>
          </div>
        </div>

        {/* Botões de Teste */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">🧪 Testes</h2>
          <div className="flex gap-4">
            <button
              onClick={testWebhook}
              disabled={loading}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-medium"
            >
              {loading ? '⏳ Testando...' : '🚀 Simular Webhook de Pagamento'}
            </button>
            <button
              onClick={async () => {
                try {
                  const { data } = await axios.get(`${API}/webhook/zippify`);
                  alert(`Webhook ativo! Resposta: ${JSON.stringify(data)}`);
                } catch (err) {
                  alert('Erro: ' + err.message);
                }
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
            >
              🔍 Testar Conectividade (GET)
            </button>
          </div>
          
          {testResult && (
            <div className="mt-4 bg-gray-900 rounded p-4">
              <p className="text-sm text-gray-400 mb-2">Resultado do teste:</p>
              <pre className="text-xs overflow-auto max-h-40 text-green-300">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Transações Recentes */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">💳 Transações Recentes</h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhuma transação encontrada</p>
              ) : (
                transactions.map((tx, i) => (
                  <div key={i} className="bg-gray-900 rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-sm text-blue-400">{tx.id}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><span className="text-gray-500">CNPJ:</span> {tx.cnpj}</p>
                      <p><span className="text-gray-500">Valor:</span> R$ {tx.valor?.toFixed(2)}</p>
                      <p><span className="text-gray-500">CPF:</span> {tx.cpf_utilizado || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{formatDate(tx.created_at)}</p>
                    </div>
                    {tx.status === 'waiting_payment' && (
                      <button
                        onClick={() => simulatePayment(tx.id)}
                        className="mt-2 w-full px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm font-medium"
                      >
                        ✅ Simular Pagamento
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Logs de Webhook */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">📋 Logs de Webhook</h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum webhook recebido ainda</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="bg-gray-900 rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-gray-500">{formatDate(log.received_at)}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${log.processed ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                        {log.processed ? '✅ Processado' : '⏳ Pendente'}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><span className="text-gray-500">Event:</span> {log.payload?.event || 'N/A'}</p>
                      <p><span className="text-gray-500">Status:</span> {log.payload?.payment_status || log.payload?.status || 'N/A'}</p>
                      <p><span className="text-gray-500">ID:</span> <span className="text-blue-400">{log.payload?.id || log.payload?.token || 'N/A'}</span></p>
                      {log.payload?.customer?.email && (
                        <p><span className="text-gray-500">Email:</span> <span className="text-yellow-400">{log.payload.customer.email}</span></p>
                      )}
                      {log.transaction_id && (
                        <p><span className="text-gray-500">Transação:</span> <span className="text-green-400">{log.transaction_id}</span></p>
                      )}
                      {log.search_method && (
                        <p><span className="text-gray-500">Encontrado por:</span> <span className="text-purple-400">{log.search_method}</span></p>
                      )}
                    </div>
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300">Ver payload completo</summary>
                      <pre className="mt-2 text-xs bg-gray-950 p-2 rounded overflow-auto max-h-32 text-gray-400">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-gray-800 rounded-lg p-4 mt-6">
          <h2 className="text-lg font-semibold mb-4">📖 Como Configurar na Zippify</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Acesse o painel da Zippify</li>
            <li>Vá em <strong>Configurações → Webhooks/Postback</strong></li>
            <li>Cole a URL: <code className="bg-gray-900 px-2 py-0.5 rounded text-green-400">{BACKEND_URL}/api/webhook/zippify</code></li>
            <li>Selecione os eventos: <strong>Pagamento Aprovado (PIX)</strong></li>
            <li>Salve e teste enviando um pagamento de teste</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
