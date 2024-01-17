<template>
  <view>
    <NavBar :title="title" show-back />

    <scroll-view
      class="chat"
      :style="{ height: windowHeight - keyboardHeight + 'px' }"
      scroll-y
      :refresher-enabled="!sending"
      scroll-anchoring
      :refresher-triggered="loading"
      :scroll-with-animation="animation"
      :scroll-into-view="bottomView"
      @refresherrefresh="getChatList(5)"
    >
      <view class="content" :style="{ paddingTop: paddingHeight + 'px' }" :class="keyboardHeight ? 'bottom-0' : ''">
        <view
          class="chat-content"
          v-for="(item, index) in chat.filter(v => v.isEffect)"
          :key="index"
          :data-self="item.role === 'user'"
        >
          <u--image showLoading :src="item.avatar" width="76rpx" height="76rpx" shape="circle" />
          <view class="hr" />
          <view class="content-view" @longpress="copy" :data-item="item.content">
            <towxml :nodes="mark(item.content, item.role)" />
            <view v-show="item.role !== 'user' && item.chatId" class="copy-tip" @tap="copy" :data-item="item.content">
              长按复制
            </view>
          </view>
        </view>
      </view>
      <view id="bottom-view"></view>
    </scroll-view>

    <view class="input-bottom" :style="{ bottom: (keyboardHeight ? keyboardHeight : safeBottom) + 'px' }">
      <input
        class="input"
        :class="sending ? 'disable' : ''"
        :maxlength="-1"
        v-model="value"
        :placeholder="placeholder"
        :adjust-position="false"
      />
      <button class="bottom" :class="sending ? 'disable' : ''" @tap="sendMessage" :disabled="sending">
        <view class="bottom-title">发送</view>
        <view class="bottom-number" v-if="userinfo">剩 {{ userinfo.chance.totalChatChance }} 次</view>
      </button>
    </view>
  </view>
</template>
<script>
import towxml from '@/static/towxml/towxml'
import marked from '@/static/towxml'
import NavBar from '@/components/NavBar.vue'

export default {
  components: { towxml, NavBar },
  data() {
    const { windowHeight, safeBottom, menuHeight, statusBarHeight } = getApp().globalData()
    return {
      paddingHeight: menuHeight + statusBarHeight,
      // 导航栏和状态栏高度
      windowHeight,
      safeBottom,
      keyboardHeight: 0,
      placeholder: '输入关于文档的问题',
      chat: [],
      value: '',
      sending: false,
      loading: false,
      title: '',
      dialogId: 0,
      userinfo: null,
      config: null,
      bottomView: 'bottom-view',
      unload: false,
      animation: true
    }
  },
  onLoad(e) {
    // set nav title
    this.dialogId = (e && parseInt(e.dialogId)) || 0
    if (this.dialogId) this.title = e.title
    else {
      this.title = '随便聊聊'
      this.placeholder = '随便说两句'
    }

    this.userinfo = this.$f.get('userinfo')
    this.config = this.$f.get('config')
    this.init()

    uni.onKeyboardHeightChange(res => {
      this.keyboardHeight = res.height
      if (res.height) this.scrollToBottom(300)
    })
  },
  onUnload() {
    this.unload = true
  },
  methods: {
    scrollToBottom(time = 0, animation = true) {
      this.animation = animation
      this.bottomView = ''
      setTimeout(() => (this.bottomView = 'bottom-view'), time)
    },
    mark(content, role) {
      return marked(content, 'markdown', { theme: role === 'user' ? 'dark' : 'light' })
    },
    async sendMessage() {
      try {
        // check input
        if (this.loading || this.sending) return
        if (!this.value.trim()) return
        if (!this.userinfo.chance.totalChatChance) throw new Error('对话次数用尽')

        this.chat.push({
          chatId: 0,
          avatar: this.userinfo.avatar,
          content: '大模型正在思考中🤔...',
          dialogId: this.dialogId,
          isEffect: true,
          model: null,
          resourceId: null,
          role: 'user',
          userId: this.userinfo.id
        })
        this.scrollToBottom()

        // send chat prompt
        const input = this.value
        this.value = ''
        this.sending = true
        const data = await this.$h.http('chat-stream', { input, dialogId: this.dialogId })
        console.log(data)

        // cover user chat
        this.chat[this.chat.length - 1] = data
        this.dialogId = data.dialogId

        // check user input is effect
        if (!data.isEffect) throw new Error(data.content)

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
        try {
          if (this.unload) break
          if (error >= 10) break

          const data = await this.getChatStream()
          console.log(data)
          if (!data) break
          if (data.dialogId !== this.dialogId) break

          let end = this.chat.length - 1
          if (this.chat[end].chatId && this.chat[end].chatId !== data.chatId) this.chat.push(data)
          else this.chat[end] = data
          this.scrollToBottom(0, false)

          end = this.chat.length - 2
          if (this.chat[end].role === 'user') this.chat[end].isEffect = data.isEffect

          if (!data.isEffect) {
            uni.showToast({ title: data.content, duration: 3000, icon: 'none' })
            break
          }
        } catch (e) {
          error++
        }
      }
      this.scrollToBottom(500, true)
      this.getUserInfo()
    },
    async getChatStream() {
      return await this.$h.http('get-chat-stream', {}, 'GET')
    },
    async getChatList(pageSize) {
      try {
        if (this.loading) return
        this.loading = true

        const lastId = this.chat.length ? this.chat[0].chatId : 0
        const data = await this.$h.http('list-chat', { dialogId: this.dialogId, pageSize, lastId })
        if (!pageSize) {
          this.chat = []
          for (const item of data) {
            this.dialogId = item.dialogId
            this.chat.push(item)
          }
        } else {
          for (const item of data.reverse()) {
            this.dialogId = item.dialogId
            this.chat.unshift(item)
          }
        }
      } catch (e) {
        uni.showToast({ title: e.message, duration: 3000, icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    // 获取聊天列表数据
    async init() {
      try {
        await this.getChatList()
        await this.loopChat()
      } catch (e) {
        uni.showToast({ title: e.message, duration: 3000, icon: 'none' })
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
        uni.showToast({ title: e.msg, duration: 3000, icon: 'none' })
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
.chat {
  background: linear-gradient(to bottom, #eefffe, #fdfdfd);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 100vh;
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

      &:first-child {
        padding-top: 40rpx;
      }

      &:last-child {
        padding-bottom: 40rpx;
      }
      .hr {
        width: 4vw;
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
  min-height: 120rpx;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  &.bottom-0 {
    bottom: 0;
    height: auto;
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
</style>
