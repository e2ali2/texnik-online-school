const dialog = document.querySelector('#diagnostic-modal');
const form = document.querySelector('#diagnostic-form');
const status = document.querySelector('#diagnostic-status');
const recipient = 'info.okt@bk.ru';
let opener;
const message = () => {
  const data = new FormData(form);
  return `Здравствуйте! Хочу записаться на знакомство с курсом в Тех_НикА.\n\nИмя: ${data.get('name').trim()}\nФамилия: ${data.get('surname').trim()}\nТелефон: ${data.get('phone').trim()}\nПочта: ${data.get('email').trim()}\nГород: ${data.get('city').trim()}\nЭкзамен: ${data.get('exam')}\nПредмет: ${data.get('subject')}\nКомментарий: ${data.get('comment').trim() || '—'}`;
};
document.querySelectorAll('[data-diagnostic]').forEach(button => {
  button.addEventListener('click', () => {
    opener = button;
    status.textContent = '';
    document.querySelector('.mail-fallback').hidden = true;
    document.querySelector('#copy-diagnostic').hidden = false;
    document.querySelector('#diagnostic-copy').hidden = true;
    dialog.showModal();
    document.body.classList.add('modal-open');
  });
});
document.querySelector('#close-diagnostic').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  opener?.focus();
});
let submitting = false;
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting || !form.reportValidity()) return;
  const submit = form.querySelector('button[type="submit"]');
  submitting = true;
  submit.disabled = true;
  submit.textContent = 'Отправляем заявку…';
  form.setAttribute('aria-busy', 'true');
  status.textContent = '';
  try {
    const response = await fetch(['localhost','127.0.0.1'].includes(location.hostname) ? '/api/diagnostic' : 'https://api.tehnika-courses.ru/', {method: 'POST', headers: {'Content-Type': 'text/plain;charset=UTF-8'}, body: JSON.stringify(Object.fromEntries(new FormData(form))), signal: AbortSignal.timeout(30000)});
    const result = await response.json().catch(() => ({error:'Сервер вернул неожиданный ответ. Попробуйте позже или свяжитесь с нами по почте.'}));
    if (!response.ok || result.ok !== true) throw new Error(result.error || 'Не удалось отправить заявку.');
    status.textContent = 'Заявка отправлена! Мы свяжемся с вами для записи на знакомство с курсом.';
    document.querySelector('.mail-fallback').hidden = true;
    form.reset();
    subjectInput.value = '';
    document.querySelector('#subject-value').textContent = 'Выберите предмет';
    options.forEach(option => option.setAttribute('aria-selected', 'false'));
    subjectError.hidden = true;
    subjectTrigger.removeAttribute('aria-invalid');
    document.querySelector('#diagnostic-copy').hidden = true;
  } catch (error) {
    const contactFallback = document.querySelector('.mail-fallback');
    contactFallback.hidden = false;
    document.querySelector('#email-diagnostic').href = 'mailto:' + recipient + '?subject=' + encodeURIComponent('Знакомство с курсом · Тех_НикА') + '&body=' + encodeURIComponent(message());
    status.textContent = error.name === 'TimeoutError' || error.name === 'AbortError' ? 'Не удалось подтвердить доставку. Проверьте соединение и попробуйте позже.' : error instanceof TypeError ? 'Заявка не отправлена: браузер не смог связаться с сервером. Данные остались в форме. Попробуйте другую сеть или скопируйте заявку и отправьте её на info.okt@bk.ru.' : error.message;
  } finally {
    submitting = false;
    submit.disabled = false;
    submit.textContent = 'Записаться на знакомство с курсом';
    form.removeAttribute('aria-busy');
  }
});
document.querySelector('#copy-diagnostic').addEventListener('click', async () => {
  if (!form.reportValidity()) return;
  try {
    await navigator.clipboard.writeText(message());
    status.textContent = 'Заявка скопирована. Отправьте её на ' + recipient + '.';
  } catch {
    const fallback = document.querySelector('#diagnostic-copy');
    fallback.hidden = false;
    fallback.value = message();
    fallback.focus();
    fallback.select();
    status.textContent = 'Выделите и скопируйте текст заявки, затем отправьте его на ' + recipient + '.';
  }
});
const subjectTrigger = document.querySelector('#subject-trigger');
const subjectOptions = document.querySelector('#subject-options');
const subjectInput = document.querySelector('#diagnostic-subject');
const subjectError = document.querySelector('#subject-error');
const options = [...subjectOptions.querySelectorAll('[role=option]')];
const setSubjectOpen = (open, focus = false) => {
  subjectOptions.hidden = !open;
  subjectTrigger.setAttribute('aria-expanded', String(open));
  if (open && focus) (options.find(option => option.getAttribute('aria-selected') === 'true') || options[0]).focus();
};
subjectTrigger.addEventListener('click', () => setSubjectOpen(subjectOptions.hidden, true));
subjectTrigger.addEventListener('keydown', event => {
  if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault(); setSubjectOpen(true);
    (event.key === 'ArrowUp' || event.key === 'End' ? options.at(-1) : options[0]).focus();
  }
});
options.forEach((option, index) => {
  option.addEventListener('click', () => {
    subjectInput.value = option.textContent.trim();
    document.querySelector('#subject-value').textContent = subjectInput.value;
    options.forEach(item => item.setAttribute('aria-selected', String(item === option)));
    subjectError.hidden = true;
    subjectTrigger.removeAttribute('aria-invalid');
    setSubjectOpen(false); subjectTrigger.focus();
  });
  option.addEventListener('keydown', event => {
    let target;
    if (event.key === 'ArrowDown') target = options[(index + 1) % options.length];
    if (event.key === 'ArrowUp') target = options[(index - 1 + options.length) % options.length];
    if (event.key === 'Home') target = options[0];
    if (event.key === 'End') target = options.at(-1);
    if (target) { event.preventDefault(); target.focus(); }
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setSubjectOpen(false); subjectTrigger.focus(); }
    if (event.key === 'Tab') setSubjectOpen(false);
    if (event.key.length === 1 && /[а-я]/i.test(event.key)) options.find(item => item.textContent.toLowerCase().startsWith(event.key.toLowerCase()))?.focus();
  });
});
document.addEventListener('click', event => { if (!event.target.closest('.subject-picker')) setSubjectOpen(false); });
dialog.addEventListener('close', () => setSubjectOpen(false));
const validateSubject = event => {
  if (subjectInput.value) return;
  event.preventDefault(); event.stopImmediatePropagation();
  subjectError.hidden = false; subjectTrigger.setAttribute('aria-invalid', 'true'); subjectTrigger.focus();
};
form.addEventListener('submit', validateSubject, true);
document.querySelector('#copy-diagnostic').addEventListener('click', validateSubject, true);

const phoneInput = document.querySelector('#diagnostic-phone');
const validatePhone = () => {
  const value = phoneInput.value.trim();
  const digits = value.replace(/\D/g, '');
  const valid = /^\+?[\d\s().-]+$/.test(value) && digits.length >= 10 && digits.length <= 15;
  phoneInput.setCustomValidity(value && !valid ? 'Введите корректный телефон: от 10 до 15 цифр, можно использовать +, пробелы, скобки и дефисы.' : '');
};
phoneInput.addEventListener('input', validatePhone);
form.addEventListener('submit', validatePhone, true);
document.querySelector('#copy-diagnostic').addEventListener('click', validatePhone, true);




