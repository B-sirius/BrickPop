'use strict';
(function() {
    // 抛出错误方法
    var error = function(text) {
        throw new Error(text);
    }

    // 碰撞检测
    var collision = function(rect1, rect2) {
        if (rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.height + rect1.y > rect2.y) {
            return true;
        }
    }

    // 深拷贝
    var deepClone = function(currobj){
        if(typeof currobj !== 'object'){
            return currobj;
        }
        if(currobj instanceof Array){
            var newobj = [];
        }else{
            var newobj = {}
        }
        var currQue = [currobj], newQue = [newobj]; //关键在这里
        while(currQue.length){
            var obj1 = currQue.shift(),obj2 = newQue.shift();
            for(var key in obj1){
                if(typeof obj1[key] !== 'object'){
                    obj2[key] = obj1[key];
                }else{
                    if(obj1[key] instanceof Array ){
                        obj2[key] = [];
                    }else{
                        obj2[key] = {}
                    };
                    // 妙啊
                    currQue.push(obj1[key]);
                    newQue.push(obj2[key]);
                }
            }
        }
        return newobj;
    };

    /*
        游戏
     */
    var Game = function() {
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
        this.play = true; // 游戏场景进行
        this.cache = {};

        this._addListener(); // 绑定监听事件
        this.saveCache();
    };

    // 继承Stage原型
    GameStage.prototype = Object.create(Stage);
    GameStage.prototype.constructor = GameStage;

    // 绑定控制台操作按钮
    GameStage.prototype._addListener = function() {
        this._initBaseControl();
        this._initGameControl();
    }

    // 系统按键设置
    GameStage.prototype._initBaseControl = function() {
        var _self = this;
        var keyMap = {
            'KeyP': function() { // 暂停
                _self.pause();
            },
            'KeyO': function() { // 继续
                _self.resume();
            },
            'KeyR': function() { // 重新开始
                _self.restart();
            }
        }
        document.addEventListener('keydown', function(e) {
            var code = e.code;
            if (keyMap[code]) {
                keyMap[code]();
            }
        });
    }

    // 游戏控制按键设置
    GameStage.prototype._initGameControl = function() {
        var _self = this;
        var keyDownMap = {
            'KeyA': function() {
                _self.bar.setMoveBase(-1);
            },
            'KeyD': function() {
                _self.bar.setMoveBase(1);
            }
        }

        var keyUpMap = {
            'KeyA': function() {
                _self.bar.setMoveBase(0);
            },
            'KeyD': function() {
                _self.bar.setMoveBase(0);
            }
        }

        document.addEventListener('keydown', function(e) {
            var code = e.code;
            if (keyDownMap[code]) {
                keyDownMap[code]();
            }
        });

        document.addEventListener('keyup', function(e) {
            var code = e.code;
            if (keyUpMap[code]) {
                keyUpMap[code]();
            }
        });
    }

    // 暂停游戏场景
    GameStage.prototype.pause = function() {
        this.play = false;
    }

    // 继续游戏场景
    GameStage.prototype.resume = function() {
        this.play = true;
    }

    // 重新开始游戏
    GameStage.prototype.restart = function() {
        this._loadCache();
        this.pause();
        this._clearCanvas();
        this._drawCanvas();
    }

    GameStage.prototype.saveCache = function() {
        this.cache.bar = this.bar.loadCache();
        this.cache.brickList = this.brickList.map(function(brick) {
            return brick.loadCache();
        });
        this.cache.ballList = this.ballList.map(function(ball) {
            return ball.loadCache();
        });
    }

    // 重新加载游戏地图
    GameStage.prototype._loadCache = function() {
        this.bar = this.cache.bar.loadCache();
        this.brickList = this.cache.brickList.map(function(brick) {
            return brick.loadCache();
        });
        this.ballList = this.cache.ballList.map(function(ball) {
            return ball.loadCache();
        });
    }

    // 更新场景
    GameStage.prototype.update = function() {
        if (this.play) {
            this._updateBrickList();
            this._updateBallList();
            this._updateBar();

            this._clearCanvas();
            this._drawCanvas();
        }

        var _self = this;
        requestAnimationFrame(this.update.bind(_self));
    }

    // 绘制所有图形
    GameStage.prototype._drawCanvas = function() {
        // 绘制图形
        var _self = this;
        _self._drawRect(_self.bar);
        this.brickList.forEach(function(item) {
            _self._drawRect(item);
        });
        this.ballList.forEach(function(item) {
            _self._drawRect(item);
        });
    }

    // 绘制方块儿
    GameStage.prototype._drawRect = function(rect) {
        // 是否填充图形
        if (rect.fill === true) {
            this.ctx.fillStyle = rect.color;
            this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        }
        this.ctx.strokeStyle = rect.color;
        this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }

    // 清空画布
    GameStage.prototype._clearCanvas = function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // 更新弹球列表
    GameStage.prototype._updateBallList = function() {
        for (var i = this.ballList.length - 1; i >= 0; i--) {
            var ball = this.ballList[i];

            ball.oldX = ball.x;
            ball.oldY = ball.y;

            ball.x += ball.dx;
            ball.y += ball.dy;

            this._brickCollision(ball);
            this._wallCollision(ball);
            this._barCollision(ball);
        }
    }

    // 砖块碰撞检测
    GameStage.prototype._brickCollision = function(ball) {
        for (var i = this.brickList.length - 1; i >= 0; i--) {
            var brick = this.brickList[i];
            // 是否相碰
            if (collision(ball, brick)) {
                brick.impact(); // 砖块被撞击
                ball.bounce(brick); // 球反弹
            }
        }
    }

    // 边界检测
    GameStage.prototype._wallCollision = function(ball) {
        if (ball.x < 0 || ball.x + ball.width > this.canvas.width) {
            ball.dx = -ball.dx;
            if (ball.x < 0) {
                ball.x = 0;
            } else {
                ball.x = this.canvas.width - ball.width;
            }
        }

        if (ball.y < 0 || ball.y + ball.height > this.canvas.height) {
            ball.dy = -ball.dy;
            if (ball.y < 0) {
                ball.y = 0
            } else {
                ball.y = this.canvas.height - ball.height;
            }
        }
    }
    // 挡板碰撞检测
    GameStage.prototype._barCollision = function(ball) {
        if (collision(ball, this.bar)) {
            ball.bounce(this.bar); // 球反弹
        }
    }

    // 更新砖块列表
    GameStage.prototype._updateBrickList = function() {
        for (var i = this.brickList.length - 1; i >= 0; i--) {
            var brick = this.brickList[i];

            // 若砖块hp为0，移除
            if (brick.hp <= 0) {
                this.brickList.splice(i, 1);
                break;
            }
        }
    }

    // 更新挡板位置
    GameStage.prototype._updateBar = function() {
        if (this.play) {
            this.bar.update();
        }
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
        this.speed = 500 / 60; // 移动速度
        this.moveBase = 0; // 移动基准
        this.cache = {
            width: width,
            height: height,
            x: x,
            y: y
        }

        this._saveCache();
    }

    Bar.prototype = Object.create(Rect);
    Bar.prototype.constructor = Bar;

    Bar.prototype._saveCache = function() {
        for (var key in this.cache) {
            this.cache[key] = deepClone(this.cache[key]);
        }
    }

    Bar.prototype.loadCache = function() {
        return new Bar(this.cache.width, this.cache.height, this.cache.x, this.cache.y);
    }

    // 设置移动基准
    Bar.prototype.setMoveBase = function(val) {
        this.moveBase = val;
    }

    // 更新位置
    Bar.prototype.update = function() {
        this.x += this.moveBase * this.speed;
    }

    /*
        砖块
     */
    var Brick = function(width, height, x, y) {
        Rect.call(this, width, height, x, y);
        this.hp = 1;
        this.cache = {
            width: width,
            height: height,
            x: x,
            y: y
        }

        this._saveCache();
    }

    Brick.prototype = Object.create(Rect);
    Brick.prototype.constructor = Brick;

    Brick.prototype._saveCache = function() {
        for (var key in this.cache) {
            this.cache[key] = deepClone(this.cache[key]);
        }
    }

    Brick.prototype.loadCache = function() {
        return new Brick(this.cache.width, this.cache.height, this.cache.x, this.cache.y);
    }

    // 砖块被撞到
    Brick.prototype.impact = function() {
        --this.hp;
    }

    /*
        弹球
     */
    var Ball = function(width, height, x, y) {
        Rect.call(this, width, height, x, y);
        this.speed = 500 / 60; // 速度
        this.angle = Math.PI / 4; // 角度
        this.dx = this.speed * Math.cos(this.angle); // x轴分速度
        this.dy = this.speed * Math.sin(this.angle); // y轴分速度
        this.oldX = null; // 上一帧的x
        this.oldY = null; // 上一帧的y

        this.cache = {
            width: width,
            height: height,
            x: x,
            y: y
        }

        this._saveCache();
    }

    Ball.prototype = Object.create(Rect);
    Ball.prototype.constructor = Ball;

    Ball.prototype._saveCache = function() {
        for (var key in this.cache) {
            this.cache[key] = deepClone(this.cache[key]);
        }
    }

    Ball.prototype.loadCache = function() {
        return new Ball(this.cache.width, this.cache.height, this.cache.x, this.cache.y);
    }

    // 砖块被撞到
    Ball.prototype.impact = function() {
        --this.hp;
    }

    // 球反弹
    Ball.prototype.bounce = function(rect) {
        // y轴方向的撞击
        if (this.oldX < rect.x + rect.width &&
            this.oldX + this.width > rect.x) {
            this.dy = -this.dy;
            // 从上方撞击
            if (this.oldY + this.height < rect.y) {
                this.y = rect.y - this.height;
            } else {
                // 从下方撞击
                this.y = rect.y + rect.height;
            }
        } else {
            // x轴方向的撞击
            this.dx = -this.dx;
            // 从左侧撞击
            if (this.oldX + this.width < rect.x) {
                this.x = rect.x - this.width;
            } else {
                // 从右侧撞击
                this.x = rect.x + rect.width;
            }
        }
    }

    /*
        demo版游戏
     */
    var gameDemo = (function() {
        var canvas = document.querySelector('#canvas');
        var ctx = canvas.getContext('2d');

        var gameDemo = new Game();

        var bar = new Bar(100, 20, 450, 500);
        var ball = new Ball(10, 10, 450, 400);
        var ballList = [];
        ballList.push(ball);

        var brickList = [];
        for (var i = 5; i >= 0; i--) {
            for (var j = 3; j >= 0; j--) {
                var brick = new Brick(100, 40, i * 100, j * 80 + 50);
                brickList.push(brick);
            }
        }

        var gameStage = new GameStage(canvas, ctx, bar, ballList, brickList);
        var stageMap = {
            gameStage: gameStage
        };

        gameDemo.addStage(stageMap);
        gameDemo.setStage('gameStage');
        gameDemo.start();
    })();
})();