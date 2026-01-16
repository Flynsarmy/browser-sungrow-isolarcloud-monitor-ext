import { useState, useEffect } from "react"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plant } from "@/types"
import { PlantDetails } from "./PlantDetails"

declare const browser: any;

export function PlantSelection() {
    const [plants, setPlants] = useState<Plant[]>([]);
    const [selectedId, setSelectedId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadPlants();
    }, []);

    const loadPlants = async () => {
        setIsLoading(true);
        try {
            const stored = await browser.storage.local.get(['plantList', 'selectedPlantId']);
            if (stored.plantList && stored.plantList.length > 0) {
                setPlants(stored.plantList);
                if (stored.selectedPlantId) setSelectedId(stored.selectedPlantId);
            } else {
                // Fetch
                const response = await browser.runtime.sendMessage({ action: 'getPlantList' });
                if (response.success && response.data) {
                    setPlants(response.data);
                    await browser.storage.local.set({ plantList: response.data });
                    if (stored.selectedPlantId) setSelectedId(stored.selectedPlantId);
                }
            }
        } catch (e) {
            console.error("Failed to load plants", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedId(id);
        browser.storage.local.set({ selectedPlantId: id });
    };

    const selectedPlant = plants.find(p => String(p.ps_id) === selectedId);

    return (
        <Card className="w-full border-0 shadow-none">
            <CardHeader className="px-0 pt-0 pb-2">
                <CardTitle className="text-lg">Plant Status</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
                <div className="mb-4">
                    <Select value={selectedId} onChange={handleSelect} disabled={isLoading}>
                        <option value="">{isLoading ? "Loading Plants..." : "Select a plant..."}</option>
                        {plants.map(plant => (
                            <option key={plant.ps_id} value={String(plant.ps_id)}>
                                {plant.ps_id} - {plant.ps_name}
                            </option>
                        ))}
                    </Select>
                </div>

                {selectedPlant && <PlantDetails plant={selectedPlant} />}
            </CardContent>
        </Card>
    )
}
