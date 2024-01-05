<template>
  <view class="navbar">
    <!--空白来占位状态栏-->
    <view :style="{ height: statusHeight + 'px' }"></view>
    <view class="navigation-bar" :style="{ height: menuHeight + 'px' }">
      <uni-icons v-if="showBack" class="back" type="back" size="50rpx" @tap="back"></uni-icons>
      <view class="navbar-title">{{ title }}</view>
    </view>
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
  },
  props: {
    title: String,
    showBack: Boolean
  },
  methods: {
    back() {
      uni.navigateBack()
    }
  }
}
</script>
<style lang="scss" scoped>
.navbar {
  position: fixed;
  width: 100%;
  top: 0;
  z-index: 999;
  background: linear-gradient(to top, rgba(238, 255, 254, 0), rgba(238, 255, 254, 0.85) 30%, rgba(238, 255, 254, 1));

  .navigation-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    .back {
      position: absolute;
      left: 10rpx;
      font-size: 35rpx;
      color: #000;
    }

    .navbar-title {
      font-size: 35rpx;
      max-width: 60vw;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-weight: 400;
    }
  }
}
</style>
