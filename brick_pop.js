'use strict';
(function() {
    // 抛出错误方法
    var error = function(text) {
        throw new Error(text);
    }

    /*
    	游戏
     */
    var Game = function(canvas) {
        this.canvas = canvas; // 画布实例
        this.ctx = this.canvas.getContext('2d');
        this.stageMap = {}; // 游戏场景
        this.currStage = null; // 当前场景
    }

    // 添加场景
    Game.prototype.addStage = function(stageMap) {
        for (var key in stageMap) {
            this.stageMap[key] = stageMap[key];
        }
    }

    // 设置当前游戏场景
    Game.prototype.setStage = function(stageName) {
        if (!this.stageMap[stageName]) {
            error('不存在的游戏场景！');
        }
        this.currStage = this.stageMap[stageName];
    }

    // 开始游戏
    Game.prototype.start = function() {
        if (!this.currStage) {
            error('未指定游戏场景！');
        }
        this.currStage.update();
    }

    /*
    	场景父类
     */
    var Stage = function(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }

    Stage.prototype.update = function() {
        error('update方法必须被复写！');
    }

    /*
    	游戏主体场景
     */
    var GameStage = function(canvas, ctx, bar, ballList, brickList) {
        Stage.call(this, canvas, ctx); // 继承父类属性
        this.bar = bar; // 挡板
        this.ballList = ballList; // 弹球列表
        this.brickList = brickList; // 砖块列表
    };

    // 继承Stage原型
    GameStage.prototype = Object.create(Stage);
    GameStage.prototype.constructor = GameStage;

    // 更新场景
    GameStage.prototype.update = function(ctx) {
        this._clearCanvas(this.ctx, this.canvas); // 清空画布
		this._drawCanvas(this.ctx);
    }

    GameStage.prototype._drawCanvas = function(ctx) {
        // 绘制图形
        var _self = this;
        _self._drawRect(_self.ctx, _self.bar);
        this.brickList.forEach(function(item) {
            _self._drawRect(_self.ctx, item);
        });
        this.ballList.forEach(function(item) {
            _self._drawRect(_self.ctx, item);
        });
    }

    // 绘制方块儿
    GameStage.prototype._drawRect = function(ctx, rect) {
        // 是否填充图形
        if (rect.fill === true) {
            ctx.fillStyle = rect.color;
            ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        }
        ctx.strokeStyle = rect.color;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }

    // 清空画布
    GameStage.prototype._clearCanvas = function(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    /*
    	方块
     */
    var Rect = function(width, height, x, y) {
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.color = '#000'; // 颜色
        this.fill = true; // 绘制出的图形是否填充颜色
    }

    /*
    	挡板
     */
    var Bar = function(width, height, x, y) {
        Rect.call(this, width, height, x, y);
    }

    Bar.prototype = Object.create(Rect);
    Bar.prototype.constructor = Bar;

    /*
    	砖块
     */
    var Brick = function(width, height, x, y) {
        Rect.call(this, width, height, x, y);
    }

    Brick.prototype = Object.create(Rect);
    Brick.prototype.constructor = Brick;

    /*
    	弹球
     */
    var Ball = function(width, height, x, y) {
        Rect.call(this, width, height, x, y);
    }

    Ball.prototype = Object.create(Rect);
    Ball.prototype.constructor = Ball;

    /*
    	demo版游戏
     */
    var gameDemo = (function() {
    	var canvas = document.querySelector('#canvas');
    	var gameDemo = new Game(canvas)


    	var bar = new Bar(100, 20, 450, 500);
    	var ball = new Ball(20, 20, 450, 300);
    	var ballList = [];
    	ballList.push(ball);
    	var brick = new Brick(70, 40, 200, 100);
    	var brickList = [];
    	brickList.push(brick);

    	var gameStage = new GameStage(gameDemo.canvas, gameDemo.ctx, bar, ballList, brickList);
    	var stageMap = {
    		gameStage: gameStage
    	};

    	gameDemo.addStage(stageMap);
    	gameDemo.setStage('gameStage');
    	gameDemo.start();
    })();
})();