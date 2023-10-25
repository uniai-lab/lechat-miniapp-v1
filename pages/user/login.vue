<template>
  <view class="page">
    <view class="head">
      <image src="../../static/logo.png" mode="aspectFit"></image>
    </view>

    <view class="introduce">
      <text class="bold">乐聊（LeChat）</text>是一款智能文献分析和文本生成小程序。
      乐聊使用了自主可控的LLM技术，并联合多个商业大模型共同提供文本生成功能，实用大模型的语义理解和文本生成能力，可以快速理解和归纳文本内容。
      例如乐聊可以帮助您总结归纳文档要点、翻译文档内容、撰写读书笔记等。
      乐聊可以在工作和学习中为您提供语言方面帮助。无论您需要进行商业策划、学习知识、还是倾诉心声都可以告诉它。
      您可以利用乐聊建立自己的文献知识库，提高自己的学习工作效率。
      更多有趣用法等着您去探索，让乐聊成为您得力的手机文献助理吧！
    </view>

    <button class="btn" @tap="login">登录</button>
  </view>
</template>

<script>
export default {
  data() {
    return {
      info: {}
    }
  },
  onLoad(e) {
    if (e && e.id) this.$f.set('fid', e.id)
  },
  methods: {
    async login(e) {
      try {
        uni.showLoading({ title: '登陆中' })
        const fid = this.$f.get('fid') || 0
        const code = await this.$h.login()
        const data = await this.$h.http('login', { code, fid })
        this.$f.set('id', data.id)
        this.$f.set('token', data.token)
        this.$f.set('openid', data.wxOpenId)
        uni.navigateTo({ url: '/pages/index/index' })
      } catch (e) {
        console.error(e)
        uni.showToast({
          title: e.message,
          duration: 3000,
          icon: 'error'
        })
      } finally {
        uni.hideLoading()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  background: #eefffe;
  height: 100vh;
  width: 100vw;
  .head {
    width: 100%;
    text-align: center;
    padding-top: 40rpx;

    image {
      height: 100rpx;
    }
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
  .btn {
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
}
</style>
