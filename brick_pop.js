'use strict';
(function() {
	/*
		游戏
	 */
	var Game = function(canvas) {
		this.canvas = canvas; // 画布实例
		this.context = this.canvas.getContext('2d');
		this.stageMap = {}; // 游戏场景
		this.currStage = null; // 当前场景
	}

	// 添加场景
	Game.prototype.addStage = function(stageMap) {
		for (key in stageMap) {
			this.stage[key] = stageMap[key];
		}
	}

	// 开始游戏
	Game.prototype.start = function() {

	}

	/*
		场景父类
	 */
	var Stage = function() {
	}

	Stage.prototype.update = function() {
		throw Error('update方法必须被复写！');
	}

	/*
		游戏主体场景
	 */
	var GameStage = function() {
		this.brickList = []; // 砖块列表
		this.bar = bar; // 挡板
		this.ballList = []; // 弹球列表
	};
	// 继承Stage类
	GameStage.prototype = Object.Create(Stage);
	// 更新场景
	GameStage.prototype.update = function(ctx) {

	}
	// 绘制方块儿
	GameStage.prototype._drawRect = function(ctx, ball) {

	}
	// 清空画布
	GameStage.prototype._clearCanvas = function(ctx, canvas) {

	}

	/*
		挡板
	 */
	var Bar = function(width, height, x, y) {
		this.width = width;
		this.height = height;
		this.x = x;
		this.y = y;
	}

	/*
		砖块
	 */
	var Brick = function(width, height, x, y) {
		this.width = width;
		this.height = height;
		this.x = x;
		this.y = y;
	}

	/*
		弹球
	 */
	var Ball = function(width, height, x, y) {
		this.width = width;
		this.height = height;
		this.x = x;
		this.y = y;
	}
})();