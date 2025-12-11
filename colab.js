const supabaseUrl = 'https://bablaekfvhnrivhwqbos.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhYmxhZWtmdmhucml2aHdxYm9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MzE0NjgsImV4cCI6MjA4MDMwNzQ2OH0.pQRlJ-ZTm6jjyODrS_SNJDUgiHGCwFY4A9cWFCjK14E';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);


// Variáveis globais
let colaboracaoId = -1;
let colaboracaoParaExcluir = null;

// Elementos DOM
const btnAddColaboracao = document.getElementById('btn-add-colaboracao');
const colaboracaoModal = document.getElementById('colaboracao-modal');
const closeModal = document.getElementById('close-modal');
const btnCancelar = document.getElementById('btn-cancelar');
const btnSalvar = document.getElementById('btn-salvar');
const formColaboracao = document.getElementById('form-colaboracao');
const modalTitle = document.getElementById('modal-title');
const tableBody = document.getElementById('table-body');
const emptyState = document.getElementById('empty-state');

// Modal de confirmação
const confirmModal = document.getElementById('confirm-modal');
const closeConfirmModal = document.getElementById('close-confirm-modal');
const btnCancelarExclusao = document.getElementById('btn-cancelar-exclusao');
const btnConfirmarExclusao = document.getElementById('btn-confirmar-exclusao');
const confirmMessage = document.getElementById('confirm-message');

// Modal de mensagem
const mensagemModal = document.getElementById('mensagem-modal');
const closeMensagemModal = document.getElementById('close-mensagem-modal');
const btnFecharMensagem = document.getElementById('btn-fechar-mensagem');
const mensagemNome = document.getElementById('mensagem-nome');
const mensagemEmail = document.getElementById('mensagem-email');
const mensagemData = document.getElementById('mensagem-data');
const mensagemTexto = document.getElementById('mensagem-texto');

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await carregarProjetosParaSelect();
    carregarColaboracao();
    configurarEventos();
    
    // Configurar data atual como padrão
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('input-dt_envio').value = hoje;
});

function configurarEventos() {
    // Abrir modal para adicionar nova colaboração
    btnAddColaboracao.addEventListener('click', () => {
        colaboracaoId = -1;
        modalTitle.textContent = 'Nova Colaboração';
        formColaboracao.reset();
        
        // Definir data atual como padrão
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('input-dt_envio').value = hoje;
        
        colaboracaoModal.style.display = 'flex';
        document.getElementById('input-nome').focus();
    });

    // Fechar modal (principal)
    closeModal.addEventListener('click', () => {
        colaboracaoModal.style.display = 'none';
    });

    btnCancelar.addEventListener('click', () => {
        colaboracaoModal.style.display = 'none';
    });

    // Fechar modais ao clicar fora
    window.addEventListener('click', (event) => {
        if (event.target === colaboracaoModal) {
            colaboracaoModal.style.display = 'none';
        }
        if (event.target === confirmModal) {
            confirmModal.style.display = 'none';
        }
        if (event.target === mensagemModal) {
            mensagemModal.style.display = 'none';
        }
    });

    // Fechar modal de confirmação
    closeConfirmModal.addEventListener('click', () => {
        confirmModal.style.display = 'none';
    });

    btnCancelarExclusao.addEventListener('click', () => {
        confirmModal.style.display = 'none';
    });

    // Fechar modal de mensagem
    closeMensagemModal.addEventListener('click', () => {
        mensagemModal.style.display = 'none';
    });

    btnFecharMensagem.addEventListener('click', () => {
        mensagemModal.style.display = 'none';
    });

    // Salvar colaboração
    btnSalvar.addEventListener('click', async () => {
        await adicionarColaboracao();
    });

    // Formatar telefone enquanto digita
    const telefoneInput = document.getElementById('input-telefone');
    telefoneInput.addEventListener('input', formatarTelefone);
}

// Formatar telefone
function formatarTelefone(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 10) {
        value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (value.length > 6) {
        value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else if (value.length > 2) {
        value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    } else if (value.length > 0) {
        value = value.replace(/^(\d*)/, '($1');
    }
    
    e.target.value = value;
}

// Carregar projetos para o select
async function carregarProjetosParaSelect() {
    const selectProjeto = document.getElementById("input-projeto_id");
    
    // Manter apenas a primeira opção
    while (selectProjeto.options.length > 1) {
        selectProjeto.remove(1);
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('projeto')
            .select('id, nome')
            .order('nome');
        
        if (error) throw error;
        
        data.forEach(projeto => {
            const option = document.createElement('option');
            option.value = projeto.id;
            option.textContent = `${projeto.nome} (ID: ${projeto.id})`;
            selectProjeto.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar projetos:', error.message);
    }
}

// Carregar colaborações
async function carregarColaboracao() {
    try {
        const { data, error } = await supabaseClient
            .from('colaboracao')
            .select('id, nome, email, telefone, mensagem, dt_envio, projeto_id')
            .order('dt_envio', { ascending: false });
        
        if (error) throw error;
        
        tableBody.innerHTML = '';
        
        if (data && data.length > 0) {
            emptyState.style.display = 'none';
            
            data.forEach(colaboracao => {
                const row = document.createElement('tr');
                
                // Formatar data
                const dataFormatada = colaboracao.dt_envio 
                    ? new Date(colaboracao.dt_envio).toLocaleDateString('pt-BR')
                    : 'N/A';
                
                // Formatar mensagem (preview)
                const mensagemCurta = colaboracao.mensagem && colaboracao.mensagem.length > 50 
                    ? colaboracao.mensagem.substring(0, 50) + '...' 
                    : colaboracao.mensagem || '';
                
                row.innerHTML = `
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn edit-btn" onclick="editarColaboracaoModal(${colaboracao.id})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="action-btn delete-btn" onclick="confirmarExclusaoColaboracao(${colaboracao.id}, '${colaboracao.nome.replace(/'/g, "\\'")}')">
                                <i class="fas fa-trash"></i> Excluir
                            </button>
                        </div>
                    </td>
                    <td>${colaboracao.id}</td>
                    <td><strong>${colaboracao.nome}</strong></td>
                    <td class="email-cell" title="${colaboracao.email}">${colaboracao.email}</td>
                    <td class="telefone-cell">${colaboracao.telefone || 'N/A'}</td>
                    <td class="mensagem-preview" title="Clique para ver a mensagem completa" onclick="visualizarMensagem('${colaboracao.nome.replace(/'/g, "\\'")}', '${colaboracao.email}', '${dataFormatada}', '${colaboracao.mensagem.replace(/'/g, "\\'").replace(/\n/g, '<br>')}')">
                        ${mensagemCurta}
                    </td>
                    <td class="data-cell">${dataFormatada}</td>
                    <td>${colaboracao.projeto_id || 'N/A'}</td>
                `;
                
                tableBody.appendChild(row);
            });
        } else {
            emptyState.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro ao carregar colaborações:', error.message);
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: #dc2626; padding: 30px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p>Erro ao carregar dados: ${error.message}</p>
                </td>
            </tr>
        `;
        emptyState.style.display = 'none';
    }
}

// Visualizar mensagem completa
function visualizarMensagem(nome, email, data, mensagem) {
    mensagemNome.textContent = nome;
    mensagemEmail.textContent = email;
    mensagemData.textContent = data;
    mensagemTexto.innerHTML = mensagem;
    mensagemModal.style.display = 'flex';
}

// Editar colaboração (abrir modal)
async function editarColaboracaoModal(id) {
    try {
        const { data, error } = await supabaseClient
            .from('colaboracao')
            .select('id, nome, email, telefone, mensagem, dt_envio, projeto_id')
            .eq('id', id);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            colaboracaoId = id;
            modalTitle.textContent = 'Editar Colaboração';
            
            document.getElementById('input-nome').value = data[0].nome;
            document.getElementById('input-email').value = data[0].email;
            document.getElementById('input-telefone').value = data[0].telefone || '';
            document.getElementById('input-mensagem').value = data[0].mensagem;
            
            // Formatar data para o input date (YYYY-MM-DD)
            if (data[0].dt_envio) {
                const dataObj = new Date(data[0].dt_envio);
                const dataFormatada = dataObj.toISOString().split('T')[0];
                document.getElementById('input-dt_envio').value = dataFormatada;
            }
            
            document.getElementById('input-projeto_id').value = data[0].projeto_id || '';
            
            colaboracaoModal.style.display = 'flex';
        }
    } catch (error) {
        console.error('Erro ao carregar colaboração para edição:', error.message);
        alert(`Erro ao carregar colaboração: ${error.message}`);
    }
}

// Confirmar exclusão
function confirmarExclusaoColaboracao(id, nome) {
    colaboracaoParaExcluir = id;
    confirmMessage.textContent = `Tem certeza que deseja excluir a colaboração de "${nome}"? Esta ação não pode ser desfeita.`;
    confirmModal.style.display = 'flex';
}

// Confirmar exclusão (evento)
btnConfirmarExclusao.addEventListener('click', async () => {
    if (colaboracaoParaExcluir !== null) {
        await excluirColaboracao(colaboracaoParaExcluir);
        confirmModal.style.display = 'none';
        colaboracaoParaExcluir = null;
    }
});

// Excluir colaboração
async function excluirColaboracao(id) {
    try {
        const { error } = await supabaseClient
            .from('colaboracao')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        carregarColaboracao();
    } catch (error) {
        console.error('Erro ao excluir colaboração:', error.message);
        alert(`Erro ao excluir colaboração: ${error.message}`);
    }
}

// Adicionar/Editar colaboração
async function adicionarColaboracao() {
    const nome = document.getElementById("input-nome").value.trim();
    const email = document.getElementById("input-email").value.trim();
    const telefone = document.getElementById("input-telefone").value.trim();
    const mensagem = document.getElementById("input-mensagem").value.trim();
    const dt_envio = document.getElementById("input-dt_envio").value;
    const projeto_id = document.getElementById("input-projeto_id").value;

    // Validação
    if (!nome || !email || !mensagem || !dt_envio || !projeto_id) {
        alert("Por favor, preencha todos os campos obrigatórios (*)!");
        return;
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("Por favor, insira um email válido!");
        document.getElementById('input-email').focus();
        return;
    }

    const colaboracao = {
        nome,
        email,
        telefone: telefone || null,
        mensagem,
        dt_envio,
        projeto_id
    };

    try {
        if (colaboracaoId > -1) {
            // Atualizar colaboração existente
            const { error } = await supabaseClient
                .from('colaboracao')
                .update(colaboracao)
                .eq('id', colaboracaoId);
            
            if (error) throw error;
        } else {
            // Adicionar nova colaboração
            const { error } = await supabaseClient
                .from('colaboracao')
                .insert([colaboracao]);
            
            if (error) throw error;
        }

        // Fechar modal e recarregar dados
        colaboracaoModal.style.display = 'none';
        carregarColaboracao();
        
        // Resetar formulário
        formColaboracao.reset();
        colaboracaoId = -1;
        
        // Definir data atual como padrão
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('input-dt_envio').value = hoje;
        
    } catch (error) {
        console.error('Erro ao salvar colaboração:', error.message);
        alert(`Erro ao salvar colaboração: ${error.message}`);
    }
}

// Exportar funções para uso global
window.editarColaboracaoModal = editarColaboracaoModal;
window.confirmarExclusaoColaboracao = confirmarExclusaoColaboracao;
window.visualizarMensagem = visualizarMensagem;