import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GovBrHeader from '@/components/GovBrHeader';
import GovBrFooter from '@/components/GovBrFooter';
import CNPJUploader from '@/components/CNPJUploader';
import { 
  DollarSign, 
  TrendingUp, 
  Activity, 
  CheckCircle2,
  BarChart3,
  Download,
  RefreshCw,
  Settings,
  Database,
  LogOut
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#0c326f', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [transacoes, setTransacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroGateway, setFiltroGateway] = useState('todos');
  const [gatewayAtivo, setGatewayAtivo] = useState('pagloop');
  const [cnpjStats, setCnpjStats] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    toast.success('Logout realizado');
    navigate('/login');
  };

  useEffect(() => {
    carregarDados();
    carregarCNPJStats();
    const interval = setInterval(() => {
      carregarDados();
      carregarCNPJStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [filtroStatus, filtroGateway]);

  const carregarCNPJStats = async () => {
    try {
      const response = await axios.get(`${API}/cnpjs/stats`);
      setCnpjStats(response.data);
    } catch (error) {
      console.error('Erro ao carregar stats CNPJs:', error);
    }
  };

  const carregarDados = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Stats
      const statsResponse = await axios.get(`${API}/dashboard/stats`, config);
      setStats(statsResponse.data);
      setGatewayAtivo(statsResponse.data.gateway_ativo);

      // Chart data
      const chartResponse = await axios.get(`${API}/dashboard/grafico?days=7`, config);
      setChartData(chartResponse.data);

      // Transactions
      let url = `${API}/dashboard/transacoes?limit=50`;
      if (filtroStatus !== 'todos') url += `&status=${filtroStatus}`;
      if (filtroGateway !== 'todos') url += `&gateway=${filtroGateway}`;
      
      const transResponse = await axios.get(url, config);
      setTransacoes(transResponse.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const trocarGateway = async (novoGateway) => {
    try {
      await axios.post(`${API}/gateway/switch?gateway=${novoGateway}`);
      setGatewayAtivo(novoGateway);
      toast.success(`Gateway alterado para ${novoGateway.toUpperCase()}`);
      carregarDados();
    } catch (error) {
      toast.error('Erro ao trocar gateway');
    }
  };

  const exportarCSV = () => {
    const csv = [
      ['ID', 'CNPJ', 'Nome', 'Valor', 'Status', 'Gateway', 'Data'].join(','),
      ...transacoes.map(t => [
        t.id,
        t.cnpj,
        t.nome,
        t.valor,
        t.status,
        t.gateway,
        format(new Date(t.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transacoes_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Relatório exportado!');
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'PENDING': { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      'paid': { label: 'Pago', color: 'bg-green-100 text-green-800' },
      'approved': { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
      'CONFIRMED': { label: 'Confirmado', color: 'bg-green-100 text-green-800' },
      'cancelled': { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
      'refused': { label: 'Recusado', color: 'bg-red-100 text-red-800' }
    };
    const info = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={info.color}>{info.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <GovBrHeader />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
              <p className="text-gray-600 mt-1">Sistema de Pagamento MEI</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={carregarDados} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button onClick={exportarCSV} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="transactions">Transações</TabsTrigger>
              <TabsTrigger value="database">
                <Database className="w-4 h-4 mr-2" />
                Banco CNPJs
              </TabsTrigger>
            </TabsList>

            {/* Tab: Visão Geral */}
            <TabsContent value="overview" className="space-y-6">{/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Arrecadado</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatarValor(stats?.total_arrecadado || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.total_transacoes || 0} transações
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transações 24h</CardTitle>
                <Activity className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.transacoes_24h || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Últimas 24 horas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {stats?.taxa_sucesso || 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pagamentos confirmados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gateway Ativo</CardTitle>
                <Settings className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 uppercase">
                  {gatewayAtivo}
                </div>
                <Select value={gatewayAtivo} onValueChange={trocarGateway}>
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pagloop">PagLoop</SelectItem>
                    <SelectItem value="furiapay">FuriaPay</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Line Chart - Transações por Dia */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Transações por Dia
                </CardTitle>
                <CardDescription>Últimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: ptBR })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })}
                      formatter={(value, name) => [
                        name === 'total' ? formatarValor(value) : value,
                        name === 'total' ? 'Valor' : 'Quantidade'
                      ]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#0c326f" name="Transações" strokeWidth={2} />
                    <Line type="monotone" dataKey="total" stroke="#10b981" name="Valor" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pie Chart - Por Gateway */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Transações por Gateway
                </CardTitle>
                <CardDescription>Distribuição entre gateways</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats?.por_gateway || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ _id, count }) => `${_id?.toUpperCase()}: ${count}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(stats?.por_gateway || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Gateway</label>
                  <Select value={filtroGateway} onValueChange={setFiltroGateway}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="pagloop">PagLoop</SelectItem>
                      <SelectItem value="furiapay">FuriaPay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button onClick={carregarDados} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Aplicar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Transações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Transações Recentes</span>
                <Badge variant="outline">{transacoes.length} registros</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Gateway</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transacoes.length > 0 ? (
                      transacoes.map((transacao) => (
                        <TableRow key={transacao.id}>
                          <TableCell className="font-mono text-xs">
                            {transacao.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell>{transacao.cnpj}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {transacao.nome}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatarValor(transacao.valor)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(transacao.status)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="uppercase">
                              {transacao.gateway}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {format(new Date(transacao.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                          Nenhuma transação encontrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
            </TabsContent>

            {/* Tab: Transações */}
            <TabsContent value="transactions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Todas as Transações</CardTitle>
                  <CardDescription>Lista completa de transações do sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>CNPJ</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Gateway</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transacoes.length > 0 ? (
                          transacoes.map((transacao) => (
                            <TableRow key={transacao.id}>
                              <TableCell className="font-mono text-xs">
                                {transacao.id.substring(0, 8)}...
                              </TableCell>
                              <TableCell>{transacao.cnpj}</TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {transacao.nome}
                              </TableCell>
                              <TableCell className="font-semibold">
                                {formatarValor(transacao.valor)}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(transacao.status)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="uppercase">
                                  {transacao.gateway}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {format(new Date(transacao.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                              Nenhuma transação encontrada
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Banco CNPJs */}
            <TabsContent value="database" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Banco de CNPJs
                  </CardTitle>
                  <CardDescription>
                    Gerencie o banco de dados de CNPJs para testes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Stats */}
                  {cnpjStats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Total CNPJs no Banco</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-blue-600">
                            {cnpjStats.total_cnpjs?.toLocaleString('pt-BR') || 0}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">registros importados</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Por Situação</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1 text-sm">
                            {cnpjStats.por_situacao?.map((item, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span className="text-gray-600">{item._id}:</span>
                                <span className="font-semibold">{item.count.toLocaleString('pt-BR')}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Uploader */}
                  <CNPJUploader onComplete={carregarCNPJStats} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <GovBrFooter />
    </div>
  );
};

export default DashboardPage;
