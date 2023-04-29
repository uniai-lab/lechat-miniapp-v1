import config from './config'
import func from './function'

const api_url = func.getConfig('api_url')

const http = function (url, data = {}, custom = {}) {
  let { method = 'post', loading = false, showError = true, toLogin = true } = custom
  if (loading)
    uni.showLoading({
      title: '加载中',
      mask: true
    })
	
	const token  = func.get('token') || '0';
	
  return new Promise((resolve, reject) => {
    uni.request({
      url: api_url + url,
      method: method,
      data: data,
      header: {
		  token:token,
	  },
      success: (res) => {
        if (loading) uni.hideLoading()
		
        if (Number(res.data.status) === 1) {
          resolve(res.data)
        } else if(Number(res.data.status) == -1){
			func.set('token', '');
			func.set('userinfo', '');
			uni.redirectTo({
			  url: '/pages/user/login'
			});
        } else {
			if (showError) {
			  uni.showToast({
			    title: res.data.msg,
			    duration: 2000,
			    icon: 'none'
			  })
			}
			reject(res.data)
		}
      },
      fail: (res) => {
        if (loading) uni.hideLoading()
        reject(res)
      }
    })
  })
}

export default {
  http
}
