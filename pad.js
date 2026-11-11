// モンスターラッシュ スマホ用操作
// 左側をなぞると仮想スティック、右下の「攻撃」ボタンで攻撃。
// Unity 側の GameManager に SendMessage で伝える。
(function () {
  'use strict';
  const UNITY_OBJECT = 'GameManager';
  const isTouch = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 && !window.matchMedia('(pointer: fine)').matches;
  const RADIUS = 56; // スティックが最大になるまでの距離(px)

  function toUnity(method, arg) {
    if (window.unityInstance) window.unityInstance.SendMessage(UNITY_OBJECT, method, arg);
  }

  let stickId = null, cx = 0, cy = 0, lastSent = '';
  let stick, knob;

  function sendStick(x, y) {
    const s = x.toFixed(2) + ',' + y.toFixed(2);
    if (s === lastSent) return;
    lastSent = s;
    toUnity('OnVirtualStick', s);
  }

  function resetStick() {
    stickId = null;
    stick.classList.remove('on');
    stick.style.left = ''; stick.style.top = '';
    knob.style.transform = '';
    sendStick(0, 0);
  }

  function setupStick() {
    const zone = document.getElementById('zone');
    stick = document.getElementById('stick');
    knob = document.getElementById('knob');

    zone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (stickId !== null) return;
      stickId = e.pointerId;
      try { zone.setPointerCapture(e.pointerId); } catch (x) {}
      cx = e.clientX; cy = e.clientY;
      stick.style.left = cx + 'px'; stick.style.top = cy + 'px';
      stick.classList.add('on');
      knob.style.transform = '';
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== stickId) return;
      e.preventDefault();
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const len = Math.hypot(dx, dy);
      if (len > RADIUS) { dx *= RADIUS / len; dy *= RADIUS / len; }
      knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      let x = dx / RADIUS, y = -dy / RADIUS;
      if (Math.hypot(x, y) < 0.15) { x = 0; y = 0; } // 遊び
      sendStick(x, y);
    });
    const end = (e) => { if (e.pointerId === stickId) resetStick(); };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
    zone.addEventListener('lostpointercapture', end);
  }

  function setupAttack() {
    const btn = document.getElementById('atk');
    let active = null;
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (active !== null) return;
      active = e.pointerId;
      try { btn.setPointerCapture(e.pointerId); } catch (x) {}
      btn.classList.add('on');
      toUnity('OnVirtualKey', 'attack,1');
      if (navigator.vibrate) navigator.vibrate(10);
    });
    const up = (e) => {
      if (active === null || e.pointerId !== active) return;
      active = null;
      btn.classList.remove('on');
    };
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('lostpointercapture', up);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  window.MonsterRushPad = {
    onUnityReady() {
      if (isTouch) toUnity('OnTouchDevice', '1');
    },
    // Unity から: プレイ中だけ操作を表示
    setVisible(v) {
      document.body.classList.toggle('pad-off', !v);
      if (!v && stick) resetStick();
    },
  };

  window.addEventListener('DOMContentLoaded', () => {
    if (!isTouch) return;
    document.body.classList.add('touch');
    setupStick();
    setupAttack();
    document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('dblclick', (e) => e.preventDefault());
  });
})();
