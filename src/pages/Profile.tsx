import React, { useState } from 'react'
import { ChevronLeft, CheckCircle2, User, Phone, Car, Save, Camera, FileText, ShieldAlert, LogOut, HelpCircle, QrCode } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { DriverProfile } from '../types'
import { useNavigate, Link } from 'react-router-dom'

interface ProfileProps {
    currentProfile: DriverProfile;
    onLogout: () => void;
}

const Profile = ({ currentProfile, onLogout }: ProfileProps) => {
    const [profile, setProfile] = useState<DriverProfile>(currentProfile)
    const [loading, setLoading] = useState(false)
    const [showHelp, setShowHelp] = useState(false)
    const navigate = useNavigate()

    const handleSave = async () => {
        setLoading(true)
        const { error } = await supabase.from('driver_profile').update({
            full_name: profile.full_name,
            license_plate: profile.license_plate,
            vehicle_model: profile.vehicle_model,
            phone_number: profile.phone_number,
            show_license_plate: profile.show_license_plate,
            include_signature: profile.include_signature,
            avatar_url: profile.avatar_url,
            report_logo_url: profile.report_logo_url,
            signature_url: profile.signature_url,
            car_document_url: profile.car_document_url,
            cnh_url: profile.cnh_url,
            pix_key: profile.pix_key
        }).eq('id', profile.id)

        if (error) alert(error.message)
        else {
            alert('Perfil atualizado!')
            localStorage.setItem('driver_profile', JSON.stringify(profile))
        }
        setLoading(false)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setProfile({ ...profile, avatar_url: reader.result as string })
            }
            reader.readAsDataURL(file)
        }
    }

    const handleCNHChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setProfile({ ...profile, cnh_url: reader.result as string })
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setProfile({ ...profile, signature_url: reader.result as string })
            }
            reader.readAsDataURL(file)
        }
    }

    const handleCarDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setProfile({ ...profile, car_document_url: reader.result as string })
            }
            reader.readAsDataURL(file)
        }
    }

    return (
        <div className="content">
            <header style={{ margin: '-20px -20px 20px -20px' }}>
                <button onClick={() => navigate(-1)} className="btn-back"><ChevronLeft /></button>
                <h1>Perfil do Motorista</h1>
                <button onClick={() => setShowHelp(true)}><HelpCircle /></button>
            </header>

            {showHelp && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
                }}>
                    <div className="card" style={{ maxWidth: 400, width: '100%', position: 'relative', padding: '30px 20px' }}>
                        <h2 style={{ fontSize: '1.4rem', marginBottom: 15, color: '#1E88E5', textAlign: 'center' }}>Ajuda do Perfil</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.9rem', lineHeight: '1.4' }}>
                            <div style={{ display: 'flex', gap: 10 }}><span style={{ color: '#1E88E5', fontWeight: 700 }}>Foto:</span> Sua foto de identificação (Opcional).</div>
                            <div style={{ display: 'flex', gap: 10 }}><span style={{ color: '#1E88E5', fontWeight: 700 }}>Documentos:</span> Carregue a foto da sua **CNH** e do **Documento do Carro** nos campos pontilhados.</div>
                            <div style={{ display: 'flex', gap: 10 }}><span style={{ color: '#1E88E5', fontWeight: 700 }}>Dados:</span> Mantenha placa e modelo do veículo sempre atualizados.</div>
                        </div>
                        <button
                            className="btn-primary"
                            style={{ marginTop: 25, backgroundColor: '#1E88E5' }}
                            onClick={() => setShowHelp(false)}
                        >
                            Entendi!
                        </button>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '30px 0' }}>
                <div style={{ position: 'relative' }}>
                    <div className="avatar" style={{
                        width: 120, height: 120, borderRadius: '50%', margin: 0,
                        background: 'linear-gradient(135deg, #eee, #f5f5f5)',
                        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '4px solid white', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                    }}>
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <User size={60} color="#ccc" />
                        )}
                    </div>
                    <label
                        htmlFor="avatar-input"
                        style={{ position: 'absolute', bottom: 5, right: 5, background: '#1E88E5', color: 'white', padding: 8, borderRadius: '50%', border: '2px solid white', cursor: 'pointer' }}
                    >
                        <Camera size={16} />
                    </label>
                    <input
                        id="avatar-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </div>
                <button
                    onClick={() => document.getElementById('avatar-input')?.click()}
                    style={{ color: '#1E88E5', fontWeight: 600, marginTop: 15, fontSize: '0.9rem', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    Foto do Motorista (Opcional)
                </button>
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

            <div className="input-group">
                <label>CHAVE PIX (PARA COBRANÇA)</label>
                <div className="input-wrapper">
                    <input
                        placeholder="CPF, E-mail ou Celular"
                        value={profile.pix_key || ''}
                        onChange={e => setProfile({ ...profile, pix_key: e.target.value })}
                    />
                    <QrCode className="icon" size={20} />
                </div>
                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: 5 }}>Essa chave será enviada automaticamente nas mensagens de cobrança.</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 20 }}>
                <FileText color="#1E88E5" />
                <h3 style={{ fontSize: '1.2rem' }}>Configurações de Relatório</h3>
            </div>

            <div className="card">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: 20 }}>
                    <div
                        onClick={() => document.getElementById('cnh-input')?.click()}
                        style={{ border: '2px dashed #E3F2FD', borderRadius: 12, padding: 20, textAlign: 'center', cursor: 'pointer', background: profile.cnh_url ? '#fff' : '#f8fbff', overflow: 'hidden', height: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                    >
                        {profile.cnh_url ? (
                            <img src={profile.cnh_url} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        ) : (
                            <>
                                <div style={{ color: '#1E88E5', marginBottom: 5 }}><Camera size={24} /></div>
                                <div style={{ fontSize: '0.7rem', color: '#1E88E5', fontWeight: 600 }}>CNH</div>
                            </>
                        )}
                        <input id="cnh-input" type="file" accept="image/*" onChange={handleCNHChange} style={{ display: 'none' }} />
                    </div>

                    <div
                        onClick={() => document.getElementById('cardoc-input')?.click()}
                        style={{ border: '2px dashed #E3F2FD', borderRadius: 12, padding: 20, textAlign: 'center', cursor: 'pointer', background: profile.car_document_url ? '#fff' : '#f8fbff', overflow: 'hidden', height: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                    >
                        {profile.car_document_url ? (
                            <img src={profile.car_document_url} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        ) : (
                            <>
                                <div style={{ color: '#1E88E5', marginBottom: 5 }}><Car size={24} /></div>
                                <div style={{ fontSize: '0.7rem', color: '#1E88E5', fontWeight: 600 }}>Doc. do Carro</div>
                            </>
                        )}
                        <input id="cardoc-input" type="file" accept="image/*" onChange={handleCarDocChange} style={{ display: 'none' }} />
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

            <button
                onClick={onLogout}
                style={{ width: '100%', padding: '15px', color: 'var(--error)', fontWeight: 600, marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
                <LogOut size={18} /> DESCONECTAR CONTA
            </button>

            <div style={{ textAlign: 'center', color: '#BDBDBD', fontSize: '0.7rem', marginTop: 15, textTransform: 'uppercase' }}>
                ÚLTIMA ATUALIZAÇÃO: 25 DE OUT DE 2023
            </div>
        </div>
    )
}

export default Profile
