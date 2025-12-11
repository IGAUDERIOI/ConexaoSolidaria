// Supabase client configuration
const supabaseUrl = 'https://bablaekfvhnrivhwqbos.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhYmxhZWtmdmhucml2aHdxYm9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MzE0NjgsImV4cCI6MjA4MDMwNzQ2OH0.pQRlJ-ZTm6jjyODrS_SNJDUgiHGCwFY4A9cWFCjK14E';

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let projetos = [];
let indiceProjetoAtual = null;
let informacoesONGs = {}; // Cache para informações das ONGs

async function carregarProjetos() {
    const { data, error } = await supabaseClient
        .from('projeto')
        .select('id, nome, descricao, categoria, ONG_id, nomeOng, colaboracoes, imagem')
        .order('id');

    if (error) {
        console.error('Erro ao carregar projetos:', error.message);
        return;
    }

    projetos = data.map(p => ({
        id: p.id,
        nome: p.nome,
        descricao: p.descricao,
        categoria: p.categoria,
        ONG_id: p.ONG_id,
        nomeOng: p.nomeOng,
        colaboracoes: p.colaboracoes ?? 0,
        imagem: p.imagem,
        telefone: p.telefone // Adiciona telefone da ONG se disponível
    }));

    // Carregar informações das ONGs
    await carregarInformacoesONGs();
    
    criarCards();
}

async function carregarInformacoesONGs() {
    // Buscar todas as ONGs para ter informações adicionais
    const { data: ongs, error } = await supabaseClient
        .from('ong')
        .select('id, nome, descricao, categoria, telefone');

    if (error) {
        console.error('Erro ao carregar ONGs:', error.message);
        return;
    }

    // Armazenar em cache
    ongs.forEach(ong => {
        informacoesONGs[ong.id] = ong;
    });
}

function criarCards() {
    const grade = document.getElementById("gradeProjetos");
    grade.innerHTML = "";

    projetos.forEach((p, indice) => {
        const card = document.createElement("article");
        card.className = "card";
        card.dataset.indice = indice;

        const imagem = p.imagem ? p.imagem : 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=300&q=80';

        card.innerHTML = `
            <img src="${imagem}" alt="Imagem do projeto ${p.nome}">
            <div class="card-corpo">
                <div class="card-categoria">${p.categoria}</div>
                <div class="card-titulo">${p.nome}</div>
                <p class="card-nomeOng">ONG: ${p.nomeOng}</p>
                <p class="card-descricao">${p.descricao.length > 100 ? p.descricao.substring(0, 100) + '...' : p.descricao}</p>

                <p class="card-contador" data-indice="${indice}">
                    <i class="fas fa-users"></i> ${p.colaboracoes} pessoas colaboram
                </p>

                <div class="card-rodape">
                    <button class="btn-colaborar" data-indice="${indice}">
                        <span class="icone-coracao">🤝</span>
                        <span>Colabore Conosco</span>
                    </button>
                </div>
            </div>
        `;

        grade.appendChild(card);
    });
}

function mostrarDetalhesProjeto(indice) {
    const projeto = projetos[indice];
    const ongInfo = informacoesONGs[projeto.ONG_id] || {};

    // Preencher modal de detalhes
    document.getElementById('detalhesImagem').src = projeto.imagem || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=300&q=80';
    document.getElementById('detalhesNome').textContent = projeto.nome;
    document.getElementById('detalhesCategoria').textContent = projeto.categoria;
    document.getElementById('detalhesNomeOng').textContent = projeto.nomeOng;
    document.getElementById('detalhesDescricao').textContent = projeto.descricao;
    document.getElementById('detalhesColaboracoes').textContent = projeto.colaboracoes;
    document.getElementById('detalhesProjetoId').textContent = projeto.id;

    document.getElementById('detalhesNumeroOng').textContent = ongInfo.telefone || 'N/A';
    document.getElementById('detalhesCategoriaOng').textContent = ongInfo.categoria || 'N/A';
    document.getElementById('detalhesDescricaoOng').textContent = ongInfo.descricao || 'Informações não disponíveis';

    document.getElementById('overlayDetalhes').classList.add('mostrar');
    
    indiceProjetoAtual = indice;
}

function formatarDataHoje() {
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, "0");
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const ano = hoje.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

async function incrementarNoBanco(indice) {
    const projetoID = projetos[indice].id;

    const { data: atual, error: erro1 } = await supabaseClient
        .from("projeto")
        .select("colaboracoes")
        .eq("id", projetoID)
        .single();

    if (erro1) {
        console.error("Erro ao ler contador:", erro1.message);
        return;
    }

    const novoValor = (atual.colaboracoes || 0) + 1;

    const { error: erro2 } = await supabaseClient
        .from("projeto")
        .update({ colaboracoes: novoValor })
        .eq("id", projetoID);

    if (erro2) {
        console.error("Erro ao atualizar contador:", erro2.message);
        return;
    }

    projetos[indice].colaboracoes = novoValor;
    atualizarContador(indice);
}

function atualizarContador(indice) {
    const total = projetos[indice].colaboracoes;
    const texto = `${total} pessoas colaboram com esse projeto`;

    document.querySelectorAll(`.card-contador[data-indice="${indice}"]`)
        .forEach(el => el.textContent = texto);
}

document.addEventListener("DOMContentLoaded", () => {
    carregarProjetos();

    const overlayDetalhes = document.getElementById("overlayDetalhes");
    const overlayColab = document.getElementById("overlayColab");
    const overlayObrigado = document.getElementById("overlayObrigado");

    // Elementos do modal de detalhes
    const nomeProjetoSpan = document.getElementById("nomeProjetoSelecionado");
    const campoProjeto = document.getElementById("projeto");
    const projetoIdInput = document.getElementById("projetoId");
    const dataEnvioSpan = document.getElementById("dataEnvio");
    const formColab = document.getElementById("formColab");

    // Eventos para abrir modal de detalhes ao clicar no card
    document.getElementById("gradeProjetos").addEventListener("click", (event) => {
        const card = event.target.closest(".card");
        const botaoColab = event.target.closest(".btn-colaborar");
        
        if (botaoColab) {
            // Abrir modal de colaboração diretamente
            const indice = Number(botaoColab.getAttribute("data-indice"));
            abrirModalColaboracao(indice);
            return;
        }
        
        if (card) {
            const indice = Number(card.dataset.indice);
            mostrarDetalhesProjeto(indice);
        }
    });

    // Abrir modal de colaboração do botão no modal de detalhes
    document.getElementById("btnColaborarDetalhes").addEventListener("click", () => {
        overlayDetalhes.classList.remove("mostrar");
        abrirModalColaboracao(indiceProjetoAtual);
    });

    // Botão voltar no modal de detalhes
    document.getElementById("btnVoltarDetalhes").addEventListener("click", () => {
        overlayDetalhes.classList.remove("mostrar");
    });

    // Fechar modal de detalhes
    document.getElementById("fecharDetalhes").addEventListener("click", () => {
        overlayDetalhes.classList.remove("mostrar");
    });

    // Abrir modal de colaboração (função auxiliar)
    function abrirModalColaboracao(indice) {
        const projeto = projetos[indice];
        indiceProjetoAtual = indice;

        nomeProjetoSpan.textContent = projeto.nome;
        campoProjeto.value = projeto.nome;
        projetoIdInput.value = projeto.id;
        dataEnvioSpan.textContent = formatarDataHoje();

        overlayColab.classList.add("mostrar");
    }

    // Fechar modal de colaboração
    document.getElementById("fecharColab").addEventListener("click", () => {
        overlayColab.classList.remove("mostrar");
    });

    // Enviar formulário de colaboração
    formColab.addEventListener("submit", async (event) => {
        event.preventDefault();

        const nome = document.getElementById("nome").value;
        const email = document.getElementById("email").value;
        const telefone = document.getElementById("telefone").value;
        const mensagem = document.getElementById("mensagem").value;
        const dt_envio = formatarDataHoje();
        const projetoID = projetoIdInput.value;

        // Salvar colaboração no banco
        const { error: erroInsert } = await supabaseClient
            .from("colaboracao")
            .insert([{
                nome,
                email,
                telefone,
                mensagem,
                dt_envio,
                projeto_id: projetoID
            }]);

        if (erroInsert) {
            console.error("Erro ao salvar colaboração:", erroInsert.message);
            alert("Erro ao enviar colaboração. Tente novamente.");
            return;
        }

        // Incrementar contador
        if (indiceProjetoAtual !== null) {
            await incrementarNoBanco(indiceProjetoAtual);
        }

        // Fechar modal e mostrar obrigado
        overlayColab.classList.remove("mostrar");
        overlayObrigado.classList.add("mostrar");

        document.getElementById("nomeOngObrigado").textContent = projetos[indiceProjetoAtual].nomeOng;

        // Resetar formulário
        formColab.reset();
    });

    // Fechar modal de obrigado
    document.getElementById("fecharObrigado").addEventListener("click", () => {
        overlayObrigado.classList.remove("mostrar");
    });

    document.getElementById("btnFecharObrigado").addEventListener("click", () => {
        overlayObrigado.classList.remove("mostrar");
    });

    // Fechar modais ao clicar fora
    [overlayDetalhes, overlayColab, overlayObrigado].forEach(overlay => {
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) {
                overlay.classList.remove("mostrar");
            }
        });
    });
});