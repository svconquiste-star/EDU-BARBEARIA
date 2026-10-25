(function () {
  var WHATSAPP = '5531995730429';
  var form = document.getElementById('lead-form');
  var tel = form.telefone;
  var botao = form.querySelector('.cta');
  var label = form.querySelector('.cta-label');

  document.getElementById('ano').textContent = new Date().getFullYear();

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

        var texto = 'Olá! Quero Falar Com Atendimento.';
        var url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto);
        window.__waUrl = url;
        // Pequena espera para o pixel enviar o evento antes de sair da página
        setTimeout(function () { window.location.href = url; }, 300);
      });
  });
})();
