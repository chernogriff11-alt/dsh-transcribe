window.__ModuleLoader__.load({
  id: 'dsh-transcribe',
  factory(require) {
    var React = require('react');
    var ReactDOM = require('react-dom');
    var h = React.createElement;

    //#region styles
    var CSS = [
      '.dstr-btn{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9px;',
      'border:1px solid transparent;background:transparent;color:var(--dsw-color-text-secondary,#9a9aa5);cursor:pointer;',
      'transition:background .16s ease,color .16s ease,box-shadow .16s ease;padding:0;flex:0 0 auto}',
      '.dstr-btn:hover{background:rgba(127,127,127,.14);color:var(--dsw-color-text,#ececf1)}',
      '.dstr-btn.is-rec{color:#fff;background:var(--dsw-color-danger,#e5484d);animation:dstr-pulse 1.5s ease-out infinite}',
      '@keyframes dstr-pulse{0%{box-shadow:0 0 0 0 rgba(229,72,77,.5)}70%{box-shadow:0 0 0 8px rgba(229,72,77,0)}100%{box-shadow:0 0 0 0 rgba(229,72,77,0)}}',
      '.dstr-ear.is-live{color:#fff;background:var(--dsw-color-accent,#5b8cff)}',
      '.dstr-ear.is-live:hover{background:var(--dsw-color-accent,#5b8cff);color:#fff;filter:brightness(1.1)}',
      '.dstr-tool:disabled{opacity:.4;cursor:default;background:transparent;color:var(--dsw-color-text-secondary,#9a9aa5)}',
      '.dstr-tool.is-busy{color:var(--dsw-color-accent,#5b8cff)}',
      '.dstr-toast{position:fixed;right:18px;bottom:18px;z-index:70;max-width:320px;padding:9px 14px;border-radius:10px;',
      'font-size:12.5px;line-height:1.35;color:var(--dsw-color-text,#ececf1);background:var(--dsw-color-bg-elevated,#17171b);',
      'border:1px solid var(--dsw-color-border,rgba(255,255,255,.12));box-shadow:0 10px 30px rgba(0,0,0,.4);',
      'animation:dstr-toast-in .18s ease-out}',
      '@keyframes dstr-toast-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',
      '.dstr-toast[data-tone="ok"]{border-color:rgba(46,160,67,.55)}',
      '.dstr-toast[data-tone="err"]{border-color:rgba(229,72,77,.55)}',
      '.dstr-toast[data-tone="muted"]{color:var(--dsw-color-text-secondary,#9a9aa5)}',
      '.dstr-pop input:disabled{opacity:.45;cursor:not-allowed}',
      '.dstr-panel{position:fixed;left:50%;transform:translateX(-50%);bottom:132px;width:min(640px,92vw);z-index:80;',
      'box-sizing:border-box;border-radius:18px;padding:16px 18px 14px;color:var(--dsw-color-text,#ececf1);font-family:inherit;',
      'background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.012)),var(--dsw-color-bg-elevated,#17171b);',
      'border:1px solid var(--dsw-color-border,rgba(255,255,255,.1));',
      'box-shadow:0 24px 64px rgba(0,0,0,.5),0 2px 8px rgba(0,0,0,.3);backdrop-filter:blur(18px) saturate(1.2)}',
      '.dstr-panel[data-recording="true"]{border-color:rgba(229,72,77,.34);',
      'box-shadow:0 24px 64px rgba(0,0,0,.5),0 0 0 1px rgba(229,72,77,.16),0 0 44px rgba(229,72,77,.12)}',
      '.dstr-head{display:flex;align-items:center;gap:10px;margin-bottom:12px}',
      '.dstr-pill{display:inline-flex;align-items:center;gap:7px;padding:4px 10px;border-radius:999px;',
      'background:rgba(229,72,77,.12);color:var(--dsw-color-danger,#e5484d);font-size:10.5px;font-weight:600;',
      'letter-spacing:.08em;text-transform:uppercase}',
      '.dstr-pill[data-tone="busy"]{background:rgba(91,140,255,.12);color:var(--dsw-color-accent,#5b8cff)}',
      '.dstr-dot{width:7px;height:7px;border-radius:50%;background:currentColor;animation:dstr-blink 1.1s ease-in-out infinite}',
      '@keyframes dstr-blink{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.75)}}',
      '.dstr-time{margin-left:auto;font-variant-numeric:tabular-nums;font-size:13px;color:var(--dsw-color-text-secondary,#9a9aa5)}',
      '.dstr-gear{width:24px;height:24px;border-radius:7px;border:0;background:transparent;padding:0;cursor:pointer;',
      'color:var(--dsw-color-text-tertiary,#6b6b76);font-size:14px;line-height:1}',
      '.dstr-gear:hover{background:rgba(127,127,127,.14);color:var(--dsw-color-text,#ececf1)}',
      // Anchored above the panel: below it there is only the composer, and the
      // popover used to fall out of the window.
      '.dstr-pop{position:absolute;bottom:calc(100% + 10px);top:auto;right:14px;width:300px;padding:12px;',
      'border-radius:12px;z-index:3;max-height:max(240px,calc(100vh - 360px));overflow:auto;box-sizing:border-box;',
      'background:var(--dsw-color-bg-elevated,#1b1b1f);border:1px solid var(--dsw-color-border,rgba(255,255,255,.12));',
      'box-shadow:0 16px 40px rgba(0,0,0,.45)}',
      '.dstr-pop label{display:flex;align-items:center;gap:8px;font-size:12.5px;margin-bottom:8px;cursor:pointer}',
      '.dstr-pop .dstr-field{display:block;font-size:11.5px;color:var(--dsw-color-text-tertiary,#6b6b76);',
      'margin:10px 0 4px;cursor:default}',
      '.dstr-pop .dstr-sep{height:1px;margin:12px 0;background:var(--dsw-color-border,rgba(255,255,255,.1))}',
      '.dstr-pop input[type="text"]{width:100%;box-sizing:border-box;height:30px;border-radius:8px;padding:0 9px;',
      'border:1px solid var(--dsw-color-border,rgba(255,255,255,.14));background:rgba(255,255,255,.04);',
      'color:var(--dsw-color-text,#ececf1);font:inherit;font-size:13px;outline:none}',
      '.dstr-pop input[type="text"]:focus{border-color:var(--dsw-color-accent,#5b8cff)}',
      '.dstr-pop .dstr-hint{display:block;margin:8px 0 10px;white-space:normal;line-height:1.4}',
      '.dstr-pop .dstr-schemes{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 4px}',
      '.dstr-pop .dstr-scheme{border:1px solid var(--dsw-color-border,rgba(255,255,255,.14));'
        + 'background:transparent;color:inherit;font:inherit;font-size:12px;padding:5px 9px;'
        + 'border-radius:999px;cursor:pointer;transition:border-color .12s,background .12s}',
      '.dstr-pop .dstr-scheme:hover{border-color:var(--dsw-color-accent,#5b8cff)}',
      '.dstr-pop .dstr-scheme[data-active="true"]{border-color:var(--dsw-color-accent,#5b8cff);'
        + 'background:color-mix(in srgb,var(--dsw-color-accent,#5b8cff) 18%,transparent)}',
      '.dstr-pop input[type="range"]{width:100%;margin:2px 0 6px;accent-color:var(--dsw-color-accent,#5b8cff)}',
      '.dstr-wave{display:flex;align-items:center;gap:2px;height:38px;margin:2px 0 12px;width:100%;',
      'opacity:calc(.8 + var(--lvl,0) * .2);transition:opacity .15s linear;',
      'filter:drop-shadow(0 0 7px rgba(91,140,255,.22))}',
      '.dstr-wave i{flex:1 1 0;min-width:2px;height:100%;border-radius:2px;transform-origin:center;',
      'background:linear-gradient(180deg,#7aa2ff,rgba(91,140,255,.18));',
      'transform:scaleY(.05);opacity:.3;will-change:transform,opacity}',
      '.dstr-strip{display:flex;align-items:center;gap:6px;min-height:24px;font-size:14.5px;line-height:1.5;',
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.dstr-strip[data-empty="true"]{color:var(--dsw-color-text-tertiary,#6b6b76)}',
      '.dstr-caret{display:inline-block;width:1px;height:15px;background:var(--dsw-color-accent,#5b8cff);',
      'animation:dstr-caret 1s step-end infinite;flex:0 0 auto}',
      '@keyframes dstr-caret{50%{opacity:0}}',
      '.dstr-foot{display:flex;align-items:center;gap:8px;margin-top:14px;flex-wrap:wrap}',
      '.dstr-seg{display:inline-flex;padding:2px;border-radius:9px;background:rgba(127,127,127,.12);gap:2px}',
      '.dstr-seg-btn{border:0;background:transparent;color:var(--dsw-color-text-secondary,#9a9aa5);font:inherit;',
      'font-size:11.5px;padding:4px 9px;border-radius:7px;cursor:pointer}',
      '.dstr-seg-btn[data-active="true"]{background:var(--dsw-color-bg-elevated,#17171b);',
      'color:var(--dsw-color-text,#ececf1);box-shadow:0 1px 3px rgba(0,0,0,.35)}',
      '.dstr-key{font:inherit;font-size:11.5px;padding:5px 9px;border-radius:8px;cursor:pointer;',
      'border:1px solid var(--dsw-color-border,rgba(255,255,255,.12));background:rgba(255,255,255,.04);',
      'color:var(--dsw-color-text-secondary,#9a9aa5);font-family:ui-monospace,SFMono-Regular,Menlo,monospace}',
      '.dstr-key:hover{border-color:var(--dsw-color-accent,#5b8cff);color:var(--dsw-color-text,#ececf1)}',
      '.dstr-key[data-capturing="true"]{border-color:var(--dsw-color-accent,#5b8cff);color:var(--dsw-color-accent,#5b8cff);',
      'animation:dstr-blink 1.2s ease-in-out infinite}',
      '.dstr-hint{font-size:11.5px;color:var(--dsw-color-text-tertiary,#6b6b76);margin-right:auto;',
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.dstr-act{height:32px;padding:0 14px;border-radius:9px;font:inherit;font-size:13px;cursor:pointer;',
      'border:1px solid var(--dsw-color-border,rgba(255,255,255,.14));background:transparent;color:inherit}',
      '.dstr-act:hover{background:rgba(127,127,127,.14)}',
      '.dstr-act.primary{background:var(--dsw-color-accent,#5b8cff);border-color:transparent;color:#fff}',
      '.dstr-act.primary:hover{filter:brightness(1.08)}',
      '.dstr-spin{width:13px;height:13px;border-radius:50%;border:2px solid rgba(127,127,127,.3);',
      'border-top-color:var(--dsw-color-accent,#5b8cff);animation:dstr-rot .8s linear infinite;flex:0 0 auto}',
      '@keyframes dstr-rot{to{transform:rotate(360deg)}}',
      '.dstr-err{color:var(--dsw-color-danger,#e5484d)}',
    ].join('');
    function ensureStyle() {
      try {
        if (document.getElementById('dstr-style')) return;
        var s = document.createElement('style');
        s.id = 'dstr-style';
        s.textContent = CSS;
        (document.head || document.documentElement).appendChild(s);
      } catch (err) { /* ignore */ }
    }
    //#endregion

    //#region capture
    var WORKLET = [
      'class DstrMic extends AudioWorkletProcessor {',
      '  constructor(){ super(); this.buf = new Float32Array(0); this.ratio = sampleRate / 16000; }',
      '  process(inputs){',
      '    const ch = inputs[0] && inputs[0][0];',
      '    if (!ch || !ch.length) return true;',
      '    const merged = new Float32Array(this.buf.length + ch.length);',
      '    merged.set(this.buf); merged.set(ch, this.buf.length); this.buf = merged;',
      '    const outLen = Math.floor(this.buf.length / this.ratio);',
      '    if (outLen < 320) return true;',
      '    const pcm = new Int16Array(outLen);',
      '    let sum = 0;',
      '    for (let i = 0; i < outLen; i++) {',
      '      const pos = i * this.ratio;',
      '      const i0 = Math.floor(pos);',
      '      const i1 = Math.min(i0 + 1, this.buf.length - 1);',
      '      const frac = pos - i0;',
      '      let v = this.buf[i0] * (1 - frac) + this.buf[i1] * frac;',
      '      sum += v * v;',
      '      v = v < -1 ? -1 : (v > 1 ? 1 : v);',
      '      pcm[i] = v < 0 ? v * 0x8000 : v * 0x7fff;',
      '    }',
      '    this.buf = this.buf.slice(Math.floor(outLen * this.ratio));',
      '    const rms = Math.sqrt(sum / outLen);',
      '    this.port.postMessage({ pcm: pcm.buffer, rms: rms }, [pcm.buffer]);',
      '    return true;',
      '  }',
      '}',
      "registerProcessor('dstr-mic', DstrMic);",
    ].join('\n');

    function Recorder(onFrame, onError) {
      this.onFrame = onFrame;
      this.onError = onError;
      this.closed = false;
    }
    Recorder.prototype.start = function start() {
      var self = this;
      var url = null;
      // Любой сбой после getUserMedia (CSP на blob:, старый WebView, отказ
      // audioWorklet) обязан освободить микрофон, иначе индикатор записи висит
      // до перезагрузки страницы.
      function release() {
        if (url) { try { URL.revokeObjectURL(url); } catch (err) {} url = null; }
        try { if (self.source) self.source.disconnect(); } catch (err) {}
        try { if (self.node) self.node.disconnect(); } catch (err) {}
        try { if (self.stream) self.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (err) {}
        try { if (self.ctx) self.ctx.close(); } catch (err) {}
      }
      return navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      }).then(function (stream) {
        self.stream = stream;
        var Ctx = window.AudioContext || window.webkitAudioContext;
        try { self.ctx = new Ctx({ sampleRate: 16000, latencyHint: 'interactive' }); }
        catch (err) { self.ctx = new Ctx({ latencyHint: 'interactive' }); }
        url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }));
        return self.ctx.audioWorklet.addModule(url).then(function () {
          try { URL.revokeObjectURL(url); } catch (err) {}
          url = null;
          if (self.closed) { release(); return; }
          var source = self.ctx.createMediaStreamSource(stream);
          var analyser = self.ctx.createAnalyser();
          analyser.fftSize = 512;
          analyser.smoothingTimeConstant = 0.5;
          source.connect(analyser);
          // Keep the graph pulled without playing the microphone back.
          var mute = self.ctx.createGain();
          mute.gain.value = 0;
          analyser.connect(mute);
          mute.connect(self.ctx.destination);
          self.analyser = analyser;
          self.sampleRate = self.ctx.sampleRate || 16000;
          var node = new AudioWorkletNode(self.ctx, 'dstr-mic', {
            numberOfInputs: 1, numberOfOutputs: 1, channelCount: 1,
          });
          node.port.onmessage = function (event) {
            if (self.closed) return;
            var data = event.data;
            self.onFrame(new Uint8Array(data.pcm), data.rms);
          };
          source.connect(node);
          self.source = source;
          self.node = node;
        });
      }).catch(function (err) {
        release();
        self.onError(err);
        throw err;
      });
    };
    Recorder.prototype.stop = function stop() {
      this.closed = true;
      try { if (this.node) this.node.port.onmessage = null; } catch (err) {}
      try { if (this.source) this.source.disconnect(); } catch (err) {}
      try { if (this.node) this.node.disconnect(); } catch (err) {}
      try { if (this.stream) this.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (err) {}
      try { if (this.ctx) this.ctx.close(); } catch (err) {}
      return Promise.resolve();
    };
    //#endregion

    //#region wake
    var DEFAULT_WAKE = { enabled: false, phrase: 'окей дипсик', pauseMs: 1400 };
    /** 16 кГц моно 16 бит × 600 с — десять минут диктовки в одном запросе. */
    var MAX_RECORD_BYTES = 16000 * 2 * 600;

    function loadWake() {
      try {
        var raw = window.localStorage.getItem('dstr.wake');
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && typeof parsed.phrase === 'string') {
            var pause = Number(parsed.pauseMs);
            // 0 means "never stop on a pause" — the user may be thinking.
            var validPause = pause === 0 || (pause >= 300 && pause <= 15000);
            return {
              enabled: parsed.enabled === true,
              phrase: parsed.phrase,
              pauseMs: validPause ? pause : DEFAULT_WAKE.pauseMs,
            };
          }
        }
      } catch (err) { /* ignore */ }
      return { enabled: DEFAULT_WAKE.enabled, phrase: DEFAULT_WAKE.phrase, pauseMs: DEFAULT_WAKE.pauseMs };
    }
    function saveWake(value) {
      try { window.localStorage.setItem('dstr.wake', JSON.stringify(value)); } catch (err) { /* ignore */ }
    }

    /**
     * Energy gate. `slow` tracks the room: it falls fast and rises slowly, so
     * the threshold calibrates itself instead of trusting a fixed value, which
     * a microphone with automatic gain control would break.
     */
    function LevelTracker() {
      this.slow = 0.01;
      this.silenceMs = 0;
      this.voiceMs = 0;
    }
    LevelTracker.prototype.feed = function (rms, durMs) {
      if (rms < this.slow) this.slow = this.slow * 0.9 + rms * 0.1;
      else this.slow = this.slow * 0.999 + rms * 0.001;
      var loud = rms > Math.max(0.008, this.slow * 2.2);
      if (loud) {
        this.silenceMs = 0;
        this.voiceMs += durMs;
      } else {
        this.silenceMs += durMs;
        this.voiceMs = Math.max(0, this.voiceMs - durMs * 0.5);
      }
      return loud;
    };

    /**
     * Cuts the microphone stream into utterances: 70 ms of voice opens a
     * segment, 350 ms of silence closes it. A short ring buffer keeps the audio
     * from before the trigger, so a wake phrase is not lost when the recording
     * takes over.
     */
    function WakeEngine() {
      this.frames = [];
      this.bytes = 0;
      this.tracker = new LevelTracker();
      this.speaking = false;
      this.segStart = 0;
      this.lastVoice = 0;
      this.maxBytes = 16000 * 2 * 12;
    }
    WakeEngine.prototype.reset = function () {
      this.frames = [];
      this.bytes = 0;
      this.tracker = new LevelTracker();
      this.speaking = false;
      this.segStart = 0;
      this.lastVoice = 0;
    };
    WakeEngine.prototype.push = function (pcm) {
      var now = performance.now();
      var dur = (pcm.byteLength / 2 / 16000) * 1000;
      this.frames.push({ pcm: pcm, t0: now - dur, t1: now });
      this.bytes += pcm.byteLength;
      while (this.bytes > this.maxBytes && this.frames.length > 1) {
        this.bytes -= this.frames.shift().pcm.byteLength;
      }
    };
    WakeEngine.prototype.slice = function (from, to) {
      var parts = [];
      var total = 0;
      for (var i = 0; i < this.frames.length; i++) {
        var frame = this.frames[i];
        if (frame.t1 <= from || frame.t0 >= to) continue;
        parts.push(frame.pcm);
        total += frame.pcm.byteLength;
      }
      if (!total) return null;
      var out = new Uint8Array(total);
      var pos = 0;
      for (var j = 0; j < parts.length; j++) {
        out.set(parts[j], pos);
        pos += parts[j].byteLength;
      }
      return out;
    };
    /** Returns { pcm, start } when an utterance just ended, otherwise null. */
    WakeEngine.prototype.feed = function (pcm, rms) {
      this.push(pcm);
      var dur = (pcm.byteLength / 2 / 16000) * 1000;
      var loud = this.tracker.feed(rms, dur);
      var now = performance.now();
      if (!this.speaking) {
        if (this.tracker.voiceMs >= 70) {
          this.speaking = true;
          this.segStart = now - this.tracker.voiceMs - 250;
          this.lastVoice = now;
        }
        return null;
      }
      if (loud) this.lastVoice = now;
      if (this.tracker.silenceMs >= 350) {
        var start = this.segStart;
        var pcmOut = this.slice(start, this.lastVoice + 120);
        this.speaking = false;
        this.tracker.voiceMs = 0;
        this.tracker.silenceMs = 0;
        return pcmOut ? { pcm: pcmOut, start: start } : null;
      }
      if (now - this.segStart > 8000) {
        this.speaking = false;
        this.tracker.voiceMs = 0;
        this.tracker.silenceMs = 0;
      }
      return null;
    };

    function editDistance(a, b) {
      if (a === b) return 0;
      if (!a.length) return b.length;
      if (!b.length) return a.length;
      var prev = [];
      var cur = [];
      for (var j = 0; j <= b.length; j++) prev[j] = j;
      for (var i = 1; i <= a.length; i++) {
        cur[0] = i;
        for (var k = 1; k <= b.length; k++) {
          var cost = a[i - 1] === b[k - 1] ? 0 : 1;
          cur[k] = Math.min(prev[k] + 1, cur[k - 1] + 1, prev[k - 1] + cost);
        }
        var swap = prev;
        prev = cur;
        cur = swap;
      }
      return prev[b.length];
    }

    /** Как на хосте: перед ключевой фразой допускаются до двух слов. */
    var MAX_LEADING_WORDS = 2;

    /** Индексы начал буквенно-цифровых токенов в исходном тексте. */
    function wordStarts(text) {
      var re = /[\p{L}\p{N}]+/gu;
      var starts = [];
      var m;
      while ((m = re.exec(text)) !== null) starts.push(m.index);
      return starts;
    }

    /** Drop the wake phrase from the head of the transcript. */
    function stripLeadingPhrase(text, phrase) {
      var p = normalizeText(phrase);
      if (!p || !text) return text;
      var tolerance = p.length >= 8 ? 2 : 1;
      var starts = wordStarts(text);
      var limit = Math.min(MAX_LEADING_WORDS + 1, starts.length);
      for (var s = 0; s < limit; s++) {
        var cut = starts[s];
        var tokens = String(text.slice(cut)).match(/[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu) || [];
        var acc = '';
        var pos = cut;
        for (var i = 0; i < tokens.length; i++) {
          var token = tokens[i];
          pos += token.length;
          if (!/[\p{L}\p{N}]/u.test(token)) continue;
          acc += normalizeText(token);
          if (acc.length < p.length - tolerance) continue;
          if (editDistance(acc, p) <= tolerance) {
            return text.slice(pos).replace(/^[\s,.;:!?—–-]+/u, '').trim();
          }
          if (acc.length > p.length + tolerance) break;
        }
      }
      return text;
    }
    //#endregion

    //#region hotkeys
    var DEFAULT_HOTKEYS = {
      insert: { ctrl: true, alt: false, shift: true, meta: false, code: 'Space', label: 'Ctrl+Shift+Space' },
      send: { ctrl: true, alt: false, shift: true, meta: false, code: 'Enter', label: 'Ctrl+Shift+Enter' },
    };

    function loadHotkeys() {
      var result = { insert: DEFAULT_HOTKEYS.insert, send: DEFAULT_HOTKEYS.send };
      try {
        var raw = window.localStorage.getItem('dstr.hotkeys');
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && parsed.insert && parsed.insert.code) result.insert = parsed.insert;
          if (parsed && parsed.send && parsed.send.code) result.send = parsed.send;
        } else {
          var legacy = window.localStorage.getItem('dstr.hotkey');
          if (legacy) {
            var old = JSON.parse(legacy);
            if (old && old.code) result.insert = old;
          }
        }
      } catch (err) { /* ignore */ }
      return result;
    }
    function saveHotkeys(hotkeys) {
      try { window.localStorage.setItem('dstr.hotkeys', JSON.stringify(hotkeys)); } catch (err) { /* ignore */ }
    }
    function loadMode() {
      try {
        var raw = window.localStorage.getItem('dstr.mode');
        if (raw === 'send' || raw === 'insert') return raw;
      } catch (err) { /* ignore */ }
      return 'insert';
    }
    function saveMode(mode) {
      try { window.localStorage.setItem('dstr.mode', mode); } catch (err) { /* ignore */ }
    }

    //#region voice commands
    // Two independent commands, both spoken at the end of the utterance:
    // the stop word ends the recording and leaves the text in the field,
    // the send word ends it and sends the message.
    var DEFAULT_STOP = { enabled: true, phrase: 'стоп чат' };
    var DEFAULT_SEND = { enabled: true, phrase: 'отправь' };

    function loadCommand(key, fallback) {
      try {
        var raw = window.localStorage.getItem(key);
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && typeof parsed.phrase === 'string') {
            return { enabled: parsed.enabled !== false, phrase: parsed.phrase };
          }
        }
      } catch (err) { /* ignore */ }
      return { enabled: fallback.enabled, phrase: fallback.phrase };
    }
    function saveCommand(key, value) {
      try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (err) { /* ignore */ }
    }
    function loadStop() { return loadCommand('dstr.stop', DEFAULT_STOP); }
    function saveStop(value) { saveCommand('dstr.stop', value); }
    function loadSend() { return loadCommand('dstr.send', DEFAULT_SEND); }
    function saveSend(value) { saveCommand('dstr.send', value); }

    //#region UI sounds
    // Четыре звуковые схемы: у каждой свой вариант на каждое из четырёх событий
    // (начало записи, стоп, готово, ошибка). Файлы лежат в плагине и отдаются
    // маршрутом /dsh-transcribe/sound, поэтому в бандл клиента их не зашиваем.
    var SOUND_SCHEMES = [
      { id: 'warm', label: 'Тёплая', hint: 'маримба и мягкий колокольчик' },
      { id: 'wooden', label: 'Деревянная', hint: 'калимба и деревянный щелчок' },
      { id: 'airy', label: 'Воздушная', hint: 'подушка и тихий синус' },
      { id: 'muted', label: 'Приглушённая', hint: 'низкие удары без верха' },
    ];
    var DEFAULT_SOUND = { scheme: 'warm', volume: 0.5, voice: false };
    var cueCache = {};

    function loadSound() {
      try {
        var raw = window.localStorage.getItem('dstr.sound');
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            var scheme = typeof parsed.scheme === 'string' ? parsed.scheme : DEFAULT_SOUND.scheme;
            var known = scheme === 'off' || SOUND_SCHEMES.some(function (item) { return item.id === scheme; });
            if (!known) scheme = DEFAULT_SOUND.scheme;
            var volume = typeof parsed.volume === 'number' ? parsed.volume : DEFAULT_SOUND.volume;
            return {
              scheme: scheme,
              volume: Math.max(0, Math.min(1, volume)),
              voice: parsed.voice === true,
            };
          }
        }
      } catch (err) { /* ignore */ }
      return { scheme: DEFAULT_SOUND.scheme, volume: DEFAULT_SOUND.volume, voice: DEFAULT_SOUND.voice };
    }
    function saveSound(value) {
      try { window.localStorage.setItem('dstr.sound', JSON.stringify(value)); } catch (err) { /* ignore */ }
    }

    /** Один общий проигрыватель: Audio кэшируется, повторный клик не ждёт сеть. */
    function playCueFile(name, volume) {
      try {
        var audio = cueCache[name];
        if (!audio) {
          audio = new Audio('/dsh-transcribe/sound?f=' + encodeURIComponent(name));
          cueCache[name] = audio;
        }
        audio.volume = Math.max(0, Math.min(1, volume));
        audio.currentTime = 0;
        var started = audio.play();
        if (started && typeof started.catch === 'function') {
          // Браузер может запретить звук до первого клика — это не ошибка записи.
          started.catch(function () {});
        }
      } catch (err) { /* звук не должен мешать записи */ }
    }

    function soundName(cfg, kind) {
      if (!cfg || !cfg.scheme || cfg.scheme === 'off') return '';
      if (cfg.voice && (kind === 'start' || kind === 'done')) return 'voice-' + kind;
      return cfg.scheme + '-' + kind;
    }
    //#endregion
    function normalizeText(value) {
      return String(value || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
    }
    /**
     * Хвост совпадает с фразой нечётко — тем же правилом, что и ключевая фраза:
     * распознавание путает окончания, поэтому один-два символа прощаем.
     */
    function endsWithPhrase(text, phrase) {
      var p = normalizeText(phrase);
      var t = normalizeText(text);
      if (!p || !t) return false;
      var tolerance = p.length >= 8 ? 2 : 1;
      var minLen = Math.max(1, p.length - tolerance);
      var maxLen = p.length + tolerance;
      for (var len = Math.min(maxLen, t.length); len >= minLen; len--) {
        if (editDistance(t.slice(t.length - len), p) <= tolerance) return true;
      }
      return false;
    }
    /** Remove the trailing stop phrase from the transcript (same tolerance). */
    function stripPhrase(text, phrase) {
      var p = normalizeText(phrase);
      if (!p) return text;
      var tolerance = p.length >= 8 ? 2 : 1;
      var minLen = Math.max(1, p.length - tolerance);
      var maxLen = p.length + tolerance;
      var tokens = String(text).match(/[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu) || [];
      var acc = '';
      var pos = text.length;
      for (var i = tokens.length - 1; i >= 0; i--) {
        var token = tokens[i];
        pos -= token.length;
        if (!/[\p{L}\p{N}]/u.test(token)) continue;
        acc = normalizeText(token) + acc;
        if (acc.length < minLen) continue;
        if (editDistance(acc, p) <= tolerance) {
          return text.slice(0, pos).replace(/[\s,.;:!?—–-]+$/u, '').trim();
        }
        if (acc.length > maxLen) return text;
      }
      return text;
    }
    //#endregion
    function keyName(code) {
      if (!code) return '';
      if (code === 'Space') return 'Space';
      if (code === 'Escape') return 'Esc';
      if (code === 'Enter') return 'Enter';
      if (code === 'Tab') return 'Tab';
      if (code === 'Backspace') return 'Backspace';
      if (code === 'ArrowUp') return '↑';
      if (code === 'ArrowDown') return '↓';
      if (code === 'ArrowLeft') return '←';
      if (code === 'ArrowRight') return '→';
      if (code.indexOf('Key') === 0) return code.slice(3);
      if (code.indexOf('Digit') === 0) return code.slice(5);
      if (code.indexOf('Numpad') === 0) return 'Num' + code.slice(6);
      return code;
    }
    function hotkeyLabel(hotkey) {
      var parts = [];
      if (hotkey.ctrl) parts.push('Ctrl');
      if (hotkey.alt) parts.push('Alt');
      if (hotkey.shift) parts.push('Shift');
      if (hotkey.meta) parts.push('Win');
      parts.push(keyName(hotkey.code));
      return parts.join('+');
    }
    function matchHotkey(event, hotkey) {
      if (!hotkey || !hotkey.code) return false;
      if (event.code !== hotkey.code) return false;
      return !!event.ctrlKey === !!hotkey.ctrl
        && !!event.altKey === !!hotkey.alt
        && !!event.shiftKey === !!hotkey.shift
        && !!event.metaKey === !!hotkey.meta;
    }
    function captureHotkey(event) {
      var code = event.code;
      if (!code) return null;
      if (/^(Control|Shift|Alt|Meta)(Left|Right)$/.test(code)) return null;
      var hotkey = {
        ctrl: event.ctrlKey, alt: event.altKey, shift: event.shiftKey, meta: event.metaKey, code: code,
      };
      var isFunctionKey = /^F\d{1,2}$/.test(code);
      if (!hotkey.ctrl && !hotkey.alt && !hotkey.shift && !hotkey.meta && !isFunctionKey) {
        return { error: 'Нужен модификатор (Ctrl, Alt, Shift) или F-клавиша' };
      }
      hotkey.label = hotkeyLabel(hotkey);
      return hotkey;
    }
    //#endregion

    function friendlyError(err) {
      var text = String((err && err.message) || err || '');
      if (/Permission|denied|NotAllowed/i.test(text)) return 'Нет доступа к микрофону. Разрешите его в настройках Windows.';
      if (/NotFound|Devices/i.test(text)) return 'Микрофон не найден.';
      if (/secure|https/i.test(text)) return 'Микрофон доступен только на localhost или по HTTPS.';
      return text || 'Не удалось открыть микрофон.';
    }

    function formatTime(total) {
      var m = Math.floor(total / 60);
      var s = total % 60;
      return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }

    function concatChunks(chunks, limitBytes) {
      var total = 0;
      for (var i = 0; i < chunks.length; i++) total += chunks[i].byteLength;
      var start = limitBytes ? Math.max(0, total - limitBytes) : 0;
      var out = new Uint8Array(total - start);
      var pos = 0;
      var offset = 0;
      for (var j = 0; j < chunks.length; j++) {
        var chunk = chunks[j];
        var chunkStart = offset;
        var chunkEnd = offset + chunk.byteLength;
        offset = chunkEnd;
        if (chunkEnd <= start) continue;
        var from = Math.max(0, start - chunkStart);
        out.set(chunk.subarray(from), pos);
        pos += chunk.byteLength - from;
      }
      return out;
    }

    function MicIcon(recording) {
      if (recording) {
        return h('svg', { width: 15, height: 15, viewBox: '0 0 16 16', 'aria-hidden': true },
          h('rect', { x: 4, y: 4, width: 8, height: 8, rx: 2, fill: 'currentColor' }));
      }
      return h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
        h('rect', { x: 9, y: 3, width: 6, height: 11, rx: 3, stroke: 'currentColor', strokeWidth: 1.8 }),
        h('path', { d: 'M5.5 11.5a6.5 6.5 0 0 0 13 0', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' }),
        h('path', { d: 'M12 18v3', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' }));
    }

    function EarIcon() {
      return h('svg', { width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
        h('circle', { cx: 12, cy: 12, r: 2.1, fill: 'currentColor' }),
        h('path', { d: 'M7.6 7.6a6.2 6.2 0 0 0 0 8.8', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' }),
        h('path', { d: 'M16.4 7.6a6.2 6.2 0 0 1 0 8.8', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' }),
        h('path', { d: 'M4.7 4.7a10.3 10.3 0 0 0 0 14.6', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', opacity: 0.5 }),
        h('path', { d: 'M19.3 4.7a10.3 10.3 0 0 1 0 14.6', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', opacity: 0.5 }));
    }

    /** Spell-check mark: a capital A with a tick. */
    function GrammarIcon() {
      return h('svg', { width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M3.5 16.5L8 5l4.5 11.5', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        h('path', { d: 'M5.2 12.8h5.6', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' }),
        h('path', { d: 'M14 17.2l2.6 2.6L22 13', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }));
    }

    /** Prompt polish: a wand with sparkles. */
    function PromptIcon() {
      return h('svg', { width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M4.6 19.4l8.1-8.1', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' }),
        h('path', { d: 'M14 4l.9 2.1L17 7l-2.1.9L14 10l-.9-2.1L11 7l2.1-.9z', fill: 'currentColor' }),
        h('path', { d: 'M19 12l.6 1.4L21 14l-1.4.6L19 16l-.6-1.4L17 14l1.4-.6z', fill: 'currentColor', opacity: 0.8 }),
        h('path', { d: 'M17.2 4.8l.4 1 1 .4-1 .4-.4 1-.4-1-1-.4 1-.4z', fill: 'currentColor', opacity: 0.6 }));
    }

    /**
     * Rewrites whatever sits in the composer: `grammar` fixes mistakes,
     * `prompt` turns the dictation into a precise instruction. It is its own
     * component so that subscribing to the draft does not re-render the whole
     * microphone panel and its 96 wave bars on every keystroke.
     */
    function RewriteButton(props) {
      var inputActions = props.inputActions;
      var mode = props.mode === 'prompt' ? 'prompt' : 'grammar';
      var useInput = typeof props.useInput === 'function'
        ? props.useInput
        : function (selector) { return selector ? selector({ draft: '' }) : null; };
      var draft = useInput(function (state) {
        return state && typeof state.draft === 'string' ? state.draft : '';
      });
      var busyState = React.useState(false);
      var busy = busyState[0], setBusy = busyState[1];
      var busyRef = React.useRef(false);

      function run() {
        if (busyRef.current) return;
        var text = String(draft || '').trim();
        if (!text) return;
        busyRef.current = true;
        setBusy(true);
        fetch('/dsh-transcribe/fix', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text: text, mode: mode }),
        }).then(function (response) {
          return response.json();
        }).then(function (json) {
          if (!json || !json.ok) throw new Error((json && json.error) || 'не удалось');
          var next = String(json.text || '');
          if (!next || next === text) {
            props.notify('muted', 'Без изменений');
            return;
          }
          var applied = false;
          try {
            if (inputActions && typeof inputActions.setDraft === 'function') {
              inputActions.setDraft(next);
              applied = true;
            }
          } catch (err) {
            applied = false;
          }
          if (applied) props.notify('ok', mode === 'prompt' ? 'Промпт улучшен' : 'Текст исправлен');
          else props.notify('err', 'Не удалось заменить текст');
        }).catch(function (err) {
          props.notify('err', 'Не удалось: ' + String((err && err.message) || err));
        }).then(function () {
          busyRef.current = false;
          setBusy(false);
        });
      }

      var empty = String(draft || '').trim().length === 0;
      return h('button', {
        type: 'button',
        className: 'dstr-btn dstr-tool' + (busy ? ' is-busy' : ''),
        title: empty ? props.emptyTitle : props.title,
        'aria-label': props.title,
        disabled: empty || busy,
        onMouseDown: function (event) { event.preventDefault(); },
        onClick: run,
      }, busy ? h('span', { className: 'dstr-spin' }) : props.icon());
    }

    function MicButton(props) {
      var inputActions = props.inputActions;
      var onActiveChange = props.onActiveChange;

      var phaseState = React.useState('idle');
      var phase = phaseState[0], setPhaseRaw = phaseState[1];
      var levelState = React.useState(0);
      var level = levelState[0], setLevel = levelState[1];
      var secondsState = React.useState(0);
      var seconds = secondsState[0], setSeconds = secondsState[1];
      var previewState = React.useState('');
      var preview = previewState[0], setPreview = previewState[1];
      var messageState = React.useState('');
      var message = messageState[0], setMessage = messageState[1];
      var pendingState = React.useState('');
      var pending = pendingState[0], setPending = pendingState[1];
      var hotkeysState = React.useState(loadHotkeys);
      var hotkeys = hotkeysState[0], setHotkeys = hotkeysState[1];
      var captureTargetState = React.useState(null);
      var captureTarget = captureTargetState[0], setCaptureTarget = captureTargetState[1];
      var captureHintState = React.useState('');
      var captureHint = captureHintState[0], setCaptureHint = captureHintState[1];
      var modeState = React.useState(loadMode);
      var mode = modeState[0], setMode = modeState[1];
      var stopState = React.useState(loadStop);
      var stopCfg = stopState[0], setStop = stopState[1];
      var sendState = React.useState(loadSend);
      var sendCfg = sendState[0], setSend = sendState[1];
      var settingsOpenState = React.useState(false);
      var settingsOpen = settingsOpenState[0], setSettingsOpen = settingsOpenState[1];
      var wakeState = React.useState(loadWake);
      var wakeCfg = wakeState[0], setWake = wakeState[1];
      var soundState = React.useState(loadSound);
      var soundCfg = soundState[0], setSound = soundState[1];
      var soundRef = React.useRef(soundCfg);
      soundRef.current = soundCfg;

      /**
       * Смена фазы заодно озвучивает два события: начало записи и ошибку.
       * «Стоп» и «готово» звучат там, где меняется смысл (в stop и после вставки),
       * иначе на ошибку приходилось бы вешать сигнал в четырёх местах.
       */
      function setPhase(next) {
        var previous = phaseRef.current;
        if (next !== previous) {
          if (next === 'recording') playCue('start');
          else if (next === 'error') playCue('error');
        }
        setPhaseRaw(next);
      }

      /** Короткий сигнал события; настройки берутся из ref, чтобы не ждать рендер. */
      function playCue(kind) {
        var cfg = soundRef.current;
        var name = soundName(cfg, kind);
        if (!name) return;
        playCueFile(name, cfg.volume);
      }
      var toastState = React.useState(null);
      var toast = toastState[0], setToast = toastState[1];
      var toastTimerRef = React.useRef(0);

      /** Short-lived feedback shared by the two rewrite buttons. */
      function showToast(tone, text) {
        setToast({ tone: tone, text: text });
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(function () { setToast(null); }, 4000);
      }


      var boxState = React.useState(null);
      var box = boxState[0], setBox = boxState[1];
      var buttonRef = React.useRef(null);
      var barsRef = React.useRef([]);
      var micRef = React.useRef(null);
      var micModeRef = React.useRef(null);
      var wakeRef = React.useRef(wakeCfg);
      var wakeEngineRef = React.useRef(null);
      var wakeBusyRef = React.useRef(false);
      var wakeHitRef = React.useRef(false);
      var autoStopRef = React.useRef(false);
      var recTrackerRef = React.useRef(null);
      var chunksRef = React.useRef([]);
      var bytesRef = React.useRef(0);
      var spanRef = React.useRef(null);
      var startedRef = React.useRef(0);
      var phaseRef = React.useRef('idle');
      var hotkeysRef = React.useRef(hotkeys);
      var captureTargetRef = React.useRef(null);
      var modeRef = React.useRef(mode);
      var stopRef = React.useRef(stopCfg);
      var stopHitRef = React.useRef(false);
      var sendRef = React.useRef(sendCfg);
      var sendHitRef = React.useRef(false);
      var actionRef = React.useRef('insert');
      var partialBusyRef = React.useRef(false);
      var partialBytesRef = React.useRef(0);
      var transcribeRef = React.useRef(null);
      var pendingTokenRef = React.useRef(null);
      var cancelSeqRef = React.useRef(0);
      var retryRef = React.useRef(false);
      var pendingActRef = React.useRef('insert');
      var wakeQueueRef = React.useRef([]);
      var actionsRef = React.useRef({});
      phaseRef.current = phase;
      hotkeysRef.current = hotkeys;
      captureTargetRef.current = captureTarget;
      modeRef.current = mode;
      stopRef.current = stopCfg;
      sendRef.current = sendCfg;
      wakeRef.current = wakeCfg;

      /** Пустая строка в настройках означает фразу по умолчанию — как на хосте. */
      function wakePhrase() {
        var raw = String(wakeRef.current.phrase || '').trim();
        return raw || DEFAULT_WAKE.phrase;
      }

      function insertText(text) {
        var span = spanRef.current;
        var ok = false;
        try {
          if (inputActions && inputActions.insertText) ok = !!inputActions.insertText(text, span);
        } catch (err) { ok = false; }
        if (!ok) {
          try {
            if (inputActions && inputActions.insertText) ok = !!inputActions.insertText(text, inputActions.captureInsertion());
          } catch (err) { ok = false; }
        }
        // Черновик целиком не подменяем: в поле мог быть свой текст. Если
        // вставка недоступна, панель предложит вставить вручную («pending»).
        return ok;
      }

      function reset() {
        // Cancelling the recording has to cancel the recognition request too,
        // otherwise its late answer still inserts text after "Отмена".
        pendingTokenRef.current = null;
        cancelSeqRef.current += 1;
        var request = transcribeRef.current;
        transcribeRef.current = null;
        if (request) { try { request.abort(); } catch (err) {} }
        var rec = micRef.current;
        micRef.current = null;
        micModeRef.current = null;
        if (rec) { try { rec.stop(); } catch (err) {} }
        chunksRef.current = [];
        bytesRef.current = 0;
        retryRef.current = false;
        partialBusyRef.current = false;
        partialBytesRef.current = 0;
        stopHitRef.current = false;
        sendHitRef.current = false;
        wakeHitRef.current = false;
        autoStopRef.current = false;
        phaseRef.current = 'idle';
        setPhase('idle');
        setSeconds(0);
        setLevel(0);
        setPreview('');
        setMessage('');
        setPending('');
        resumeListening();
      }

      function finishIdle() {
        phaseRef.current = 'idle';
        setPhase('idle');
        setSeconds(0);
        setLevel(0);
        setPreview('');
        setMessage('');
        resumeListening();
      }

      function start(action, seed) {
        if (phaseRef.current === 'recording' || phaseRef.current === 'starting' || phaseRef.current === 'finishing') return;
        actionRef.current = action === 'send' ? 'send' : 'insert';
        setMode(actionRef.current);
        saveMode(actionRef.current);
        stopHitRef.current = false;
        sendHitRef.current = false;
        setMessage('');
        setPending('');
        setPreview('');
        setSeconds(0);
        setLevel(0);
        chunksRef.current = seed && seed.length ? [seed] : [];
        bytesRef.current = seed ? seed.byteLength : 0;
        partialBytesRef.current = 0;
        autoStopRef.current = Boolean(seed && seed.length);
        recTrackerRef.current = new LevelTracker();
        spanRef.current = inputActions && inputActions.captureInsertion ? inputActions.captureInsertion() : null;
        // The wake listener already holds the microphone: keep it and just
        // switch what the frames feed, so no word is lost in the handover.
        if (micRef.current && micModeRef.current === 'listen') {
          micModeRef.current = 'record';
          startedRef.current = Date.now() - (seed ? (seed.byteLength / 2 / 16000) * 1000 : 0);
          setPhase('recording');
          return;
        }
        setPhase('starting');
        var rec = new Recorder(handleFrame, function (err) {
          setMessage(friendlyError(err));
          setPhase('error');
        });
        micRef.current = rec;
        micModeRef.current = 'record';
        rec.start().then(function () {
          if (micRef.current !== rec) return;
          startedRef.current = Date.now();
          setPhase('recording');
        }).catch(function () { /* onError already reported */ });
      }

      function stop(action) {
        if (micModeRef.current !== 'record') return;
        var act = action === 'send' || action === 'insert' ? action : actionRef.current;
        var rec = micRef.current;
        micRef.current = null;
        micModeRef.current = null;
        if (rec) { try { rec.stop(); } catch (err) {} }
        autoStopRef.current = false;
        playCue('stop');
        submit(act);
      }

      /** Повтор последнего неудачного запроса: буфер записи ещё цел. */
      function retry() {
        if (phaseRef.current !== 'error') return;
        if (!retryRef.current || !chunksRef.current.length) return;
        submit(pendingActRef.current);
      }

      /** Распознать уже собранный буфер — общий путь для стопа и «Повторить». */
      function submit(act) {
        // Один запрос в полёте: повторный клик «Повторить» не шлёт второй.
        if (pendingTokenRef.current) return;
        pendingActRef.current = act;
        setPhase('finishing');
        partialBusyRef.current = false;
        partialBytesRef.current = 0;
        var merged = concatChunks(chunksRef.current, 0);
        if (!merged.length) {
          retryRef.current = false;
          setMessage('Ничего не записалось — проверьте микрофон.');
          phaseRef.current = 'error';
          setPhase('error');
          return;
        }
        // Идентичность запроса — отдельный токен, а не контроллер: в старом
        // WebView AbortController нет, и сравнение null===null пропускало
        // поздний ответ после «Отмены».
        var token = {};
        pendingTokenRef.current = token;
        var request = typeof AbortController === 'function' ? new AbortController() : null;
        transcribeRef.current = request;
        fetch('/dsh-transcribe/transcribe?sr=16000', {
          method: 'POST',
          headers: { 'content-type': 'application/octet-stream' },
          body: merged,
          signal: request ? request.signal : undefined,
        }).then(function (response) {
          return response.json();
        }).then(function (json) {
          if (pendingTokenRef.current !== token) return;
          pendingTokenRef.current = null;
          if (!json || !json.ok) throw new Error((json && json.error) || 'transcribe failed');
          var text = String(json.text || '').trim();
          if (wakeHitRef.current) {
            text = stripLeadingPhrase(text, wakePhrase());
            wakeHitRef.current = false;
          }
          // Both commands can be caught by the live preview or only by the
          // final pass (auto-stop may fire first), so both paths are checked.
          var stopCfgNow = stopRef.current;
          var sendCfgNow = sendRef.current;
          var stopHeard = stopHitRef.current
            || (stopCfgNow && stopCfgNow.enabled && endsWithPhrase(text, stopCfgNow.phrase));
          var sendHeard = sendHitRef.current
            || (sendCfgNow && sendCfgNow.enabled && endsWithPhrase(text, sendCfgNow.phrase));
          // Одинаковые фразы не должны отправлять сообщение по ошибке:
          // при неоднозначности побеждает стоп-слово, а человек видит плашку.
          if (stopHeard && sendHeard && act !== 'send') {
            sendHeard = false;
            showToast('err', 'Стоп-слово и слово отправки совпадают — текст оставлен в поле');
          }
          if (sendHeard) {
            if (sendCfgNow && sendCfgNow.enabled && endsWithPhrase(text, sendCfgNow.phrase)) {
              text = stripPhrase(text, sendCfgNow.phrase);
            }
            act = 'send';
          } else if (stopHeard) {
            if (stopCfgNow && stopCfgNow.enabled && endsWithPhrase(text, stopCfgNow.phrase)) {
              text = stripPhrase(text, stopCfgNow.phrase);
            }
            act = 'insert';
          }
          stopHitRef.current = false;
          sendHitRef.current = false;
          retryRef.current = false;
          chunksRef.current = [];
          bytesRef.current = 0;
          if ((stopHeard || sendHeard) && !text) {
            finishIdle();
            return;
          }
          if (!text) {
            setMessage('Речь не распознана.');
            // phaseRef обновляем сами: он догоняет на рендере, а resumeListening
            // смотрит именно на него и иначе увидит ещё «finishing».
            phaseRef.current = 'error';
            setPhase('error');
            resumeListening();
            return;
          }
          if (insertText(text)) {
            playCue('done');
            if (act === 'send') {
              // Отправку откладываем на кадр, чтобы поле успело обновиться;
              // «Отмена» в эти 40 мс обязана её отменить (номер в cancelSeqRef).
              var seqAtSend = cancelSeqRef.current;
              setTimeout(function () {
                if (cancelSeqRef.current !== seqAtSend) return;
                try { if (inputActions && inputActions.submit) inputActions.submit(); } catch (err) { /* ignore */ }
              }, 40);
            }
            finishIdle();
          } else {
            setPending(text);
            setPhase('pending');
          }
        }).catch(function (err) {
          if (pendingTokenRef.current !== token) return;
          pendingTokenRef.current = null;
          // Буфер не трогаем: сбой сети или таймаут не должен уничтожать запись.
          retryRef.current = true;
          setMessage('Ошибка распознавания: ' + String((err && err.message) || err)
            + ' — запись сохранена, нажмите «Повторить»');
          phaseRef.current = 'error';
          setPhase('error');
          resumeListening();
        });
      }

      function cancel() {
        reset();
      }

      //#region wake listening
      function isFocused() {
        try {
          if (document.visibilityState !== 'visible') return false;
          return document.hasFocus();
        } catch (err) {
          return true;
        }
      }

      function handleFrame(pcm, rms) {
        if (micModeRef.current === 'record') {
          chunksRef.current.push(pcm);
          bytesRef.current += pcm.byteLength;
          setLevel(rms);
          // Буфер записи ограничен: длиннее лимита сервер всё равно откажет,
          // поэтому диктовка обрывается на пределе, а текст уходит в поле.
          if (bytesRef.current >= MAX_RECORD_BYTES) {
            stop('insert');
            showToast('muted', 'Предел записи 10 минут — текст вставлен');
            return;
          }
          var tracker = recTrackerRef.current;
          if (tracker) {
            var dur = (pcm.byteLength / 2 / 16000) * 1000;
            tracker.feed(rms, dur);
            if (autoStopRef.current
              && wakeRef.current.pauseMs > 0
              && tracker.silenceMs >= wakeRef.current.pauseMs
              && bytesRef.current >= 16000 * 2 * 0.8) {
              // A pause only saves the text into the field; sending is the
              // send word's job, never an accident of silence.
              stop('insert');
            }
          }
          return;
        }
        if (micModeRef.current === 'listen') {
          var engine = wakeEngineRef.current;
          if (!engine) return;
          var segment = engine.feed(pcm, rms);
          if (segment) checkWake(segment);
        }
      }

      function checkWake(segment) {
        if (!wakeRef.current.enabled) return;
        if (micModeRef.current !== 'listen') return;
        // Один запрос в полёте; пришедшие следом сегменты не выбрасываем, а
        // откладываем — иначе фраза сразу после реплики теряется.
        if (wakeBusyRef.current) {
          if (wakeQueueRef.current.length < 4) wakeQueueRef.current.push(segment);
          return;
        }
        wakeBusyRef.current = true;
        var phrase = wakePhrase();
        fetch('/dsh-transcribe/wake?sr=16000&phrase=' + encodeURIComponent(phrase), {
          method: 'POST',
          headers: { 'content-type': 'application/octet-stream' },
          body: segment.pcm,
        }).then(function (response) {
          return response.json();
        }).then(function (json) {
          if (!json || !json.ok || !json.hit) return;
          if (micModeRef.current !== 'listen') return;
          if (!wakeRef.current.enabled) return;
          if (phaseRef.current !== 'idle') return;
          var engine = wakeEngineRef.current;
          var seed = engine ? engine.slice(segment.start, performance.now()) : null;
          wakeHitRef.current = true;
          start(modeRef.current, seed);
        }).catch(function () { /* a missed window is not an error */ }).then(function () {
          wakeBusyRef.current = false;
          var queued = wakeQueueRef.current.shift();
          if (queued) checkWake(queued);
        });
      }

      function startListening() {
        if (!wakeRef.current.enabled) return;
        if (micRef.current) return;
        if (!isFocused()) return;
        var rec = new Recorder(handleFrame, function (err) {
          if (micRef.current !== rec) return;
          micRef.current = null;
          micModeRef.current = null;
          var next = { enabled: false, phrase: wakeRef.current.phrase, pauseMs: wakeRef.current.pauseMs };
          wakeRef.current = next;
          setWake(next);
          saveWake(next);
          // The button is the only indicator, so an error has to be said out
          // loud: open the panel with the reason instead of failing silently.
          setMessage(friendlyError(err));
          setPhase('error');
        });
        micRef.current = rec;
        micModeRef.current = 'listen';
        wakeEngineRef.current = new WakeEngine();
        wakeBusyRef.current = false;
        rec.start().catch(function () { /* reported through onError */ });
      }

      function stopListening() {
        if (micModeRef.current === 'listen') {
          var rec = micRef.current;
          micRef.current = null;
          micModeRef.current = null;
          if (rec) { try { rec.stop(); } catch (err) {} }
        }
        wakeEngineRef.current = null;
        wakeQueueRef.current = [];
      }

      function resumeListening() {
        if (!wakeRef.current.enabled) return;
        if (micRef.current) return;
        if (!isFocused()) return;
        if (phaseRef.current === 'recording' || phaseRef.current === 'starting' || phaseRef.current === 'finishing') return;
        startListening();
      }

      function toggleWake() {
        var next = {
          enabled: !wakeRef.current.enabled,
          phrase: wakeRef.current.phrase,
          pauseMs: wakeRef.current.pauseMs,
        };
        wakeRef.current = next;
        setWake(next);
        saveWake(next);
        if (next.enabled) startListening();
        else stopListening();
      }

      /** 0 turns the pause stop off entirely. */
      function setPause(ms) {
        var next = { enabled: wakeRef.current.enabled, phrase: wakeRef.current.phrase, pauseMs: ms };
        wakeRef.current = next;
        setWake(next);
        saveWake(next);
      }

      function commitPause(event) {
        // Accept both "1.4" and "1,4" — the Russian keyboard layout gives a comma.
        var seconds = parseFloat(String(event.target.value).replace(',', '.'));
        if (!isFinite(seconds)) {
          event.target.value = String((wakeRef.current.pauseMs > 0 ? wakeRef.current.pauseMs : DEFAULT_WAKE.pauseMs) / 1000);
          return;
        }
        var ms = Math.round(seconds * 1000);
        if (ms <= 0) {
          setPause(0);
          event.target.value = '0';
          return;
        }
        if (ms < 300) ms = 300;
        if (ms > 15000) ms = 15000;
        setPause(ms);
        event.target.value = String(ms / 1000);
      }
      //#endregion

      actionsRef.current = { start: start, stop: stop, cancel: cancel };

      // Match the panel to the composer card so the wave spans the chat width.
      function measure() {
        var el = buttonRef.current;
        if (!el) { setBox(null); return; }
        var node = el;
        for (var i = 0; i < 14 && node; i++) {
          if (node.querySelector && node.querySelector('textarea, [contenteditable="true"]')) {
            var rect = node.getBoundingClientRect();
            if (rect.width > 200) {
              setBox({ left: rect.left, width: rect.width });
              return;
            }
          }
          node = node.parentElement;
        }
        setBox(null);
      }

      // One global listener: hotkey, capture mode, Escape.
      React.useEffect(function () {
        function onKey(event) {
          var target = captureTargetRef.current;
          if (target) {
            event.preventDefault();
            event.stopPropagation();
            if (event.key === 'Escape') {
              setCaptureTarget(null);
              setCaptureHint('');
              return;
            }
            var captured = captureHotkey(event);
            if (!captured) return;
            if (captured.error) {
              setCaptureHint(captured.error);
              return;
            }
            var next = { insert: hotkeysRef.current.insert, send: hotkeysRef.current.send };
            next[target] = captured;
            setHotkeys(next);
            saveHotkeys(next);
            setCaptureTarget(null);
            setCaptureHint('');
            return;
          }
          var current = hotkeysRef.current;
          if (matchHotkey(event, current.send)) {
            event.preventDefault();
            if (phaseRef.current === 'recording') actionsRef.current.stop('send');
            else if (phaseRef.current === 'idle' || phaseRef.current === 'error') actionsRef.current.start('send');
            return;
          }
          if (matchHotkey(event, current.insert)) {
            event.preventDefault();
            if (phaseRef.current === 'recording') actionsRef.current.stop('insert');
            else if (phaseRef.current === 'idle' || phaseRef.current === 'error') actionsRef.current.start('insert');
            return;
          }
          if (event.key === 'Escape'
            && (phaseRef.current === 'recording' || phaseRef.current === 'starting' || phaseRef.current === 'finishing')) {
            event.preventDefault();
            actionsRef.current.cancel();
          }
        }
        window.addEventListener('keydown', onKey, true);
        return function () { window.removeEventListener('keydown', onKey, true); };
      }, []);

      // Timer.
      React.useEffect(function () {
        if (phase !== 'recording') return undefined;
        var timer = setInterval(function () {
          setSeconds(Math.floor((Date.now() - startedRef.current) / 1000));
        }, 250);
        return function () { clearInterval(timer); };
      }, [phase]);

      // Real spectrum: every bar follows the microphone's frequency data.
      React.useEffect(function () {
        if (phase !== 'recording') return undefined;
        var raf = 0;
        var smooth = [];
        for (var k = 0; k < 96; k++) smooth[k] = 0;
        function tick() {
          var rec = micRef.current;
          var analyser = rec && rec.analyser;
          if (analyser) {
            var data = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(data);
            var nyquist = (rec.sampleRate || 16000) / 2;
            var bins = data.length;
            for (var i = 0; i < 96; i++) {
              var f0 = 40 * Math.pow(200, i / 96);
              var f1 = 40 * Math.pow(200, (i + 1) / 96);
              var b0 = Math.max(0, Math.floor((f0 / nyquist) * bins));
              var b1 = Math.min(bins - 1, Math.ceil((f1 / nyquist) * bins));
              var peak = 0;
              for (var b = b0; b <= b1; b++) { if (data[b] > peak) peak = data[b]; }
              var v = peak / 255;
              v = v < 0.08 ? 0 : Math.pow((v - 0.08) / 0.92, 1.35);
              smooth[i] = v > smooth[i] ? v : smooth[i] * 0.86;
              var el = barsRef.current[i];
              if (el) {
                el.style.transform = 'scaleY(' + (0.05 + smooth[i] * 0.95).toFixed(3) + ')';
                el.style.opacity = (0.3 + smooth[i] * 0.7).toFixed(3);
              }
            }
          }
          raf = requestAnimationFrame(tick);
        }
        raf = requestAnimationFrame(tick);
        return function () { cancelAnimationFrame(raf); };
      }, [phase]);

      // Live preview: re-transcribe the last 10 s every 1.5 s.
      React.useEffect(function () {
        if (phase !== 'recording') return undefined;
        var timer = setInterval(function () {
          if (partialBusyRef.current) return;
          var total = bytesRef.current;
          if (total < 16000 * 2 * 0.8) return;
          // Nothing new since the last pass: the user is silent (or thinking),
          // so there is nothing to recognise and no reason to burn CPU.
          if (total === partialBytesRef.current) return;
          partialBytesRef.current = total;
          var tail = concatChunks(chunksRef.current, 16000 * 2 * 10);
          if (!tail.length) return;
          partialBusyRef.current = true;
          fetch('/dsh-transcribe/partial?sr=16000', {
            method: 'POST',
            headers: { 'content-type': 'application/octet-stream' },
            body: tail,
          }).then(function (response) {
            return response.json();
          }).then(function (json) {
            if (!json || !json.ok) return;
            var text = String(json.text || '').trim();
            if (wakeHitRef.current) text = stripLeadingPhrase(text, wakePhrase());
            setPreview(text);
            var stopCfgNow = stopRef.current;
            if (stopCfgNow && stopCfgNow.enabled && !stopHitRef.current
              && endsWithPhrase(text, stopCfgNow.phrase)) {
              stopHitRef.current = true;
              stop('insert');
            }
            var sendCfgNow = sendRef.current;
            if (sendCfgNow && sendCfgNow.enabled && !sendHitRef.current
              && endsWithPhrase(text, sendCfgNow.phrase)) {
              sendHitRef.current = true;
              stop('send');
            }
          }).catch(function () { /* preview is best-effort */ }).then(function () {
            partialBusyRef.current = false;
          });
        }, 1500);
        return function () { clearInterval(timer); };
      }, [phase]);

      // Keep the panel aligned with the composer while it is open.
      React.useEffect(function () {
        if (phase === 'idle') return undefined;
        measure();
        function onResize() { measure(); }
        window.addEventListener('resize', onResize);
        return function () { window.removeEventListener('resize', onResize); };
      }, [phase]);

      // Release toolbar expansion on unmount.
      React.useEffect(function () {
        if (typeof onActiveChange === 'function') onActiveChange(false);
        return function () {
          if (typeof onActiveChange === 'function') onActiveChange(false);
          clearTimeout(toastTimerRef.current);
          var rec = micRef.current;
          micRef.current = null;
          micModeRef.current = null;
          if (rec) { try { rec.stop(); } catch (err) {} }
        };
      }, []);

      // The microphone follows the window: no focus, no listening.
      React.useEffect(function () {
        function sync() {
          if (!wakeRef.current.enabled) { stopListening(); return; }
          if (isFocused()) startListening(); else stopListening();
        }
        window.addEventListener('focus', sync);
        window.addEventListener('blur', sync);
        document.addEventListener('visibilitychange', sync);
        sync();
        return function () {
          window.removeEventListener('focus', sync);
          window.removeEventListener('blur', sync);
          document.removeEventListener('visibilitychange', sync);
        };
      }, []);

      var recording = phase === 'recording';
      var busy = phase === 'starting' || phase === 'finishing';
      var bars = [];
      var setBar = function (index) {
        return function (el) { barsRef.current[index] = el; };
      };
      for (var i = 0; i < 96; i++) {
        bars.push(h('i', { key: i, ref: setBar(i) }));
      }
      var panelStyle = box
        ? { left: box.left + 'px', width: box.width + 'px', transform: 'none' }
        : null;

      var panel = null;
      if (phase !== 'idle') {
        var stripText = '';
        var stripEmpty = true;
        if (phase === 'pending') {
          stripText = pending;
          stripEmpty = false;
        } else if (phase === 'error') {
          stripText = message || 'Ошибка.';
          stripEmpty = false;
        } else if (phase === 'finishing') {
          stripText = 'Распознаю…';
          stripEmpty = true;
        } else if (phase === 'starting') {
          stripText = 'Открываю микрофон…';
          stripEmpty = true;
        } else if (preview) {
          stripText = preview;
          stripEmpty = false;
        } else {
          stripText = 'Говорите…';
          stripEmpty = true;
        }

        var actions = [];
        if (phase === 'recording') {
          actions.push(h('button', {
            key: 'stop', type: 'button', className: 'dstr-act primary',
            onClick: function () { stop(mode); },
          }, mode === 'send' ? 'Стоп и отправить' : 'Стоп'));
        }
        if (phase === 'pending') {
          actions.push(h('button', {
            key: 'insert', type: 'button', className: 'dstr-act primary',
            onClick: function () {
              // Кнопку нажали осознанно: если точечная вставка не вышла,
              // кладём текст в черновик целиком — иначе «Вставить» бесполезна.
              if (insertText(pending)) { setPending(''); finishIdle(); return; }
              try {
                if (inputActions && inputActions.setDraft) {
                  inputActions.setDraft(pending);
                  setPending('');
                  finishIdle();
                }
              } catch (err) { /* остаётся панель с текстом */ }
            },
          }, 'Вставить'));
        }
        if (phase === 'error' && retryRef.current && chunksRef.current.length) {
          actions.push(h('button', {
            key: 'retry', type: 'button', className: 'dstr-act primary', onClick: retry,
          }, 'Повторить'));
        }
        if (phase === 'error' || phase === 'pending') {
          actions.push(h('button', { key: 'close', type: 'button', className: 'dstr-act', onClick: reset }, 'Закрыть'));
        } else {
          actions.push(h('button', { key: 'cancel', type: 'button', className: 'dstr-act', onClick: cancel }, 'Отмена'));
        }

        var hint = captureTarget
          ? (captureHint || 'Нажмите комбинацию, Esc — отмена')
          : (phase === 'recording' ? 'Esc — отмена' : '');

        panel = ReactDOM.createPortal(
          h('div', {
            className: 'dstr-panel',
            role: 'dialog',
            'aria-label': 'Голосовой ввод',
            'data-recording': recording ? 'true' : 'false',
            style: panelStyle,
          },
            h('div', { className: 'dstr-head' },
              h('span', { className: 'dstr-pill', 'data-tone': recording ? 'rec' : 'busy' },
                h('span', { className: 'dstr-dot' }),
                phase === 'finishing' ? 'Распознавание' : phase === 'error' ? 'Ошибка' : 'Запись'),
              h('span', { className: 'dstr-time' }, formatTime(seconds)),
              h('button', {
                type: 'button',
                className: 'dstr-gear',
                title: 'Настройки: ключевая фраза и стоп-слово',
                'aria-label': 'Настройки: ключевая фраза и стоп-слово',
                onClick: function () { setSettingsOpen(!settingsOpen); },
              }, '⚙')),
            settingsOpen ? h('div', { className: 'dstr-pop' },
              h('label', null,
                h('input', {
                  type: 'checkbox',
                  checked: wakeCfg.enabled,
                  onChange: toggleWake,
                }),
                'Слушать ключевую фразу'),
              h('span', { className: 'dstr-field' }, 'Ключевая фраза'),
              h('input', {
                type: 'text',
                value: wakeCfg.phrase,
                placeholder: 'окей дипсик',
                onChange: function (event) {
                  var next = { enabled: wakeCfg.enabled, phrase: event.target.value, pauseMs: wakeCfg.pauseMs };
                  wakeRef.current = next;
                  setWake(next);
                  saveWake(next);
                },
              }),
              h('label', { style: { marginTop: '10px' } },
                h('input', {
                  type: 'checkbox',
                  checked: wakeCfg.pauseMs > 0,
                  onChange: function (event) {
                    setPause(event.target.checked ? (wakeCfg.pauseMs > 0 ? wakeCfg.pauseMs : DEFAULT_WAKE.pauseMs) : 0);
                  },
                }),
                'Останавливать по паузе'),
              h('span', { className: 'dstr-field' }, 'Пауза, секунд'),
              h('input', {
                type: 'text',
                inputMode: 'decimal',
                // Uncontrolled on purpose: a controlled field cannot be typed
                // into ("1." collapses to "1"). The key remounts it when the
                // value changes from elsewhere.
                key: 'pause-' + wakeCfg.pauseMs,
                defaultValue: String(wakeCfg.pauseMs / 1000),
                disabled: wakeCfg.pauseMs === 0,
                onBlur: commitPause,
                onKeyDown: function (event) {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    commitPause(event);
                  }
                },
              }),
              h('span', { className: 'dstr-hint' },
                'Скажите фразу — начнётся запись. Замолчали на эту паузу — запись закончилась, текст остался в поле. Снимите галочку, если пишете с раздумьями: тогда запись идёт, пока не скажете стоп-слово или слово отправки. Вне активного окна микрофон не слушается.'),
              h('div', { className: 'dstr-sep' }),
              h('label', null,
                h('input', {
                  type: 'checkbox',
                  checked: stopCfg.enabled,
                  onChange: function (event) {
                    var next = { enabled: event.target.checked, phrase: stopCfg.phrase };
                    setStop(next);
                    saveStop(next);
                  },
                }),
                'Стоп-слово: остановить, текст в поле'),
              h('span', { className: 'dstr-field' }, 'Стоп-слово'),
              h('input', {
                type: 'text',
                value: stopCfg.phrase,
                placeholder: 'стоп чат',
                onChange: function (event) {
                  var next = { enabled: stopCfg.enabled, phrase: event.target.value };
                  setStop(next);
                  saveStop(next);
                },
              }),
              h('span', { className: 'dstr-hint' },
                'Фраза в конце реплики. Запись остановится, текст до неё останется в поле ввода — отправите сами.'),
              h('div', { className: 'dstr-sep' }),
              h('label', null,
                h('input', {
                  type: 'checkbox',
                  checked: sendCfg.enabled,
                  onChange: function (event) {
                    var next = { enabled: event.target.checked, phrase: sendCfg.phrase };
                    setSend(next);
                    saveSend(next);
                  },
                }),
                'Слово отправки: отправить в чат'),
              h('span', { className: 'dstr-field' }, 'Слово отправки'),
              h('input', {
                type: 'text',
                value: sendCfg.phrase,
                placeholder: 'отправь',
                onChange: function (event) {
                  var next = { enabled: sendCfg.enabled, phrase: event.target.value };
                  setSend(next);
                  saveSend(next);
                },
              }),
              h('span', { className: 'dstr-hint' },
                'Фраза в конце реплики. Запись остановится, текст до неё сразу уйдёт в чат. Слова не должны совпадать.'),
              h('div', { className: 'dstr-sep' }),
              h('span', { className: 'dstr-field' }, 'Звуковая схема'),
              h('div', { className: 'dstr-schemes' },
                SOUND_SCHEMES.map(function (item) {
                  return h('button', {
                    key: item.id,
                    type: 'button',
                    className: 'dstr-scheme',
                    'data-active': soundCfg.scheme === item.id ? 'true' : 'false',
                    title: item.hint,
                    onClick: function () {
                      var next = { scheme: item.id, volume: soundCfg.volume, voice: soundCfg.voice };
                      setSound(next);
                      saveSound(next);
                      // Превью: сразу слышно, что выбрал.
                      playCueFile(item.id + '-start', next.volume);
                    },
                  }, item.label);
                }),
                h('button', {
                  key: 'off',
                  type: 'button',
                  className: 'dstr-scheme',
                  'data-active': soundCfg.scheme === 'off' ? 'true' : 'false',
                  title: 'Сигналы выключены',
                  onClick: function () {
                    var next = { scheme: 'off', volume: soundCfg.volume, voice: soundCfg.voice };
                    setSound(next);
                    saveSound(next);
                  },
                }, 'Без звука')),
              h('label', { style: { marginTop: '8px' } },
                h('input', {
                  type: 'checkbox',
                  checked: soundCfg.voice,
                  onChange: function (event) {
                    var next = { scheme: soundCfg.scheme, volume: soundCfg.volume, voice: event.target.checked };
                    setSound(next);
                    saveSound(next);
                    if (next.voice && next.scheme !== 'off') playCueFile('voice-start', next.volume);
                  },
                }),
                'Голосовые подсказки'),
              h('label', { style: { marginTop: '6px' } }, 'Громкость сигналов'),
              h('input', {
                type: 'range',
                min: '0',
                max: '100',
                step: '5',
                value: String(Math.round(soundCfg.volume * 100)),
                onChange: function (event) {
                  var next = {
                    scheme: soundCfg.scheme,
                    volume: Number(event.target.value) / 100,
                    voice: soundCfg.voice,
                  };
                  setSound(next);
                  saveSound(next);
                },
                onMouseUp: function () { playCue('start'); },
                onKeyUp: function () { playCue('start'); },
              }),
              h('span', { className: 'dstr-hint' },
                'Сигналы звучат при начале записи, остановке, готовом тексте и ошибке. Каждая схема — свой характер звучания, громкость общая. Голосовые подсказки заменяют два первых сигнала фразами.'),
              h('button', {
                type: 'button',
                className: 'dstr-act',
                onClick: function () { setSettingsOpen(false); },
              }, 'Готово')) : null,
            h('div', { className: 'dstr-wave', style: { '--lvl': Math.min(1, level * 3) } }, bars),
            h('div', { className: 'dstr-strip', 'data-empty': stripEmpty ? 'true' : 'false', title: stripText },
              phase === 'finishing' ? h('span', { className: 'dstr-spin' }) : null,
              h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis' } }, stripText),
              recording && !captureTarget ? h('span', { className: 'dstr-caret' }) : null),
            h('div', { className: 'dstr-foot' },
              h('div', { className: 'dstr-seg', role: 'group', 'aria-label': 'Куда девать текст' },
                h('button', {
                  type: 'button',
                  className: 'dstr-seg-btn',
                  'data-active': mode === 'insert' ? 'true' : 'false',
                  onClick: function () { setMode('insert'); saveMode('insert'); },
                }, 'В поле'),
                h('button', {
                  type: 'button',
                  className: 'dstr-seg-btn',
                  'data-active': mode === 'send' ? 'true' : 'false',
                  onClick: function () { setMode('send'); saveMode('send'); },
                }, 'В чат')),
              h('button', {
                type: 'button',
                className: 'dstr-key',
                'data-capturing': captureTarget === 'insert' ? 'true' : 'false',
                title: 'Комбинация «вставить в поле»',
                onClick: function () {
                  setCaptureTarget(captureTarget === 'insert' ? null : 'insert');
                  setCaptureHint('');
                },
              }, captureTarget === 'insert' ? 'Нажмите…' : '→ ' + hotkeyLabel(hotkeys.insert)),
              h('button', {
                type: 'button',
                className: 'dstr-key',
                'data-capturing': captureTarget === 'send' ? 'true' : 'false',
                title: 'Комбинация «отправить в чат»',
                onClick: function () {
                  setCaptureTarget(captureTarget === 'send' ? null : 'send');
                  setCaptureHint('');
                },
              }, captureTarget === 'send' ? 'Нажмите…' : '⏎ ' + hotkeyLabel(hotkeys.send)),
              h('span', { className: 'dstr-hint' }, hint),
              actions)),
          document.body);
      }

      return h(React.Fragment, null,
        h('button', {
          type: 'button',
          ref: buttonRef,
          className: 'dstr-btn' + (recording ? ' is-rec' : ''),
          title: recording
            ? 'Остановить запись (' + hotkeyLabel(hotkeys[mode]) + ')'
            : (mode === 'send' ? 'Голосовой ввод и отправка (' : 'Голосовой ввод (') + hotkeyLabel(hotkeys[mode]) + ')',
          'aria-label': recording ? 'Остановить запись' : 'Голосовой ввод',
          'aria-pressed': recording,
          disabled: busy,
          onMouseDown: function (event) { event.preventDefault(); },
          onClick: function () {
            if (recording) stop(mode);
            else if (phase === 'idle' || phase === 'error') start(mode);
          },
        }, MicIcon(recording)),
        h('button', {
          type: 'button',
          className: 'dstr-btn dstr-ear' + (wakeCfg.enabled ? ' is-live' : ''),
          title: wakeCfg.enabled
            ? 'Слушаю «' + wakeCfg.phrase + '» — выключить'
            : 'Слушать ключевую фразу «' + wakeCfg.phrase + '»',
          'aria-label': 'Слушать ключевую фразу',
          'aria-pressed': wakeCfg.enabled,
          onMouseDown: function (event) { event.preventDefault(); },
          onClick: toggleWake,
        }, EarIcon()),
        h(RewriteButton, {
          key: 'grammar',
          mode: 'grammar',
          useInput: props.useInput,
          inputActions: inputActions,
          notify: showToast,
          icon: GrammarIcon,
          title: 'Проверить орфографию и пунктуацию. Текст уходит в модель DSH',
          emptyTitle: 'Исправить ошибки: сначала надиктуйте или напишите текст',
        }),
        h(RewriteButton, {
          key: 'prompt',
          mode: 'prompt',
          useInput: props.useInput,
          inputActions: inputActions,
          notify: showToast,
          icon: PromptIcon,
          title: 'Улучшить промпт: переписать сказанное точно и без воды. Текст уходит в модель DSH',
          emptyTitle: 'Улучшить промпт: сначала надиктуйте или напишите его',
        }),
        toast ? ReactDOM.createPortal(
          h('div', { className: 'dstr-toast', 'data-tone': toast.tone, role: 'status' }, toast.text),
          document.body) : null,
        panel);
    }

    return {
      inject: ['slots'],
      apply: function apply(ctx) {
        ensureStyle();
        ctx.slots.inject('conversation.input.activity', function () {
          return ctx.slots.register({ name: 'conversation.input.activity' }, MicButton);
        });
      },
    };
  },
});
