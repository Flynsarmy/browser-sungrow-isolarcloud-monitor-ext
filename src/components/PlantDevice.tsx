import { PlantDevice as PlantDeviceType } from "@/types"
import {
    Zap,
    Power,
    Boxes,
    CloudSun,
    Gauge,
    Cpu,
    Factory,
    Home,
    Container,
    Settings,
    Battery,
    Fuel,
    Sun,
    Box
} from "lucide-react"

const DEVICE_ICONS: Record<number, any> = {
    1: Zap,         // Inverter
    3: Power,       // Grid-Connection Point
    4: Boxes,       // Combiner Box
    5: CloudSun,    // Meteo Station
    7: Gauge,       // Meter
    9: Cpu,         // Data Logger
    11: Factory,    // Plant
    14: Home,        // Energy Storage System
    17: Container,  // Unit
    41: Settings,    // Optimizer
    43: Battery,    // Battery
    51: Fuel,        // Charger
    55: Sun          // Microinverter
};

interface PlantDeviceProps {
    device: PlantDeviceType;
}

export function PlantDevice({ device }: PlantDeviceProps) {
    const Icon = DEVICE_ICONS[device.device_type] || Box;

    return (
        <div className="flex items-center p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-2 bg-slate-50 rounded-full mr-3 border border-slate-100">
                <Icon size={18} className="text-sky-600" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <h4 className="text-sm font-semibold text-slate-800 truncate" title={device.device_name}>
                        {device.device_name}
                    </h4>
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