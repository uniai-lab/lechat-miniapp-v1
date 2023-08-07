<template>
  <view class="u-page content">
    <view class="navigation-container" :style="{ height: navigationBarAndStatusBarHeight }">
      <!--空白来占位状态栏-->
      <view :style="{ height: statusBarHeight }"></view>
      <!--自定义导航栏-->
      <view class="navigation-bar" :style="{ height: navigationBarHeight }">
        <image src="../../static/logo.png" class="logo" mode="aspectFit"></image>
      </view>
    </view>
    <view class="u-demo-block">
      <view class="u-demo-block__content">
        <u-row class="head-block">
          <u-col span="3">
            <view class="img-center">
              <image :src="userinfo.avatar" v-if="isLogin"></image>
              <image src="../../static/avatar.png" v-else @tap="login"></image>
            </view>
          </u-col>
          <u-col span="9">
            <view class="user-login" v-if="!isLogin" @tap="login()">
              <text>点击登录</text>
            </view>
            <view class="user-info" v-if="isLogin" @tap="user()">
              <text>{{ userinfo.name }}</text>
              <image class="arrow" src="../../static/arrow.png"></image>
            </view>
            <view class="user-tip">
              <text>大模型文献分析与对话小程序</text>
            </view>
          </u-col>
        </u-row>
      </view>

      <view class="upload">
        <view class="block" @tap="upload()">
          <image src="../../static/upload.png" mode=""></image>
          <view class="text">文献上传</view>
        </view>
        <view class="block" @tap="chat(null)">
          <image src="../../static/chat.png" mode=""></image>
          <view class="text">任意聊天</view>
        </view>
      </view>
    </view>

    <view class="file">
      <text class="file-text">我的文档</text>
      <text class="file-num">剩余可上传{{ userinfo.chance.totalUploadChance || 0 }}个文档</text>
    </view>

    <view class="document">
      <view class="documents-wrapper" v-if="isLogin && document.length">
        <view class="u-demo-block__content" v-for="(item, index) in document" :key="index">
          <u-row customStyle="margin-bottom: 10px">
            <u-col span="2" @tap="chat(item.dialogId, item.fileName)">
              <view class="bg-purple-light img-file">
                <image src="../../static/pdf.png" shape="square"></image>
              </view>
            </u-col>
            <u-col span="8" @tap="chat(item.dialogId, item.fileName)">
              <view class="file-name">
                <text>{{ item.fileName }}</text>
              </view>
              <view class="file-date">
                <text>{{ item.date }} {{ item.size }}</text>
              </view>
            </u-col>
            <u-col span="2" @tap="preview(item)">
              <view class="icon iconfont icon-yulan"></view>
            </u-col>
          </u-row>
        </view>
      </view>
      <view class="document-empty" v-else @tap="upload()">
        <image src="../../static/null.png" class="img"></image>
        <text class="tip">您未上传文档</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      statusBarHeight: wx.getStorageSync('statusBarHeight') + 'px',
      navigationBarHeight: wx.getStorageSync('navigationBarHeight') + 'px',
      menuButtonHeight: wx.getStorageSync('menuButtonHeight') + 'px',
      navigationBarAndStatusBarHeight:
        wx.getStorageSync('statusBarHeight') + wx.getStorageSync('navigationBarHeight') + 'px',
      isLogin: false,
      userinfo: {
        name: 'loading...'
      },
      config: {},
      document: []
    }
  },
  onLoad(e) {
    if (e && e.id) this.$f.set('fid', e.id)
    this.getConfig()
    this.init()
  },
  onShow() {},
  onShareAppMessage() {
    return {
      path: '/pages/index/index?id=' + this.userinfo.id,
      title: this.config.share.title || 'AI文档分析利器，不来试试吗？',
      imageUrl: this.config.share.img || '../../static/share.jpg'
    }
  },
  methods: {
    // 登录验证
    async init() {
      // 判断是否登录成功
      if (this.$f.get('token') && this.$f.get('id') && this.$f.get('openid')) {
        this.getUserInfo()
        this.documentList()
      } else {
        try {
          const code = await this.$h.login()
          const data = await this.$h.http('login', { code, fid: this.$f.get('fid') || 0 })
          this.$f.set('token', data.token)
          this.$f.set('id', data.id)
          this.$f.set('openid', data.wxOpenId)
          this.documentList()
          this.getUserInfo()
        } catch (e) {
          uni.showToast({
            title: e.message,
            icon: 'none'
          })
        }
      }
    },

    // 点击上传
    upload() {
      if (!this.isLogin)
        return uni.navigateTo({
          url: '/pages/user/login'
        })

      if (!this.userinfo.phone)
        return uni.navigateTo({
          url: '/pages/user/login'
        })

      // 判断是否可以上传
      if (this.userinfo.chance.totalUploadChance <= 0)
        return uni.showToast({ title: '本周上传机会已经用完', duration: 3000, icon: 'none' })

      this.choose(0)
    },

    // 获取用户信息
    async getUserInfo() {
      try {
        const data = await this.$h.http('userinfo', {}, 'GET')
        this.userinfo = data
        this.isLogin = true
        this.$f.set('userinfo', data)
      } catch (e) {
        this.isLogin = false
        uni.showToast({ title: e.message, icon: 'none' })
      }
    },
    // 获取配置
    async getConfig() {
      try {
        const data = await this.$h.http('config', {}, 'GET')
        this.$f.set('config', data)
        this.config = data
      } catch (e) {
        uni.showToast({ title: e.message, icon: 'none' })
      }
    },
    // 获取文件列表
    async documentList() {
      try {
        const data = await this.$h.http('list-dialog-resource', {}, 'GET')
        for (const i in data) {
          data[i].size = this.$f.formatBytes(data[i].fileSize, 0)
          data[i].date = this.$f.formatDate(new Date(data[i].updatedAt))
        }
        this.document = data
      } catch (e) {
        uni.showToast({
          title: e.message,
          icon: 'none'
        })
      }
    },

    // 未登录点击名称跳转登录
    login() {
      uni.navigateTo({
        url: '/pages/user/login'
      })
    },

    // 跳转个人信息
    user() {
      uni.navigateTo({
        url: '/pages/user/user'
      })
    },

    // 点击对话
    chat(dialogId, title) {
      uni.navigateTo({
        url: `/pages/chat/chat?dialogId=${dialogId}&title=${title}`
      })
    },

    // 选择文件
    async choose(index) {
      let res = null
      if (index == 1) {
        res = await uni.chooseMedia({
          count: 1,
          mediaType: ['all'],
          sourceType: ['album'],
          maxDuration: 30,
          camera: 'back'
        })
      } else {
        res = await uni.chooseMessageFile({
          count: 1,
          type: 'file',
          extension: ['pdf', 'docx', 'doc']
        })
      }
      const { path, name, size } = res[1].tempFiles[0]
      this.uploadFile(path, name, size)
    },

    // 统一上传文件
    async uploadFile(path, name, size) {
      try {
        uni.showLoading({
          title: '上传中...',
          mask: true
        })
        // 判断文件大小 > 10MB
        if (size > 10 * 1024 * 1024)
          throw new Error(`上传文件不得大于${this.$f.formatBytes(file_size)}\n当前文件大小${this.$f.formatBytes(size)}`)

        await this.$h.upload(path, {
          fileName: name,
          typeId: 1
        })

        this.init()
      } catch (e) {
        console.error(e)
        uni.showToast({
          title: e.message,
          duration: 3000,
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },
    async preview(item) {
      try {
        uni.showLoading({
          title: '文档打开中...',
          mask: true
        })
        const response = await uni.downloadFile({ url: item.filePath })
        const res = response[1]
        uni.openDocument({
          filePath: res.tempFilePath,
          showMenu: true
        })
      } catch (e) {
        uni.showToast({ title: e.message, icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
  }
}
</script>

<style lang="scss">
.content {
  background: linear-gradient(to bottom, #eefffe, #fff);
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  padding: 0;

  .u-demo-block {
    .head-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    margin-top: 50rpx;
  }

  .navigation-container {
    width: 100vw;

    .navigation-bar {
      text-align: center;

      .logo {
        height: 100%;
      }
    }
  }
}

.document-empty {
  min-height: 60vw;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  .img {
    width: 30vw;
    height: 30vw;
    background: rgba(0, 0, 0, 0);
  }

  .tip {
    color: #999;
    font-size: 14px;
  }
}

.img-center {
  margin-left: 35rpx;
}

.img-center image {
  width: 100rpx;
  height: 100rpx;
  border-radius: 10rpx;
  vertical-align: middle;
}

.user-login {
  display: flex;
  align-items: center;

  text {
    color: #00a29c;
    font-size: 50rpx;
    font-weight: 400;
  }
}

.user-info {
  display: flex;
  align-items: center;

  text {
    color: #000000;
    font-size: 40rpx;
    font-weight: 400;
  }

  .arrow {
    width: 20.99rpx;
    height: 32.44rpx;
    margin-left: 20rpx;
    background-image: url('../../static/arrow.png');
    background-repeat: no-repeat;
    background-size: contain;
  }
}

.user-tip {
  display: flex;
  align-items: center;
  margin-top: 10rpx;

  text {
    color: #707070;
    font-size: 35rpx;
    line-height: 40rpx;
    font-weight: 400;
  }
}

.upload {
  margin: 50rpx 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-around;

  .block {
    width: 40%;
    height: 200rpx;
    border-radius: 10rpx;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 10rpx;
    text-align: center;
    background: #00a29c;

    image {
      width: 100rpx;
      height: 100rpx;
    }
  }
}

.file {
  margin-left: 32.44rpx;
}

.file-text {
  color: #000000;
  font-size: 50rpx;
  font-weight: 500;
}

.file-num {
  font-size: 30rpx;
  color: #5b5b5b;
  margin-left: 15rpx;
}

.document {
  padding: 50rpx 0;
  height: calc(45vh + constant(safe-area-inset-bottom));
  height: calc(45vh + env(safe-area-inset-bottom));
  overflow-y: scroll;
}

.img-file {
  margin-left: 32.44rpx;
  image {
    width: 70rpx;
    height: 70rpx;
  }
}

.file-name {
  margin-right: 10rpx;
  color: #000000;
  font-size: 30.53rpx;
  font-weight: 700;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.file-date {
  margin-top: 10rpx;
  color: #707070;
  font-size: 22.9rpx;
}

.iconfont {
  color: #00a29c;
  text-align: right;
  margin-right: 40rpx;
}

.chat {
  position: fixed;
  right: 50rpx;
  bottom: 156rpx;
  z-index: 9999;
}

.chat .chat-image image {
  width: 108rpx;
  height: 105rpx;
}
</style>
