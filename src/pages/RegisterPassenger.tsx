import React, { useState } from 'react'
import { ChevronLeft, User, Phone, Save, HelpCircle } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import HelpModal from '../components/HelpModal'

const RegisterPassenger = () => {
    const [fullName, setFullName] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [isFavorite, setIsFavorite] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showHelp, setShowHelp] = useState(false)
    const navigate = useNavigate()

    const handleSave = async () => {
        if (!fullName) {
            alert('O nome completo é obrigatório')
            return
        }

        // TÉCNICA "OPEN EARLY": Abrir janela do WhatsApp agora (se tiver telefone)
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        let whatsappWindow: Window | null = null;
        if (cleanPhone) {
            whatsappWindow = window.open('', '_blank');
            if (whatsappWindow) {
                whatsappWindow.document.write('<html><body style="background:#25D366; color:white; font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh;"><h3>Gerando link do WhatsApp...</h3></body></html>');
            }
        }

        setLoading(true)

        // 1. Obter usuário autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            if (whatsappWindow) whatsappWindow.close();
            alert('Sessão expirada. Faça login novamente.');
            setLoading(false);
            navigate('/');
            return;
        }

        // 2. Buscar perfil vinculado ao Auth ID (Garantia para RLS)
        const { data: profile, error: profileError } = await supabase
            .from('driver_profile')
            .select('id, full_name')
            .eq('auth_id', user.id)
            .single();

        if (profileError || !profile) {
            if (whatsappWindow) whatsappWindow.close();
            alert('Erro de Permissão: Seu usuário não está vinculado a um perfil de motorista. Saia e entre novamente.');
            setLoading(false);
            return;
        }

        // 3. Inserir Passageiro
        const { error } = await supabase.from('passengers').insert({
            driver_id: profile.id, // ID validado pelo RLS
            full_name: fullName,
            phone_number: phoneNumber,
            is_favorite: isFavorite
        });

        if (error) {
            if (whatsappWindow) whatsappWindow.close();
            alert('Erro ao salvar: ' + error.message);
            setLoading(false);
            return;
        }

        // 4. Sucesso e Redirecionar WhatsApp
        if (cleanPhone && whatsappWindow) {
            const driverName = profile.full_name || 'seu motorista';
            const message = encodeURIComponent(
                `Seja bem vindo ao aplicativo RecordsTrip! 🚗\n\nSou ${driverName} e acabei de registrar seu contato para facilitar nossas próximas viagens.`
            );
            whatsappWindow.location.href = `https://wa.me/${cleanPhone}?text=${message}`;
        } else if (cleanPhone && !whatsappWindow) {
            alert('Passageiro salvo! Pop-up do WhatsApp foi bloqueado.');
        } else {
            alert('Passageiro cadastrado com sucesso!');
        }

        setLoading(false)
        navigate(-1)
    }

    return (
        <div className="content">
            <header style={{ margin: '-20px -20px 20px -20px' }}>
                <button onClick={() => navigate(-1)} className="btn-back"><ChevronLeft /></button>
                <h1>Cadastrar Passageiro</h1>
                <button onClick={() => setShowHelp(true)}><HelpCircle /></button>
            </header>

            <HelpModal
                isOpen={showHelp}
                onClose={() => setShowHelp(false)}
                title="Cadastrar Novo Passageiro"
                steps={[
                    "Formulário para adicionar novos clientes à sua carteira.",
                    "O 'Nome Completo' é o único campo obrigatório.",
                    "Se preencher o 'Telefone', o app tentará abrir o WhatsApp automaticamente após salvar para enviar uma mensagem de boas-vindas.",
                    "Marcar como 'Favorito' (em breve) facilitará encontrar este passageiro no topo da lista."
                ]}
            />

            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: 20 }}>Novo Passageiro</h2>
            <p style={{ color: '#757575', fontSize: '0.9rem', marginBottom: 30 }}>Adicione detalhes para acompanhar ganhos e capacidade.</p>

            <div className="card">
                <div className="input-group">
                    <label>NOME COMPLETO <span>OBRIGATÓRIO</span></label>
                    <div className="input-wrapper">
                        <input
                            placeholder="ex: João Silva"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                        />
                        <User className="icon" size={20} />
                    </div>
                </div>

                <div className="input-group">
                    <label>TELEFONE</label>
                    <div className="input-wrapper">
                        <input
                            placeholder="Digite o número do telefone"
                            value={phoneNumber}
                            onChange={e => setPhoneNumber(e.target.value)}
                        />
                        <Phone className="icon" size={20} />
                    </div>
                </div>

                <div className="switch-group">
                    <div>
                        <div style={{ fontWeight: 600 }}>Passageiro Favorito</div>
                        <div style={{ fontSize: '0.8rem', color: '#999' }}>Salvar para viagens frequentes</div>
                    </div>
                    <label className="switch">
                        <input type="checkbox" checked={isFavorite} onChange={e => setIsFavorite(e.target.checked)} />
                        <span className="slider"></span>
                    </label>
                </div>

                <button className="btn-primary" style={{ marginTop: 20 }} onClick={handleSave} disabled={loading}>
                    <Save size={20} /> {loading ? 'Salvando...' : 'Salvar Passageiro'}
                </button>

                <button style={{ width: '100%', padding: '15px', color: '#757575', fontWeight: 500 }} onClick={() => navigate(-1)}>Limpar Formulário</button>
            </div>

            <div className="card" style={{ background: '#E0F2F1', border: '1px solid #B2DFDB', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                <div style={{ background: 'var(--primary)', color: 'white', padding: '6px', borderRadius: '50%' }}>
                    <HelpCircle size={16} />
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Importação Rápida</div>
                    <p style={{ fontSize: '0.8rem', color: '#555', marginTop: 5 }}>Você pode sincronizar automaticamente os detalhes dos passageiros da sua agenda.</p>
                    <button style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem', marginTop: 10, textTransform: 'uppercase' }}>IMPORTAR CONTATOS</button>
                </div>
            </div>
        </div>
    )
}

export default RegisterPassenger
