<template>
  <view class="page">
    <view class="navigation" id="nav">
      <!--空白来占位状态栏-->
      <view :style="{ height: `${statusHeight}px` }"></view>
      <!--自定义导航栏-->
      <view class="bar" :style="{ height: `${menuHeight}px` }">
        <image src="../../static/logo.png" class="logo" mode="aspectFit"></image>
      </view>
    </view>

    <view class="head" id="head">
      <view class="user">
        <u-row>
          <u-col span="3">
            <view class="img-center">
              <image mode="aspectFit" :src="userinfo.avatar || '../../static/avatar.png'" />
            </view>
          </u-col>
          <u-col span="9">
            <view class="user-info" v-if="userinfo.id" @tap="user()">
              <text>{{ userinfo.name }}</text>
              <uni-icons class="arrow" type="right" size="25"></uni-icons>
            </view>
            <view class="user-login" v-else @tap="login()">点击登录</view>
            <view class="user-tip">大模型文献分析与对话小程序</view>
          </u-col>
        </u-row>
      </view>
      <view class="func">
        <view class="block" @tap="upload()">
          <image src="../../static/upload.png"></image>
          <view class="text">文献上传</view>
        </view>
        <view class="block" @tap="chat(null)">
          <image src="../../static/chat.png"></image>
          <view class="text">随便聊聊</view>
        </view>
      </view>
    </view>

    <view class="file" id="file">
      <text class="file-text">我的文档</text>
      <text class="file-num" v-if="userinfo">剩余可上传{{ userinfo.chance.totalUploadChance }}个文档</text>
      <text
        @click="show = !show"
        v-show="showNewAppButton"
        style="
          margin-left: 50rpx;
          border-radius: 15rpx;
          font-size: 30rpx;
          padding: 10rpx 20rpx;
          box-shadow: 0 0 2px gray;
          color: gray;
          background: #00a29c;
          color: whitesmoke;
        "
        >体验新版</text
      >
    </view>
    <u-modal
      :show="show"
      title="公告"
      content="快来体验我们新版小程序吧!"
      showCancelButton
      closeOnClickOverlay
      @confirm="modalConfirm"
      @cancel="modalClose"
      @close="modalClose"
    ></u-modal>

    <view
      class="document"
      v-if="navHeight && headHeight && fileHeight"
      :style="{ height: windowHeight - navHeight - headHeight - fileHeight + 'px' }"
    >
      <view class="list" v-if="list.length">
        <view class="item" v-for="(item, index) in list" :key="index">
          <u-row>
            <u-col span="2" @tap="chat(item.dialogId, item.fileName)">
              <image src="../../static/pdf.png" mode="widthFix" />
            </u-col>
            <u-col span="8" @tap="chat(item.dialogId, item.fileName)">
              <view class="file-name"> {{ item.fileName }} </view>
              <view class="file-date"> {{ item.date }} {{ item.size }} </view>
            </u-col>
            <u-col span="2" @tap="preview(item)">
              <uni-icons class="iconfont" type="cloud-download" size="40rpx" color="#00a29c"></uni-icons>
            </u-col>
          </u-row>
        </view>
      </view>
      <view class="empty" v-else @tap="upload()">
        <image class="img" src="../../static/null.png"></image>
        <text class="tip">未上传文档</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      statusHeight: getApp().globalData().statusBarHeight,
      menuHeight: getApp().globalData().menuHeight,
      windowHeight: getApp().globalData().windowHeight,
      navHeight: 0,
      headHeight: 0,
      fileHeight: 0,
      userinfo: { name: 'loading...' },
      config: {},
      list: [],
      show: false,
      showNewAppButton: false
    }
  },
  onLoad(e) {
    if (e && e.id) this.$f.set('fid', e.id)
    this.init()
    this.setDocumentHeight()
  },
  onShareAppMessage() {
    return {
      path: `/pages/index/index?id=${this.userinfo.id}`,
      title: this.config.shareTitle,
      imageUrl: this.config.shareImg
    }
  },
  methods: {
    modalConfirm() {
      const appId = this.config['newAppId'],
        openid = uni.getStorageSync('openid'),
        token = uni.getStorageSync('token')
      try {
        uni.navigateToMiniProgram({
          appId,
          path: `pages/index/index?openid=${openid}&token=${token}`,
          success(res) {
            // 打开成功1
          }
        })
      } catch (e) {
        this.show = false
      }
    },
    modalClose() {
      this.show = false
    },
    // 登录验证
    async init() {
      // 判断是否登录成功
      try {
        uni.showLoading({ title: '加载中' })
        if (!(this.$f.get('token') && this.$f.get('id') && this.$f.get('openid'))) {
          const code = await this.$h.login()
          const data = await this.$h.http('login', { code, fid: this.$f.get('fid') || 0 })
          this.$f.set('token', data.token)
          this.$f.set('id', data.id)
          this.$f.set('openid', data.wxOpenId)
        }
        await this.getConfig()
        await this.getUserInfo()
        await this.documentList()
      } catch (e) {
        console.error(e)
        uni.showToast({
          title: e.message,
          icon: 'none',
          duration: 3000
        })
      } finally {
        uni.hideLoading()
      }
    },
    setDocumentHeight() {
      const query = uni.createSelectorQuery()
      query
        .select('#nav')
        .boundingClientRect(rect => {
          this.navHeight = rect.height
        })
        .exec()
      query
        .select('#head')
        .boundingClientRect(rect => {
          this.headHeight = rect.height
        })
        .exec()
      query
        .select('#file')
        .boundingClientRect(rect => {
          this.fileHeight = rect.height
        })
        .exec()
    },
    // 点击上传
    upload() {
      // 判断是否可以上传
      if (!this.userinfo.chance.totalUploadChance)
        return uni.showToast({ title: '上传机会已经用完', duration: 3000, icon: 'none' })

      this.choose(0)
    },

    // 获取用户信息
    async getUserInfo() {
      try {
        const data = await this.$h.http('userinfo', {}, 'GET')
        this.userinfo = data
        this.$f.set('userinfo', data)
      } catch (e) {
        this.$f.remove('userinfo')
        this.$f.remove('id')
        this.$f.remove('token')
        this.$f.remove('openid')
        uni.showToast({ title: e.message, icon: 'none' })
      }
    },
    // 获取配置
    async getConfig() {
      try {
        const data = await this.$h.http('config', {}, 'GET')
        this.$f.set('config', data)
        this.config = data
        //体验新版
        this.show = this.config['showNewApp'] == 'true' || false
        this.showNewAppButton = this.config['showNewApp'] == 'true' || false
        console.log(this.show, this.showNewAppButton)
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
        this.list = data
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

<style lang="scss" scoped>
.page {
  .navigation {
    .bar {
      text-align: center;

      .logo {
        height: 100%;
      }
    }
  }

  .head {
    padding-top: 50rpx;
    .user {
      .img-center {
        margin-left: 32rpx;
        image {
          width: 95rpx;
          height: 95rpx;
          vertical-align: middle;
        }
      }
    }
    .user-login {
      display: flex;
      align-items: center;
      font-size: 40rpx;
    }

    .user-info {
      display: flex;
      align-items: center;
      color: #000000;
      font-size: 40rpx;
      font-weight: 400;
      .arrow {
        margin-left: 20rpx;
      }
    }

    .user-tip {
      display: flex;
      align-items: center;
      margin-top: 10rpx;

      text {
        color: #707070;
        font-size: 28rpx;
        font-weight: 400;
      }
    }
    .func {
      padding: 40rpx 0;
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
        color: #fff;

        image {
          width: 100rpx;
          height: 100rpx;
        }
      }
    }
  }

  .file {
    padding-left: 32rpx;
    padding-bottom: 20rpx;
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
  }

  .document {
    position: absolute;
    width: 100%;
    bottom: 0;
    overflow: scroll;
    .list {
      padding-bottom: constant(safe-area-inset-bottom);
      padding-bottom: env(safe-area-inset-bottom);
      .item {
        margin: 25rpx 0;
        image {
          width: 75rpx;
          height: 75rpx;
          margin-left: 32rpx;
          vertical-align: middle;
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
          float: right;
          margin-right: 30rpx;
        }
      }
    }

    .empty {
      min-height: 60vw;
      width: 100vw;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;

      .img {
        width: 40vw;
        height: 40vw;
        background: rgba(0, 0, 0, 0);
      }

      .tip {
        color: #999;
        font-size: 14px;
      }
    }
  }
}
</style>
