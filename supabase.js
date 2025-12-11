const supabaseUrl = 'https://bablaekfvhnrivhwqbos.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhYmxhZWtmdmhucml2aHdxYm9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MzE0NjgsImV4cCI6MjA4MDMwNzQ2OH0.pQRlJ-ZTm6jjyODrS_SNJDUgiHGCwFY4A9cWFCjK14E ';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let ongId = -1;
let ongParaExcluir = null;

const btnAddOng = document.getElementById('btn-add-ong');
const ongModal = document.getElementById('ong-modal');
const closeModal = document.getElementById('close-modal');
const btnCancelar = document.getElementById('btn-cancelar');
const btnSalvar = document.getElementById('btn-salvar');
const formOng = document.getElementById('form-ong');
const modalTitle = document.getElementById('modal-title');
const tableBody = document.getElementById('table-body');
const emptyState = document.getElementById('empty-state');

// Modal de confirmação
const confirmModal = document.getElementById('confirm-modal');
const closeConfirmModal = document.getElementById('close-confirm-modal');
const btnCancelarExclusao = document.getElementById('btn-cancelar-exclusao');
const btnConfirmarExclusao = document.getElementById('btn-confirmar-exclusao');
const confirmMessage = document.getElementById('confirm-message');

btnAddOng.addEventListener('click', () => {
    ongId = -1;
    modalTitle.textContent = 'Adicionar Nova ONG';
    formOng.reset();
    ongModal.style.display = 'flex';
    document.getElementById('input-nome').focus();
});

closeModal.addEventListener('click', () => {
    ongModal.style.display = 'none';
});

btnCancelar.addEventListener('click', () => {
    ongModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === ongModal) {
        ongModal.style.display = 'none';
    }
    if (event.target === confirmModal) {
        confirmModal.style.display = 'none';
    }
});

closeConfirmModal.addEventListener('click', () => {
    confirmModal.style.display = 'none';
});

btnCancelarExclusao.addEventListener('click', () => {
    confirmModal.style.display = 'none';
});

btnSalvar.addEventListener('click', async () => {
    const nome = document.getElementById('input-nome').value.trim();
    const descricao = document.getElementById('input-descricao').value.trim();
    const categoria = document.getElementById('input-categoria').value;
    const telefone = document.getElementById('input-telefone').value.trim();
    const cnpj = document.getElementById('input-cnpj').value.trim();
    
    if (!nome) {
        alert('Por favor, insira o nome da ONG.');
        document.getElementById('input-nome').focus();
        return;
    }
    
    if (!categoria) {
        alert('Por favor, selecione uma categoria.');
        document.getElementById('input-categoria').focus();
        return;
    }

    if (!telefone) {
        alert('Por favor, insira o telefone da ONG.');
        document.getElementById('input-telefone').focus();
        return;
    }

    if (!cnpj) {
        alert('Por favor, insira o CNPJ da ONG.');
        document.getElementById('input-cnpj').focus();
        return;
    }
    
    const ong = {
        nome: nome,
        descricao: descricao,
        categoria: categoria,
        telefone: telefone,
        cnpj: cnpj
    };
    
    try {
        if (ongId > -1) {
            const { error } = await supabaseClient
                .from('ong')
                .update(ong)
                .eq('id', ongId);
            
            if (error) throw error;
        } else {
            const { error } = await supabaseClient
                .from('ong')
                .insert([ong]);
            
            if (error) throw error;
        }
       
        ongModal.style.display = 'none';
        carregarOngs();
        
    } catch (error) {
        console.error('Erro ao salvar ONG:', error.message);
        alert(`Erro ao salvar ONG: ${error.message}`);
    }
});

async function editarOng(id) {
    try {
        const { data, error } = await supabaseClient
            .from('ong')
            .select('id, nome, descricao, categoria, telefone, cnpj')
            .eq('id', id);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            ongId = id;
            modalTitle.textContent = 'Editar ONG';
            
            document.getElementById('input-id').value = data[0].id;
            document.getElementById('input-nome').value = data[0].nome;
            document.getElementById('input-descricao').value = data[0].descricao;
            document.getElementById('input-categoria').value = data[0].categoria;
            document.getElementById('input-telefone').value = data[0].telefone;
            document.getElementById('input-cnpj').value = data[0].cnpj;
            
            ongModal.style.display = 'flex';
        }
    } catch (error) {
        console.error('Erro ao carregar ONG para edição:', error.message);
        alert(`Erro ao carregar ONG: ${error.message}`);
    }
}

function confirmarExclusao(id, nome) {
    ongParaExcluir = id;
    confirmMessage.textContent = `Tem certeza que deseja excluir a ONG "${nome}"? Esta ação não pode ser desfeita.`;
    confirmModal.style.display = 'flex';
}

btnConfirmarExclusao.addEventListener('click', async () => {
    if (ongParaExcluir !== null) {
        await excluirOng(ongParaExcluir);
        confirmModal.style.display = 'none';
        ongParaExcluir = null;
    }
});

async function excluirOng(id) {
    try {
        const { error } = await supabaseClient
            .from('ong')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        carregarOngs();
    } catch (error) {
        console.error('Erro ao excluir ONG:', error.message);
        alert(`Erro ao excluir ONG: ${error.message}`);
    }
}

async function carregarOngs() {
    try {
        const { data, error } = await supabaseClient
            .from('ong')
            .select('id, nome, descricao, categoria, telefone, cnpj')
            .order('id', { ascending: true });
        
        if (error) throw error;
        
        tableBody.innerHTML = '';
        
        if (data && data.length > 0) {
            emptyState.style.display = 'none';
            
            data.forEach(ong => {
                const row = document.createElement('tr');
                
                const descricaoCurta = ong.descricao && ong.descricao.length > 100 
                    ? ong.descricao.substring(0, 100) + '...' 
                    : ong.descricao || '';
                
                row.innerHTML = `
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn edit-btn" onclick="editarOng(${ong.id})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="action-btn delete-btn" onclick="confirmarExclusao(${ong.id}, '${ong.nome}')">
                                <i class="fas fa-trash"></i> Excluir
                            </button>
                        </div>
                    </td>
                    <td>${ong.id}</td>
                    <td><strong>${ong.nome}</strong></td>
                    <td>${descricaoCurta}</td>
                    <td><span class="categoria-badge">${ong.categoria}</span></td>
                    <td>${ong.telefone || ''}</td>
                    <td>${ong.cnpj || ''}</td>
                `;
                
                tableBody.appendChild(row);
            });
        } else {
            emptyState.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro ao carregar ONGs:', error.message);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #dc2626; padding: 30px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p>Erro ao carregar dados: ${error.message}</p>
                </td>
            </tr>
        `;
        emptyState.style.display = 'none';
    }
}

const style = document.createElement('style');
style.textContent = `
    .categoria-badge {
        display: inline-block;
        padding: 4px 10px;
        background-color: #e8f5e9;
        color: #1f8f55;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 500;
    }
`;
document.head.appendChild(style);
document.addEventListener('DOMContentLoaded', carregarOngs);