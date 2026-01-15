import React from 'react'
import { LogOut } from 'lucide-react'

const Blocked = () => {
    return (
        <div className="container" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 40 }}>
            <div style={{ backgroundColor: '#FFEBEE', padding: 30, borderRadius: 30, marginBottom: 30 }}>
                <div style={{ fontSize: '4rem' }}>🛑</div>
            </div>
            <h1 style={{ fontSize: '2rem', marginBottom: 15 }}>Acesso Bloqueado</h1>
            <p style={{ color: '#666', marginBottom: 40 }}>
                Sua assinatura expirou ou seu acesso foi desativado pelo administrador.
                Por favor, entre em contato para regularizar sua situação.
            </p>

            <div style={{ backgroundColor: '#f5f5f5', padding: 20, borderRadius: 20, width: '100%', marginBottom: 30 }}>
                <div style={{ fontSize: '0.8rem', color: '#999', textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>Suporte</div>
                <div style={{ fontWeight: 600 }}>suporte@recordstrip.com</div>
            </div>

            <button
                style={{ color: '#F44336', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}
                onClick={() => window.location.reload()}
            >
                <LogOut size={20} /> Sair do Sistema
            </button>
        </div>
    )
}

export default Blocked
