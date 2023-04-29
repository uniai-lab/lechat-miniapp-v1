<template>
	<view class="page">
		<view class="navbar">
			<uni-icons type="back" size="50rpx" @click="back"></uni-icons>
			<view class="navbar-title">{{title}}</view>
		</view>

		<scroll-view class="chat" scroll-y :scroll-with-animation="false" :scroll-into-view="bottomView">
			<view class="chat-content" v-for="(item, index) in chat" :key="index" :data-self="item.type">
				<u--image showLoading :src="item.avatar" width="76rpx" height="76rpx" shape="circle" fade
					duration="450" />
				<view class="hr" />
				<view class="content-view">
					<rich-text :nodes="item.content"></rich-text>
				</view>
			</view>
			<view class="retry-content" v-show="showRetry">
				<text class="retry-text">网络错误，请</text>
				<view class="retry-btn-content" @tap="clickRetry">
					<text class="retry-btn-text">重试</text>
					<view>
						<image class="retry-image" src="../../static/retry.png"></image>
					</view>
				</view>
			</view>
			<view id="bottomView" class="bottom-view"></view>
			<view v-if="keyboardHeight" class="placeholder" :style="{ height: keyboardHeight + 'px' }"></view>
		</scroll-view>

		<view class="input-bottom" v-show="showBottom && !sending">
			<input class="input" :adjust-position="false" v-model="value" :placeholder="placeholder" />
			<button class="bottom" @click="sendMessage">
				<view class="bottom-title">发送</view>
				<view class="bottom-number">剩余 {{userinfo.chance.totalChatChance||0}} 次</view>
			</button>
			<view v-if="keyboardHeight" class="placeholder" :style="{ height: keyboardHeight + 'px' }"></view>
		</view>

	</view>
</template>
<script>
	export default {
		data() {
			return {
				placeholder: '输入关于文档的问题',
				chat: [],
				value: '',
				sending: false,
				title: '',
				dialogId: 0,
				userinfo: {},
				bottomView: '',
				showBottom: false,
				showRetry: false,
				keyboardHeight: 0
			};
		},
		onResize() {
			this.showInput = false
		},
		onLoad(e) {
			if (e && parseInt(e.dialogId)) {
				this.title = e.title
				this.dialogId = parseInt(e.dialogId) || 0
			} else {
				this.title = '任意聊天'
				this.placeholder = '输入任意内容';
			}

			if (e && e.title && e.title != 'undefined')
				uni.setNavigationBarTitle({
					title: e.title
				});

			this.init();
			this.getUserInfo();

			uni.onKeyboardHeightChange(res => {
				this.showBottom = false
				this.keyboardHeight = res.height;
				this.scrollToBottom()
				this.showBottomInput()
			})
		},
		methods: {
			back() {
				uni.navigateBack();
			},
			showBottomInput(time = 500) {
				setTimeout(() => this.showBottom = true)
			},
			scrollToBottom(time = 500, callback = null) {
				this.bottomView = ''
				setTimeout(() => {
					this.bottomView = 'bottomView'
					if (callback && typeof callback === 'function') callback()
				}, time)
			},
			// 发送消息
			async sendMessage() {
				// 判断文本为空
				if (!this.value.trim()) return
				// 判断是否有次数
				if (!this.userinfo.chance.totalChatChance)
					return uni.showToast({
						title: "对话次数已用尽",
						duration: 2000,
						icon: 'none'
					})

				try {
					this.sending = true
					this.scrollToBottom()
					uni.showLoading({
						title: '正在输入',
						mask: true
					})

					const res = await this.$h.http('chat-stream', {
						input: this.value,
						dialogId: this.dialogId
					})

					if (res.status == 1) {
						this.chat.push({
							avatar: this.userinfo.avatar,
							chatId: 4,
							content: this.value,
							dialogId: this.dialogId,
							type: true,
							end: true,
							userId: this.userinfo.id
						});
						this.value = ''
						this.getChat()
					} else throw new Error(res.msg)
				} catch (e) {
					uni.showToast({
						title: e.message,
						duration: 2000,
						icon: 'none'
					})
				} finally {
					uni.hideLoading()
					this.sending = false
				}
			},
			// 获取聊天列表数据
			async init() {
				const thi = this;
				try {
					const res = await this.$h.http('list-chat', {
						dialogId: thi.dialogId,
					})
					if (res.status == 1) {
						this.chat = res.data
						this.chat[0].content = this.chat[0].content.replace(/{bold}/,
							'<span style=\"font-weight:700;\">');
						this.chat[0].content = this.chat[0].content.replace(/{\/bold}/, '</span>');
						this.scrollToBottom()
						this.showBottomInput()
					} else throw new Error(res.message)
				} catch (e) {
					uni.showToast({
						title: e.message,
						duration: 2000,
						icon: 'none'
					})
				}

			},

			// 用户信息
			async getUserInfo() {
				try {
					const res = await this.$h.http('userinfo', {})
					if (res.status == 1) this.userinfo = res.data;
					else throw new Error(res.msg)
				} catch (e) {
					uni.showToast({
						title: e.msg,
						duration: 2000,
						icon: 'none'
					})
				}
			},

			getChat() {
				let elapsed = 0
				let errorCount = 0
				this.timer = setInterval(async () => {
					const res1 = await this.$h.http('get-chat-stream')
					if (res1.status == 1) {
						errorCount = 0
						if (elapsed == 0) this.chat.push(res1.data)
						this.chat[this.chat.length - 1].content = res1.data.content
						this.scrollToBottom()
					} else {
						errorCount++
						console.log(errorCount)
						if (errorCount === 3) {
							clearInterval(this.timer)
							this.getUserInfo()
							this.sending = false
							uni.showToast({
								title: res.message,
								duration: 2000,
								icon: 'none'
							})
							this.showRetry = true
							this.scrollToBottom()
							throw new Error(res.message)
						}
					}
					if (res1.data.end == true) {
						clearInterval(this.timer)
						this.getUserInfo()
						this.sending = false
					}
					elapsed += 100
				}, 100)
			},
		},
	};
</script>
<style lang="scss">
	.retry-content {
		justify-content: flex-start;
		display: flex;
		margin-left: 130rpx;
		align-items: center;
		padding-bottom: 30rpx;
	}

	.retry-text {
		color: #EF2020;
		font-size: 28rpx;

	}

	.retry-btn-content {
		display: flex;
		align-items: center;
	}

	.retry-btn-text {
		color: #0014c2;
		font-size: 28rpx;
	}

	.retry-image {
		width: 25rpx;
		height: 25rpx;
		margin-left: 5rpx;
		background-image: url("../../static/retry.png");
		background-repeat: no-repeat;
		background-size: contain;
	}

	.navbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 180rpx;
		background: #eefffe;
		display: flex;
		justify-items: center;
		align-items: center;
		padding: 40rpx 15rpx 20rpx 15rpx;

		.navbar-title {
			font-size: 35rpx;
			max-width: 60vw;
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
			font-weight: 400;
		}
	}

	.chat {
		background: linear-gradient(to bottom, #eefffe, #FDFDFD);
		position: fixed;
		top: 180rpx;
		bottom: 0;
		left: 0;
		right: 0;

		.bottom-view {
			height: calc(130rpx + constant(safe-area-inset-bottom));
			height: calc(130rpx + env(safe-area-inset-bottom));
		}
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
			background: #FFFFFF;
			box-shadow: 0rpx 0rpx 8rpx 0rpx #E9E9E9;
			border-radius: 29rpx;
			padding: 28rpx;
			color: #000;
			font-size: 30.53rpx;
			word-wrap: break-word;
			max-width: 70%
		}

		&[data-self=true] {
			flex-direction: row-reverse;

			.content-view {
				color: #fff;
				background: #00A29C;
				box-shadow: 0rpx 0rpx 8rpx 0rpx #E9E9E9;
			}
		}
	}

	.input-bottom {
		animation: slide-fade-in 0.5s ease-in forwards;
		box-shadow: 0rpx 0rpx 8rpx 0rpx rgba(233, 233, 233, 0.5);
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
			width: 400rpx;
			padding: 0 40rpx;
			border: solid 2px #00A29C;
		}

		.bottom {
			margin-left: 22rpx;
			width: 200rpx;
			height: 90rpx;
			background: linear-gradient(127deg, #36ad6a 0%, #00A29C 100%);
			border-radius: 100rem;
			text-align: center;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			margin-right: 0;

			.bottom-title {
				font-size: 30rpx;
				line-height: 30rpx;
				font-weight: 700;
				color: #FFFFFF;
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