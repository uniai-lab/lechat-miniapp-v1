import App from './App'
import uView from 'uview-ui'
import * as http from './common/http'
import * as conf from './common/config'
import * as func from './common/function'

// #ifndef VUE3
import Vue from 'vue'
Vue.config.productionTip = false
Vue.use(uView)

// 网络请求
Vue.prototype.$h = http

// 配置文件
Vue.prototype.$c = conf

// 工具方法
Vue.prototype.$f = func

App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  return {
    app
  }
}
// #endif
