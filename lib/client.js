window.__ModuleLoader__.load({
  id: '@local/dsh-transcribe',
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
      '    if (outLen < 1) return true;',
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
      return navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      }).then(function (stream) {
        self.stream = stream;
        var Ctx = window.AudioContext || window.webkitAudioContext;
        try { self.ctx = new Ctx({ sampleRate: 16000, latencyHint: 'interactive' }); }
        catch (err) { self.ctx = new Ctx({ latencyHint: 'interactive' }); }
        var url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }));
        return self.ctx.audioWorklet.addModule(url).then(function () {
          URL.revokeObjectURL(url);
          if (self.closed) return;
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

    function MicButton(props) {
      var inputActions = props.inputActions;
      var onActiveChange = props.onActiveChange;

      var phaseState = React.useState('idle');
      var phase = phaseState[0], setPhase = phaseState[1];
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

      var boxState = React.useState(null);
      var box = boxState[0], setBox = boxState[1];
      var buttonRef = React.useRef(null);
      var barsRef = React.useRef([]);
      var recRef = React.useRef(null);
      var chunksRef = React.useRef([]);
      var bytesRef = React.useRef(0);
      var spanRef = React.useRef(null);
      var startedRef = React.useRef(0);
      var phaseRef = React.useRef('idle');
      var hotkeysRef = React.useRef(hotkeys);
      var captureTargetRef = React.useRef(null);
      var modeRef = React.useRef(mode);
      var actionRef = React.useRef('insert');
      var partialBusyRef = React.useRef(false);
      var actionsRef = React.useRef({});
      phaseRef.current = phase;
      hotkeysRef.current = hotkeys;
      captureTargetRef.current = captureTarget;
      modeRef.current = mode;

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
        if (!ok) {
          try {
            if (inputActions && inputActions.setDraft) { inputActions.setDraft(text); ok = true; }
          } catch (err) { ok = false; }
        }
        return ok;
      }

      function reset() {
        var rec = recRef.current;
        recRef.current = null;
        if (rec) { try { rec.stop(); } catch (err) {} }
        chunksRef.current = [];
        bytesRef.current = 0;
        partialBusyRef.current = false;
        setPhase('idle');
        setSeconds(0);
        setLevel(0);
        setPreview('');
        setMessage('');
        setPending('');
      }

      function start(action) {
        if (phaseRef.current === 'recording' || phaseRef.current === 'starting' || phaseRef.current === 'finishing') return;
        actionRef.current = action === 'send' ? 'send' : 'insert';
        setMode(actionRef.current);
        saveMode(actionRef.current);
        setMessage('');
        setPending('');
        setPreview('');
        setSeconds(0);
        setLevel(0);
        chunksRef.current = [];
        bytesRef.current = 0;
        spanRef.current = inputActions && inputActions.captureInsertion ? inputActions.captureInsertion() : null;
        setPhase('starting');
        var rec = new Recorder(function (pcm, rms) {
          chunksRef.current.push(pcm);
          bytesRef.current += pcm.byteLength;
          setLevel(rms);
        }, function (err) {
          setMessage(friendlyError(err));
          setPhase('error');
        });
        recRef.current = rec;
        rec.start().then(function () {
          if (recRef.current !== rec) return;
          startedRef.current = Date.now();
          setPhase('recording');
        }).catch(function () { /* onError already reported */ });
      }

      function stop(action) {
        var rec = recRef.current;
        if (!rec || phaseRef.current !== 'recording') return;
        var act = action === 'send' || action === 'insert' ? action : actionRef.current;
        setPhase('finishing');
        recRef.current = null;
        rec.stop();
        var merged = concatChunks(chunksRef.current, 0);
        chunksRef.current = [];
        bytesRef.current = 0;
        partialBusyRef.current = false;
        if (!merged.length) {
          setMessage('Ничего не записалось — проверьте микрофон.');
          setPhase('error');
          return;
        }
        fetch('/dsh-transcribe/transcribe?sr=16000&lang=ru', {
          method: 'POST',
          headers: { 'content-type': 'application/octet-stream' },
          body: merged,
        }).then(function (response) {
          return response.json();
        }).then(function (json) {
          if (!json || !json.ok) throw new Error((json && json.error) || 'transcribe failed');
          var text = String(json.text || '').trim();
          if (!text) {
            setMessage('Речь не распознана.');
            setPhase('error');
            return;
          }
          if (insertText(text)) {
            if (act === 'send') {
              setTimeout(function () {
                try { if (inputActions && inputActions.submit) inputActions.submit(); } catch (err) { /* ignore */ }
              }, 40);
            }
            setPhase('idle');
            setSeconds(0);
            setLevel(0);
            setPreview('');
            setMessage('');
          } else {
            setPending(text);
            setPhase('pending');
          }
        }).catch(function (err) {
          setMessage('Ошибка распознавания: ' + String((err && err.message) || err));
          setPhase('error');
        });
      }

      function cancel() {
        reset();
      }

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
          if (event.key === 'Escape' && (phaseRef.current === 'recording' || phaseRef.current === 'starting')) {
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
          var rec = recRef.current;
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
          var tail = concatChunks(chunksRef.current, 16000 * 2 * 8);
          if (!tail.length) return;
          partialBusyRef.current = true;
          fetch('/dsh-transcribe/partial?sr=16000&lang=ru', {
            method: 'POST',
            headers: { 'content-type': 'application/octet-stream' },
            body: tail,
          }).then(function (response) {
            return response.json();
          }).then(function (json) {
            if (json && json.ok) setPreview(String(json.text || '').trim());
          }).catch(function () { /* preview is best-effort */ }).then(function () {
            partialBusyRef.current = false;
          });
        }, 1600);
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
          var rec = recRef.current;
          recRef.current = null;
          if (rec) { try { rec.stop(); } catch (err) {} }
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
            onClick: function () { if (insertText(pending)) { setPending(''); setPhase('idle'); } },
          }, 'Вставить'));
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
              h('span', { className: 'dstr-time' }, formatTime(seconds))),
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
