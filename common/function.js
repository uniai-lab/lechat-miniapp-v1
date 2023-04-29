import config from './config'

const getConfig = function (key, value = '') {
	return config[key] ?? ''
}

const get = function (key, value = '') {
	const res = uni.getStorageSync(key) ??  ''
	
	if(res) {
		return res
	}
	
	return value
}

const set = function (key, value = '') {
	return uni.setStorageSync(key, value);
}


const url = function (key, value = '') {
	return config['api_url'] ?? ''
}

const isNullOrUndefined =  function (value) {
  return (typeof value === 'undefined' || value === null) ? false : true;
}

export default {
  get,
  set,
  getConfig,
  url,
  isNullOrUndefined
}
