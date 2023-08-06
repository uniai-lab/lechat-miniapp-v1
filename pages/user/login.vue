<template>
	<view class="content">
		<view class='text'>
			<view class="head">
				<image src="../../static/logo.png" mode="aspectFit"></image>
			</view>
		</view>

		<view class='introduce'>
			<text class="bold">乐聊（LeChat）</text>是一款智能文献分析和文本生成小程序。
			LeChat 使用了<text class="bold">中科苏州智能计算技术研究院</text>自主可控的 LLM 技术，利用大预言模型的语义理解和文本生成能力，可以快速理解和归纳文本内容。
			LeChat 支持中英文对话，只要您向LeChat询问任何关于文档内容的问题，LeChat都可以为您解答。
			例如，LeChat 可以帮助您总结归纳文档要点、翻译文档内容、撰写读书笔记等。
			LeChat 还可以在工作中为您提供帮助。无论您需要商业策划、行业总结、财务报表等信息。
			您可以利用LeChat建立自己的文献知识库，提高自己的学习工作效率。
			更多有趣用法等着您去探索，让 LeChat 成为您得力的手机文献助理吧！
		</view>

		<button class="custom-style" open-type="getPhoneNumber" @getphonenumber="onGetPhoneNumber">
			手机号快捷登录
		</button>

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
			async onGetPhoneNumber(e) {
				try {
					const openid = this.$f.get('openid');
					const fid = this.$f.get('fid', 0)
					const res = await this.$h.http('register', {
						code: e.detail.code,
						iv: e.detail.iv,
						openid: openid,
						cloudID: e.detail.cloudID,
						encryptedData: e.detail.encryptedData,
						fid: fid
					})
					if (res.status === 1) {
						this.$f.set('token', res.data.token)
						this.$f.set('id', res.data.id)
						uni.navigateTo({
							url: '/pages/index/index'
						});
					} else throw new Error(res.msg)
				} catch (e) {
					uni.showToast({
						title: e.message,
						duration: 3000,
						icon: 'error'
					})
				}

			},
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
			height: 140rpx;
		}
	}

	.custom-style {
		width: 560rpx;
		height: 89.69rpx;
		line-height: 89.69rpx;
		border-radius: 55.34rpx;
		font-size: 32rpx;
		background-color: #00A29C;
		color: #fff;
		border-radius: 10rpx;
		margin-top: 40rpx;
	}

	.logo-icon {
		display: inline-block;
		width: 57.25rpx;
		height: 47.71rpx;
		background-image: url('../../static/weixinlogin.png');
		background-size: contain;
		background-repeat: no-repeat;
		vertical-align: middle;
		margin-right: 10rpx;
	}
</style>