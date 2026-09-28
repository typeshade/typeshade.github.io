# The two steps of the Cloudflare setup (docs/cloudflare.md) that need the owner: the
# repository secrets the workflows read, and, once the Worker answers on workers.dev, moving
# typeshade.dev from GitHub Pages to the Worker.
#
# Run it in PowerShell, logged in with the GitHub CLI (`gh auth login`):
#
#   .\scripts\cloudflare-setup.ps1                 # the five secrets
#   .\scripts\cloudflare-setup.ps1 -MoveDomain     # the secrets, then the domain
#
# A secret is read from the environment variable of the same name when it is set, and asked for
# otherwise; `gh secret set` reads it from standard input, so it is never on the command line
# and never in the conversation.
param([switch]$MoveDomain)

$ErrorActionPreference = 'Stop'
$repo = 'typeshade/typeshade.github.io'
$names = @(
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_ACCESS_KEY_ID',
  'CLOUDFLARE_SECRET_ACCESS_KEY',
  'CLOUDFLARE_S3_API_ENDPOINT'
)

foreach ($name in $names) {
  $value = [Environment]::GetEnvironmentVariable($name)
  if (-not $value) {
    $secure = Read-Host -AsSecureString "$name"
    $value = [Runtime.InteropServices.Marshal]::PtrToStringBSTR(
      [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
  }
  $value | gh secret set $name --repo $repo
  Write-Host "set $name"
}

if (-not $MoveDomain) { return }

# The domain: attach typeshade.dev to the Worker as a custom domain. Cloudflare then answers
# for it with the Worker, in place of the record that points at GitHub Pages. If the call says
# a record already exists for the name, delete that record (DNS > Records, the CNAME or the A
# records for typeshade.dev) and run this again.
$token = [Environment]::GetEnvironmentVariable('CLOUDFLARE_API_TOKEN')
$account = [Environment]::GetEnvironmentVariable('CLOUDFLARE_ACCOUNT_ID')
if (-not $token -or -not $account) {
  throw 'Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in this shell to move the domain.'
}
$headers = @{ Authorization = "Bearer $token" }
$zone = (Invoke-RestMethod -Headers $headers `
    -Uri 'https://api.cloudflare.com/client/v4/zones?name=typeshade.dev').result[0].id
$body = @{
  hostname    = 'typeshade.dev'
  service     = 'typeshade-site'
  environment = 'production'
  zone_id     = $zone
} | ConvertTo-Json
$result = Invoke-RestMethod -Method Put -Headers $headers -ContentType 'application/json' `
  -Uri "https://api.cloudflare.com/client/v4/accounts/$account/workers/domains" -Body $body
Write-Host "typeshade.dev -> $($result.result.service) ($($result.result.id))"
