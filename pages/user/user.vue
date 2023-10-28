<template>
  <view class="page">
    <view class="navbar">
      <!--空白来占位状态栏-->
      <view :style="{ height: statusBarHeight + 'px' }"></view>
      <view class="navigation-bar" :style="{ height: navigationBarHeight + 'px' }">
        <uni-icons class="back" type="back" size="50rpx" @tap="back"></uni-icons>
        <view class="navbar-title">个人中心</view>
      </view>
    </view>
    <view :style="{ top: statusBarHeight + navigationBarHeight + 'px' }" class="content">
      <view class="head">
        <u-row>
          <u-col span="3">
            <view class="img-center">
              <image :src="userinfo.avatar" shape="square"></image>
            </view>
          </u-col>
          <u-col span="9">
            <view class="user-info">
              <text>{{ userinfo.name }}</text>
              <view class="text-center">免费用户</view>
            </view>
            <view class="text-bottom" @tap="showTooltip = !showTooltip">
              <text>剩余对话：{{ userinfo.chance.totalChatChance }}次</text>
              <text class="icon iconfont icon-wenhao"></text>
              <zb-tooltip :visible="showTooltip" placement="bottom" color="#00A29C">
                <div slot="content">
                  对话次数每7天重置<br />可通过完成任务获取额外的对话次数<br />额外对话次数不会被重置。
                </div>
              </zb-tooltip>
            </view>
          </u-col>
        </u-row>
      </view>

      <view class="main-label">
        <view class="main-label-icon">
          <view class="item" v-for="(item, index) in config.menu" :key="index">
            <view class="item-logo">
              <image :src="item.image" shape="square"></image>
            </view>
            <view class="item-title">
              <text>{{ item.title }}</text>
            </view>
            <view class="item-tip">
              <text>{{ item.tip }}</text>
            </view>
          </view>
        </view>
        <view class="task-box">
          <view class="task" v-for="(item, index) in userinfo.task" :key="index">
            <view class="task-left">
              <text>{{ item.title }}</text>
            </view>
            <view class="task-right">
              <text>{{ item.tip }}</text>
              <view class="task-button">
                <button v-if="item.type == 1" class="my-button" open-type="share" @tap="bottonTask(item)">
                  {{ item.button }}
                </button>

                <button v-else :class="item.flag ? 'my-button' : 'my-button-flag'" @tap="bottonTask(item)">
                  {{ item.button }}
                </button>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="bottom">
        <text class="bottom-text-left">{{ config.footer }}</text>
        &nbsp;&nbsp;
        <text class="bottom-text-right" @tap="copy()">{{ config.footerCopy }}</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      statusBarHeight: wx.getStorageSync('statusBarHeight'),
      navigationBarHeight: wx.getStorageSync('navigationBarHeight'),
      windowHeight: wx.getStorageSync('windowHeight'),
      tisShow: false,
      tisContent: '对话次数每7天重置，可通过完成任务获取额外的对话次数，额外对话次数不会被重置。',
      userinfo: {},
      config: {},
      label: [],
      showTooltip: false,
      hideScreenCove: true
    }
  },
  onLoad(e) {
    if (e && e.id) this.$f.set('fid', e.id)
  },
  onShow() {
    if (this.$f.get('userinfo', '')) {
      this.userinfo = this.$f.get('userinfo', '')
    }

    if (!this.$f.get('config')) {
      this.getConfig()
    } else {
      this.config = this.$f.get('config', '{}')
    }
    this.getUserInfo()
  },

  onShareAppMessage() {
    return {
      title: this.config.shareTitle,
      path: `/pages/index/index?id=${this.userinfo.id}`,
      imageUrl: this.config.shareImg
    }
  },

  methods: {
    back() {
      uni.navigateBack()
    },

    copy(text) {
      uni.setClipboardData({
        data: this.config.officialAccount,
        success: () => {
          uni.showToast({
            title: '复制成功',
            icon: 'none'
          })
        }
      })
    },

    // 任务按钮
    bottonTask(e) {
      if (!e.flag) return false
      if (e.type == 1) {
        uni.share({
          provider: 'weixin',
          title: this.config.shareTitle,
          desc: this.config.shareDesc,
          imageUrl: this.config.shareImg,
          path: '/pages/index/index?id=' + this.userinfo.id,
          success: () => {
            uni.showToast({
              title: '分享成功'
            })
          },
          fail: e => {
            uni.showToast({
              title: `分享失败：${e.message}`
            })
          }
        })
      } else {
        uni.setClipboardData({
          data: this.config.officialAccount,
          success: () => {
            uni.showToast({
              title: '复制成功，请关注公众号IICT',
              icon: 'none'
            })
          }
        })
      }
    },

    async getConfig() {
      try {
        const data = await this.$h.http('config', {}, 'GET')
        this.$f.set('config', data)
        this.config = data
      } catch (e) {
        uni.showToast({
          title: e.message,
          duration: 3000,
          icon: 'error'
        })
      }
    },

    // 用户信息
    async getUserInfo() {
      try {
        const data = await this.$h.http('userinfo', {}, 'GET')
        this.$f.set('userinfo', data)
        this.userinfo = data
      } catch (e) {
        this.$f.remove('userinfo')
        this.$f.remove('id')
        this.$f.remove('token')
        this.$f.remove('openid')
        uni.showToast({
          title: e.message,
          duration: 3000,
          icon: 'error'
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  .navbar {
    position: absolute;
    width: 100%;
    top: 0;

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

  .content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    margin-top: 50rpx;
    .head {
      padding: 30rpx;
      .img-center {
        text-align: center;
        image {
          width: 100rpx;
          height: 100rpx;
        }
      }

      .user-info {
        display: flex;
        align-items: center;
        text {
          margin-right: 10rpx;
          color: #000000;
          font-size: 43.44rpx;
          font-weight: 400;
        }
        .text-center {
          margin-left: 20rpx;
          background-color: #babcbb;
          padding: 5rpx 10rpx;
          color: #fff;
          border-radius: 10rpx;
          font-size: 24rpx;
        }
      }

      .text-bottom {
        display: flex;
        align-items: center;
        margin-top: 12rpx;
        text {
          color: #00a29c;
          font-size: 28rpx;
        }
        .icon-wenhao {
          font-size: 28rpx;
          margin-left: 8rpx;
        }
      }
    }
    .main-label {
      border: solid 1px #00a29c;
      padding: 40rpx;
      border-radius: 1rem;
      width: 76vw;
      margin: 0 auto;
      margin-top: 55rpx;
      .main-label-icon {
        margin: 30rpx 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        .item {
          flex: 1;
          text-align: center;
          .item-logo {
            display: flex;
            justify-content: center;
            image {
              margin: 0 auto;
              width: 44rpx;
              height: 44rpx;
            }
          }

          .item-title {
            margin-top: 20rpx;
            color: #333333;
            font-size: 30.53rpx;
          }

          .item-tip {
            margin-top: 8rpx;
            color: #a8a8a8;
            font-size: 22.9rpx;
          }
        }
      }
      .task-box {
        margin-top: 60rpx;

        .task {
          display: flex;
          justify-content: space-between;
          margin-top: 30rpx;

          .task-left {
            display: flex;
            font-size: 27rpx;
            align-items: center;

            text {
              color: #000000;
              font-size: 27rpx;
              font-family:
                PingFangSC-Medium,
                PingFang SC;
              font-weight: 500;
              color: #000000;
              line-height: 69rpx;
            }
          }

          .task-right {
            display: flex;
            align-items: center;
            justify-content: space-between;

            text {
              font-size: 25rpx;
              color: #5b5b5b;
              margin-right: 17rpx;
            }

            .task-button {
              background: #00a29c;
              border-radius: 17rpx;
              font-size: 22.9rpx;
              color: #ffffff;

              .my-button {
                background: #00a29c;
                border-radius: 10rpx;
                font-size: 20rpx;
                color: #ffffff;
                padding: 0rpx 10rpx;
              }

              .my-button-flag {
                background: #adadad;
                border-radius: 10rpx;
                font-size: 20rpx;
                color: #ffffff;
                padding: 0rpx 10rpx;
              }
            }
          }
        }
      }
    }

    .bottom {
      position: fixed;
      text-align: center;
      bottom: 60rpx;
      width: 100%;

      font-size: 27rpx;
      line-height: 38rpx;
      .bottom-text-left {
        font-weight: 400;
        color: #5b5b5b;
      }

      .bottom-text-right {
        font-weight: 500;
        color: #00a29c;
      }
    }
  }
}
</style>
