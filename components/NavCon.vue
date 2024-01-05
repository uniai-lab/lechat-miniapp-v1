<template>
  <view class="content" :style="{ top: statusHeight + menuHeight + 'px' }">
    <slot></slot>
  </view>
</template>
<script>
export default {
  data() {
    return {
      // 导航栏和状态栏高度
      statusHeight: getApp().globalData().statusBarHeight,
      menuHeight: getApp().globalData().menuHeight
    }
  }
}
</script>

<style lang="scss" scoped>
.content {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}
</style>
