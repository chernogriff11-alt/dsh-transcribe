# dsh-transcribe

Голосовой ввод для [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): микрофон рядом с кнопкой
отправки, аккуратная панель записи с живым предпросмотром, локальное распознавание Parakeet Ultra.
Без облака, без API-ключей, без телеметрии.

![панель записи](docs/panel.svg)

## Что умеет

- **Кнопка микрофона** в панели композера, сразу слева от отправки.
- **Клик** — запись пошла: кнопка краснеет, над композером выезжает панель с уровнем сигнала и таймером.
- **Живой предпросмотр** — распознанный текст появляется в полоске панели каждые ~1,5 с.
- **Повторный клик** (или ваша горячая клавиша) — запись останавливается, финальный текст вставляется
  в поле ввода в позицию каретки.
- **Своя горячая клавиша** — клик по чипу с комбинацией в панели, затем нажмите любую комбинацию
  (Ctrl/Alt/Shift + клавиша, или F1–F12). Сохраняется в браузере.
- **Esc** — отмена, ничего не вставляется.
- Если поле ввода недоступно, текст не теряется: панель предложит вставить его вручную.

## Требования

- Windows 10/11 x64.
- DeepSeek Harness 0.2.x (desktop или web).
- `transcribe-cli.exe` — 3,4 МБ, лежит в [релизах](https://github.com/chernogriff11-alt/dsh-transcribe/releases).
- Модель `parakeet-ultra-Q8_0.gguf` — 740 МБ, [Hugging Face](https://huggingface.co/handy-computer/parakeet-ultra-gguf).

## Установка на новом компьютере

### Вариант 1: одной командой

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

Скрипт скачает движок и модель в правильные папки. Дальше — установить плагин и перезапустить DSH (шаг 3–4 ниже).

### Вариант 2: вручную

1. **Движок.** Скачайте `transcribe-cli.exe` из последнего релиза и положите сюда:

   ```
   %USERPROFILE%\.dsh\bin\transcribe-cli.exe
   ```

2. **Модель.** Скачайте `parakeet-ultra-Q8_0.gguf` (или `Q4_K_M` — меньше и быстрее) и положите сюда:

   ```
   %USERPROFILE%\.dsh\models\parakeet-ultra\parakeet-ultra-Q8_0.gguf
   ```

   Прямая ссылка:
   `https://huggingface.co/handy-computer/parakeet-ultra-gguf/resolve/main/parakeet-ultra-Q8_0.gguf`

3. **Плагин.** Склонируйте репозиторий и установите его в профиль:

   ```powershell
   git clone https://github.com/chernogriff11-alt/dsh-transcribe.git
   dsh plugin --profile desktop add "C:\path\to\dsh-transcribe"
   ```

   Или в интерфейсе: **Настройки → Плагины → Добавить плагин** и укажите путь к папке.

4. **Перезапуск.** Полностью закройте DeepSeek Harness (включая иконку в трее) и откройте снова.
   Обновите страницу (F5).

5. **Проверка.** Откройте `http://127.0.0.1:<порт>/dsh-transcribe/status` — должно быть `"ready": true`.

## Где взять модель

| Что | Где | Размер |
|---|---|---|
| `parakeet-ultra-Q8_0.gguf` | [handy-computer/parakeet-ultra-gguf](https://huggingface.co/handy-computer/parakeet-ultra-gguf) | 740 МБ |
| `parakeet-ultra-Q4_K_M.gguf` | там же | 486 МБ |
| `parakeet-ultra-F16.gguf` | там же | 1,26 ГБ |

Модель — [moondream/parakeet-ultra](https://huggingface.co/moondream/parakeet-ultra), post-trained
`parakeet-tdt-0.6b-v3`: 25 европейских языков, пунктуация, заглавные, таймкоды, встроенный VAD.
Лицензия **CC-BY-4.0** — при распространении указывайте автора.

## Где плагин ищет файлы

Движок, по порядку:

1. `cliPath` в настройках плагина;
2. `%USERPROFILE%\.dsh\bin\transcribe-cli.exe`;
3. `<папка плагина>\bin\transcribe-cli.exe`;
4. `transcribe-cli.exe` в `PATH`.

Модель, по порядку:

1. `modelPath` в настройках;
2. `%USERPROFILE%\.dsh\models\parakeet-ultra\*.gguf` (предпочитает Q8_0, затем Q6_K, Q5_K, Q4_K);
3. `<папка плагина>\models\*.gguf`;
4. кэш Hugging Face (`~/.cache/huggingface/hub/models--handy-computer--parakeet-ultra-gguf`);
5. `G:\llm-models\asr\parakeet-ultra\*.gguf` (для этой машины).

## Настройка

`cordis.patch.yml` в папке плагина:

```yaml
- insert:
    - id: dsh-transcribe
      name: '@local/dsh-transcribe'
      config:
        language: 'ru'        # ru | en | auto
        timeoutMs: 180000     # таймаут одного распознавания
        # cliPath: 'D:\tools\transcribe-cli.exe'
        # modelPath: 'D:\models\parakeet-ultra-Q8_0.gguf'
```

После правки конфига перезапустите DSH.

## Как это работает

```
браузер: микрофон → AudioWorklet → PCM16 16 кГц
   │
   ├─ каждые 1,5 с: последние 10 с → POST /dsh-transcribe/partial → текст в полоску
   └─ стоп: весь буфер → POST /dsh-transcribe/transcribe → финальный текст → в поле ввода
                                   │
                          WAV → transcribe-cli.exe → текст
```

Модель не стриминговая, поэтому предпросмотр — это повторное распознавание хвоста записи.
Финальный текст всегда считается по всему буферу и точнее предпросмотра.

## Ограничения

- Только Windows: движок поставляется как `.exe`.
- Диаризации (кто говорил) нет.
- Предпросмотр может «дёргаться» на границах фраз — это нормально.
- При первом запуске Windows спросит доступ к микрофону.
- Микрофон работает только на `localhost` или по HTTPS (требование браузера).

## Лицензия

Код плагина — MIT. Движок [transcribe.cpp](https://github.com/handy-computer/transcribe.cpp) — MIT.
Модель — CC-BY-4.0, автор [moondream](https://huggingface.co/moondream/parakeet-ultra).
