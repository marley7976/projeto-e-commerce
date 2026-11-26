async function carregarProdutos() {
    const container = document.getElementById("lista-produtos");    

    // busca 6 produtos na api
    const resposta = await fetch('https://dummyjson.com/products?limit=20');
    const dados = await resposta.json();

    // limpa antes de inserir
    container.innerHTML = '';

    dados.products.forEach(produto => {
        // formata o preco
        const precoFormatado = produto.price.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
        // monta o html do card com os campos do dummy
        const cardHTML = `
            <div class="col-md-4 mb-4">
                <div class="product-card">
                    <img src="${produto.thumbnail}" alt="${produto.title}" class="product-image" />
                    <div class="product-info">
                        <h3 class="product-title">${produto.title}</h3>
                        <p class="product-description">${produto.description}</p>
                        <div class="product-price">${precoFormatado}</div>
                        <button class="btn-buy" data-name="${produto.title}" data-price="${produto.price}">
                            Comprar Agora
                        </button>
                    </div>
                </div>
            </div>`;  
        // adiciona o card na tela
        container.innerHTML += cardHTML;
});   
} 
/** carrega a lista inicial **/
carregarProdutos();