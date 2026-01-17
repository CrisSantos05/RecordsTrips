import React from 'react';
import { X } from 'lucide-react';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    steps: string[];
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, title, steps }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
            <div className="card" style={{ maxWidth: 400, width: '100%', position: 'relative', padding: '30px 20px', animation: 'scaleIn 0.2s ease-out' }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: 10, right: 10, color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    <X size={24} />
                </button>

                <h2 style={{ fontSize: '1.4rem', marginBottom: 20, color: 'var(--primary)', textAlign: 'center' }}>{title}</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 15, fontSize: '0.95rem', lineHeight: '1.5' }}>
                    {steps.map((step, index) => (
                        <div key={index} style={{ display: 'flex', gap: 12 }}>
                            <span style={{
                                color: 'var(--primary)',
                                fontWeight: 800,
                                minWidth: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                background: 'rgba(30, 60, 114, 0.1)'
                            }}>
                                {index + 1}
                            </span>
                            <span>{step}</span>
                        </div>
                    ))}
                </div>

                <button
                    className="btn-primary"
                    style={{ marginTop: 25 }}
                    onClick={onClose}
                >
                    Entendi!
                </button>
            </div>
        </div>
    );
};

export default HelpModal;
