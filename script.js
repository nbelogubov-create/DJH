// ========== КОНФИГУРАЦИЯ ==========
const TG_TOKEN = '7561201035:AAFa5EDnWFWDfo5KblSzuPnETk26L0QY-Zo';
const TG_CHAT = '1134623108';
const SITE_KEY = '6Le2RNUsAAAAAIKprVdKSLypZnfgId3qwvJkinui';

// ========== ГОД В ФУТЕРЕ ==========
document.getElementById('year').innerText = new Date().getFullYear();

// ========== QR-КОД ==========
document.getElementById('qrImg').src = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('https://t.me/carpenter54')}`;

// ========== СТАТИСТИКА (локалсторедж) ==========
let views = localStorage.getItem('c54_views') || 0;
views = parseInt(views) + 1;
localStorage.setItem('c54_views', views);

const todayKey = 'c54_vis_' + new Date().toDateString();
if (!localStorage.getItem(todayKey)) {
  localStorage.setItem(todayKey, '1');
  const visits = JSON.parse(localStorage.getItem('c54_visits') || '[]');
  visits.unshift({
    time: new Date().toLocaleString('ru-RU'),
    device: /Mobile/i.test(navigator.userAgent) ? '📱 Мобильный' : '💻 Компьютер'
  });
  localStorage.setItem('c54_visits', JSON.stringify(visits.slice(0, 200)));
  
  // Отправляем уведомление в Telegram (фоново, не ждём ответа)
  fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TG_CHAT, text: `🟢 Новый визит!\n🕒 ${new Date().toLocaleString('ru-RU')}` })
  }).catch(e => console.log);
}

// ========== ТОСТ-УВЕДОМЛЕНИЯ ==========
function toast(message) {
  const box = document.getElementById('toastBox');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span>${message}</span><span onclick="this.parentElement.remove()" style="cursor:pointer; margin-left:12px">✕</span>`;
  box.appendChild(el);
  setTimeout(() => {
    if (el && el.parentElement) el.remove();
  }, 3000);
}

// ========== КОПИРОВАТЬ ТЕКСТ ==========
function copyText(text, successMessage) {
  navigator.clipboard.writeText(text);
  toast(successMessage || 'Скопировано ✓');
}

// ========== ПОДЕЛИТЬСЯ СТРАНИЦЕЙ ==========
function sharePage() {
  if (navigator.share) {
    navigator.share({
      title: 'CARPENTER54',
      text: 'Строительство домов премиум-класса',
      url: window.location.href
    }).catch(() => {});
  } else {
    copyText(window.location.href, '🔗 Ссылка скопирована');
  }
}

// ========== СОХРАНИТЬ VCARD ==========
function saveVCard() {
  const vcard = `BEGIN:VCARD
VERSION:3.0
FN:CARPENTER54
TEL:+79059522129
EMAIL:nbelogubov@yandex.ru
URL:https://t.me/carpenter54
END:VCARD`;
  const blob = new Blob([vcard], { type: 'text/vcard' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'carpenter54.vcf';
  link.click();
  URL.revokeObjectURL(link.href);
  toast('💾 Контакт сохранён');
}

// ========== ОТПРАВКА ФОРМЫ ==========
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Отправка...';

    const name = document.getElementById('formName').value.trim();
    const contact = document.getElementById('formContact').value.trim();
    const msg = document.getElementById('formMsg').value.trim();

    if (!name || !contact) {
      toast('❌ Заполните имя и контакт');
      btn.disabled = false;
      btn.innerHTML = originalText;
      return;
    }

    try {
      // Получаем токен капчи
      const token = await grecaptcha.execute(SITE_KEY, { action: 'contact' });
      document.getElementById('recaptchaToken').value = token;

      // Сохраняем в localStorage для админки
      const messages = JSON.parse(localStorage.getItem('c54_messages') || '[]');
      messages.unshift({
        time: new Date().toLocaleString('ru-RU'),
        name,
        contact,
        msg: msg || '-'
      });
      localStorage.setItem('c54_messages', JSON.stringify(messages.slice(0, 200)));

      // Отправляем в Telegram (не ждём ответа для скорости)
      const tgMsg = `🏠 НОВАЯ ЗАЯВКА НА ДОМ\n\n👤 Имя: ${name}\n📱 Контакт: ${contact}\n💬 Сообщение: ${msg || '-'}\n🕒 ${new Date().toLocaleString('ru-RU')}`;
      
      await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TG_CHAT, text: tgMsg })
      });

      toast('✅ Заявка отправлена! Свяжусь с вами');
      form.reset();
    } catch (error) {
      console.error('Form error:', error);
      toast('❌ Ошибка, попробуйте позже');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });
}