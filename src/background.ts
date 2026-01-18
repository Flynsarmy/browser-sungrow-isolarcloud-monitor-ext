import {
  ApiResponse,
  Browser,
  Credentials,
  LoginResultData,
  MessageAction,
  Plant,
  PlantDevice,
  PlantListRequest,
  PlantListResultData,
  RefreshTokenRequest,
  RefreshTokenResultData,
  TokenRequest,
  PlantDevicePointData
} from './types';

// Browser namespace for Firefox (and Chrome with polyfill)
declare const browser: Browser;

// Listen for messages from popup
browser.runtime.onMessage.addListener((request: MessageAction, _sender: any, sendResponse: (response: any) => void) => {
  if (request.action === 'authenticate') {
    authenticateWithSungrow(request.credentials)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Indicates async response
  }

  if (request.action === 'getStoredCredentials') {
    browser.storage.local.get(['appKey', 'secretKey', 'authUrl', 'gatewayUrl', 'accessToken', 'refreshToken', 'tokenExpiry', 'selectedPlantId'])
      .then((data) => sendResponse({ success: true, data }))
      .catch((error: any) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'storeCredentials') {
    // Only store user-provided credentials, not tokens
    browser.storage.local.set(request.credentials)
      .then(() => sendResponse({ success: true }))
      .catch((error: any) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'getPlantList') {
    fetchPlantList()
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'getDeviceList') {
    fetchDeviceList(request.ps_id)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'getDevicePointData') {
    fetchDevicePointData(request.device_type, request.ps_key, request.point_ids)
      .then((result: PlantDevicePointData[]) => sendResponse({ success: true, data: result }))
      .catch((error: any) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'refreshToken') {
    refreshToken()
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  return true; // Default return for listener
});

async function authenticateWithSungrow(credentials: Credentials) {
  const { appKey, secretKey, authUrl, gatewayUrl } = credentials as {
    appKey: string;
    secretKey: string;
    authUrl: string;
    gatewayUrl: string;
  };

  if (!appKey || !secretKey || !authUrl) {
    throw new Error('App Key, Secret Key, and Authorization URL are required');
  }

  // Use provided gateway URL or default
  const gatewayBase: string = gatewayUrl || 'https://augateway.isolarcloud.com';

  // Construct Auth URL
  let authUrlObj: URL;
  try {
    // Split by the first '?' to handle existing params
    const [authUrlBase, authUrlQuery] = authUrl.split('?') as [string, string | undefined];
    const authUrlparams = new URLSearchParams(authUrlQuery);
    const redirectUrl = browser.identity.getRedirectURL();
    console.log('Redirect URL:', redirectUrl);

    authUrlparams.set('redirectUrl', redirectUrl);
    authUrlObj = new URL(`${authUrlBase}?${authUrlparams.toString()}`);
  } catch (error: any) {
    throw new Error('Invalid Authorization URL format: ' + error.message);
  }

  try {
    const redirectedTo = await browser.identity.launchWebAuthFlow({
      interactive: true,
      url: authUrlObj.toString()
    });

    if (!redirectedTo) {
      throw new Error('Authentication flow was cancelled or failed');
    }

    const urlParams = new URLSearchParams(new URL(redirectedTo).search);
    const authorizationCode = urlParams.get('code');

    if (!authorizationCode) {
      throw new Error('Authorization code not found in redirect URL');
    }

    // Exchange authorization code for tokens
    const tokenUrl: string = `${gatewayBase}/openapi/apiManage/token`;

    const tokenRequest: TokenRequest = {
      appkey: appKey,
      grant_type: "authorization_code",
      code: authorizationCode,
      redirect_uri: browser.identity.getRedirectURL()
    };

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-key': secretKey,
      },
      body: JSON.stringify(tokenRequest)
    });

    const authData: ApiResponse<LoginResultData> = await tokenResponse.json();
    console.log('Authentication data received:', authData);

    if (authData.result_code !== "1") {
      throw new Error(authData.result_msg || 'Authentication failed during token exchange');
    }

    // Store tokens
    await browser.storage.local.set({
      accessToken: authData.result_data.access_token,
      refreshToken: authData.result_data.refresh_token,
      tokenExpiry: Date.now() + (authData.result_data.expires_in * 1000),
      appKey: appKey,
      secretKey: secretKey,
      // Store cleaned authUrl if needed, or just keep what user typed?
      // User typed one is better for future.
      authUrl: authUrl,
      gatewayUrl: gatewayBase
    });

    // Schedule token refresh
    browser.alarms.create('tokenRefresh', {
      delayInMinutes: (authData.result_data.expires_in - 60) / 60
    });

    return {
      authenticated: true,
      tokenExpiry: Date.now() + (authData.result_data.expires_in * 1000)
    };

  } catch (error: any) {
    console.error('Sungrow authentication error:', error);
    throw new Error('Authentication failed: ' + (error.message || String(error)));
  }
}

// Check token expiry and refresh if needed
browser.alarms.onAlarm.addListener((alarm: { name: string }) => {
  if (alarm.name === 'tokenRefresh') {
    refreshToken();
  } else if (alarm.name === 'batteryUpdate') {
    updateBatteryBadge();
  }
});

// Listen for storage changes to update badge when plant selection changes
browser.storage.onChanged.addListener((changes: any, areaName: string) => {
  if (areaName === 'local' && changes.selectedPlantId) {
    updateBatteryBadge();
  }
});

// Start periodic battery updates
browser.alarms.create('batteryUpdate', {
  periodInMinutes: 5
});

// Initial update
updateBatteryBadge();

async function refreshToken() {
  try {
    const stored = await browser.storage.local.get(['refreshToken', 'appKey', 'secretKey', 'gatewayUrl']) as {
      refreshToken: string;
      appKey: string;
      secretKey: string;
      gatewayUrl: string;
    };

    if (!stored.refreshToken) {
      console.log('No refresh token available');
      throw new Error('No refresh token available');
    }

    const gatewayBase: string = stored.gatewayUrl || 'https://augateway.isolarcloud.com';

    // Note: API doc says only refresh_token, but keeping appKey as optional in my type just in case.
    // Constructing strict request object.
    const refreshRequest: RefreshTokenRequest = {
      refresh_token: stored.refreshToken,
      appkey: stored.appKey // Including it as per previous code logic, though doc is silent.
    };

    const response = await fetch(`${gatewayBase}/openapi/apiManage/refreshToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-key': stored.secretKey
      },
      body: JSON.stringify(refreshRequest)
    });

    if (response.ok) {
      const data: ApiResponse<RefreshTokenResultData> = await response.json();

      if (data.result_code !== "1") {
        throw new Error(data.result_msg || 'Token refresh API error');
      }

      await browser.storage.local.set({
        accessToken: data.result_data.access_token,
        refreshToken: data.result_data.refresh_token,
        tokenExpiry: Date.now() + (data.result_data.expires_in * 1000)
      });

      browser.alarms.create('tokenRefresh', {
        delayInMinutes: (data.result_data.expires_in - 60) / 60
      });

      return {
        success: true,
        tokenExpiry: Date.now() + (data.result_data.expires_in * 1000)
      };
    } else {
      throw new Error('Token refresh request failed');
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
}

async function fetchPlantList(): Promise<Plant[]> {
  try {
    const stored = await browser.storage.local.get(['appKey', 'secretKey', 'gatewayUrl', 'accessToken']) as {
      appKey: string;
      secretKey: string;
      gatewayUrl: string;
      accessToken: string;
    };

    if (!stored.appKey || !stored.secretKey) {
      throw new Error('Missing credentials');
    }

    const gatewayBase: string = stored.gatewayUrl || 'https://augateway.isolarcloud.com';

    const plantListRequest: PlantListRequest = {
      appkey: stored.appKey,
      page: 1,
      size: 10
    };

    const response = await fetch(`${gatewayBase}/openapi/platform/queryPowerStationList`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-key': stored.secretKey,
        "Authorization": `Bearer ${stored.accessToken}`
      },
      body: JSON.stringify(plantListRequest)
    });

    if (response.ok) {
      const data: ApiResponse<PlantListResultData> = await response.json();
      if (data.result_code !== "1") {
        throw new Error(data.result_msg || 'Failed to fetch plant list');
      }
      return data.result_data.pageList;
    } else {
      throw new Error('Network response was not ok');
    }
  } catch (error) {
    console.error('Fetch plant list failed:', error);
    throw error;
  }
}

async function fetchDeviceList(psId: number): Promise<PlantDevice[]> {
  try {
    const stored = await browser.storage.local.get(['appKey', 'secretKey', 'gatewayUrl', 'accessToken']) as {
      appKey: string;
      secretKey: string;
      gatewayUrl: string;
      accessToken: string;
    };

    if (!stored.appKey || !stored.secretKey) {
      throw new Error('Missing credentials');
    }

    const gatewayBase: string = stored.gatewayUrl || 'https://augateway.isolarcloud.com';

    // Request as per API documentation
    const deviceListRequest = {
      appkey: stored.appKey,
      ps_id: String(psId),
      page: 1,
      size: 50 // Get up to 50 devices
    };

    const response = await fetch(`${gatewayBase}/openapi/platform/getDeviceListByPsId`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-key': stored.secretKey,
        "Authorization": `Bearer ${stored.accessToken}`
      },
      body: JSON.stringify(deviceListRequest)
    });

    if (response.ok) {
      const data: ApiResponse<{ pageList: PlantDevice[] }> = await response.json();
      if (data.result_code !== "1") {
        throw new Error(data.result_msg || 'Failed to fetch device list');
      }
      return data.result_data.pageList;
    } else {
      throw new Error('Network response was not ok');
    }
  } catch (error) {
    console.error('Fetch device list failed:', error);
    throw error;
  }
}

async function fetchDevicePointData(deviceType: number, psKey: string, pointIds: number[]): Promise<PlantDevicePointData[]> {
  try {
    const stored = await browser.storage.local.get(['appKey', 'secretKey', 'gatewayUrl', 'accessToken']) as {
      appKey: string;
      secretKey: string;
      gatewayUrl: string;
      accessToken: string;
    };

    if (!stored.appKey || !stored.secretKey) {
      throw new Error('Missing credentials');
    }

    const gatewayBase: string = stored.gatewayUrl || 'https://augateway.isolarcloud.com';

    // Request as per API documentation
    const devicePointDataRequest = {
      appkey: stored.appKey,
      device_type: deviceType,
      ps_key_list: [psKey],
      point_id_list: pointIds.map(String),
      is_get_point_dict: "1" // Optional, but can be helpful
    };

    const response = await fetch(`${gatewayBase}/openapi/platform/getDeviceRealTimeData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-key': stored.secretKey,
        "Authorization": `Bearer ${stored.accessToken}`
      },
      body: JSON.stringify(devicePointDataRequest)
    });

    if (response.ok) {
      const data: ApiResponse<{ device_point_list: { device_point: PlantDevicePointData }[] }> = await response.json();
      if (data.result_code !== "1") {
        throw new Error(data.result_msg || 'Failed to fetch device point data');
      }
      return data.result_data.device_point_list.map(item => item.device_point);
    } else {
      throw new Error('Network response was not ok');
    }
  } catch (error) {
    console.error('Fetch device point data failed:', error);
    throw error;
  }
}

async function updateBatteryBadge() {
  try {
    const stored = await browser.storage.local.get(['selectedPlantId', 'accessToken']) as {
      selectedPlantId?: string;
      accessToken?: string;
    };

    if (!stored.selectedPlantId || !stored.accessToken) {
      await browser.action.setBadgeText({ text: '' });
      return;
    }

    const psId = parseInt(stored.selectedPlantId);
    if (isNaN(psId)) return;

    // 1. Get devices for the selected plant
    const devices = await fetchDeviceList(psId);

    // 2. Find battery device (type 43)
    const battery = devices.find(d => d.device_type === 43);

    if (!battery) {
      await browser.action.setBadgeText({ text: '' });
      return;
    }

    // 3. Get SOC point data
    const pointData = await fetchDevicePointData(battery.device_type, battery.ps_key, [58604]);

    if (pointData && pointData.length > 0) {
      const data = pointData[0];
      const socValue = data["p58604"];

      if (socValue !== undefined && socValue !== null) {
        const soc = Math.round(parseFloat(socValue) * 1000) / 10;
        await browser.action.setBadgeText({ text: `${Math.round(soc)}%` });
        await browser.action.setBadgeBackgroundColor({ color: '#10b981' }); // emerald-500
      } else {
        await browser.action.setBadgeText({ text: '' });
      }
    } else {
      await browser.action.setBadgeText({ text: '' });
    }
  } catch (error) {
    console.error('Failed to update battery badge:', error);
  }
}