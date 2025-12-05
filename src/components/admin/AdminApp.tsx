import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import AdminLoginPage from './AdminLoginPage';
import AdminDashboard from './AdminDashboard';
import AdminAllUsers from './AdminAllUsers';
import AdminSupportRequests from './AdminSupportRequests';
import AdminChangeRequests from './AdminChangeRequests';
import AdminUserDetail from './AdminUserDetail';
import AdminAddUser from './AdminAddUser';

const AdminApp: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [adminPassword, setAdminPassword] = useState<string | null>(null);
    const [currentPath, setCurrentPath] = useState(window.location.pathname);

    useEffect(() => {
        // Check for existing session
        const session = localStorage.getItem('nexdev_admin_session');
        if (session) {
            const { password, expiresAt } = JSON.parse(session);
            if (new Date().getTime() < expiresAt) {
                setIsAuthenticated(true);
                setAdminPassword(password);
            } else {
                localStorage.removeItem('nexdev_admin_session');
            }
        }

        // Handle browser navigation
        const handleNavigation = () => setCurrentPath(window.location.pathname);
        window.addEventListener('popstate', handleNavigation);
        return () => window.removeEventListener('popstate', handleNavigation);
    }, []);

    const handleLoginSuccess = (password: string) => {
        setIsAuthenticated(true);
        setAdminPassword(password);

        // Save session
        const session = {
            password,
            expiresAt: new Date().getTime() + 30 * 60 * 1000 // 30 minutes
        };
        localStorage.setItem('nexdev_admin_session', JSON.stringify(session));

        // Navigate to dashboard if at root
        if (window.location.pathname === '/nexdev' || window.location.pathname === '/nexdev/login') {
            window.history.pushState({}, '', '/nexdev/dashboard');
            setCurrentPath('/nexdev/dashboard');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setAdminPassword(null);
        localStorage.removeItem('nexdev_admin_session');
        window.history.pushState({}, '', '/nexdev/login');
        setCurrentPath('/nexdev/login');
    };

    const handleNavigate = (path: string) => {
        window.history.pushState({}, '', path);
        setCurrentPath(path);
    };

    if (!isAuthenticated) {
        return <AdminLoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    const renderPage = () => {
        switch (currentPath) {
            case '/nexdev/dashboard':
                return <AdminDashboard />;
            case '/nexdev/users':
                return <AdminAllUsers adminPassword={adminPassword!} />;
            case '/nexdev/add-user':
                return <AdminAddUser adminPassword={adminPassword!} onBack={() => handleNavigate('/nexdev/users')} />;
            case '/nexdev/support':
                return <AdminSupportRequests adminPassword={adminPassword!} />;
            case '/nexdev/changes':
                return <AdminChangeRequests adminPassword={adminPassword!} />;
            default:
                // Handle user detail routes or unknown routes
                if (currentPath.startsWith('/nexdev/users/')) {
                    const userId = currentPath.split('/').pop()!;
                    return <AdminUserDetail
                        userId={userId}
                        adminPassword={adminPassword!}
                        onBack={() => handleNavigate('/nexdev/users')}
                    />;
                }
                return <AdminDashboard />;
        }
    };

    return (
        <AdminLayout
            currentPage={currentPath}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
        >
            {renderPage()}
        </AdminLayout>
    );
};

export default AdminApp;
