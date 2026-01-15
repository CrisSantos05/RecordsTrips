import React, { useState } from 'react'
import { ChevronLeft, CheckCircle2, User, Phone, Car, Save, Camera, FileText, ShieldAlert } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { DriverProfile } from '../types'
import { useNavigate, Link } from 'react-router-dom'

interface ProfileProps {
    currentProfile: DriverProfile;
}

const Profile = ({ currentProfile }: ProfileProps) => {
    const [profile, setProfile] = useState<DriverProfile>(currentProfile)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSave = async () => {
        setLoading(true)
        const { error } = await supabase.from('driver_profile').update({
            full_name: profile.full_name,
            license_plate: profile.license_plate,
            vehicle_model: profile.vehicle_model,
            phone_number: profile.phone_number,
            show_license_plate: profile.show_license_plate,
            include_signature: profile.include_signature
        }).eq('id', profile.id)

        if (error) alert(error.message)
        else alert('Perfil atualizado!')
        setLoading(false)
    }

    return (
        <div className="content">
            <header style={{ margin: '-20px -20px 20px -20px' }}>
                <button onClick={() => navigate(-1)} className="btn-back"><ChevronLeft /></button>
                <h1>Perfil do Motorista</h1>
                <button><CheckCircle2 color="#1E88E5" /></button>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '30px 0' }}>
                <div style={{ position: 'relative' }}>
                    <div className="avatar" style={{ width: 120, height: 120, borderRadius: '50%', margin: 0, background: 'linear-gradient(135deg, #d4a373, #faedcd)' }}>
                        {profile.avatar_url && <img src={profile.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />}
                    </div>
                    <button style={{ position: 'absolute', bottom: 5, right: 5, background: '#1E88E5', color: 'white', padding: 8, borderRadius: '50%', border: '2px solid white' }}>
                        <Camera size={16} />
                    </button>
                </div>
                <button style={{ color: '#1E88E5', fontWeight: 600, marginTop: 15, fontSize: '0.9rem' }}>Editar Foto do Perfil</button>
            </div>

            {profile.is_admin && (
                <Link to="/admin" className="card" style={{ display: 'flex', alignItems: 'center', gap: 15, textDecoration: 'none', color: 'inherit', border: '2px solid #E3F2FD', background: '#f8fbff' }}>
                    <div style={{ backgroundColor: '#1E88E5', color: 'white', padding: 10, borderRadius: 12 }}>
                        <ShieldAlert size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#1E88E5' }}>Painel Administrativo</div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>Gerenciar motoristas e mensalidades</div>
                    </div>
                    <ChevronLeft size={20} style={{ transform: 'rotate(180deg)', color: '#1E88E5' }} />
                </Link>
            )}

            <div className="input-group">
                <label>NOME COMPLETO</label>
                <div className="input-wrapper">
                    <input value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} />
                    <User className="icon" size={20} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="input-group">
                    <label>PLACA</label>
                    <div className="input-wrapper">
                        <input value={profile.license_plate} onChange={e => setProfile({ ...profile, license_plate: e.target.value })} />
                        <span className="icon" style={{ fontSize: '1.2rem' }}>#</span>
                    </div>
                </div>
                <div className="input-group">
                    <label>MODELO DO VEÍCULO</label>
                    <div className="input-wrapper">
                        <input value={profile.vehicle_model} onChange={e => setProfile({ ...profile, vehicle_model: e.target.value })} />
                        <Car className="icon" size={20} />
                    </div>
                </div>
            </div>

            <div className="input-group">
                <label>TELEFONE DE CONTATO</label>
                <div className="input-wrapper">
                    <input value={profile.phone_number} onChange={e => setProfile({ ...profile, phone_number: e.target.value })} />
                    <Phone className="icon" size={20} />
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 20 }}>
                <FileText color="#1E88E5" />
                <h3 style={{ fontSize: '1.2rem' }}>Configurações de Relatório</h3>
            </div>

            <div className="card">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: 20 }}>
                    <div style={{ border: '1px dashed #ccc', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                        <div style={{ color: '#ccc', marginBottom: 10 }}><Camera size={24} /></div>
                        <div style={{ fontSize: '0.7rem', color: '#999' }}>Carregar PNG</div>
                    </div>
                    <div style={{ border: '1px dashed #ccc', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                        <div style={{ color: '#ccc', marginBottom: 10 }}><FileText size={24} /></div>
                        <div style={{ fontSize: '0.7rem', color: '#999' }}>Adicionar Digital</div>
                    </div>
                </div>

                <div className="switch-group">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: '#1E88E5' }}>#</span>
                        <span style={{ fontWeight: 600 }}>Mostrar Placa</span>
                    </div>
                    <label className="switch">
                        <input type="checkbox" checked={profile.show_license_plate} onChange={e => setProfile({ ...profile, show_license_plate: e.target.checked })} />
                        <span className="slider"></span>
                    </label>
                </div>

                <div className="switch-group">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileText color="#1E88E5" size={18} />
                        <span style={{ fontWeight: 600 }}>Incluir Assinatura</span>
                    </div>
                    <label className="switch">
                        <input type="checkbox" checked={profile.include_signature} onChange={e => setProfile({ ...profile, include_signature: e.target.checked })} />
                        <span className="slider"></span>
                    </label>
                </div>
            </div>

            <button className="btn-primary" onClick={handleSave} disabled={loading} style={{ backgroundColor: '#1E88E5' }}>
                <Save size={20} /> {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>

            <div style={{ textAlign: 'center', color: '#BDBDBD', fontSize: '0.7rem', marginTop: 15, textTransform: 'uppercase' }}>
                ÚLTIMA ATUALIZAÇÃO: 25 DE OUT DE 2023
            </div>
        </div>
    )
}

export default Profile
