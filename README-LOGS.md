# 🚀 **LOGS AWS - GUIA RÁPIDO**

Perfeito! Agora temos o sistema de logs funcionando e podemos diagnosticar esse erro 500 no registro de usuários. Vou usar o sistema de logs para capturar exatamente o que está acontecendo no momento do erro.

## ⚡ **USO IMEDIATO**

```powershell
# Para diagnóstico AGORA
.\run-logs.ps1 2

# Para análise completa
.\get-logs-completo.ps1 12

# Para verificação simples
.\get-logs-simple.ps1 6
```

## 📊 **STATUS ATUAL**
- ✅ **4 grupos de log** detectados
- ✅ **0 erros** no último teste
- ✅ **Sistema saudável**
- ✅ **Credenciais funcionando**

## 📁 **ONDE ENCONTRAR RESULTADOS**
```
logs-completo-YYYY-MM-DD-HHMM/
├── RELATORIO-COMPLETO.txt  ← ABRIR PRIMEIRO
├── amplify/                 ← Logs do Amplify
└── lambda/                  ← Logs de APIs (se houver)
```

## 🔧 **SCRIPTS DISPONÍVEIS**

| Script | Uso | Tempo |
|--------|-----|-------|
| `run-logs.ps1` | Diagnóstico rápido | 1-2 min |
| `get-logs-completo.ps1` | Análise completa | 3-5 min |
| `get-logs-simple.ps1` | Apenas Amplify | 1 min |

## 🎯 **CASOS COMUNS**

### **Problema no sistema:**
```powershell
.\run-logs.ps1 2
notepad "logs-completo-*\RELATORIO-COMPLETO.txt"
```

### **Análise diária:**
```powershell
.\get-logs-completo.ps1 24
explorer "logs-completo-*"
```

### **Verificação rápida:**
```powershell
.\get-logs-simple.ps1 6
```

## ⚠️ **TROUBLESHOOTING**

**Nenhum evento encontrado?**
- Aumentar período: `.\run-logs.ps1 48`
- Verificar se sistema está ativo

**AWS CLI não encontrado?**
- Download: https://aws.amazon.com/cli/

**Credenciais inválidas?**
- Scripts configuram automaticamente
- Validação: `arn:aws:iam:::root`

## 📞 **SUPORTE RÁPIDO**

1. Execute: `.\run-logs.ps1 2`
2. Abra: `RELATORIO-COMPLETO.txt`
3. Se houver erros, procurar "ERROR" nos logs
4. Focar em `/lambda/` para problemas de API

**Documentação completa:** `INSTRUCOES-LOGS.md` 