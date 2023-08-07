<template>
  <view class="content">
    <view class="text">
      <view class="head">
        <image src="../../static/logo.png" mode="aspectFit"></image>
      </view>
    </view>

    <view class="introduce">
      <text class="bold">乐聊（LeChat）</text>是一款智能文献分析和文本生成小程序。 LeChat使用了自主可控的 LLM
      技术，利用大预言模型的语义理解和文本生成能力，可以快速理解和归纳文本内容。
      LeChat支持中英文对话，只要您向LeChat询问任何关于文档内容的问题，LeChat都可以为您解答。
      例如，LeChat可以帮助您总结归纳文档要点、翻译文档内容、撰写读书笔记等。
      LeChat还可以在工作中为您提供帮助。无论您需要商业策划、行业总结、财务报表等信息。
      您可以利用LeChat建立自己的文献知识库，提高自己的学习工作效率。 更多有趣用法等着您去探索，让 LeChat
      成为您得力的手机文献助理吧！
    </view>

    <button class="custom-style" open-type="getPhoneNumber" @getphonenumber="getPhoneNumber">手机号快捷登录</button>
  </view>
</template>

<script>
export default {
  data() {
    return {
      info: {}
    }
  },
  methods: {
    async getPhoneNumber(e) {
      try {
        const fid = this.$f.get('fid') || 0
        let openid = this.$f.get('openid') || ''
        if (!openid) {
          const code = await this.$h.login()
          const data = await this.$h.http('login', { code, fid })
          this.$f.set('token', data.token)
          this.$f.set('id', data.id)
          this.$f.set('openid', data.wxOpenId)
          openid = data.wxOpenId
        }
        const data = await this.$h.http('register', { ...e.detail, openid, fid })
        this.$f.set('token', data.token)
        this.$f.set('id', data.id)
        uni.navigateTo({
          url: '/pages/index/index'
        })
      } catch (e) {
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

<style lang="scss">
.content {
  background: #eefffe;
  height: 100vh;
  width: 100vw;
}

.introduce {
  padding: 40rpx;
  font-size: 30rpx;
  word-wrap: break-word;
  line-height: 54rpx;
  font-weight: medium;
  overflow-wrap: break-word;
  color: rgba(0, 0, 0, 1);
  font-family: PingFangSC-Regular;

  .bold {
    margin: 0;
    padding: 0;
    font-weight: bold;
  }
}

.head {
  width: 100%;
  text-align: center;
  padding-top: 40rpx;

  image {
    height: 100rpx;
  }
}

.custom-style {
  width: 560rpx;
  height: 89.69rpx;
  line-height: 89.69rpx;
  border-radius: 55.34rpx;
  font-size: 32rpx;
  background-color: #00a29c;
  color: #fff;
  border-radius: 10rpx;
  margin-top: 40rpx;
}
</style>
