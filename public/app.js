(function () {
  var WHATSAPP = '5531995730429';
  var form = document.getElementById('lead-form');
  var tel = form.telefone;
  var botao = form.querySelector('.cta');
  var label = form.querySelector('.cta-label');

  document.getElementById('ano').textContent = new Date().getFullYear();

  // Botões "assinar": rolam até o formulário com a assinatura marcada
  var assinatura = form.querySelector('input[value="FAZER ASSINATURA AGORA"]');
  document.querySelectorAll('.js-assinar').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      assinatura.checked = true;
      if (window.fbq) fbq('trackCustom', 'CliqueAssinatura', { local: btn.id === 'sticky-cta' ? 'barra_fixa' : 'hero' });
      document.getElementById('formulario').scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(function () { form.nome.focus({ preventScroll: true }); }, 500);
    });
  });

  // Barra fixa: aparece depois do topo e some quando o formulário está na tela
  var sticky = document.getElementById('sticky-cta');
  var heroCta = document.querySelector('.hero .cta');
  var cardForm = document.getElementById('formulario');
  function atualizarBarra() {
    var alturaTela = window.innerHeight;
    var heroPassou = heroCta.getBoundingClientRect().bottom < 0;
    var f = cardForm.getBoundingClientRect();
    var formNaTela = f.top < alturaTela * 0.6 && f.bottom > alturaTela * 0.4;
    var mostrar = heroPassou && !formNaTela;
    sticky.classList.toggle('show', mostrar);
    sticky.setAttribute('aria-hidden', String(!mostrar));
    sticky.tabIndex = mostrar ? 0 : -1;
  }
  window.addEventListener('scroll', atualizarBarra, { passive: true });
  window.addEventListener('resize', atualizarBarra);
  atualizarBarra();

  // Galeria do ambiente: indicadores e ampliação da foto
  var track = document.getElementById('gallery-track');
  var dotsBox = document.getElementById('gallery-dots');
  var shots = track.querySelectorAll('.shot');
  var lightbox = document.getElementById('lightbox');
  var dots = [];
  shots.forEach(function (shot, i) {
    var dot = document.createElement('span');
    if (i === 0) dot.className = 'on';
    dotsBox.appendChild(dot);
    dots.push(dot);
    shot.addEventListener('click', function () {
      lightbox.querySelector('img').src = shot.dataset.src;
      lightbox.querySelector('img').alt = shot.querySelector('img').alt;
      lightbox.showModal();
    });
  });
  track.addEventListener('scroll', function () {
    var largura = shots[0].offsetWidth + 12;
    var atual = Math.round(track.scrollLeft / largura);
    dots.forEach(function (d, i) { d.classList.toggle('on', i === atual); });
  }, { passive: true });
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox || e.target.classList.contains('lightbox-close')) lightbox.close();
  });

  // Máscara (31) 99999-9999
  tel.addEventListener('input', function () {
    var d = tel.value.replace(/\D/g, '').slice(0, 11);
    var out = d;
    if (d.length > 2) out = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length > 6) out = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(d.length - 4);
    tel.value = out;
  });

  function erro(campo, msg) {
    var el = form.querySelector('.error[data-for="' + campo + '"]');
    el.textContent = msg || '';
    el.parentElement.classList.toggle('invalid', !!msg);
    return !msg;
  }

  function validar(d) {
    var ok = true;
    ok = erro('nome', d.nome.length < 2 ? 'Digite seu nome.' : '') && ok;
    ok = erro('telefone', d.telefone.length < 10 ? 'Digite um WhatsApp válido com DDD.' : '') && ok;
    ok = erro('cidade', d.cidade.length < 2 ? 'Digite sua cidade.' : '') && ok;
    ok = erro('servico', !d.servico ? 'Escolha uma opção.' : '') && ok;
    return ok;
  }

  function origem() {
    var p = new URLSearchParams(location.search);
    var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid'];
    var partes = keys.filter(function (k) { return p.get(k); }).map(function (k) { return k + '=' + p.get(k); });
    return partes.join('&');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var dados = {
      nome: form.nome.value.trim(),
      telefone: tel.value.replace(/\D/g, ''),
      cidade: form.cidade.value.trim(),
      servico: (form.querySelector('input[name="servico"]:checked') || {}).value || '',
      origem: origem()
    };
    if (!validar(dados)) return;

    botao.disabled = true;
    label.textContent = 'ABRINDO WHATSAPP...';

    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 4000);

    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
      signal: controller.signal
    })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); })
      .catch(function (err) { console.error('Lead não salvo:', err); })
      .finally(function () {
        clearTimeout(timer);
        if (window.fbq) fbq('track', 'Contact', { content_name: dados.servico });

        var texto = 'Gostaria de saber mais sobre os planos de assinaturas!';
        var url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto);
        window.__waUrl = url;
        // Pequena espera para o pixel enviar o evento antes de sair da página
        setTimeout(function () { window.location.href = url; }, 300);
      });
  });
})();
