import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { Car, History, BarChart3, Settings, LogOut, Users } from 'lucide-react'
import { supabase } from './supabaseClient'
import { DriverProfile } from './types'
import Drive from './pages/Drive'
import HistoryPage from './pages/History'
import Earnings from './pages/Earnings'
import Profile from './pages/Profile'
import RegisterPassenger from './pages/RegisterPassenger'
import Passengers from './pages/Passengers'
import PassengerDetails from './pages/PassengerDetails'
import Admin from './pages/Admin'
import Blocked from './pages/Blocked'
import Login from './pages/Login'
import Expenses from './pages/Expenses'
import './index.css'

const BottomNav = () => {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    // Don't show bottom nav on certain pages
    const hiddenPages = ['/admin', '/register-passenger', '/login'];
    const isDetailPath = location.pathname.startsWith('/passenger/');
    if (hiddenPages.includes(location.pathname) || isDetailPath) return null;

    return (
        <div className="bottom-nav">
            <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
                <Car />
                <span>VIAGEM</span>
            </Link>
            <Link to="/passengers" className={`nav-item ${isActive('/passengers') ? 'active' : ''}`}>
                <Users />
                <span>CLIENTES</span>
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
        const savedProfile = localStorage.getItem('driver_profile')
        if (savedProfile) {
            const parsed = JSON.parse(savedProfile)
            // Force re-login if the profile doesn't have the new fields (email)
            // This ensures everyone uses the new Auth system
            if (parsed && parsed.email) {
                setProfile(parsed)
            } else {
                localStorage.removeItem('driver_profile')
                setProfile(null)
            }
        }
        setLoading(false)
    }, [])

    const handleLogin = (newProfile: DriverProfile) => {
        setProfile(newProfile)
        localStorage.setItem('driver_profile', JSON.stringify(newProfile))
    }

    const handleLogout = () => {
        setProfile(null)
        localStorage.removeItem('driver_profile')
    }

    if (loading) return <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>Carregando...</div>

    if (!profile) {
        return (
            <Router>
                <Routes>
                    <Route path="/login" element={<Login onLogin={handleLogin} />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Router>
        )
    }

    // If driver is not active
    if (profile && !profile.is_active) {
        return <Blocked />
    }

    return (
        <Router>
            <div className="container">
                <Routes>
                    <Route path="/" element={profile.is_admin ? <Navigate to="/admin" replace /> : <Drive />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/earnings" element={<Earnings />} />
                    <Route path="/profile" element={<Profile currentProfile={profile} onLogout={handleLogout} />} />
                    <Route path="/register-passenger" element={<RegisterPassenger />} />
                    <Route path="/passengers" element={<Passengers />} />
                    <Route path="/passenger/:id" element={<PassengerDetails />} />
                    <Route path="/admin" element={<Admin onLogout={handleLogout} />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <BottomNav />
            </div>
        </Router>
    )
}

export default App
