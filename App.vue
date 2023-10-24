<script>
import '@/iconfont/iconfont.scss'

export default {
  onLaunch() {
    const { statusBarHeight, platform, windowHeight } = uni.getSystemInfoSync()
    const { top, height } = uni.getMenuButtonBoundingClientRect()

    // 状态栏高度
    uni.setStorageSync('statusBarHeight', statusBarHeight)
    // menu高度
    uni.setStorageSync('menuButtonHeight', height)
    // 窗口高度
    uni.setStorageSync('windowHeight', windowHeight)

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
