<template>
	<view class="u-page content">
		<view class="navigation-container" :style="{height: navigationBarAndStatusBarHeight}">
			<!--空白来占位状态栏-->
			<view :style="{height: statusBarHeight}"></view>
			<!--自定义导航栏-->
			<view class="navigation-bar" :style="{height: navigationBarHeight}">
				<image src="../../static/logo.png" class="logo" mode="aspectFit"></image>
			</view>
		</view>
		<view class="u-demo-block">
			<view class="u-demo-block__content">
				<u-row class="head-block">
					<u-col span="3">
						<view class="demo-layout bg-purple-light img-center" v-if="!isLogin" @click="login()">
							<image src="../../static/avatar.png"></image>
						</view>
						<view class="demo-layout bg-purple-light img-center" v-if="isLogin">
							<image :src="userinfo.avatar"></image>
						</view>
					</u-col>
					<u-col span="9">
						<view class="user-login" v-if="!isLogin" @click="login()">
							<text>点击登录</text>
						</view>
						<view class="user-info" v-if="isLogin" @click.stop="user()">
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
				<view class="block" @click="uploadImg()">
					<image src="../../static/upload.png" mode=""></image>
					<view class="text">文献上传</view>
				</view>
				<view class="block" @click="chat(null)">
					<image src="../../static/chat.png" mode=""></image>
					<view class="text">任意聊天</view>
				</view>
			</view>
		</view>

		<view class="file">
			<text class="file-text">我的文档</text>
			<text class="file-num">剩余可上传{{userinfo.chance.totalUploadChance || 0}}个文档</text>
		</view>

		<view class="document">
			<view class="documents-wrapper" v-if="isLogin && document.length">
				<view class="u-demo-block__content" v-for="(item, index) in document" :key="index">
					<u-row customStyle="margin-bottom: 10px">
						<u-col span="3" @click="chat(item.dialogId, item.fileName)">
							<view class="demo-layout bg-purple-light img-file">
								<image src="../../static/pdf.png" shape="square"></image>
							</view>
						</u-col>
						<u-col span="7" @click="chat(item.dialogId, item.fileName)">
							<view class="file-name">
								<text>{{item.fileName}}</text>
							</view>
							<view class="file-date">
								<text>{{item.date}} {{item.size}}</text>
							</view>
						</u-col>
						<u-col span="2" @click="preview(item)">
							<view class="icon iconfont icon-yulan"></view>
						</u-col>
					</u-row>
				</view>
			</view>
			<view class="document-empty" v-else @click="uploadImg()">
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
				// 状态栏高度
				statusBarHeight: wx.getStorageSync('statusBarHeight') + 'px',
				// 导航栏高度
				navigationBarHeight: wx.getStorageSync('navigationBarHeight') + 'px',
				// 胶囊按钮高度
				menuButtonHeight: wx.getStorageSync('menuButtonHeight') + 'px',
				// 导航栏和状态栏高度
				navigationBarAndStatusBarHeight: wx.getStorageSync('statusBarHeight') +
					wx.getStorageSync('navigationBarHeight') +
					'px',

				isLogin: false,
				userinfo: {
					name: "loading..."
				},
				config: {},
				document: [],
			}
		},
		onLoad(e) {

			if (e && e.id) {
				this.$f.set('fid', e.id)
			}
			// 判断是否登录
			this.init();
		},
		onShow() {
			if (this.$f.get('userinfo', '')) {
				this.userinfo = this.$f.get('userinfo', '')
				this.isLogin = true;
			}
		},
		onShareAppMessage() {
			return {
				title: this.config.share.title == '' ? 'AI文档分析利器，不来试试吗？' : this.config.share.title,
				path: '/pages/index/index?id=' + this.userinfo.id,
				imageUrl: this.config.share.img == '' ? '../../static/share.jpg' : this.config.share.img,
			}
		},
		methods: {
			// 登录验证
			init() {
				const thi = this
				const fid = this.$f.get('fid', 0);
				// 判断是否登录成功 
				if (this.$f.get('token', '') && this.$f.get('userinfo', '') && this.$f.get('openid', '')) {
					this.isLogin = true
					this.documentList();
					this.getUserInfo();
				} else {
					uni.login({
						provider: 'weixin',
						success: function(res) {
							const code = res.code;
							console.log(code)
							thi.$h.http('login', {
								code: code,
								fid: fid
							}).then((res) => {
								const results = res.data
								if (thi.$f.isNullOrUndefined(results.token)) {
									thi.$f.set('token', results.token)
									thi.$f.set('openid', results.wxOpenId)
									thi.isLogin = true
									thi.documentList();
									thi.getUserInfo();
								} else thi.$f.set('openid', results.wxOpenId);
							})
						}
					});
				}

				// 加载配置信息
				this.getConfig();
			},

			// 点击上传
			uploadImg() {
				if (this.isLogin) {

					if (!this.userinfo.phone) {
						uni.navigateTo({
							url: '/pages/user/login'
						});
						return '';
					}

					// 判断是否可以上传 
					if (this.userinfo.chance.totalUploadChance <= 0)
						uni.showToast({
							title: "本周10次机会已经用完，请去完成任务或下周再来上传",
							duration: 3000,
							icon: 'none'
						})
					else this.confirm(0)
				} else
					uni.navigateTo({
						url: '/pages/user/login'
					});
			},

			// 获取用户信息
			async getUserInfo() {
				try {
					const res = await this.$h.http('userinfo')
					if (res.status === 1) {
						this.userinfo = res.data
						this.$f.set('userinfo', res.data)
					} else this.isLogin = false
				} catch (e) {
					uni.showToast({
						title: e.message,
						duration: 2000,
						icon: 'none'
					})
				}
			},

			// 未登录点击名称跳转登录
			login() {
				uni.navigateTo({
					url: '/pages/user/login'
				});
			},

			// 跳转个人信息
			user() {
				uni.navigateTo({
					url: '/pages/user/user'
				});
			},

			// 点击对话
			chat(dialogId, title) {
				uni.navigateTo({
					url: `/pages/chat/chat?dialogId=${dialogId}&title=${title}`
				});
			},

			// 获取文件列表
			async documentList() {
				try {
					const res = await this.$h.http('list-dialog-resource', {})
					if (res.status) {
						for (const i in res.data) {
							res.data[i].size = this.formatBytes(res.data[i].fileSize, 0)
							res.data[i].date = this.formatDate(new Date(res.data[i].updatedAt))
						}
						this.document = res.data
					} else throw new Error(res.msg)
				} catch (e) {
					uni.showToast({
						title: e.message,
						duration: 2000,
						icon: 'none'
					})
				}
			},
			// 打开相册
			confirm(index) {
				const token = this.$f.get('token', '')
				const url = this.$f.url();
				const thi = this

				if (this.userinfo.total_upload <= 0)
					return uni.showToast({
						title: "本周机会已经用完，请去完成任务或下周再来上传",
						duration: 3000,
						icon: 'none'
					})

				if (index == 1)
					uni.chooseMedia({
						count: 1,
						mediaType: ['all'],
						sourceType: ['album'],
						maxDuration: 30,
						camera: 'back',
						success(res) {

							const tempFilePaths = res.tempFiles[0].tempFilePath;
							const fileName = res.tempFiles[0].name || 'fileName.pdf';

							const size = res.tempFiles[0].size
							// 将选择的PDF文件上传至服务器
							thi.uploadFilePdf(url, token, tempFilePaths, fileName, size);

						}
					})
				else
					uni.chooseMessageFile({
						count: 1,
						type: 'file',
						extension: ['pdf', 'docx', 'doc'],
						success: function(res) {

							const tempFilePaths = res.tempFiles[0].path;
							const fileName = res.tempFiles[0].name
							const size = res.tempFiles[0].size
							// 将选择的PDF文件上传至服务器
							thi.uploadFilePdf(url, token, tempFilePaths, fileName, size);

						}
					});
			},

			// 统一上传文件
			uploadFilePdf(url, token, tempFilePaths, fileName, size) {
				const file_size = this.config.fileSize * 1024;

				// 判断文件大小  
				if (size > file_size)
					return uni.showToast({
						title: "上传文件不得大于" + this.formatBytes(file_size) + ',当前文件大小' + this.formatBytes(size),
						duration: 3000,
						icon: 'none'
					})

				uni.showLoading({
					title: '上传中',
					mask: true
				})

				uni.uploadFile({
					url: url + 'upload',
					filePath: tempFilePaths,
					name: 'file',
					header: {
						'token': token,
					},
					formData: {
						fileName: fileName,
						resourceTypeId: 1
					},
					success: res => {
						this.documentList();
						this.getUserInfo();
						uni.hideLoading();
					},
					fail: res => {
						uni.hideLoading();
					}
				});
			},


			// 获取配置
			getConfig() {
				const thi = this;
				this.$h.http('config', {}).then((res) => {
					if (res.status == 1) {
						thi.$f.set('config', res.data)
						thi.config = res.data;
					} else {
						uni.showToast({
							title: res.msg,
							duration: 2000,
							icon: 'none'
						})
					}
				})

			},
			// 点击取消
			cancel() {
				this.show = false
			},
			// 取消选中类型
			close() {
				this.show = false
			},

			// 计算大小
			formatBytes(bytes, decimals = 2) {
				if (bytes === 0) return '0 Bytes';

				const k = 1024;
				const dm = decimals < 0 ? 0 : decimals;
				const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

				const i = Math.floor(Math.log(bytes) / Math.log(k));

				return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
			},
			// 计算文本大小
			formatString(input) {
				if (input.length > 12) {
					const displayText = input.slice(0, 6) + '...' + input.slice(input.length - 6, input.length)
					return displayText
				} else {
					return input
				}
			},

			formatDate(date, fmt = 'yyyy-MM-dd hh:mm') {
				let o = {
					'M+': date.getMonth() + 1, // 月份
					'd+': date.getDate(), // 日
					'h+': date.getHours(), // 小时
					'm+': date.getMinutes(), // 分
					's+': date.getSeconds(), // 秒
					'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
					S: date.getMilliseconds() // 毫秒
				}
				if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
				for (let k in o)
					if (new RegExp('(' + k + ')').test(fmt))
						fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k])
							.length))
				return fmt
			},

			preview(item) {
				uni.showLoading({
					title: '文档打开中...',
					mask: true
				})
				uni.downloadFile({
					url: item.filePath,
					success: (res) => {
						uni.hideLoading()
						if (res.statusCode === 200)
							uni.openDocument({
								filePath: res.tempFilePath,
								showMenu: true,
								success: function(res) {
									//console.log('打开文档成功');
								}
							});
					},
					fail: res => {
						uni.hideLoading()
					}
				});
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
			color: #00A29C;
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
			background-image: url("../../static/arrow.png");
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
			background: #00A29C;

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
		color: #5B5B5B;
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
	}

	.img-file image {
		width: 114.5rpx;
		height: 114.5rpx;
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
		color: #00A29C;
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