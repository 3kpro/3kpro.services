param(
  [string]$OutDir = "${PSScriptRoot}/../certs",
  [string]$Subject = 'CN=localhost'
)

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }

$certPath = Join-Path $OutDir 'server.pfx'
$keyPath = Join-Path $OutDir 'server.key'
$crtPath = Join-Path $OutDir 'server.crt'

Write-Host "Generating self-signed certificate for $Subject in $OutDir"

$cert = New-SelfSignedCertificate -DnsName 'localhost' -CertStoreLocation Cert:\LocalMachine\My -NotAfter (Get-Date).AddYears(5)

# Export PFX
$pwd = ConvertTo-SecureString -String 'changeit' -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath $certPath -Password $pwd

# Export PEM (crt + key)
$certBytes = [System.IO.File]::ReadAllBytes($certPath)
$tmp = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2 -ArgumentList ($certBytes, 'changeit')
[System.IO.File]::WriteAllText($crtPath, [System.Text.Encoding]::UTF8.GetString($tmp.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)))
$key = $tmp.PrivateKey
# Note: Exporting private key to PEM in PowerShell is non-trivial across platforms; for local testing use OpenSSL if available.
Write-Host "Wrote cert to $crtPath. Please create a matching server.key (private key) using OpenSSL if needed." 

Write-Host "Done. Place server.key alongside server.crt in the certs folder for nginx."
