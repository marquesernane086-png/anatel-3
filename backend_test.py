#!/usr/bin/env python3
"""
Backend Testing Suite for ANATEL CPF Endpoints
Tests the new CPF-based endpoints that replaced CNPJ functionality
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_URL = "https://doc-change.preview.emergentagent.com/api"

# Test data
TEST_CPF = "12345678901"
TEST_CPF_2 = "98765432100"
TEST_NOME = "CONTRIBUINTE TESTE"
TEST_VALOR = 68.85

def log_test(test_name, status, details=""):
    """Log test results"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    status_symbol = "✅" if status == "PASS" else "❌"
    print(f"[{timestamp}] {status_symbol} {test_name}")
    if details:
        print(f"    {details}")
    print()

def test_health_check():
    """Test basic health check"""
    try:
        response = requests.get(f"{BACKEND_URL.replace('/api', '')}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "healthy":
                log_test("Health Check", "PASS", f"Status: {data.get('status')}, Database: {data.get('database')}")
                return True
            else:
                log_test("Health Check", "FAIL", f"Unhealthy status: {data}")
                return False
        else:
            log_test("Health Check", "FAIL", f"HTTP {response.status_code}: {response.text[:200]}")
            return False
    except Exception as e:
        log_test("Health Check", "FAIL", f"Exception: {str(e)}")
        return False

def test_cpf_consultar():
    """Test POST /api/cpf/consultar endpoint"""
    try:
        payload = {"cpf": TEST_CPF}
        response = requests.post(f"{BACKEND_URL}/cpf/consultar", json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify required fields
            required_fields = ["cpf", "nome", "situacao"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                log_test("CPF Consultar - Response Structure", "FAIL", f"Missing fields: {missing_fields}")
                return False
            
            # Verify CPF field is present and correct
            if data.get("cpf") != TEST_CPF:
                log_test("CPF Consultar - CPF Field", "FAIL", f"Expected CPF {TEST_CPF}, got {data.get('cpf')}")
                return False
            
            # Verify nome is not empty
            if not data.get("nome"):
                log_test("CPF Consultar - Nome Field", "FAIL", "Nome field is empty")
                return False
            
            log_test("CPF Consultar", "PASS", f"CPF: {data.get('cpf')}, Nome: {data.get('nome')}, Situação: {data.get('situacao')}")
            return True
        else:
            log_test("CPF Consultar", "FAIL", f"HTTP {response.status_code}: {response.text[:200]}")
            return False
    except Exception as e:
        log_test("CPF Consultar", "FAIL", f"Exception: {str(e)}")
        return False

def test_anatel_taxas():
    """Test GET /api/anatel/taxas/{cpf} endpoint"""
    try:
        response = requests.get(f"{BACKEND_URL}/anatel/taxas/{TEST_CPF}", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify required fields
            required_fields = ["cpf", "servico", "num_estacoes", "quantidade_anos", "total", "taxas"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                log_test("ANATEL Taxas - Response Structure", "FAIL", f"Missing fields: {missing_fields}")
                return False
            
            # Verify CPF field is present and correct
            if data.get("cpf") != TEST_CPF:
                log_test("ANATEL Taxas - CPF Field", "FAIL", f"Expected CPF {TEST_CPF}, got {data.get('cpf')}")
                return False
            
            # Verify taxas array structure
            taxas = data.get("taxas", [])
            if not taxas:
                log_test("ANATEL Taxas - Taxas Array", "FAIL", "Taxas array is empty")
                return False
            
            # Verify each taxa has required fields
            taxa_required_fields = ["tipo", "periodo", "principal", "acrescimos", "total_item"]
            for i, taxa in enumerate(taxas):
                missing_taxa_fields = [field for field in taxa_required_fields if field not in taxa]
                if missing_taxa_fields:
                    log_test("ANATEL Taxas - Taxa Structure", "FAIL", f"Taxa {i} missing fields: {missing_taxa_fields}")
                    return False
            
            # Verify mathematical calculation: total should equal sum of all taxa total_item values
            calculated_total = sum(taxa.get("total_item", 0) for taxa in taxas)
            reported_total = data.get("total", 0)
            
            if abs(calculated_total - reported_total) > 0.01:  # Allow small floating point differences
                log_test("ANATEL Taxas - Mathematical Validation", "FAIL", 
                        f"Total mismatch: calculated {calculated_total}, reported {reported_total}")
                return False
            
            # Verify TFF and TFI taxes are present
            tax_types = [taxa.get("tipo", "") for taxa in taxas]
            has_tff = any("TFF" in tax_type for tax_type in tax_types)
            has_tfi = any("TFI" in tax_type for tax_type in tax_types)
            
            if not has_tff:
                log_test("ANATEL Taxas - TFF Tax", "FAIL", "TFF tax not found in response")
                return False
            
            if not has_tfi:
                log_test("ANATEL Taxas - TFI Tax", "FAIL", "TFI tax not found in response")
                return False
            
            log_test("ANATEL Taxas", "PASS", 
                    f"CPF: {data.get('cpf')}, Total: R$ {data.get('total'):.2f}, "
                    f"Taxas: {len(taxas)} items, Math validation: ✓")
            return True
        else:
            log_test("ANATEL Taxas", "FAIL", f"HTTP {response.status_code}: {response.text[:200]}")
            return False
    except Exception as e:
        log_test("ANATEL Taxas", "FAIL", f"Exception: {str(e)}")
        return False

def test_pagamento_pix():
    """Test POST /api/pagamento/pix endpoint with CPF"""
    try:
        payload = {
            "cpf": TEST_CPF,
            "nome": TEST_NOME,
            "valor": TEST_VALOR
        }
        response = requests.post(f"{BACKEND_URL}/pagamento/pix", json=payload, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify required fields
            required_fields = ["id", "qr_code", "valor", "status", "gateway"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                log_test("Pagamento PIX - Response Structure", "FAIL", f"Missing fields: {missing_fields}")
                return False
            
            # Verify valor is correct
            if abs(data.get("valor", 0) - TEST_VALOR) > 0.01:
                log_test("Pagamento PIX - Valor Field", "FAIL", 
                        f"Expected valor {TEST_VALOR}, got {data.get('valor')}")
                return False
            
            # Verify QR code is not empty
            if not data.get("qr_code"):
                log_test("Pagamento PIX - QR Code", "FAIL", "QR code is empty")
                return False
            
            # Verify CPF was used (should be in cpf_utilizado field)
            cpf_utilizado = data.get("cpf_utilizado")
            if not cpf_utilizado:
                log_test("Pagamento PIX - CPF Utilizado", "FAIL", "cpf_utilizado field is missing or empty")
                return False
            
            log_test("Pagamento PIX", "PASS", 
                    f"ID: {data.get('id')}, Valor: R$ {data.get('valor'):.2f}, "
                    f"Status: {data.get('status')}, Gateway: {data.get('gateway')}, "
                    f"CPF Utilizado: {cpf_utilizado}")
            return True
        else:
            log_test("Pagamento PIX", "FAIL", f"HTTP {response.status_code}: {response.text[:200]}")
            return False
    except Exception as e:
        log_test("Pagamento PIX", "FAIL", f"Exception: {str(e)}")
        return False

def test_different_cpf_values():
    """Test endpoints with different CPF values to ensure variation"""
    try:
        # Test with second CPF
        response1 = requests.get(f"{BACKEND_URL}/anatel/taxas/{TEST_CPF}", timeout=10)
        response2 = requests.get(f"{BACKEND_URL}/anatel/taxas/{TEST_CPF_2}", timeout=10)
        
        if response1.status_code == 200 and response2.status_code == 200:
            data1 = response1.json()
            data2 = response2.json()
            
            # Values should be different for different CPFs
            total1 = data1.get("total", 0)
            total2 = data2.get("total", 0)
            
            if total1 == total2:
                log_test("Different CPF Values", "FAIL", 
                        f"Same total for different CPFs: {total1}")
                return False
            
            log_test("Different CPF Values", "PASS", 
                    f"CPF {TEST_CPF}: R$ {total1:.2f}, CPF {TEST_CPF_2}: R$ {total2:.2f}")
            return True
        else:
            log_test("Different CPF Values", "FAIL", 
                    f"HTTP errors: {response1.status_code}, {response2.status_code}")
            return False
    except Exception as e:
        log_test("Different CPF Values", "FAIL", f"Exception: {str(e)}")
        return False

def main():
    """Run all backend tests"""
    print("=" * 80)
    print("ANATEL CPF BACKEND TESTING SUITE")
    print("=" * 80)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test CPF: {TEST_CPF}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    print()
    
    # Run all tests
    tests = [
        ("Health Check", test_health_check),
        ("CPF Consultar", test_cpf_consultar),
        ("ANATEL Taxas", test_anatel_taxas),
        ("Pagamento PIX", test_pagamento_pix),
        ("Different CPF Values", test_different_cpf_values)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        if test_func():
            passed += 1
    
    print("=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Backend CPF endpoints are working correctly.")
        return 0
    else:
        print(f"\n❌ {total - passed} TEST(S) FAILED! Please check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())