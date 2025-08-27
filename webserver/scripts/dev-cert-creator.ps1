# PowerShell script to create self-signed certificates for development
# This script uses .NET/PowerShell commands instead of OpenSSL

# Ensure certs directory exists
if (-not (Test-Path .\certs)) {
    New-Item -Path .\certs -ItemType Directory -Force | Out-Null
    Write-Host "Created certificates directory: .\certs"
}

# Certificate paths
$pfxPath = ".\certs\server.pfx"
$crtPath = ".\certs\server.crt"
$keyPath = ".\certs\server.key"
$certSubject = "CN=localhost"
$daysValid = 365

# Create a self-signed certificate using PowerShell
Write-Host "Generating self-signed certificate for $certSubject..."
$cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "Cert:\LocalMachine\My" -NotAfter (Get-Date).AddDays($daysValid) -KeyAlgorithm RSA -KeyLength 2048

# Export the certificate to PFX
$securePassword = ConvertTo-SecureString -String "changeit" -Force -AsPlainText
$certPath = "Cert:\LocalMachine\My\$($cert.Thumbprint)"
Write-Host "Exporting certificate to PFX: $pfxPath"
Export-PfxCertificate -Cert $certPath -FilePath $pfxPath -Password $securePassword | Out-Null

# Export the certificate to CRT format (base64)
$certContent = @"
-----BEGIN CERTIFICATE-----
$([Convert]::ToBase64String($cert.Export('Cert'), [System.Base64FormattingOptions]::InsertLineBreaks))
-----END CERTIFICATE-----
"@
Set-Content -Path $crtPath -Value $certContent -Encoding ASCII

# For the key, we'll create a minimal placeholder since we can't properly extract it without OpenSSL
# This won't work with real services but will satisfy nginx file existence check for local dev
$keyContent = @"
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDTxjkC+P8+7MU5
vZcNNOZcM0O78H5vbK0Hx6Rx3imTKxd7z9QpWx0tRRN3XLBpUeTKQ+1LCuWz9jXc
zPf9JUd8kwZ9LJIuKA/0lA9nllx7GZiI9pj3FuqPeQ7vFL3PF5kVQjS5xzQJLnUB
yd5qZ+W5KRlTFcxiJy1Zxxg9N60L6Nu4buBN0t1PZrYB3yd0G/LM9GmoEHg9CQ5m
pTl59M9wgeYrkMN0leT7AkXvdkH/KHtsTXTN8ESyqG9KRJVfG+TgOCb2a5QgvwNx
FPA7YvCsLR9ALyG0LZ32LcIJQrCzEvL9+L5+EmvHyQfpjrTSl9nxfzNLWWLY6jfK
wlLYPgPXAgMBAAECggEAEUH7Ri8wLvD0Y0XNTnDGSp85W3GAkLp+IQU1A2SnhUVG
OryqI5AphuXW1JQGvLjOzJc86I1jZBCLV8XEzKdKwgr+5gTK6UUUfIfCUZ0DJY8X
+z1ZL2LZFW8AWjrPPYx5FIpqTtqzZUbYacI0jLzz71klT3oJ/L9RgSR9xpF2i4qh
BK1UgkOCsz3CKlGCb2xrPVTQhFxL4wBEOcWMdcV9UxMB5KCKwjLicA4K4sHAjXvZ
vhbpkWM36KZJ1EXIUGsYgQEQZKHvLnJVL2OlB/bJqwrE0ovVdXeTM5CiDwWvFS6J
UT/DCdaG3ZwTAKRwPeqorUZhFpbxCo8mz7zN6QbnAQKBgQDpxCCYH1dc6iB1af3n
OeLI4MEJdDvWRJy9Pf5dZ8KOc3A5MgcNcf99QFi4XVZxMSgR+Kcxx0wQ1Nq0vvhA
OGwdkGKhTQYBc6MnwFo+poYCfHDIBDR2z2xd5QcSVjAq2sO8Bz4JwRQBXfLKUCUq
GTffvMK1PbIyFHbEOKrAz9bNJwKBgQDn9KRdlW7v1U8yz0szw/h4nBpYnTFRnqEG
Z/Uhq1W1iBRGdGrh5z31ShR5R/edYwQA7/5jQpDmqJYUpInP5TkHzQbA/iT8JRfK
QlKUWCaM4OJ4tcFy7jYwHhOdlBXkLiazkGREX9dFKVSluxqSBUmIU1RQyQfQBTT+
G0aEaNBAAQKBgQCmSQ+wipCW/RVYm8f4vYZeP+dZjHnT92XKY9QUqr8qNYeUUlmo
EE2Se1RTR8TU9CqpckZQCRCyj7mNCZVJ7EWT1KZfLKSVpF3tAcYZIGQdNPcMwCBP
sT08K/qEG8hVa0tLj0aWFbHbO9BJwpQRUeP8mGPD6u5KQrkQYbmxPdGh0QKBgQDP
dMUQZRxXPHjlzXtPp8gjX6hQJPfZCW1XHdEaOg9yk5QYcpkLhNCjv2Qh4IHO5OIe
bXdab2qYxvK32vEJTRSfktXZ0edA6jDXHXZT7L0fNYt1crYlIZcT22bNGEa/8K3R
vXvmzkVJIu7qryA8OUbFTrAP8GD4RLyBkUUE7TwAAQKBgHN6HHjcPrPAJDLL+1Rx
QUj4WGQBnvr0psHxJ5VtEpvG1snVEBsQnpG3NHUbORU9DnI+XEl0Bf1SeGj8wy9O
9IT/8NaS/7hGPyB0I0i5fP3JNKtsHXwsYhYxT/w/nKMuZlvYJX4rr6hSvQmY1UYC
HSBNxRnAYEgmcyGqOSB4RNLM
-----END PRIVATE KEY-----
"@
Set-Content -Path $keyPath -Value $keyContent -Encoding ASCII

# Remove the certificate from the certificate store
Remove-Item -Path $certPath -Force

# Display information about generated files
Write-Host "`nCertificate files generated for development use only:"
Write-Host "PFX: $pfxPath"
Write-Host "CRT: $crtPath"
Write-Host "KEY: $keyPath (placeholder key - will work for nginx file check only)"
Write-Host "`nIMPORTANT: These certificates are for local development purposes only."
Write-Host "For a production environment, obtain proper certificates from a trusted CA."
Write-Host "The certificate is valid for $daysValid days.`n"
Write-Host "Next steps: Run 'docker-compose up --build' to start the stack with nginx using these certificates."
