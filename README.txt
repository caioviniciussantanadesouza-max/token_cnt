# CNT — Site pronto (Brasil inteiro)

## Como rodar (sem “abrir arquivo” no Chrome)
1) Instale o **VS Code**
2) Instale a extensão **Live Server**
3) Abra esta pasta no VS Code
4) Clique com o botão direito em **index.html** → **“Open with Live Server”**

> Abrir o HTML direto (file://) quebra o `fetch()` dos GeoJSON e dá cache estranho no Chrome.

## Arquivos
- index.html (site)
- BR_IBGE.geojson (borda do Brasil)
- CNT_FULL_10Y.geojson (números do CNT + série 10y)

## Jupiter Plugin (swap dentro do site)
No index.html, procure por:
- REFERRAL_ACCOUNT
- REFERRAL_FEE_BPS

Você vai colar seu Referral Account ali.

⚠️ Importante: o Jupiter/Ultra limita a taxa do integrador entre **50 e 255 bps**.
255 bps = 2,55% (máximo).
Se existir “divisão 80/20”, seu líquido máximo fica ~2,04%.

Se você quer 2,58% líquido, **não dá** com o limite 255 bps.
