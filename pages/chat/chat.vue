<template>
  <view class="page">
    <view class="navbar" :style="{ height: navigationBarAndStatusBarHeight }">
      <!--空白来占位状态栏-->
      <view :style="{ height: statusBarHeight }"></view>
      <view class="navigation-bar" :style="{ height: navigationBarHeight }">
        <uni-icons class="back" type="back" size="50rpx" @tap="back"></uni-icons>
        <view class="navbar-title">{{ title }}</view>
      </view>
    </view>

    <scroll-view
      :style="{ top: navigationBarAndStatusBarHeight }"
      class="chat"
      scroll-y
      :scroll-with-animation="false"
      :scroll-into-view="bottomView"
    >
      <view class="chat-content" v-for="(item, index) in chat" :key="index" :data-self="item.type">
        <u--image showLoading :src="item.avatar" width="76rpx" height="76rpx" shape="circle" fade duration="450" />
        <view class="hr" />
        <view class="content-view" @longpress="copy" :data-item="item.content">
          <mp-html :content="item.marked || item.content" />
          <view v-show="!item.type && item.chatId" class="copy-tip">长按复制</view>
        </view>
      </view>
      <view class="retry-content" v-if="showRetry">
        <text class="retry-text">网络错误，请</text>
        <view class="retry-btn-content" @tap="loopChat">
          <text class="retry-btn-text">重试</text>
          <uni-icons type="refreshempty" size="13"></uni-icons>
        </view>
      </view>
      <view id="bottomView" class="bottom-view"></view>
      <view v-if="keyboardHeight" class="placeholder" :style="{ height: keyboardHeight + 'px' }"></view>
    </scroll-view>

    <view class="input-bottom" v-show="showBottom">
      <input
        class="input"
        :class="sending ? 'disable' : ''"
        :adjust-position="false"
        v-model="value"
        :placeholder="placeholder"
      />
      <button class="bottom" :class="sending ? 'disable' : ''" @tap="sendMessage" :disabled="sending">
        <view class="bottom-title">发送</view>
        <view class="bottom-number">剩 {{ userinfo.chance.totalChatChance || 0 }} 次</view>
      </button>
      <view v-if="keyboardHeight" class="placeholder" :style="{ height: keyboardHeight + 'px' }"></view>
    </view>
  </view>
</template>
<script>
import mpHtml from 'mp-html/dist/uni-app/components/mp-html/mp-html'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js/lib/common'
import 'highlight.js/scss/monokai.scss'

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    }
  })
)

export default {
  components: { mpHtml },
  data() {
    return {
      // 导航栏和状态栏高度
      navigationBarAndStatusBarHeight:
        wx.getStorageSync('statusBarHeight') + wx.getStorageSync('navigationBarHeight') + 'px',
      statusBarHeight: wx.getStorageSync('statusBarHeight') + 'px',
      navigationBarHeight: wx.getStorageSync('navigationBarHeight') + 'px',
      placeholder: '输入关于文档的问题',
      chat: [],
      value: '',
      sending: false,
      title: '',
      dialogId: 0,
      userinfo: {},
      config: {},
      bottomView: '',
      showBottom: true,
      showRetry: false,
      keyboardHeight: 0,
      unload: false
    }
  },
  onLoad(e) {
    if (e && parseInt(e.dialogId)) {
      this.title = e.title
      this.dialogId = parseInt(e.dialogId) || 0
    } else {
      this.title = '任意聊天'
      this.placeholder = '随便聊聊'
    }

    if (e && e.title)
      uni.setNavigationBarTitle({
        title: e.title
      })

    this.userinfo = this.$f.get('userinfo')
    this.config = this.$f.get('config')
    this.init()

    uni.onKeyboardHeightChange(res => {
      this.keyboardHeight = res.height
      this.scrollToBottom()
      if (res.duration === 0) this.showBottom = false
      else this.showBottom = true
    })
  },
  onUnload() {
    this.unload = true
  },
  methods: {
    back() {
      uni.navigateBack()
    },
    scrollToBottom(time = 0, callback = null) {
      this.bottomView = ''
      setTimeout(() => {
        this.bottomView = 'bottomView'
        if (callback && typeof callback === 'function') callback()
      }, time)
    },
    // 发送消息
    async sendMessage() {
      try {
        // check input
        if (!this.value.trim()) return
        if (!this.userinfo.chance.totalChatChance) throw new Error('对话次数用尽')
        const check = await this.getChat()
        if (check && check.dataId === 0) throw new Error('当前有流对话尚未结束')

        const input = this.value
        this.value = ''
        this.sending = true

        this.chat.push({
          avatar: this.userinfo.avatar || this.config.DEFAULT_AVATAR_USER,
          content: input,
          dialogId: this.dialogId,
          userId: this.userinfo.id,
          chatId: 0,
          type: true
        })
        this.chat.push({
          avatar: this.config.DEFAULT_AVATAR_AI,
          content: '🤔️大模型思考中...',
          dialogId: this.dialogId,
          userId: this.userinfo.id,
          chatId: 0,
          type: false
        })
        this.scrollToBottom()

        const data = await this.$h.http('chat-stream', {
          input,
          dialogId: this.dialogId
        })

        // update user chat content
        this.chat[this.chat.length - 2] = data
        this.dialogId = data.dialogId
        this.loopChat()
      } catch (e) {
        uni.showToast({
          title: e.message,
          duration: 3000,
          icon: 'none'
        })
        this.chat.pop()
        this.chat.pop()
        this.sending = false
      }
    },
    // 循环获取聊天记录
    async loopChat() {
      let count = 0
      while (1) {
        try {
          if (this.unload) break
          this.sending = true
          const data = await this.getChat()

          if (!data || data.dialogId !== this.dialogId) break
          data.marked = marked.parse(data.content) //.replace(/<pre>/g, "<pre class='hljs'>")

          // check processing chat, chatId=0
          if (this.chat[this.chat.length - 1].chatId === 0) this.chat[this.chat.length - 1] = data
          // check new chat
          if (this.chat[this.chat.length - 1].chatId !== data.chatId) this.chat.push(data)

          if (data.chatId > 0) break
        } catch (e) {
          count++
          if (count >= 10) {
            uni.showToast({
              title: e.message,
              duration: 3000,
              icon: 'none'
            })
            this.showRetry = true
            break
          }
        } finally {
          this.scrollToBottom()
        }
      }
      this.sending = false
      this.getUserInfo()
    },
    async getChat() {
      return await this.$h.http('get-chat-stream', {}, 'GET')
    },
    // 获取聊天列表数据
    async init() {
      try {
        this.chat = []
        const data = await this.$h.http('list-chat', { dialogId: this.dialogId })
        for (const item of data) {
          item.marked = marked.parse(item.content) //.replace(/<pre>/g, "<pre class='hljs'>")
          this.chat.push(item)
        }
        setTimeout(this.loopChat, 300)
      } catch (e) {
        uni.showToast({
          title: e.message,
          duration: 3000,
          icon: 'none'
        })
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
        uni.showToast({
          title: e.msg,
          duration: 3000,
          icon: 'none'
        })
      }
    },
    copy: function (e) {
      let item = e.currentTarget.dataset.item
      wx.setClipboardData({
        data: item,
        success: function (res) {
          uni.showToast({
            title: '复制成功',
            duration: 2000,
            icon: 'none'
          })
        }
      })
    }
  }
}
</script>
<style lang="scss" scoped>
.page {
  .navbar {
    position: fixed;
    width: 100%;
    top: 0;
    background: #eefffe;

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

  .chat {
    background: linear-gradient(to bottom, #eefffe, #fdfdfd);
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;

    .bottom-view {
      height: calc(130rpx + constant(safe-area-inset-bottom));
      height: calc(130rpx + env(safe-area-inset-bottom));
    }

    .chat-content {
      display: flex;
      align-items: center;
      padding: 20rpx;
      animation: fade-in 0.3s ease-in forwards;

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
        padding: 28rpx;
        color: #000;
        font-size: 30.53rpx;
        word-wrap: break-word;
        max-width: 76%;

        .copy-tip {
          margin-top: 6rpx;
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
    .retry-content {
      justify-content: flex-start;
      display: flex;
      margin-left: 130rpx;
      align-items: center;
      padding-bottom: 30rpx;

      .retry-text {
        color: #ef2020;
        font-size: 28rpx;
      }

      .retry-btn-content {
        display: flex;
        align-items: center;

        .retry-btn-text {
          color: #0014c2;
          font-size: 28rpx;
        }

        .retry-image {
          width: 25rpx;
          height: 25rpx;
          margin-left: 5rpx;
          background-image: url('../../static/retry.png');
          background-repeat: no-repeat;
          background-size: contain;
        }
      }
    }
  }
  .input-bottom {
    animation: slide-fade-in 0.2s ease-in forwards;
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    justify-items: center;
    flex-wrap: wrap;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    min-height: 130rpx;
    margin-bottom: constant(safe-area-inset-bottom);
    margin-bottom: env(safe-area-inset-bottom);

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

      &.disable {
        background: #ccc;
      }

      .bottom-title {
        font-size: 30rpx;
        line-height: 30rpx;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 5rpx;
      }

      .bottom-number {
        font-size: 23rpx;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.73);
        line-height: 10px;
        font-size: 10px;
        margin-top: 2px;
      }
    }

    .placeholder {
      flex-grow: 1;
      flex-basis: 100%;
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
