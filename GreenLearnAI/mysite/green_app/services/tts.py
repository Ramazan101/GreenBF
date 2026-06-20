# coding: utf-8
import base64
import hashlib
import io
import logging
import wave
from pathlib import Path

import requests
from django.conf import settings

logger = logging.getLogger('green_app')

GEMINI_TTS_MODEL = 'gemini-3.1-flash-tts-preview'
GEMINI_TTS_FALLBACK_MODELS = (
    'gemini-2.5-flash-preview-tts',
    'gemini-2.5-pro-preview-tts',
)
GEMINI_TTS_DEFAULT_VOICE = 'Sulafat'


def _pcm_to_wav(pcm: bytes, channels: int = 1, rate: int = 24000, sample_width: int = 2) -> bytes:
    buffer = io.BytesIO()
    with wave.open(buffer, 'wb') as wav_file:
        wav_file.setnchannels(channels)
        wav_file.setsampwidth(sample_width)
        wav_file.setframerate(rate)
        wav_file.writeframes(pcm)
    return buffer.getvalue()


def _tts_cache_path(model: str, text: str) -> Path:
    cache_key = hashlib.sha256(f'{model}:{GEMINI_TTS_DEFAULT_VOICE}:{text}'.encode('utf-8')).hexdigest()
    cache_dir = Path(settings.MEDIA_ROOT) / 'tts' / 'gemini-sulafat'
    cache_dir.mkdir(parents=True, exist_ok=True)
    return cache_dir / f'{cache_key}.wav'


def synthesize_psychologist_speech(text: str, voice_name: str | None = None) -> tuple[bytes, str]:
    api_key = getattr(settings, 'GEMINI_API_KEY', None)
    if not api_key:
        raise RuntimeError('GEMINI_API_KEY is not configured')

    cleaned_text = ' '.join((text or '').split())
    if not cleaned_text:
        raise ValueError('Text is empty')
    cleaned_text = cleaned_text[:2500]

    selected_voice = GEMINI_TTS_DEFAULT_VOICE
    configured_model = getattr(settings, 'GEMINI_TTS_MODEL', GEMINI_TTS_MODEL)
    models = (configured_model, *GEMINI_TTS_FALLBACK_MODELS)

    prompt = (
        'Say in a warm, gentle, calm psychologist voice. '
        'Speak slowly and naturally. Do not read these instructions aloud:\n'
        f'"{cleaned_text}"'
    )

    payload = {
        'contents': [{
            'parts': [{'text': prompt}],
        }],
        'generationConfig': {
            'responseModalities': ['AUDIO'],
            'speechConfig': {
                'voiceConfig': {
                    'prebuiltVoiceConfig': {
                        'voiceName': selected_voice,
                    },
                },
            },
        },
    }

    last_error = None
    for model in dict.fromkeys(models):
        cache_path = _tts_cache_path(model, cleaned_text)
        if cache_path.exists():
            return cache_path.read_bytes(), selected_voice

        url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'
        try:
            response = requests.post(
                url,
                headers={
                    'Content-Type': 'application/json',
                    'x-goog-api-key': api_key,
                },
                json=payload,
                timeout=35,
            )
            if not response.ok:
                last_error = RuntimeError(f'{model}: HTTP {response.status_code} {response.text[:400]}')
                logger.warning('Gemini TTS model failed: %s', last_error)
                continue

            data = response.json()
            inline_data = data['candidates'][0]['content']['parts'][0].get('inlineData')
            if not inline_data:
                inline_data = data['candidates'][0]['content']['parts'][0].get('inline_data')
            pcm = base64.b64decode(inline_data['data'])
            wav_audio = _pcm_to_wav(pcm)
            cache_path.write_bytes(wav_audio)
            return wav_audio, selected_voice
        except (KeyError, IndexError, TypeError) as exc:
            last_error = exc
            logger.warning('Gemini TTS response without audio from %s', model, exc_info=True)
        except requests.RequestException as exc:
            last_error = exc
            logger.warning('Gemini TTS request failed for %s: %s', model, exc)

    raise RuntimeError(f'Gemini TTS unavailable: {last_error}')
