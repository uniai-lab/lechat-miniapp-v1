<script>
import '@/iconfont/iconfont.scss'

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
