"""
Script para converter o Excel da Hotmart para JSON estruturado
Gera dois arquivos:
- hotmart-alunos-import.json: dados dos alunos
- hotmart-transactions-import.json: dados das transações
"""
import pandas as pd
import json
import re
from datetime import datetime

# Ler o Excel
df = pd.read_excel('sales_history_ 23-11 a 20-01 (1).xls')

# Mapear tipos de pagamento para enum do banco
payment_method_map = {
    'Cartão de Crédito': 'credit_card',
    'Cart�o de Cr�dito': 'credit_card',
    'Pix': 'pix',
    'Boleto Bancário': 'boleto',
    'Boleto Banc�rio': 'boleto',
    'Parcelado Hotmart': 'credit_card',  # É parcelamento via cartão
    'Conta Hotmart (Cartão)': 'credit_card',
    'Conta Hotmart (Cart�o)': 'credit_card',
}

# Mapear status para enum do banco
status_map = {
    'Aprovado': 'approved',
    'Completo': 'completed',
    'Cancelado': 'cancelled',
    'Reembolsado': 'refunded',
}

def parse_date(date_str):
    """Converte data do formato DD/MM/YYYY HH:MM:SS para ISO"""
    if pd.isna(date_str):
        return None
    try:
        # Tenta diferentes formatos
        for fmt in ['%d/%m/%Y %H:%M:%S', '%d/%m/%Y', '%Y-%m-%d %H:%M:%S']:
            try:
                dt = datetime.strptime(str(date_str), fmt)
                return dt.isoformat()
            except ValueError:
                continue
        return None
    except:
        return None

def clean_cpf(cpf):
    """Remove caracteres não numéricos do CPF"""
    if pd.isna(cpf):
        return None
    return re.sub(r'\D', '', str(cpf))

def clean_phone(ddd, phone):
    """Combina DDD e telefone"""
    if pd.isna(phone):
        return None
    ddd_str = str(int(ddd)) if not pd.isna(ddd) else ''
    phone_str = re.sub(r'\D', '', str(phone))
    return ddd_str + phone_str

def clean_cep(cep):
    """Limpa CEP"""
    if pd.isna(cep):
        return None
    return re.sub(r'\D', '', str(cep).split('.')[0])

def clean_number(num):
    """Limpa número do endereço"""
    if pd.isna(num):
        return None
    return str(int(float(num))) if isinstance(num, (int, float)) else str(num)

def safe_str(val):
    """Converte para string ou None"""
    if pd.isna(val):
        return None
    return str(val).strip() if str(val).strip() else None

# Processar alunos únicos
alunos_dict = {}
for _, row in df.iterrows():
    email = str(row['Email']).lower().strip()
    if email in alunos_dict:
        continue

    alunos_dict[email] = {
        'fullName': safe_str(row['Nome']),
        'email': email,
        'cpf': clean_cpf(row['Documento']),
        'phone': clean_phone(row['DDD'], row['Telefone']),
        'zipCode': clean_cep(row['CEP']),
        'cidade': safe_str(row['Cidade']),
        'estado': safe_str(row['Estado']),
        'bairro': safe_str(row['Bairro']),
        'pais': safe_str(row['Pa\xeds']) or safe_str(row.get('País', 'Brasil')),
        'address': safe_str(row['Endere\xe7o']) or safe_str(row.get('Endereço')),
        'numeroEndereco': clean_number(row['N\xfamero']) or clean_number(row.get('Número')),
        'complemento': safe_str(row['Complemento']),
        'hotmartId': safe_str(row['chave']),
        'instagram': safe_str(row.get('Instagram')),
    }

alunos = list(alunos_dict.values())

# Processar transações
transactions = []
for _, row in df.iterrows():
    email = str(row['Email']).lower().strip()
    payment_type = str(row['Tipo de Pagamento']) if not pd.isna(row['Tipo de Pagamento']) else None
    status = str(row['Status']) if not pd.isna(row['Status']) else 'Aprovado'

    transaction = {
        'buyerEmail': email,
        'buyerName': safe_str(row['Nome']),
        'buyerDocument': clean_cpf(row['Documento']),
        'providerTransactionId': safe_str(row['Transa\xe7\xe3o']) or safe_str(row.get('Transação')),
        'productName': safe_str(row['Nome do Produto']),
        'productCode': safe_str(row['C\xf3digo do Produto']) or safe_str(row.get('Código do Produto')),
        'paymentMethod': payment_method_map.get(payment_type, 'credit_card'),
        'status': status_map.get(status, 'approved'),
        'installments': int(row['N\xfamero da Parcela']) if not pd.isna(row['N\xfamero da Parcela']) else 1,
        'currency': safe_str(row['Moeda']) or 'BRL',
        'saleDate': parse_date(row['Data de Venda']),
        'confirmationDate': parse_date(row['Data de Confirma\xe7\xe3o']) or parse_date(row.get('Data de Confirmação')),
        'coupon': safe_str(row.get('Cupom')),
        'offerCode': safe_str(row['C\xf3digo de Oferta']) or safe_str(row.get('Código de Oferta')),
        'hotmartId': safe_str(row['chave']),
        'providerData': {
            'origem': safe_str(row.get('Origem')),
            'afiliado': safe_str(row['Nome do Afiliado']),
            'codigoAfiliacao': safe_str(row['C\xf3digo da Afilia\xe7\xe3o']) or safe_str(row.get('Código da Afiliação')),
            'checkoutOrigem': safe_str(row.get('Origem de Checkout')),
            'vendaFeita': safe_str(row.get('Venda feita como')),
            'quantidade': int(row.get('Quantidade de itens', 1)) if not pd.isna(row.get('Quantidade de itens')) else 1,
        }
    }
    transactions.append(transaction)

# Salvar JSONs
with open('scripts/hotmart-alunos-import.json', 'w', encoding='utf-8') as f:
    json.dump(alunos, f, ensure_ascii=False, indent=2)

with open('scripts/hotmart-transactions-import.json', 'w', encoding='utf-8') as f:
    json.dump(transactions, f, ensure_ascii=False, indent=2)

print(f'[OK] {len(alunos)} alunos exportados para scripts/hotmart-alunos-import.json')
print(f'[OK] {len(transactions)} transacoes exportadas para scripts/hotmart-transactions-import.json')
