// Basic credential types
export interface Credentials {
    appKey: string;
    secretKey: string;
    authUrl: string;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiry?: number;
    gatewayUrl?: string; // e.g. https://augateway.isolarcloud.com
    selectedPlantId?: string;
    plantList?: Plant[];
}

// API Request Types
export interface TokenRequest {
    appkey: string;
    grant_type: 'authorization_code';
    code: string;
    redirect_uri: string;
}

export interface RefreshTokenRequest {
    refresh_token: string;
    // appkey is not listed in doc for refresh, but was used in code.
    // Keeping it optional or removing if confirmed not needed.
    // Doc example showed ONLY refresh_token.
    appkey?: string;
}

export interface PlantListRequest {
    appkey: string;
    page: number;
    size: number;
    // Optional filters
    ps_type?: string;
    ps_name?: string;
    valid_flag?: string;
}

// API Response Wrappers
export interface ApiResponse<T> {
    req_serial_num?: string;
    result_code: string; // "1" for success
    result_msg: string;
    result_data: T;
}

// Specific Result Data Types
export interface LoginResultData {
    access_token: string;
    token_type: string; // "bearer"
    refresh_token: string;
    expires_in: number; // seconds
    auth_ps_list: string[]; // List of plant IDs
    auth_user: number; // User ID
}

export interface RefreshTokenResultData {
    access_token: string;
    refresh_token: string;
    code: string; // "1"
    token_type: string; // "bearer"
    expires_in: number;
}

export interface PlantListResultData {
    pageList: Plant[];
    row_count: string; // Doc says String
}

export interface Plant {
    ps_id: number;
    ps_name: string;
    description: string | null;
    ps_type: number;
    online_status: number; // 1: Deployed; 0: Undeployed
    valid_flag: number; // 1: Normal; 2: Disabled; 3: Connected
    grid_connection_status: number;
    install_date: string;
    ps_location: string;
    latitude: string;
    longitude: string;
    ps_fault_status: number; // 1: Fault; 2: Alarm; 3: Normal
    connect_type: number;
    update_time: string;
    ps_current_time_zone: string;
    grid_connection_time: string | null; // Can be null in example
    build_status: number;
}

export interface FirmwareVersionInfo {
    bat_version?: string;
    lcd_version?: string;
    mdsp_version?: string;
    sdsp_version?: string;
    pvd_version?: string;
    cpld_version?: string;
    temp_version?: string;
    m_version?: string;
    system_version?: string;
}

export interface PlantDevice {
    uuid: number;
    ps_key: string;
    device_sn: string;
    device_name: string;
    device_type: number;
    type_name: string;
    device_model_id: number;
    device_model_code: string;
    dev_fault_status: number;
    dev_status: string;
    claim_state: number;
    device_code: number;
    chnnl_id: number;
    communication_dev_sn: string;
    factory_name: string;
    firmware_version_info: FirmwareVersionInfo;
    grid_connection_date: string;
    ps_id: number;
}

export interface PlantDevicePointData {
    ps_key: string;
    device_sn: string;
    uuid: number;
    device_name: string;
    device_time: string;
    ps_id: number;
    dev_status: number;
    dev_fault_status: number;
    communication_dev_sn: string;
    [key: string]: any; // To support dynamic p + point_id fields
}

// Internal Messaging types
export type MessageAction =
    | { action: 'authenticate'; credentials: Credentials }
    | { action: 'getStoredCredentials' }
    | { action: 'storeCredentials'; credentials: Credentials }
    | { action: 'refreshToken' }
    | { action: 'getPlantList' }
    | { action: 'getDeviceList'; ps_id: number }
    | { action: 'getDevicePointData'; device_type: number, ps_key: string, point_ids: number[] };

export interface MessageResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

// Minimal Browser WebExtension Types (to avoid 'any')
export interface BrowserStorageLocal {
    get(keys: string | string[] | null): Promise<{ [key: string]: any }>;
    set(items: { [key: string]: any }): Promise<void>;
    remove(keys: string | string[]): Promise<void>;
}

export interface BrowserIdentity {
    getRedirectURL(): string;
    launchWebAuthFlow(details: { interactive?: boolean; url: string }): Promise<string>;
}

export interface BrowserRuntime {
    sendMessage(message: any): Promise<any>;
    onMessage: {
        addListener(callback: (request: any, sender: any, sendResponse: (response: any) => void) => boolean | Promise<any> | void): void;
    };
}

export interface BrowserAlarms {
    create(name: string, alarmInfo: { delayInMinutes?: number; periodInMinutes?: number }): void;
    onAlarm: {
        addListener(callback: (alarm: { name: string }) => void): void;
    };
}

export interface BrowserAction {
    setBadgeText(details: { text: string | null; tabId?: number }): Promise<void>;
    setBadgeBackgroundColor(details: { color: string | number[] | null; tabId?: number }): Promise<void>;
}

export interface Browser {
    storage: {
        local: BrowserStorageLocal;
        onChanged: {
            addListener(callback: (changes: { [key: string]: { oldValue?: any; newValue?: any } }, areaName: string) => void): void;
        };
    };
    identity: BrowserIdentity;
    runtime: BrowserRuntime;
    alarms: BrowserAlarms;
    action: BrowserAction;
}
