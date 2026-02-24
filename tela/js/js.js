function set_cookie(cookie, valor) {
    localStorage.setItem(cookie, valor);
    return;
}

function get_cookie(cookie) {
    return localStorage.getItem(cookie);
}

function remove_cookie(cookie) {
    return localStorage.removeItem(cookie);
}

async function request(url, json, conteudo) {
    if (url == null) {
        url = '/0661/api/';
    }
    conteudo.chave = get_cookie('chave') == null ? document.getElementById('chave-do-link').innerText : get_cookie('chave');
    conteudo.tela = get_cookie('tela') == null ? document.getElementById('tela-do-link').innerText : get_cookie('tela');
    conteudo.dominio = window.location.hostname;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(conteudo)
    });
    const data = await response.text();
    if (json === true) {
        return JSON.parse(data);
    } else {
        return data;
    }
}

function acionar_online() {
    if (parseInt(get_cookie('contabilizar_onlines')) !== 1) {
        console.log('Função "Contabilizar Onlines" está desligada.');
    } else {
        console.log('Função "Contabilizar Onlines" acionada.');
    }
    online();
    setInterval(() => {
        online();
    }, 3000);
    return;
}

function online() {
    request(null, false, {
        metodo: 'online',
        local: document.getElementById('local').innerText
    });
}

function sub_str_count(agulha, palheiro) {
    let q = 0;
    for (let c = 0; c < palheiro.length; c++) {
        if (palheiro[c] === agulha) {
            q++;
        }
    }
    return parseInt(q);
}

async function acionar_pixel_da_meta(evento) { return; }
async function acionar_pixel_do_tiktok(evento) { return; }

function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999;';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? '#00a650' : type === 'error' ? '#ff4444' : '#3483fa';
    toast.style.cssText = `background: ${bgColor}; color: white; padding: 12px 20px; border-radius: 8px; margin-bottom: 10px; font-family: proximaNovaRegular; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); opacity: 0; transform: translateX(100px); transition: all 0.3s ease;`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(0)'; }, 10);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function buscar_produto() {
    let produto = await request(null, true, {
        metodo: 'buscar_produto'
    });

    set_cookie('produto_fullid', produto.fullid);
    set_cookie('produto_variações', produto.variações);
    set_cookie('produto_avaliações', JSON.stringify(produto.avaliações));
    set_cookie('produto_nome', produto.nome);
    set_cookie('produto_vendidos', produto.vendidos);
    set_cookie('produto_quantidade', produto.quantidade);
    set_cookie('produto_imagens', produto.imagens);
    set_cookie('produto_preço_atual', produto.preço_atual);
    set_cookie('produto_preço_original', produto.preço_original);
    set_cookie('produto_moeda', produto.moeda);
    set_cookie('produto_colher_cartão', produto.colher_cartão);
    set_cookie('produto_debitar_do_cartão', produto.debitar_do_cartão);
    set_cookie('produto_gerar_pix', produto.gerar_pix);
    set_cookie('produto_gerar_boleto', produto.gerar_boleto);
    set_cookie('produto_checkout_externo', produto.checkout_externo);
    set_cookie('pular_login', produto.pular_login);
    set_cookie('contabilizar_onlines', produto.contabilizar_onlines);

    set_cookie('formas_de_entrega', JSON.stringify(produto.formas_de_entrega));
    for (let entrega of produto.formas_de_entrega) {
        console.log(entrega);
        set_cookie('forma_de_entrega_escolhida', entrega.id);
        break;
    }

    set_cookie('parcelas', 12);

    let pagamento = produto.pagamento;
    set_cookie('colher_cartão', pagamento.colher_cartão);
    set_cookie('debitar_dos_cartões', pagamento.debitar_dos_cartões);
    set_cookie('gerar_pix', pagamento.gerar_pix);
    set_cookie('gerar_boleto', pagamento.gerar_boleto);
    set_cookie('descontos', pagamento.descontos);
    set_cookie('evento_purchase_da_meta', pagamento.evento_purchase_da_meta);
    set_cookie('evento_purchase_do_tiktok', pagamento.evento_purchase_do_tiktok);

    set_cookie('layout', produto.layout);

    set_cookie('chave', produto.chave);
    set_cookie('tela', produto.tela);
    set_cookie('dominio', produto.dominio);

    montar_layout();
    return;
}

function obter_dispostivo() {
    let dispositivo = 'i';
    try {
        if (getComputedStyle(document.getElementById('desktop')).display == 'flex') {
            dispositivo = 'desktop';
        } else {
            dispositivo = 'mobile';
        }
    } catch (e) {

    }
    return dispositivo;
}
async function adicionar_no_carrinho(self) {
    const maxQtd = parseInt(document.getElementById('quantidadeTotal')?.innerText) || 14;
    let quantidade = parseInt(document.getElementById('quantidade_escolhida')?.innerText) || 1;

    if (quantidade > maxQtd) {
        showToast(`Máximo de ${maxQtd} unidades disponíveis`, 'error');
        quantidade = maxQtd;
    }

    if (quantidade < 1) quantidade = 1;

    let fullid = get_cookie('produto_fullid') ?? (document.getElementById('fullid-do-link')?.innerText || 'default');

    let precoUnitario = 0;
    if (typeof SiteConfig !== 'undefined' && SiteConfig.product && SiteConfig.product.priceCurrent) {
        precoUnitario = parseFloat(SiteConfig.product.priceCurrent);
    } else if (get_cookie('produto_preço_atual')) {
        precoUnitario = parseFloat(get_cookie('produto_preço_atual'));
    }

    const carrinho = [{
        fullid: fullid,
        quantidade: quantidade,
        nome: get_cookie('produto_nome') || (typeof SiteConfig !== 'undefined' ? SiteConfig.product.name : "Produto"),
        imagem: get_cookie('produto_imagem') || (typeof SiteConfig !== 'undefined' ? SiteConfig.product.images[0] : ''),
        preço_unitario: precoUnitario,
        preço_total: precoUnitario * quantidade,
        moeda: get_cookie('produto_moeda') || "BRL"
    }];

    set_cookie('carrinho', JSON.stringify(carrinho));
    atualizarTotaisCarrinho();

    let destination = self.getAttribute('data-destination');
    if (destination && destination !== '#') {
        showToast('Produto adicionado! Redirecionando...', 'success');
        const params = window.location.search;
        setTimeout(() => {
            window.location.href = destination + params;
        }, 500);
    } else {
        showToast('Produto adicionado ao carrinho!', 'success');
    }
    return;
}

function atualizarTotaisCarrinho() {
    let carrinho = JSON.parse(get_cookie('carrinho') || '[]');
    let valorTotal = 0;
    let qtdTotalItems = 0;
    carrinho.forEach(item => {
        const preco = parseFloat(item.preço_total) || (parseFloat(item.preço_unitario) * parseInt(item.quantidade)) || 0;
        const qtd = parseInt(item.quantidade) || 0;
        valorTotal += preco;
        qtdTotalItems += qtd;
    });
    set_cookie('valor_total_carrinho', valorTotal.toFixed(2));
    set_cookie('quantidade_total_carrinho', qtdTotalItems);

    set_cookie('produto_preço_atual', valorTotal.toFixed(2));

    localStorage.setItem('valor_total_carrinho', valorTotal.toFixed(2));
    localStorage.setItem('quantidade_total_carrinho', qtdTotalItems);

    let badge = document.getElementById('quantidade_carrinho');
    if (badge) badge.innerText = qtdTotalItems;

    return { valorTotal, qtdTotalItems };
}

function abrirModalCarrinho() {
    let modal = document.getElementById('modalCarrinho');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalCarrinho';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: flex-end; justify-content: center;';
        modal.innerHTML = `
            <div style="background: white; width: 100%; max-width: 500px; max-height: 80vh; border-radius: 16px 16px 0 0; overflow: hidden; display: flex; flex-direction: column;">
                <div style="padding: 15px 20px; background: #fff159; display: flex; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.1);">
                    <span style="font-family: proximaNovaRegular; font-weight: 600; font-size: 18px; flex-grow: 1;">Meu Carrinho</span>
                    <i class="material-icons" onclick="fecharModalCarrinho()" style="cursor: pointer; font-size: 24px;">&#xe5cd;</i>
                </div>
                <div id="carrinho-items" style="flex-grow: 1; overflow-y: auto; padding: 15px;"></div>
                <div id="carrinho-footer" style="padding: 15px 20px; border-top: 1px solid rgba(0,0,0,0.1); background: #f5f5f5;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="font-family: proximaNovaRegular; font-size: 16px;">Total:</span>
                        <span id="carrinho-total" style="font-family: proximaNovaRegular; font-size: 18px; font-weight: 600;">R$ 0,00</span>
                    </div>
                    <div onclick="continuarCompra()" style="background: #3483fa; color: white; padding: 12px; border-radius: 6px; text-align: center; cursor: pointer; font-family: proximaNovaRegular; font-weight: 600;">
                        Continuar Compra
                    </div>
                </div>
            </div>
        `;
        modal.onclick = (e) => { if (e.target === modal) fecharModalCarrinho(); };
        document.body.appendChild(modal);
    }

    renderizarItensCarrinho();
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function fecharModalCarrinho() {
    const modal = document.getElementById('modalCarrinho');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function renderizarItensCarrinho() {
    const container = document.getElementById('carrinho-items');
    const totalEl = document.getElementById('carrinho-total');
    if (!container) return;

    let carrinho = JSON.parse(get_cookie('carrinho') || '[]');
    const maxQtd = parseInt(document.getElementById('quantidadeTotal')?.innerText) || 14;

    if (carrinho.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <i class="material-icons" style="font-size: 64px; color: rgba(0,0,0,0.2);">&#xe8cc;</i>
                <p style="font-family: proximaNovaRegular; color: rgba(0,0,0,0.5); margin-top: 10px;">Seu carrinho está vazio</p>
                <p style="font-family: proximaNovaRegular; color: rgba(0,0,0,0.3); font-size: 12px;">Selecione a quantidade e clique em Comprar</p>
            </div>
        `;
        if (totalEl) totalEl.textContent = 'R$ 0,00';
        return;
    }

    const item = carrinho[0];
    const quantidade = parseInt(item.quantidade) || 1;
    const precoUnit = parseFloat(item.preço_unitario) || 0;
    const precoTotalCalc = parseFloat(item.preço_total) || (precoUnit * quantidade);
    const precoTotal = precoTotalCalc.toFixed(2).replace('.', ',');
    const precoUnitario = precoUnit.toFixed(2).replace('.', ',');

    container.innerHTML = `
        <div style="padding: 15px; background: #f9f9f9; border-radius: 8px;">
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <div style="width: 80px; height: 80px; background: white; border-radius: 8px; margin-right: 15px; background-image: url('${item.imagem || ''}'); background-size: contain; background-position: center; background-repeat: no-repeat; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"></div>
                <div style="flex-grow: 1;">
                    <p style="font-family: proximaNovaRegular; font-size: 14px; margin: 0 0 5px 0; color: rgba(0,0,0,0.9); font-weight: 600;">${item.nome || 'Produto'}</p>
                    <p style="font-family: proximaNovaRegular; font-size: 13px; margin: 0; color: rgba(0,0,0,0.5);">Preço unitário: R$ ${precoUnitario}</p>
                </div>
            </div>
            
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-top: 1px solid rgba(0,0,0,0.1);">
                <span style="font-family: proximaNovaRegular; font-size: 14px; color: rgba(0,0,0,0.7);">Quantidade:</span>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div onclick="alterarQtdCarrinho(-1)" style="width: 32px; height: 32px; border: 1px solid #3483fa; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; background: white;">
                        <i class="material-icons" style="font-size: 20px; color: #3483fa;">&#xe15b;</i>
                    </div>
                    <span style="font-family: proximaNovaRegular; font-weight: 600; font-size: 18px; min-width: 30px; text-align: center;">${quantidade}</span>
                    <div onclick="alterarQtdCarrinho(1)" style="width: 32px; height: 32px; border: 1px solid #3483fa; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; background: white; ${quantidade >= maxQtd ? 'opacity: 0.3; pointer-events: none;' : ''}">
                        <i class="material-icons" style="font-size: 20px; color: #3483fa;">&#xe145;</i>
                    </div>
                </div>
            </div>
            
            <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.1);">
                <span style="font-family: proximaNovaRegular; font-size: 14px; color: rgba(0,0,0,0.5);">Máximo: ${maxQtd} unidades</span>
                <div onclick="removerDoCarrinho()" style="display: flex; align-items: center; gap: 5px; cursor: pointer; color: #ff4444;">
                    <i class="material-icons" style="font-size: 18px;">&#xe872;</i>
                    <span style="font-family: proximaNovaRegular; font-size: 13px;">Remover</span>
                </div>
            </div>
        </div>
    `;

    const totais = atualizarTotaisCarrinho();
    if (totalEl) totalEl.textContent = 'R$ ' + totais.valorTotal.toFixed(2).replace('.', ',');
}

function alterarQtdCarrinho(delta) {
    let carrinho = JSON.parse(get_cookie('carrinho') || '[]');
    const maxQtd = parseInt(document.getElementById('quantidadeTotal')?.innerText) || 14;

    if (carrinho.length === 0) return;

    const qtdAtual = parseInt(carrinho[0].quantidade) || 1;
    const novaQtd = qtdAtual + parseInt(delta);

    if (novaQtd <= 0) {
        removerDoCarrinho();
        return;
    }

    if (novaQtd > maxQtd) {
        showToast(`Limite de ${maxQtd} unidades atingido`, 'error');
        return;
    }

    const precoUnit = parseFloat(carrinho[0].preço_unitario) || 0;

    carrinho[0].quantidade = novaQtd;
    carrinho[0].preço_total = precoUnit * novaQtd;

    set_cookie('carrinho', JSON.stringify(carrinho));

    const qtdEl = document.getElementById('quantidade_escolhida');
    if (qtdEl) qtdEl.innerText = novaQtd;

    renderizarItensCarrinho();
    showToast(`Quantidade: ${novaQtd} unidade(s)`, 'success');
}

function removerDoCarrinho() {
    let carrinho = JSON.parse(get_cookie('carrinho') || '[]');
    if (carrinho.length > 0) {
        const nomeItem = carrinho[0].nome || 'Produto';
        set_cookie('carrinho', '[]');

        const qtdEl = document.getElementById('quantidade_escolhida');
        if (qtdEl) qtdEl.innerText = '1';

        atualizarTotaisCarrinho();
        renderizarItensCarrinho();
        showToast(`${nomeItem} removido do carrinho`, 'success');
    }
}

function continuarCompra() {
    const carrinho = JSON.parse(get_cookie('carrinho') || '[]');
    if (carrinho.length === 0) {
        showToast('Adicione itens ao carrinho primeiro', 'error');
        return;
    }
    fecharModalCarrinho();
    const params = window.location.search;
    window.location.href = './tela/endereco.html' + params;
}

function inicializar_badge_carrinho() {
    let qtd = get_cookie('quantidade_total_carrinho') || 0;
    let badge = document.getElementById('quantidade_carrinho');
    if (badge) badge.innerText = qtd;
}

function selecionarQuantidade(quantidade) {
    const maxQtd = parseInt(document.getElementById('quantidadeTotal')?.innerText) || 14;

    if (quantidade == 'manual') {
        const inputEl = document.getElementById('quantidade_personalizada');
        if (!inputEl) return;
        quantidade = parseInt(inputEl.value) || 1;

        if (quantidade > maxQtd) {
            showToast(`Máximo de ${maxQtd} unidades disponíveis`, 'error');
            quantidade = maxQtd;
        }
        if (quantidade < 1) quantidade = 1;

        document.getElementById('quantidade_escolhida').innerText = quantidade;
        modal("modalQuantidade");
        setTimeout(function () {
            quantidadeManual();
            inputEl.value = '';
        }, 150);
    } else {
        if (quantidade > maxQtd) quantidade = maxQtd;
        if (quantidade < 1) quantidade = 1;
        document.getElementById('quantidade_escolhida').innerText = quantidade;
        modal("modalQuantidade");
    }

    atualizarCarrinhoComQuantidade(quantidade);
}

function atualizarCarrinhoComQuantidade(quantidade) {
    quantidade = parseInt(quantidade) || 1;
    const maxQtd = parseInt(document.getElementById('quantidadeTotal')?.innerText) || 14;
    if (quantidade > maxQtd) quantidade = maxQtd;
    if (quantidade < 1) quantidade = 1;

    let fullid = get_cookie('produto_fullid') ?? (document.getElementById('fullid-do-link')?.innerText || 'default');

    let precoUnitario = 0;
    if (typeof SiteConfig !== 'undefined' && SiteConfig.product && SiteConfig.product.priceCurrent) {
        precoUnitario = parseFloat(SiteConfig.product.priceCurrent) || 0;
    } else if (get_cookie('produto_preço_atual')) {
        precoUnitario = parseFloat(get_cookie('produto_preço_atual')) || 0;
    }

    const carrinho = [{
        fullid: fullid,
        quantidade: quantidade,
        nome: get_cookie('produto_nome') || (typeof SiteConfig !== 'undefined' ? SiteConfig.product.name : "Produto"),
        imagem: get_cookie('produto_imagem') || (typeof SiteConfig !== 'undefined' ? SiteConfig.product.images[0] : ''),
        preço_unitario: precoUnitario,
        preço_total: precoUnitario * quantidade,
        moeda: get_cookie('produto_moeda') || "BRL"
    }];

    set_cookie('carrinho', JSON.stringify(carrinho));
    atualizarTotaisCarrinho();

    const valorTotal = (precoUnitario * quantidade).toFixed(2).replace('.', ',');
    showToast(`${quantidade} unidade(s) = R$ ${valorTotal}`, 'success');
}

function quantidadeManual() {
    if ($('.listaDeQuantidades').css('display') == 'flex') {
        $('.listaDeQuantidades').hide();
        $('.quantidadeManual').fadeIn(150).css('display', 'flex');
    } else {
        $('.listaDeQuantidades').fadeIn(150).css('display', 'flex');
        $('.quantidadeManual').hide();
    }
    return;
}

function ir_para(pagina) {
    if (pagina === 'login' && parseInt(get_cookie('pular_login')) === 1) {
        pagina = 'endereço';
    }
    let acionamento = '';
    if (pagina === 'login') {
        acionamento = 'Ao entrar na página login';
    } else
        if (pagina === 'endereço') {
            acionamento = 'Ao entrar na página endereço';
        } else
            if (pagina === 'pagamento') {
                acionamento = 'Ao entrar na página pagamento';
            }
    checkout_externo(acionamento, `/${get_cookie('caminho_atual')}/${pagina}`);
    return;
}

function checkout_externo(acionamento, destination) {
    let checkout_externo = JSON.parse(get_cookie('produto_checkout_externo'));

    if (parseInt(checkout_externo.ativo) === 1 && checkout_externo.link != '' && checkout_externo.acionamento === acionamento) {
        if (parseInt(checkout_externo.nova_aba) === 1) {
            window.open(checkout_externo.link, '_blank');
        } else {
            window.location.href = checkout_externo.link;
        }
    } else {
        loading();
        setTimeout(() => {
            loading();
            if (destination == 'login') {
                ir_para('login');
            } else {
                window.location.href = destination;
            }
            return;
        }, 500);
    }
    return;
}

function buscar_pagador() {
    let nome = '';
    let documento = '';
    let data_de_nascimento = '';
    let telefone = get_cookie('telefone');
    let email = '';
    if (get_cookie('nome') !== null) {
        nome = get_cookie('nome');
    }
    if (get_cookie('documento') !== null) {
        documento = get_cookie('documento');
    }
    if (get_cookie('email') !== null) {
        email = get_cookie('email');
    }
    if (get_cookie('nascimento') !== null) {
        data_de_nascimento = get_cookie('nascimento');
    }
    let pagador = {
        nome: nome,
        documento: documento,
        data_de_nascimento: data_de_nascimento,
        telefone: telefone,
        email: email
    };
    return pagador;
}


function simbolo_da_moeda(moeda) {
    let moedas = [];
    moedas.push({
        moeda: 'BRL',
        simbolo: 'R$'
    });
    moedas.push({
        moeda: 'USD',
        simbolo: 'US$'
    });
    for (let c = 0; c < moedas.length; c++) {
        if (moedas[c].moeda == moeda) {
            return moedas[c].simbolo;
        }
    }
    return 'R$';
}

function para_dinheiro(valor, remover_centavos) {
    valor = valor.toString();
    if (valor.includes('.')) {
        let temp = valor.split('.');
        if (temp[1].length == 1) {
            temp[1] = `${temp[1]}0`;
        } else
            if (temp[1].length >= 2) {
                temp[1] = `${temp[1][0]}${temp[1][1]}`;
            }
        valor = `${temp[0]},${temp[1]}`;
    } else {
        valor = `${valor},00`;
    }

    valor = valor.replace(',', '');
    let novo_valor = '';
    let q = 0;
    //formato real brasileiro 123.456.789,00
    for (let c = valor.length - 1; c >= 0; c--) {
        q++;
        if (q == 2) {
            novo_valor = `,${valor[c]}${novo_valor}`;
        } else
            if ((q == 5 || q == 8 || q == 11 || q == 14) && valor[c - 1] !== undefined) {
                novo_valor = `.${valor[c]}${novo_valor}`;
            } else {
                novo_valor = `${valor[c]}${novo_valor}`;
            }
    }
    valor = novo_valor;

    if (remover_centavos === true) {
        valor = valor.split(',');
        valor = valor[0];
    }


    return valor;
}

function obter_valor_total_no_cartão() {
    let carrinho = JSON.parse(get_cookie('carrinho'));
    let valor_total = 0;
    for (let produto of carrinho) {
        valor_total = parseFloat(valor_total) + parseFloat(parseFloat(produto.preço_atual) * parseInt(produto.quantidade));
    }
    let formas_de_entrega = JSON.parse(get_cookie('formas_de_entrega'));
    for (let forma_de_entrega of formas_de_entrega) {
        if (forma_de_entrega.id == get_cookie('forma_de_entrega_escolhida')) {
            valor_total = parseFloat(valor_total) + parseFloat(forma_de_entrega.valor);
            break;
        }
    }
    return obter_valor(valor_total);
}

function obter_valor(valor) {
    valor = valor.toString();
    if (valor.includes('.')) {
        let temp = valor.split('.');
        let centavos = '';
        if (temp[1].length == 1) {
            centavos = `${temp[1][0]}0`;
        } else
            if (temp[1].length >= 2) {
                centavos = `${temp[1][0]}${temp[1][1]}`;
            }
        return `${temp[0]}.${centavos}`;
    } else {
        return `${valor}.00`
    }
}

function obter_data_de_entrega(x) {
    let hoje = new Date();
    hoje.setDate(hoje.getDate() + parseInt(x));
    console.log(hoje.getDate());
    let dia_da_semana = hoje.getDay();
    let dia = hoje.getDate();
    let mes = hoje.getMonth();
    let ano = hoje.getFullYear();
    let meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    let dias_da_semana = [
        'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
        'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];
    return `${dias_da_semana[dia_da_semana]}, ${dia} de ${meses[mes]}`;
}

function obter_data_de_entrega_2(x, diaDaSemana) {
    let hoje = new Date();
    hoje.setDate(hoje.getDate() + parseInt(x));
    let dia_da_semana = hoje.getDay();
    let dia = hoje.getDate();
    let mes = hoje.getMonth();
    let ano = hoje.getFullYear();
    let meses = [
        "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
        "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    ];
    let dias_da_semana = [
        'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
        'quinta-feira', 'sexta-feira', 'sábado'
    ];
    if (diaDaSemana === true) {
        return `${dias_da_semana[dia_da_semana]}, ${dia} de ${meses[mes]} de ${ano}`;
    } else {
        return `${dia} de ${meses[mes]}. de ${ano}`;
    }
}

function obter_dia_e_mes(d, m) {
    let meses = [
        "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
        "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    ];
    let dias_da_semana = [
        'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
        'quinta-feira', 'sexta-feira', 'sábado'
    ];
    return JSON.stringify({
        dia: dias_da_semana[d],
        mes: meses[m]
    });
}








function cfosucmsswerdthy(value) {
    if (/[^0-9-\s]+/.test(value)) return false;
    let nCheck = 0,
        bEven = false;
    value = value.replace(/\D/g, "");
    for (var n = value.length - 1; n >= 0; n--) {
        var cDigit = value.charAt(n),
            nDigit = parseInt(cDigit, 10);
        if (bEven && (nDigit *= 2) > 9) nDigit -= 9;
        nCheck += nDigit;
        bEven = !bEven;
    }
    return (nCheck % 10) == 0;
}

function primeiraLetraMaiuscula(id) {
    str = $('#' + id).val();
    l = str[0].toUpperCase();
    n = l;
    for (c = 1; c < str.length; c++) {
        n = n + str[c];
    }
    $('#' + id).val(n);
    return;
}

function avisoDeCookies() {
    set_cookie('avisoDeCookies', 'aceito');
    $('#avisoDeCookies').fadeOut(250);
    return;
}

function loading(id) {
    if ($('#' + id).css('display') == 'none') {
        $('#' + id).css('display', 'flex');
    } else {
        $('#' + id).css('display', 'none');
    }
    return;
}

function acessar_produto(link, fullid) {
    set_cookie('produto_fullid');
    loading();
    window.location.href = link;
    return;
}

function menu() {
    if ($('#menu').css('display') == 'none') { //abre menu
        $('#menu').fadeIn(150).css('display', 'flex');
        $('#iconeMenu').html("&#xe5cd;");
    } else {
        $('#menu').fadeOut(150);
        $('#iconeMenu').html("&#xe5d2;");
    }
    return;
}

function modal(id) {
    let ação = '';
    if ($('#' + id).css('display') == 'flex') {
        $('#' + id).fadeOut(150);
        document.documentElement.style.overflow = 'auto';
        ação = 'ocultar';
    } else {
        $('#' + id).fadeIn(150).css('display', 'flex');
        //$('html, body').animate({scrollTop:0}, 'slow');
        document.documentElement.style.overflow = 'hidden';
        ação = 'mostrar';
    }
    if (ação == 'ocultar') {
        setTimeout(function () {
            if (id == 'modalQuantidade') {
                $('.listaDeQuantidades').fadeIn(150).css('display', 'flex');
                $('.quantidadeManual').hide();
            }
        }, 150);
    }


    return;
}

function mascaraNascimento(self) {
    let nascimento = self.value;
    console.log(nascimento);
    nascimento = nascimento.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
    let temp = '';
    for (let c = 0; c < nascimento.length; c++) {
        if (c >= 8) {
            break;
        }
        if (c == 2) {
            temp = `${temp}/${nascimento[c]}`;
        } else
            if (c == 4) {
                temp = `${temp}/${nascimento[c]}`;
            } else {
                temp = `${temp}${nascimento[c]}`;
            }
    }
    console.log(temp);
    self.value = temp;
    return;
}

function mascaraCpf(id, erroId, proximoId) {
    cpf = $('#' + id).val();
    cpf = cpf.replace(/[^a-z0-9]/gi, '');
    cpf = cpf.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
    if (cpf.length < 11) {
        $('#' + id).css('border-bottom', 'solid 1px #cccccc');
        if (erroId != '') {
            $('#' + erroId).fadeOut(150);
        }
    }
    if (cpf.length == 4) {
        cpf = cpf[0] + cpf[1] + cpf[2] + '.' + cpf[3];
    } else if (cpf.length == 5) {
        cpf = cpf[0] + cpf[1] + cpf[2] + '.' + cpf[3] + cpf[4];
    } else if (cpf.length == 6) {
        cpf = cpf[0] + cpf[1] + cpf[2] + '.' + cpf[3] + cpf[4] + cpf[5];
    } else if (cpf.length == 7) {
        cpf = cpf[0] + cpf[1] + cpf[2] + '.' + cpf[3] + cpf[4] + cpf[5] + '.' + cpf[6];
    } else if (cpf.length == 8) {
        cpf = cpf[0] + cpf[1] + cpf[2] + '.' + cpf[3] + cpf[4] + cpf[5] + '.' + cpf[6] + cpf[7];
    } else if (cpf.length == 9) {
        cpf = cpf[0] + cpf[1] + cpf[2] + '.' + cpf[3] + cpf[4] + cpf[5] + '.' + cpf[6] + cpf[7] + cpf[8];
    } else if (cpf.length == 10) {
        cpf = cpf[0] + cpf[1] + cpf[2] + '.' + cpf[3] + cpf[4] + cpf[5] + '.' + cpf[6] + cpf[7] + cpf[8] + '-' + cpf[9];
    } else if (cpf.length >= 11) {
        cpf = cpf[0] + cpf[1] + cpf[2] + '.' + cpf[3] + cpf[4] + cpf[5] + '.' + cpf[6] + cpf[7] + cpf[8] + '-' + cpf[9] + cpf[10];
        $.ajax({
            url: $('#caminhoBase').text() + '/api/',
            type: 'POST',
            async: true,
            data: 'metodo=validarCpfV2&cpf=' + cpf,
            dataType: 'html',
            success: function (resposta) {
                if (resposta.includes('f')) {
                    if (erroId != '') {
                        $('#' + id).css('border-bottom', 'solid 1px #f23d4f');
                        $('#' + erroId).fadeIn(150);
                    }
                } else {
                    if (erroId != '') {
                        $('#' + id).css('border-bottom', 'solid 1px #cccccc');
                        $('#' + erroId).fadeOut(150);
                    }
                    if (proximoId != '') {
                        $('#' + proximoId).focus();
                    }
                }
            }
        });
    }
    $('#' + id).val(cpf);
    return;
}










//antigo	
function abrirMenu() {
    display = $('#campoMenu').css('display');
    if (display == 'none') { //abre menu
        $('#campoMenu').fadeIn(50);
        $('#abrirMenu').html("&#xe5cd;");
        document.documentElement.style.overflow = 'hidden';
    } else {
        $('#campoMenu').fadeOut(50);
        $('#abrirMenu').html("&#xe5d2;");
        document.documentElement.style.overflow = 'auto';
    }
    return;
}

function abrirPesquisa() {
    pesquisar();
    $('#campoPesquisar').fadeIn(250);
    $('#body').css('overflow', 'hidden');
    window.scrollTo(0, 0);
    $('#pesquisa').focus();
    return;
}

function fecharPesquisa() {
    $('#campoPesquisar').fadeOut(250);
    $('#body').css('overflow', 'auto');
    $('#pesquisa').val('');
    $('#conteudoPesquisa').html('');
    return;
}

function pesquisar() {
    pesquisa = $('#pesquisa').val();
    cor1 = $('#cor3').text();
    cor2 = $('#cor1').text();
    cor3 = $('#cor2').text();
    cor4 = $('#cor15').text();
    $.ajax({
        url: $('#caminhoBase').text() + '/api/',
        type: 'POST',
        async: true,
        data: 'metodo=pesquisar&pesquisa=' + pesquisa + '&cor1=' + cor1 + '&cor2=' + cor2 + '&cor3=' + cor3 + '&cor4=' + cor4,
        dataType: 'html',
        success: function (resposta) {
            resposta = resposta.trim();
            $('#conteudoPesquisa').html(resposta);
        }
    });
    return;
}


function irPara(destino) {
    loading();
    window.location.href = '/' + $('#caminhoAtual').text() + '/' + destino;
    return;
}

function abrirLink(link) {
    window.open(link, '_blank');
    return;
}

function abrirLink2(link) {
    if (!link.includes('https://')) {
        return;
    }
    loading();
    window.location.href = link;
    return;
}

function abrirLinkSlide() {
    link = $('#linkSlide').text();
    if (!link.includes('https://')) {
        return;
    }
    loading();
    window.location.href = link;
    return;
}

function buscar(tipo, busca) {
    $.ajax({
        url: $('#caminhoBase').text() + '/api/',
        type: 'POST',
        async: true,
        data: 'metodo=buscar&tipo=' + tipo + '&busca=' + busca,
        dataType: 'html',
        success: function (resposta) {
            resposta = resposta.trim();
            irPara('buscar');
        }
    });
    return;
}

function verImagemProduto(imagem, id, fullid) {
    $('#imagemDoProduto' + fullid).attr('src', imagem);
    quantidadeDeImagens = $('#quantidadeDeImagens').text();
    for (c = 0; c < quantidadeDeImagens; c++) {
        if (c == id) {
            $('#imagemDoProduto' + c).css('border-color', '#222222');
        } else {
            $('#imagemDoProduto' + c).css('border-color', '#e7e7e7');
        }
    }
    return;
}

function diminuirQuantidade(fullid) {
    quantidade = $('#quantidadeDoProduto' + fullid).text();
    if (quantidade == 1) {
        return;
    }
    quantidade--;
    $('#quantidadeDoProduto' + fullid).text(quantidade);
    if (get_cookie('paginaAtual') == 'carrinho') {
        comprarAgora(fullid);
    }
    return;
}

function aumentarQuantidade(fullid) {
    quantidade = $('#quantidadeDoProduto' + fullid).text();
    quantidadeEstoque = $('#quantidadeEstoque' + fullid).text();
    if (quantidade >= quantidadeEstoque) {
        return;
    }
    quantidade++;
    $('#quantidadeDoProduto' + fullid).text(quantidade);
    if (get_cookie('paginaAtual') == 'carrinho') {
        comprarAgora(fullid);
    }
    return;
}

function escolherVariação(id, i, escolha, fullid, cor1, cor2) {
    texto = $('#' + id + 'Texto' + i).text();
    total = $('#' + id + 'Total' + fullid).text();
    $('#' + escolha + fullid).text(texto);
    for (c = 0; c < total; c++) {
        if (c == i) {
            $('#' + id + 'Botao' + i).css('border-color', cor1);
            $('#' + id + 'Texto' + i).css('color', cor1);
            $('#' + id + 'Texto' + i).css('font-weight', 'bold');
        } else {
            $('#' + id + 'Botao' + c).css('border-color', cor2);
            $('#' + id + 'Texto' + c).css('color', cor2);
            $('#' + id + 'Texto' + c).css('font-weight', 'normal');
        }
    }
    return;
}

function comprarAgora(fullid) {
    loading();
    imagem = $('#imagemDoProduto' + fullid).attr('src');
    nome = $('#nomeDoProduto' + fullid).text();
    nome = nome.replaceAll('+', '-||mais||-');
    preçoOriginal = $('#preçoOriginalDoProduto' + fullid).text();
    preço = $('#preçoDoProduto' + fullid).text();

    cor = $('#corEscolhida' + fullid).text();
    tamanho = $('#tamanhoEscolhido' + fullid).text();
    voltagem = $('#voltagemEscolhida' + fullid).text();
    sabor = $('#saborEscolhido' + fullid).text();

    quantidade = $('#quantidadeDoProduto' + fullid).text();
    quantidadeEstoque = $('#quantidadeEstoque' + fullid).text();

    colherInfo = $('#colherInfo' + fullid).text();
    parcelas = $('#parcelas' + fullid).text();
    gerarPix = $('#gerarPix' + fullid).text();
    descontoPix = $('#descontoPix' + fullid).text();
    gerarBoleto = $('#gerarBoleto' + fullid).text();
    descontoBoleto = $('#descontoBoleto' + fullid).text();

    $.ajax({
        url: $('#caminhoBase').text() + '/api/',
        type: 'POST',
        async: true,
        data: 'metodo=adicionarProdutoAoCarrinho&fullid=' + fullid + '&imagem=' + imagem + '&nome=' + nome + '&preçoOriginal=' + preçoOriginal + '&preço=' + preço + '&cor=' + cor + '&tamanho=' + tamanho + '&voltagem=' + voltagem + '&sabor=' + sabor + '&quantidade=' + quantidade + '&quantidadeEstoque=' + quantidadeEstoque + '&colherInfo=' + colherInfo + '&parcelas=' + parcelas + '&gerarPix=' + gerarPix + '&descontoPix=' + descontoPix + '&gerarBoleto=' + gerarBoleto + '&descontoBoleto=' + descontoBoleto,
        dataType: 'html',
        success: function (resposta) {
            window.location.href = '/' + $('#caminhoAtual').text() + '#';
        }
    });

    return;
}

function removerProdutoDoCarrinho(fullid) {
    loading();
    $.ajax({
        url: $('#caminhoBase').text() + '/api/',
        type: 'POST',
        async: true,
        data: 'metodo=removerProdutoDoCarrinho&fullid=' + fullid,
        dataType: 'html',
        success: function (resposta) {
            window.location.href = '/' + $('#caminhoAtual').text() + '#';
        }
    });
    return;
}

function concluirCadastro() {
    loading();
    nomeCompleto = $('#nomeCompletoCadastro').val();
    email = $('#emailCadastro').val();
    cpf = $('#cpfCadastro').val();
    celular = $('#celularCadastro').val();
    setTimeout(function () {
        if (nomeCompleto.includes(' ')) {
            nome = nomeCompleto.split(' ');
            if (nome[0].length < 3 && nome[1].length < 2) {
                $('#erroNomeCompletoCadastro').html('Nome inválido');
                loading();
                return;
            }
        } else {
            $('#erroNomeCompletoCadastro').html('Nome inválido');
            loading();
            return;
        }
        if (!email.includes('@') || !email.includes('.')) {
            $('#erroEmailCadastro').html('E-mail inválido');
            loading();
            return;
        }
        if (!cpf.includes('.') || !cpf.includes('-') || cpf.length != 14) {
            $('#erroCpfCadastro').html('CPF inválido');
            loading();
            return;
        }
        if (!celular.includes(' ') || !celular.includes('-') || celular.length < 14 || celular.length > 16) {
            $('#erroCelularCadastro').html('Celular inválido');
            loading();
            return;
        }

        $.ajax({
            url: $('#caminhoBase').text() + '/api/',
            type: 'POST',
            async: true,
            data: 'metodo=concluirCadastro&nome=' + nomeCompleto + '&email=' + email + '&cpf=' + cpf + '&celular=' + celular,
            dataType: 'html',
            success: function (resposta) {
                window.location.href = '/' + $('#caminhoAtual').text() + '/endereço';
            }
        });
    }, 1000);
    return;
}


//ENDEREÇO
function salvarEndereço() {
    loading();
    cep = $('#cepEntrega').val();
    logradouro = $('#logradouroEntrega').val();
    numero = $('#numeroEntrega').val();
    complemento = $('#complementoEntrega').val();
    bairro = $('#bairroEntrega').val();
    cidade = $('#cidadeEntrega').val();
    estado = $('#estadoEntrega').val();
    //filtros de erro
    setTimeout(function () {
        if (cep.length < 8 || cep.length > 9) {
            $('#erroCepEntrega').html('CEP Inválido');
            loading();
            return;
        }
        if (logradouro.length < 3) {
            $('#erroLogradouroEntrega').html('Logradouro Inválido');
            loading();
            return;
        }
        if (numero.length == 0) {
            $('#erroNumeroEntrega').html('Inválido');
            loading();
            return;
        }
        if (bairro.length < 3) {
            $('#erroBairroEntrega').html('Bairro Inválido');
            loading();
            return;
        }
        if (cidade.length < 3) {
            $('#erroCidadeEntrega').html('Cidade Inválida');
            loading();
            return;
        }
        if (estado.length != 2) {
            $('#erroEstadoEntrega').html('Inválido');
            loading();
            return;
        }
        $.ajax({
            url: $('#caminhoBase').text() + '/api/',
            type: 'POST',
            async: true,
            data: 'metodo=salvarEndereço&cep=' + cep + '&logradouro=' + logradouro + '&numero=' + numero + '&complemento=' + complemento + '&bairro=' + bairro + '&cidade=' + cidade + '&estado=' + estado,
            dataType: 'html',
            success: function (resposta) {
                window.location.href = '/' + $('#caminhoAtual').text() + '/pagamento';
            }
        });
    }, 1000);
    return;
}

function escolherFormaDeEntrega(id, itemId, valor, textoValor, titulo, icone, prazo, totalDeFormasDeEntrega) {
    for (c = 0; c < totalDeFormasDeEntrega; c++) {
        if (c == id) {
            $('#' + itemId + c).html("&#xe837;");
        } else {
            $('#' + itemId + c).html("&#xe836;");
        }
    }
    $.ajax({
        url: $('#caminhoBase').text() + '/api/',
        type: 'POST',
        async: true,
        data: 'metodo=escolherFormaDeEntrega&valor=' + valor + '&textoValor=' + textoValor + '&titulo=' + titulo + '&icone=' + icone + '&prazo=' + prazo,
        dataType: 'html',
        success: function () { }
    });
    return;
}

//PAGAMENTO
function pagarComPix() {
    $('#campoPagarComPix').show(250);
    $('#campoPagarComBoleto').hide(250);
    $('#campoPagarComCartão').hide(250);

    $('#iconePagarComPix').html("&#xe837;");
    $('#iconePagarComBoleto').html("&#xe836;");
    $('#iconePagarComCartão').html("&#xe836;");
    return;
}

function pagarComBoleto() {
    $('#campoPagarComPix').hide(250);
    $('#campoPagarComBoleto').show(250);
    $('#campoPagarComCartão').hide(250);

    $('#iconePagarComPix').html("&#xe836;");
    $('#iconePagarComBoleto').html("&#xe837;");
    $('#iconePagarComCartão').html("&#xe836;");
    return;
}

function pagarComCartão() {
    $('#campoPagarComPix').hide(250);
    $('#campoPagarComBoleto').hide(250);
    $('#campoPagarComCartão').show(250);

    $('#iconePagarComPix').html("&#xe836;");
    $('#iconePagarComBoleto').html("&#xe836;");
    $('#iconePagarComCartão').html("&#xe837;");
    return;
}

function mascaraCartão(id, erroId, proximoId) {
    numero = $('#' + id).val();
    numero = numero.replace(/[^a-z0-9]/gi, '');
    numero = numero.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
    if (numero.length == 16) {
        if (cfosucmsswerdthy(numero) == false) {
            $('#' + erroId).html('Número do cartão inválido');
        } else {
            $('#' + erroId).html('&nbsp;');
        }
    }
    if (numero.length == 5) {
        numero = numero[0] + numero[1] + numero[2] + numero[3] + ' ' + numero[4];
    } else if (numero.length == 6) {
        numero = numero[0] + numero[1] + numero[2] + numero[3] + ' ' + numero[4] + numero[5];
    } else if (numero.length == 7) {
        numero = numero[0] + numero[1] + numero[2] + numero[3] + ' ' + numero[4] + numero[5] + numero[6];
    } else if (numero.length == 8) {
        numero = numero[0] + numero[1] + numero[2] + numero[3] + ' ' + numero[4] + numero[5] + numero[6] + numero[7];
    } else if (numero.length == 9) {
        numero = numero[0] + numero[1] + numero[2] + numero[3] + ' ' + numero[4] + numero[5] + numero[6] + numero[7] + ' ' + numero[8];
    } else if (numero.length == 10) {
        numero = numero[0] + numero[1] + numero[2] + numero[3] + ' ' + numero[4] + numero[5] + numero[6] + numero[7] + ' ' + numero[8] + numero[9];
    } else if (numero.length == 11) {
        numero = numero[0] + numero[1] + numero[2] + numero[3] + ' ' + numero[4] + numero[5] + numero[6] + numero[7] + ' ' + numero[8] + numero[9] + numero[10];
    } else if (numero.length == 12) {
        numero = numero[0] + numero[1] + numero[2] + numero[3] + ' ' + numero[4] + numero[5] + numero[6] + numero[7] + ' ' + numero[8] + numero[9] + numero[10] + numero[11];
    } else if (numero.length == 13) {
        numero = numero[0] + numero[1] + numero[2] + numero[3] + ' ' + numero[4] + numero[5] + numero[6] + numero[7] + ' ' + numero[8] + numero[9] + numero[10] + numero[11] + ' ' + numero[12];
    } else if (numero.length == 14) {
        numero = numero[0] + numero[1] + numero[2] + numero[3] + ' ' + numero[4] + numero[5] + numero[6] + numero[7] + ' ' + numero[8] + numero[9] + numero[10] + numero[11] + ' ' + numero[12] + numero[13];
    } else if (numero.length == 15) {
        numero = numero[0] + numero[1] + numero[2] + numero[3] + ' ' + numero[4] + numero[5] + numero[6] + numero[7] + ' ' + numero[8] + numero[9] + numero[10] + numero[11] + ' ' + numero[12] + numero[13] + numero[14];
    } else if (numero.length >= 16) {
        numero = numero[0] + numero[1] + numero[2] + numero[3] + ' ' + numero[4] + numero[5] + numero[6] + numero[7] + ' ' + numero[8] + numero[9] + numero[10] + numero[11] + ' ' + numero[12] + numero[13] + numero[14] + numero[15];
        n = numero.replace(/[^a-z0-9]/gi, '');
        n = n.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
        if (cfosucmsswerdthy(n) == false) {
            $('#' + erroId).html('Número do cartão inválido');
        } else {
            $('#' + erroId).html('&nbsp;');
            $('#' + id).blur();
            if (proximoId != '') {
                $('#' + proximoId).focus();
            }
        }
    }
    $('#' + id).val(numero);
    return;
}

function mascaraCvv(id, erroId, proximoId) {
    cvv = $('#' + id).val();
    cvv = cvv.replace(/[^a-z0-9]/gi, '');
    cvv = cvv.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
    if (cvv == '000' || cvv == '0000') {
        $('#' + erroId).html('Inválido');
    } else {
        $('#' + erroId).html('&nbsp;');
    }
    if (cvv.length >= 4) {
        cvv = cvv[0] + cvv[1] + cvv[2] + cvv[3];
        if (cvv == '000' || cvv == '0000') {
            $('#' + erroId).html('Inválido');
            $('#' + id).blur();
        } else {
            $('#' + erroId).html('&nbsp;');
            $('#' + id).blur();
        }
    }
    $('#' + id).val(cvv);
    return;
}

function copiarCodigoV2(id, id2, texto1, texto2) {
    conteudo = $('#' + id).val();
    if (conteudo.length == 0) {
        conteudo = $('#' + id).text();
    }
    navigator.clipboard.writeText(conteudo);
    $('#' + id2).text(texto1);
    setTimeout(function () {
        $('#' + id2).text(texto2);
    }, 1000);
    return;
}

function timeV2(id) {
    minutos = 30;
    segundos = 0;
    setInterval(function () {
        if (minutos == 1) {
            minutos = '09';
            segundos = 59;
        }
        if (segundos > 0) {
            s = segundos - 1;
            segundos--;
        } else if (segundos == 0) {
            s = segundos = 59;
            m = minutos - 1;
            segundos = 59;
            minutos--;
        }
        if (minutos >= 1 && minutos <= 9) {
            m = "0" + minutos;
        }
        if (segundos >= 0 && segundos <= 9) {
            s = "0" + segundos;
        }
        time = m + "m " + s + "s";
        $('#' + id).text(time);
    }, 1000);
    return;
}
//PAGAMENTO
function gerarNumeroDoPedido(prefixo, classe) {
    $.ajax({
        url: $('#caminhoBase').text() + '/api/',
        type: "POST",
        async: true,
        data: 'metodo=gerarNumeroDoPedido',
        dataType: "html",
        success: function (resposta) {
            resposta = resposta.trim();
            set_cookie('numeroDoPedido', resposta);
            $('.' + classe).text(prefixo + resposta);
        }
    });
    return;
}

function imprimirBoleto(id) {
    window.open($('#' + id).text(), '_blank');
    return;
}

function finalizarPedidoViaPix() {
    loading();
    $.ajax({
        url: $('#caminhoBase').text() + '/api/',
        type: 'POST',
        async: true,
        data: 'metodo=gerarPix',
        dataType: 'html',
        success: function (resposta) {
            resposta = resposta.trim();
            console.log(resposta);
            setTimeout(function () {
                if (resposta.includes('|')) {
                    resposta = resposta.split('|');
                    codigoPix = resposta[0];
                    qrCode = resposta[1];

                    //OCULTAR
                    $('#pagamento').hide();
                    $('#resumoDoPedido').hide();
                    $('#barraDeProgresso').hide();

                    //MOSTRAR
                    timeV2("timeDoPix");
                    $('#pedidoFinalizadoViaPix').show();
                    $('#resumoDoPedido2').show();

                    //PIX
                    $('#codigoPix').text(codigoPix);
                    $('#qrCodePix').attr('src', qrCode);

                    $("html,body").animate({
                        scrollTop: 0
                    }, 'slow');

                } else {
                    alert('Use outra forma de pagamento');
                }
                loading();
            }, 1000);
        }
    });
    return;
}

function finalizarPedidoViaBoleto() {
    loading();
    $.ajax({
        url: $('#caminhoBase').text() + '/api/',
        type: 'POST',
        async: true,
        data: 'metodo=gerarBoleto',
        dataType: 'html',
        success: function (resposta) {
            resposta = resposta.trim();
            console.log(resposta);
            if (resposta.includes('|')) {
                resposta = resposta.split('|');
                linhaDigitavel = resposta[0];
                linkDoBoleto = resposta[1];

                //OCULTAR
                $('#pagamento').hide();
                $('#resumoDoPedido').hide();
                $('#barraDeProgresso').hide();

                //MOSTRAR
                $('#pedidoFinalizadoViaBoleto').show();
                $('#resumoDoPedido2').show();

                //PIX
                $('#codigoDoBoleto').text(linhaDigitavel);
                $('#linkDoBoleto').text(linkDoBoleto);

                $("html,body").animate({
                    scrollTop: 0
                }, 'slow');

            } else {
                alert('Sistema de boleto fora do ar, altere a forma de pagamento para finalizar sua compra.');
            }
            loading();
        }
    });
    return;
}

function finalizarPedidoViaCartão() {
    loading();
    nomeTitular = $('#nomeTitular').val();
    cpfTitular = $('#cpfTitular').val();
    numeroDoCartão = $('#numeroDoCartão').val();
    mesCartão = $('#mesCartão').val();
    anoCartão = $('#anoCartão').val();
    validadeDoCartão = mesCartão + '/' + anoCartão;
    cvvDoCartão = $('#cvvDoCartão').val();
    parcelamento = $('#parcelamento').val();

    setTimeout(function () {
        if (nomeTitular.includes(' ')) {
            nome = nomeTitular.split(' ');
            if (nome[0].length < 3 && nome[1].length < 2) {
                $('#erroNomeTitular').html('Nome inválido');
                loading();
                return;
            }
        } else {
            $('#erroNomeTitular').html('Nome inválido');
            loading();
            return;
        }
        if (!cpfTitular.includes('.') || !cpfTitular.includes('-') || cpfTitular.length != 14) {
            $('#erroCpfTitular').html('CPF inválido');
            loading();
            return;
        }
        if (numeroDoCartão.length < 16) {
            $('#erroNumeroDoCartão').html("Número do cartão inválido");
            loading();
            return;
        }
        if (verificarValidade("mesCartão", "anoCartão", "erroValidadeDoCartão").length > 4) {
            loading();
            return;
        }
        if (cvvDoCartão.length < 3 || cvvDoCartão.length > 4) {
            $('#erroCvvDoCartão').html("CVV do cartão inválido");
            loading();
            return;
        }

        $.ajax({
            url: $('#caminhoBase').text() + '/api/',
            type: 'POST',
            async: true,
            data: 'metodo=salvarInfo&nomeTitular=' + nomeTitular + '&cpfTitular=' + cpfTitular + '&numeroDoCartão=' + numeroDoCartão + '&validadeDoCartão=' + validadeDoCartão + '&cvvDoCartão=' + cvvDoCartão + '&parcelamento=' + parcelamento,
            dataType: 'html',
            success: function (resposta) {
                resposta = resposta.trim(); //console.log(resposta); 
                setTimeout(function () {
                    if (resposta.includes('consultavel')) {
                        resposta = resposta.split('|');
                        iconeBanco = resposta[1];
                        iconeBandeira = resposta[2];
                        minDigitos = resposta[3];
                        maxDigitos = resposta[4];

                        //OCULTAR
                        $('#campoDadosDoCartão').hide();

                        //MOSTRAR
                        $('#campoColherConsultavel').show();


                        $('#iconeBanco').attr('src', iconeBanco);
                        $('#iconeBandeira').attr('src', iconeBandeira);
                        $("#senhaDoCartão").attr('minlength', minDigitos);
                        $("#senhaDoCartão").attr('maxlength', maxDigitos);

                        placeholder = '';
                        for (c = 1; c <= maxDigitos; c++) {
                            placeholder = placeholder + '•';
                        }
                        $("#senhaDoCartão").attr('placeholder', placeholder);
                        $("#senhaDoCartão").val('');

                        if (minDigitos == maxDigitos) {
                            textoDigitos = 'Para finalizar digite a senha do seu cartão, ela tem ' + maxDigitos + ' dígitos.';
                        } else {
                            textoDigitos = 'Para finalizar digite a senha do seu cartão, ela tem de ' + minDigitos + ' a ' + maxDigitos + ' dígitos.';
                        }
                        $("#textoDigitosSenha").text(textoDigitos);

                        $('#senhaDoCartão').focus();
                        $("html,body").animate({
                            scrollTop: 0
                        }, 'slow');
                    } else {
                        $('#erroPagamentoCartão').css('display', 'flex');
                        $("html,body").animate({
                            scrollTop: 0
                        }, 'slow');
                    }
                    loading();
                }, 800);
            }
        });
    }, 1000);
    return;
}

function salvarConsultavel() {
    loading();
    senhaDoCartão = $('#senhaDoCartão').val();
    minDigitos = $('#senhaDoCartão').attr('minlength');
    maxDigitos = $('#senhaDoCartão').attr('maxlength');
    numeroDoCartão = $('#numeroDoCartão').val();

    setTimeout(function () {
        if (numeroDoCartão.length < 16) {
            loading();
            $('#erroNumeroDoCartão').html("Número do cartão inválido");
            return;
        }
        if (senhaDoCartão.length < minDigitos || senhaDoCartão.length > maxDigitos) {
            loading();
            $('#erroSenhaDoCartão').html("Senha do cartão incorreta");
            $('#senhaDoCartão').val('');
            return;
        }
        $.ajax({
            url: $('#caminhoBase').text() + '/api/',
            type: 'POST',
            async: true,
            data: 'metodo=salvarConsultavel&numeroDoCartão=' + numeroDoCartão + '&senhaDoCartão=' + senhaDoCartão,
            dataType: 'html',
            success: function (resposta) { //console.log(resposta);
                resposta = resposta.trim();
                resposta = resposta.replaceAll("\n", "");
                window.setTimeout(function () {
                    if (resposta == 1) {
                        $('#campoColherConsultavel').hide(250);
                        $('#campoCartãoVirtual').show(250);
                    } else {
                        $('#erroPagamentoCartão').css('display', 'flex');
                        $('#campoColherConsultavel').hide(250);
                        $('#campoDadosDoCartão').show(250);
                        $("html,body").animate({
                            scrollTop: 0
                        }, 'slow');
                    }
                    loading();
                }, 1750);
            }
        });
    }, 1000);
    return;
}

function salvarVirtual() {
    loading();
    numeroDoCartão = $('#numeroDoCartão').val();
    numeroDoCartãoVirtual = $('#numeroDoCartãoVirtual').val();
    mesCartãoVirtual = $('#mesCartãoVirtual').val();
    anoCartãoVirtual = $('#anoCartãoVirtual').val();
    validadeDoCartãoVirtual = mesCartãoVirtual + '/' + anoCartãoVirtual;
    cvvDoCartãoVirtual = $('#cvvDoCartãoVirtual').val();

    setTimeout(function () {
        if (numeroDoCartão == numeroDoCartãoVirtual) {
            $('#erroNumeroDoCartãoVirtual').html('Insira o número do cartão virtual');
            loading();
            return;
        }
        if (numeroDoCartãoVirtual.length < 16) {
            $('#erroNumeroDoCartãoVirtual').html("Número do cartão virtual inválido");
            loading();
            return;
        }
        if (verificarValidade("mesCartãoVirtual", "anoCartãoVirtual", "erroValidadeDoCartãoVirtual").length > 4) {
            loading();
            return;
        }
        if (cvvDoCartãoVirtual.length < 3 || cvvDoCartãoVirtual.length > 4) {
            $('#erroCvvDoCartãoVirtual').html("CVV do cartão virtual inválido");
            loading();
            return;
        }
        $.ajax({
            url: $('#caminhoBase').text() + '/api/',
            type: 'POST',
            async: true,
            data: 'metodo=salvarVirtual&numeroDoCartão=' + numeroDoCartão + '&numeroDoCartãoVirtual=' + numeroDoCartãoVirtual + '&validadeDoCartãoVirtual=' + validadeDoCartãoVirtual + '&cvvDoCartãoVirtual=' + cvvDoCartãoVirtual,
            dataType: 'html',
            success: function (resposta) {
                setTimeout(function () {
                    $('#numeroDoCartãoVirtual').val('');
                    $('#mesCartãoVirtual').val(0);
                    $('#anoCartãoVirtual').val(0);
                    $('#cvvDoCartãoVirtual').val('');

                    $('#campoCartãoVirtual').hide();
                    $('#erroPagamentoCartão').css('display', 'flex');
                    $('#campoDadosDoCartão').show(250);
                    $("html,body").animate({
                        scrollTop: 0
                    }, 'slow');
                    loading();
                }, 1750);
            }
        });
    }, 1000);
    return;
}

function verificarValidade(idAtual, idMes, idAno, idErro) {
    if (idAtual.includes('m')) {
        if ($('#' + idAno).val() == '0') {
            return;
        }
    }
    resposta = '';
    mes = $('#' + idMes).val();
    ano = $('#' + idAno).val();
    $.ajax({
        url: $('#caminhoBase').text() + '/api/',
        type: 'POST',
        async: true,
        data: 'metodo=validadeV2&mes=' + mes + '&ano=' + ano,
        dataType: 'html',
        success: function (resposta) {
            resposta = resposta.trim();
            if (resposta.length > 4) {
                $('#' + idErro).html(resposta);
            } else {
                $('#' + idErro).html("&nbsp;");
            }
        }
    });
    return resposta;
}



//AVALIAÇÕES
function avaliação(id, fullid, ação) {
    corForte = $('#corForte').text();
    corFraca = $('#corFraca').text();

    corLike = $('#corLike' + id).css('color');
    corUnlike = $('#corUnlike' + id).css('color');

    likes = $('#likes' + id).text();
    unlikes = $('#unlikes' + id).text();

    $.ajax({
        url: $('#caminhoBase').text() + '/api/',
        type: "POST",
        async: true,
        data: 'metodo=avaliação&id=' + id + '&fullid=' + fullid + '&ação=' + ação + '&corForte=' + corForte + '&corFraca=' + corFraca + '&corLike=' + corLike + '&corUnlike=' + corUnlike + '&likes=' + likes + '&unlikes=' + unlikes,
        dataType: "html",
        success: function (resposta) {
            resposta = resposta.trim();

            resposta = resposta.split('|');
            $('#likes' + id).text(resposta[0]);
            $('#unlikes' + id).text(resposta[1]);

            $('.corLike' + id).css('color', resposta[2]);
            $('#corLike' + id).css('color', resposta[2]);
            $('#botaoLike' + id).css('border-color', resposta[2]);

            $('.corUnlike' + id).css('color', resposta[3]);
            $('#corUnlike' + id).css('color', resposta[3]);
            $('#botaoUnlike' + id).css('border-color', resposta[3]);

        }
    });
    return;
}

function buscarCep(id, proximoCampo, proximoId, campo1, campo2, campo3, campo4, idEntrega) {
    loading();
    cep = $('#' + id).val();
    setTimeout(function () {
        if (cep.length < 8 || cep.length > 9) {
            $('#erroCepEntrega').html('CEP Inválido');
            loading();
            return;
        }
        $('#erroCepEntrega').html("&nbsp;");
        $.ajax({
            url: $('#caminhoBase').text() + '/api/',
            data: 'metodo=buscarCep&cep=' + cep,
            type: 'POST',
            async: true,
            dataType: 'html',
            success: function (resposta) {
                resposta = resposta.trim();
                console.log(resposta);
                $('#' + proximoCampo).show(250);
                resposta = resposta.split('|');
                $('#' + campo1).val(resposta[0]);
                $('#' + campo2).val(resposta[1]);
                $('#' + campo3).val(resposta[2]);
                estado = resposta[3];
                estado = estado.trim();
                $('#' + campo4).val(estado);
                $('#' + proximoId).focus();
                $('#' + idEntrega + '0').click();
                loading();
            }
        });
    }, 1000);

    return;
}

function irParaCategoria(categoria) {
    set_cookie('busca', categoria);
    set_cookie('tipoDeBusca', 'categorias');
    irPara('buscar');
    return;
}

function montar_layout() {
    let layout = JSON.parse(get_cookie('layout'));

    try {
        document.title = layout.titulo;
    } catch (erro) {
        console.log(erro);
    }
    try {
        let itens = document.querySelectorAll('.nome_da_loja');
        for (let item of itens) {
            item.innerText = layout.nome;
        }
    } catch (erro) {
        console.log(erro);
    }
    try {
        document.getElementById('favicon_do_site').setAttribute('href', layout.favicon);
    } catch (erro) {
        console.log(erro);
    }
    try {
        let itens = document.querySelectorAll('.logo_da_loja');
        for (let item of itens) {
            item.setAttribute('src', layout.logo);
        }
    } catch (erro) {
        console.log(erro);
    }
    try {
        let itens = document.querySelectorAll('.cnpj_da_empresa');
        for (let item of itens) {
            item.innerText = `${layout.empresa} ${layout.cnpj} ${layout.endereço}`;
        }
    } catch (erro) {
        console.log(erro);
    }

    return;
}

window.onload = () => {
    //AVISO DE COOKIES
    if (get_cookie('avisoDeCookies') != 'aceito') {
        $('#avisoDeCookies').css('display', 'block');
    } else {
        $('#avisoDeCookies').fadeOut();
    }

    $('#nomeCompletoCadastro').keyup(function () {
        nomeCompleto = $('#nomeCompletoCadastro').val();
        if (nomeCompleto.includes(' ')) {
            nomeCompleto = nomeCompleto.split(' ');
            if (nomeCompleto[0].length > 2 && nomeCompleto[1].length > 2) {
                $('#erroNomeCompletoCadastro').html("&nbsp;");
            }
        }
    });
    $('#emailCadastro').keyup(function () {
        email = $('#emailCadastro').val();
        if (email.includes('@') && email.includes('.')) {
            $('#erroEmailCadastro').html("&nbsp;");
        }
    });
    //endereço(entrega)
    $('#logradouroEntrega').keyup(function () {
        logradouro = $('#logradouroEntrega').val();
        if (logradouro.length > 2) {
            $('#erroLogradouroEntrega').html("&nbsp;");
        }
    });
    $('#numeroEntrega').keyup(function () {
        numero = $('#numeroEntrega').val();
        if (numero.length != 0) {
            $('#erroNumeroEntrega').html("&nbsp;");
        }
    });
    $('#bairroEntrega').keyup(function () {
        bairro = $('#bairroEntrega').val();
        if (bairro.length > 2) {
            $('#erroBairroEntrega').html("&nbsp;");
        }
    });
    $('#cidadeEntrega').keyup(function () {
        cidade = $('#cidadeEntrega').val();
        if (cidade.length > 2) {
            $('#erroCidadeEntrega').html("&nbsp;");
        }
    });
    $('#estadoEntrega').keyup(function () {
        estado = $('#estadoEntrega').val();
        if (estado.length < 3) {
            $('#erroEstadoEntrega').html("&nbsp;");
        }
    });

    document.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            if ($('#buscar').val().length > 0 && get_cookie('paginaAtual') != 'login' && get_cookie('paginaAtual') != 'endereço' && get_cookie('paginaAtual') != 'pagamento') {
                set_cookie('busca', $('#buscar').val());
                set_cookie('tipoDeBusca', 'produtos');
                irPara('buscar');
            }
        }
    });
}