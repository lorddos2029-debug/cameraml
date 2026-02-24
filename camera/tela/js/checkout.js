const API_BASE = (() => {
    const path = window.location.pathname;

    if (path.includes('/tela/')) {
        return '../../api/pix/index.php';
    }

    return '../api/pix/index.php';
})();

const Navigation = {
    goBack: () => {
        const referrer = document.referrer;
        const current = window.location.href;
        
        // Verificar se há histórico ou veio de outra página do domínio
        if (history.length > 1 && referrer && referrer.includes(window.location.origin)) {
            history.back();
        } else {
            // Redirecionar para página padrão baseada na página atual
            const path = window.location.pathname;
            
            if (path.includes('pagamento.html')) {
                // Verificar se veio de upsells
                const hasUpsells = storage.get('upsell_data');
                if (hasUpsells && Object.keys(hasUpsells.items).length > 0) {
                    window.location.href = 'upsells.html' + window.location.search;
                } else {
                    window.location.href = 'frete.html' + window.location.search;
                }
            } else if (path.includes('frete.html')) {
                window.location.href = 'endereco.html' + window.location.search;
            } else if (path.includes('upsells.html')) {
                window.location.href = 'frete.html' + window.location.search;
            } else if (path.includes('endereco.html')) {
                window.location.href = 'index.html';
            } else {
                // Fallback para página inicial
                window.location.href = 'index.html';
            }
        }
    }
};

const Security = {
    sanitize: (str) => {
        if (typeof str !== 'string') return str;
        return str.replace(/[&<>"'/]/g, (match) => {
            const escape = {
                '&': '&amp;', '<': '&lt;', '>': '&gt;',
                '"': '&quot;', "'": '&#x27;', '/': '&#x2F;'
            };
            return escape[match];
        }).trim();
    },

    validateCPF: (cpf) => {
        if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

        let add = 0;
        for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
        let rev = 11 - (add % 11);
        if (rev === 10 || rev === 11) rev = 0;
        if (rev !== parseInt(cpf.charAt(9))) return false;

        add = 0;
        for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
        rev = 11 - (add % 11);
        if (rev === 10 || rev === 11) rev = 0;
        return rev === parseInt(cpf.charAt(10));
    }
};

const Toast = {
    container: null,
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            document.body.appendChild(this.container);
        }
    },
    show(message, type = 'default') {
        this.init();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        this.container.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

const storage = {
    get: (key) => JSON.parse(localStorage.getItem(key) || '{}'),
    set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
    update: (key, val) => {
        const current = storage.get(key);
        Object.keys(val).forEach(k => {
            if (typeof val[k] === 'string') {
                val[k] = Security.sanitize(val[k]);
            }
        });
        storage.set(key, { ...current, ...val });
    }
};

function utmifyTrack(event, payload) {
    try {
        if (window.dispatchEvent) window.dispatchEvent(new CustomEvent('utmify:' + event, { detail: payload }));
    } catch (e) {}
}

function utmifyMark(id, event) {
    try {
        const key = 'utmify_' + event + '_' + id;
        if (localStorage.getItem(key)) return false;
        localStorage.setItem(key, '1');
        return true;
    } catch (e) { return true; }
}

function getCartTotal() {
    try {
        const v = parseFloat(localStorage.getItem('valor_total_carrinho'));
        if (!isNaN(v) && v > 0) return v;
    } catch (e) {}
    try {
        if (typeof SiteConfig !== 'undefined' && SiteConfig.product && SiteConfig.product.priceCurrent) {
            return parseFloat(SiteConfig.product.priceCurrent) || 0;
        }
    } catch (e) {}
    return 0;
}

function getUtmParamsObject() {
    try {
        const params = (window.utmParams instanceof URLSearchParams)
            ? window.utmParams
            : new URLSearchParams(window.location.search);
        const obj = {};
        for (const [k, v] of params.entries()) obj[k] = v;
        return obj;
    } catch (e) {
        return {};
    }
}

async function utmifySendEvent(payload) {
    try {
        if (window.utmify && typeof window.utmify.event === 'function') {
            await window.utmify.event(payload);
            return true;
        }
    } catch (e) {}
    try {
        const base = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
            ? 'http://localhost:3001/tracking/v1'
            : 'https://tracking.utmify.com.br/tracking/v1';
        const res = await fetch(base + '/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return res.ok;
    } catch (e) {
        return false;
    }
}

const UI = {
    showError: (el, message) => {
        el.style.borderColor = '#ff0000';
        let err = el.parentNode.querySelector('.error-msg');
        if (!err) {
            err = document.createElement('span');
            err.className = 'error-msg';
            err.style.color = '#ff0000';
            err.style.fontSize = '12px';
            err.style.marginTop = '4px';
            err.style.display = 'block';
            el.parentNode.appendChild(err);
        }
        err.textContent = message;
    },
    clearError: (el) => {
        el.style.borderColor = '#ccc';
        const err = el.parentNode.querySelector('.error-msg');
        if (err) err.remove();
    },
    loading: (el, isLoading) => {
        if (isLoading) {
            el.disabled = true;
            el.dataset.originalText = el.textContent;
            el.textContent = 'Carregando...';
        } else {
            el.disabled = false;
            el.textContent = el.dataset.originalText || el.textContent;
        }
    }
};

const masks = {
    cpf: (v) => {
        v = v.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        return v.replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2');
    },
    phone: (v) => {
        v = v.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        return v.replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    },
    cep: (v) => {
        v = v.replace(/\D/g, '');
        if (v.length > 8) v = v.slice(0, 8);
        return v.replace(/(\d{5})(\d)/, '$1-$2');
    },
    date: (v) => {
        v = v.replace(/\D/g, '');
        if (v.length > 8) v = v.slice(0, 8);
        return v.replace(/(\d{2})(\d)/, '$1/$2')
            .replace(/(\d{2})(\d)/, '$1/$2');
    }
};

const Masks = {
    apply: (el, maskName) => {
        if (!el) return;
        el.addEventListener('input', (e) => {
            const v = e.target.value;
            e.target.value = masks[maskName](v);
        });
    }
};

function initBackButtons() {
    document.addEventListener('click', (e) => {
        const backBtn = e.target.closest('[data-back="true"]');
        if (backBtn) {
            e.preventDefault();
            Navigation.goBack();
        }
    });
}

function initAddress() {
    const inputs = document.querySelectorAll('.form-input, .ml-input, .ml-select');

    const telInput = document.getElementById('telefone');
    if (telInput) Masks.apply(telInput, 'phone');

    const cepInput = document.getElementById('cep');
    if (cepInput) {
        Masks.apply(cepInput, 'cep');

        cepInput.addEventListener('blur', async () => {
            const cep = cepInput.value.replace(/\D/g, '');
            if (cep.length === 8) {
                try {
                    cepInput.style.opacity = '0.7';
                    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                    const data = await res.json();

                    if (!data.erro) {
                        const setVal = (id, val) => {
                            const el = document.getElementById(id);
                            if (el) el.value = val;
                        };
                        setVal('logradouro', data.logradouro);
                        setVal('bairro', data.bairro);
                        setVal('cidade', data.localidade);
                        setVal('estado', data.uf);

                        const numInput = document.getElementById('numero');
                        if (numInput) numInput.focus();
                        UI.clearError(cepInput);
                    } else {
                        Toast.show('CEP não encontrado.', 'error');
                        UI.showError(cepInput, 'CEP não encontrado.');
                    }
                } catch (e) {
                    console.error(e);
                    Toast.show('Erro ao buscar CEP.', 'error');
                } finally {
                    cepInput.style.opacity = '1';
                }
            }
        });
    }

    const saved = storage.get('checkout_data');
    inputs.forEach(el => {
        if (saved[el.id]) el.value = saved[el.id];
    });

    const form = document.getElementById('form-address');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            let valid = true;

            if (telInput && telInput.value.length < 14) {
                UI.showError(telInput, 'Telefone inválido');
                valid = false;
            } else if (telInput) UI.clearError(telInput);

            if (cepInput && cepInput.value.length < 9) {
                UI.showError(cepInput, 'CEP incompleto');
                valid = false;
            } else if (cepInput) UI.clearError(cepInput);

            if (!valid) {
                Toast.show('Verifique os campos obrigatórios.', 'error');
                return;
            }

            const data = {};
            inputs.forEach(el => data[el.id] = el.value);
            storage.update('checkout_data', data);
            console.log("Redirecting to Shipping with params:", window.location.search);
            window.location.href = 'frete.html' + window.location.search;
        });
    }
}

async function initPayment() {
    const addressData = storage.get('checkout_data');
    if (!addressData.cep) {
        window.location.href = 'endereco.html' + window.location.search;
        return;
    }

    const populateReview = () => {
        const addr = addressData;
        const recipient = document.getElementById('review-recipient');
        const addressLine = document.getElementById('review-address');
        const cityCep = document.getElementById('review-city-cep');

        if (recipient && addr.destinatario && addr.telefone) {
            recipient.textContent = `${addr.destinatario} - ${masks.phone(addr.telefone)}`;
        }

        if (addressLine && addr.logradouro && addr.numero) {
            addressLine.textContent = `${addr.logradouro}, ${addr.numero}`;
        }

        if (cityCep && addr.cidade && addr.estado && addr.cep) {
            cityCep.textContent = `${addr.cidade}, ${addr.estado} - CEP ${masks.cep(addr.cep)}`;
        }

        const shipEl = document.getElementById('shipping-date');
        const shippingTitle = document.querySelector('.shipping-title');
        if (shipEl) {
            const savedShipping = storage.get('shipping_data');

            if (savedShipping && savedShipping.daysMin !== undefined) {
                if (savedShipping.daysMin <= 1 && savedShipping.daysMax <= 2) {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const days = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
                    const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
                    shipEl.textContent = `Chega amanhã, ${tomorrow.getDate()} de ${months[tomorrow.getMonth()]}`;
                    if (shippingTitle) shippingTitle.textContent = savedShipping.company || 'Envio Rápido';
                } else {
                    shipEl.textContent = `Chega em até ${savedShipping.daysMax} dias úteis`;
                    if (shippingTitle) shippingTitle.textContent = savedShipping.company || 'Envio Padrão';
                }
            } else {
                const defaultDays = (typeof SiteConfig !== 'undefined' && SiteConfig.product) ? SiteConfig.product.daysToDelivery : 7;
                shipEl.textContent = `Chega em até ${defaultDays} dias úteis`;
            }
        }

        if (addr.destinatario) {
            const parts = addr.destinatario.trim().split(' ');
            const nEl = document.getElementById('nome');
            const sEl = document.getElementById('sobrenome');
            if (nEl && !nEl.value) nEl.value = parts[0] || '';
            if (sEl && !sEl.value) sEl.value = parts.slice(1).join(' ') || '';
        }
    };
    populateReview();

    // Preencher informações dinâmicas do produto (nome, imagem, preço) nesta tela
    try {
        const sel = JSON.parse(localStorage.getItem('camera_selected_offer') || '{}') || {};
        const hasConfig = (typeof SiteConfig !== 'undefined' && SiteConfig.product);
        const prodName = hasConfig ? SiteConfig.product.name : (sel && sel.name) || '';
        let imgCandidate = hasConfig && SiteConfig.product.images ? SiteConfig.product.images[0] : (sel && sel.img) || '';
        const prodPrice = (hasConfig && SiteConfig.product && SiteConfig.product.priceCurrent)
            ? parseFloat(SiteConfig.product.priceCurrent)
            : (sel && typeof sel.price === 'number') ? sel.price : 0;

        // Resolver caminho relativo quando estiver dentro de /tela/
        let prodImg = imgCandidate;
        if (prodImg && !/^https?:\/\//.test(prodImg)) {
            if (window.location.pathname.includes('/tela/') && !prodImg.startsWith('../')) {
                prodImg = '../' + prodImg.replace(/^\/+/, '');
            }
        }

        document.querySelectorAll('.dynamic-product-image').forEach((el) => {
            if (prodImg) el.src = prodImg;
        });
        document.querySelectorAll('.dynamic-product-name').forEach((el) => {
            if (prodName) el.textContent = prodName;
        });
        document.querySelectorAll('.dynamic-product-price').forEach((el) => {
            if (!isNaN(prodPrice) && prodPrice > 0) {
                el.textContent = prodPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            }
        });
    } catch (e) {}

    const cpfEl = document.getElementById('cpf');
    if (cpfEl) Masks.apply(cpfEl, 'cpf');

    const birthEl = document.getElementById('nascimento');
    if (birthEl) Masks.apply(birthEl, 'date');

    const pixBtn = document.getElementById('btn-create-pix');
    if (pixBtn) {
        pixBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('nome');
            const surnameInput = document.getElementById('sobrenome');
            const emailInput = document.getElementById('email');

            let valid = true;

            const rawCPF = cpfEl.value.replace(/\D/g, '');
            if (!Security.validateCPF(rawCPF)) {
                UI.showError(cpfEl, 'CPF inválido');
                valid = false;
            } else {
                UI.clearError(cpfEl);
            }

            const rawDate = birthEl.value.replace(/\D/g, '');
            const day = parseInt(rawDate.substr(0, 2));
            const month = parseInt(rawDate.substr(2, 2));
            const year = parseInt(rawDate.substr(4, 4));

            if (rawDate.length !== 8 || day > 31 || month > 12 || year < 1900 || year > new Date().getFullYear()) {
                UI.showError(birthEl, 'Data inválida');
                valid = false;
            } else {
                UI.clearError(birthEl);
            }

            if (Security.sanitize(nameInput.value).trim().length < 2) {
                UI.showError(nameInput, 'Nome obrigatório');
                valid = false;
            } else {
                UI.clearError(nameInput);
            }

            if (Security.sanitize(surnameInput.value).trim().length < 2) {
                UI.showError(surnameInput, 'Sobrenome obrigatório');
                valid = false;
            } else {
                UI.clearError(surnameInput);
            }

            const emailVal = emailInput.value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailVal || !emailRegex.test(emailVal)) {
                UI.showError(emailInput, 'Email inválido');
                valid = false;
            } else {
                UI.clearError(emailInput);
            }

            if (!valid) {
                Toast.show('Verifique os campos em vermelho.', 'error');
                return;
            }

            UI.loading(pixBtn, true);

            const fullName = `${Security.sanitize(nameInput.value)} ${Security.sanitize(surnameInput.value)}`;
            const cleanCPF = cpfEl.value.replace(/\D/g, '');

            const getCartCookie = (name) => {
                let match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
                if (match) return decodeURIComponent(match[2]);
                return null;
            };

            const cartTotal = localStorage.getItem('valor_total_carrinho') || getCartCookie('valor_total_carrinho');
            let productPrice = 199.90;

            if (cartTotal && parseFloat(cartTotal) > 0) {
                productPrice = parseFloat(cartTotal);
            } else if (typeof SiteConfig !== 'undefined' && SiteConfig.product && SiteConfig.product.priceCurrent) {
                productPrice = parseFloat(SiteConfig.product.priceCurrent);
            }

            // PayEvo Payload Construction
            const payload = {
                amount: Math.round(productPrice * 100), // Convert to cents (integer)
                paymentMethod: "PIX",
                customer: {
                    name: fullName,
                    email: emailInput.value.trim(),
                    document: cleanCPF,
                    phone: addressData.telefone
                }
            };

            try {
                document.getElementById('step-nfe').classList.add('hidden');
                document.getElementById('step-loading').classList.remove('hidden');

                console.log('Sending PIX request with payload:', payload);

                // PayEvo API Integration
                const options = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": 'Basic ' + btoa("sk_like_1OvWpGCxFaPYwXIqHbAKxVrdolsCfoe1uqT9bOzxuXQqWycd")
                    },
                    body: JSON.stringify(payload)
                };

                const res = await fetch("https://apiv2.payevo.com.br/functions/v1/transactions", options);

                console.log('Response status:', res.status);

                if (!res.ok) {
                    let errorText = '';
                    try {
                        errorText = await res.text();
                    } catch (e) {
                        errorText = 'Não foi possível ler a resposta';
                    }
                    console.error('Server error:', res.status, errorText);
                    throw new Error(`Erro no servidor: ${res.status}`);
                }

                const result = await res.json();
                console.log('API result:', result);

                // Adapter for PayEvo response
                // PayEvo returns: { pix: { qrcode: "..." }, ... }
                let pixCode = null;
                if (result.pix && result.pix.qrcode) {
                    pixCode = result.pix.qrcode;
                } else if (result.pix_code) {
                    pixCode = result.pix_code;
                }

                const adaptedResult = {
                    ...result,
                    success: true,
                    pix_code: pixCode,
                    // PayEvo doesn't return base64 image, so we generate a QR URL
                    qr_code_base64: pixCode ? `https://quickchart.io/qr?text=${encodeURIComponent(pixCode)}&size=300` : null,
                    external_id: result.id
                };

                if (adaptedResult.pix_code) {
                    try {
                        const prodName = (typeof SiteConfig !== 'undefined' && SiteConfig.product && SiteConfig.product.name) ? SiteConfig.product.name : '';
                        const fullName = `${Security.sanitize(nameInput.value)} ${Security.sanitize(surnameInput.value)}`.trim();
                        const payload = {
                            lead: {
                                pixelId: window.pixelId || '',
                                userAgent: navigator.userAgent
                            },
                            event: {
                                name: 'Purchase',
                                status: 'generated',
                                paymentMethod: 'PIX',
                                value: productPrice,
                                currency: 'BRL',
                                transactionId: adaptedResult.external_id,
                                timestamp: new Date().toISOString()
                            },
                            customer: {
                                name: fullName,
                                email: emailInput.value.trim(),
                                document: cleanCPF,
                                phone: addressData.telefone || ''
                            },
                            products: [
                                { name: prodName || 'Produto', price: productPrice, quantity: 1 }
                            ],
                            trackingParameters: getUtmParamsObject()
                        };
                        if (utmifyMark(adaptedResult.external_id, 'venda_gerada')) {
                            utmifySendEvent(payload);
                        }
                    } catch (e) {}
                    renderPixScreen(adaptedResult);
                    Toast.show('Pix gerado com sucesso!', 'success');
                } else {
                    console.warn("Could not find pix_code in response", result);
                    if (result.error) {
                         throw new Error(result.error);
                    }
                    throw new Error("Código Pix não encontrado na resposta.");
                }

            } catch (err) {
                console.error('PIX Error:', err);
                Toast.show(err.message || 'Falha ao gerar Pix.', 'error');
                document.getElementById('step-loading').classList.add('hidden');
                document.getElementById('step-nfe').classList.remove('hidden');
                UI.loading(pixBtn, false);
            }
        });
    }
}

function renderPixScreen(data) {
    document.getElementById('step-loading').classList.add('hidden');
    document.getElementById('step-pix').classList.remove('hidden');

    const copyCode = data.pix_code || "indisponivel";
    const qrImage = data.qr_code_base64 || 'https://via.placeholder.com/200?text=QR+Code+Erro';

    document.getElementById('pix-copypaste-input').textContent = copyCode;
    document.getElementById('pix-qrcode-img').src = qrImage;

    startTimer(600);

    const copyBtn = document.getElementById('btn-copy-pix');
    if (copyBtn) {
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(copyCode);
            const original = copyBtn.innerHTML;
            copyBtn.textContent = "Copiado!";
            Toast.show('Código copiado!', 'success');
            setTimeout(() => copyBtn.innerHTML = original, 2000);
        };
    }

    const confirmBtn = document.getElementById('btn-confirm-pay');
    if (confirmBtn) {
        confirmBtn.onclick = () => checkStatus(data.external_id);
    }

    if (data.external_id) startPolling(data.external_id);
}

function startTimer(duration) {
    let timer = duration, minutes, seconds;
    const display = document.getElementById('timer-display');
    const interval = setInterval(() => {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);
        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;
        if (display) display.textContent = minutes + ":" + seconds;
        if (--timer < 0) {
            clearInterval(interval);
            if (display) display.textContent = "EXPIRADO";
            Toast.show('O tempo expirou.', 'error');
            setTimeout(() => window.location.reload(), 2000);
        }
    }, 1000);
}

function checkStatus(id) {
    if (!id) return;
    
    const options = {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Authorization": 'Basic ' + btoa("sk_like_1OvWpGCxFaPYwXIqHbAKxVrdolsCfoe1uqT9bOzxuXQqWycd")
        }
    };

    fetch(`https://apiv2.payevo.com.br/functions/v1/transactions/${id}`, options)
        .then(async r => {
            if (!r.ok) {
                const txt = await r.text();
                throw new Error(txt || `Erro ${r.status}`);
            }
            return r.json();
        })
        .then(status => {
            console.log("Transaction status:", status.status);
            // Check for PayEvo status strings
            if (status.status === 'paid' || status.status === 'approved' || status.status === 'succeeded') {
                try {
                    const txId = status.id || id;
                    const prodName = (typeof SiteConfig !== 'undefined' && SiteConfig.product && SiteConfig.product.name) ? SiteConfig.product.name : '';
                    const total = getCartTotal();
                    const stored = storage.get('checkout_data') || {};
                    const fullName = (stored.destinatario || '').trim();
                    const payload = {
                        lead: {
                            pixelId: window.pixelId || '',
                            userAgent: navigator.userAgent
                        },
                        event: {
                            name: 'Purchase',
                            status: 'paid',
                            paymentMethod: 'PIX',
                            value: total,
                            currency: 'BRL',
                            transactionId: txId,
                            timestamp: new Date().toISOString()
                        },
                        customer: {
                            name: fullName,
                            email: (document.getElementById('email')?.value || '').trim(),
                            document: (document.getElementById('cpf')?.value || '').replace(/\D/g, ''),
                            phone: stored.telefone || ''
                        },
                        products: [
                            { name: prodName || 'Produto', price: total, quantity: 1 }
                        ],
                        trackingParameters: getUtmParamsObject()
                    };
                    if (utmifyMark(txId, 'venda_paga')) {
                        utmifySendEvent(payload);
                    }
                } catch (e) {}
                Toast.show('Pagamento Aprovado!', 'success');
                // PayEvo might not return redirect_url, so we fallback to a thank you page
                const redirectUrl = status.redirect_url || 'obrigado.html'; 
                setTimeout(() => window.location.href = redirectUrl, 1500);
            } else {
                Toast.show('Aguardando pagamento...', 'default');
            }
        }).catch(e => {
            console.error('Erro no status:', e);
            Toast.show('Não foi possível verificar o status.', 'error');
        });
}

function startPolling(id) {
    if (!id) return;
    const interval = setInterval(async () => {
        try {
            const options = {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Authorization": 'Basic ' + btoa("sk_like_1OvWpGCxFaPYwXIqHbAKxVrdolsCfoe1uqT9bOzxuXQqWycd")
                }
            };

            const res = await fetch(`https://apiv2.payevo.com.br/functions/v1/transactions/${id}`, options);
            if (!res.ok) return;

            const status = await res.json();
            if (status.status === 'paid' || status.status === 'approved' || status.status === 'succeeded') {
                clearInterval(interval);
                try {
                    const txId = status.id || id;
                    const prodName = (typeof SiteConfig !== 'undefined' && SiteConfig.product && SiteConfig.product.name) ? SiteConfig.product.name : '';
                    const total = getCartTotal();
                    const stored = storage.get('checkout_data') || {};
                    const fullName = (stored.destinatario || '').trim();
                    const payload = {
                        lead: {
                            pixelId: window.pixelId || '',
                            userAgent: navigator.userAgent
                        },
                        event: {
                            name: 'Purchase',
                            status: 'paid',
                            paymentMethod: 'PIX',
                            value: total,
                            currency: 'BRL',
                            transactionId: txId,
                            timestamp: new Date().toISOString()
                        },
                        customer: {
                            name: fullName,
                            email: (document.getElementById('email')?.value || '').trim(),
                            document: (document.getElementById('cpf')?.value || '').replace(/\D/g, ''),
                            phone: stored.telefone || ''
                        },
                        products: [
                            { name: prodName || 'Produto', price: total, quantity: 1 }
                        ],
                        trackingParameters: getUtmParamsObject()
                    };
                    if (utmifyMark(txId, 'venda_paga')) {
                        utmifySendEvent(payload);
                    }
                } catch (e) {}
                Toast.show('Pagamento Confirmado!', 'success');
                const redirectUrl = status.redirect_url || 'obrigado.html';
                setTimeout(() => window.location.href = redirectUrl, 1500);
            }
        } catch (e) {
            console.error('Polling error:', e);
        }
    }, 5000); // Poll every 5 seconds
}

function initShipping() {
    const addressData = storage.get('checkout_data');
    if (!addressData.cep) {
        window.location.href = 'endereco.html' + window.location.search;
        return;
    }

    const container = document.getElementById('shipping-options-container');
    const btnContinue = document.getElementById('btn-continue-shipping');

    try {
        const productName = document.getElementById('product-name-mini');
        const productPrice = document.getElementById('product-price-mini');
        const productImg = document.getElementById('product-img-mini');

        const hasConfig = typeof SiteConfig !== 'undefined' && SiteConfig.product;
        const prodName = hasConfig ? SiteConfig.product.name : (storage.get('camera_selected_offer')?.name || '');
        const prodPrice = hasConfig ? parseFloat(SiteConfig.product.priceCurrent) : parseFloat(storage.get('camera_selected_offer')?.price || 0);
        const prodImg = hasConfig && SiteConfig.product.images ? SiteConfig.product.images[0] : '';

        if (productName && prodName) productName.textContent = prodName;
        if (productPrice && !isNaN(prodPrice)) productPrice.textContent = prodPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        if (productImg && prodImg) productImg.src = prodImg;

        const savedShipping = storage.get('shipping_data') || {};
        let selectedOptionId = savedShipping.id ||
            (SiteConfig && SiteConfig.shipping && (SiteConfig.shipping.find(s => s.best_option)?.id || SiteConfig.shipping[0].id));

        const renderOptions = () => {
            if (!SiteConfig || !Array.isArray(SiteConfig.shipping)) return;
            container.innerHTML = '';
            SiteConfig.shipping.forEach(option => {
                const isSelected = option.id === selectedOptionId;
                const priceText = option.price === 0 ? 'Grátis' : option.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                const deliveryLabel = `Chega de ${option.daysMin} a ${option.daysMax} dias úteis`;
                const isFull = (option.company || '').toLowerCase().includes('full');
                const boltIcon = isFull
                    ? `<svg width="18" height="18" viewBox="0 0 24 24" style="margin-right:6px; vertical-align:middle;"><path fill="#00a650" d="M13 3l-8 9h5v9l8-9h-5z"/></svg>`
                    : '';
                const div = document.createElement('div');
                div.className = `shipping-option ${isSelected ? 'selected' : ''}`;
                div.onclick = () => selectOption(option.id);
                div.innerHTML = `
                    <div class="shipping-radio ${isSelected ? 'active' : ''}" style="margin-right: 15px;"></div>
                    <img src="${option.logo}" class="shipping-logo">
                    <div class="shipping-details">
                        <span class="shipping-company">${boltIcon}${option.company}</span>
                        <span class="shipping-info">${deliveryLabel}</span>
                        <span class="shipping-price ${option.price > 0 ? 'paid' : ''}">${priceText}</span>
                    </div>
                `;
                container.appendChild(div);
            });
            updateSummary();
        };

        const selectOption = (id) => {
            selectedOptionId = id;
            renderOptions();
        };

        const updateSummary = () => {
            if (!SiteConfig || !Array.isArray(SiteConfig.shipping)) return;
            const option = SiteConfig.shipping.find(s => s.id === selectedOptionId) || SiteConfig.shipping[0];
            const productVal = hasConfig ? parseFloat(SiteConfig.product.priceCurrent) : 0;
            const shippingVal = option ? option.price : 0;
            const totalVal = productVal + shippingVal;
            const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const elProd = document.getElementById('summary-product-price');
            const elShip = document.getElementById('summary-shipping-price');
            const elTot = document.getElementById('summary-total-price');
            if (elProd) elProd.textContent = fmt(productVal);
            if (elShip) elShip.textContent = shippingVal === 0 ? 'Grátis' : fmt(shippingVal);
            if (elTot) elTot.textContent = fmt(totalVal);
        };

        renderOptions();

        if (btnContinue) {
            btnContinue.addEventListener('click', () => {
                try {
                    if (SiteConfig && Array.isArray(SiteConfig.shipping)) {
                        const option = SiteConfig.shipping.find(s => s.id === selectedOptionId) || SiteConfig.shipping[0];
                        if (option) storage.set('shipping_data', option);
                    }
                } catch (e) {}
                window.location.href = 'pagamento.html' + window.location.search;
            });
        }
    } catch (e) {
        if (btnContinue) {
            btnContinue.addEventListener('click', () => {
                window.location.href = 'pagamento.html' + window.location.search;
            });
        }
        console.error('Erro ao inicializar frete:', e);
    }
}

function initUpsells() {
    console.log("Iniciando página de upsells...");
    
    const container = document.getElementById('upsells-container');
    const btnContinue = document.getElementById('btn-continue-payment');
    
    // Carregar upsells selecionados anteriormente
    let selectedUpsells = storage.get('upsell_data') || {};
    if (!selectedUpsells.items) {
        selectedUpsells = {
            items: {},
            total: 0
        };
    }

    // Renderizar upsells
    function renderUpsells() {
        container.innerHTML = '';
        
        SiteConfig.upsells.forEach(upsell => {
            const isSelected = selectedUpsells.items[upsell.id] || false;
            
            const div = document.createElement('div');
            div.className = `upsell-item ${isSelected ? 'selected' : ''}`;
            div.dataset.id = upsell.id;
            
            div.innerHTML = `
                <div class="upsell-radio ${isSelected ? 'active' : ''}"></div>
                <img src="${upsell.image}" class="upsell-image" alt="${upsell.name}">
                <div class="upsell-details">
                    <span class="upsell-name">${upsell.name}</span>
                    <span class="upsell-description">${upsell.description}</span>
                    <div class="upsell-prices">
                        <span class="upsell-old-price">R$ ${upsell.priceOriginal.toFixed(2).replace('.', ',')}</span>
                        <span class="upsell-new-price">R$ ${upsell.priceCurrent.toFixed(2).replace('.', ',')}</span>
                    </div>
                </div>
            `;
            
            div.addEventListener('click', () => {
                toggleUpsell(upsell.id);
            });
            
            container.appendChild(div);
        });
        
        updateSummary();
    }

    // Alternar seleção do upsell
    function toggleUpsell(upsellId) {
        const upsell = SiteConfig.upsells.find(u => u.id === upsellId);
        
        if (!selectedUpsells.items[upsellId]) {
            // Adicionar
            selectedUpsells.items[upsellId] = {
                id: upsell.id,
                name: upsell.name,
                price: upsell.priceCurrent,
                added: true
            };
        } else {
            // Remover
            delete selectedUpsells.items[upsellId];
        }
        
        renderUpsells();
    }

    // Atualizar resumo
    function updateSummary() {
        const mainProduct = parseFloat(SiteConfig.product.priceCurrent);
        const shippingData = storage.get('shipping_data');
        const shippingPrice = shippingData.price || 0;
        
        // Calcular total dos upsells
        let upsellsTotal = 0;
        Object.values(selectedUpsells.items).forEach(item => {
            upsellsTotal += item.price;
        });
        
        selectedUpsells.total = upsellsTotal;
        
        const total = mainProduct + shippingPrice + upsellsTotal;

        // Atualizar UI
        document.getElementById('summary-main-product').textContent = 
            mainProduct.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        document.getElementById('summary-shipping').textContent = 
            shippingPrice === 0 ? 'Grátis' : shippingPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        document.getElementById('summary-upsells').textContent = 
            upsellsTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        document.getElementById('summary-total').textContent = 
            total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // Botão "Continuar para Pagamento"
    btnContinue.addEventListener('click', () => {
        // Salvar upsells no storage
        storage.set('upsell_data', selectedUpsells);

        // Calcular novo total
        const shippingData = storage.get('shipping_data');
        const mainProduct = parseFloat(SiteConfig.product.priceCurrent);
        const shippingPrice = shippingData.price || 0;
        const total = mainProduct + shippingPrice + selectedUpsells.total;

        // Atualizar cookie e localStorage do carrinho
        localStorage.setItem('valor_total_carrinho', total.toFixed(2));
        document.cookie = `valor_total_carrinho=${total.toFixed(2)};path=/`;

        console.log("Redirecionando para pagamento com upsells...");
        window.location.href = 'pagamento.html' + window.location.search;
    });

    // Pular upsells
    const skipLink = document.getElementById('skip-upsells');
    if (skipLink) {
        skipLink.addEventListener('click', function(e) {
            e.preventDefault();
            storage.set('upsell_data', { items: {}, total: 0 });
            window.location.href = 'pagamento.html' + window.location.search;
        });
    }

    // Inicializar
    renderUpsells();
}

// Detectar qual página carregar
const path = window.location.pathname;
if (path.includes('endereco.html')) initAddress();
if (path.includes('pagamento.html')) initPayment();
if (path.includes('frete.html')) initShipping();
if (path.includes('upsells.html')) initUpsells();

// Inicializar botões de voltar (sempre)
document.addEventListener('DOMContentLoaded', initBackButtons);
