<template>
  <view class="page">
    <NavBar title="个人中心" show-back />

    <NavCon>
      <view class="head" v-if="userinfo">
        <u-row>
          <u-col span="3">
            <view class="img-center">
              <image :src="userinfo.avatar" shape="square"></image>
            </view>
          </u-col>
          <u-col span="9">
            <view class="user-info">{{ userinfo.name }}</view>
            <view class="text-bottom" @tap="showTooltip = !showTooltip">
              <text>剩余对话：{{ userinfo.chance.totalChatChance }}次&nbsp;</text>
              <uni-icons type="help" size="32rpx" color="#00A29C" />
              <zb-tooltip :visible="showTooltip" placement="bottom" color="#00A29C">
                <view slot="content">
                  对话和上传次数每7天重置<br />
                  可通过完成任务获取额外的对话次数<br />
                  额外获取的对话及上传次数不会被重置。
                </view>
              </zb-tooltip>
            </view>
          </u-col>
        </u-row>
      </view>

      <view class="main-label">
        <view class="main-label-icon" v-if="config">
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

        <view class="task-box" v-if="userinfo">
          <view class="task" v-for="(item, index) in userinfo.task" :key="index">
            <view class="task-left"> {{ item.title }} </view>
            <view class="task-right">
              <text>{{ item.tip }}</text>
              <view class="task-button">
                <button class="my-button" :open-type="item.type === 1 ? 'share' : ''" @tap="task(item.type)">
                  {{ item.button }}
                </button>
              </view>
            </view>
          </view>
        </view>
      </view>
    </NavCon>

    <view class="bottom">
      <text class="bottom-text-left">{{ config.footer }}</text>
      &nbsp;&nbsp;
      <text class="bottom-text-right" @tap="copy()">{{ config.footerCopy }}</text>
    </view>
  </view>
</template>

<script>
import NavCon from '@/components/NavCon.vue'
import NavBar from '@/components/NavBar.vue'

export default {
  components: { NavBar, NavCon },
  data() {
    return {
      userinfo: null,
      config: null,
      showTooltip: false
    }
  },
  onLoad(e) {
    if (e && e.id) this.$f.set('fid', e.id)
    if (this.$f.get('userinfo')) this.userinfo = this.$f.get('userinfo')
    if (this.$f.get('config')) this.config = this.$f.get('config')
    this.getUserInfo()
    this.getConfig()
  },
  onShareAppMessage() {
    return {
      title: this.config.shareTitle,
      path: `/pages/index/index?id=${this.userinfo.id}`,
      imageUrl: this.config.shareImg
    }
  },
  methods: {
    watchAdv() {
      // 若在开发者工具中无法预览广告，请切换开发者工具中的基础库版本
      // 在页面中定义激励视频广告
      let videoAd = null
      // 在页面onLoad回调事件中创建激励视频广告实例
      if (wx.createRewardedVideoAd) {
        videoAd = wx.createRewardedVideoAd({
          adUnitId: 'adunit-370faef587c93ff0'
        })
        videoAd.onLoad(() => {})
        videoAd.onError(err => {
          console.error('激励视频光告加载失败', err)
        })
        videoAd.onClose(async res => {
          // 用户点击了【关闭广告】按钮
          if (res && res.isEnded) {
            this.$h.http('watch-adv', {}, 'GET').then(() => {
              const ad = this.userinfo.task.find(res => res.type == 3)
              const num = ad.tip.split('+')[1]
              uni.showToast({
                title: '对话次数+' + num
              })
              this.getConfig()
              this.getUserInfo()
            })
          } else {
            // 播放中途退出，不下发游戏奖励
            uni.showToast({
              title: '中途退出',
              icon: 'error'
            })
          }
        })
      }
      // 用户触发广告后，显示激励视频广告
      if (videoAd) {
        videoAd.show().catch(() => {
          // 失败重试
          videoAd
            .load()
            .then(() => videoAd.show())
            .catch(err => {
              console.error('激励视频 广告显示失败', err)
            })
        })
      }
    },
    task(type) {
      if (type === 1) this.share()
      else if (type === 2) this.copy()
      else if (type === 3) this.watchAdv()
    },
    copy() {
      uni.setClipboardData({
        data: this.config.officialAccount,
        success: () => uni.showToast({ title: '复制成功', icon: 'none' })
      })
    },
    // 任务按钮
    share() {
      uni.share({
        provider: 'weixin',
        title: this.config.shareTitle,
        desc: this.config.shareDesc,
        imageUrl: this.config.shareImg,
        path: '/pages/index/index?id=' + this.userinfo.id,
        success: () => uni.showToast({ title: '分享成功', icon: 'success' }),
        fail: e => uni.showToast({ title: `分享失败：${e.errMsg}`, icon: 'error' })
      })
    },
    async getConfig() {
      try {
        const data = await this.$h.http('config', {}, 'GET')
        this.$f.set('config', data)
        this.config = data
      } catch (e) {
        uni.showToast({ title: e.message, duration: 3000, icon: 'error' })
      }
    },
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
        uni.showToast({ title: e.message, duration: 3000, icon: 'error' })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  .head {
    margin-top: 50rpx;
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
</style>
