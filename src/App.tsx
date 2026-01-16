import { useState, useEffect } from 'react'
import { Login } from '@/components/Login'
import { AuthStatus } from '@/components/AuthStatus'
import { PlantSelection } from '@/components/PlantSelection'
import { Credentials } from '@/types'

// Browser global
declare const browser: any;

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [accessToken, setAccessToken] = useState<string>("");
    const [tokenExpiry, setTokenExpiry] = useState<number | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const response = await browser.runtime.sendMessage({ action: 'getStoredCredentials' });
            if (response.success && response.data && response.data.accessToken) {
                // Check expiry
                if (response.data.tokenExpiry && Date.now() < response.data.tokenExpiry) {
                    setIsAuthenticated(true);
                    setAccessToken(response.data.accessToken);
                    setTokenExpiry(response.data.tokenExpiry);
                } else {
                    setIsAuthenticated(false);
                    if (response.data.accessToken) setError("Token expired");
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAuthenticate = async (credentials: Credentials) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await browser.runtime.sendMessage({ action: 'authenticate', credentials });
            if (response.success) {
                await checkStatus();
            } else {
                setError(response.error || "Authentication failed");
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsLoading(true);
        try {
            const response = await browser.runtime.sendMessage({ action: 'refreshToken' });
            if (response.success) {
                await checkStatus();
            } else {
                setError(response.error || "Refresh failed");
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await browser.storage.local.remove(['accessToken', 'refreshToken', 'tokenExpiry']);
        setIsAuthenticated(false);
        setAccessToken("");
        setTokenExpiry(undefined);
    };

    if (isLoading && !accessToken) {
        return <div className="p-4 flex justify-center text-sm text-slate-500">Loading extension...</div>
    }

    return (
        <div className="w-[400px] min-h-[400px] bg-slate-50 relative">
            <header className="bg-gradient-to-r from-slate-800 to-sky-600 p-4 shadow-sm">
                <h2 className="text-white font-semibold text-lg flex items-center justify-between">
                    Sungrow iSolarCloud Monitor
                    <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-emerald-400' : 'bg-red-400 shadow-sm'}`} />
                </h2>
            </header>

            <main className="p-4">
                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 px-3 py-2 rounded-md text-sm mb-4">
                        {error}
                    </div>
                )}

                {!isAuthenticated ? (
                    <Login onAuthenticate={handleAuthenticate} isLoading={isLoading} />
                ) : (
                    <>
                        <PlantSelection />
                        <AuthStatus
                            accessToken={accessToken}
                            tokenExpiry={tokenExpiry}
                            onRefresh={handleRefresh}
                            onLogout={handleLogout}
                            isLoading={isLoading}
                        />
                    </>
                )}
            </main>

            <footer className="p-4 bg-slate-100 border-t text-center text-xs text-slate-500">
                Get your API credentials from the{' '}
                <a href="https://developer-api.isolarcloud.com" target="_blank" className="text-sky-600 hover:underline">
                    Sungrow Developer Portal
                </a>
            </footer>
        </div>
    )
}

export default App
