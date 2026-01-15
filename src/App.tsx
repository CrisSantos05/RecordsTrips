import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Car, History, BarChart3, Settings } from 'lucide-react'
import { supabase } from './supabaseClient'
import { DriverProfile } from './types'
import Drive from './pages/Drive'
import HistoryPage from './pages/History'
import Earnings from './pages/Earnings'
import Profile from './pages/Profile'
import RegisterPassenger from './pages/RegisterPassenger'
import Admin from './pages/Admin'
import Blocked from './pages/Blocked'
import './index.css'

const BottomNav = () => {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    // Don't show bottom nav on admin or register pages
    if (location.pathname === '/admin' || location.pathname === '/register-passenger') return null;

    return (
        <div className="bottom-nav">
            <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
                <Car />
                <span>VIAGEM</span>
            </Link>
            <Link to="/history" className={`nav-item ${isActive('/history') ? 'active' : ''}`}>
                <History />
                <span>HISTÓRICO</span>
            </Link>
            <Link to="/earnings" className={`nav-item ${isActive('/earnings') ? 'active' : ''}`}>
                <BarChart3 />
                <span>GANHOS</span>
            </Link>
            <Link to="/profile" className={`nav-item ${isActive('/profile') ? 'active' : ''}`}>
                <Settings />
                <span>AJUSTES</span>
            </Link>
        </div>
    )
}

function App() {
    const [profile, setProfile] = useState<DriverProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchProfile()
    }, [])

    async function fetchProfile() {
        // Current simple logic: fetch the first driver found
        const { data } = await supabase.from('driver_profile').select('*').limit(1).single()
        if (data) setProfile(data)
        setLoading(false)
    }

    if (loading) return <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>Carregando...</div>
    if (!profile) return <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>Erro ao carregar perfil.</div>

    // If driver is not active, block access (except for admin possibly, but let's keep it simple)
    if (profile && !profile.is_active) {
        return <Blocked />
    }

    return (
        <Router>
            <div className="container">
                <Routes>
                    <Route path="/" element={<Drive />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/earnings" element={<Earnings />} />
                    <Route path="/profile" element={<Profile currentProfile={profile} />} />
                    <Route path="/register-passenger" element={<RegisterPassenger />} />
                    <Route path="/admin" element={<Admin />} />
                </Routes>
                <BottomNav />
            </div>
        </Router>
    )
}

export default App
