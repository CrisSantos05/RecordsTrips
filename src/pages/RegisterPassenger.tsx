import React, { useState } from 'react'
import { ChevronLeft, User, Phone, Save, HelpCircle } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

const RegisterPassenger = () => {
    const [fullName, setFullName] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [isFavorite, setIsFavorite] = useState(false)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSave = async () => {
        if (!fullName) {
            alert('O nome completo é obrigatório')
            return
        }

        setLoading(true)
        const { error } = await supabase.from('passengers').insert({
            full_name: fullName,
            phone_number: phoneNumber,
            is_favorite: isFavorite
        })

        if (error) {
            alert('Erro: ' + error.message)
        } else {
            // Get driver info for the message
            const savedProfile = localStorage.getItem('driver_profile');
            const driverName = savedProfile ? JSON.parse(savedProfile).full_name : 'seu motorista';

            alert('Passageiro cadastrado!')

            // Send welcome WhatsApp
            if (phoneNumber) {
                const message = encodeURIComponent(
                    `Seja bem vindo ao aplicativo RecordsTrip! 🚗\n\nSou ${driverName} e acabei de registrar seu contato para facilitar nossas próximas viagens.`
                );
                window.open(`https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${message}`, '_blank');
            }

            navigate(-1)
        }
        setLoading(false)
    }

    return (
        <div className="content">
            <header style={{ margin: '-20px -20px 20px -20px' }}>
                <button onClick={() => navigate(-1)} className="btn-back"><ChevronLeft /></button>
                <h1>Cadastrar Passageiro</h1>
                <button><HelpCircle /></button>
            </header>

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
