import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, LogOut } from "lucide-react"

interface AuthStatusProps {
    accessToken: string;
    tokenExpiry?: number;
    onRefresh: () => void;
    onLogout: () => void;
    isLoading: boolean;
}

export function AuthStatus({ accessToken, tokenExpiry, onRefresh, onLogout, isLoading }: AuthStatusProps) {
    return (
        <Card className="w-full border-0 shadow-none mb-4">
            <CardHeader className="px-0 pt-0 pb-4">
                <CardTitle className="text-lg">Authentication Status</CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
                <div className="bg-slate-50/50 rounded-lg border p-4 space-y-3">
                    <div className="flex justify-between items-center text-sm border-b pb-2">
                        <span className="font-medium text-slate-500">Status:</span>
                        <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs border border-emerald-100">Authenticated</span>
                    </div>

                    <div className="space-y-1 border-b pb-3">
                        <span className="block text-sm font-medium text-slate-500">Token:</span>
                        <div className="font-mono text-[11px] text-slate-600 break-all bg-white p-2 border rounded max-h-24 overflow-y-auto">
                            {accessToken}
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-slate-500">Expires:</span>
                        <span className="font-mono text-xs">{tokenExpiry ? new Date(tokenExpiry).toLocaleString() : 'Unknown'}</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={onRefresh} disabled={isLoading}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={onLogout}>
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
