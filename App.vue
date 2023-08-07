<script>
export default {
  onLaunch() {
    const { statusBarHeight, platform } = uni.getSystemInfoSync()
    const { top, height } = uni.getMenuButtonBoundingClientRect()

    // 状态栏高度
    uni.setStorageSync('statusBarHeight', statusBarHeight)
    // 胶囊按钮高度 一般是32 如果获取不到就使用32
    uni.setStorageSync('menuButtonHeight', height ? height : 32)

    // 判断胶囊按钮信息是否成功获取
    if (top && top !== 0 && height && height !== 0) {
      const navigationBarHeight = (top - statusBarHeight) * 2 + height
      // 导航栏高度
      uni.setStorageSync('navigationBarHeight', navigationBarHeight)
    } else {
      uni.setStorageSync('navigationBarHeight', platform === 'android' ? 48 : 40)
    }
  }
}
</script>

<style>
/*每个页面公共css */

@font-face {
  font-family: 'iconfont'; /* Project id 3989967 */
  src:
    url('//at.alicdn.com/t/c/font_3989967_3lsu1swg7e8.woff2?t=1680606438211') format('woff2'),
    url('//at.alicdn.com/t/c/font_3989967_3lsu1swg7e8.woff?t=1680606438211') format('woff'),
    url('//at.alicdn.com/t/c/font_3989967_3lsu1swg7e8.ttf?t=1680606438211') format('truetype'),
    url('//at.alicdn.com/t/c/font_3989967_3lsu1swg7e8.svg?t=1680606438211#iconfont') format('svg');
}

.iconfont {
  font-family: 'iconfont' !important;
  font-size: 30rpx;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.icon-shangchuan:before {
  content: '\e611';
}

.icon-wenti:before {
  content: '\e612';
}

.icon-wenhao:before {
  content: '\e613';
}

.icon-cunchu:before {
  content: '\e614';
}

.icon-yulan:before {
  content: '\e615';
}

.icon-bangzhu:before {
  content: '\e616';
}

.icon-xianliaoduihua:before {
  content: '\e617';
}

.icon-weixindenglu:before {
  content: '\e618';
}
</style>
