import { useState, useEffect } from "react"
import { PlantDevice as PlantDeviceType } from "@/types"
import { PlantDevice } from "./PlantDevice"
import { PlantDeviceBattery } from "./PlantDeviceBattery"
import { Layers } from "lucide-react"

declare const browser: any;

interface PlantDeviceListProps {
    ps_id: number;
}

export function PlantDeviceList({ ps_id }: PlantDeviceListProps) {
    const [devices, setDevices] = useState<PlantDeviceType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (ps_id) {
            loadDevices();
        }
    }, [ps_id]);

    const loadDevices = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await browser.runtime.sendMessage({
                action: 'getDeviceList',
                ps_id
            });

            if (response.success && response.data) {
                setDevices(response.data);
            } else {
                setError(response.error || "Failed to load devices");
            }
        } catch (e) {
            console.error("Failed to load devices", e);
            setError("Error communicating with background script");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="p-4 text-center text-xs text-slate-500 italic">Finding devices...</div>;
    }

    if (error) {
        return (
            <div className="p-3 bg-red-50 border border-red-100 rounded-md text-[11px] text-red-600">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center px-1">
                <Layers size={14} className="mr-2 text-slate-400" />
                Devices ({devices.length})
            </h3>

            {devices.length === 0 ? (
                <div className="text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <p className="text-[11px] text-slate-400">No devices found for this plant.</p>
                </div>
            ) : (
                <div className="grid gap-2">
                    {devices.map(device => (
                        device.device_type === 43 ? (
                            <PlantDeviceBattery key={device.uuid || device.device_sn} device={device} />
                        ) : (
                            <PlantDevice key={device.uuid || device.device_sn} device={device} />
                        )
                    ))}
                </div>
            )}
        </div>
    )
}
