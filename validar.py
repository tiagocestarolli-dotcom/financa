#!/usr/bin/env python3
"""Checagem automática antes de publicar o Finança (roda no GitHub Actions).

Se qualquer item falhar, o deploy NÃO acontece e o app no ar continua na
versão anterior. Mesmas regras do ritual de entrega:
  1. JavaScript sem erro de sintaxe (node --check em cada <script>)
  2. Nenhum espaço especial (NBSP, U+00A0)
  3. Nenhum ``` vazado no HTML
  4. Exatamente um rodapé "Finança · vX.Y.Z"
  5. Arquivo com tamanho plausível (não veio vazio/cortado no upload)
"""
import re, subprocess, sys, tempfile, os

def main(caminho):
    erros = []
    raw = open(caminho, 'rb').read()
    if len(raw) < 500_000:
        erros.append(f'arquivo pequeno demais ({len(raw)} bytes) — upload incompleto?')
    html = raw.decode('utf-8', errors='replace')
    nbsp = raw.count(b'\xc2\xa0')
    if nbsp:
        erros.append(f'{nbsp} espaço(s) especial(is) NBSP')
    if b'```' in raw:
        erros.append('triple-backtick (```) vazado no HTML')
    rodapes = re.findall(r'Finança · v(\d+\.\d+\.\d+)', html)
    if len(rodapes) != 1:
        erros.append(f'esperado 1 rodapé "Finança · vX.Y.Z", achei {len(rodapes)}')
    blocos = re.findall(r'<script(?![^>]*\bsrc=)([^>]*)>(.*?)</script>', html, re.S)
    n = 0
    for attrs, codigo in blocos:
        if 'type="module"' in attrs or not codigo.strip():
            continue
        n += 1
        with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
            f.write(codigo)
        r = subprocess.run(['node', '--check', f.name], capture_output=True, text=True)
        os.unlink(f.name)
        if r.returncode != 0:
            linhas = r.stderr.strip().splitlines()
            msg = next((l for l in linhas if 'Error' in l), linhas[-1] if linhas else '?')
            erros.append(f'erro de sintaxe no bloco <script> {n}: {msg[:300]}')
    if n == 0:
        erros.append('nenhum bloco <script> encontrado')
    if erros:
        print('✗ DEPLOY BLOQUEADO — o app no ar continua na versão anterior:')
        for e in erros:
            print('  -', e)
        return 1
    print(f'✓ index.html ok · v{rodapes[0]} · {n} blocos de script · {len(raw)//1024} KB')
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else 'index.html'))
