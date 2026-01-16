import { Plant } from "@/types"
import { PlantDeviceList } from "./PlantDeviceList"

const PLANT_TYPES: Record<number, string> = {
    1: 'Utility Plant',
    3: 'Distributed PV',
    4: 'Residential PV',
    5: 'Residential Storage',
    6: 'Village Plant',
    7: 'Dist. Storage',
    8: 'Poverty Alleviation',
    9: 'Wind Power',
    12: 'C&I Storage'
};

const FAULT_STATUS: Record<number, { text: string; class: string }> = {
    1: { text: 'Fault', class: 'bg-red-50 text-red-600 border-red-100' },
    2: { text: 'Alarm', class: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
    3: { text: 'Normal', class: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
};

interface PlantDetailsProps {
    plant: Plant;
}

export function PlantDetails({ plant }: PlantDetailsProps) {
    return (
        <div className="space-y-4">
            <div className="bg-white border rounded-md p-3 text-sm space-y-2">
                <DetailRow label="ID" value={String(plant.ps_id)} />
                <DetailRow label="Name" value={plant.ps_name} />
                <DetailRow label="Location" value={plant.ps_location} truncate />
                <DetailRow label="Type" value={PLANT_TYPES[plant.ps_type] || 'Unknown'} />
                <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-100 last:border-0">
                    <span className="text-slate-500 font-medium">Status</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${FAULT_STATUS[plant.ps_fault_status]?.class || 'bg-gray-100'}`}>
                        {FAULT_STATUS[plant.ps_fault_status]?.text || 'Unknown'}
                    </span>
                </div>
                <DetailRow label="Online" value={plant.online_status === 1 ? 'Online' : 'Offline'} />
                <DetailRow label="Installed" value={plant.install_date?.split(' ')[0] || '-'} />
            </div>

            <PlantDeviceList ps_id={plant.ps_id} />
        </div>
    );
}

function DetailRow({ label, value, truncate }: { label: string, value: string, truncate?: boolean }) {
    return (
        <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-100 last:border-0">
            <span className="text-slate-500 font-medium">{label}</span>
            <span className={`font-semibold text-slate-700 ${truncate ? 'max-w-[150px] truncate' : ''}`} title={value}>
                {value}
            </span>
        </div>
    )
}
