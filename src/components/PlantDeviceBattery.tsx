import { useState, useEffect } from "react"
import { PlantDevice as PlantDeviceType, PlantDevicePointData } from "@/types"
import { Battery } from "lucide-react"

interface PlantDeviceBatteryProps {
    device: PlantDeviceType;
}

declare const browser: any;

export function PlantDeviceBattery({ device }: PlantDeviceBatteryProps) {
    const [soc, setSoc] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSoc() {
            try {
                const response = await browser.runtime.sendMessage({
                    action: 'getDevicePointData',
                    device_type: device.device_type,
                    ps_key: device.ps_key,
                    point_ids: [58604] // Battery SOC point ID as per user
                });

                if (response.success && response.data && response.data.length > 0) {
                    const data = response.data[0] as PlantDevicePointData;
                    const socValue = data["p58604"];
                    if (socValue !== undefined && socValue !== null) {
                        setSoc(parseFloat(socValue) * 100);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch battery SOC:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchSoc();
        // Refresh every 5 minutes as per core logic if possible,
        // but for now just once on mount is fine for "real-time" in this context.
    }, [device.ps_key, device.device_type]);

    return (
        <div className="flex items-center p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-2 bg-slate-50 rounded-full mr-3 border border-slate-100">
                <Battery size={18} className="text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-800 truncate" title={device.device_name}>
                            {device.device_name}
                        </h4>
                        {loading ? (
                            <span className="text-[10px] text-slate-400 animate-pulse">Loading...</span>
                        ) : soc !== null ? (
                            <span className="text-xs font-bold text-emerald-600">
                                {soc}%
                            </span>
                        ) : null}
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${device.dev_fault_status === 4
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : device.dev_fault_status === 1
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : "bg-yellow-50 text-yellow-600 border border-yellow-100"
                        }`}>
                        {device.dev_fault_status === 4 ? "Normal" : device.dev_fault_status === 1 ? "Fault" : "Alarm"}
                    </span>
                </div>
                <div className="flex items-center text-[11px] text-slate-500 mt-0.5">
                    <span className="truncate">{device.type_name}</span>
                    <span className="mx-1.5 text-slate-300">|</span>
                    <span className="font-mono">{device.ps_id}</span>
                </div>
            </div>
        </div>
    )
}
