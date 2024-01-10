export function get(key) {
  return uni.getStorageSync(key)
}

export function set(key, value) {
  return uni.setStorageSync(key, value)
}

export function remove(key) {
  return uni.removeStorageSync(key)
}
// 计算大小
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
// 计算文本大小
export function formatString(input) {
  if (input.length > 12) {
    const displayText = input.slice(0, 6) + '...' + input.slice(input.length - 6, input.length)
    return displayText
  } else {
    return input
  }
}

export function formatDate(date, fmt = 'yyyy-MM-dd hh:mm') {
  let o = {
    'M+': date.getMonth() + 1, // 月份
    'd+': date.getDate(), // 日
    'h+': date.getHours(), // 小时
    'm+': date.getMinutes(), // 分
    's+': date.getSeconds(), // 秒
    'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
    S: date.getMilliseconds() // 毫秒
  }
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
  for (let k in o)
    if (new RegExp('(' + k + ')').test(fmt))
      fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length))
  return fmt
}

export function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time))
}
