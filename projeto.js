const supabaseUrl = 'https://bablaekfvhnrivhwqbos.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhYmxhZWtmdmhucml2aHdxYm9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MzE0NjgsImV4cCI6MjA4MDMwNzQ2OH0.pQRlJ-ZTm6jjyODrS_SNJDUgiHGCwFY4A9cWFCjK14E';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let projetoId = -1;
let projetoParaExcluir = null;
let imagemAtual = null;

// Elementos DOM
const btnAddProjeto = document.getElementById('btn-add-projeto');
const projetoModal = document.getElementById('projeto-modal');
const closeModal = document.getElementById('close-modal');
const btnCancelar = document.getElementById('btn-cancelar');
const btnSalvar = document.getElementById('btn-salvar');
const formProjeto = document.getElementById('form-projeto');
const modalTitle = document.getElementById('modal-title');
const tableBody = document.getElementById('table-body');
const emptyState = document.getElementById('empty-state');
const fileUploadContainer = document.getElementById('file-upload-container');
const fileInput = document.getElementById('input-imagem');
const fileNameDisplay = document.getElementById('file-name');
const imagePreviewContainer = document.getElementById('image-preview-container');

// Modal de confirmação
const confirmModal = document.getElementById('confirm-modal');
const closeConfirmModal = document.getElementById('close-confirm-modal');
const btnCancelarExclusao = document.getElementById('btn-cancelar-exclusao');
const btnConfirmarExclusao = document.getElementById('btn-confirmar-exclusao');
const confirmMessage = document.getElementById('confirm-message');

// Modal de imagem
const imageModal = document.getElementById('image-modal');
const closeImageModal = document.getElementById('close-image-modal');
const modalImage = document.getElementById('modal-image');

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await carregarOngsParaSelect();
    carregarProjeto();
    configurarEventos();
});

function configurarEventos() {
    // Abrir modal para adicionar novo projeto
    btnAddProjeto.addEventListener('click', () => {
        projetoId = -1;
        imagemAtual = null;
        modalTitle.textContent = 'Adicionar Novo Projeto';
        formProjeto.reset();
        limparPreviewImagem();
        fileNameDisplay.textContent = '';
        projetoModal.style.display = 'flex';
        document.getElementById('input-nome').focus();
    });

    // Fechar modal (principal)
    closeModal.addEventListener('click', () => {
        projetoModal.style.display = 'none';
    });

    btnCancelar.addEventListener('click', () => {
        projetoModal.style.display = 'none';
    });

    // Fechar modais ao clicar fora
    window.addEventListener('click', (event) => {
        if (event.target === projetoModal) {
            projetoModal.style.display = 'none';
        }
        if (event.target === confirmModal) {
            confirmModal.style.display = 'none';
        }
        if (event.target === imageModal) {
            imageModal.style.display = 'none';
        }
    });

    // Fechar modal de confirmação
    closeConfirmModal.addEventListener('click', () => {
        confirmModal.style.display = 'none';
    });

    btnCancelarExclusao.addEventListener('click', () => {
        confirmModal.style.display = 'none';
    });

    // Fechar modal de imagem
    closeImageModal.addEventListener('click', () => {
        imageModal.style.display = 'none';
    });

    // Upload de imagem - drag and drop
    fileUploadContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadContainer.classList.add('dragover');
    });

    fileUploadContainer.addEventListener('dragleave', () => {
        fileUploadContainer.classList.remove('dragover');
    });

    fileUploadContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadContainer.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    // Upload de imagem - clique
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelect(e.target.files[0]);
        }
    });

    // Salvar projeto
    btnSalvar.addEventListener('click', async () => {
        await adicionarProjeto();
    });
}

// Função para lidar com seleção de arquivo
function handleFileSelect(file) {
    if (!file.type.match('image.*')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        fileInput.value = '';
        fileNameDisplay.textContent = '';
        return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
        alert('A imagem não pode ser maior que 5MB.');
        fileInput.value = '';
        fileNameDisplay.textContent = '';
        return;
    }

    fileNameDisplay.textContent = `Arquivo: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
    
    // Mostrar preview da imagem
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreviewContainer.innerHTML = `
            <p><strong>Pré-visualização:</strong></p>
            <img src="${e.target.result}" class="image-preview" alt="Pré-visualização">
        `;
    };
    reader.readAsDataURL(file);
}

// Limpar preview da imagem
function limparPreviewImagem() {
    imagePreviewContainer.innerHTML = `
        <div class="image-placeholder">
            <i class="fas fa-image"></i>
            <span>Nenhuma imagem selecionada</span>
        </div>
    `;
}

// Carregar ONGs para o select
async function carregarOngsParaSelect() {
    const selectOng = document.getElementById("input-ONG_id");
    
    // Manter apenas a primeira opção
    while (selectOng.options.length > 1) {
        selectOng.remove(1);
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('ong')
            .select('id, nome')
            .order('nome');
        
        if (error) throw error;
        
        data.forEach(ong => {
            const option = document.createElement('option');
            option.value = ong.id;
            option.textContent = `${ong.nome} (ID: ${ong.id})`;
            selectOng.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar ONGs:', error.message);
    }
}

// Obter nome da ONG por ID
function obterNomeOngPorId(ongId) {
    const selectOng = document.getElementById("input-ONG_id");
    for (let i = 0; i < selectOng.options.length; i++) {
        const option = selectOng.options[i];
        if (option.value === ongId.toString()) {
            const texto = option.textContent;
            const nomeOng = texto.split(' (ID:')[0];
            return nomeOng;
        }
    }
    return "";
}

// Carregar projetos
async function carregarProjeto() {
    try {
        const { data, error } = await supabaseClient
            .from('projeto')
            .select('id, nome, descricao, categoria, ONG_id, nomeOng, colaboracoes, imagem')
            .order('id', { ascending: true });
        
        if (error) throw error;
        
        tableBody.innerHTML = '';
        
        if (data && data.length > 0) {
            emptyState.style.display = 'none';
            
            data.forEach(projeto => {
                const row = document.createElement('tr');
                
                // Formatar descrição
                const descricaoCurta = projeto.descricao && projeto.descricao.length > 100 
                    ? projeto.descricao.substring(0, 100) + '...' 
                    : projeto.descricao || '';
                
                // Verificar se tem imagem
                const temImagem = projeto.imagem && projeto.imagem !== '';
                
                row.innerHTML = `
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn edit-btn" onclick="editarProjetoModal(${projeto.id})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="action-btn delete-btn" onclick="confirmarExclusaoProjeto(${projeto.id}, '${projeto.nome.replace(/'/g, "\\'")}')">
                                <i class="fas fa-trash"></i> Excluir
                            </button>
                            ${temImagem ? `<button class="action-btn" style="background-color: #3b82f6; color: white;" onclick="visualizarImagem('${projeto.imagem}')">
                                <i class="fas fa-eye"></i> Imagem
                            </button>` : ''}
                        </div>
                    </td>
                    <td>${projeto.id}</td>
                    <td><strong>${projeto.nome}</strong></td>
                    <td>${descricaoCurta}</td>
                    <td><span class="categoria-badge">${projeto.categoria}</span></td>
                    <td>
                        <small>${projeto.nomeOng || 'N/A'}</small><br>
                        <small style="color: #666;">ID: ${projeto.ONG_id || ''}</small>
                    </td>
                    <td>${projeto.colaboracoes || 0}</td>
                `;
                
                tableBody.appendChild(row);
            });
        } else {
            emptyState.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro ao carregar projetos:', error.message);
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: #dc2626; padding: 30px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p>Erro ao carregar dados: ${error.message}</p>
                </td>
            </tr>
        `;
        emptyState.style.display = 'none';
    }
}

// Visualizar imagem em modal maior
function visualizarImagem(url) {
    modalImage.src = url;
    imageModal.style.display = 'flex';
}

// Editar projeto (abrir modal)
async function editarProjetoModal(id) {
    try {
        const { data, error } = await supabaseClient
            .from('projeto')
            .select('id, nome, descricao, categoria, ONG_id, nomeOng, imagem')
            .eq('id', id);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            projetoId = id;
            imagemAtual = data[0].imagem;
            modalTitle.textContent = 'Editar Projeto';
            
            document.getElementById('input-nome').value = data[0].nome;
            document.getElementById('input-descricao').value = data[0].descricao;
            document.getElementById('input-categoria').value = data[0].categoria;
            document.getElementById('input-ONG_id').value = data[0].ONG_id;
            
            // Mostrar preview da imagem atual
            if (data[0].imagem) {
                imagePreviewContainer.innerHTML = `
                    <p><strong>Imagem atual:</strong></p>
                    <img src="${data[0].imagem}" class="image-preview" alt="Imagem atual">
                    <p><small><i class="fas fa-info-circle"></i> Selecione uma nova imagem para substituir</small></p>
                `;
            } else {
                limparPreviewImagem();
            }
            
            fileNameDisplay.textContent = '';
            projetoModal.style.display = 'flex';
        }
    } catch (error) {
        console.error('Erro ao carregar projeto para edição:', error.message);
        alert(`Erro ao carregar projeto: ${error.message}`);
    }
}

// Confirmar exclusão
function confirmarExclusaoProjeto(id, nome) {
    projetoParaExcluir = id;
    confirmMessage.textContent = `Tem certeza que deseja excluir o projeto "${nome}"? Esta ação não pode ser desfeita.`;
    confirmModal.style.display = 'flex';
}

// Confirmar exclusão (evento)
btnConfirmarExclusao.addEventListener('click', async () => {
    if (projetoParaExcluir !== null) {
        await excluirProjeto(projetoParaExcluir);
        confirmModal.style.display = 'none';
        projetoParaExcluir = null;
    }
});

// Excluir projeto
async function excluirProjeto(id) {
    try {
        const { error } = await supabaseClient
            .from('projeto')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        carregarProjeto();
    } catch (error) {
        console.error('Erro ao excluir projeto:', error.message);
        alert(`Erro ao excluir projeto: ${error.message}`);
    }
}

// Upload de imagem para o Supabase Storage
async function uploadImagem(file) {
    if (!file) return null;

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    
    const { data, error } = await supabaseClient
        .storage
        .from("projetos")
        .upload(fileName, file);

    if (error) {
        console.error("Erro ao fazer upload da imagem:", error.message);
        return null;
    }

    const { data: publicUrlData } = supabaseClient
        .storage
        .from("projetos")
        .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
}

// Adicionar/Editar projeto
async function adicionarProjeto() {
    const nome = document.getElementById("input-nome").value.trim();
    const descricao = document.getElementById("input-descricao").value.trim();
    const categoria = document.getElementById("input-categoria").value;
    const ongId = document.getElementById("input-ONG_id").value;
    const file = document.getElementById("input-imagem").files[0];

    // Validação
    if (!nome || !descricao || !categoria || !ongId) {
        alert("Por favor, preencha todos os campos obrigatórios!");
        return;
    }

    const nomeOng = obterNomeOngPorId(ongId);

    let imagemUrl = imagemAtual;
    
    // Upload da nova imagem, se houver
    if (file) {
        imagemUrl = await uploadImagem(file);
        if (!imagemUrl) {
            alert("Erro ao fazer upload da imagem. Tente novamente.");
            return;
        }
    }

    const projeto = {
        nome,
        descricao,
        categoria,
        ONG_id: ongId,
        nomeOng,
        imagem: imagemUrl
    };

    try {
        if (projetoId > -1) {
            // Atualizar projeto existente
            const { error } = await supabaseClient
                .from('projeto')
                .update(projeto)
                .eq('id', projetoId);
            
            if (error) throw error;
        } else {
            // Adicionar novo projeto
            const { error } = await supabaseClient
                .from('projeto')
                .insert([projeto]);
            
            if (error) throw error;
        }

        // Fechar modal e recarregar dados
        projetoModal.style.display = 'none';
        carregarProjeto();
        
        // Resetar formulário
        formProjeto.reset();
        projetoId = -1;
        imagemAtual = null;
        limparPreviewImagem();
        fileNameDisplay.textContent = '';
        
    } catch (error) {
        console.error('Erro ao salvar projeto:', error.message);
        alert(`Erro ao salvar projeto: ${error.message}`);
    }
}