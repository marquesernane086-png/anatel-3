import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import GovBrHeader from '@/components/GovBrHeader';
import GovBrFooter from '@/components/GovBrFooter';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CNPJDirectPage = () => {
  const { cnpj } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    consultarCNPJDireto();
  }, [cnpj]);

  const consultarCNPJDireto = async () => {
    // Validar CNPJ
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    
    if (!cnpjLimpo || cnpjLimpo.length !== 14) {
      toast.error('CNPJ inválido. Deve ter 14 dígitos.');
      navigate('/');
      return;
    }

    try {
      // Consultar CNPJ
      const response = await axios.post(`${API}/cnpj/consultar`, {
        cnpj: cnpjLimpo
      });
      
      // Redirecionar para página de débitos com os dados
      navigate('/debitos', { 
        state: { 
          dadosEmpresa: response.data 
        },
        replace: true
      });
    } catch (error) {
      console.error('Erro ao consultar CNPJ:', error);
      toast.error('Erro ao consultar CNPJ. Tente novamente.');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <GovBrHeader />
      
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Consultando CNPJ...</p>
          <p className="text-sm text-gray-500 mt-2">{cnpj}</p>
        </div>
      </main>
      
      <GovBrFooter />
    </div>
  );
};

export default CNPJDirectPage;
