<script>
export default {
  globalData() {
    const { platform, statusBarHeight, windowHeight, safeAreaInsets } = uni.getSystemInfoSync()
    const { top, height } = uni.getMenuButtonBoundingClientRect()
    const menuHeight = (top - statusBarHeight) * 2 + height
    console.log(safeAreaInsets)

    return {
      platform,
      statusBarHeight,
      menuHeight,
      windowHeight,
      safeBottom: safeAreaInsets.bottom
    }
  }
}
</script>
<style>
@import './common/style.scss';
</style>
