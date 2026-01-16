import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Credentials } from "@/types"

interface LoginProps {
    onAuthenticate: (credentials: Credentials) => Promise<void>;
    isLoading: boolean;
}

// Global browser declaration
declare const browser: any;

export function Login({ onAuthenticate, isLoading }: LoginProps) {
    const [credentials, setCredentials] = useState<Credentials>({
        appKey: "",
        secretKey: "",
        authUrl: "",
        gatewayUrl: "https://augateway.isolarcloud.com"
    });
    const [redirectUrl, setRedirectUrl] = useState<string>("Fetching...");

    useEffect(() => {
        // Load stored credentials
        browser.runtime.sendMessage({ action: 'getStoredCredentials' })
            .then((response: any) => {
                if (response.success && response.data) {
                    setCredentials(prev => ({
                        ...prev,
                        appKey: response.data.appKey || "",
                        secretKey: response.data.secretKey || "",
                        authUrl: response.data.authUrl || "",
                        gatewayUrl: response.data.gatewayUrl || "https://augateway.isolarcloud.com"
                    }));
                }
            });

        // Get redirect URL
        try {
            setRedirectUrl(browser.identity.getRedirectURL());
        } catch (e) {
            setRedirectUrl("Error fetching URL");
        }
    }, []);

    const handleChange = (field: keyof Credentials, value: string) => {
        const newCreds = { ...credentials, [field]: value };
        setCredentials(newCreds);

        // Auto-save debounce could be here, or just save on submit.
        // For now adhering to existing auto-save behavior implies saving on input?
        // Let's save on blur or debounce. For simplicity in React, passing to parent or effect.
        // Let's do a simple save on change for now (debounced in real app, but direct here for simplicity).
        browser.runtime.sendMessage({ action: 'storeCredentials', credentials: newCreds });
    };

    return (
        <Card className="w-full border-0 shadow-none">
            <CardHeader className="px-0 pt-0">
                <div className="bg-slate-100 border border-slate-200 rounded-md p-3 mb-4">
                    <p className="text-[11px] font-bold uppercase text-slate-500 mb-1 tracking-wider">Enter this as your redirection URL:</p>
                    <code className="block word-break-all bg-white p-2 border border-black/5 rounded text-slate-700 font-mono text-[11px] break-all">
                        {redirectUrl}
                    </code>
                </div>
                <CardTitle className="text-lg">Enter Credentials</CardTitle>
                <CardDescription>
                    Enter your Sungrow API details to authenticate.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="appKey">App Key</Label>
                    <Input
                        id="appKey"
                        value={credentials.appKey}
                        onChange={(e) => handleChange('appKey', e.target.value)}
                        placeholder="Your Sungrow App Key"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="secretKey">Secret Key</Label>
                    <Input
                        id="secretKey"
                        type="password"
                        value={credentials.secretKey}
                        onChange={(e) => handleChange('secretKey', e.target.value)}
                        placeholder="Your Sungrow Secret Key"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="authUrl">Authorization URL</Label>
                    <Input
                        id="authUrl"
                        value={credentials.authUrl}
                        onChange={(e) => handleChange('authUrl', e.target.value)}
                        placeholder="https://developer-api.isolarcloud.com/v1/oauth2/authorize"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="gatewayUrl">Country</Label>
                    <Select
                        id="gatewayUrl"
                        value={credentials.gatewayUrl}
                        onChange={(e) => handleChange('gatewayUrl', e.target.value)}
                    >
                        <option value="https://augateway.isolarcloud.com">Australia</option>
                        <option value="https://gateway.isolarcloud.com">China</option>
                        <option value="https://gateway.isolarcloud.com.hk">International</option>
                        <option value="https://gateway.isolarcloud.eu">Europe</option>
                    </Select>
                </div>
                <Button
                    className="w-full"
                    onClick={() => onAuthenticate(credentials)}
                    disabled={isLoading}
                >
                    {isLoading ? "Authenticating..." : "Authenticate"}
                </Button>
            </CardContent>
        </Card>
    )
}
