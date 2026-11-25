# CamisaStore: Loja Virtual de Camisas de Time

## Objetivo do projeto

Desenvolver uma **loja online (e-commerce) de camisas de time**, com a experiência de compra completa de uma loja virtual: o cliente **busca** as camisas, **escolhe o modelo e o tamanho**, **adiciona ao carrinho** e **finaliza o pedido**.

O foco é o **Grenal** (Internacional e Grêmio), mas a loja também traz clubes brasileiros e europeus. Os produtos são **buscados de uma API** (arquivo `data/produtos.json`, no formato de resposta de uma API), e a fonte pode ser trocada por uma API real alterando uma única linha.

Projeto desenvolvido para fins de estudo: produtos, preços e pedidos são fictícios.

## Funcionalidades

**Vitrine**
- Banner de destaque do Grenal, com atalhos para as camisas do Inter e do Grêmio
- Cards com preço, preço antigo, selo de desconto e parcelamento em 10x sem juros
- Busca por produto ou clube, sem diferenciar acentos
- Filtros por categoria: Todos, Grenal, Brasil, Europa e Promoções
- Ordenação por relevância, menor preço, maior preço e nome
- Favoritos (salvos no navegador)

**Página do produto**
- Janela de detalhes com descrição e imagem grande
- Escolha do **modelo** (Titular ou Reserva), do **tamanho** (P, M, G, GG) e da **quantidade**
- Validação: não permite adicionar ao carrinho sem escolher o tamanho

**Carrinho**
- Painel lateral com alteração de quantidade e remoção de itens
- Barra de progresso para o **frete grátis** (acima de R$ 399)
- **Cupom de desconto**: use `GRENAL10` para 10% de desconto
- Subtotal, desconto, frete e total
- Carrinho salvo no navegador (continua após atualizar a página)

**Finalização do pedido (simulada)**
- Formulário com dados de entrega e forma de pagamento (Pix, cartão ou boleto)
- Resumo do pedido e tela de confirmação com número do pedido
- Nenhum pagamento é processado e nenhum dado de cartão é solicitado

Layout responsivo (celular, tablet e computador).

## Tecnologias

- HTML5
- CSS3 (Grid e Flexbox)
- JavaScript puro, com `fetch` para consumir a API
- Git e GitHub (modelo git-flow)

## Estrutura do projeto

```
projeto-e-commerce/
├── index.html           # estrutura da página
├── css/
│   └── style.css        # estilos
├── js/
│   └── app.js           # API, vitrine, filtros, carrinho e checkout
├── data/
│   └── produtos.json    # dados dos produtos (resposta da API)
├── imagens/             # (opcional) fotos dos produtos
└── README.md
```

## Como executar

1. Clone o repositório:
   ```
   git clone https://github.com/marley7976/projeto-e-commerce.git
   cd projeto-e-commerce
   ```
2. Abra a pasta no **VS Code** e inicie com a extensão **Live Server** (botão "Go Live").

Importante: não abra o `index.html` com duplo clique. O navegador bloqueia a leitura do `produtos.json` fora de um servidor.

**Site online (GitHub Pages):** `https://marley7976.github.io/projeto-e-commerce/`

## Busca de produtos na API

No início do `js/app.js` ficam as configurações da loja:

```js
const API_URL = "data/produtos.json";   // fonte dos produtos
const FRETE_GRATIS = 399;               // valor mínimo para frete grátis
const FRETE_FIXO = 24.9;                // frete abaixo do mínimo
const PARCELAS = 10;                    // parcelas sem juros
const LIMITE_PRODUTOS = 20;             // máximo de produtos exibidos
const CUPONS = { GRENAL10: 0.10 };      // cupons de desconto
```

Para usar uma API real, troque o valor de `API_URL`. A resposta precisa ter este formato:

```json
{
  "produtos": [
    {
      "id": 1,
      "nome": "Camisa Internacional",
      "clube": "Internacional",
      "cat": "grenal",
      "preco": 349.90,
      "precoOriginal": 399.90,
      "descricao": "Descrição do produto.",
      "tamanhos": ["P", "M", "G", "GG"],
      "modelos": [
        { "nome": "Titular", "cores": ["#d71920"], "detalhe": "#ffffff" },
        { "nome": "Reserva", "cores": ["#ffffff"], "detalhe": "#d71920" }
      ]
    }
  ]
}
```

| Campo | Descrição |
|---|---|
| `cat` | categoria: `grenal`, `brasil` ou `europa` |
| `precoOriginal` | (opcional) preço antigo; se for maior que `preco`, o produto entra em Promoções e ganha o selo de desconto |
| `modelos[].cores` | cores da camisa desenhada (mais de uma cor gera listras) |
| `modelos[].detalhe` | cor da gola e do contorno |
| `modelos[].imagem` | (opcional) caminho de uma foto, ex.: `imagens/inter-1.png`; se existir, substitui a camisa desenhada |

## Fluxo de versionamento (git-flow)

| Branch | Função |
|---|---|
| `main` | versão estável do projeto |
| `develop` | integração das funcionalidades em desenvolvimento |
| `feature/*` | uma branch para cada funcionalidade (ex.: `feature/cards-produtos`) |
| `release/*` | preparação de uma nova versão |
| `hotfix/*` | correções urgentes na `main` |

Fluxo de trabalho:

```
git checkout develop
git pull
git checkout -b feature/nome-da-funcionalidade
# ... alterações ...
git add .
git commit -m "feat: descrição da alteração"
git push -u origin feature/nome-da-funcionalidade
```

Depois, abra um Pull Request da `feature/*` para a `develop`.

Padrão de commits: `feat:` (nova funcionalidade), `fix:` (correção), `docs:` (documentação), `style:` (estilo), `chore:` (manutenção).

## Organização do trabalho

**Epic 01: Base do projeto**
- [x] Versionamento no modelo git-flow
- [x] Colaborador adicionado ao repositório
- [x] Documentação do projeto (este README)
- [ ] Link do projeto no tópico "projeto venda camisa de time"

**Epic 02: Loja e produtos**
- [x] Teste da API e consulta de produtos (busca por nome/clube, filtros e ordenação)
- [x] Cards de cada produto, com modelo e tamanho
- [x] Estilização dos cards e do layout
- [x] Limite de 20 produtos na vitrine
- [x] Arquivos adicionados e versão atualizada no GitHub
- [x] Carrinho de compras com cupom e frete
- [x] Favoritos
- [x] Finalização de pedido (simulada)

## Equipe

- Marley ([@marley7976](https://github.com/marley7976))
- (nome do colega) ([rafael romero](https://https://github.com blacksafira05-prog))

## Observações

Escudos e fotos de camisas pertencem aos respectivos clubes e fabricantes; por isso, a loja usa camisas desenhadas por padrão.