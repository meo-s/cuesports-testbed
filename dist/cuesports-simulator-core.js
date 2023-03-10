/**
 * CONSTANTS for SIMULATING
 */
constants = {
    ball: {
        radius: 6.4 / 1e+2 / 2,  // unit: m
        m: 0.5,  // unit: kg
    },

    board: {
        width: 2.54,  // unit: m
        height: 1.27,  // unit: m
    },

    dt: 1 / 120,
    rs: 4.0,  // render scale
    u: 0.7,    // 운동 마찰 계수
    g: 9.80665,  // unit: m/s^2
};

function log(msg) {
    console.log('[NojamSimulator] ' + msg);
}

class SimpleRenderer {
    constructor(canvas, renderScale) {
        this.canvas = canvas;
        this.setRenderScale(renderScale);
    }

    setRenderScale(renderScale) {
        this.canvas.width = Math.floor(constants.board.width * 1e+2 * renderScale);
        this.canvas.height = Math.floor(constants.board.height * 1e+2 * renderScale);

        /** @type {CanvasRenderingContext2D} */
        this.ctx = this.canvas.getContext('2d');
        /** @type {number} */
        this.renderScale = renderScale;
    }

    /**
     * @param {number} x 직사각형의 좌상단 X좌표
     * @param {number} y 직사각형의 좌상단 Y좌표
     * @param {number} w 직사삭형의 너비
     * @param {number} h 직사각형의 높이
     * @param {string} c 직사각형 색상
     */
    rect(x, y, w, h, c) {
        const rs = this.renderScale;
        x = Math.floor(x * rs);
        y = Math.floor(y * rs);
        w = Math.floor(w * rs);
        h = Math.floor(h * rs);
        this.ctx.fillStyle = c;
        this.ctx.fillRect(x, y, w, h);
    }

    /**
     * @param {number} x 원의 중심 x좌표
     * @param {number} y 원의 중심 y좌표
     * @param {number} r 원의 반경
     * @param {string} c 원 색상
     */
    circle(x, y, r, c) {
        const rs = this.renderScale;
        x = Math.floor(x * rs);
        y = Math.floor(y * rs);
        r = Math.floor(r * this.renderScale);
        this.ctx.fillStyle = c;
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, r, r, 0, 0, 360);
        this.ctx.fill();
        this.ctx.closePath();
    }

    line(x1, y1, x2, y2, c) {
        const rs = this.renderScale;
        x1 = Math.floor(x1 * rs);
        y1 = Math.floor(y1 * rs);
        x2 = Math.floor(x2 * rs);
        y2 = Math.floor(y2 * rs);
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = c;
        this.ctx.stroke();
        this.ctx.closePath();
    }
}

class RGB {
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    toString() {
        const r = this.r.toString(16).padStart(2, '0');
        const g = this.g.toString(16).padStart(2, '0');
        const b = this.b.toString(16).padStart(2, '0');
        return '#' + ''.concat(r, g, b);
    }
}

class Vec2 {
    /**
     * @param {number} x 
     * @param {number} y 
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    clone() {
        return new Vec2(this.x, this.y);
    }

    /** @returns {Vec2} */
    add(rhs) {
        return new Vec2(this.x + rhs.x, this.y + rhs.y);
    }

    /** @returns {Vec2} */
    add_(u) {
        this.x += u.x;
        this.y += u.y;
        return this;
    }

    /** @returns {Vec2} */
    sub(rhs) {
        return new Vec2(this.x - rhs.x, this.y - rhs.y);
    }

    /** @param {Vec2} rhs */
    sub_(rhs) {
        this.x -= rhs.x;
        this.y -= rhs.y;
        return this;
    }

    /** @param {number} scalar */
    scale(scalar) {
        return new Vec2(this.x * scalar, this.y * scalar);
    }

    /** @param {number} scalar */
    scale_(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    /** @returns {number} */
    dot(rhs) {
        return this.x * rhs.x + this.y * rhs.y;
    }

    /** @returns {Vec2} */
    turnCW_() {
        const x = this.x;
        this.x = this.y;
        this.y = -x;
        return this;
    }

    /** @returns {Vec2} */
    turnCCW_() {
        const x = this.x;
        this.x = -this.y;
        this.y = x;
        return this;
    }

    /** @returns {Vec2} */
    rotateCW() {
        return this.clone.turnCW_();
    }

    /** @returns {Vec2} */
    rotateCCW() {
        return this.clone().turnCCW_();
    }

    /** @returns {Vec2} */
    projectTo_(v) {
        const dp = this.dot(v);
        this.x = v.x * dp;
        this.y = v.y * dp;
        return this;
    }

    /** @returns {Vec2} */
    projectTo(v) {
        return this.clone().projectTo_(v);
    }

    /** @returns {number} */
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /** @returns {number} */
    lengthSq() {
        return this.x * this.x + this.y * this.y;
    }

    /** @returns {Vec2} */
    normalize() {
        return this.clone().normalize_();
    }

    /** @returns {Vec2} */
    normalize_() {
        const norm = this.length();
        if (norm != 0) {
            this.scale_(1 / norm);
        } else {
            this.x = 0;
            this.y = 0;
        }
        return this;
    }

    /** @returns {Vec2} */
    zero_() {
        this.x = 0
        this.y = 0
        return this;
    }

    /** @returns {string} */
    toString() {
        return `Vec2[${this.x}, ${this.y}]`;
    }
}

class MassPoint {
    /**
     * @param {number} x 질량점의 x좌표
     * @param {number} y 질량점의 y좌표
     * @param {number} m 질량점의 질량
     */
    constructor(x, y, m) {
        /** @type {Vec2} */
        this.p = new Vec2(x, y);
        /** @type {number} */
        this.m = m;
        /** @type {Vec2} */
        this.v = new Vec2(0, 0);
        /** @type {number} */
        this.s = 0;
        /** @type {Vec2} */
        this.appliedForce = new Vec2(0, 0);
    }

    /** @returns {Vec2} */
    getForce() {
        return this.appliedForce;
    }

    setForce(newForce) {
        this.appliedForce = newForce;
    }

    applyForce(f) {
        this.appliedForce.add_(f);
    }


    resetForce() {
        this.appliedForce.zero_();
    }

    /** @param {Vec2} newVelocity */
    setVelocity(newVelocity) {
        this.v = newVelocity;
    }
}

class Ball extends MassPoint {
    /**
     * @param {number} x 공의 x좌표
     * @param {number} y 공의 y좌표
     * @param {RGB} color 공의 색상
     * @param {number} m 공의 질량
     * @param {number} r 공의 반경
     */
    constructor(x, y, color, m, radius) {
        super(x, y, m || constants.ball.m);
        /** @type {number} */
        this.radius = radius || constants.ball.radius;
        /** @type {RGB} */
        this.color = color;
    }

    /** @param {SimpleRenderer} renderer */
    render(renderer) {
        renderer.circle(this.p.x * 100, this.p.y * 100, this.radius * 100, this.color);
    }

    isContacted(other) {
        const distX = this.p.x - other.p.x;
        const distY = this.p.y - other.p.y;
        const diameter = this.radius + other.radius;
        return distX * distX + distY * distY <= diameter * diameter;
    }
}

class CuesportsSimulator {
    constructor(canvas, renderScale) {
        /** @type {Ball[]} */
        this.balls = []
        /** @type {SimpleRenderer} */
        this.renderer = new SimpleRenderer(canvas, renderScale || constants.rs);
        /** @type {Array<(dt: number, balls: Ball[]) => void>} */
        this.updateHooks = [this._updateBalls.bind(this)];
        /** @type {Array<(renderer: SimpleRenderer, balls: Ball[]) => void>} */
        this.renderHooks = [this._renderBackground.bind(this), this._renderBalls.bind(this)];
    }

    _updateBalls(dt) {
        function resolveBoundaryCollision(ball) {
            if (ball.p.y < ball.radius) {
                ball.p.y = ball.radius;
                ball.v.y *= -1;
            }
            if (constants.board.height - ball.radius < ball.p.y) {
                ball.p.y = constants.board.height - ball.radius;
                ball.v.y *= -1;
            }
            if (ball.p.x < ball.radius) {
                ball.p.x = ball.radius;
                ball.v.x *= -1;
            }
            if (constants.board.width - ball.radius < ball.p.x) {
                ball.p.x = constants.board.width - ball.radius;
                ball.v.x *= -1;
            }
        }

        for (let i = 0; i < this.balls.length; ++i) {
            const ball = this.balls[i];
            const f = ball.getForce();

            const friction = ball.v.normalize().scale(constants.u * ball.m * constants.g);
            f.sub_(friction);

            const a = f.scale_(1 / ball.m);
            const v = ball.v;
            v.add_(a.scale_(dt));

            ball.p.x += v.x * dt;
            ball.p.y += v.y * dt;
            resolveBoundaryCollision(ball);

            if (ball.v.lengthSq() <= friction.scale(dt / ball.m).lengthSq()) {
                ball.v.zero_();
            }

            ball.resetForce();
        }

        // https://brownsoo.github.io/2DVectors/moving_balls/
        for (let i = 0; i < this.balls.length; ++i) {
            for (let j = i + 1; j < this.balls.length; ++j) {
                const bi = this.balls[i];
                const bj = this.balls[j];
                if (bi.isContacted(bj)) {
                    let vc = bi.p.sub(bj.p);
                    const dist = vc.length();
                    vc.normalize_().scale_(bi.radius + bj.radius - dist);
                    bi.p.add_(vc.scale(0.5));
                    bj.p.sub_(vc.scale(0.5));

                    vc = bi.p.sub(bj.p).normalize_();
                    const vc_ccw = vc.rotateCCW();
                    const proj_ii = bi.v.projectTo(vc);
                    const proj_ij = bi.v.projectTo(vc_ccw);
                    const proj_ji = bj.v.projectTo(vc);
                    const proj_jj = bj.v.projectTo(vc_ccw);

                    const px = bi.m * proj_ii.x + bj.m * proj_ji.x;
                    const vx = proj_ii.x - proj_ji.x;
                    const vx_j_f = (px + vx * bi.m) / (bi.m + bj.m);

                    const py = bi.m * proj_ii.y + bj.m * proj_ij.y;
                    const vy = proj_ii.y - proj_ji.y;
                    const vy_j_f = (py + vy * bi.m) / (bi.m + bj.m);

                    bi.v.x = proj_ij.x + (vx_j_f - vx);
                    bi.v.y = proj_ij.y + (vy_j_f - vy);
                    bj.v.x = proj_jj.x + vx_j_f;
                    bj.v.y = proj_jj.y + vy_j_f;
                }
            }
        }
    }

    _update(dt) {
        for (let i = 0; i < this.updateHooks.length; ++i) {
            this.updateHooks[i](dt, this.balls);
        }
    }

    _renderBackground() {
        this.renderer.rect(0, 0, constants.board.width * 1e+2, constants.board.height * 1e+2, '#00B159');
    }

    _renderBalls(renderer) {
        for (let i = 0; i < this.balls.length; ++i) {
            this.balls[i].render(renderer);
        }
    }

    _render() {
        for (let i = 0; i < this.renderHooks.length; ++i) {
            this.renderHooks[i](this.renderer, this.balls);
        }
    }

    _mainLogic() {
        this._update(constants.dt);
        this._render();
        self.requestAnimationFrame(this._mainLogic.bind(this));
    }

    registerUpdateHook(callback) {
        this.updateHooks.push(callback);
    }

    registerRenderHook(callback) {
        this.renderHooks.push(callback);
    }

    addBall(ball) {
        this.balls.push(ball);
    }

    run() {
        log("A simulator was successfully initialized.");
        this._mainLogic();
    }
}

unit = (function () {
    function cm(cm) {
        return cm / 100;
    }

    function m(m) {
        return m;
    }

    // m/s
    function mps(mps) {
        return mps;
    }

    // cm/s
    function cmps(cmps) {
        return cmps / 100;
    }

    return { cm, m, mps, cmps };
})();
