<template>
  <view>
    <view class="navbar">
      <!--空白来占位状态栏-->
      <view :style="{ height: statusBarHeight + 'px' }"></view>
      <view class="navigation-bar" :style="{ height: navigationBarHeight + 'px' }">
        <uni-icons class="back" type="back" size="50rpx" @tap="back"></uni-icons>
        <view class="navbar-title">{{ title }}</view>
      </view>
    </view>

    <scroll-view
      class="page"
      scroll-y
      :scroll-with-animation="animation"
      :scroll-into-view="bottomView"
      :show-scrollbar="false"
    >
      <view
        class="content"
        :style="{ paddingTop: statusBarHeight + navigationBarHeight + 'px' }"
        :class="keyboardHeight ? 'bottom-0' : ''"
      >
        <view class="chat-content" v-for="(item, index) in chat" :key="index" :data-self="item.type">
          <u--image showLoading :src="item.avatar" width="76rpx" height="76rpx" shape="circle" fade duration="450" />
          <view class="hr" />
          <view class="content-view" @longpress="copy" :data-item="item.content">
            <towxml :nodes="item.marked" />
            <view v-if="!item.type && item.chatId" class="copy-tip" @tap="copy" :data-item="item.content">
              长按复制
            </view>
          </view>
        </view>
        <view id="chat-bottom" class="chat-bottom" :style="{ height: keyboardHeight + 'px' }"></view>
      </view>
    </scroll-view>

    <view
      class="input-bottom"
      :style="{ paddingBottom: keyboardHeight + 'px' }"
      :class="keyboardHeight ? 'bottom-0' : ''"
    >
      <input
        class="input"
        v-model="value"
        :class="sending ? 'disable' : ''"
        :maxlength="-1"
        @focus="scrollToBottom(0, true)"
        :placeholder="keyboardHeight ? '' : placeholder"
        :adjust-position="false"
        :disabled="sending"
      />
      <button class="bottom" :class="sending ? 'disable' : ''" @tap="sendMessage" :disabled="sending">
        <view class="bottom-title">发送</view>
        <view class="bottom-number">剩 {{ userinfo.chance.totalChatChance }} 次</view>
      </button>
    </view>
  </view>
</template>

<script>
import towxml from '@/static/towxml/towxml'
import marked from '@/static/towxml'

export default {
  components: { towxml },
  data() {
    return {
      // 导航栏和状态栏高度
      statusBarHeight: wx.getStorageSync('statusBarHeight'),
      navigationBarHeight: wx.getStorageSync('navigationBarHeight'),
      placeholder: '输入关于文档的问题',
      chat: [],
      value: '',
      sending: false,
      title: '',
      dialogId: 0,
      userinfo: {},
      config: {},
      bottomView: 'chat-bottom',
      keyboardHeight: 0,
      unload: false,
      animation: true
    }
  },
  onLoad(e) {
    if (e && parseInt(e.dialogId)) {
      this.title = e.title
      this.dialogId = parseInt(e.dialogId) || 0
    } else {
      this.title = '随便聊聊'
      this.placeholder = '随便说两句'
    }

    if (e && e.title) uni.setNavigationBarTitle({ title: e.title })

    this.userinfo = this.$f.get('userinfo')
    this.config = this.$f.get('config')
    this.init()

    uni.onKeyboardHeightChange(res => {
      this.keyboardHeight = res.height
    })
  },
  onUnload() {
    this.unload = true
  },
  methods: {
    back() {
      uni.navigateBack()
    },
    scrollToBottom(time = 0, animation = true) {
      this.animation = animation
      this.bottomView = ''
      setTimeout(() => (this.bottomView = 'chat-bottom'), time)
    },
    // 发送消息
    async sendMessage() {
      try {
        // check input
        if (this.sending) return
        if (!this.userinfo.chance.totalChatChance) throw new Error('对话次数用尽')
        if (!this.value.trim()) return

        const input = this.value
        this.value = ''
        this.sending = true

        this.chat.push({
          avatar: this.userinfo.avatar,
          content: input,
          marked: marked(input, 'markdown', { theme: 'dark' }),
          dialogId: this.dialogId,
          userId: this.userinfo.id,
          chatId: 0,
          type: true
        })
        this.scrollToBottom(300)

        // send chat prompt
        const data = await this.$h.http('chat-stream', { input, dialogId: this.dialogId })

        // force to cover user chat content
        data.marked = marked(data.content, 'markdown', { theme: 'dark' })
        this.chat[this.chat.length - 1] = data
        this.dialogId = data.dialogId

        await this.loopChat()
      } catch (e) {
        uni.showToast({ title: e.message, duration: 3000, icon: 'none' })
      } finally {
        this.sending = false
      }
    },
    // 循环获取聊天记录
    async loopChat() {
      let error = 0
      while (true) {
        if (this.unload) break
        if (error >= 10) break
        try {
          const data = await this.getChat()
          if (!data) break
          if (data.dialogId !== this.dialogId) break

          data.marked = marked(data.content, 'markdown', { theme: 'light' })

          const end = this.chat.length - 1
          // check processing chat, chatId=0
          if (this.chat[end].chatId === 0) this.chat[end] = data
          // check new chat
          if (this.chat[end].chatId !== data.chatId) this.chat.push(data)
          this.scrollToBottom(0, false)

          if (data.chatId > 0) break
        } catch (e) {
          error++
        }
      }
      this.scrollToBottom(300, true)
      this.getUserInfo()
    },
    async getChat() {
      return await this.$h.http('get-chat-stream', {}, 'GET')
    },
    // 获取聊天列表数据
    async init() {
      try {
        this.chat = []
        this.sending = true
        const data = await this.$h.http('list-chat', { dialogId: this.dialogId })
        for (const item of data) {
          this.dialogId = item.dialogId
          item.marked = marked(item.content, 'markdown', { theme: item.type ? 'dark' : 'light' })
          this.chat.push(item)
        }
        await this.loopChat()
      } catch (e) {
        uni.showToast({ title: e.message, duration: 3000, icon: 'none' })
      } finally {
        this.sending = false
      }
    },

    // 用户信息
    async getUserInfo() {
      try {
        const data = await this.$h.http('userinfo', {}, 'GET')
        this.userinfo = data
      } catch (e) {
        this.$f.remove('userinfo')
        this.$f.remove('id')
        this.$f.remove('token')
        this.$f.remove('openid')
        uni.showToast({ title: e.message, duration: 3000, icon: 'none' })
      }
    },
    copy(e) {
      uni.setClipboardData({
        data: e.currentTarget.dataset.item,
        success: () => uni.showToast({ title: '复制成功', duration: 2000, icon: 'none' })
      })
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
  background: linear-gradient(to top, rgba(238, 255, 254, 0), rgba(238, 255, 254, 0.85) 25%, rgba(238, 255, 254, 1)) 75%;

  .navigation-bar {
    display: flex;
    flex-direction: row;
    align-items: center;

    .back {
      font-size: 35rpx;
      color: #000;
      margin-left: 10rpx;
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

.page {
  background: linear-gradient(to bottom, #eefffe, #fdfdfd);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100vh;
  width: 100vw;

  .content {
    padding-bottom: calc(120rpx + constant(safe-area-inset-bottom));
    padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
    &.bottom-0 {
      padding-bottom: 120rpx;
    }

    .chat-content {
      display: flex;
      align-items: center;
      padding: 20rpx;

      &:last-child {
        padding-bottom: 40rpx;
      }

      &:first-child {
        padding-top: 40rpx;
      }

      .avatar {
        flex-shrink: 0;
      }

      .hr {
        width: 4vw;
        flex-shrink: 0;
      }

      .content-view {
        background: #ffffff;
        box-shadow: 0rpx 0rpx 8rpx 0rpx #e9e9e9;
        border-radius: 29rpx;
        padding: 25rpx;
        color: #000;
        font-size: 30.53rpx;
        word-wrap: break-word;
        max-width: 76%;

        .copy-tip {
          margin: 6rpx 0;
          text-align: right;
          font-size: 26rpx;
          color: #ccc;
        }
      }

      &[data-self='true'] {
        flex-direction: row-reverse;

        .content-view {
          color: #fff;
          background: #00a29c;
          box-shadow: 0rpx 0rpx 8rpx 0rpx #e9e9e9;
        }
      }
    }
    .chat-bottom {
      height: 0;
      width: 100%;
    }
  }
}

.input-bottom {
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  justify-items: center;
  flex-wrap: wrap;
  position: fixed;
  left: 0;
  right: 0;
  height: 120rpx;
  bottom: 0;
  bottom: constant(safe-area-inset-bottom);
  bottom: env(safe-area-inset-bottom);
  z-index: 999;
  &.bottom-0 {
    bottom: 0;
  }

  .input {
    height: 80rpx;
    background: #fff;
    border-radius: 100rem;
    font-size: 30rpx;
    width: 420rpx;
    padding: 0 40rpx;
    border: solid 2px #00a29c;

    &.disable {
      border: solid 2px #ccc;
    }
  }

  .bottom {
    margin-left: 22rpx;
    width: 180rpx;
    height: 90rpx;
    background: linear-gradient(127deg, #36ad6a 0%, #00a29c 100%);
    border-radius: 100rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-right: 0;
    padding: 0;

    &.disable {
      background: #ccc;
    }

    .bottom-title {
      font-size: 30rpx;
      line-height: 30rpx;
      font-weight: 500;
      color: #ffffff;
      margin-bottom: 5rpx;
    }

    .bottom-number {
      font-size: 25rpx;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.73);
      line-height: 25rpx;
      margin-top: 5rpx;
    }
  }
}

@keyframes slide-fade-in {
  0% {
    opacity: 0;
    transform: translateY(100%);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}
</style>
