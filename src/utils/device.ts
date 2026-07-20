const DEVICE_REGISTERED_KEY = 'mecure_device_registered';

export function markDeviceRegistered() {
  localStorage.setItem(DEVICE_REGISTERED_KEY, 'true');
}

export function isDeviceRegistered() {
  return localStorage.getItem(DEVICE_REGISTERED_KEY) === 'true';
}
