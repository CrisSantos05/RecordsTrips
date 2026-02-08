import React, { useState, useEffect } from 'react'
import { ChevronLeft, HelpCircle, DollarSign, Save, Fuel, Settings as Tools, Utensils, Droplets, MoreHorizontal, History as HistoryIcon, Clock } from 'lucide-react'
import HelpModal from '../components/HelpModal'
import { supabase } from '../supabaseClient'
import { Expense } from '../types'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CATEGORIES = [
    { id: 'Combustível', icon: Fuel, color: '#f59e0b' },
    { id: 'Manutenção', icon: Tools, color: '#ef4444' },
    { id: 'Alimentação', icon: Utensils, color: '#10b981' },
    { id: 'Lavagem', icon: Droplets, color: '#3b82f6' },
    { id: 'Outros', icon: MoreHorizontal, color: '#6b7280' },
]

const Expenses = () => {
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState('Combustível')
    const [customCategory, setCustomCategory] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const [showHelp, setShowHelp] = useState(false)
    const [recentExpenses, setRecentExpenses] = useState<Expense[]>([])
    const [allCategories, setAllCategories] = useState(CATEGORIES)
    const navigate = useNavigate()

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        const savedProfile = localStorage.getItem('driver_profile')
        if (!savedProfile) return
        const currentDriverId = JSON.parse(savedProfile).id
        if (!currentDriverId) return

        // Fetch recent expenses
        const { data: expenses } = await supabase
            .from('expenses')
            .select('*')
            .eq('driver_id', currentDriverId)
            .order('expense_date', { ascending: false })

        if (expenses) {
            setRecentExpenses(expenses.slice(0, 10))

            // Extract unique categories
            const uniqueCats = Array.from(new Set(expenses.map(e => e.category)))
            const defaultIds = CATEGORIES.map(c => c.id)

            const newCats = [...CATEGORIES]
            uniqueCats.forEach(cat => {
                if (!defaultIds.includes(cat)) {
                    // Add custom category before 'Outros'
                    newCats.splice(newCats.length - 1, 0, {
                        id: cat,
                        icon: MoreHorizontal,
                        color: '#6366f1' // Indigo for custom ones
                    })
                }
            })
            setAllCategories(newCats)
        }
    }

    const handleSaveExpense = async () => {
        const finalCategory = category === 'Outros' ? (customCategory || 'Outros') : category;

        if (!amount || !finalCategory) {
            alert('Por favor, insira um valor e uma categoria')
            return
        }

        const savedProfile = localStorage.getItem('driver_profile')
        if (!savedProfile) return
        const currentDriverId = JSON.parse(savedProfile).id

        setLoading(true)
        const { error } = await supabase.from('expenses').insert({
            driver_id: currentDriverId,
            amount: parseFloat(amount),
            category: finalCategory,
            description,
            expense_date: format(new Date(), 'yyyy-MM-dd')
        })

        if (error) {
            alert('Erro ao salvar gasto: ' + error.message)
        } else {
            alert('Gasto salvo com sucesso!')
            setAmount('')
            setDescription('')
            setCustomCategory('')
            setCategory('Combustível')
            fetchData()
        }
        setLoading(false)
    }

    return (
        <div className="content" style={{ background: '#fcfcfc', minHeight: '100%', padding: '20px', paddingBottom: '120px' }}>
            <header style={{ margin: '-20px -20px 20px -20px', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px' }}>
                <button onClick={() => navigate(-1)} className="btn-back" style={{ background: 'white', borderRadius: '50%', padding: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft /></button>
                <h1 style={{ fontWeight: 800, fontSize: '1.2rem', color: '#333' }}>Lançar Gasto</h1>
                <button onClick={() => setShowHelp(true)} style={{ background: 'white', padding: '8px', borderRadius: '50%', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><HelpCircle size={24} color="#666" /></button>
            </header>

            <HelpModal
                isOpen={showHelp}
                onClose={() => setShowHelp(false)}
                title="Controle de Gastos"
                steps={[
                    "Selecione uma categoria na lista horizontal ou use 'Outros' para criar uma nova.",
                    "Categorias criadas anteriormente aparecerão automaticamente na lista.",
                    "Digite o valor e observações e salve para registrar o gasto.",
                ]}
            />

            <div className="input-group" style={{ marginTop: '10px', marginLeft: '-20px', marginRight: '-20px' }}>
                <label style={{ fontSize: '0.75rem', color: '#999', marginBottom: '15px', fontWeight: 700, display: 'block', textTransform: 'uppercase', paddingLeft: '20px' }}>SELECIONE A CATEGORIA</label>
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    overflowX: 'auto',
                    padding: '0 20px 20px 20px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }} className="category-scroll">
                    {allCategories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                minWidth: '94px',
                                gap: '8px',
                                padding: '16px 10px',
                                borderRadius: '18px',
                                border: 'none',
                                background: category === cat.id ? cat.color : 'white',
                                color: category === cat.id ? 'white' : '#666',
                                boxShadow: category === cat.id
                                    ? `0 10px 20px ${cat.color}40`
                                    : '0 4px 15px rgba(0,0,0,0.03)',
                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                transform: category === cat.id ? 'scale(1.05)' : 'scale(1)'
                            }}
                        >
                            <cat.icon size={24} strokeWidth={category === cat.id ? 2.5 : 2} />
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{cat.id.toUpperCase()}</span>
                        </button>
                    ))}
                </div>
            </div>

            {category === 'Outros' && (
                <div className="input-group fade-in" style={{ animation: 'slideRight 0.3s ease-out' }}>
                    <label style={{ fontSize: '0.75rem', color: '#999', fontWeight: 700 }}>NOME DA NOVA CATEGORIA</label>
                    <div style={{
                        padding: '16px 20px',
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
                        border: '1.5px solid #6b7280',
                        marginTop: '8px'
                    }}>
                        <input
                            placeholder="Ex: IPVA, Estacionamento..."
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            style={{ border: 'none', width: '100%', outline: 'none', color: '#333', fontSize: '1rem', fontWeight: 600, background: 'transparent' }}
                        />
                    </div>
                </div>
            )}

            <div className="input-group">
                <label style={{ fontSize: '0.75rem', color: '#999', fontWeight: 700 }}>VALOR PAGO</label>
                <div style={{
                    padding: '24px',
                    margin: 0,
                    background: 'white',
                    borderRadius: '24px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                    border: '1px solid #f0f0f0'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '20px',
                            background: '#FEE2E2',
                            color: '#EF4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <span style={{ fontWeight: 900, fontSize: '1.2rem' }}>R$</span>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.7rem', color: '#999', fontWeight: 800, textTransform: 'uppercase' }}>Total do Gasto</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                <input
                                    type="number"
                                    placeholder="0,00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    style={{
                                        border: 'none',
                                        fontSize: '2.5rem',
                                        fontWeight: 900,
                                        width: '100%',
                                        outline: 'none',
                                        color: '#333',
                                        background: 'transparent'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="input-group">
                <label style={{ fontSize: '0.75rem', color: '#999', fontWeight: 700 }}>OBSERVAÇÃO</label>
                <div style={{
                    padding: '18px 20px',
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                    border: '1px solid #e5e7eb'
                }}>
                    <input
                        placeholder="Adicionar nota rápida..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={{ border: 'none', width: '100%', outline: 'none', color: '#333', fontSize: '1rem', background: 'transparent' }}
                    />
                </div>
            </div>

            <button
                className="btn-primary"
                onClick={handleSaveExpense}
                disabled={loading}
                style={{
                    background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                    padding: '20px',
                    borderRadius: '20px',
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: 'white',
                    boxShadow: '0 12px 24px rgba(239, 68, 68, 0.3)',
                    border: 'none',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    marginTop: '20px',
                    marginBottom: '40px',
                    transition: 'all 0.3s'
                }}
            >
                {loading ? (
                    'Processando...'
                ) : (
                    <>
                        <Save size={24} />
                        Salvar Gasto
                    </>
                )}
            </button>

            <div style={{ marginTop: '0px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Gastos Recentes</h3>
                    <div style={{ background: '#f0f0f0', padding: '6px', borderRadius: '8px', color: '#999' }}>
                        <HistoryIcon size={16} />
                    </div>
                </div>

                {recentExpenses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999', background: '#f9f9f9', borderRadius: '20px', border: '2px dashed #eee' }}>
                        Nenhum gasto registrado recentemente.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {recentExpenses.map(exp => {
                            const catInfo = allCategories.find(c => c.id === exp.category) || CATEGORIES[4];
                            return (
                                <div key={exp.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    padding: '14px',
                                    background: 'white',
                                    borderRadius: '18px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                    border: '1px solid #f8f8f8'
                                }}>
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '14px',
                                        background: `${catInfo.color}10`, color: catInfo.color,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <catInfo.icon size={22} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{exp.category}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#999', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={12} />
                                            {format(new Date(exp.expense_date + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 800, color: '#ef4444', fontSize: '1rem' }}>- R${Number(exp.amount).toFixed(2)}</div>
                                        {exp.description && <div style={{ fontSize: '0.65rem', color: '#999', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.description}</div>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Expenses
