'use strict';
(function() {
    var _bind = Function.prototype.bind;

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
    var deepClone = function(currobj) {
        if (typeof currobj !== 'object') {
            return currobj;
        }
        if (currobj instanceof Array) {
            var newobj = [];
        } else {
            var newobj = {}
        }
        var currQue = [currobj],
            newQue = [newobj]; //关键在这里
        while (currQue.length) {
            var obj1 = currQue.shift(),
                obj2 = newQue.shift();
            for (var key in obj1) {
                if (typeof obj1[key] !== 'object') {
                    obj2[key] = obj1[key];
                } else {
                    if (obj1[key] instanceof Array) {
                        obj2[key] = [];
                    } else {
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
            this.stageMap[key].game = this;
        }
    }

    // 设置当前游戏场景
    Game.prototype.setStage = function(stageName) {
        if (!this.stageMap[stageName]) {
            error('不存在的游戏场景！');
        }
        // 如果已有场景在运行
        if (this.currStage) {
            this.currStage.stop();
        }
        this.currStage = this.stageMap[stageName];
    }

    // 开始游戏
    Game.prototype.start = function() {
        if (!this.currStage) {
            error('未指定游戏场景！');
        }
        this.currStage.init();
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

    Stage.prototype.init = function() {
        error('init方法必须被重写!');
    };

    Stage.prototype.stop = function() {
        error('stop方法必须被重写!');
    }

    // 清空画布
    Stage.prototype._clearCanvas = function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    var TitleStage = function(canvas, ctx) {
        Stage.call(this, canvas, ctx); // 继承父类属性
        // 场景激活标志
        this.active = false;
        // 按键绑定的引用
        this.baseControl = null;
    }

    // 继承Stage原型
    TitleStage.prototype = Object.create(Stage.prototype);
    TitleStage.prototype.constructor = TitleStage;

    // 初始化标题界面
    TitleStage.prototype.init = function() {
        this.active = true;
        this._addListener();
    }

    // 停止标题界面
    TitleStage.prototype.stop = function() {
        this.active = false;
        this._removeListener();
    }

    TitleStage.prototype.update = function() {
        // 检查当前场景是否激活
        if (!this.active) {
            return;
        }

        this._clearCanvas();
        this._drawCanvas();

        var _self = this;
        requestAnimationFrame(this.update.bind(_self));
    }

    TitleStage.prototype._drawCanvas = function() {
        this._drawTitle();
    }

    TitleStage.prototype._drawTitle = function() {
        var ctx = this.ctx;

        ctx.font = '50px serif';

        var fontWidth = ctx.measureText('BrickPop').width;
        var fontX = this.canvas.width / 2 - fontWidth / 2;

        ctx.fillStyle = '#000';
        ctx.fillText('BrickPop', fontX, 200);
    }

    TitleStage.prototype._addListener = function() {
        this._enableBaseControl();
    }

    TitleStage.prototype._removeListener = function() {
        this._disableBaseControl();
    }

    TitleStage.prototype._enableBaseControl = function() {
        var _self = this;
        var keyMap = {
            // 开始游戏
            'Enter': function() {
                _self.game.setStage('gameStage');
                _self.game.start();
            }
        }

        this.baseControl = function(e) {
            var code = e.code;
            if (keyMap[code]) {
                keyMap[code]();
            }
        }

        document.addEventListener('keydown', _self.baseControl);
    }

    TitleStage.prototype._disableBaseControl = function() {
        document.removeEventListener('keydown', this.baseControl);
    }

    /*
        游戏主体场景
     */
    var GameStage = function(canvas, ctx) {
        Stage.call(this, canvas, ctx); // 继承父类属性
        this.bar = null; // 挡板
        this.ballList = null; // 弹球列表
        this.brickList = null; // 砖块列表
        this.particleList = []; // 粒子列表
        this.particleCache = []; // 粒子缓存池
        // 游戏场景进行
        this.play = true;
        // 场景激活标志
        this.active = false;
        // 按键绑定的引用
        this.baseControl = null;
        this.gameKeyDown = null;
        this.gameKeyUp = null;
    };

    // 继承Stage原型
    GameStage.prototype = Object.create(Stage.prototype);
    GameStage.prototype.constructor = GameStage;

    // 初始化游戏场景
    GameStage.prototype.init = function() {
        this.active = true;

        this._addListener();

        this._loadBrickList();
        this._loadBallList();
        this._loadBar();
        this.particleList = [];
        this.particleCache = [];

        this._clearCanvas();
        this._drawCanvas();
    }

    // 停止场景工作
    GameStage.prototype.stop = function() {
        this.active = false;

        this._removeListener();
    }

    // 绑定控制台操作按钮
    GameStage.prototype._addListener = function() {
        this._enableBaseControl();
        this._enableGameControl();
    }

    GameStage.prototype._removeListener = function() {
        this._disableBaseControl();
        this._disableGameControl();
    }

    // 激活系统按键
    GameStage.prototype._enableBaseControl = function() {
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
            },
            'Escape': function() { // 回到标题界面
                _self.game.setStage('titleStage');
                _self.game.start();
            }
        }

        this.baseControl = function(e) {
            var code = e.code;
            if (keyMap[code]) {
                keyMap[code]();
            }
        }

        document.addEventListener('keydown', _self.baseControl);
    }

    // 激活游戏控制按键
    GameStage.prototype._enableGameControl = function() {
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

        this.gameKeyDown = function(e) {
            var code = e.code;
            if (keyDownMap[code]) {
                keyDownMap[code]();
            }
        }

        this.gameKeyUp = function(e) {
            var code = e.code;
            if (keyUpMap[code]) {
                keyUpMap[code]();
            }
        }

        document.addEventListener('keydown', _self.gameKeyDown);
        document.addEventListener('keyup', _self.gameKeyUp);
    }

    // 禁用系统按键
    GameStage.prototype._disableBaseControl = function() {
        document.removeEventListener('keydown', this.baseControl);
    }

    // 禁用游戏按键
    GameStage.prototype._disableGameControl = function() {
        document.removeEventListener('keydown', this.gameKeyDown);
        document.removeEventListener('keyup', this.gameKeyUp);
    }

    // 设置砖块地图数据
    GameStage.prototype.setBrickData = function(brickData) {
        this.brickData = brickData;
    }

    // 设置挡板数据
    GameStage.prototype.setBarData = function(barData) {
        this.barData = barData;
    }

    // 设置弹球数据
    GameStage.prototype.setBallData = function(ballData) {
        this.ballData = ballData;
    }

    // 从地图砖块数据加载砖块列表
    GameStage.prototype._loadBrickList = function() {
        // 生成brick实例数组
        var brickList = [];
        this.brickData.forEach(function(item) {
            brickList.push(new(_bind.apply(Brick, [null].concat(item)))());
        });

        this.brickList = brickList;
    }

    // 从挡板数据加载挡板
    GameStage.prototype._loadBar = function() {
        // 生成bar实例
        this.bar = new(_bind.apply(Bar, [null].concat(this.barData)))();
    }

    // 从弹球数据加载弹球列表
    GameStage.prototype._loadBallList = function() {
        // 生成ball实例数组
        var ballList = [];
        this.ballData.forEach(function(item) {
            ballList.push(new(_bind.apply(Ball, [null].concat(item)))());
        });

        this.ballList = ballList;
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
        this._loadBar();
        this._loadBallList();
        this._loadBrickList();
        this.particleList = [];

        this.pause();
        this._clearCanvas();
        this._drawCanvas();
    }

    // // 生成地图缓存
    // GameStage.prototype.saveCache = function() {
    //     // 缓存挡板
    //     this.cache.bar = this.bar.loadCache();
    //     // 缓存砖块
    //     this.cache.brickList = this.brickList.map(function(brick) {
    //         return brick.loadCache();
    //     });
    //     // 缓存弹球
    //     this.cache.ballList = this.ballList.map(function(ball) {
    //         return ball.loadCache();
    //     });
    // }

    // // 从缓存加载游戏地图
    // GameStage.prototype._loadCache = function() {
    //     this.bar = this.cache.bar.loadCache();
    //     this.brickList = this.cache.brickList.map(function(brick) {
    //         return brick.loadCache();
    //     });
    //     this.ballList = this.cache.ballList.map(function(ball) {
    //         return ball.loadCache();
    //     });
    // }

    // 更新场景
    GameStage.prototype.update = function() {
        // 检查当前场景是否激活
        if (!this.active) {
            return;
        }

        // 检查资源是否加载完成
        if (!(this.ballList && this.brickList && this.bar)) {
            error('资源未加载完成');
            return;
        }

        // 检查是否处于播放状态
        if (this.play) {
            this._updateBar();
            this._updateBrickList();
            this._updateBallList();
            this._updateParticleList();

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
        this.particleList.forEach(function(item) {
            _self._drawRect(item);
        })
    }

    // 绘制方块儿
    GameStage.prototype._drawRect = function(rect) {
        var ctx = this.ctx;
        // 是否填充图形
        if (rect.fill === true) {
            ctx.fillStyle = rect.color;
            ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
            return;
        }
        ctx.strokeStyle = rect.color;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
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

    // 更新砖块列表
    GameStage.prototype._updateBrickList = function() {
        for (var i = this.brickList.length - 1; i >= 0; i--) {
            var brick = this.brickList[i];

            // 若砖块hp为0，移除
            if (brick.hp <= 0) {
                this._blast(brick.x + brick.width / 2, brick.y + brick.height / 2, 20); // boooom
                this.brickList.splice(i, 1);
                break;
            }
        }
    }

    // 更新挡板位置
    GameStage.prototype._updateBar = function() {
        if (this.play) {
            this.bar.update();
            this._wallCollision(this.bar);
        }
    }

    // 更新粒子
    GameStage.prototype._updateParticleList = function() {
        for (var i = this.particleList.length - 1; i >= 0; i--) {
            var particle = this.particleList[i];

            particle.x += particle.dx;
            particle.y += particle.dy;

            // 亮度衰减
            particle.fade();
            particle.updateColor();

            if (particle.light <= 0) {
                this.particleList.splice(i, 1);
                this.particleCache.push(particle);
            }
        }
    }

    // 爆炸粒子飞溅
    GameStage.prototype._blast = function(x, y, num) {
        for (var i = num - 1; i >= 0; i--) {
            var particle;
            if (this.particleCache.length) { // 首先从粒子缓存池中取对象
                particle = this.particleCache.pop().reset(x, y);
            } else {
                particle = new Particle(5, 5, x, y);
            }
            this.particleList.push(particle);
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
    GameStage.prototype._wallCollision = function(rect) {
        // 弹球碰撞检测
        if (rect.x < 0 || rect.x + rect.width > this.canvas.width) {
            rect.dx = -rect.dx;
            if (rect.x < 0) {
                rect.x = 0;
            } else {
                rect.x = this.canvas.width - rect.width;
            }
        }

        if (rect.y < 0 || rect.y + rect.height > this.canvas.height) {
            rect.dy = -rect.dy;
            if (rect.y < 0) {
                rect.y = 0
            } else {
                rect.y = this.canvas.height - rect.height;
            }
        }
    }

    // 挡板碰撞检测
    GameStage.prototype._barCollision = function(ball) {
        if (collision(ball, this.bar)) {
            ball.bounce(this.bar); // 球反弹
        }
    }

    /*
        方块
     */
    var Rect = function(width, height, x, y, config) {
        config ? config : config = {};

        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.color = config['color'] || '#000'; // 颜色
        this.fill = config['fill'] === false ? false : true; // 绘制出的图形是否填充颜色
    }

    /*
        挡板
     */
    var Bar = function(width, height, x, y, rectConfig, barConfig) {
        Rect.call(this, width, height, x, y, rectConfig);

        barConfig ? barConfig : barConfig = {};

        this.speed = barConfig['speed'] || 500 / 60; // 移动速度
        this.moveBase = 0; // 移动基准
        // this.cache = {
        //     width: this.width,
        //     height: this.height,
        //     x: this.x,
        //     y: this.y,
        //     color: this.color,
        //     fill: this.fill,
        //     speed: this.speed,
        //     moveBase: this.moveBase
        // }

        // this._saveCache();
    }

    Bar.prototype = Object.create(Rect.prototype);
    Bar.prototype.constructor = Bar;

    // Bar.prototype._saveCache = function() {
    //     for (var key in this.cache) {
    //         this.cache[key] = deepClone(this.cache[key]);
    //     }
    // }

    // Bar.prototype.loadCache = function() {
    //     return new Bar(this.cache.width, this.cache.height, this.cache.x, this.cache.y);
    // }

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
    var Brick = function(width, height, x, y, rectConfig, brickConfig) {
        Rect.call(this, width, height, x, y, rectConfig);

        brickConfig ? brickConfig : brickConfig = {};

        this.hp = brickConfig['hp'] || 1;
        // this.cache = {
        //     width: this.width,
        //     height: this.height,
        //     x: this.x,
        //     y: this.y,
        //     rectConfig: {
        //         color: this.color,
        //         fill: this.fill
        //     },
        //     brickConfig: {
        //         hp: this.hp
        //     }
        // }

        // this._saveCache();
    }

    Brick.prototype = Object.create(Rect.prototype);
    Brick.prototype.constructor = Brick;

    // Brick.prototype._saveCache = function() {
    //     for (var key in this.cache) {
    //         this.cache[key] = deepClone(this.cache[key]);
    //     }
    // }

    // Brick.prototype.loadCache = function() {
    //     return new Brick(this.cache.width, this.cache.height, this.cache.x, this.cache.y);
    // }

    // 砖块被撞到
    Brick.prototype.impact = function() {
        --this.hp;
    }

    /*
        弹球
     */
    var Ball = function(width, height, x, y, rectConfig, ballConfig) {
        Rect.call(this, width, height, x, y, rectConfig);

        ballConfig ? ballConfig : ballConfig = {};

        this.speed = ballConfig['speed'] || 500 / 60; // 速度
        this.angle = ballConfig['angle'] || Math.PI / 4; // 角度
        this.dx = this.speed * Math.cos(this.angle); // x轴分速度
        this.dy = this.speed * Math.sin(this.angle); // y轴分速度
        this.oldX = null; // 上一帧的x
        this.oldY = null; // 上一帧的y

        // this.cache = {
        //     width: width,
        //     height: height,
        //     x: x,
        //     y: y,
        //     rectConfig: {
        //         fill: rectConfig.fill || true,
        //         color: rectConfig.color || '#000',
        //     },
        //     ballConfig: {
        //         speed: ballConfig.speed,
        //         angle: ballConfig.angle
        //     }
        // }

        // this._saveCache();
    }

    Ball.prototype = Object.create(Rect.prototype);
    Ball.prototype.constructor = Ball;

    // Ball.prototype._saveCache = function() {
    //     for (var key in this.cache) {
    //         this.cache[key] = deepClone(this.cache[key]);
    //     }
    // }

    // Ball.prototype.loadCache = function() {
    //     return new Ball(this.cache.width, this.cache.height, this.cache.x, this.cache.y);
    // }

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
        粒子
     */
    var Particle = function(width, height, x, y, particleConfig) {
        particleConfig ? particleConfig : particleConfig = {};

        if (particleConfig['baseSpeed'] && particleConfig['dSpeed']) {
            this.speed = particleConfig['baseSpeed'] + Math.random * particleConfig['dSpeed'];
        } else {
            this.speed = 300 / 60 + 400 / 60 * Math.random(); // 速度
        }
        this.angle = Math.random() * 2 * Math.PI; // 角度
        this.dx = this.speed * Math.cos(this.angle); // x轴分速度
        this.dy = this.speed * Math.sin(this.angle); // y轴分速度
        this.light = 60;

        var color = 'rgba(' + this.rgb() + ', ' + this.light / 60 + ')';

        Rect.call(this, width, height, x, y, {
            color: color
        });
    }

    Particle.prototype = Object.create(Rect.prototype);
    Particle.prototype.constructor = Particle;

    Particle.prototype.rgb = (function() {
        var rgbList = [
            '255, 246, 82',
            '255, 164, 36',
            '250, 60, 2'
        ]
        return function() {
            var index = Math.floor(Math.random() * rgbList.length);
            return rgbList[index];
        }
    })()

    // 重置粒子
    Particle.prototype.reset = function(x, y) {
        this.x = x;
        this.y = y;
        this.light = 60;

        return this;
    }

    // 光亮减弱
    Particle.prototype.fade = function() {
        this.light--;
    }

    // 修改光亮
    Particle.prototype.updateColor = function() {
        this.color = 'rgba(' + this.rgb() + ',' + this.light / 60 + ')';
    }

    /*
        通过map数组生成砖块对象数组
     */
    var brickListGenerator = function(map) {
        var brickList = [];
        map.forEach(function(item) {
            brickList.push(new _bind.apply(Brick, [null].concat(item))());
        });
        return brickList;
    }

    /*
        demo版游戏
     */
    var gameDemo = (function() {
        var canvas = document.querySelector('#canvas');
        var ctx = canvas.getContext('2d');

        var gameDemo = new Game();

        // 创建标题场景
        var titleStage = new TitleStage(canvas, ctx);

        // 创建游戏场景
        var gameStage = new GameStage(canvas, ctx);

        // 设置游戏场景数据
        var barData = [100, 20, 450, 500, {
            'color': '#8D00FF'
        }];
        gameStage.setBarData(barData);

        var ballData = [
            [10, 10, 450, 400, {
                'color': '#8D00FF'
            }]
        ];
        gameStage.setBallData(ballData);

        var brickData = [];
        for (var i = 5; i >= 0; i--) {
            for (var j = 3; j >= 0; j--) {
                brickData.push([40, 20, i * 100 + 30, j * 80 + 50, {
                    'color': '#7F7F7F'
                }]);
            }
        }
        gameStage.setBrickData(brickData);

        // 将场景添加进游戏
        var stageMap = {
            gameStage: gameStage,
            titleStage: titleStage
        };

        gameDemo.addStage(stageMap);
        gameDemo.setStage('gameStage');
        gameDemo.start();
    })();
})();