# StockForge Industrial — Controle de Estoque

Aplicativo web desenvolvido para o desafio de **Controle de Estoque — Componentes e Materiais**.

**Criado por Victor Maurício Barbosa de Lima.**

## Funcionalidades

- Login de administrador e funcionário
- Dashboard com indicadores
- Cadastro de produtos
- Categorias, fornecedores, unidades de medida e localizações
- Estoque mínimo e alertas de produtos abaixo do mínimo
- Entrada, saída, devolução e ajuste de estoque
- Histórico de movimentações
- Ordens de produção com materiais necessários
- Relatórios com opção de impressão / salvar como PDF
- Busca e filtros
- Persistência local com `localStorage`
- Layout responsivo para computador e celular
- Marca d'água e identificação do autor

## Como executar

Não precisa de Node, banco ou instalação.

1. Baixe/clone este repositório.
2. Abra `index.html` no navegador.

Para publicar no GitHub Pages:

1. Crie um repositório no GitHub.
2. Envie todos os arquivos mantendo as pastas.
3. Vá em **Settings → Pages**.
4. Selecione a branch principal e a pasta `/root`.
5. Salve e aguarde a publicação.

## Acessos de demonstração

- **Administrador:** `admin` / `admin123`
- **Funcionário:** `funcionario` / `1234`

## Observação sobre banco de dados

Esta versão funciona como um **MVP 100% front-end** e salva os dados no navegador usando `localStorage`. Assim, é excelente para demonstração, apresentação acadêmica e GitHub Pages.

Para transformar em sistema multiusuário real, o próximo passo é trocar o `localStorage` por um backend/API e um banco de dados (por exemplo, PostgreSQL, MySQL ou Supabase), mantendo a mesma interface.

## Estrutura

```text
controle-estoque-industrial-victor/
├── index.html
├── README.md
└── assets/
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```
