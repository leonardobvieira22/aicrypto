# Script para baixar logs do AWS Amplify CloudWatch
# Execute: .\get-amplify-logs.ps1

Write-Host "🔍 Buscando logs do AWS Amplify..." -ForegroundColor Green

# Verificar se AWS CLI está instalado
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "❌ AWS CLI não encontrado. Instale em: https://aws.amazon.com/cli/" -ForegroundColor Red
    exit 1
}

# Verificar se está configurado
try {
    aws sts get-caller-identity | Out-Null
} catch {
    Write-Host "❌ AWS CLI não configurado. Execute: aws configure" -ForegroundColor Red
    exit 1
}

Write-Host "✅ AWS CLI configurado" -ForegroundColor Green

# Criar diretório para logs
$logDir = "amplify-logs-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
New-Item -ItemType Directory -Path $logDir -Force | Out-Null
Write-Host "📁 Criado diretório: $logDir" -ForegroundColor Blue

# Buscar grupos de log do Amplify
Write-Host "🔍 Buscando grupos de log..." -ForegroundColor Yellow

$logGroups = @()

# Buscar por diferentes padrões
$patterns = @(
    "/aws/lambda/amplify",
    "/aws/amplify",
    "/aws/lambda/main-d34l4lklofiz4e"
)

foreach ($pattern in $patterns) {
    try {
        $groups = aws logs describe-log-groups --log-group-name-prefix $pattern --query 'logGroups[].logGroupName' --output text
        if ($groups) {
            $logGroups += $groups.Split("`t")
        }
    } catch {
        Write-Host "⚠️ Erro ao buscar padrão: $pattern" -ForegroundColor Yellow
    }
}

if ($logGroups.Count -eq 0) {
    Write-Host "❌ Nenhum grupo de log encontrado. Verifique se o app está deployado." -ForegroundColor Red
    exit 1
}

Write-Host "📋 Encontrados $($logGroups.Count) grupo(s) de log:" -ForegroundColor Green
foreach ($group in $logGroups) {
    Write-Host "  - $group" -ForegroundColor Cyan
}

# Baixar logs de cada grupo
foreach ($logGroup in $logGroups) {
    Write-Host "📥 Baixando logs de: $logGroup" -ForegroundColor Yellow
    
    $groupName = $logGroup.Replace("/", "_").Replace(":", "_")
    $outputFile = Join-Path $logDir "$groupName.txt"
    
    try {
        # Pegar eventos das últimas 2 horas
        $startTime = [DateTimeOffset]::UtcNow.AddHours(-2).ToUnixTimeMilliseconds()
        
        # Baixar e formatar logs
        aws logs filter-log-events `
            --log-group-name $logGroup `
            --start-time $startTime `
            --query 'events[*].[timestamp,message]' `
            --output text | ForEach-Object {
                if ($_ -match '^(\d+)\s+(.+)$') {
                    $timestamp = [DateTimeOffset]::FromUnixTimeMilliseconds([long]$matches[1]).ToString("yyyy-MM-dd HH:mm:ss")
                    "$timestamp | $($matches[2])"
                } else {
                    $_
                }
            } | Out-File -FilePath $outputFile -Encoding UTF8
            
        Write-Host "✅ Salvo em: $outputFile" -ForegroundColor Green
        
        # Mostrar últimas 10 linhas como preview
        Write-Host "📖 Últimas entradas:" -ForegroundColor Blue
        Get-Content $outputFile -Tail 10 | ForEach-Object {
            Write-Host "    $_" -ForegroundColor Gray
        }
        Write-Host ""
        
    } catch {
        Write-Host "❌ Erro ao baixar logs de $logGroup" -ForegroundColor Red
    }
}

# Criar arquivo consolidado
Write-Host "📋 Criando arquivo consolidado..." -ForegroundColor Yellow
$consolidatedFile = Join-Path $logDir "TODOS-OS-LOGS.txt"

"=== LOGS CONSOLIDADOS DO AWS AMPLIFY ===" | Out-File -FilePath $consolidatedFile -Encoding UTF8
"Gerado em: $(Get-Date)" | Out-File -FilePath $consolidatedFile -Append -Encoding UTF8
"" | Out-File -FilePath $consolidatedFile -Append -Encoding UTF8

foreach ($logGroup in $logGroups) {
    $groupName = $logGroup.Replace("/", "_").Replace(":", "_")
    $sourceFile = Join-Path $logDir "$groupName.txt"
    
    if (Test-Path $sourceFile) {
        "=" * 80 | Out-File -FilePath $consolidatedFile -Append -Encoding UTF8
        "GRUPO: $logGroup" | Out-File -FilePath $consolidatedFile -Append -Encoding UTF8
        "=" * 80 | Out-File -FilePath $consolidatedFile -Append -Encoding UTF8
        Get-Content $sourceFile | Out-File -FilePath $consolidatedFile -Append -Encoding UTF8
        "" | Out-File -FilePath $consolidatedFile -Append -Encoding UTF8
    }
}

Write-Host "🎉 CONCLUÍDO!" -ForegroundColor Green
Write-Host "📁 Todos os logs salvos em: $logDir" -ForegroundColor Blue
Write-Host "📄 Arquivo principal: $consolidatedFile" -ForegroundColor Blue
Write-Host ""
Write-Host "💡 Para ver os logs, execute:" -ForegroundColor Yellow
Write-Host "   notepad `"$consolidatedFile`"" -ForegroundColor Cyan 