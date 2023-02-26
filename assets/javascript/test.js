// game object
let game = {
    status: 'off',
    getStatus: function() {
        return this.status;
    },
    physics: false,
    activeKeys: {},
    inputPIDs: [0, 0],
    canvas: {
        x: 1600 / 100.0,
        y: 900 / 100.0,
        convertX: function(pos) {
            return (pos / this.x).toString() + '%';
        },
        convertY: function(pos) {
            return (pos / this.y).toString() + '%';
        },
    },
    barriers: [],
    addBarrier: function(id, canCollide, top, right, bottom, left) {
        let barrier = {
            id: id,
            canCollide: canCollide,
            top: top,
            right: right,
            bottom: bottom,
            left: left,
        };
        let node = document.createElement('div');
        node.setAttribute('id', id);
        node.style.position = 'absolute';
        node.style.bottom = this.canvas.convertY(bottom);
        node.style.left = this.canvas.convertX(left);
        node.style.width = this.canvas.convertX(Math.abs(right - left));
        node.style.height = this.canvas.convertY(Math.abs(top - bottom));
        node.style.backgroundColor = 'gray';
        document.querySelector('#window').appendChild(node);
        this.barriers.push(barrier);
        return;
    },
    entities: [],
    addEntity: function(type, id, posX, posY, height, width) {
        let canvas = this.canvas;
        let newEntity = {
            id: '',
            pid: '',
            type: '',
            bounds: {
                hrad: 0.0,
                wrad: 0.0,
            },
            pos: {
                x: 0.0,
                y: 0.0,
            },
            vel: {
                x: 0.0,
                y: 0.0,
            },
            canvasObj: canvas,
            update: function() {
                document.documentElement.style.setProperty('--' + this.id + '-x', this.canvasObj.convertX(this.pos.x - this.bounds.wrad));
                document.documentElement.style.setProperty('--' + this.id + '-y', this.canvasObj.convertY(this.pos.y - this.bounds.hrad));
            },
            setSize: function(w, h) {
                this.bounds.hrad = h / 2.0;
                this.bounds.wrad = w / 2.0;
                document.documentElement.style.setProperty('--' + this.id + '-h', this.canvasObj.convertY(h))
                document.documentElement.style.setProperty('--' + this.id + '-w', this.canvasObj.convertX(w))
            }
        };
        newEntity.type = type;
        newEntity.id = id;
        newEntity.pos.x = posX;
        newEntity.pos.y = posY;
        newEntity.bounds.hrad = height / 2;
        newEntity.bounds.wrad = width / 2;
        document.documentElement.style.setProperty('--' + id + '-x', this.canvas.convertX(newEntity.pos.x - newEntity.bounds.wrad));
        document.documentElement.style.setProperty('--' + id + '-y', this.canvas.convertY(newEntity.pos.y - newEntity.bounds.hrad));
        document.documentElement.style.setProperty('--' + id + '-w', this.canvas.convertX(2 * newEntity.bounds.wrad));
        document.documentElement.style.setProperty('--' + id + '-h', this.canvas.convertY(2 * newEntity.bounds.hrad));
        let el = document.createElement('div');
        el.setAttribute('id', id);
        let entityCss = 'position: absolute; display: flex; justify-content: center; ' +
        'align-items: center; background-color: red; height: var(--' + id + '-h); ' +
        'width: var(--' + id + '-w); bottom: var(--' + id + '-y); left: var(--' + id + '-x); ';
        if (type == 'player') {
            el.setAttribute('style', entityCss + 'background-color: blue;');
        } else if (type == 'homer') {
            el.setAttribute('style', entityCss + 'background-color: red;');
        }
        document.querySelector('#window').appendChild(el);
        let that = this;
        newEntity.pid = setInterval(function() { that.physicsFrame(newEntity.id); }, this.settings.frameTime);
        this.entities.push(newEntity);
        return;
    },
    physicsFrame: function(id) {
        let entity = this.entities.find(ENT => ENT.id == id);
        let that = this;
        // resolve collisions
        function collisionTop(index) {
            entity.pos.y = that.barriers[index].bottom - entity.bounds.hrad;
            newY = entity.pos.y;
            entity.vel.y = 0.0;
        };
        function collisionRight(index) {
            entity.pos.x = that.barriers[index].left - entity.bounds.wrad;
            newX = entity.pos.x;
            entity.vel.x = 0.0;
        };
        function collisionBottom(index) {
            entity.pos.y = that.barriers[index].top + entity.bounds.hrad;
            newY = entity.pos.y;
            entity.vel.y = 0.0;
        };
        function collisionLeft(index) {
            entity.pos.x = that.barriers[index].right + entity.bounds.wrad;
            newX = entity.pos.x;
            entity.vel.x = 0.0;
        };
        // if physics is turned on
        if (this.physics) {
            // apply acceleration
            if (entity.type == 'player') {
                let acc = 750;
                if (this.activeKeys.KeyW) {
                    entity.vel.y += acc * 2 * (this.settings.frameTime / 1000.0);
                }
                if (this.activeKeys.KeyA) {
                    entity.vel.x -= acc * 2 * (this.settings.frameTime / 1000.0);
                }
                if (this.activeKeys.KeyS) {
                    entity.vel.y -= acc * 2 * (this.settings.frameTime / 1000.0);
                }
                if (this.activeKeys.KeyD) {
                    entity.vel.x += acc * 2 * (this.settings.frameTime / 1000.0);
                }
                if (this.activeKeys.ShiftLeft) {
                    entity.vel.x = 0;
                    entity.vel.y = 0;
                }
            } else if (entity.type == 'homer') {
                let xdif = (this.entities.find(ENT => ENT.id == 'player1').pos.x - entity.pos.x);
                let ydif = (this.entities.find(ENT => ENT.id == 'player1').pos.y - entity.pos.y);
                let gravBottom = Math.pow(Math.abs(xdif) + Math.abs(ydif) + 1, 1.5);
                let k = 500;
                entity.vel.x += k * xdif / gravBottom;
                entity.vel.y += k * ydif / gravBottom;
            }
            // generate next frame for analysis
            newX = entity.pos.x + (entity.vel.x * (this.settings.frameTime / 1000.0));
            newY = entity.pos.y + (entity.vel.y * (this.settings.frameTime / 1000.0));
            // get new player bounds
            pTop = newY + entity.bounds.hrad;
            pRight = newX + entity.bounds.wrad;
            pBottom = newY - entity.bounds.hrad;
            pLeft = newX - entity.bounds.wrad;
            // check for entity-barrier collisions
            for (let i in this.barriers) {
                let canCollide = false;
                for (let ii in this.barriers[i].canCollide) {
                    if (entity.type == this.barriers[i].canCollide[ii]) {
                        canCollide = true;
                        break;
                    }
                }
                if (canCollide) {
                    // check each side for 'collision'
                    let collideTop = false;
                    let collideRight = false;
                    let collideBottom = false;
                    let collideLeft = false;
                    let collisions = 0;
                    if ((pTop > this.barriers[i].bottom) && (pTop < this.barriers[i].top)) {
                        collideTop = true;
                        collisions++;
                    }
                    if ((pRight > this.barriers[i].left) && (pRight < this.barriers[i].right)) {
                        collideRight = true;
                        collisions++;
                    }
                    if ((pBottom > this.barriers[i].bottom) && (pBottom < this.barriers[i].top)) {
                        collideBottom = true;
                        collisions++;
                    }
                    if ((pLeft > this.barriers[i].left) && (pLeft < this.barriers[i].right)) {
                        collideLeft = true;
                        collisions++;
                    }
                    if (collisions == 4) {
                        // 4 'collisions', player is completely inside hitbox
                        let distances = [
                            pTop - this.barriers[i].bottom,
                            pRight - this.barriers[i].left,
                            this.barriers[i].top - pBottom,
                            this.barriers[i].right - pLeft,
                        ];
                        let besti = 0;
                        for (let ii in distances) {
                            if (distances[ii] < distances[besti]) {
                                besti = ii;
                            }
                        }
                        if (besti = 0) {
                            collisionTop(i);
                        } else if (besti = 1) {
                            collisionRight(i);
                        } else if (besti = 2) {
                            collisionBottom(i);
                        } else if (besti = 3) {
                            collisionLeft(i);
                        }
                    } else if (collisions == 3) {
                        // 3 'collisions', player is touching one side of hitbox
                        if (!collideBottom) {
                            collisionTop(i);
                        } else if (!collideLeft) {
                            collisionRight(i);
                        } else if (!collideTop) {
                            collisionBottom(i);
                        } else if (!collideRight) {
                            collisionLeft(i);
                        }
                    } else if ((collisions == 2) && (!collideTop || !collideBottom) && (!collideLeft || !collideRight)) {
                        // 2 'collisions', player is touching corner of hitbox
                        if (collideTop && collideRight) {
                            if ((pTop - this.barriers[i].bottom) < (pRight - this.barriers[i].left)) {
                                collisionTop(i);
                            } else {
                                collisionRight(i);
                            }
                        } else if (collideBottom && collideRight) {
                            if ((this.barriers[i].top - pBottom) < (pRight - this.barriers[i].left)) {
                                collisionBottom(i);
                            } else {
                                collisionRight(i);
                            }
                        } else if (collideBottom && collideLeft) {
                            if ((this.barriers[i].top - pBottom) < (this.barriers[i].right - pLeft)) {
                                collisionBottom(i);
                            } else {
                                collisionLeft(i);
                            }
                        } else if (collideTop && collideLeft) {
                            if ((pTop - this.barriers[i].bottom) < (this.barriers[i].right - pLeft)) {
                                collisionTop(i);
                            } else {
                                collisionLeft(i);
                            }
                        }
                    }
                }
            }
            // check for entity-entity collisions
            if (entity.type == 'player') {
                pTop = newY + entity.bounds.hrad;
                pRight = newX + entity.bounds.wrad;
                pBottom = newY - entity.bounds.hrad;
                pLeft = newX - entity.bounds.wrad;
                for (let i in this.entities) {
                    eTop = this.entities[i].pos.y + this.entities[i].bounds.hrad;
                    eRight = this.entities[i].pos.x + this.entities[i].bounds.wrad;
                    eBottom = this.entities[i].pos.y - this.entities[i].bounds.hrad;
                    eLeft = this.entities[i].pos.x - this.entities[i].bounds.wrad;
                    if (this.entities[i].type == 'homer') {
                        let collideTop = false;
                        let collideRight = false;
                        let collideBottom = false;
                        let collideLeft = false;
                        let collisions = 0;
                        if ((pTop > eBottom) && (pTop < eTop)) {
                            collideTop = true;
                            collisions++;
                        }
                        if ((pRight > eLeft) && (pRight < eRight)) {
                            collideRight = true;
                            collisions++;
                        }
                        if ((pBottom > eBottom) && (pBottom < eTop)) {
                            collideBottom = true;
                            collisions++;
                        }
                        if ((pLeft > eLeft) && (pLeft < eRight)) {
                            collideLeft = true;
                            collisions++;
                        }
                        if ((collisions >= 3) || ((collisions == 2) && (!collideTop || !collideBottom) && (!collideLeft || !collideRight))) {
                            // collision
                        }
                    }
                }
            }
            entity.pos.x = newX;
            entity.pos.y = newY;
        }
        this.entities.find(IND => IND.id == id).update();
    },
    initialize: function() {
        let that = this;
        document.addEventListener('keydown', function(event) {
            that.activeKeys[event.code] = true;
        });
        document.addEventListener('keyup', function(event) {
            that.activeKeys[event.code] = false;
        });
        document.querySelector('#main-menu-continue').addEventListener('click', function() {
            let savesPanel = document.querySelector('#main-menu-saves-panel');
            let settingsPanel = document.querySelector('#main-menu-settings-panel');
            if (savesPanel.getAttribute('style') == 'display: none') {
                savesPanel.setAttribute('style', 'display: block');
                settingsPanel.setAttribute('style', 'display: none');
            } else if (savesPanel.getAttribute('style') == 'display: block') {
                savesPanel.setAttribute('style', 'display: none');
            }
        });
        document.querySelector('#main-menu-start-new').addEventListener('click', function() {
            let savesPanel = document.querySelector('#main-menu-saves-panel');
            let settingsPanel = document.querySelector('#main-menu-settings-panel');
            savesPanel.setAttribute('style', 'display: none');
            settingsPanel.setAttribute('style', 'display: none');
            that.delScreen();
            that.loadScreen(1);
        });
        document.querySelector('#main-menu-settings').addEventListener('click', function() {
            let savesPanel = document.querySelector('#main-menu-saves-panel');
            let settingsPanel = document.querySelector('#main-menu-settings-panel');
            if (settingsPanel.getAttribute('style') == 'display: none') {
                settingsPanel.setAttribute('style', 'display: block');
                savesPanel.setAttribute('style', 'display: none');
            } else if (settingsPanel.getAttribute('style') == 'display: block') {
                settingsPanel.setAttribute('style', 'display: none');
            }
        });
        document.querySelector('#main-menu-quit').addEventListener('click', function() {
            let savesPanel = document.querySelector('#main-menu-saves-panel');
            let settingsPanel = document.querySelector('#main-menu-settings-panel');
            savesPanel.setAttribute('style', 'display: none');
            settingsPanel.setAttribute('style', 'display: none');
            that.shutdown();
        });
        this.status = 'main-menu';
        this.delScreen = this.mainMenu();
    },
    resume: function() {
        // resume physics
    },
    pause: function() {
        // pause physics
    },
    loadScreen: function(level) {
        level -= 1;
        if (level < this.levels.length) {
            this.unloadScreen();
            this.levels[level].load(this);
        } else {
            // go to end screen
        }
    },
    unloadScreen: function() {
        // unload level
    },
    delScreen: function() {
        // LEAVE THIS EMPTY
    },
    endscreen: function() {
        // summary of level completion
    },
    pauseMenu: function() {
        // pause menu
    },
    mainMenu: function() {
        document.querySelector('#main-menu').setAttribute('style', 'display: block');
        return function() {
            document.querySelector('#main-menu').setAttribute('style', 'display: none');
        };
    },
    shutdown: function() {
        this.status = 'off';
        this.delScreen();
        return;
    },
    settings: {
        frameTime: 15.0,
    },
    levels: [
        level1 = {
            load: function(that) {
                that.addEntity('player', 'player1', 25, 25, 50, 50);
                that.addEntity('homer', 'homer1', 25, 25, 50, 50);
                that.addBarrier('map-edge-t', ['player', 'homer'], 1100, 1800, 900, 0);
                that.addBarrier('map-edge-r', ['player', 'homer'], 900, 1800, -200, 1600);
                that.addBarrier('map-edge-b', ['player', 'homer'], 0, 1600, -200, -200);
                that.addBarrier('map-edge-l', ['player', 'homer'], 1100, 0, 0, -200);
            },
        },
    ],
};

game.initialize();

// game.addEntity('player', 'player1', 25, 25, 50, 50);
// game.addEntity('homer', 'homer1', 25, 25, 50, 50);

// game.addBarrier('map-edge-t', ['player', 'homer'], 1100, 1800, 900, 0);
// game.addBarrier('map-edge-r', ['player', 'homer'], 900, 1800, -200, 1600);
// game.addBarrier('map-edge-b', ['player', 'homer'], 0, 1600, -200, -200);
// game.addBarrier('map-edge-l', ['player', 'homer'], 1100, 0, 0, -200);

// add barrier types