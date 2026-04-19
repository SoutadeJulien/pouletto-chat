import storage from './technical';

const KEY = 'server_url';

export const getServerUrl = () => storage.getItem(KEY);
export const setServerUrl = (url: string) => storage.setItem(KEY, url);
