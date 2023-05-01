<template>
	<view class="u-page content">
		<view class="screen-cover" v-show="!hideScreenCove" @click="onHandleClose"></view>
		<view class="u-demo-block">
			<view class="head">
				<u-row customStyle="margin-bottom: 10px">
					<u-col span="3">
						<view class="demo-layout bg-purple-light img-center">
							<u--image :showLoading="true" :src="userinfo.avatar" width="100rpx" height="100rpx"
								shape="square"></u--image>
						</view>
					</u-col>
					<u-col span="9">
						<view class="user-info">
							<text>{{ userinfo.name }}</text>
							<view class="text-center">
								<text class="text-center-button">免费用户</text>
							</view>
						</view>
						<view class="text-bottom" @click="onTooltipClick">
							<text>剩余对话：{{userinfo.chance.totalChatChance}}次</text>
							<text class="icon iconfont icon-wenhao"></text>
							<zb-tooltip :visible="tootipVisible" placement="bottom" color="#00A29C">
								<div slot="content">
									　<span>对话次数每7天重置，可通过完成任务获取额外</span><br />
									　<span>的对话次数，额外对话次数不会被重置。</span>
								</div>
							</zb-tooltip>
						</view>
					</u-col>
				</u-row>
			</view>

			<view class="main-label">
				<view class="main-label-iocn">
					<div class="item" v-for="(item, index) in config.menu" :key="index">
						<view class="item-logo">
							<u--image v-if="item.image" :showLoading="true" :src="item.image" width="44rpx"
								height="41.98rpx" shape="square"></u--image>
						</view>
						<view class="item-title">
							<text>{{item.title}}</text>
						</view>
						<view class="item-tip">
							<text>{{item.tip}}</text>
						</view>
					</div>
				</view>
				<view class="task-box">
					<view class="task" v-for="(item, index) in userinfo.task" :key="index">
						<view class='task-left'>
							<text>{{item.title}}</text>
						</view>
						<view class='task-right'>
							<text>{{item.tip}}</text>
							<view class="task-button">
								<button v-if="item.type == 1" class="my-button" open-type="share"
									@click="bottonTask(item)">{{item.button}}</button>

								<button v-else :class="item.flag ? 'my-button' : 'my-button-flag'"
									@click="bottonTask(item)">{{item.button}}</button>
							</view>
						</view>
					</view>
				</view>
			</view>

		</view>

		<view class="bottom-text">
			<text class="bottom-text-left">{{ config.footer }} </text>
			<text class="bottom-text-right" @click="duplicate()"> {{' '}}{{ config.footerCopy }}</text>
		</view>

	</view>
</template>

<script>
	export default {
		data() {
			return {
				tisShow: false,
				tisContent: "对话次数每7天重置，可通过完成任务获取额外的对话次数，额外对话次数不会被重置。",
				userinfo: {},
				config: {},
				label: [],
				tootipVisible: false,
				hideScreenCove: true
			}
		},
		onLoad(e) {
			if (e && e.id) {
				this.$f.set('fid', e.id)
			}
		},
		onShow() {
			if (this.$f.get('userinfo', '')) {
				this.userinfo = this.$f.get('userinfo', '')
			}

			if (!this.$f.get('config')) {
				this.getConfig();
			} else {
				this.config = this.$f.get('config', '{}')
			}
			this.getUserInfo();
		},

		onShareAppMessage() {
			return {
				title: this.config.shareTitle,
				path: '/pages/index/index?id=' + this.userinfo.id,
				imageUrl: this.config.shareImg,
			}
		},

		methods: {
			onHandleOpen() {
				this.hideScreenCove = false;
			},

			onHandleClose() {
				this.hideScreenCove = true;
				this.tootipVisible = false
			},

			onTooltipClick() {
				this.onHandleOpen()
				this.tootipVisible = true
			},

			duplicate(text) {
				uni.setClipboardData({
					data: this.config.officialAccount,
					success: () => {
						uni.showToast({
							title: '复制成功',
							icon: 'none'
						})
					}
				});
			},


			// 任务按钮
			bottonTask(e) {
				if (!e.flag) return false
				if (e.type == 1) {
					uni.share({
						provider: "weixin",
						title: this.config.shareTitle,
						desc: this.config.shareDesc,
						imageUrl: this.config.shareImg,
						path: '/pages/index/index?id=' + this.userinfo.id,
						success: () => {
							uni.showToast({
								title: '分享成功'
							})
						},
						fail: (e) => {
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
					});
				}
			},

			getConfig() {
				this.$h.http('config', {}).then((res) => {
					if (res.status == 1) {
						this.$f.set('config', res.data)
						this.config = res.data;
					} else {
						uni.navigateTo({
							url: '/pages/user/login'
						});
					}
				})
			},

			// 用户信息
			getUserInfo() {
				const thi = this;
				this.$h.http('userinfo', {}).then((res) => {
					if (res.status == 1) {
						thi.userinfo = res.data;
						thi.$f.set('userinfo', res.data)
					} else {
						uni.navigateTo({
							url: '/pages/user/login'
						});
					}
				})

			},

			// 点击提示
			clickTis() {
				this.tisShow = !this.tisShow;
			}
		}
	}
</script>

<style lang="scss">
	.content {
		background: #eefffe;
		width: 750rpx;
		min-height: 100vh;
		overflow: hidden;
		padding-top: 0;
		padding-left: 0;
		padding-right: 0;

		.head {
			padding: 30rpx 0;
		}
	}

	.screen-cover {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 999;
		width: 100%;
		height: 100vh;
		background: rgba(0, 0, 0, 0);
	}


	.img-center {
		margin-left: 55.34rpx;
		margin-top: 30rpx;
	}

	.user-info {
		display: flex;
		margin-top: 30rpx;
		align-items: center;
		margin-left: 29.3rpx;
	}

	.user-info text {
		margin-right: 10rpx;
		color: #000000;
		font-size: 53.44rpx;
		font-weight: 400;
	}



	.text-center {
		display: flex;
		justify-content: center;
		/* 水平居中 */
		align-items: center;
		/* 垂直居中 */
		margin-left: 29.3rpx;
		margin-top: 10rpx;
		width: 139.31rpx;
		height: 47.71rpx;
		background-color: #BABCBB;
		color: #ffffff;
		border-radius: 10rpx;
	}

	.text-center .text-center-button {
		font-size: 26.72rpx;
		text-align: center;
		color: #ffffff;
	}

	.text-bottom {
		align-items: center;
		display: flex;
		color: #00A29C;
		font-size: 30rpx;
		margin-left: 29.3rpx;
		margin-top: 11rpx;
	}

	.main-label {
		background: #fff;
		padding: 40rpx;
		border-radius: 1rem;
		width: 80vw;
		margin: 0 auto;
	}

	.main-label .main-label-content .main-label-title {
		font-size: 30.53rpx;
		font-weight: 400;
	}

	.main-label-iocn {
		margin: 30.55rpx 0;
		display: flex;
		justify-content: space-between;
		/* 让子元素之间的距离相等 */
		align-items: center;
	}


	.main-label-iocn .item {
		flex: 1;
		/* 平均分布 */
		text-align: center;
	}

	.item-logo {
		display: flex;
		justify-content: center;
		/* 水平居中 */
	}

	.item-logo u--image {
		margin: 0 auto;
		/* 左右居中 */
	}

	.item-title {
		margin-top: 20rpx;
		color: #333333;
		font-size: 30.53rpx;
	}

	.item-tip {
		margin-top: 8rpx;
		color: #A8A8A8;
		font-size: 22.9rpx;
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
				width: 300rpx;

				.dian {
					width: 15.27rpx;
					height: 15.27rpx;
					background-color: #000000;
					border-radius: 50%;
					/* 创建圆点 */
					margin-right: 20rpx;
					/* 调整圆点与文本之间的距离 */
				}

				text {
					color: #000000;
					font-size: 27rpx;
					font-family: PingFangSC-Medium, PingFang SC;
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
					color: #5B5B5B;
					margin-right: 17rpx;
				}

				.task-button {
					background: #00A29C;
					border-radius: 17rpx;
					font-size: 22.9rpx;
					color: #FFFFFF;

					.my-button {
						background: #00A29C;
						border-radius: 10rpx;
						font-size: 20rpx;
						color: #FFFFFF;
						padding: 0rpx 10rpx;
					}

					.my-button-flag {
						background: #adadad;
						border-radius: 10rpx;
						font-size: 20rpx;
						color: #FFFFFF;
						padding: 0rpx 10rpx;
					}

				}
			}
		}
	}


	.bottom-text {
		position: fixed;
		text-align: center;
		bottom: 80rpx;
		width: 100%;

		.bottom-text-left {
			width: 267rpx;
			height: 38rpx;
			font-size: 27rpx;
			font-family: PingFangSC-Regular, PingFang SC;
			font-weight: 400;
			color: #5B5B5B;
			line-height: 38rpx;
		}

		.bottom-text-right {
			margin-top: 8rpx;
			width: 286rpx;
			height: 38rpx;
			font-size: 27rpx;
			font-family: PingFangSC-Medium, PingFang SC;
			font-weight: 500;
			color: #00A29C;
			line-height: 38rpx;
		}
	}

	.tis {
		margin-left: 20rpx;
		width: 22.9rpx;
		height: 22.9rpx;
		text-align: center;
		line-height: 22.9rpx;
		border-radius: 22.9rpx;
		display: inline-block;

	}

	.tisContent {
		width: 495rpx;
		height: 50rpx;
		position: fixed;
		background-color: #417CFF;
		color: #ffffff;
		margin-top: 8px;
		left: 158rpx;
		padding: 8rpx;
		font-size: 19.08rpx;
		z-index: 9999;
	}

	.icon-wenhao {
		font-size: 28rpx;
		margin-left: 8rpx;
	}
</style>