// ====== Configuração da loja ======
// Fonte dos produtos. Para usar uma API real, troque pela URL dela
// (a resposta precisa ter o formato { "produtos": [ ... ] }).
const API_URL = "data/produtos.json";

const FRETE_GRATIS = 399;          // valor mínimo para frete grátis
const FRETE_FIXO = 24.9;           // frete cobrado abaixo do mínimo
const PARCELAS = 10;               // parcelas sem juros
const LIMITE_PRODUTOS = 20;        // máximo de produtos exibidos na vitrine
const CUPONS = { GRENAL10: 0.10 }; // cupons de desconto (percentual)

const FORMA = "M30 10 L8 26 L20 42 L28 36 L28 92 L72 92 L72 36 L80 42 L92 26 L70 10 Q50 24 30 10 Z";

// ====== Estado ======
let produtos = [];
let categoria = "todos";
let termoBusca = "";
let ordem = "relevancia";
let favoritos = lerLocal("favoritos", []);
let carrinho = lerLocal("carrinho", []);
let cupom = "";
let aberto = null; // produto aberto na janela de detalhes: { id, modelo, tamanho, qtd, erro }

// ====== Utilidades ======
const $ = (seletor) => document.querySelector(seletor);
const moeda = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const normalizar = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const escapar = (t) => String(t).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function lerLocal(chave, padrao) {
  try {
    const valor = JSON.parse(localStorage.getItem(chave));
    return valor === null || valor === undefined ? padrao : valor;
  } catch (e) { return padrao; }
}
function salvarLocal(chave, valor) {
  try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* ignora */ }
}

let temporizadorAviso;
function avisar(mensagem) {
  const el = $("#toast");
  el.textContent = mensagem;
  el.classList.add("mostrar");
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => el.classList.remove("mostrar"), 2200);
}

const emPromocao = (p) => p.precoOriginal && p.precoOriginal > p.preco;
const percentual = (p) => Math.round((1 - p.preco / p.precoOriginal) * 100);

function htmlPreco(p) {
  return `
    ${emPromocao(p) ? `<p class="preco-antigo">${moeda(p.precoOriginal)}</p>` : ""}
    <p class="preco">${moeda(p.preco)}</p>
    <p class="parcela">ou ${PARCELAS}x de ${moeda(p.preco / PARCELAS)} sem juros</p>`;
}

// ====== Busca de produtos na API ======
async function carregarProdutos() {
  try {
    const resposta = await fetch(API_URL);
    if (!resposta.ok) throw new Error("Status " + resposta.status);
    const dados = await resposta.json();
    produtos = dados.produtos.slice(0, LIMITE_PRODUTOS); // limita a 20 produtos
    renderVitrine();
  } catch (erro) {
    console.error(erro);
    $("#vitrine").innerHTML =
      '<p class="aviso">Não foi possível carregar os produtos. ' +
      'Abra o projeto com a extensão Live Server do VS Code ou pelo link do GitHub Pages ' +
      '(abrir o arquivo com duplo clique bloqueia a leitura do JSON).</p>';
  }
}

// ====== Desenho da camisa ======
function desenharCamisa(modelo, uid) {
  const id = "forma-" + uid;
  let fundo = "";
  if (modelo.cores.length === 1) {
    fundo = `<rect width="100" height="100" fill="${modelo.cores[0]}"/>`;
  } else {
    for (let n = 0; n < 10; n++) {
      fundo += `<rect x="${n * 10}" width="10" height="100" fill="${modelo.cores[n % modelo.cores.length]}"/>`;
    }
  }
  return `
    <svg viewBox="0 0 100 100" role="img" aria-label="Camisa ${escapar(modelo.nome)}">
      <defs><clipPath id="${id}"><path d="${FORMA}"/></clipPath></defs>
      <g clip-path="url(#${id})">${fundo}</g>
      <path d="${FORMA}" fill="none" stroke="${modelo.detalhe}" stroke-width="2.5"/>
      <path d="M40 11 Q50 24 60 11" fill="none" stroke="${modelo.detalhe}" stroke-width="3"/>
    </svg>`;
}

function imagemDoModelo(p, modelo, uid) {
  return modelo.imagem
    ? `<img src="${modelo.imagem}" alt="${escapar(p.nome)} ${escapar(modelo.nome)}">`
    : desenharCamisa(modelo, uid);
}

// ====== Vitrine ======
function htmlCard(p) {
  const fav = favoritos.includes(p.id);
  return `
    <article class="card" data-id="${p.id}">
      ${emPromocao(p) ? `<span class="selo">-${percentual(p)}%</span>` : ""}
      <button class="fav ${fav ? "on" : ""}" data-acao="fav" aria-label="Favoritar">♥</button>
      <div class="camisa" data-acao="abrir">${imagemDoModelo(p, p.modelos[0], "card" + p.id)}</div>
      <h3 data-acao="abrir">${escapar(p.nome)}</h3>
      <p class="clube">${escapar(p.clube)}</p>
      ${htmlPreco(p)}
      <button class="comprar" data-acao="abrir">Comprar</button>
    </article>`;
}

function filtrarProdutos() {
  const termo = normalizar(termoBusca.trim());
  let lista = produtos.filter((p) => {
    let dentro = true;
    if (categoria === "promocao") dentro = emPromocao(p);
    else if (categoria === "favoritos") dentro = favoritos.includes(p.id);
    else if (categoria !== "todos") dentro = p.cat === categoria;

    const texto = normalizar([p.nome, p.clube, ...p.modelos.map((m) => m.nome)].join(" "));
    return dentro && texto.includes(termo);
  });

  if (ordem === "menor") lista.sort((a, b) => a.preco - b.preco);
  if (ordem === "maior") lista.sort((a, b) => b.preco - a.preco);
  if (ordem === "az") lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  return lista;
}

function renderVitrine() {
  const lista = filtrarProdutos();
  $("#resultado").textContent = lista.length + (lista.length === 1 ? " produto encontrado" : " produtos encontrados");
  $("#cont-fav").textContent = favoritos.length;

  if (lista.length === 0) {
    const msg = categoria === "favoritos"
      ? "Você ainda não favoritou nenhuma camisa."
      : "Nenhuma camisa encontrada para essa busca.";
    $("#vitrine").innerHTML = `<p class="aviso">${msg}</p>`;
    return;
  }
  $("#vitrine").innerHTML = lista.map(htmlCard).join("");
}

function marcarMenu(cat) {
  document.querySelectorAll("#filtros button").forEach((b) => {
    b.classList.toggle("ativo", b.dataset.cat === cat);
  });
}

function alternarFavorito(id) {
  if (favoritos.includes(id)) favoritos = favoritos.filter((f) => f !== id);
  else favoritos.push(id);
  salvarLocal("favoritos", favoritos);
  renderVitrine();
}

// ====== Janela: detalhes do produto ======
function abrirModal() { $("#modal").classList.add("aberto"); }
function fecharModal() { $("#modal").classList.remove("aberto"); aberto = null; }

function abrirProduto(id) {
  aberto = { id, modelo: 0, tamanho: "", qtd: 1, erro: false };
  renderProduto();
  abrirModal();
}

function renderProduto() {
  const p = produtos.find((x) => x.id === aberto.id);
  const m = p.modelos[aberto.modelo];

  $("#modal-conteudo").innerHTML = `
    <button class="modal-fechar" data-acao="fechar" aria-label="Fechar">×</button>
    <div class="detalhe">
      <div class="detalhe-img">${imagemDoModelo(p, m, "modal")}</div>
      <div class="detalhe-info">
        <p class="clube">${escapar(p.clube)}</p>
        <h2>${escapar(p.nome)}</h2>
        ${htmlPreco(p)}
        <p class="descricao">${escapar(p.descricao || "")}</p>

        <h4>Modelo</h4>
        <div class="opcoes-btn">
          ${p.modelos.map((x, i) =>
            `<button class="op ${i === aberto.modelo ? "sel" : ""}" data-acao="modelo" data-valor="${i}">${escapar(x.nome)}</button>`).join("")}
        </div>

        <h4>Tamanho</h4>
        <div class="opcoes-btn">
          ${p.tamanhos.map((t) =>
            `<button class="op ${t === aberto.tamanho ? "sel" : ""}" data-acao="tamanho" data-valor="${t}">${t}</button>`).join("")}
        </div>
        ${aberto.erro ? '<p class="erro">Escolha um tamanho para continuar.</p>' : ""}

        <h4>Quantidade</h4>
        <div class="qtd">
          <button data-acao="qtd-menos">−</button>
          <span>${aberto.qtd}</span>
          <button data-acao="qtd-mais">+</button>
        </div>

        <button class="comprar grande" data-acao="adicionar">Adicionar ao carrinho</button>
      </div>
    </div>`;
}

function adicionarAoCarrinho() {
  if (!aberto.tamanho) {
    aberto.erro = true;
    renderProduto();
    return;
  }
  const p = produtos.find((x) => x.id === aberto.id);
  const modelo = p.modelos[aberto.modelo].nome;
  const chave = `${p.id}-${modelo}-${aberto.tamanho}`;
  const existente = carrinho.find((i) => i.chave === chave);

  if (existente) existente.qtd += aberto.qtd;
  else carrinho.push({ chave, nome: p.nome, modelo, tamanho: aberto.tamanho, preco: p.preco, qtd: aberto.qtd });

  salvarLocal("carrinho", carrinho);
  renderCarrinho();
  fecharModal();
  avisar("Produto adicionado ao carrinho");
  abrirCarrinho(true);
}

// ====== Carrinho ======
function calcularTotais() {
  const subtotal = carrinho.reduce((soma, i) => soma + i.preco * i.qtd, 0);
  const desconto = cupom ? subtotal * CUPONS[cupom] : 0;
  const base = subtotal - desconto;
  const frete = subtotal === 0 ? 0 : (base >= FRETE_GRATIS ? 0 : FRETE_FIXO);
  return { subtotal, desconto, base, frete, total: base + frete };
}

function renderCarrinho() {
  const t = calcularTotais();
  const totalItens = carrinho.reduce((soma, i) => soma + i.qtd, 0);

  $("#contador").textContent = totalItens;
  $("#subtotal").textContent = moeda(t.subtotal);
  $("#desconto").textContent = "- " + moeda(t.desconto);
  $("#linha-desconto").style.display = t.desconto > 0 ? "flex" : "none";
  $("#frete").textContent = t.frete === 0 ? "Grátis" : moeda(t.frete);
  $("#total").textContent = moeda(t.total);

  // Barra de frete grátis
  const falta = FRETE_GRATIS - t.base;
  $("#frete-barra").style.width = Math.min(100, (t.base / FRETE_GRATIS) * 100) + "%";
  $("#frete-texto").textContent = t.subtotal === 0
    ? `Frete grátis em compras acima de ${moeda(FRETE_GRATIS)}`
    : falta > 0
      ? `Faltam ${moeda(falta)} para você ganhar frete grátis`
      : "Você ganhou frete grátis!";

  if (carrinho.length === 0) {
    $("#itens").innerHTML = '<p class="vazio">Seu carrinho está vazio.</p>';
    return;
  }
  $("#itens").innerHTML = carrinho.map((i) => `
    <div class="item" data-chave="${i.chave}">
      <div>
        <h4>${escapar(i.nome)}</h4>
        <p>Modelo: ${escapar(i.modelo)} | Tamanho: ${i.tamanho}</p>
        <div class="qtd">
          <button data-acao="menos">−</button>
          <span>${i.qtd}</span>
          <button data-acao="mais">+</button>
          <button class="remover" data-acao="remover">Remover</button>
        </div>
      </div>
      <div class="item-preco">${moeda(i.preco * i.qtd)}</div>
    </div>`).join("");
}

function abrirCarrinho(abrir) {
  $("#carrinho").classList.toggle("aberto", abrir);
  $("#overlay").classList.toggle("aberto", abrir);
}

function aplicarCupom() {
  const codigo = $("#cupom").value.trim().toUpperCase();
  const msg = $("#msg-cupom");
  if (!codigo) {
    cupom = "";
    msg.textContent = "";
  } else if (CUPONS[codigo]) {
    cupom = codigo;
    msg.textContent = `Cupom ${codigo} aplicado: ${CUPONS[codigo] * 100}% de desconto.`;
    msg.className = "msg-cupom ok";
  } else {
    cupom = "";
    msg.textContent = "Cupom inválido.";
    msg.className = "msg-cupom erro";
  }
  renderCarrinho();
}

// ====== Checkout (simulado) ======
function abrirCheckout() {
  if (carrinho.length === 0) {
    avisar("Seu carrinho está vazio");
    return;
  }
  const t = calcularTotais();
  abrirCarrinho(false);
  $("#modal-conteudo").innerHTML = `
    <button class="modal-fechar" data-acao="fechar" aria-label="Fechar">×</button>
    <form class="checkout" id="form-checkout">
      <h2>Finalizar compra</h2>
      <div class="form-grid">
        <label class="inteiro">Nome completo
          <input type="text" name="nome" required></label>
        <label>E-mail
          <input type="email" name="email" required></label>
        <label>CEP
          <input type="text" name="cep" required pattern="\\d{5}-?\\d{3}" placeholder="00000-000"></label>
        <label class="inteiro">Endereço
          <input type="text" name="endereco" required></label>
        <label class="inteiro">Cidade
          <input type="text" name="cidade" required></label>
      </div>

      <h4>Forma de pagamento</h4>
      <div class="pagamento">
        <label><input type="radio" name="pagamento" value="Pix" checked> Pix</label>
        <label><input type="radio" name="pagamento" value="Cartão de crédito"> Cartão de crédito</label>
        <label><input type="radio" name="pagamento" value="Boleto"> Boleto</label>
      </div>

      <div class="resumo">
        ${carrinho.map((i) => `<div class="linha"><span>${i.qtd}x ${escapar(i.nome)} (${escapar(i.modelo)}, ${i.tamanho})</span><span>${moeda(i.preco * i.qtd)}</span></div>`).join("")}
        <hr>
        <div class="linha"><span>Subtotal</span><span>${moeda(t.subtotal)}</span></div>
        ${t.desconto > 0 ? `<div class="linha"><span>Desconto</span><span>- ${moeda(t.desconto)}</span></div>` : ""}
        <div class="linha"><span>Frete</span><span>${t.frete === 0 ? "Grátis" : moeda(t.frete)}</span></div>
        <div class="linha"><strong>Total</strong><strong>${moeda(t.total)}</strong></div>
      </div>

      <button type="submit" class="comprar grande">Confirmar pedido</button>
      <p class="nota">Simulação: nenhum pagamento é processado e nenhum dado de cartão é solicitado.</p>
    </form>`;
  abrirModal();
}

function confirmarPedido(form) {
  const dados = new FormData(form);
  const t = calcularTotais();
  const numero = String(Date.now()).slice(-6);

  $("#modal-conteudo").innerHTML = `
    <button class="modal-fechar" data-acao="fechar" aria-label="Fechar">×</button>
    <div class="confirmacao">
      <div class="ok">✓</div>
      <h2>Pedido realizado com sucesso!</h2>
      <p>Número do pedido: <strong>#${numero}</strong></p>
      <p>Obrigado, ${escapar(dados.get("nome"))}! Enviaremos os detalhes para ${escapar(dados.get("email"))}.</p>
      <p>Pagamento: ${escapar(dados.get("pagamento"))} | Total: <strong>${moeda(t.total)}</strong></p>
      <p class="nota">Este é um projeto de estudo: o pedido é fictício.</p>
      <button class="comprar grande" data-acao="fechar">Voltar para a loja</button>
    </div>`;

  carrinho = [];
  cupom = "";
  $("#cupom").value = "";
  $("#msg-cupom").textContent = "";
  salvarLocal("carrinho", carrinho);
  renderCarrinho();
}

// ====== Eventos ======
$("#busca").addEventListener("input", (e) => {
  termoBusca = e.target.value;
  renderVitrine();
});

$("#ordem").addEventListener("change", (e) => {
  ordem = e.target.value;
  renderVitrine();
});

$("#filtros").addEventListener("click", (e) => {
  if (e.target.tagName !== "BUTTON") return;
  categoria = e.target.dataset.cat;
  marcarMenu(categoria);
  renderVitrine();
});

$("#btn-favoritos").addEventListener("click", () => {
  categoria = "favoritos";
  marcarMenu("favoritos");
  renderVitrine();
  $("#vitrine").scrollIntoView({ behavior: "smooth" });
});

document.querySelectorAll(".hero-btn").forEach((botao) => {
  botao.addEventListener("click", () => {
    termoBusca = botao.dataset.busca;
    $("#busca").value = termoBusca;
    categoria = "todos";
    marcarMenu("todos");
    renderVitrine();
    $("#vitrine").scrollIntoView({ behavior: "smooth" });
  });
});

$("#vitrine").addEventListener("click", (e) => {
  const alvo = e.target.closest("[data-acao]");
  const card = e.target.closest(".card");
  if (!alvo || !card) return;
  const id = Number(card.dataset.id);
  if (alvo.dataset.acao === "fav") alternarFavorito(id);
  if (alvo.dataset.acao === "abrir") abrirProduto(id);
});

$("#modal").addEventListener("click", (e) => {
  if (e.target.id === "modal") { fecharModal(); return; }
  const alvo = e.target.closest("[data-acao]");
  if (!alvo) return;
  const acao = alvo.dataset.acao;

  if (acao === "fechar") fecharModal();
  if (!aberto) return;

  if (acao === "modelo") { aberto.modelo = Number(alvo.dataset.valor); renderProduto(); }
  if (acao === "tamanho") { aberto.tamanho = alvo.dataset.valor; aberto.erro = false; renderProduto(); }
  if (acao === "qtd-mais") { aberto.qtd += 1; renderProduto(); }
  if (acao === "qtd-menos") { aberto.qtd = Math.max(1, aberto.qtd - 1); renderProduto(); }
  if (acao === "adicionar") adicionarAoCarrinho();
});

$("#modal").addEventListener("submit", (e) => {
  e.preventDefault();
  if (e.target.id === "form-checkout") confirmarPedido(e.target);
});

$("#itens").addEventListener("click", (e) => {
  const acao = e.target.dataset.acao;
  const itemEl = e.target.closest(".item");
  if (!acao || !itemEl) return;
  const item = carrinho.find((i) => i.chave === itemEl.dataset.chave);

  if (acao === "mais") item.qtd += 1;
  if (acao === "menos") item.qtd -= 1;
  if (acao === "remover" || item.qtd <= 0) carrinho = carrinho.filter((i) => i !== item);

  salvarLocal("carrinho", carrinho);
  renderCarrinho();
});

$("#btn-carrinho").addEventListener("click", () => abrirCarrinho(true));
$("#fechar").addEventListener("click", () => abrirCarrinho(false));
$("#overlay").addEventListener("click", () => abrirCarrinho(false));
$("#aplicar-cupom").addEventListener("click", aplicarCupom);
$("#finalizar").addEventListener("click", abrirCheckout);

$("#limpar").addEventListener("click", () => {
  carrinho = [];
  salvarLocal("carrinho", carrinho);
  renderCarrinho();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { fecharModal(); abrirCarrinho(false); }
});

// ====== Início ======
renderCarrinho();
carregarProdutos();